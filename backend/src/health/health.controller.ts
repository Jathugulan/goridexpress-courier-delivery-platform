import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Public } from '../common/decorators';
import { RedisService } from '../common/redis.module';
import type { Connection } from 'mongoose';

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Liveness and dependency status',
    description:
      'Returns 200 when the process is up. Reports MongoDB and Redis status; ' +
      'Redis being down is degraded, not fatal.',
  })
  async check() {
    const mongoState = this.connection.readyState;
    const mongoConnected = mongoState === 1;
    const redisConnected = await this.redis.ping();

    return {
      data: {
        status: mongoConnected ? 'ok' : 'degraded',
        service: 'goridexpress-api',
        environment: process.env.NODE_ENV ?? 'development',
        version: '1.0.0',
        uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
        timestamp: new Date().toISOString(),
        dependencies: {
          mongodb: {
            status: mongoConnected ? 'connected' : 'disconnected',
            state: this.describeMongoState(mongoState),
          },
          redis: {
            status: redisConnected ? 'connected' : 'unavailable',
            // Redis is a cache, so the API stays healthy without it.
            required: false,
          },
        },
        payments: {
          mode: 'simulated',
          isDemo: true,
        },
      },
      message: 'GoRideXpress API health',
    };
  }

  private describeMongoState(state: number): string {
    switch (state) {
      case 0:
        return 'disconnected';
      case 1:
        return 'connected';
      case 2:
        return 'connecting';
      case 3:
        return 'disconnecting';
      default:
        return 'unknown';
    }
  }
}
