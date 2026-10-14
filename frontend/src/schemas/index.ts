import { z } from "zod";
import { MAX_WEIGHT_KG } from "@/lib/pricing";
import { DEMO_TOPUP_AMOUNTS } from "@/constants/design";

/* -------------------------------------------------------------------------- */
/*                              Shared primitives                             */
/* -------------------------------------------------------------------------- */

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(160, "Email is too long")
  .transform((v) => v.trim().toLowerCase());

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^\+?[0-9\s()-]{7,20}$/, "Enter a valid phone number");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be 72 characters or fewer")
  .regex(/[A-Z]/, "Must include an uppercase letter")
  .regex(/[a-z]/, "Must include a lowercase letter")
  .regex(/[0-9]/, "Must include a number")
  .regex(/[^A-Za-z0-9]/, "Must include a special character");

export const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Invalid identifier");

export const nameSchema = z
  .string()
  .min(1, "This field is required")
  .max(60, "Must be 60 characters or fewer");

export const optionalNote = z.string().max(500, "Must be 500 characters or fewer").optional();

/* -------------------------------------------------------------------------- */
/*                                   Auth                                     */
/* -------------------------------------------------------------------------- */

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Profile                                   */
/* -------------------------------------------------------------------------- */

export const profileSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  phone: phoneSchema,
  profileImage: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Address                                   */
/* -------------------------------------------------------------------------- */

export const addressSchema = z.object({
  label: z.string().min(1, "Label is required").max(30),
  recipientName: nameSchema.optional(),
  contactNumber: phoneSchema.optional(),
  addressLine: z.string().min(5, "Enter a complete address").max(200),
  city: z.string().min(2, "City is required").max(80),
  province: z.string().max(80).optional(),
  postalCode: z.string().min(3, "Postal code is required").max(12),
  latitude: z.coerce.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  longitude: z.coerce.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
  deliveryInstructions: z.string().max(300).optional(),
  isDefault: z.boolean().optional(),
});
export type AddressInput = z.infer<typeof addressSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Package                                   */
/* -------------------------------------------------------------------------- */

export const PACKAGE_TYPES = [
  "DOCUMENT",
  "SMALL_PARCEL",
  "MEDIUM_PARCEL",
  "LARGE_PARCEL",
  "FOOD",
  "OTHER",
] as const;

export const packageSchema = z
  .object({
    type: z.enum(PACKAGE_TYPES),
    weight: z.coerce
      .number({ invalid_type_error: "Enter a valid weight" })
      .positive("Weight must be greater than 0")
      .max(MAX_WEIGHT_KG, `Maximum weight is ${MAX_WEIGHT_KG} kg`),
    length: z.coerce.number().positive("Length must be greater than 0").max(300),
    width: z.coerce.number().positive("Width must be greater than 0").max(300),
    height: z.coerce.number().positive("Height must be greater than 0").max(300),
    quantity: z.coerce.number().int("Whole numbers only").min(1).max(50),
    isFragile: z.boolean(),
    isTemperatureSensitive: z.boolean().optional(),
    requiresSpecialHandling: z.boolean().optional(),
    description: z.string().max(240).optional(),
    specialInstructions: z.string().max(300).optional(),
  })
  .refine(
    (data) => data.length * data.width * data.height <= 3_000_000,
    { path: ["length"], message: "Package dimensions are too large" },
  );
export type PackageInput = z.infer<typeof packageSchema>;

/* -------------------------------------------------------------------------- */
/*                              Delivery service                              */
/* -------------------------------------------------------------------------- */

export const SERVICE_TYPES = ["INSTANT", "SAME_DAY", "REGULAR", "SCHEDULED"] as const;

export const deliveryWizardSchema = z
  .object({
    pickup: z.object({
      addressLine: z.string().min(5, "Pickup address is required"),
      latitude: z.number(),
      longitude: z.number(),
    }),
    destination: z.object({
      addressLine: z.string().min(5, "Delivery address is required"),
      latitude: z.number(),
      longitude: z.number(),
    }),
    package: packageSchema,
    serviceType: z.enum(SERVICE_TYPES),
    scheduledFor: z.string().optional(),
    courierInstructions: z.string().max(300).optional(),
  })
  .refine((data) => !(data.scheduledFor && Number.isNaN(Date.parse(data.scheduledFor))), {
    path: ["scheduledFor"],
    message: "Choose a valid delivery slot",
  });
export type DeliveryWizardInput = z.infer<typeof deliveryWizardSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Payment                                   */
/* -------------------------------------------------------------------------- */

export const PAYMENT_METHODS = [
  "DUMMY_CARD",
  "DUMMY_WALLET",
  "CASH_ON_DELIVERY",
  "DUMMY_MOBILE",
] as const;

const digitsOnly = (v: string) => v.replace(/\D/g, "");

export const dummyCardSchema = z.object({
  cardholderName: z.string().min(3, "Cardholder name is required").max(60),
  cardNumber: z
    .string()
    .min(1, "Card number is required")
    .transform(digitsOnly)
    .refine((v) => v.length >= 13 && v.length <= 19, "Enter a valid card number"),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\s?\/\s?\d{2}$/, "Use MM/YY format")
    .refine((value) => {
      const [mm, yy] = value.split("/").map((p) => p.trim());
      const month = Number(mm);
      const year = 2000 + Number(yy);
      if (Number.isNaN(month) || Number.isNaN(year)) return false;
      const now = new Date();
      const expiryEnd = new Date(year, month, 0, 23, 59, 59);
      return expiryEnd >= now;
    }, "Card has expired"),
  cvv: z
    .string()
    .transform(digitsOnly)
    .refine((v) => /^\d{3,4}$/.test(v), "CVV must be 3 or 4 digits"),
});
export type DummyCardInputForm = z.infer<typeof dummyCardSchema>;

export const mobilePaymentSchema = z.object({
  mobileNumber: phoneSchema,
  otp: z
    .string()
    .transform(digitsOnly)
    .refine((v) => v.length === 6, "Enter the 6-digit demo OTP"),
});
export type MobilePaymentInput = z.infer<typeof mobilePaymentSchema>;

export const walletTopUpSchema = z.object({
  amount: z.coerce
    .number()
    .refine(
      (v) => (DEMO_TOPUP_AMOUNTS as readonly number[]).includes(v),
      `Choose one of ${DEMO_TOPUP_AMOUNTS.map((a) => `$${a}`).join(", ")}`,
    ),
});
export type WalletTopUpInput = z.infer<typeof walletTopUpSchema>;

/* -------------------------------------------------------------------------- */
/*                             Coupons / reviews                              */
/* -------------------------------------------------------------------------- */

export const couponSchema = z.object({
  code: z
    .string()
    .min(3, "Code must be at least 3 characters")
    .max(24, "Code must be 24 characters or fewer")
    .transform((v) => v.trim().toUpperCase())
    .pipe(z.string().regex(/^[A-Z0-9_-]+$/, "Use letters, numbers, dashes and underscores only")),
});
export type CouponInput = z.infer<typeof couponSchema>;

export const adminCouponSchema = z.object({
  code: couponSchema.shape.code,
  description: z.string().max(160).optional(),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT", "FREE_DELIVERY"]),
  discountValue: z.coerce.number().min(0, "Value cannot be negative"),
  maximumDiscount: z.coerce.number().min(0).optional().nullable(),
  minimumOrder: z.coerce.number().min(0).default(0),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  usageLimit: z.coerce.number().int().min(1, "Usage limit must be at least 1"),
  perCustomerLimit: z.coerce.number().int().min(1).optional(),
  isActive: z.boolean(),
});
export type AdminCouponInput = z.infer<typeof adminCouponSchema>;

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  courierRating: z.coerce.number().int().min(1).max(5).optional(),
  comment: z.string().max(600, "Comment must be 600 characters or fewer").optional(),
});
export type ReviewInput = z.infer<typeof reviewSchema>;

/* -------------------------------------------------------------------------- */
/*                                  Support                                   */
/* -------------------------------------------------------------------------- */

export const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(140),
  category: z.string().min(1, "Choose a category"),
  description: z
    .string()
    .min(20, "Please describe the issue in at least 20 characters")
    .max(3000, "Description must be 3000 characters or fewer"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  orderRef: z.string().max(24).optional(),
});
export type TicketInput = z.infer<typeof ticketSchema>;

export const ticketReplySchema = z.object({
  body: z.string().min(2, "Reply cannot be empty").max(2000),
});
export type TicketReplyInput = z.infer<typeof ticketReplySchema>;

/* -------------------------------------------------------------------------- */
/*                            Admin: couriers / vehicles                      */
/* -------------------------------------------------------------------------- */

export const courierSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  status: z.enum(["ONLINE", "OFFLINE", "BUSY", "SUSPENDED", "PENDING_VERIFICATION"]),
  isVerified: z.boolean(),
  vehicleId: z.string().optional().nullable(),
});
export type CourierInput = z.infer<typeof courierSchema>;

export const VEHICLE_TYPES = ["BIKE", "THREE_WHEELER", "CAR", "VAN", "WALK"] as const;

export const vehicleSchema = z.object({
  type: z.enum(VEHICLE_TYPES),
  registrationNumber: z.string().min(3, "Registration number is required").max(20),
  model: z.string().min(2, "Model is required").max(60),
  color: z.string().max(30).optional(),
  courierId: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "MAINTENANCE", "INACTIVE"]),
});
export type VehicleInput = z.infer<typeof vehicleSchema>;

/* -------------------------------------------------------------------------- */
/*                            Admin: promotion                               */
/* -------------------------------------------------------------------------- */

export const promotionSchema = z
  .object({
    title: z.string().min(3, "Title is required").max(120),
    subtitle: z.string().max(140).optional(),
    description: z.string().max(400).optional(),
    code: z.string().max(24).optional(),
    badgeText: z.string().max(24).optional(),
    ctaLabel: z.string().max(32).optional(),
    ctaHref: z.string().max(200).optional(),
    startsAt: z.string().min(1),
    endsAt: z.string().min(1),
    isActive: z.boolean(),
    displayOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((d) => Date.parse(d.endsAt) > Date.parse(d.startsAt), {
    path: ["endsAt"],
    message: "End date must be after the start date",
  });
export type PromotionInput = z.infer<typeof promotionSchema>;

/* -------------------------------------------------------------------------- */
/*                              Admin: refund                                 */
/* -------------------------------------------------------------------------- */

export const refundSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than 0"),
  reason: z.string().min(3, "Provide a refund reason").max(200),
  creditToWallet: z.boolean().optional(),
});
export type RefundInput = z.infer<typeof refundSchema>;

/* -------------------------------------------------------------------------- */
/*                             Admin: status update                           */
/* -------------------------------------------------------------------------- */

export const orderStatusSchema = z.object({
  status: z.enum([
    "CREATED",
    "PAYMENT_PENDING",
    "PAYMENT_SUCCESS",
    "CONFIRMED",
    "COURIER_ASSIGNMENT",
    "COURIER_ASSIGNED",
    "COURIER_ACCEPTED",
    "COURIER_ARRIVING",
    "PICKED_UP",
    "IN_TRANSIT",
    "NEAR_DESTINATION",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
    "DELIVERY_FAILED",
    "REFUNDED",
  ]),
  note: z.string().max(240).optional(),
});
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;

export const cancelSchema = z.object({
  reason: z.string().min(5, "Please provide a cancellation reason").max(240),
});

/* -------------------------------------------------------------------------- */
/*                            Public order tracking                           */
/* -------------------------------------------------------------------------- */

export const trackOrderSchema = z.object({
  orderRef: z
    .string()
    .min(6, "Enter the full order ID, e.g. GRX123456")
    .max(24, "That order ID looks too long")
    .transform((v) => v.trim().toUpperCase()),
});
export type TrackOrderInput = z.infer<typeof trackOrderSchema>;

/* -------------------------------------------------------------------------- */
/*                              Contact form                                  */
/* -------------------------------------------------------------------------- */

export const contactSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  subject: z.string().min(3, "Subject is required").max(120),
  message: z.string().min(20, "Message must be at least 20 characters").max(2000),
});
export type ContactInput = z.infer<typeof contactSchema>;
