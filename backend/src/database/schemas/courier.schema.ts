import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { CourierStatus, VehicleStatus, VehicleType } from '../../common/enums';
import { GeoLocationSchema } from './customer.schema';

export type CourierDocument = HydratedDocument<Courier>;

/** Courier profile. Linked 1:1 to a `User` with role COURIER. */
@Schema({ collection: 'couriers', timestamps: true })
export class Courier {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ trim: true, default: '' })
  email?: string;

  @Prop({ trim: true, default: '' })
  phone: string;

  @Prop({ trim: true, default: '' })
  photoUrl?: string;

  @Prop({ required: true, enum: Object.values(CourierStatus), default: CourierStatus.PENDING_VERIFICATION, index: true })
  status: CourierStatus;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Vehicle', default: null })
  vehicleId?: Types.ObjectId | null;

  /* ---------------------------- Verification ----------------------------- */

  @Prop({ default: false, index: true })
  isVerified: boolean;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  approvedBy?: Types.ObjectId | null;

  @Prop({ type: Date })
  suspendedAt?: Date;

  @Prop({ default: '' })
  suspensionReason?: string;

  /* ------------------------------ Location ------------------------------- */

  @Prop({ type: GeoLocationSchema, default: null })
  currentLocation?: { latitude: number; longitude: number };

  @Prop({ type: Date })
  lastLocationAt?: Date;

  @Prop({ default: true, index: true })
  locationSharingEnabled: boolean;

  /* ---------------------------- Performance ------------------------------ */

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: 0, index: true })
  totalDeliveries: number;

  @Prop({ default: 0 })
  completedDeliveries: number;

  @Prop({ default: 0 })
  cancelledDeliveries: number;

  @Prop({ default: 0 })
  failedDeliveries: number;

  /** Rolling on-time completion percentage, 0-100. */
  @Prop({ default: 100, min: 0, max: 100 })
  onTimeRate: number;

  /** Rolling acceptance percentage, 0-100. */
  @Prop({ default: 100, min: 0, max: 100 })
  acceptanceRate: number;

  @Prop({ default: 0 })
  totalDistanceKm: number;

  @Prop({ default: 0 })
  earnings: number;

  /** The delivery currently occupying this courier, if any. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Delivery', default: null })
  activeOrderId?: Types.ObjectId | null;

  @Prop({ type: Date, index: true })
  lastActiveAt?: Date;

  @Prop({ trim: true, default: '' })
  zone?: string;
}

export const CourierSchema = SchemaFactory.createForClass(Courier);

CourierSchema.index({ status: 1, isVerified: 1 });
CourierSchema.index({ status: 1, currentLocation: '2dsphere' });
CourierSchema.index({ rating: -1, completedDeliveries: -1 });

/* -------------------------------- Vehicle --------------------------------- */

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ collection: 'vehicles', timestamps: true })
export class Vehicle {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Courier', default: null, index: true })
  courierId?: Types.ObjectId | null;

  @Prop({ required: true, enum: Object.values(VehicleType), index: true })
  type: VehicleType;

  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  registrationNumber: string;

  @Prop({ required: true, trim: true })
  model: string;

  @Prop({ trim: true, default: '' })
  color?: string;

  @Prop({ type: GeoLocationSchema, default: null })
  currentLocation?: { latitude: number; longitude: number };

  @Prop({ required: true, enum: Object.values(VehicleStatus), default: VehicleStatus.ACTIVE, index: true })
  status: VehicleStatus;

  @Prop({ type: Date })
  lastServiceDate?: Date;

  @Prop({ type: Date })
  nextServiceDate?: Date;

  @Prop({ trim: true, default: '' })
  notes?: string;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);

VehicleSchema.index({ type: 1, status: 1 });
VehicleSchema.index({ currentLocation: '2dsphere' });
