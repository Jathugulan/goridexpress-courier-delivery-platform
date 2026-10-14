import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser, Public } from '../common/decorators';
import { ErrorCode } from '../common/enums';
import type { AuthUser } from '../common/types';
import { AuthService, type ClientMeta } from './auth.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  RevokeAllSessionsDto,
} from './dto/auth.dto';
import { TokenService } from './token.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly config: ConfigService,
  ) {}

  /* ------------------------------ Register ------------------------------- */

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({
    summary: 'Register a customer account',
    description:
      'Creates a `User` (role CUSTOMER), a `Customer` profile and an empty demo wallet, ' +
      'then issues an access + refresh token pair as HTTP-only cookies.',
  })
  async register(
    @Body() dto: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { session, tokens } = await this.authService.register(
      dto,
      this.clientMeta(request),
    );
    this.tokenService.setAuthCookies(response, tokens);
    return {
      data: { ...session, expiresIn: tokens.expiresIn },
      message: 'Account created successfully',
    };
  }

  /* -------------------------------- Login -------------------------------- */

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @ApiOperation({
    summary: 'Sign in',
    description:
      'Returns the user profile and sets `grx_access_token` / `grx_refresh_token` ' +
      'HTTP-only cookies. Tokens are never placed in localStorage.',
  })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts. Locked for 15 minutes.' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { session, tokens } = await this.authService.login(dto, this.clientMeta(request));
    this.tokenService.setAuthCookies(response, tokens);
    return {
      data: { ...session, expiresIn: tokens.expiresIn },
      message: 'Signed in successfully',
    };
  }

  /* ------------------------------- Refresh ------------------------------- */

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Rotate the refresh token',
    description:
      'Reads `grx_refresh_token` from the cookie (or the request body), revokes the ' +
      'presented session and issues a new pair. Reusing a rotated token revokes every ' +
      'session for that user.',
  })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = this.tokenService.extractRefreshToken(request, dto?.refreshToken);
    const { session, tokens } = await this.authService.refresh(token);
    this.tokenService.setAuthCookies(response, tokens);
    return {
      data: { ...session, expiresIn: tokens.expiresIn },
      message: 'Session refreshed',
    };
  }

  /* -------------------------------- Logout ------------------------------- */

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('grx_access_token')
  @ApiOperation({ summary: 'Sign out and revoke the current session' })
  async logout(@CurrentUser() user: AuthUser, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.logout(user.id, user.sessionId);
    this.tokenService.clearAuthCookies(response);
    return { data: result, message: result.message };
  }

  /* --------------------------------- Me ---------------------------------- */

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('grx_access_token')
  @ApiOperation({ summary: 'Current authenticated user' })
  async me(@CurrentUser() user: AuthUser) {
    return { data: await this.authService.me(user.id), message: 'Current user' };
  }

  /* ------------------------------ Passwords ------------------------------ */

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('grx_access_token')
  @ApiOperation({
    summary: 'Change password',
    description: 'Revokes every active session after a successful change.',
  })
  async changePassword(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.changePassword(user.id, dto);
    this.tokenService.clearAuthCookies(response);
    return { data: result, message: result.message };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({
    summary: 'Request a password reset link',
    description:
      'Always returns the same message so the endpoint cannot be used to discover ' +
      'which emails are registered. In non-production builds the token is logged ' +
      'and returned as `demoToken`.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.forgotPassword(dto);
    const isProduction = this.config.get<string>('app.nodeEnv') === 'production';
    return {
      data: isProduction ? undefined : result,
      message: result.message,
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 300_000 } })
  @ApiOperation({ summary: 'Complete a password reset' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return { data: result, message: result.message };
  }

  /* ------------------------------- Sessions ------------------------------ */

  @Get('sessions')
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('grx_access_token')
  @ApiOperation({ summary: 'List active sessions for the current user' })
  async sessions(@CurrentUser() user: AuthUser) {
    return {
      data: await this.authService.sessions(user.id, user.sessionId),
      message: 'Active sessions',
    };
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('grx_access_token')
  @ApiOperation({ summary: 'Revoke one session' })
  async revokeSession(
    @CurrentUser() user: AuthUser,
    @Param('sessionId') sessionId: string,
  ) {
    return {
      data: await this.authService.revokeSession(user.id, sessionId),
      message: 'Session revoked',
    };
  }

  @Post('sessions/revoke-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiCookieAuth('grx_access_token')
  @ApiOperation({ summary: 'Revoke every session (optionally keeping the current one)' })
  async revokeAll(
    @CurrentUser() user: AuthUser,
    @Body() dto: RevokeAllSessionsDto,
  ) {
    const keepCurrent = dto?.keepCurrentSession === true;
    const result = await this.authService.revokeAllSessions(
      user.id,
      keepCurrent ? user.sessionId : undefined,
    );
    return { data: result, message: result.message };
  }

  /* ------------------------------- Helpers ------------------------------- */

  private clientMeta(request: Request): ClientMeta {
    return {
      ip: (request.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
        ?? request.ip,
      userAgent: request.headers['user-agent'],
    };
  }
}
