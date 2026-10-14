import { registerAs } from '@nestjs/config';

/**
 * Typed, tree-shakeable configuration namespaces.
 * Every value is validated in `config/validation.ts` at boot.
 */

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '5000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? 'v1',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  demoSeedOnBoot: process.env.DEMO_SEED_ON_BOOT === 'true',
}));

export const databaseConfig = registerAs('database', () => ({
  uri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/goridexpress',
}));

export const redisConfig = registerAs('redis', () => ({
  enabled: process.env.REDIS_ENABLED !== 'false',
  url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? '',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
}));

export const cookieConfig = registerAs('cookie', () => ({
  domain: process.env.COOKIE_DOMAIN || undefined,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: (process.env.COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none',
}));

export const corsConfig = registerAs('cors', () => ({
  origins: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
}));

export const uploadConfig = registerAs('upload', () => ({
  maxSize: parseInt(process.env.UPLOAD_MAX_SIZE ?? '5242880', 10),
  dir: process.env.UPLOAD_DIR ?? 'uploads',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttlSeconds: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  loginLimit: parseInt(process.env.THROTTLE_LOGIN_LIMIT ?? '10', 10),
  registerLimit: parseInt(process.env.THROTTLE_REGISTER_LIMIT ?? '5', 10),
  paymentLimit: parseInt(process.env.THROTTLE_PAYMENT_LIMIT ?? '20', 10),
}));

export const paymentConfig = registerAs('payment', () => ({
  simulationDelayMs: parseInt(process.env.PAYMENT_SIMULATION_DELAY_MS ?? '1500', 10),
}));

export const configurations = [
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  cookieConfig,
  corsConfig,
  uploadConfig,
  throttleConfig,
  paymentConfig,
];

export type AppConfig = ReturnType<typeof appConfig>;
export type JwtConfig = ReturnType<typeof jwtConfig>;
export type DatabaseConfig = ReturnType<typeof databaseConfig>;
export type RedisConfig = ReturnType<typeof redisConfig>;
export type CorsConfig = ReturnType<typeof corsConfig>;
export type CookieConfig = ReturnType<typeof cookieConfig>;
export type ThrottleConfig = ReturnType<typeof throttleConfig>;
export type PaymentConfig = ReturnType<typeof paymentConfig>;
export type UploadConfig = ReturnType<typeof uploadConfig>;
