import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './common/audit.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { RedisModule } from './common/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SecurityModule } from './common/security.module';
import { configurations } from './config/configuration';
import { validateEnv } from './config/validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      envFilePath: ['.env.local', '.env'],
      load: configurations,
      validate: validateEnv,
    }),

    // Rate limiting is registered before the guards so `@Throttle` decorators
    // resolve against real storage.
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        { name: 'default', ttl: 60_000, limit: 120 },
        { name: 'short', ttl: 1_000, limit: 10 },
        { name: 'long', ttl: 300_000, limit: 20 },
      ],
    }),

    ScheduleModule.forRoot(),
    RedisModule,
    DatabaseModule,
    // Depends on the Session/User models, so it must follow DatabaseModule.
    SecurityModule,
    AuditModule,
    RealtimeModule,
    AuthModule,
    NotificationsModule,
    CustomersModule,
    HealthModule,
  ],
  providers: [
    // Order matters: throttle, then authenticate, then authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
