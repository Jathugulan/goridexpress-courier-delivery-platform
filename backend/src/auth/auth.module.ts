import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';

/**
 * Global because authentication is a cross-cutting concern: the realtime
 * gateway, audit interceptor and admin guards all depend on `TokenService`.
 *
 * Mongoose models are not re-registered here — `DatabaseModule` is `@Global`
 * and already exposes every schema through `MongooseModule`.
 */
@Global()
@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        // `ms` narrows `expiresIn` to its own string-literal union, so the
        // config value needs an explicit cast.
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
  exports: [AuthService, TokenService, JwtModule],
})
export class AuthModule {}
