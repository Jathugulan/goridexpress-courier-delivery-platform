import { Logger, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';
import { Role } from '../common/enums';
import { ACCESS_COOKIE } from '../common/guards/jwt-auth.guard';
import { SessionStateService } from '../common/session-state.service';
import type { JwtAccessPayload } from '../common/types';
import { Delivery, type DeliveryDocument } from '../database/schemas/order.schema';

interface SocketUser {
  id: string;
  email: string;
  role: Role;
  sessionId: string;
}

/**
 * Realtime backbone.
 *
 * Room naming (mirrored in `frontend/src/lib/socket/socket.ts`):
 *   user:{userId}            every device of one user
 *   role:ADMIN | role:CUSTOMER  broadcast fan-out
 *   delivery:{deliveryId}    live tracking for one delivery
 *   order:{orderId}          order status timeline
 *
 * Authentication reuses the HTTP-only access cookie, so a browser session
 * connects without ever handling a token in JavaScript. A `Bearer` handshake
 * token is accepted for native clients and Postman.
 *
 * The access token alone is not enough: the same live session check the HTTP
 * guard performs is applied here, so a logout or refresh rotation disconnects
 * the socket instead of leaving it silently privileged.
 */
@WebSocketGateway({
  transports: ['websocket', 'polling'],
  pingInterval: 25_000,
  pingTimeout: 20_000,
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server: Server;

  /** userId -> live sockets. */
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly sessionState: SessionStateService,
    @InjectModel(Delivery.name) private readonly deliveryModel: Model<DeliveryDocument>,
  ) {}

  afterInit(server: Server): void {
    // CORS is configured here rather than in the decorator so the same
    // allowlist as the HTTP API is used. `origin: true` would reflect any
    // requesting origin and allow a hostile page to open an authenticated
    // socket with the victim's cookies.
    const allowed = this.config.get<string[]>('cors.origins') ?? [];
    const allowAll = (this.config.get<boolean>('cors.allowAll') ?? false) && allowed.length === 0;

    server.engine.opts.cors = {
      origin: allowAll ? true : allowed,
      credentials: true,
      methods: ['GET', 'POST'],
    };

    this.logger.log(`Socket.IO gateway ready (cors: ${allowAll ? 'reflected' : allowed.join(', ')}).`);
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.authenticate(client);
      client.data.user = user;

      const existing = this.userSockets.get(user.id) ?? new Set<string>();
      existing.add(client.id);
      this.userSockets.set(user.id, existing);

      await client.join(this.userRoom(user.id));
      await client.join(this.roleRoom(user.role));

      client.emit('connected', {
        socketId: client.id,
        userId: user.id,
        role: user.role,
        rooms: [this.userRoom(user.id), this.roleRoom(user.role)],
        serverTime: new Date().toISOString(),
      });

      this.logger.debug(`Socket ${client.id} connected as ${user.role} ${user.email}`);
    } catch (error) {
      this.logger.warn(
        `Rejected socket ${client.id}: ${error instanceof Error ? error.message : 'auth failed'}`,
      );
      client.emit('auth:error', { message: 'Authentication failed' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user = client.data?.user as SocketUser | undefined;
    if (!user) return;

    const sockets = this.userSockets.get(user.id);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) this.userSockets.delete(user.id);
    }
    this.logger.debug(`Socket ${client.id} disconnected (${user.email})`);
  }

  onModuleDestroy(): void {
    this.server?.close();
  }

  /* ----------------------------- Client events --------------------------- */

  /** Join a delivery tracking room. Access is verified against the customer. */
  @SubscribeMessage('tracking:join')
  async handleTrackingJoin(
    client: Socket,
    payload: { deliveryId?: string },
  ): Promise<{ ok: boolean; room?: string; error?: string }> {
    const deliveryId = payload?.deliveryId;
    if (!deliveryId) return { ok: false, error: 'deliveryId is required' };

    const user = client.data?.user as SocketUser | undefined;
    if (!user) return { ok: false, error: 'Not authenticated' };

    if (!(await this.canAccessDelivery(user, { deliveryId }))) {
      this.logger.warn(`Socket ${client.id} denied tracking:join for delivery ${deliveryId}`);
      return { ok: false, error: 'You do not have access to this delivery' };
    }

    const room = this.deliveryRoom(deliveryId);
    await client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('tracking:leave')
  async handleTrackingLeave(
    client: Socket,
    payload: { deliveryId?: string },
  ): Promise<{ ok: boolean }> {
    if (payload?.deliveryId) {
      await client.leave(this.deliveryRoom(payload.deliveryId));
    }
    return { ok: true };
  }

  /** Join an order timeline room. Access is verified against the customer. */
  @SubscribeMessage('order:join')
  async handleOrderJoin(
    client: Socket,
    payload: { orderId?: string },
  ): Promise<{ ok: boolean; room?: string; error?: string }> {
    if (!payload?.orderId) return { ok: false, error: 'orderId is required' };

    const user = client.data?.user as SocketUser | undefined;
    if (!user) return { ok: false, error: 'Not authenticated' };

    if (!(await this.canAccessDelivery(user, { orderId: payload.orderId }))) {
      this.logger.warn(`Socket ${client.id} denied order:join for order ${payload.orderId}`);
      return { ok: false, error: 'You do not have access to this order' };
    }

    const room = this.orderRoom(payload.orderId);
    await client.join(room);
    return { ok: true, room };
  }

  @SubscribeMessage('ping')
  handlePing(): { ok: true; serverTime: string } {
    return { ok: true, serverTime: new Date().toISOString() };
  }

  /* ---------------------------- Server → client -------------------------- */

  /** Live courier GPS breadcrumb. */
  emitLocationUpdate(
    deliveryId: string,
    payload: {
      deliveryId: string;
      orderId: string;
      courierId: string;
      latitude: number;
      longitude: number;
      heading?: number;
      speed?: number;
      accuracy?: number;
      status: string;
      etaMinutes: number;
      progressPercent: number;
      distanceKm: number;
      timestamp: string;
    },
  ): void {
    this.server?.to(this.deliveryRoom(deliveryId)).emit('tracking:location', payload);
    this.server?.to(this.orderRoom(payload.orderId)).emit('order:location', payload);
  }

  /** Order status transition, including the history entry. */
  emitOrderStatus(
    orderId: string,
    payload: {
      orderId: string;
      deliveryId?: string | null;
      status: string;
      previousStatus?: string;
      label: string;
      progressPercent: number;
      etaMinutes: number;
      isDelayed: boolean;
      customerName?: string;
      updatedAt: string;
    },
  ): void {
    this.server?.to(this.orderRoom(orderId)).emit('order:status', payload);
    this.server?.to(this.roleRoom(Role.ADMIN)).emit('admin:order-status', payload);
  }

  emitEtaUpdate(
    deliveryId: string,
    payload: { deliveryId: string; orderId: string; etaMinutes: number; estimatedDelivery: string | null; isDelayed: boolean },
  ): void {
    this.server?.to(this.deliveryRoom(deliveryId)).emit('tracking:eta', payload);
  }

  /** Operations-center feed for the admin live board. */
  emitLiveDelivery(payload: Record<string, unknown>): void {
    this.server?.to(this.roleRoom(Role.ADMIN)).emit('admin:live-delivery', payload);
  }

  emitToUser(userId: string, event: string, payload: unknown): boolean {
    if (!this.server) return false;
    const sockets = this.userSockets.get(userId);
    // A user with no live sockets still has a valid, persisted notification.
    if (!sockets || sockets.size === 0) return false;
    this.server.to(this.userRoom(userId)).emit(event, payload);
    return true;
  }

  emitToRole(role: Role, event: string, payload: unknown): void {
    this.server?.to(this.roleRoom(role)).emit(event, payload);
  }

  /* ------------------------------- Helpers ------------------------------- */

  userRoom(userId: string): string {
    return `user:${userId}`;
  }

  roleRoom(role: Role): string {
    return `role:${role}`;
  }

  deliveryRoom(deliveryId: string): string {
    return `delivery:${deliveryId}`;
  }

  orderRoom(orderId: string): string {
    return `order:${orderId}`;
  }

  isOnline(userId: string): boolean {
    return (this.userSockets.get(userId)?.size ?? 0) > 0;
  }

  connectedUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * Verifies the handshake using the same access token and the same live
   * session check as the HTTP API, so a socket can never be more privileged
   * than a request. Refresh tokens are deliberately rejected: they are signed
   * with a different secret and carry no `email`/`role` claims, so accepting one
   * would attach a socket to a role-less, unverifiable identity.
   */
  private async authenticate(client: Socket): Promise<SocketUser> {
    const cookies = parseCookies(client.handshake.headers.cookie);
    const header = client.handshake.headers.authorization;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7).trim() : undefined;
    const token = cookies[ACCESS_COOKIE] ?? bearer;

    if (!token) throw new Error('No access token supplied');

    let payload: JwtAccessPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtAccessPayload>(token, {
        secret: this.config.get<string>('jwt.accessSecret'),
      });
    } catch {
      throw new Error('Access token is invalid or expired');
    }

    if (payload.type !== 'access') throw new Error('An access token is required');
    if (!payload.sid) throw new Error('Access token is missing a session id');
    if (!payload.email || !payload.role) throw new Error('Access token is missing claims');

    const state = await this.sessionState.assertUsable(payload.sid, payload.sub);
    if (state !== 'active') {
      throw new Error(`Session is not active (${state})`);
    }

    return { id: payload.sub, email: payload.email, role: payload.role, sessionId: payload.sid };
  }

  /**
   * A socket may only enter a room it is entitled to. Without this check any
   * authenticated user could subscribe to another customer's live courier
   * location and order timeline.
   *
   * Delivery rows carry both the customer and the owning order, so the same
   * lookup authorises a `delivery:` room and an `order:` room.
   */
  private async canAccessDelivery(
    user: SocketUser,
    ids: { deliveryId?: string; orderId?: string },
  ): Promise<boolean> {
    if (user.role === Role.ADMIN) return true;

    const filter: Record<string, unknown> = { customerId: user.id };
    if (ids.deliveryId) filter._id = ids.deliveryId;
    else if (ids.orderId) filter.orderId = ids.orderId;
    else return false;

    const delivery = await this.deliveryModel.findOne(filter).select('_id').lean().exec();
    return delivery !== null;
  }
}

/** Minimal cookie header parser — avoids pulling in cookie-parser here. */
function parseCookies(header?: string): Record<string, string> {
  if (!header) return {};
  const output: Record<string, string> = {};

  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) output[key] = decodeURIComponent(value);
  }

  return output;
}
