import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, type MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import { ALL_MODELS } from './schemas';

/** Factory that registers every schema on a single named connection. */
export function databaseOptionsFactory(config: ConfigService): MongooseModuleFactoryOptions {
  const uri = config.get<string>('database.uri');

  return {
    uri: uri as string,
    // Fail fast rather than buffering forever when Mongo is unreachable.
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    minPoolSize: 2,
    autoIndex: config.get<string>('app.nodeEnv') !== 'production',
    retryWrites: true,
    retryReads: true,
  };
}

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseOptionsFactory,
    }),
    MongooseModule.forFeature(ALL_MODELS),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
