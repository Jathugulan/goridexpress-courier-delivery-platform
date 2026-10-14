import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationType, Role } from '../common/enums';
import {
  AppNotification,
  type NotificationDocument,
} from '../database/schemas/engagement.schema';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string | null;
}

export interface PushResult {
  userId: string;
  notificationId: string;
  delivered: boolean;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(AppNotification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly realtime: RealtimeGateway,
  ) {}

  /**
   * Persists a notification then pushes it over Socket.IO.
   *
   * Persistence is the source of truth; the socket push is best-effort so a
   * disconnected client still sees the notification on next load.
   */
  async create(input: CreateNotificationInput): Promise<PushResult> {
    try {
      const created = await this.notificationModel.create({
        userId: new Types.ObjectId(input.userId),
        type: input.type,
        title: input.title,
        message: input.message,
        entityType: input.entityType ?? '',
        entityId: input.entityId ?? '',
        actionUrl: input.actionUrl ?? null,
        isRead: false,
      });

      const delivered = this.realtime.emitToUser(input.userId, 'notification:new', {
        id: created.id,
        type: created.type,
        title: created.title,
        message: created.message,
        entityType: created.entityType,
        entityId: created.entityId,
        actionUrl: created.actionUrl,
        isRead: false,
        createdAt: created.createdAt,
      });

      return { userId: input.userId, notificationId: created.id, delivered };
    } catch (error) {
      this.logger.error(
        `Failed to create ${input.type} notification for user ${input.userId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return { userId: input.userId, notificationId: '', delivered: false };
    }
  }

  /** Fans a notification out to every user holding the given role. */
  async createForRole(
    role: Role,
    input: Omit<CreateNotificationInput, 'userId'>,
    recipientIds: string[],
  ): Promise<number> {
    if (recipientIds.length === 0) return 0;
    const results = await Promise.all(
      recipientIds.map((userId) => this.create({ ...input, userId })),
    );
    return results.length;
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({ userId, isRead: false }).exec();
  }

  async list(userId: string, page: number, limit: number, unreadOnly = false) {
    const filter: Record<string, unknown> = { userId };
    if (unreadOnly) filter.isRead = false;

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    return { items, total };
  }

  async markRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.notificationModel.updateOne(
      // The userId in the filter is the ownership check.
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
    );
    return result.modifiedCount > 0;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return result.modifiedCount ?? 0;
  }

  async remove(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.notificationModel.deleteOne({ _id: notificationId, userId });
    return result.deletedCount > 0;
  }
}
