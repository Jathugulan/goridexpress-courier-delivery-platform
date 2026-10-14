import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { NotificationType, TicketPriority, TicketStatus } from '../../common/enums';

export type ReviewDocument = HydratedDocument<Review>;

/** Post-delivery rating. One per delivery, enforced by a unique index. */
@Schema({ collection: 'reviews', timestamps: true })
export class Review {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Courier', required: true, index: true })
  courierId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Delivery', required: true })
  deliveryId: Types.ObjectId;

  @Prop({ trim: true, default: '' })
  orderRef?: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ default: '' })
  comment?: string;

  /** Optional split score for punctuality / handling. */
  @Prop({ min: 1, max: 5 })
  courierRating?: number;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ deliveryId: 1 }, { unique: true });
ReviewSchema.index({ courierId: 1, createdAt: -1 });
ReviewSchema.index({ customerId: 1, createdAt: -1 });

/* ------------------------------ Notification ------------------------------ */

export type NotificationDocument = HydratedDocument<AppNotification>;

/** Fan-out record. `audience` keeps customer and admin feeds in one table. */
@Schema({ collection: 'notifications', timestamps: { createdAt: true, updatedAt: false } })
export class AppNotification {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(NotificationType), index: true })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false, index: true })
  isRead: boolean;

  @Prop({ type: Date })
  readAt?: Date;

  @Prop({ trim: true, default: '' })
  entityType?: string;

  @Prop({ trim: true, default: '' })
  entityId?: string;

  @Prop({ type: String, default: null })
  actionUrl?: string | null;
}

export const NotificationSchema = SchemaFactory.createForClass(AppNotification);

NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

/* -------------------------------- Support --------------------------------- */

export type SupportTicketDocument = HydratedDocument<SupportTicket>;

@Schema({ collection: 'support_tickets', timestamps: true })
export class SupportTicket {
  @Prop({ required: true, unique: true, uppercase: true, index: true })
  ticketRef: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, enum: Object.values(TicketStatus), default: TicketStatus.OPEN, index: true })
  status: TicketStatus;

  @Prop({ required: true, enum: Object.values(TicketPriority), default: TicketPriority.MEDIUM, index: true })
  priority: TicketPriority;

  @Prop({ trim: true, default: '' })
  orderRef?: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Order', default: null })
  orderId?: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  assignedAdminId?: Types.ObjectId | null;

  @Prop({ trim: true, default: '' })
  assignedAdminName?: string;

  @Prop({ type: [String], default: () => [] })
  attachments: string[];

  @Prop({ type: Date })
  resolvedAt?: Date;

  @Prop({ type: Date })
  closedAt?: Date;

  @Prop({ type: Date })
  lastReplyAt?: Date;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);

SupportTicketSchema.index({ customerId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1, priority: -1, createdAt: -1 });

export type SupportMessageDocument = HydratedDocument<SupportMessage>;

/** Thread entry. Stored separately so ticket reads stay fast. */
@Schema({ collection: 'support_messages', timestamps: { createdAt: true, updatedAt: false } })
export class SupportMessage {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'SupportTicket', required: true, index: true })
  ticketId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  senderRole: string;

  @Prop({ required: true })
  senderName: string;

  @Prop({ required: true })
  body: string;

  @Prop({ type: [String], default: () => [] })
  attachments: string[];

  @Prop({ default: false, index: true })
  isStaff: boolean;
}

export const SupportMessageSchema = SchemaFactory.createForClass(SupportMessage);

SupportMessageSchema.index({ ticketId: 1, createdAt: 1 });
