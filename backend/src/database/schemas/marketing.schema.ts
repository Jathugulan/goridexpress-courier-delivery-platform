import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { DiscountType } from '../../common/enums';

export type CouponDocument = HydratedDocument<Coupon>;

/**
 * Discount rule. `usageLimit` is global; `perCustomerLimit` is enforced by the
 * redemption ledger rather than a counter on this document.
 */
@Schema({ collection: 'coupons', timestamps: true })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ required: true, enum: Object.values(DiscountType) })
  discountType: DiscountType;

  @Prop({ required: true, min: 0 })
  discountValue: number;

  /** Caps percentage and fixed-amount discounts. `null` means uncapped. */
  @Prop({ type: Number, default: null })
  maximumDiscount?: number | null;

  @Prop({ required: true, default: 0, min: 0 })
  minimumOrder: number;

  @Prop({ required: true, type: Date, index: true })
  startDate: Date;

  @Prop({ required: true, type: Date, index: true })
  endDate: Date;

  @Prop({ required: true, default: 0, min: 0 })
  usageLimit: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  /** Max redemptions per customer. `null` means unlimited. */
  @Prop({ type: Number, default: null })
  perCustomerLimit?: number | null;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: true, immutable: true })
  isDemo: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

/* --------------------------- Redemption ledger ---------------------------- */

/**
 * One row per coupon claim. Tracking claims separately from `usedCount` lets
 * a coupon be reserved at checkout and only consumed on payment success.
 */
export type CouponRedemptionDocument = HydratedDocument<CouponRedemption>;

@Schema({ collection: 'coupon_redemptions', timestamps: true })
export class CouponRedemption {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Coupon', required: true, index: true })
  couponId: Types.ObjectId;

  @Prop({ trim: true, uppercase: true })
  code: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  discountAmount: number;

  @Prop({ type: Date, default: null })
  usedAt?: Date | null;
}

export const CouponRedemptionSchema =
  SchemaFactory.createForClass(CouponRedemption);

CouponRedemptionSchema.index({ couponId: 1, userId: 1 });
CouponRedemptionSchema.index({ orderId: 1 }, { unique: true });

/* -------------------------------- Promotion -------------------------------- */

export type PromotionDocument = HydratedDocument<Promotion>;

/** Marketing banner / campaign shown on public and customer surfaces. */
@Schema({ collection: 'promotions', timestamps: true })
export class Promotion {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  subtitle?: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ type: String, default: null })
  bannerImage?: string | null;

  @Prop({ type: String, trim: true, uppercase: true, default: null })
  code?: string | null;

  @Prop({ default: '' })
  badgeText?: string;

  @Prop({ default: '' })
  ctaLabel?: string;

  @Prop({ default: '' })
  ctaHref?: string;

  @Prop({ required: true, type: Date, index: true })
  startsAt: Date;

  @Prop({ required: true, type: Date, index: true })
  endsAt: Date;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;
}

export const PromotionSchema = SchemaFactory.createForClass(Promotion);
