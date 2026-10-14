import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators';
import { ErrorCode } from '../enums';
import type { AuthUser, JwtAccessPayload } from '../types';
import { SessionStateService, type SessionState } from '../session-state.service';

export const ACCESS_COOKIE = 'grx_access_token';
export const REFRESH_COOKIE = 'grx_refresh_token';

/**
 * Authenticates every non-public request.
 *
 * Verification is two-stage: the JWT signature and claims first, then a live
 * session lookup. The second stage is what makes logout, refresh rotation,
 * reuse detection, password changes and admin blocks effective immediately
 * rather than whenever the short-lived access token happens to expire.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly sessionState: SessionStateService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const token = this.extractToken(request);
    if (!token) {
      throw this.unauthorized('Authentication required', ErrorCode.UNAUTHORIZED);
    }

    const payload = await this.verify(token);
    await this.assertSessionIsLive(payload);

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sid,
    };
    return true;
  }

  private async verify(token: string): Promise<JwtAccessPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });

      // A refresh token is signed with a different secret, so this is a
      // belt-and-braces check for misconfigured secrets and token confusion.
      if (payload.type !== 'access') {
        throw this.unauthorized('Invalid token type', ErrorCode.UNAUTHORIZED);
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;

      const expired = error instanceof Error && error.name === 'TokenExpiredError';
      throw this.unauthorized(
        expired ? 'Access token has expired' : 'Invalid or malformed access token',
        expired ? ErrorCode.TOKEN_EXPIRED : ErrorCode.UNAUTHORIZED,
      );
    }
  }

  private async assertSessionIsLive(payload: JwtAccessPayload): Promise<void> {
    const state = await this.sessionState.assertUsable(payload.sid, payload.sub);

    switch (state) {
      case 'active':
        return;
      case 'expired':
        throw this.unauthorized('Access token has expired', ErrorCode.TOKEN_EXPIRED);
      case 'user_inactive':
      case 'password_changed':
        // The credentials are genuine but no longer usable. 401 lets the client
        // run its refresh-and-retry path, which will also fail and surface a
        // re-login prompt.
        throw this.unauthorized(this.messageFor(state), ErrorCode.UNAUTHORIZED);
      case 'revoked':
      case 'not_found':
      default:
        throw this.unauthorized(
          'Session is no longer valid. Please sign in again.',
          ErrorCode.UNAUTHORIZED,
        );
    }
  }

  private messageFor(state: SessionState): string {
    switch (state) {
      case 'user_inactive':
        return 'This account has been deactivated';
      case 'password_changed':
        return 'Password changed. Please sign in again';
      default:
        return 'Session is no longer valid';
    }
  }

  private extractToken(request: Request): string | undefined {
    const cookies = request.cookies as Record<string, string> | undefined;
    const fromCookie = cookies?.[ACCESS_COOKIE];
    if (fromCookie) return fromCookie;

    // Bearer fallback, required for Postman / Swagger "Authorize" flows and
    // native mobile clients. Cookies stay the primary channel for the web app.
    const header = request.headers.authorization;
    if (header?.startsWith('Bearer ')) return header.slice(7).trim() || undefined;
    return undefined;
  }

  private unauthorized(message: string, code: ErrorCode): UnauthorizedException {
    return new UnauthorizedException({ message, code });
  }
}
