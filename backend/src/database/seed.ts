/**
 * Seeds the two demo identities advertised on the web sign-in screen.
 *
 * The login form renders `DemoCredentialHint` cards with a "Fill" button for
 * both accounts, so those credentials have to exist or the demo is unusable:
 * `POST /auth/login` correctly answers 401 and there is no way in.
 *
 * These emails are only ever referenced from
 * `frontend/src/constants/design.ts` (`DEMO_CREDENTIALS`) and from the Swagger
 * `@ApiProperty` examples. Keep the two sides in sync.
 *
 * Run with:  npm run seed
 *
 * Idempotent — re-running updates the password hash and profile in place
 * instead of failing on the unique email index, so a changed demo password is
 * picked up by simply running it again.
 */
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { TokenService } from '../auth/token.service';
import { Role } from '../common/enums';
import { Customer, User, Wallet, type UserDocument } from './schemas';

interface DemoUser {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  /** Customers additionally need a profile and a wallet to be usable. */
  withCustomerProfile: boolean;
  /** Starting demo balance, in the wallet's currency. */
  walletBalance: number;
}

const DEMO_USERS: readonly DemoUser[] = [
  {
    email: 'customer@goridexpress.demo',
    password: 'Customer@123',
    role: Role.CUSTOMER,
    firstName: 'Chamodi',
    lastName: 'Perera',
    withCustomerProfile: true,
    walletBalance: 250,
  },
  {
    email: 'admin@goridexpress.demo',
    password: 'Admin@123',
    role: Role.ADMIN,
    firstName: 'Kasun',
    lastName: 'Fernando',
    withCustomerProfile: false,
    walletBalance: 0,
  },
];

async function seed(): Promise<void> {
  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const config = app.get(ConfigService);
    const nodeEnv = config.get<string>('app.nodeEnv') ?? 'development';

    // These are published in the UI and the Swagger examples. Refuse to create
    // them anywhere that could be reachable by real users.
    if (nodeEnv === 'production') {
      throw new Error(
        'Refusing to seed demo accounts with NODE_ENV=production. ' +
          'The credentials are printed on the public sign-in screen.',
      );
    }

    const users = app.get<Model<UserDocument>>(getModelToken(User.name));
    const customers = app.get<Model<Customer>>(getModelToken(Customer.name));
    const wallets = app.get<Model<Wallet>>(getModelToken(Wallet.name));
    const tokenService = app.get(TokenService);

    logger.log(`MongoDB: ${config.get<string>('database.uri')}`);

    for (const demo of DEMO_USERS) {
      const passwordHash = await tokenService.hashPassword(demo.password);

      const user = await users.findOneAndUpdate(
        { email: demo.email },
        {
          $set: {
            passwordHash,
            role: demo.role,
            firstName: demo.firstName,
            lastName: demo.lastName,
            isActive: true,
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
            // Re-seeding must not leave a stale lock or a partial session.
            failedLoginAttempts: 0,
            lockedUntil: null,
            passwordChangedAt: new Date(),
          },
          $setOnInsert: { phone: '' },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

      if (demo.withCustomerProfile) {
        // Mirrors AuthService.register so a seeded customer is indistinguishable
        // from a self-registered one: the app resolves the dashboard, saved
        // addresses and the payment flow from these two documents.
        await customers.updateOne(
          { userId: user._id },
          {
            $setOnInsert: {
              preferences: {
                language: 'en',
                timezone: 'UTC',
                notifications: { email: true, sms: false, push: true },
              },
            },
          },
          { upsert: true, setDefaultsOnInsert: true },
        );

        await wallets.updateOne(
          { userId: user._id },
          { $set: { balance: demo.walletBalance, currency: 'USD', isActive: true, isDemo: true } },
          { upsert: true, setDefaultsOnInsert: true },
        );
      }

      logger.log(`${demo.role.padEnd(8)} ${demo.email}  /  ${demo.password}`);
    }

    logger.log(`Done. ${DEMO_USERS.length} demo account(s) ready. Sign in at http://localhost:3000/login`);
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[Seed] Failed:', error);
  process.exit(1);
});
