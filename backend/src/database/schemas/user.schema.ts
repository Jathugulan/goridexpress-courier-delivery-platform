import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { Role } from '../../common/enums';

export type UserDocument = HydratedDocument<User>;

/**
 * Auth identity. Holds credentials only — all business profile data lives in
 * `customers` or `couriers`, so the two personas never share a fat document.
 */
@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  /** bcrypt hash. Never selected by default. */
  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ required: true, enum: Object.values(Role), index: true })
  role: Role;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true, default: '' })
  phone?: string;

  @Prop({ trim: true, default: '' })
  avatarUrl?: string;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: Date })
  emailVerifiedAt?: Date;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  /** Set on forced logout-all / admin suspension. Invalidates every JWT. */
  @Prop({ type: Date, default: null })
  passwordChangedAt?: Date | null;

  @Prop({ default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date })
  lockedUntil?: Date;

  @Prop({ type: String })
  refreshTokenHash?: string;

  @Prop({ default: '' })
  refreshTokenExpiresAt?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1, isActive: 1 });

/** One row per active device/browser. Enables refresh rotation + session listing. */
@Schema({ collection: 'sessions', timestamps: true })
export class Session {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String })
  sessionId: string;

  @Prop({ trim: true, default: '' })
  userAgent?: string;

  @Prop({ trim: true, default: '' })
  ip?: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date, required: true })
  lastUsedAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  @Prop({ type: Date })
  revokedAt?: Date;

  @Prop({ default: '' })
  revokeReason?: string;
}

export type SessionDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ sessionId: 1 }, { unique: true });
SessionSchema.index({ userId: 1, isRevoked: 1 });
// TTL cleanup so expired sessions are reaped by Mongo, not application code.
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/** Single-use password reset token. Only the hash is stored. */
@Schema({ collection: 'password_reset_tokens', timestamps: true })
export class PasswordResetToken {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  usedAt?: Date | null;
}

export type PasswordResetTokenDocument = HydratedDocument<PasswordResetToken>;
export const PasswordResetTokenSchema =
  SchemaFactory.createForClass(PasswordResetToken);

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
