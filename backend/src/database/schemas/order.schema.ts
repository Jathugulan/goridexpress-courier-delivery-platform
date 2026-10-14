import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import {
  OrderStatus,
  PackageType,
  PaymentMethod,
  PaymentStatus,
  ServiceType,
  VehicleType,
} from '../../common/enums';
import { GeoLocationSchema } from './customer.schema';

export type OrderDocument = HydratedDocument<Order>;

/* --------------------------- Embedded sub-documents ------------------------ */

@Schema({ _id: false })
export class AddressSnapshot {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Address' })
  addressId?: Types.ObjectId;

  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  contactNumber: string;

  @Prop({ required: true })
  addressLine: string;

  @Prop({ required: true })
  city: string;

  @Prop({ default: '' })
  province?: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ default: '' })
  country: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ default: '' })
  label?: string;

  @Prop({ default: '' })
  deliveryInstructions?: string;
}

export const AddressSnapshotSchema = SchemaFactory.createForClass(AddressSnapshot);

@Schema({ _id: false })
export class PackageSnapshot {
  @Prop({ required: true, enum: Object.values(PackageType) })
  type: PackageType;

  @Prop({ required: true, min: 0 })
  weight: number;

  @Prop({ required: true, min: 0 })
  length: number;

  @Prop({ required: true, min: 0 })
  width: number;

  @Prop({ required: true, min: 0 })
  height: number;

  @Prop({ required: true, min: 1, default: 1 })
  quantity: number;

  @Prop({ default: false })
  isFragile: boolean;

  @Prop({ default: false })
  isTemperatureSensitive: boolean;

  @Prop({ default: false })
  requiresSpecialHandling: boolean;

  @Prop({ default: '' })
  description?: string;

  @Prop({ default: '' })
  specialInstructions?: string;
}

export const PackageSnapshotSchema = SchemaFactory.createForClass(PackageSnapshot);

@Schema({ _id: false })
export class LineItem {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  amount: number;
}

export const LineItemSchema = SchemaFactory.createForClass(LineItem);

@Schema({ _id: false })
export class PriceSnapshot {
  @Prop({ required: true })
  baseFee: number;

  @Prop({ required: true })
  distanceFee: number;

  @Prop({ required: true })
  distanceKm: number;

  @Prop({ required: true })
  serviceFee: number;

  @Prop({ required: true })
  insurance: number;

  @Prop({ required: true })
  priorityFee: number;

  @Prop({ required: true })
  handlingFee: number;

  @Prop({ required: true })
  discount: number;

  @Prop({ required: true })
  tax: number;

  @Prop({ required: true })
  total: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ type: [LineItemSchema], default: () => [] })
  lineItems: LineItem[];
}

export const PriceSnapshotSchema = SchemaFactory.createForClass(PriceSnapshot);

@Schema({ _id: true, timestamps: false })
export class StatusHistoryEntry {
  @Prop({ required: true, enum: Object.values(OrderStatus) })
  status: OrderStatus;

  @Prop({ required: true })
  label: string;

  @Prop({ default: '' })
  note?: string;

  @Prop({ type: SchemaTypes.ObjectId, default: null })
  actorId?: Types.ObjectId | null;

  @Prop({ default: 'SYSTEM' })
  actorRole: string;

  @Prop({ default: '' })
  actorName?: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  createdAt: Date;
}

export const StatusHistoryEntrySchema = SchemaFactory.createForClass(StatusHistoryEntry);

/* --------------------------------- Order ---------------------------------- */

/**
 * The commercial record. Prices, addresses and package details are snapshotted
 * at booking time so later edits to the address book or tariff never rewrite
 * history.
 */
@Schema({ collection: 'orders', timestamps: true })
export class Order {
  /** Human reference shown in the UI, e.g. `GRX123456`. */
  @Prop({ required: true, unique: true, uppercase: true, index: true })
  orderId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Customer', required: true, index: true })
  customerProfileId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Delivery', default: null })
  deliveryId?: Types.ObjectId | null;

  @Prop({ required: true, enum: Object.values(OrderStatus), default: OrderStatus.CREATED, index: true })
  status: OrderStatus;

  @Prop({ required: true, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING, index: true })
  paymentStatus: PaymentStatus;

  @Prop({ required: true, enum: Object.values(PaymentMethod) })
  paymentMethod: PaymentMethod;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Payment', default: null })
  paymentId?: Types.ObjectId | null;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ required: true, default: 'USD' })
  currency: string;

  @Prop({ trim: true, default: '' })
  couponCode?: string;

  @Prop({ required: true, default: 0 })
  discount: number;

  @Prop({ type: AddressSnapshotSchema, required: true })
  pickupAddress: AddressSnapshot;

  @Prop({ type: AddressSnapshotSchema, required: true })
  deliveryAddress: AddressSnapshot;

  @Prop({ required: true, enum: Object.values(ServiceType), index: true })
  serviceType: ServiceType;

  @Prop({ required: true, min: 0 })
  distanceKm: number;

  @Prop({ required: true, min: 0 })
  durationMinutes: number;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Courier', default: null, index: true })
  courierId?: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Vehicle', default: null })
  vehicleId?: Types.ObjectId | null;

  @Prop({ type: Date, index: true })
  scheduledFor?: Date;

  @Prop({ type: Date, index: true })
  estimatedDelivery?: Date;

  @Prop({ default: 0 })
  etaMinutes: number;

  @Prop({ default: 0, min: 0, max: 100 })
  progressPercent: number;

  @Prop({ default: false })
  isDelayed: boolean;

  @Prop({ type: Date })
  pickedUpAt?: Date;

  @Prop({ type: Date, index: true })
  completedAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({ default: '' })
  cancellationReason?: string;

  @Prop({ type: [StatusHistoryEntrySchema], default: () => [] })
  statusHistory: StatusHistoryEntry[];

  /** Loyalty points accrued once the order is delivered. */
  @Prop({ default: 0 })
  loyaltyPointsEarned: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ serviceType: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'deliveryAddress.latitude': 1, 'deliveryAddress.longitude': 1 });

/* ----------------------------- Proof of delivery --------------------------- */

@Schema({ _id: false })
export class ProofOfDelivery {
  @Prop({ required: true })
  receiverName: string;

  @Prop({ default: '' })
  note?: string;

  @Prop({ default: '' })
  signatureDataUrl?: string;

  @Prop({ type: Date, required: true })
  confirmedAt: Date;

  @Prop({ default: '' })
  confirmedBy?: string;
}

export const ProofOfDeliverySchema = SchemaFactory.createForClass(ProofOfDelivery);

/* -------------------------------- Delivery -------------------------------- */

export type DeliveryDocument = HydratedDocument<Delivery>;

/**
 * Operational twin of an `Order`: courier assignment, live tracking, ETA and
 * proof of delivery live here so the order document stays small and immutable
 * once paid.
 */
@Schema({ collection: 'deliveries', timestamps: true })
export class Delivery {
  @Prop({ required: true, unique: true, uppercase: true, index: true })
  trackingCode: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  /** One delivery per order, so the reference is unique. */
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', required: true, unique: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(OrderStatus), default: OrderStatus.CREATED, index: true })
  status: OrderStatus;

  @Prop({ type: AddressSnapshotSchema, required: true })
  pickupAddress: AddressSnapshot;

  @Prop({ type: AddressSnapshotSchema, required: true })
  deliveryAddress: AddressSnapshot;

  @Prop({ type: PackageSnapshotSchema, required: true })
  package: PackageSnapshot;

  @Prop({ required: true, enum: Object.values(ServiceType), index: true })
  serviceType: ServiceType;

  @Prop({ trim: true, default: '' })
  serviceName?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Vehicle', default: null })
  vehicleId?: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Courier', default: null, index: true })
  courierId?: Types.ObjectId | null;

  @Prop({ required: true, min: 0 })
  distanceKm: number;

  @Prop({ required: true, min: 0 })
  durationMinutes: number;

  @Prop({ type: PriceSnapshotSchema, required: true })
  price: PriceSnapshot;

  @Prop({ default: '' })
  courierInstructions?: string;

  @Prop({ default: '' })
  deliveryInstructions?: string;

  @Prop({ type: Date })
  scheduledFor?: Date;

  @Prop({ default: 0 })
  etaMinutes: number;

  @Prop({ default: 0, min: 0, max: 100 })
  progressPercent: number;

  @Prop({ default: false, index: true })
  isDelayed: boolean;

  @Prop({ type: Date })
  pickedUpAt?: Date;

  @Prop({ type: Date })
  deliveredAt?: Date;

  @Prop({ type: ProofOfDeliverySchema, default: null })
  proofOfDelivery?: ProofOfDelivery | null;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: '' })
  failureReason?: string;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);

DeliverySchema.index({ customerId: 1, createdAt: -1 });
DeliverySchema.index({ courierId: 1, status: 1 });
DeliverySchema.index({ status: 1, createdAt: -1 });
DeliverySchema.index({ 'deliveryAddress.latitude': 1, 'deliveryAddress.longitude': 1 });

/* ----------------------------- Delivery service ---------------------------- */

export type DeliveryServiceDocument = HydratedDocument<DeliveryServiceEntity>;

@Schema({ collection: 'delivery_services', timestamps: true })
export class DeliveryServiceEntity {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code: ServiceType;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, min: 0 })
  basePrice: number;

  @Prop({ required: true, min: 0 })
  pricePerKm: number;

  @Prop({ required: true, min: 0 })
  estimatedMinutes: number;

  @Prop({ required: true, enum: Object.values(VehicleType) })
  vehicleType: VehicleType;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number;
}

export const DeliveryServiceSchema =
  SchemaFactory.createForClass(DeliveryServiceEntity);

/* ------------------------------- Tracking --------------------------------- */

export type TrackingLocationDocument = HydratedDocument<TrackingLocation>;

/** Append-only GPS breadcrumb trail. TTL'd by retention policy. */
@Schema({ collection: 'tracking_locations', timestamps: { createdAt: false, updatedAt: false } })
export class TrackingLocation {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'Delivery', required: true, index: true })
  deliveryId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', required: true, index: true })
  orderId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Courier', required: true, index: true })
  courierId: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  orderRef?: string;

  @Prop({ required: true, min: -90, max: 90 })
  latitude: number;

  @Prop({ required: true, min: -180, max: 180 })
  longitude: number;

  @Prop({ min: 0, max: 100 })
  accuracy?: number;

  @Prop({ min: 0 })
  speed?: number;

  @Prop({ min: 0, max: 360 })
  heading?: number;

  @Prop({ type: Date, required: true, default: () => new Date(), index: true })
  timestamp: Date;
}

export const TrackingLocationSchema = SchemaFactory.createForClass(TrackingLocation);

TrackingLocationSchema.index({ deliveryId: 1, timestamp: -1 });
