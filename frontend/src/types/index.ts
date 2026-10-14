/**
 * GoRideXpress domain types.
 * Mirrors the NestJS REST API contract (SRS § REST API).
 */

/* -------------------------------------------------------------------------- */
/*                                  Enums                                     */
/* -------------------------------------------------------------------------- */

export type Role = "CUSTOMER" | "ADMIN";

export type OrderStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "CONFIRMED"
  | "COURIER_ASSIGNMENT"
  | "COURIER_ASSIGNED"
  | "COURIER_ACCEPTED"
  | "COURIER_ARRIVING"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "NEAR_DESTINATION"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "DELIVERY_FAILED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "PENDING_COD"
  | "COD_COLLECTED"
  | "COD_PENDING";

export type PaymentMethod =
  | "DUMMY_CARD"
  | "DUMMY_WALLET"
  | "CASH_ON_DELIVERY"
  | "DUMMY_MOBILE";

export type ServiceType = "INSTANT" | "SAME_DAY" | "REGULAR" | "SCHEDULED";

export type PackageType =
  | "DOCUMENT"
  | "SMALL_PARCEL"
  | "MEDIUM_PARCEL"
  | "LARGE_PARCEL"
  | "FOOD"
  | "OTHER";

export type VehicleType = "BIKE" | "THREE_WHEELER" | "CAR" | "VAN" | "WALK";

export type CourierStatus =
  | "ONLINE"
  | "OFFLINE"
  | "BUSY"
  | "SUSPENDED"
  | "PENDING_VERIFICATION";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING" | "RESOLVED" | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type NotificationType =
  | "ORDER_CONFIRMED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "COURIER_ASSIGNED"
  | "COURIER_ACCEPTED"
  | "COURIER_ARRIVING"
  | "PACKAGE_PICKED_UP"
  | "COURIER_NEARBY"
  | "DELIVERY_COMPLETED"
  | "REFUND_COMPLETED"
  | "COUPON_APPLIED"
  | "SUPPORT_REPLY"
  | "PROMOTION"
  | "SYSTEM_ALERT";

export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_DELIVERY";

export type WalletTransactionType = "DEMO_TOPUP" | "PAYMENT" | "REFUND" | "ADJUSTMENT";

/* -------------------------------------------------------------------------- */
/*                              Envelope / paging                             */
/* -------------------------------------------------------------------------- */

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  errorCode: string;
  errors?: ApiFieldError[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  [key: string]: string | number | boolean | undefined;
}

/* -------------------------------------------------------------------------- */
/*                                   Auth                                    */
/* -------------------------------------------------------------------------- */

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  profileImage?: string | null;
  isActive: boolean;
  isBlocked: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string | null;
  rating: number;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  isBlocked?: boolean;
  isVerified?: boolean;
  blockedReason?: string | null;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  wallet?: Wallet;
  unreadNotifications?: number;
}

export interface AdminProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  permissions: string[];
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  device?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                  Address                                   */
/* -------------------------------------------------------------------------- */

export interface Address {
  id: string;
  userId: string;
  label: string;
  recipientName?: string;
  contactNumber?: string;
  addressLine: string;
  city: string;
  province?: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  deliveryInstructions?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Package                                   */
/* -------------------------------------------------------------------------- */

export interface PackageDetails {
  type: PackageType;
  weight: number;
  length: number;
  width: number;
  height: number;
  quantity: number;
  isFragile: boolean;
  isTemperatureSensitive?: boolean;
  requiresSpecialHandling?: boolean;
  description?: string;
  specialInstructions?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Delivery service                              */
/* -------------------------------------------------------------------------- */

export interface DeliveryService {
  id: string;
  code: ServiceType;
  name: string;
  description: string;
  basePrice: number;
  pricePerKm: number;
  estimatedMinutes: number;
  vehicleType: VehicleType;
  isActive: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              Price breakdown                              */
/* -------------------------------------------------------------------------- */

export interface PriceBreakdown {
  baseFee: number;
  distanceFee: number;
  distanceKm: number;
  serviceFee: number;
  insurance: number;
  priorityFee: number;
  handlingFee: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

/* -------------------------------------------------------------------------- */
/*                                 Delivery                                   */
/* -------------------------------------------------------------------------- */

export interface Delivery {
  id: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  pickupAddress: Address;
  deliveryAddress: Address;
  package: PackageDetails;
  serviceType: ServiceType;
  serviceName?: string;
  distanceKm: number;
  durationMinutes: number;
  price: PriceBreakdown;
  status: OrderStatus;
  courier?: Courier | null;
  vehicle?: Vehicle | null;
  trackingCode: string;
  courierInstructions?: string;
  deliveryInstructions?: string;
  scheduledFor?: string | null;
  etaMinutes?: number | null;
  progressPercent?: number;
  isDelayed?: boolean;
  proofOfDelivery?: ProofOfDelivery | null;
  review?: Review | null;
  createdAt: string;
  updatedAt: string;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
}

export interface ProofOfDelivery {
  receiverName: string;
  note?: string;
  signatureDataUrl?: string;
  confirmedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                   Order                                    */
/* -------------------------------------------------------------------------- */

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  couponCode?: string | null;
  discount: number;
  pickupAddress: Address;
  deliveryAddress: Address;
  serviceType: ServiceType;
  distanceKm: number;
  courier?: Courier | null;
  estimatedDelivery?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface StatusHistoryEntry {
  _id?: string;
  status: OrderStatus;
  label: string;
  note?: string;
  actorId?: string;
  actorRole?: Role | "COURIER" | "SYSTEM";
  actorName?: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Payment                                   */
/* -------------------------------------------------------------------------- */

export interface Payment {
  id: string;
  transactionId: string;
  orderId: string;
  orderRef?: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: PaymentStatus;
  maskedCardNumber?: string;
  cardBrand?: string;
  lastFour?: string;
  cardHolderName?: string;
  failureReason?: string | null;
  refundAmount: number;
  refundReason?: string | null;
  idempotencyKey?: string;
  isDemo: true;
  createdAt: string;
  updatedAt: string;
  paidAt?: string | null;
  refundedAt?: string | null;
}

export interface DummyCardInput {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Wallet                                    */
/* -------------------------------------------------------------------------- */

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isActive: boolean;
  isDemo: true;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  balanceAfter: number;
  description: string;
  orderId?: string | null;
  status: "COMPLETED" | "FAILED" | "PENDING";
  isDemo: true;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Coupon                                    */
/* -------------------------------------------------------------------------- */

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maximumDiscount?: number | null;
  minimumOrder: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  perCustomerLimit?: number;
  isActive: boolean;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponWithState extends Coupon {
  state: "AVAILABLE" | "USED" | "EXPIRED" | "INACTIVE";
  usedAt?: string | null;
  discountPreview?: number;
}

export interface CouponValidation {
  valid: boolean;
  message: string;
  discount: number;
  coupon?: Coupon;
}

export interface Promotion {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  bannerImage?: string | null;
  code?: string | null;
  badgeText?: string;
  ctaLabel?: string;
  ctaHref?: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                              Courier / vehicle                             */
/* -------------------------------------------------------------------------- */

export interface Courier {
  id: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone: string;
  photoUrl?: string | null;
  status: CourierStatus;
  isVerified: boolean;
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  cancelledDeliveries: number;
  acceptanceRate: number;
  onTimeRate: number;
  totalDistanceKm: number;
  currentLocation?: Coordinates | null;
  vehicle?: Vehicle | null;
  activeOrderId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  courierId?: string | null;
  type: VehicleType;
  registrationNumber: string;
  model: string;
  color?: string;
  status: "ACTIVE" | "MAINTENANCE" | "INACTIVE";
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Tracking                                  */
/* -------------------------------------------------------------------------- */

export interface TrackingLocation {
  id?: string;
  courierId: string;
  deliveryId: string;
  orderRef?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface TrackingSnapshot {
  deliveryId: string;
  orderId: string;
  status: OrderStatus;
  eta: number;
  distanceKm: number;
  progressPercent: number;
  courier: Courier | null;
  vehicle: Vehicle | null;
  pickup: Address;
  destination: Address;
  currentLocation: Coordinates | null;
  route: RoutePoint[];
  locations: TrackingLocation[];
  lastUpdatedAt: string;
  isDelayed: boolean;
}

export interface LiveDelivery {
  deliveryId: string;
  orderId: string;
  status: OrderStatus;
  customerName: string;
  courierId: string;
  courierName: string;
  courierStatus: CourierStatus;
  vehicleType: VehicleType;
  pickup: Coordinates;
  destination: Coordinates;
  currentLocation: Coordinates | null;
  etaMinutes: number;
  progressPercent: number;
  isDelayed: boolean;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                Notification                                */
/* -------------------------------------------------------------------------- */

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
  actionUrl?: string | null;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Support                                   */
/* -------------------------------------------------------------------------- */

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: Role | "CUSTOMER";
  senderName: string;
  body: string;
  attachments?: string[];
  isStaff: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketRef: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subject: string;
  category: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  orderRef?: string | null;
  assignedAdminId?: string | null;
  assignedAdminName?: string | null;
  attachments?: string[];
  messages?: SupportMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                                   Review                                   */
/* -------------------------------------------------------------------------- */

export interface Review {
  id: string;
  customerId: string;
  customerName?: string;
  courierId: string;
  deliveryId: string;
  orderRef?: string;
  rating: number;
  comment?: string;
  courierRating?: number;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Settings                                  */
/* -------------------------------------------------------------------------- */

export interface NotificationPreferences {
  orderUpdates: boolean;
  paymentUpdates: boolean;
  courierUpdates: boolean;
  promotions: boolean;
  emailDigest: boolean;
  smsAlerts: boolean;
  pushAlerts: boolean;
}

export interface AppSettings {
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;
  taxRate: number;
  insuranceRate: number;
  maxWeightKg: number;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  allowCod: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 Audit log                                  */
/* -------------------------------------------------------------------------- */

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "REGISTER"
  | "CREATE_ORDER"
  | "UPDATE_ORDER"
  | "CANCEL_ORDER"
  | "ASSIGN_COURIER"
  | "PAYMENT_CREATED"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "REFUND_CREATED"
  | "REFUND_COMPLETED"
  | "COD_COLLECTED"
  | "CUSTOMER_BLOCKED"
  | "CUSTOMER_UNBLOCKED"
  | "COUPON_CREATED"
  | "COUPON_UPDATED"
  | "COUPON_DELETED"
  | "SETTINGS_UPDATED";

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                                  Analytics                                 */
/* -------------------------------------------------------------------------- */

export interface AnalyticsRange {
  from: string;
  to: string;
  label: string;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  value: number;
}

export interface AdminOverviewMetrics {
  demoRevenue: number;
  demoRevenueToday: number;
  totalOrders: number;
  ordersToday: number;
  activeDeliveries: number;
  completedDeliveries: number;
  failedDeliveries: number;
  delayedDeliveries: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalCouriers: number;
  availableCouriers: number;
  busyCouriers: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  refundedPayments: number;
  codPending: number;
  totalTransactions: number;
  openTickets: number;
  averageDeliveryMinutes: number;
  averageRating: number;
  discountTotal: number;
  refundTotal: number;
}

export interface AdminAnalytics {
  overview: AdminOverviewMetrics;
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    failed: number;
    active: number;
    daily: TimeSeriesPoint[];
    byStatus: { name: string; value: number }[];
    byService: { name: string; value: number }[];
  };
  payments: {
    demoRevenue: number;
    totalTransactions: number;
    successful: number;
    failed: number;
    pending: number;
    refunded: number;
    codPending: number;
    byMethod: { name: string; value: number }[];
    daily: TimeSeriesPoint[];
  };
  deliveries: {
    active: number;
    completed: number;
    failed: number;
    averageMinutes: number;
    averageDistanceKm: number;
    byVehicle: { name: string; value: number }[];
  };
  customers: {
    total: number;
    newThisMonth: number;
    active: number;
    returning: number;
    daily: TimeSeriesPoint[];
    top: { id: string; name: string; email: string; orders: number; spent: number }[];
  };
  couriers: {
    total: number;
    online: number;
    busy: number;
    averageRating: number;
    performance: {
      id: string;
      name: string;
      deliveries: number;
      rating: number;
      onTimeRate: number;
      acceptanceRate: number;
      distanceKm: number;
    }[];
  };
  heatmap: { latitude: number; longitude: number; weight: number; pickups: number; dropoffs: number }[];
}

/* -------------------------------------------------------------------------- */
/*                              Customer dashboard                            */
/* -------------------------------------------------------------------------- */

export interface CustomerDashboard {
  greeting: { firstName: string; lastName: string };
  activeDelivery: Delivery | null;
  nextDelivery: Delivery | null;
  stats: {
    activeDeliveries: number;
    completedDeliveries: number;
    totalOrders: number;
    totalSpent: number;
    walletBalance: number;
    cancelledOrders: number;
    savedAddresses: number;
    availableCoupons: number;
  };
  recentOrders: Order[];
  recentPayments: Payment[];
  unreadNotifications: number;
  alerts: DeliveryAlert[];
}

export interface DeliveryAlert {
  id: string;
  type: "DELAY" | "INACTIVITY" | "ROUTE_DEVIATION" | "PAYMENT" | "UNAVAILABLE" | "ASSIGNMENT_TIMEOUT";
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  orderRef?: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/*                              Operations center                             */
/* -------------------------------------------------------------------------- */

export interface OperationsSnapshot {
  activeDeliveries: number;
  availableCouriers: number;
  busyCouriers: number;
  pendingOrders: number;
  delayedDeliveries: number;
  completedToday: number;
  demoRevenueToday: number;
  couriers: Courier[];
  deliveries: LiveDelivery[];
  updatedAt: string;
}
