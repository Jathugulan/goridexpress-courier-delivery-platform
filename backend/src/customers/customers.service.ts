import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginationMeta } from '../common/dto/pagination.dto';
import { AuditAction, ErrorCode, OrderStatus, Role } from '../common/enums';
import {
  buildSearchFilter,
  escapeRegExp,
  resolveSort,
  toPaginated,
} from '../common/utils/pagination.util';
import type { Paginated, RequestContext } from '../common/types';
import {
  Address,
  Customer,
  type AddressDocument,
  type CustomerDocument,
} from '../database/schemas/customer.schema';
import {
  Delivery,
  Order,
  type DeliveryDocument,
  type OrderDocument,
} from '../database/schemas/order.schema';
import { Payment, type PaymentDocument } from '../database/schemas/payment.schema';
import {
  Coupon,
  CouponRedemption,
  type CouponDocument,
  type CouponRedemptionDocument,
} from '../database/schemas/marketing.schema';
import { SupportTicket, type SupportTicketDocument } from '../database/schemas/engagement.schema';
import { User, type UserDocument } from '../database/schemas/user.schema';
import { AuditService } from '../common/audit.service';
import {
  BlockCustomerDto,
  CustomerQueryDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Delivery.name) private readonly deliveryModel: Model<DeliveryDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Address.name) private readonly addressModel: Model<AddressDocument>,
    @InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>,
    @InjectModel(CouponRedemption.name)
    private readonly redemptionModel: Model<CouponRedemptionDocument>,
    @InjectModel(SupportTicket.name)
    private readonly ticketModel: Model<SupportTicketDocument>,
    private readonly audit: AuditService,
  ) {}

  /* ----------------------------- Self service --------------------------- */

  async getProfile(userId: string) {
    const [user, customer] = await Promise.all([
      this.userModel.findById(userId).exec(),
      this.customerModel.findOne({ userId }).exec(),
    ]);

    if (!user) {
      throw new NotFoundException({ message: 'User not found', code: ErrorCode.NOT_FOUND });
    }

    return {
      ...(this.toProfile(user as unknown as ProfileUser, customer as unknown as ProfileCustomer)),
      preferences: customer?.preferences ?? {},
      loyaltyPoints: customer?.loyaltyPoints ?? 0,
      walletBalance: customer?.walletBalance ?? 0,
      lastOrderAt: customer?.lastOrderAt ?? null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto, context: RequestContext) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({ message: 'User not found', code: ErrorCode.NOT_FOUND });
    }

    if (dto.email && dto.email !== user.email) {
      const taken = await this.userModel.exists({ email: dto.email, _id: { $ne: user._id } });
      if (taken) {
        throw new ConflictException({
          message: 'An account with this email already exists',
          code: ErrorCode.DUPLICATE_RESOURCE,
        });
      }
    }

    const before = user.toObject();
    Object.assign(user, {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      email: dto.email ?? user.email,
      phone: dto.phone ?? user.phone,
    });
    await user.save();

    await this.audit.recordChanges(
      AuditAction.CUSTOMER_UPDATED,
      'customer',
      user.id,
      before,
      user.toObject(),
      context,
    );

    return this.getProfile(userId);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const customer = await this.customerModel.findOne({ userId }).exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer profile not found', code: ErrorCode.NOT_FOUND });
    }

    customer.preferences = {
      ...(customer.preferences ?? {}),
      ...(dto as Record<string, unknown>),
    } as typeof customer.preferences;
    await customer.save();

    return { preferences: customer.preferences };
  }

  /** Guards every booking path: a blocked customer must not create orders. */
  async assertNotBlocked(userId: string): Promise<CustomerDocument> {
    const customer = await this.customerModel.findOne({ userId }).exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer profile not found', code: ErrorCode.NOT_FOUND });
    }
    if (customer.isBlocked) {
      throw new ForbiddenException({
        message: `Your account is blocked: ${customer.blockedReason || 'contact support'}`,
        code: ErrorCode.FORBIDDEN,
      });
    }
    return customer;
  }

  /* ------------------------------ Dashboard ----------------------------- */

  async dashboard(userId: string) {
    const [user, customer] = await Promise.all([
      this.userModel.findById(userId).exec(),
      this.customerModel.findOne({ userId }).exec(),
    ]);

    if (!user) {
      throw new NotFoundException({ message: 'User not found', code: ErrorCode.NOT_FOUND });
    }

    const activeStatuses = [
      OrderStatus.CREATED,
      OrderStatus.PAYMENT_PENDING,
      OrderStatus.PAYMENT_SUCCESS,
      OrderStatus.CONFIRMED,
      OrderStatus.COURIER_ASSIGNMENT,
      OrderStatus.COURIER_ASSIGNED,
      OrderStatus.COURIER_ACCEPTED,
      OrderStatus.COURIER_ARRIVING,
      OrderStatus.PICKED_UP,
      OrderStatus.IN_TRANSIT,
      OrderStatus.NEAR_DESTINATION,
      OrderStatus.OUT_FOR_DELIVERY,
    ];

    const [activeDelivery, nextDelivery, recentOrders, recentPayments, savedAddresses, availableCoupons, openTickets] =
      await Promise.all([
        this.deliveryModel
          .findOne({ customerId: userId, status: { $in: activeStatuses } })
          .sort({ createdAt: -1 })
          .lean()
          .exec(),
        this.deliveryModel
          .findOne({
            customerId: userId,
            status: { $in: [OrderStatus.CONFIRMED, OrderStatus.COURIER_ASSIGNED] },
            scheduledFor: { $gt: new Date() },
          })
          .sort({ scheduledFor: 1 })
          .lean()
          .exec(),
        this.orderModel.find({ customerId: userId }).sort({ createdAt: -1 }).limit(5).lean().exec(),
        this.paymentModel.find({ userId }).sort({ createdAt: -1 }).limit(5).lean().exec(),
        this.addressModel.countDocuments({ userId }).exec(),
        this.countAvailableCoupons(userId),
        this.ticketModel.countDocuments({ customerId: userId, status: { $nin: ['CLOSED', 'RESOLVED'] } }).exec(),
      ]);

    const activeDeliveries = await this.orderModel
      .countDocuments({ customerId: userId, status: { $in: activeStatuses } })
      .exec();

    return {
      greeting: { firstName: user.firstName, lastName: user.lastName },
      activeDelivery: activeDelivery ?? null,
      nextDelivery: nextDelivery ?? null,
      stats: {
        activeDeliveries,
        completedOrders: customer?.completedOrders ?? 0,
        totalOrders: customer?.totalOrders ?? 0,
        totalSpent: customer?.totalSpent ?? 0,
        walletBalance: customer?.walletBalance ?? 0,
        cancelledOrders: customer?.cancelledOrders ?? 0,
        savedAddresses,
        availableCoupons,
      },
      recentOrders,
      recentPayments,
      unreadNotifications: 0,
      alerts: this.buildAlerts(
        this.toAlertSource(activeDelivery, 'active'),
        this.toAlertSource(nextDelivery, 'scheduled'),
      ),
      openTickets,
    };
  }

  /** Projects a delivery down to the fields the alert feed needs. */
  private toAlertSource(
    delivery: Record<string, unknown> | null,
    kind: 'active' | 'scheduled',
  ): AlertDelivery | null {
    if (!delivery) return null;
    return {
      trackingCode: String(delivery.trackingCode ?? ''),
      status: String(delivery.status ?? ''),
      isDelayed: delivery.isDelayed === true,
      etaMinutes: Number(delivery.etaMinutes ?? 0),
      scheduledFor: toDate(delivery.scheduledFor),
      updatedAt: toDate(delivery.updatedAt),
      kind,
    } as AlertDelivery;
  }

  /**
   * Derives the smart-alert feed from live delivery state. Keeping this pure
   * (no persistence) means alerts can never go stale relative to the order.
   */
  private buildAlerts(
    active: AlertDelivery | null,
    next: AlertDelivery | null,
  ) {
    const alerts: Record<string, unknown>[] = [];

    if (active?.isDelayed) {
      alerts.push({
        id: `delay-${active.trackingCode}`,
        type: 'DELAY',
        severity: 'warning',
        title: 'Delivery is running late',
        message: 'Traffic is slowing your courier down. We have already alerted the operations team.',
        trackingCode: active.trackingCode,
        createdAt: active.updatedAt ?? new Date(),
      });
    }

    if (active && active.etaMinutes > 0 && active.etaMinutes <= 10) {
      alerts.push({
        id: `nearby-${active.trackingCode}`,
        type: 'INACTIVITY',
        severity: 'info',
        title: 'Your courier is nearly there',
        message: `About ${active.etaMinutes} minutes away. Please have the parcel ready.`,
        trackingCode: active.trackingCode,
        createdAt: new Date(),
      });
    }

    if (!active) {
      alerts.push({
        id: 'idle',
        type: 'UNAVAILABLE',
        severity: 'info',
        title: 'No active deliveries',
        message: 'Book a delivery and track it here in real time.',
        createdAt: new Date(),
      });
    }

    if (next?.scheduledFor) {
      alerts.push({
        id: `scheduled-${next.trackingCode}`,
        type: 'INFO',
        severity: 'info',
        title: 'Scheduled delivery upcoming',
        message: `A scheduled delivery is due ${next.scheduledFor.toISOString()}.`,
        trackingCode: next.trackingCode,
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  private async countAvailableCoupons(userId: string): Promise<number> {
    const now = new Date();
    const redemptions = await this.redemptionModel
      .find({ userId })
      .select('couponId')
      .lean()
      .exec();
    const usedCouponIds = new Set(redemptions.map((r) => r.couponId.toString()));

    return this.couponModel
      .countDocuments({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        code: { $nin: [...usedCouponIds] },
      })
      .exec();
  }

  /* -------------------------------- Admin ------------------------------- */

  async list(query: CustomerQueryDto): Promise<Paginated<Record<string, unknown>>> {
    const filter: Record<string, unknown> = {};

    if (query.isBlocked) filter.isBlocked = query.isBlocked === 'true';
    if (query.isVerified) filter.isVerified = query.isVerified === 'true';

    const searchFilter = buildSearchFilter(query.search, ['firstName', 'lastName', 'email']);
    if (searchFilter) filter.$or = (searchFilter.$or as unknown[]) ?? [];

    const sort = resolveSort(undefined, 'customers', { createdAt: -1 });

    const [items, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .sort(sort)
        .skip(query.skip)
        .limit(query.take)
        .populate('userId', 'email firstName lastName phone isActive createdAt')
        .lean()
        .exec(),
      this.customerModel.countDocuments(filter).exec(),
    ]);

    const enriched = await Promise.all(
      items.map(async (customer) => {
        const user = customer.userId as unknown as UserDocument;
        return {
          ...customer,
          email: user?.email ?? '',
          firstName: user?.firstName ?? '',
          lastName: user?.lastName ?? '',
          phone: user?.phone ?? '',
        };
      }),
    );

    return toPaginated(enriched, total, query);
  }

  async adminGet(id: string) {
    const customer = await this.customerModel.findById(id).populate('userId').lean().exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', code: ErrorCode.NOT_FOUND });
    }
    return this.toProfile(customer.userId as unknown as ProfileUser, customer as unknown as ProfileCustomer);
  }

  async block(id: string, dto: BlockCustomerDto, context: RequestContext) {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', code: ErrorCode.NOT_FOUND });
    }

    customer.isBlocked = true;
    customer.blockedReason = dto.reason;
    customer.blockedAt = new Date();
    customer.blockedBy = context.userId ? new Types.ObjectId(context.userId) : null;
    await customer.save();

    // Deactivate the login so blocked users cannot keep browsing.
    await this.userModel
      .updateOne({ _id: customer.userId }, { isActive: false })
      .exec();

    await this.audit.record({
      action: AuditAction.CUSTOMER_BLOCKED,
      resource: 'customer',
      resourceId: id,
      newValue: { reason: dto.reason },
      context,
    });

    return this.adminGet(id);
  }

  async unblock(id: string, context: RequestContext) {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', code: ErrorCode.NOT_FOUND });
    }

    customer.isBlocked = false;
    customer.blockedReason = '';
    customer.unblockedAt = new Date();
    await customer.save();

    await this.userModel.updateOne({ _id: customer.userId }, { isActive: true }).exec();

    await this.audit.record({
      action: AuditAction.CUSTOMER_UNBLOCKED,
      resource: 'customer',
      resourceId: id,
      context,
    });

    return this.adminGet(id);
  }

  async adminUpdate(id: string, dto: Record<string, unknown>, context: RequestContext) {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', code: ErrorCode.NOT_FOUND });
    }

    const userUpdate: Record<string, unknown> = {};
    for (const key of ['firstName', 'lastName', 'phone'] as const) {
      if (dto[key] !== undefined) userUpdate[key] = dto[key];
    }
    if (Object.keys(userUpdate).length > 0) {
      await this.userModel.updateOne({ _id: customer.userId }, userUpdate).exec();
    }

    const before = customer.toObject();
    const mutable = customer as unknown as Record<string, unknown>;
    for (const key of ['rating', 'zone'] as const) {
      if (dto[key] !== undefined) mutable[key] = dto[key];
    }
    await customer.save();

    await this.audit.recordChanges(
      AuditAction.CUSTOMER_UPDATED,
      'customer',
      id,
      before,
      customer.toObject(),
      context,
    );

    return this.adminGet(id);
  }

  async customerOrders(id: string) {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', code: ErrorCode.NOT_FOUND });
    }
    return this.orderModel.find({ customerId: customer.userId }).sort({ createdAt: -1 }).lean().exec();
  }

  async customerPayments(id: string) {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', code: ErrorCode.NOT_FOUND });
    }
    return this.paymentModel.find({ userId: customer.userId }).sort({ createdAt: -1 }).lean().exec();
  }

  async customerTickets(id: string) {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException({ message: 'Customer not found', code: ErrorCode.NOT_FOUND });
    }
    return this.ticketModel.find({ customerId: customer.userId }).sort({ createdAt: -1 }).lean().exec();
  }

  /* ------------------------------ Helpers ------------------------------- */

  private toProfile(user: ProfileUser, customer: ProfileCustomer | null) {    return {
      id: customer?.id ?? user.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      profileImage: user.avatarUrl ?? null,
      rating: 0,
      totalOrders: customer?.totalOrders ?? 0,
      completedOrders: customer?.completedOrders ?? 0,
      cancelledOrders: customer?.cancelledOrders ?? 0,
      totalSpent: customer?.totalSpent ?? 0,
      isBlocked: customer?.isBlocked ?? false,
      isVerified: customer?.isVerified ?? false,
      blockedReason: customer?.blockedReason ?? null,
      createdAt: toIso(customer?.createdAt ?? user.createdAt),
    };
  }
}

/* ------------------------- Structural view models ------------------------ */

/**
 * Mongoose returns a different concrete type for a hydrated document and for a
 * `.lean()` result. These shapes describe only the fields these methods read,
 * so either form is accepted without casting at every call site.
 */
interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: Date;
}

interface ProfileCustomer {
  id: string;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  isBlocked: boolean;
  isVerified: boolean;
  blockedReason?: string;
  createdAt?: Date;
  preferences?: Record<string, unknown>;
  loyaltyPoints?: number;
  walletBalance?: number;
  lastOrderAt?: Date | null;
}

interface AlertDelivery {
  trackingCode: string;
  status: string;
  isDelayed: boolean;
  etaMinutes: number;
  scheduledFor?: Date;
  updatedAt?: Date;
}

/** Mongoose hands back dates as `Date`, `.lean()` as flattened proxies; both serialise. */
function toIso(value: Date | undefined | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value as string);
}
