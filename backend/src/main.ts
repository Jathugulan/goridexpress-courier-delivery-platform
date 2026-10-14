import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { validationPipeOptions } from './common/pipes/validation';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
    rawBody: false,
  });

  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>('app.nodeEnv') ?? 'development';
  const isProduction = nodeEnv === 'production';
  const port = config.get<number>('app.port') ?? 5000;
  const apiPrefix = config.get<string>('app.apiPrefix') ?? 'api';
  const apiVersion = config.get<string>('app.apiVersion') ?? 'v1';
  const frontendUrl = config.get<string>('app.frontendUrl') ?? 'http://localhost:3000';

  /* ----------------------------- Global prefix ----------------------------- */
  // Every route, including /health, lives under /api/v1. Swagger is mounted
  // separately at /api/docs because SwaggerModule.setup uses an absolute path.
  app.setGlobalPrefix(apiPrefix);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion.replace(/^v/, ''),
    // `prefix: 'v'` produces /api/v1/... rather than /api/...
    prefix: 'v',
  });

  /* -------------------------------- Security ------------------------------- */
  app.use(
    helmet({
      // Swagger UI and the Socket.IO handshake both need cross-origin reads.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );

  const origins = config.get<string[]>('cors.origins') ?? [frontendUrl];
  app.enableCors({
    origin: (origin, callback) => {
      // Same-origin, curl and server-to-server calls send no Origin header.
      if (!origin) return callback(null, true);
      if (origins.includes(origin) || origins.includes('*')) return callback(null, true);
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      return callback(new Error('Origin not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Accept',
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'X-Requested-With',
      // Sent by the web client's axios instance (frontend/src/lib/api/client.ts).
      'X-Client',
      'X-Success-Message',
    ],
    exposedHeaders: ['X-Total-Count', 'Idempotency-Replayed'],
    maxAge: 86400,
  });

  app.use(compression());
  app.use(cookieParser());
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  /* ------------------------------ Trust proxy ----------------------------- */
  if (isProduction) {
    app.set('trust proxy', 1);
  }

  /* ------------------------- Global pipes/interceptors ------------------- */
  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  /* ------------------------------- Swagger -------------------------------- */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('GoRideXpress API')
    .setDescription(
      'REST + realtime API for the GoRideXpress courier and delivery platform.\n\n' +
        '**All payments are simulated.** No real payment gateway is integrated. ' +
        'No card number or CVV is ever stored.',
    )
    .setVersion('1.0.0')
    .addTag('auth', 'Registration, login, token refresh and sessions')
    .addTag('customers', 'Customer profile, preferences and dashboard')
    .addTag('addresses', 'Customer address book')
    .addTag('deliveries', 'Delivery booking, quotes and lifecycle')
    .addTag('orders', 'Order history, cancellation and reorder')
    .addTag('payments', 'Simulated payments, refunds and COD')
    .addTag('wallet', 'Demo wallet balance and statements')
    .addTag('coupons', 'Coupon discovery and validation')
    .addTag('promotions', 'Active marketing campaigns')
    .addTag('tracking', 'Public and authenticated delivery tracking')
    .addTag('notifications', 'In-app notification feed')
    .addTag('support', 'Customer support tickets')
    .addTag('reviews', 'Post-delivery ratings')
    .addTag('public', 'Unauthenticated catalogue and contact endpoints')
    .addTag('admin', 'Administrative operations (ADMIN role only)')
    .addTag('health', 'Liveness and readiness probes')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Optional. The web app authenticates with HTTP-only cookies; ' +
          'this header exists for Postman and native clients.',
      },
      'access-token',
    )
    .addCookieAuth('grx_access_token', {
      type: 'apiKey',
      in: 'cookie',
      name: 'grx_access_token',
      description: 'HTTP-only access token cookie issued at login.',
    })
    .addServer(`http://localhost:${port}`, 'Local')
    .addServer('https://api.goridexpress.com', 'Production')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tagsSorter: 'alpha',
      docExpansion: 'none',
    },
    customSiteTitle: 'GoRideXpress API Docs',
  });

  /* ------------------------------- Shutdown ------------------------------- */
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  logger.log(`Environment      : ${nodeEnv}`);
  logger.log(`API              : http://localhost:${port}/${apiPrefix}/${apiVersion}`);
  logger.log(`Swagger          : http://localhost:${port}/${apiPrefix}/docs`);
  logger.log(`Allowed origins  : ${origins.join(', ')}`);
  if (!isProduction) {
    logger.log('Payments are SIMULATED — no real gateway is connected.');
  }
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('[Bootstrap] Fatal error during startup:', error);
  process.exit(1);
});
