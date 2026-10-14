/**
 * Boot-time environment validation.
 *
 * The process refuses to start when a required secret is missing or weak, so
 * a misconfigured deploy fails fast instead of silently signing tokens with a
 * default value.
 */
export interface EnvSchema {
  NODE_ENV: string;
  PORT: string;
  API_PREFIX: string;
  API_VERSION: string;
  MONGODB_URI: string;
  REDIS_URL: string;
  REDIS_ENABLED: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  COOKIE_DOMAIN: string;
  COOKIE_SECURE: string;
  COOKIE_SAME_SITE: string;
  CORS_ORIGIN: string;
  FRONTEND_URL: string;
  UPLOAD_MAX_SIZE: string;
  UPLOAD_DIR: string;
  THROTTLE_TTL_SECONDS: string;
  THROTTLE_LIMIT: string;
  THROTTLE_LOGIN_LIMIT: string;
  THROTTLE_REGISTER_LIMIT: string;
  THROTTLE_PAYMENT_LIMIT: string;
  PAYMENT_SIMULATION_DELAY_MS: string;
  DEMO_SEED_ON_BOOT: string;
}

const MIN_SECRET_LENGTH = 32;

const REQUIRED_IN_PRODUCTION = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CORS_ORIGIN',
  'FRONTEND_URL',
] as const;

const NUMERIC = new Set([
  'PORT',
  'UPLOAD_MAX_SIZE',
  'THROTTLE_TTL_SECONDS',
  'THROTTLE_LIMIT',
  'THROTTLE_LOGIN_LIMIT',
  'THROTTLE_REGISTER_LIMIT',
  'THROTTLE_PAYMENT_LIMIT',
  'PAYMENT_SIMULATION_DELAY_MS',
]);

const BOOLEAN = new Set(['REDIS_ENABLED', 'COOKIE_SECURE', 'DEMO_SEED_ON_BOOT']);

export function validateEnv(config: Record<string, unknown>): EnvSchema {
  const errors: string[] = [];
  const isProduction = config.NODE_ENV === 'production';
  const get = (key: string) => (config[key] === undefined ? '' : String(config[key]));

  for (const key of REQUIRED_IN_PRODUCTION) {
    if (isProduction && !get(key).trim()) {
      errors.push(`${key} is required when NODE_ENV=production`);
    }
  }

  for (const key of ['PORT', ...NUMERIC]) {
    if (!NUMERIC.has(key)) continue;
    const raw = get(key);
    if (raw === '') continue;
    const value = Number(raw);
    if (!Number.isFinite(value) || value < 0) {
      errors.push(`${key} must be a non-negative number (received "${raw}")`);
    }
  }

  for (const key of BOOLEAN) {
    const raw = get(key);
    if (raw === '') continue;
    if (raw !== 'true' && raw !== 'false') {
      errors.push(`${key} must be "true" or "false" (received "${raw}")`);
    }
  }

  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    const value = get(key);
    if (!value) continue;
    if (value.length < MIN_SECRET_LENGTH) {
      errors.push(`${key} must be at least ${MIN_SECRET_LENGTH} characters`);
    }
  }

  const access = get('JWT_ACCESS_SECRET');
  const refresh = get('JWT_REFRESH_SECRET');
  if (access && refresh && access === refresh) {
    errors.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values');
  }

  if (get('COOKIE_SECURE') === 'true' && get('COOKIE_SAME_SITE') !== 'none') {
    errors.push('COOKIE_SAME_SITE must be "none" when COOKIE_SECURE is true');
  }

  if (get('REDIS_URL') && !/^rediss?:\/\//.test(get('REDIS_URL'))) {
    errors.push('REDIS_URL must start with redis:// or rediss://');
  }

  if (get('MONGODB_URI') && !/^mongodb(\+srv)?:\/\//.test(get('MONGODB_URI'))) {
    errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n  - ${errors.join('\n  - ')}\n\n` +
        'Copy backend/.env.example to backend/.env and fill in the values.',
    );
  }

  return config as unknown as EnvSchema;
}
