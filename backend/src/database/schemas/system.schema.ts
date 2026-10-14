import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { AuditAction } from '../../common/enums';

export type AuditLogDocument = HydratedDocument<AuditLog>;

/**
 * Append-only trail of sensitive mutations. Never updated, never deleted
 * through the application — there is deliberately no service method for that.
 */
@Schema({ collection: 'audit_logs', timestamps: { createdAt: true, updatedAt: false } })
export class AuditLog {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null, index: true })
  userId?: Types.ObjectId | null;

  @Prop({ trim: true, default: '' })
  userName?: string;

  @Prop({ trim: true, default: '' })
  userEmail?: string;

  @Prop({ required: true, enum: Object.values(AuditAction), index: true })
  action: AuditAction;

  /** Logical resource, e.g. `order`, `courier`, `payment`. */
  @Prop({ required: true, index: true })
  resource: string;

  @Prop({ default: '' })
  resourceId?: string;

  @Prop({ type: SchemaTypes.Mixed })
  oldValue?: unknown;

  @Prop({ type: SchemaTypes.Mixed })
  newValue?: unknown;

  @Prop({ trim: true, default: '' })
  ipAddress?: string;

  @Prop({ trim: true, default: '' })
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1 });
AuditLogSchema.index({ userId: 1, createdAt: -1 });

/* ------------------------------ App settings ------------------------------ */

export type AppSettingDocument = HydratedDocument<AppSetting>;

/** Single-row-per-key configuration store backing the admin settings screen. */
@Schema({ collection: 'app_settings', timestamps: true })
export class AppSetting {
  @Prop({ required: true, unique: true, trim: true, index: true })
  key: string;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  value: unknown;

  @Prop({ trim: true, default: '' })
  description?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  updatedBy?: Types.ObjectId | null;
}

export const AppSettingSchema = SchemaFactory.createForClass(AppSetting);

/* -------------------------- Idempotency records --------------------------- */

export type IdempotencyRecordDocument = HydratedDocument<IdempotencyRecord>;

/**
 * Caches the outcome of a mutating request keyed by `Idempotency-Key` so a
 * network retry replays the original response instead of double-charging.
 */
@Schema({ collection: 'idempotency_records', timestamps: { createdAt: true, updatedAt: false } })
export class IdempotencyRecord {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ required: true, index: true })
  endpoint: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  userId?: Types.ObjectId | null;

  @Prop({ default: 0 })
  statusCode: number;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  response: unknown;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const IdempotencyRecordSchema =
  SchemaFactory.createForClass(IdempotencyRecord);

IdempotencyRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
