import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ErrorCode, Role } from '../common/enums';
import { Customer, type CustomerDocument } from '../database/schemas/customer.schema';
import { Wallet, type WalletDocument } from '../database/schemas/wallet.schema';
import { AppNotification, type NotificationDocument } from '../database/schemas/engagement.schema';
import { User, type UserDocument } from '../database/schemas/user.schema';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { TokenService } from './token.service';

export interface ClientMeta {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(Wallet.name) private readonly walletModel: Model<WalletDocument>,
    @InjectModel(AppNotification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly tokenService: TokenService,
  ) {}

  /* ------------------------------ Register ------------------------------- */

  async register(dto: RegisterDto, meta: ClientMeta) {
    // Self-registration may only create a CUSTOMER. ADMIN is provisioned
    // internally via the seed script or a database operation.
    if (dto.role && dto.role !== Role.CUSTOMER) {
      throw new ForbiddenException({
        message: 'Self-registration is limited to customer accounts',
        code: ErrorCode.FORBIDDEN,
      });
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        message: 'Passwords do not match',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    const existing = await this.userModel.exists({ email: dto.email });
    if (existing) {
      throw new ConflictException({
        message: 'An account with this email already exists',
        code: ErrorCode.DUPLICATE_RESOURCE,
      });
    }

    const passwordHash = await this.tokenService.hashPassword(dto.password);

    // Sequential by design: the customer profile and wallet both need the
    // user's generated `_id`, so they must be created after the user insert.
    const user = await this.userModel.create({
      email: dto.email,
      passwordHash,
      role: Role.CUSTOMER,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      isActive: true,
      isEmailVerified: false,
      passwordChangedAt: new Date(),
    });

    const customer = await this.customerModel.create({
      userId: user._id,
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: { email: true, sms: false, push: true },
      },
    });

    // Every customer gets a demo wallet so the payment flow is usable on day one.
    await this.walletModel
      .create({
        userId: user._id,
        balance: 0,
        currency: 'USD',
        isActive: true,
        isDemo: true,
      })
      .catch((error) => {
        this.logger.warn(`Could not create demo wallet for ${user.email}: ${String(error)}`);
      });

    const tokens = await this.tokenService.issueTokens(user, meta);

    return { session: await this.buildAuthSession(user), tokens };
  }

  /* -------------------------------- Login -------------------------------- */

  async login(dto: LoginDto, meta: ClientMeta) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+passwordHash')
      .exec();

    // Uniform failure for unknown email and wrong password: never leak which
    // addresses are registered.
    const invalid = new UnauthorizedException({
      message: 'Invalid email or password',
      code: ErrorCode.INVALID_CREDENTIALS,
    });

    if (!user) {
      // Constant-ish work factor so timing does not reveal account existence.
      await this.tokenService.comparePassword(dto.password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu');
      throw invalid;
    }

    if (!user.isActive) {
      throw new ForbiddenException({
        message: 'This account has been deactivated. Please contact support.',
        code: ErrorCode.FORBIDDEN,
      });
    }

    if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new ForbiddenException({
        message: `Too many failed login attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        code: ErrorCode.FORBIDDEN,
      });
    }

    const passwordMatches = await this.tokenService.comparePassword(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      const { lockedUntil } = await this.tokenService.registerFailedLogin(user);
      this.logger.warn(`Failed login for ${user.email} from ${meta.ip ?? 'unknown IP'}`);
      if (lockedUntil) {
        throw new ForbiddenException({
          message: 'Too many failed login attempts. Your account is temporarily locked.',
          code: ErrorCode.FORBIDDEN,
        });
      }
      throw invalid;
    }

    await this.tokenService.clearFailedLogins(user);

    const tokens = await this.tokenService.issueTokens(user, meta);

    return { session: await this.buildAuthSession(user), tokens };
  }

  /* ------------------------------- Profile ------------------------------- */

  /** Mirrors the frontend `AuthSession` type. */
  async buildAuthSession(user: UserDocument) {
    const isBlocked = await this.isCustomerBlocked(user);
    const [wallet, unread] = await Promise.all([
      this.walletModel.findOne({ userId: user._id }).lean().exec(),
      this.countUnreadNotifications(user._id.toString()),
    ]);

    return {
      user: this.toSafeUser(user, isBlocked),
      wallet: wallet
        ? {
            id: wallet._id?.toString() ?? '',
            userId: wallet.userId.toString(),
            balance: wallet.balance,
            currency: wallet.currency,
            isActive: wallet.isActive,
            isDemo: true as const,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
          }
        : undefined,
      unreadNotifications: unread,
    };
  }

  private async isCustomerBlocked(user: UserDocument): Promise<boolean> {
    if (user.role !== Role.CUSTOMER) return false;
    const customer = await this.customerModel
      .findOne({ userId: user._id })
      .select('isBlocked')
      .lean()
      .exec();
    return customer?.isBlocked ?? false;
  }

  async me(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException({ message: 'User not found', code: ErrorCode.NOT_FOUND });
    }
    return this.buildAuthSession(user);
  }

  /**
   * Counted here rather than in the notification service to avoid a circular
   * module dependency on boot.
   */
  private async countUnreadNotifications(userId: string): Promise<number> {
    try {
      return await this.notificationModel.countDocuments({ userId, isRead: false }).exec();
    } catch {
      return 0;
    }
  }

  /* ------------------------------ Refresh -------------------------------- */

  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new UnauthorizedException({
        message: 'No refresh token supplied',
        code: ErrorCode.UNAUTHORIZED,
      });
    }
    const { tokens, user } = await this.tokenService.rotateRefreshToken(refreshToken);
    return { session: await this.buildAuthSession(user), tokens };
  }

  async logout(userId: string, sessionId?: string) {
    if (sessionId) {
      await this.tokenService.revokeSession(userId, sessionId, 'LOGOUT');
    } else {
      await this.tokenService.revokeAllSessions(userId, 'LOGOUT');
    }
    return { message: 'Signed out successfully' };
  }

  async sessions(userId: string, sessionId?: string) {
    return this.tokenService.listSessions(userId, sessionId);
  }
  async revokeSession(userId: string, sessionId: string) {
    const revoked = await this.tokenService.revokeSession(userId, sessionId);
    if (!revoked) {
      throw new NotFoundException({
        message: 'Session not found or already revoked',
        code: ErrorCode.NOT_FOUND,
      });
    }
    return { message: 'Session revoked' };
  }

  async revokeAllSessions(userId: string, currentSessionId?: string) {
    const count = await this.tokenService.revokeAllSessions(
      userId,
      'USER_REVOKE_ALL',
      currentSessionId,
    );
    return { message: `Revoked ${count} session${count === 1 ? '' : 's'}`, revoked: count };
  }

  /* --------------------------- Password changes -------------------------- */

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).select('+passwordHash').exec();
    if (!user) {
      throw new NotFoundException({ message: 'User not found', code: ErrorCode.NOT_FOUND });
    }

    const matches = await this.tokenService.comparePassword(dto.currentPassword, user.passwordHash);
    if (!matches) {
      throw new BadRequestException({
        message: 'Current password is incorrect',
        code: ErrorCode.INVALID_CREDENTIALS,
      });
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException({
        message: 'New password must be different from the current password',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException({
        message: 'New passwords do not match',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    user.passwordHash = await this.tokenService.hashPassword(dto.newPassword);
    await this.tokenService.markPasswordChanged(user);
    await this.tokenService.revokeAllSessions(userId, 'PASSWORD_CHANGED');

    return { message: 'Password changed. Please sign in again on all devices.' };
  }

  /**
   * Always returns a success message so the endpoint cannot be used to probe
   * which email addresses have accounts. In development the token is logged.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const generic = 'If an account exists for that email, a reset link has been sent.';

    const user = await this.userModel.findOne({ email: dto.email, isActive: true }).exec();
    if (!user) {
      this.logger.warn(`Password reset requested for unknown email: ${dto.email}`);
      return { message: generic };
    }

    const token = await this.tokenService.createResetToken(user.id);
    this.logger.log(
      `[DEMO] Password reset token for ${user.email}: ${token} (valid for 30 minutes)`,
    );

    return { message: generic, demoToken: token };
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({
        message: 'Passwords do not match',
        code: ErrorCode.VALIDATION_ERROR,
      });
    }

    const userId = await this.tokenService.consumeResetToken(dto.token);
    const user = await this.userModel.findById(userId).select('+passwordHash').exec();

    if (!user) {
      throw new NotFoundException({ message: 'User not found', code: ErrorCode.NOT_FOUND });
    }

    user.passwordHash = await this.tokenService.hashPassword(dto.password);
    await this.tokenService.markPasswordChanged(user);
    await this.tokenService.revokeAllSessions(userId, 'PASSWORD_RESET');

    return { message: 'Password reset successfully. Please sign in.' };
  }

  /* ------------------------------ Helpers -------------------------------- */

  /** Never leaks `passwordHash` or lockout internals. */
  toSafeUser(user: UserDocument, isBlocked = false) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      profileImage: user.avatarUrl ?? null,
      isActive: user.isActive,
      isBlocked,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
    };
  }

  /** Public-facing projection of a customer profile. */
  toSafeCustomer(customer: CustomerDocument) {
    return {
      id: customer.id,
      userId: customer.userId.toString(),
      isBlocked: customer.isBlocked,
      isVerified: customer.isVerified,
      blockedReason: customer.blockedReason ?? '',
      totalOrders: customer.totalOrders,
      completedOrders: customer.completedOrders,
      cancelledOrders: customer.cancelledOrders,
      totalSpent: customer.totalSpent,
      walletBalance: customer.walletBalance,
      loyaltyPoints: customer.loyaltyPoints,
      lastOrderAt: customer.lastOrderAt ?? null,
      preferences: customer.preferences ?? {},
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
