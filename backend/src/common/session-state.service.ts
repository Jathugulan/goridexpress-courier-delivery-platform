import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from './redis.module';
import { Session, User, type SessionDocument, type UserDocument } from '../database/schemas/user.schema';

/** Verdict returned by {@link SessionStateService.assertUsable}. */
export type SessionState = 'active' | 'revoked' | 'expired' | 'user_inactive' | 'password_changed' | 'not_found';

interface SessionSnapshot {
  userId: string;
  isRevoked: boolean;
  /** Epoch ms so the value survives a JSON cache round-trip. */
  expiresAt: number;
  /** Session creation time, compared against the user's `passwordChangedAt`. */
  createdAt: number;
  userActive: boolean;
  passwordChangedAt: number | null;
}

/**
 * Authoritative session liveness check for authenticated requests.
 *
 * A signature-valid JWT is not enough on its own: a session can be revoked
 * (logout, refresh rotation, reuse detection, admin block) while its access
 * token is still inside its 15-minute window, and a password change should
 * invalidate every token issued before it. This service re-checks the session
 * and its owner on every request so revocation takes effect immediately rather
 * than at token expiry.
 *
 * Lookups are served from Redis when available and fall back to MongoDB. A
 * short in-process memo sits in front of both so a burst of requests from one
 * client does not fan out into duplicate queries. `invalidate()` drops the memo
 * entry the moment a session changes state, which keeps the window honest.
 */
@Injectable()
export class SessionStateService {
  private readonly memo = new Map<string, { state: SessionState; expiresAt: number }>();
  private readonly memoTtlMs = 5_000;
  private readonly memoLimit = 5_000;

  constructor(
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly redis: RedisService,
  ) {}

  /**
   * Resolves the live state of a session.
   *
   * Returns a state instead of throwing so callers decide whether the failure
   * is an authentication (401) or authorization (403) problem.
   */
  async assertUsable(sessionId: string | undefined, userId: string): Promise<SessionState> {
    if (!sessionId) return 'revoked';

    const cached = this.memo.get(sessionId);
    if (cached && cached.expiresAt > Date.now()) return cached.state;

    const snapshot = await this.load(sessionId);
    const state = this.evaluate(snapshot, userId);
    this.remember(sessionId, state);
    return state;
  }

  private evaluate(snapshot: SessionSnapshot | null, userId: string): SessionState {
    if (!snapshot) return 'not_found';

    // Guards against a token whose subject was substituted for another user.
    if (snapshot.userId !== userId) return 'revoked';
    if (snapshot.isRevoked) return 'revoked';
    if (snapshot.expiresAt <= Date.now()) return 'expired';
    if (!snapshot.userActive) return 'user_inactive';
    // Any session opened before the most recent password change is dead.
    if (snapshot.passwordChangedAt !== null && snapshot.passwordChangedAt > snapshot.createdAt) {
      return 'password_changed';
    }
    return 'active';
  }

  private async load(sessionId: string): Promise<SessionSnapshot | null> {
    const key = this.cacheKey(sessionId);

    const fromRedis = await this.redis.get<SessionSnapshot>(key);
    if (fromRedis) return fromRedis;

    const session = await this.sessionModel
      .findOne({ sessionId })
      .select('userId isRevoked expiresAt createdAt')
      .lean()
      .exec();
    if (!session) return null;

    const user = await this.userModel
      .findById(session.userId)
      .select('isActive passwordChangedAt')
      .lean()
      .exec();
    if (!user) return null;

    const snapshot: SessionSnapshot = {
      userId: session.userId.toString(),
      isRevoked: session.isRevoked === true,
      expiresAt: toEpoch(session.expiresAt),
      createdAt: toEpoch(session.createdAt ?? session.expiresAt),
      userActive: user.isActive === true,
      passwordChangedAt: user.passwordChangedAt ? toEpoch(user.passwordChangedAt) : null,
    };

    // Short TTL: even if an explicit `invalidate()` is missed, a revoked
    // session cannot be served from cache for long.
    await this.redis.set(key, snapshot, 60);
    return snapshot;
  }

  /** Drops every cached view of a session. Call after any state change. */
  async invalidate(sessionId: string | undefined | null): Promise<void> {
    if (!sessionId) return;
    this.memo.delete(sessionId);
    await this.redis.del(this.cacheKey(sessionId));
  }

  /**
   * Drops cached state for every session of a user.
   *
   * Session ids are random, so there is no key to delete by prefix. Instead the
   * active ids are read from Mongo and each cache key is cleared, which is
   * bounded by the number of live sessions a user actually has.
   */
  async invalidateUser(userId: string): Promise<void> {
    const sessions = await this.sessionModel
      .find({ userId })
      .select('sessionId')
      .lean()
      .exec();

    for (const session of sessions) {
      this.memo.delete(session.sessionId);
      await this.redis.del(this.cacheKey(session.sessionId));
    }
  }

  private cacheKey(sessionId: string): string {
    return `session:state:${sessionId}`;
  }

  private remember(sessionId: string, state: SessionState): void {
    this.memo.set(sessionId, { state, expiresAt: Date.now() + this.memoTtlMs });

    // Bound the memo so a long-lived process cannot accumulate one entry per
    // session it has ever seen.
    if (this.memo.size > this.memoLimit) {
      const oldest = this.memo.keys().next().value;
      if (oldest) this.memo.delete(oldest);
    }
  }
}

/** `.lean()` returns flattened date proxies, so normalise before comparing. */
function toEpoch(value: Date | unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  return new Date(value as string | number).getTime();
}
