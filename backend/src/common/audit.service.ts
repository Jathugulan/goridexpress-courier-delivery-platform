import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditAction } from '../common/enums';
import {
  AuditLog,
  type AuditLogDocument,
} from '../database/schemas/system.schema';
import type { RequestContext } from '../common/types';

/** Fields that must never be written into an audit trail. */
const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'token',
  'refreshToken',
  'accessToken',
  'cardNumber',
  'cvv',
  'expiry',
  'authorization',
]);

export interface AuditEntry {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  context?: RequestContext;
  userId?: string;
  userName?: string;
  userEmail?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  /**
   * Records a sensitive mutation.
   *
   * Audit writes must never break the business operation that triggered them,
   * so failures are logged and swallowed rather than propagated.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.auditLogModel.create({
        userId: entry.userId ? new Types.ObjectId(entry.userId) : null,
        userName: entry.userName ?? '',
        userEmail: entry.userEmail ?? '',
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId ?? '',
        oldValue: this.sanitize(entry.oldValue),
        newValue: this.sanitize(entry.newValue),
        ipAddress: entry.context?.ip ?? '',
        userAgent: entry.context?.userAgent ?? '',
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log for ${entry.action} on ${entry.resource}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Diffs two snapshots and records only the fields that actually changed,
   * keeping the log small and readable.
   */
  async recordChanges(
    action: AuditAction,
    resource: string,
    resourceId: string,
    before: unknown,
    after: unknown,
    context?: RequestContext,
  ): Promise<void> {
    const oldValue = this.diff(this.asRecord(before), this.asRecord(after));
    const newValue = this.diff(this.asRecord(after), this.asRecord(before));

    if (!oldValue && !newValue) return;

    await this.record({
      action,
      resource,
      resourceId,
      oldValue,
      newValue,
      context,
      userId: context?.userId,
    });
  }

  /** Normalises a document, lean object or plain record into a key/value map. */
  private asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') return null;
    const candidate = value as { toObject?: () => Record<string, unknown> };
    const resolved = typeof candidate.toObject === 'function' ? candidate.toObject() : value;
    return resolved as Record<string, unknown>;
  }

  /** Keys present in `source` whose value differs in `other`. */
  private diff(
    source: Record<string, unknown> | null | undefined,
    other: Record<string, unknown> | null | undefined,
  ): Record<string, unknown> | null {
    if (!source) return null;
    const changes: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(source)) {
      if (REDACTED_KEYS.has(key)) continue;
      if (value === undefined) continue;
      if (other && JSON.stringify(other[key]) === JSON.stringify(value)) continue;
      changes[key] = this.redact(value);
    }

    return Object.keys(changes).length > 0 ? changes : null;
  }

  /** Recursively strips secrets and caps depth/size. */
  private sanitize(value: unknown, depth = 0): unknown {
    if (value === null || value === undefined) return value;
    if (depth > 4) return '[truncated]';

    if (Array.isArray(value)) {
      return value.slice(0, 50).map((item) => this.sanitize(item, depth + 1));
    }

    if (typeof value === 'object') {
      const output: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        if (REDACTED_KEYS.has(key)) {
          output[key] = '[redacted]';
          continue;
        }
        output[key] = this.sanitize(item, depth + 1);
      }
      return output;
    }

    if (typeof value === 'string' && value.length > 500) {
      return `${value.slice(0, 500)}…`;
    }

    return value;
  }

  private redact(value: unknown): unknown {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const output: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
        output[key] = REDACTED_KEYS.has(key) ? '[redacted]' : item;
      }
      return output;
    }
    return value;
  }
}
