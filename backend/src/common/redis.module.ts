import { Global, Inject, Injectable, Logger, Module, type OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

/**
 * Thin, failure-tolerant wrapper around ioredis.
 *
 * Redis is a performance dependency (session cache, rate-limit counters, OTP
 * replay protection), never a correctness one. Every method degrades to a
 * no-op when the client is absent so the API still boots and serves traffic.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private healthy = false;

  constructor(
    @Inject(REDIS_CLIENT) private readonly injected: Redis | null,
    private readonly config: ConfigService,
  ) {
    this.client = injected;
  }

  get isHealthy(): boolean {
    return this.healthy;
  }

  async get<T = string>(key: string): Promise<T | null> {
    if (!this.client || !this.healthy) return null;
    try {
      const value = await this.client.get(key);
      return value === null ? null : (JSON.parse(value) as T);
    } catch (error) {
      this.logger.warn(`Redis GET failed for ${key}: ${this.describe(error)}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.healthy) return;
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds) await this.client.set(key, payload, 'EX', ttlSeconds);
      else await this.client.set(key, payload);
    } catch (error) {
      this.logger.warn(`Redis SET failed for ${key}: ${this.describe(error)}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.client || !this.healthy || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (error) {
      this.logger.warn(`Redis DEL failed: ${this.describe(error)}`);
    }
  }

  /** Increments a counter and applies a TTL on first write. */
  async increment(key: string, ttlSeconds: number): Promise<number> {
    if (!this.client || !this.healthy) return 0;
    try {
      const value = await this.client.incr(key);
      if (value === 1) await this.client.expire(key, ttlSeconds);
      return value;
    } catch (error) {
      this.logger.warn(`Redis INCR failed for ${key}: ${this.describe(error)}`);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.healthy) return false;
    try {
      return (await this.client.exists(key)) === 1;
    } catch {
      return false;
    }
  }

  /** Best-effort distributed lock for assignment and idempotency races. */
  async acquireLock(key: string, ttlSeconds = 10): Promise<boolean> {
    if (!this.client || !this.healthy) return true;
    try {
      const token = `${process.pid}-${Date.now()}`;
      const result = await this.client.set(`lock:${key}`, token, 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch {
      return true;
    }
  }

  async releaseLock(key: string): Promise<void> {
    await this.del(`lock:${key}`);
  }

  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const pong = await this.client.ping();
      this.healthy = pong === 'PONG';
      return this.healthy;
    } catch {
      this.healthy = false;
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }

  private describe(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

/** Creates the client, or `null` when Redis is disabled or unreachable. */
export function createRedisClient(config: ConfigService): Redis | null {
  const enabled = config.get<boolean>('redis.enabled') ?? true;
  if (!enabled) {
    new Logger('Redis').warn('REDIS_ENABLED=false — running without Redis cache.');
    return null;
  }

  const url = config.get<string>('redis.url');
  const client = new Redis(url as string, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    connectTimeout: 5_000,
    enableOfflineQueue: false,
    // Give up quickly: a cache that is not there at boot will not appear while
    // the process is starting, and endless retries only pollute the logs.
    retryStrategy: (times) => (times > 2 ? null : Math.min(times * 300, 1_000)),
  });

  client.on('error', (error) => {
    new Logger('Redis').warn(`Connection error: ${error.message}`);
  });

  client
    .connect()
    .then(async () => {
      const pong = await client.ping().catch(() => null);
      new Logger('Redis').log(
        pong === 'PONG' ? 'Connected and healthy.' : 'Connected but PING failed.',
      );
    })
    .catch((error: Error) => {
      new Logger('Redis').warn(
        `Unavailable (${error.message}). The API will run without Redis.`,
      );
      // Stop the retry loop; all Redis calls degrade to no-ops meanwhile.
      client.disconnect();
    });

  return client;
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => createRedisClient(config),
    },
    RedisService,
  ],
  exports: [RedisService, REDIS_CLIENT],
})
export class RedisModule {}
