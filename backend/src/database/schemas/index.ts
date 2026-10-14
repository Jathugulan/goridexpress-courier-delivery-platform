import type { ModelDefinition } from '@nestjs/mongoose';
import { AppSettingSchema, AuditLogSchema, IdempotencyRecordSchema } from './system.schema';
import { AddressSchema, CustomerSchema } from './customer.schema';
import { CourierSchema, VehicleSchema } from './courier.schema';
import {
  NotificationSchema as AppNotificationSchema,
  ReviewSchema,
  SupportMessageSchema,
  SupportTicketSchema,
} from './engagement.schema';
import {
  DeliverySchema,
  DeliveryServiceSchema,
  OrderSchema,
  TrackingLocationSchema,
} from './order.schema';
import {
  CouponRedemptionSchema,
  CouponSchema,
  PromotionSchema,
} from './marketing.schema';
import { PaymentSchema, RefundSchema } from './payment.schema';
import { WalletSchema, WalletTransactionSchema } from './wallet.schema';
import {
  PasswordResetTokenSchema,
  SessionSchema,
  UserSchema,
} from './user.schema';
import {
  AppNotification,
  Review,
  SupportMessage,
  SupportTicket,
} from './engagement.schema';
import { Address, Customer } from './customer.schema';
import { Courier, Vehicle } from './courier.schema';
import { Delivery, DeliveryServiceEntity, Order, TrackingLocation } from './order.schema';
import { Coupon, CouponRedemption, Promotion } from './marketing.schema';
import { Payment, Refund } from './payment.schema';
import { Wallet, WalletTransaction } from './wallet.schema';
import { PasswordResetToken, Session, User } from './user.schema';
import { AppSetting, AuditLog, IdempotencyRecord } from './system.schema';

export * from './user.schema';
export * from './customer.schema';
export * from './courier.schema';
export * from './order.schema';
export * from './payment.schema';
export * from './wallet.schema';
export * from './marketing.schema';
export * from './engagement.schema';
export * from './system.schema';

/**
 * Every model registered on the single Mongoose connection.
 *
 * Adding a schema here makes `@InjectModel()` available application-wide
 * without any per-module `forFeature` boilerplate.
 */
export const ALL_MODELS: ModelDefinition[] = [
  { name: User.name, schema: UserSchema },
  { name: Session.name, schema: SessionSchema },
  { name: PasswordResetToken.name, schema: PasswordResetTokenSchema },
  { name: Customer.name, schema: CustomerSchema },
  { name: Address.name, schema: AddressSchema },
  { name: Courier.name, schema: CourierSchema },
  { name: Vehicle.name, schema: VehicleSchema },
  { name: Order.name, schema: OrderSchema },
  { name: Delivery.name, schema: DeliverySchema },
  { name: DeliveryServiceEntity.name, schema: DeliveryServiceSchema },
  { name: TrackingLocation.name, schema: TrackingLocationSchema },
  { name: Payment.name, schema: PaymentSchema },
  { name: Refund.name, schema: RefundSchema },
  { name: Wallet.name, schema: WalletSchema },
  { name: WalletTransaction.name, schema: WalletTransactionSchema },
  { name: Coupon.name, schema: CouponSchema },
  { name: CouponRedemption.name, schema: CouponRedemptionSchema },
  { name: Promotion.name, schema: PromotionSchema },
  { name: Review.name, schema: ReviewSchema },
  { name: AppNotification.name, schema: AppNotificationSchema },
  { name: SupportTicket.name, schema: SupportTicketSchema },
  { name: SupportMessage.name, schema: SupportMessageSchema },
  { name: AppSetting.name, schema: AppSettingSchema },
  { name: AuditLog.name, schema: AuditLogSchema },
  { name: IdempotencyRecord.name, schema: IdempotencyRecordSchema },
];
