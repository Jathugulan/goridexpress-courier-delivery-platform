import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { AddressLabel } from '../../common/enums';
import type { GeoPoint } from '../../common/types';

export type CustomerDocument = HydratedDocument<Customer>;

/** Customer profile: aggregates, preferences and account state. */
@Schema({ collection: 'customers', timestamps: true })
export class Customer {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Address', default: null })
  defaultAddressId?: Types.ObjectId | null;

  @Prop({ default: false, index: true })
  isVerified: boolean;

  @Prop({ default: false, index: true })
  isBlocked: boolean;

  @Prop({ default: '' })
  blockedReason?: string;

  @Prop({ type: Date })
  blockedAt?: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  blockedBy?: Types.ObjectId | null;

  @Prop({ type: Date })
  unblockedAt?: Date;

  /* ----------------------------- Aggregates ------------------------------ */

  @Prop({ default: 0, index: true })
  totalOrders: number;

  @Prop({ default: 0 })
  completedOrders: number;

  @Prop({ default: 0 })
  cancelledOrders: number;

  @Prop({ default: 0 })
  totalSpent: number;

  @Prop({ type: Date, index: true })
  lastOrderAt?: Date;

  @Prop({ default: 0 })
  walletBalance: number;

  @Prop({ default: 0 })
  loyaltyPoints: number;

  /* ---------------------------- Preferences ------------------------------ */

  @Prop({ type: Object, default: () => ({}) })
  preferences: {
    language?: string;
    timezone?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    defaultPaymentMethod?: string;
    defaultPackageType?: string;
    saveAddresses?: boolean;
  };
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ totalSpent: -1 });
CustomerSchema.index({ createdAt: -1 });

/* -------------------------------- Address --------------------------------- */

export type AddressDocument = HydratedDocument<Address>;

@Schema({ _id: false })
export class GeoLocation {
  @Prop({ required: true, min: -90, max: 90 })
  latitude: number;

  @Prop({ required: true, min: -180, max: 180 })
  longitude: number;
}

export const GeoLocationSchema = SchemaFactory.createForClass(GeoLocation);

@Schema({ collection: 'addresses', timestamps: true })
export class Address {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(AddressLabel), default: AddressLabel.HOME })
  label: AddressLabel;

  @Prop({ required: true, trim: true })
  recipientName: string;

  @Prop({ required: true, trim: true })
  contactNumber: string;

  @Prop({ required: true, trim: true })
  addressLine: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ trim: true, default: '' })
  province?: string;

  @Prop({ required: true, trim: true })
  postalCode: string;

  @Prop({ trim: true, default: '' })
  country: string;

  @Prop({ type: GeoLocationSchema, required: true })
  location: { latitude: number; longitude: number };

  @Prop({ trim: true, default: '' })
  deliveryInstructions?: string;

  @Prop({ default: false })
  isDefault: boolean;

  @Prop({ default: 0 })
  usageCount: number;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

AddressSchema.index({ userId: 1, isDefault: -1 });
AddressSchema.index({ userId: 1, createdAt: -1 });
// At most one default per user, enforced at the service layer.
AddressSchema.index(
  { userId: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } },
);
