import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { PaymentMethod, PaymentStatus } from '../../common/enums';

export type PaymentDocument = HydratedDocument<Payment>;

/**
 * Demo payment record.
 *
 * SECURITY: neither the PAN nor the CVV is ever persisted. Only a masked
 * number, brand and last four digits are stored, and `isDemo` is hard-locked
 * to `true` so simulated funds can never be mistaken for real money.
 */
@Schema({ collection: 'payments', timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true, uppercase: true, index: true })
  transactionId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  orderRef?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(PaymentMethod), index: true })
  method: PaymentMethod;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ required: true, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING, index: true })
  status: PaymentStatus;

  /* --------------------------- Demo card metadata ------------------------- */

  @Prop({ trim: true, default: '' })
  maskedCardNumber?: string;

  @Prop({ trim: true, default: '' })
  cardBrand?: string;

  @Prop({ trim: true, default: '' })
  lastFour?: string;

  @Prop({ trim: true, default: '' })
  cardHolderName?: string;

  @Prop({ default: '' })
  failureReason?: string;

  /* -------------------------------- Refunds -------------------------------- */

  @Prop({ default: 0, min: 0 })
  refundAmount: number;

  @Prop({ default: '' })
  refundReason?: string;

  @Prop({ type: Date })
  refundedAt?: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  refundedBy?: Types.ObjectId | null;

  /* ------------------------------- Metadata -------------------------------- */

  @Prop({ trim: true, default: '' })
  idempotencyKey?: string;

  @Prop({ type: Date })
  paidAt?: Date;

  @Prop({ default: true, immutable: true })
  isDemo: true;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index({ userId: 1, createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ method: 1, createdAt: -1 });
// Idempotency is scoped per user so retries never create duplicate charges.
PaymentSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);

/* -------------------------------- Refund log ------------------------------- */

export type RefundDocument = HydratedDocument<Refund>;

@Schema({ collection: 'refunds', timestamps: true })
export class Refund {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Payment', required: true, index: true })
  paymentId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ default: '' })
  reason?: string;

  @Prop({ default: 'ADMIN' })
  requestedBy: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  requestedById?: Types.ObjectId | null;

  @Prop({ default: true, immutable: true })
  isDemo: true;
}

export const RefundSchema = SchemaFactory.createForClass(Refund);

RefundSchema.index({ paymentId: 1, createdAt: -1 });
