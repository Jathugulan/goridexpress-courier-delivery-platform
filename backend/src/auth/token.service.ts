import { Injectable, Logger, UnauthorizedException, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Request, Response } from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { ErrorCode } from '../common/enums';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../common/guards/jwt-auth.guard';
import { SessionStateService } from '../common/session-state.service';
import type { JwtAccessPayload, JwtRefreshPayload } from '../common/types';
import {
  PasswordResetToken,
  Session,
  User,
  type PasswordResetTokenDocument,
  type SessionDocument,
  type UserDocument,
} from '../database/schemas';

const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_TTL_MINUTES = 30;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 15;

/** Best-effort human label for the session list UI. */
function describeDevice(userAgent?: string): string {
  if (!userAgent) return 'Unknown device';
  const ua = userAgent.toLowerCase();
  const os = ua.includes('windows')
    ? 'Windows'
    : ua.includes('mac os')
      ? 'macOS'
      : ua.includes('android')
        ? 'Android'
        : ua.includes('iphone') || ua.includes('ipad')
          ? 'iOS'
          : ua.includes('linux')
            ? 'Linux'
            : 'Unknown OS';
  const browser = ua.includes('edg/')
    ? 'Edge'
    : ua.includes('chrome/')
      ? 'Chrome'
      : ua.includes('firefox/')
        ? 'Firefox'
        : ua.includes('safari/') && !ua.includes('chrome')
          ? 'Safari'
          : 'Browser';
  return `${browser} on ${os}`;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  expiresIn: string;
}

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Session.name) private readonly sessionModel: Model<SessionDocument>,
    @InjectModel(PasswordResetToken.name)
    private readonly resetTokenModel: Model<PasswordResetTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessionState: SessionStateService,
  ) {}

  onModuleInit(): void {
    this.logger.log('Token service ready.');
  }

  /* ------------------------------ Hashing -------------------------------- */

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  }

  async comparePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /* ------------------------------- Sign in -------------------------------- */

  /** Issues an access + refresh pair and opens a session row. */
  async issueTokens(
    user: UserDocument,
    meta: { ip?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const sessionId = randomBytes(24).toString('hex');

    const accessPayload: JwtAccessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sid: sessionId,
      type: 'access',
    };

    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      sessionId,
      type: 'refresh',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn') as JwtSignOptions['expiresIn'],
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn') as JwtSignOptions['expiresIn'],
      }),
    ]);

    const expiresAt = new Date(
      Date.now() + this.durationMs(this.config.get<string>('jwt.refreshExpiresIn') ?? '7d'),
    );

    await this.sessionModel.create({
      userId: new Types.ObjectId(user.id),
      sessionId,
      userAgent: meta.userAgent?.slice(0, 255) ?? '',
      ip: meta.ip ?? '',
      expiresAt,
      lastUsedAt: new Date(),
      isRevoked: false,
    });

    // Legacy single-device fields kept in sync for the profile endpoint.
    await this.userModel.updateOne(
      { _id: user.id },
      { refreshTokenHash: this.hashToken(refreshToken), refreshTokenExpiresAt: expiresAt.toISOString() },
    );

    return {
      accessToken,
      refreshToken,
      sessionId,
      expiresIn: this.config.get<string>('jwt.accessExpiresIn') ?? '15m',
    };
  }

  /**
   * Rotates a refresh token: verifies it, revokes the presented session and
   * issues a brand new pair. Reusing a revoked token is treated as theft and
   * revokes every session for that user.
   */
  async rotateRefreshToken(
    refreshToken: string,
  ): Promise<{ tokens: IssuedTokens; user: UserDocument }> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw this.unauthorized('Invalid or expired refresh token', ErrorCode.TOKEN_EXPIRED);
    }

    if (payload.type !== 'refresh') {
      throw this.unauthorized('Invalid token type', ErrorCode.UNAUTHORIZED);
    }

    const session = await this.sessionModel.findOne({ sessionId: payload.sessionId }).exec();

    if (!session) {
      throw this.unauthorized('Session not found. Please sign in again.', ErrorCode.UNAUTHORIZED);
    }

    if (session.isRevoked) {
      // Token replay after rotation — assume compromise and log the user out.
      await this.revokeAllSessions(payload.sub, 'REUSE_DETECTED');
      throw this.unauthorized(
        'This session was already refreshed. All sessions have been revoked for your security.',
        ErrorCode.UNAUTHORIZED,
      );
    }

    if (session.expiresAt.getTime() < Date.now()) {
      throw this.unauthorized('Session expired. Please sign in again.', ErrorCode.TOKEN_EXPIRED);
    }

    const user = await this.userModel.findById(payload.sub).exec();
    if (!user || !user.isActive) {
      throw this.unauthorized('Account is unavailable', ErrorCode.UNAUTHORIZED);
    }

    // A password change invalidates every pre-existing session.
    if (user.passwordChangedAt && session.lastUsedAt < user.passwordChangedAt) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      session.revokeReason = 'PASSWORD_CHANGED';
      await session.save();
      await this.sessionState.invalidate(session.sessionId);
      throw this.unauthorized('Password was changed. Please sign in again.', ErrorCode.UNAUTHORIZED);
    }

    session.isRevoked = true;
    session.revokedAt = new Date();
    session.revokeReason = 'ROTATED';
    await session.save();
    // The old access token dies now, not when it expires: the guard re-checks
    // the session on every request and this drops its cached verdict.
    await this.sessionState.invalidate(session.sessionId);

    const tokens = await this.issueTokens(user, { ip: session.ip, userAgent: session.userAgent });
    return { tokens, user };
  }

  /* ------------------------------- Sessions ------------------------------ */

  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.sessionModel
      .find({ userId, isRevoked: false, expiresAt: { $gt: new Date() } })
      .sort({ lastUsedAt: -1 })
      .limit(50)
      .lean()
      .exec();

    return sessions.map((session) => ({
      id: session.sessionId,
      userId: session.userId.toString(),
      userAgent: session.userAgent,
      ipAddress: session.ip,
      device: describeDevice(session.userAgent),
      createdAt: (session as { createdAt?: Date }).createdAt ?? session.lastUsedAt,
      lastUsedAt: session.lastUsedAt,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionId === currentSessionId,
    }));
  }

  async revokeSession(userId: string, sessionId: string, reason = 'USER_REVOKED'): Promise<boolean> {
    const result = await this.sessionModel.updateOne(
      { userId, sessionId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokeReason: reason },
    );

    if (result.modifiedCount > 0) {
      await this.sessionState.invalidate(sessionId);
    }
    return result.modifiedCount > 0;
  }

  async revokeAllSessions(
    userId: string,
    reason = 'REVOKE_ALL',
    keepCurrentSessionId?: string,
  ): Promise<number> {
    const filter: Record<string, unknown> = { userId, isRevoked: false };
    if (keepCurrentSessionId) filter.sessionId = { $ne: keepCurrentSessionId };

    const result = await this.sessionModel.updateMany(filter, {
      isRevoked: true,
      revokedAt: new Date(),
      revokeReason: reason,
    });

    if ((result.modifiedCount ?? 0) > 0) {
      await this.sessionState.invalidateUser(userId);
    }
    return result.modifiedCount ?? 0;
  }

  /* --------------------------- Login throttling -------------------------- */

  /** Records a failed attempt and locks the account after the threshold. */
  async registerFailedLogin(user: UserDocument): Promise<{ lockedUntil?: Date }> {
    user.failedLoginAttempts = (user.failedLoginAttempts ?? 0) + 1;

    if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60_000);
      user.lockedUntil = lockedUntil;
      user.failedLoginAttempts = 0;
      await user.save();
      return { lockedUntil };
    }

    await user.save();
    return {};
  }

  async clearFailedLogins(user: UserDocument): Promise<void> {
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();
  }

  /* ---------------------------- Password reset ---------------------------- */

  /** Creates a single-use reset token. Only its hash is persisted. */
  async createResetToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString('hex');

    await this.resetTokenModel.updateMany(
      { userId, usedAt: null },
      { $set: { usedAt: new Date() } },
    );

    await this.resetTokenModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash: this.hashToken(token),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
      usedAt: null,
    });

    return token;
  }

  async consumeResetToken(token: string): Promise<string> {
    const record = await this.resetTokenModel.findOne({
      tokenHash: this.hashToken(token),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      throw this.unauthorized('Reset link is invalid or has expired', ErrorCode.UNAUTHORIZED);
    }

    record.usedAt = new Date();
    await record.save();
    return record.userId.toString();
  }

  /** Marks a password change so every existing JWT stops validating. */
  async markPasswordChanged(user: UserDocument): Promise<void> {
    user.passwordChangedAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockedUntil = undefined;
    user.refreshTokenHash = undefined;
    user.refreshTokenExpiresAt = undefined;
    await user.save();

    // Any session opened before `passwordChangedAt` now fails the guard's
    // `password_changed` check, so the cached verdicts must go.
    await this.sessionState.invalidateUser(user.id);
  }

  /* -------------------------------- Cookies ------------------------------ */

  setAuthCookies(
    response: Response,
    tokens: { accessToken: string; refreshToken: string; expiresIn: string },
  ): void {
    const secure = this.config.get<boolean>('cookie.secure') ?? false;
    const sameSite = this.config.get<string>('cookie.sameSite') ?? 'lax';
    const domain = this.config.get<string>('cookie.domain');
    const isProduction = (this.config.get<string>('app.nodeEnv') ?? 'development') === 'production';

    const shared = {
      httpOnly: true,
      secure,
      sameSite: sameSite as 'lax' | 'strict' | 'none',
      domain,
      path: '/',
    };

    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      ...shared,
      maxAge: this.durationMs(tokens.expiresIn),
    });

    // Refresh token lives only in an HTTP-only cookie: no JS, no localStorage.
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      ...shared,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (isProduction) {
      // Defence in depth against token theft via subdomain.
      response.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
  }

  clearAuthCookies(response: Response): void {
    const domain = this.config.get<string>('cookie.domain');
    const shared = {
      httpOnly: true,
      secure: this.config.get<boolean>('cookie.secure') ?? false,
      sameSite: (this.config.get<string>('cookie.sameSite') ?? 'lax') as
        | 'lax'
        | 'strict'
        | 'none',
      domain,
      path: '/',
    };
    response.clearCookie(ACCESS_COOKIE, shared);
    response.clearCookie(REFRESH_COOKIE, shared);
  }

  extractRefreshToken(request: Request, bodyToken?: string): string | undefined {
    if (bodyToken) return bodyToken;
    const cookies = request.cookies as Record<string, string> | undefined;
    return cookies?.[REFRESH_COOKIE];
  }

  /* -------------------------------- Internals ----------------------------- */

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /** Length-safe constant-time comparison for opaque tokens. */
  safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  private durationMs(duration: string): number {
    const match = /^(\d+)([smhd])$/.exec(duration.trim());
    if (!match) return 900_000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
    };
    return value * (multipliers[unit] ?? 60_000);
  }

  private unauthorized(message: string, code: ErrorCode): UnauthorizedException {
    return new UnauthorizedException({ message, code });
  }
}
