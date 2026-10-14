# GoRideXpress

Smart real-time courier and delivery management platform — an on-demand pickup and
drop service for individuals, businesses and marketplace sellers, with live tracking,
an admin operations centre, and a wallet/coupon system.

> **Payments are simulated.** No real payment processor is integrated. Card numbers,
> wallets, refunds and every financial figure in analytics are demo values produced by
> a local gateway simulator. Never enter a real card number.

---

## Table of contents

- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Architecture](#architecture)
- [Feature catalogue](#feature-catalogue)
  - [Authentication and session security](#authentication-and-session-security)
  - [Customer account](#customer-account)
  - [Notifications](#notifications)
  - [Data model](#data-model)
  - [Order lifecycle](#order-lifecycle)
  - [Simulated payments and wallet](#simulated-payments-and-wallet)
  - [Realtime tracking](#realtime-tracking)
  - [Delivery operations (admin)](#delivery-operations-admin)
  - [Frontend customer experience](#frontend-customer-experience)
  - [Frontend admin experience](#frontend-admin-experience)
  - [Design system](#design-system)
- [API reference](#api-reference)
- [Cross-cutting concerns](#cross-cutting-concerns)
- [Project status](#project-status)
- [Roadmap](#roadmap)

---

## Repository layout

```
GoRideXpress/
├── backend/                      NestJS REST API + Socket.IO gateway
│   ├── src/
│   │   ├── auth/                 registration, login, JWT rotation, sessions
│   │   ├── common/               enums, guards, decorators, filters, interceptors
│   │   ├── config/               typed configuration + env validation
│   │   ├── customers/            profile, preferences, dashboard, admin records
│   │   ├── database/             Mongoose connection + 25 domain schemas
│   │   ├── health/               liveness and dependency status
│   │   ├── notifications/        notification store and push service
│   │   └── realtime/             Socket.IO gateway, rooms, live events
│   └── .env.example              required environment contract
└── frontend/                     Next.js 16 App Router customer + admin UI
    └── src/
        ├── app/                  public, auth, customer and admin route groups
        ├── components/           UI components (customer, admin, delivery wizard)
        ├── hooks/                TanStack Query hooks and polling
        ├── lib/api/              typed API clients per domain
        ├── lib/socket/           Socket.IO singleton and room helpers
        └── types/                shared domain types
```

---

## Tech stack

**Backend**

| Concern | Choice |
| --- | --- |
| Framework | NestJS 11 (REST + WebSocket gateways) |
| Language | TypeScript 5.7, `strict` mode |
| Database | MongoDB via Mongoose 8 |
| Cache / locks | Redis via ioredis, degrades gracefully when absent |
| Auth | JWT access + rotating refresh tokens in HTTP-only cookies, Passport |
| Realtime | Socket.IO 4 (websocket with polling fallback) |
| Security | Helmet, CORS allowlist, throttling, RBAC, audit log |
| Validation | class-validator + global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`) |
| Documentation | Swagger / OpenAPI at `/api/docs` |
| Testing | Jest + Supertest (scaffolded) |

**Frontend**

| Concern | Choice |
| --- | --- |
| Framework | Next.js 16, App Router, React 19 |
| Language | TypeScript |
| Data | TanStack Query v5 |
| State | Zustand (auth, realtime) |
| Forms | React Hook Form + Zod |
| Maps | Leaflet / react-leaflet |
| Styling | Tailwind CSS v4 + design tokens |
| Realtime | socket.io-client |

---

## Quick start

### Prerequisites

- Node.js **20.11+**
- MongoDB **7+** running locally
- Redis **7+** *(optional — the API starts and serves traffic without it)*

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env          # then edit: set JWT secrets and MONGODB_URI
npm run start:dev             # http://localhost:5000
```

Generate real JWT secrets rather than using the placeholders:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Verify the service came up:

| URL | Expected |
| --- | --- |
| <http://localhost:5000/api/v1/health> | `200` with MongoDB connected |
| <http://localhost:5000/api/docs> | `200` Swagger UI |
| <http://localhost:5000/api/docs-json> | `200` OpenAPI document |
| <http://localhost:5000/api/v1/auth/me> | `401` unauthenticated |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:3000
```

Point the browser client at the API with `NEXT_PUBLIC_API_URL` (see
[`frontend/.env.example`](frontend/.env.example), which also configures the Socket.IO
origin and map tiles).

### 3. First user

Register through <http://localhost:3000/register> or Swagger
`POST /api/v1/auth/register`. Registration creates the user, the linked customer
profile, an empty wallet, and a session, then sets both auth cookies. In
development, `POST /api/v1/auth/forgot-password` returns a `demoToken` in the
response body so the reset flow can be completed without an email provider.

---

## Environment variables

Full annotated list in [`backend/.env.example`](backend/.env.example). The variables
that matter most:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | HTTP listener port |
| `API_PREFIX` | `api` | Global route prefix |
| `API_VERSION` | `v1` | URI version segment |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/goridexpress` | Connection string |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Cache and lock store |
| `REDIS_ENABLED` | `true` | Set `false` to run without Redis |
| `JWT_ACCESS_SECRET` | — | **Required**, min 32 chars |
| `JWT_REFRESH_SECRET` | — | **Required**, min 32 chars, must differ from access |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token and session lifetime |
| `COOKIE_SECURE` | `false` | Set `true` behind HTTPS in production |
| `COOKIE_SAME_SITE` | `lax` | Use `none` + `secure` for cross-site deployments |
| `CORS_ORIGIN` | `http://localhost:3000` | Comma-separated origin allowlist |
| `THROTTLE_LIMIT` | `120` | Default requests per window per IP |
| `PAYMENT_SIMULATION_DELAY_MS` | `1500` | Artificial gateway latency |

Boot-time validation rejects production starts when a secret is missing, too short, or
reused across both token types. `.env` is git-ignored — never commit it.

---

## Architecture

**Request pipeline.** `ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard` → controller →
service → Mongoose. A global exception filter normalises every failure into one error
envelope, and a global interceptor wraps every success.

**Response envelope.** All responses share a single shape, which is what the frontend
`apiClient` unwraps:

```jsonc
{
  "success": true,
  "message": "Orders",
  "data": [ /* items */ ],
  "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5,
                  "hasNext": true, "hasPrevious": false },
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/v1/customers"
}
```

Errors use the same envelope with `success: false`, a stable `code`, and an optional
`errors` map for field-level validation failures. Unhandled exceptions are logged with
a stack and returned as a generic `500` — internal messages never reach the client.

**API versioning.** URI-based, so the effective base is
`http://localhost:5000/api/v1`. Swagger sits outside the prefix at `/api/docs`.

**Configuration.** Namespaced `ConfigService` (`app`, `database`, `redis`, `jwt`,
`cookie`, `cors`, `upload`, `throttle`, `payment`) — nothing reads `process.env`
directly at request time.

**Sessions are authoritative, not the token.** A signature-valid access token is not
enough on its own. Every authenticated request also re-checks the live session, so
logout, refresh rotation, reuse detection, password changes and admin blocks take
effect immediately rather than whenever the 15-minute access token happens to expire.
Lookups are served from Redis, fall back to MongoDB, and sit behind a short in-process
memo; any session state change drops the cached verdict.

---

## Feature catalogue

### Authentication and session security

- Email/password registration with password-strength rules and a confirmation field
- Login with account lockout after repeated failures and per-route throttling
- Short-lived access token plus long-lived refresh token, both in HTTP-only cookies
  (`grx_access_token`, `grx_refresh_token`) so JavaScript never touches a token
- `Authorization: Bearer` fallback for Postman, Swagger "Authorize" and native clients
- Refresh-token **rotation** — every refresh revokes the presented session and issues a
  new pair
- **Reuse detection** — presenting an already-rotated refresh token is treated as
  theft and revokes every session for that user
- Logout, current profile, password change and password reset
- Session management: list devices with parsed user-agent, revoke one, revoke all
- Admin self-registration is rejected; blocking a customer also deactivates their login
- Security headers via Helmet, explicit CORS allowlist (never `*` with credentials)
- Rate limiting on global, short and long windows, with tighter limits on login,
  registration and payment routes
- Every sensitive mutation writes a redacted, field-diffed audit log entry

### Customer account

- Profile read/update, notification and locale preferences
- **Customer dashboard** aggregated server-side in a single round trip: greeting,
  active delivery, next scheduled delivery, stats, recent orders, recent payments,
  unread notifications and a derived smart-alert feed
- Admin customer directory with search, blocked/verified filters and pagination
- Admin block / unblock, which toggles the linked login's active state
- Admin views of a customer's orders, payments and support tickets
- Per-customer ownership checks on every self-service read and write

### Notifications

- In-app notification store with 14 typed events: order confirmation, payment success
  and failure, courier assigned / accepted / arriving, package picked up, courier
  nearby, delivery completed, refund completed, coupon applied, support reply,
  promotion and system alert
- Paginated list, unread-only filter, unread count, mark-one-read, mark-all-read, delete
- Per-type preferences and audience targeting (user, role, broadcast)
- Live push over Socket.IO with persistence as a fallback for offline users

### Data model

25 Mongoose schemas, all registered on one named connection:

| Domain | Schemas |
| --- | --- |
| Identity | `User`, `Session`, `PasswordResetToken` |
| Customer | `Customer`, `Address` (+ embedded `GeoLocation` with a `2dsphere` index) |
| Fleet | `Courier`, `Vehicle` |
| Delivery | `Order`, `Delivery`, `DeliveryServiceEntity`, `TrackingLocation` |
| Money | `Payment`, `Refund`, `Wallet`, `WalletTransaction` |
| Marketing | `Coupon`, `CouponRedemption`, `Promotion` |
| Engagement | `Review`, `AppNotification`, `SupportTicket`, `SupportMessage` |
| System | `AuditLog`, `AppSetting`, `IdempotencyRecord` |

Order and delivery documents embed immutable snapshots of the addresses, package,
line items, price breakdown and status history, so a later edit to a source record
cannot rewrite history. `IdempotencyRecord` backs safe retries on payment creation.

### Order lifecycle

Seventeen states with an explicit, centrally declared transition map so an illegal jump
is rejected rather than silently persisted:

```
CREATED → PAYMENT_PENDING → PAYMENT_SUCCESS → CONFIRMED
        ↘ PAYMENT_FAILED ↗ (retry)            ↓
                                    COURIER_ASSIGNMENT
                                             ↓
                                    COURIER_ASSIGNED
                                             ↓
                                    COURIER_ACCEPTED
                                             ↓
                                    COURIER_ARRIVING
                                             ↓
                                    PICKED_UP → IN_TRANSIT
                                             ↓
                                    NEAR_DESTINATION
                                             ↓
                                    OUT_FOR_DELIVERY
                                             ↓
                              DELIVERED | DELIVERY_FAILED | CANCELLED
                                             ↓
                                          REFUNDED
```

`CANCELLED` is reachable from any pre-pickup state, `DELIVERY_FAILED` from any
in-transit state, and both converge on `REFUNDED`. `CANCELLED` and `REFUNDED` are
terminal.

Every transition appends a `StatusHistoryEntry` with actor, note and timestamp, and
publishes an `order:status` event to the customer room and the admin live board.

Service types: same-day, express, standard, scheduled, bulk and marketplace.
Package types: documents, parcels, food, groceries, fragile, electronics, clothing
and other. Vehicle types: bike, three-wheeler, car, van and walk.

### Simulated payments and wallet

- Demo methods: dummy card, dummy wallet, cash on delivery and dummy mobile wallet
- **Test cards** — `4242 4242 4242 4242` always succeeds, `4000 0000 0000 0002`
  always fails; any other well-formed number succeeds with a note
- Artificial gateway latency (`PAYMENT_SIMULATION_DELAY_MS`) so loading states are real
- **Card data is never persisted** — only the brand, last four digits and a display
  token; CVV and full PAN are discarded
- Wallet with top-up, balance, transaction ledger, refunds and a spendable balance
  reflected on the customer profile
- Refunds move money back to the original method and are linked to their payment
- `Idempotency-Key` support prevents double-charging on client retries

### Realtime tracking

- Socket.IO gateway authenticated by the same access token and the same live session
  check as the HTTP API, so a socket can never be more privileged than a request
- Refresh tokens are explicitly rejected at the handshake (different secret, no role
  claims)
- CORS on the upgrade handshake uses the same origin allowlist as the REST API
- Rooms: `user:{id}`, `role:ADMIN`, `role:CUSTOMER`, `delivery:{id}`, `order:{id}`
- Room entry is authorised: a customer can only join a delivery or order they own;
  admins may join any
- Events: `tracking:location` (GPS breadcrumbs with heading, speed, ETA and progress),
  `tracking:eta`, `order:status`, `order:location`, `admin:order-status`,
  `admin:live-delivery`
- Client acknowledgements for `tracking:join` / `tracking:leave` / `order:join`

### Delivery operations (admin)

Built as typed components against the API client contract, awaiting their server
counterparts:

- Dashboard with revenue, order volume, courier utilisation and completion rate tiles
- Live operations board: active deliveries, courier positions, delay flags, ETA
- Order management: search, filter by status, update status, assign or unassign a
  courier, cancel, refund
- Customer directory with block / unblock and order history
- Courier roster: availability toggle, approval, performance and earnings
- Vehicle fleet: registration, type, capacity, status
- Payment ledger with refund initiation
- Coupon and promotion management
- Support inbox with ticket status, priority and assignment
- Notification broadcast to a chosen audience
- Analytics: revenue trends, delivery performance, geographic heatmaps, exports
- Platform settings

### Frontend customer experience

26 pages across three route groups, all behind an auth bootstrap that waits for the
session before rendering:

- **Public** — landing, how it works, services, pricing, business, about, FAQ, help,
  contact, and public order tracking
- **Auth** — login, register, forgot password, reset password
- **Customer** — dashboard, delivery wizard, order list, order detail, live tracking,
  payments, wallet, coupons, notifications, support, profile, settings

The delivery wizard is a six-step flow: location (saved address or map pin), package
details, service selection, review, payment, and confirmation.

### Frontend admin experience

Reusable admin panels (dashboard, live board, orders, customers, couriers, vehicles,
payments, coupons, promotions, support, notifications, analytics, settings) built on
TanStack Query with polling fallback, wired to the typed admin API client.

### Design system

Latest SRS palette, already reflected in the token layer:

| Token | Value | Use |
| --- | --- | --- |
| Primary | `#16A866` | Actions, active states, brand |
| Dark green | `#087443` | Hover and pressed states |
| Light green | `#E9F9F1` | Tinted surfaces, badges |
| Navy | `#10233F` | Primary text, headers |
| Background | `#F7FAF8` | App canvas |
| White | `#FFFFFF` | Cards and surfaces |
| Muted | `#667085` | Secondary text |
| Warning | `#F59E0B` | Delays and pending states |
| Danger | `#EF4444` | Errors and destructive actions |

---

## API reference

Interactive documentation with request/response schemas, cookie auth and bearer auth
lives at <http://localhost:5000/api/docs>. The OpenAPI document is served at
`/api/docs-json`.

### Implemented endpoints

**Health**

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/health` | Public | Liveness plus MongoDB and Redis status |

**Auth**

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/register` | Public | Create account, customer profile and wallet |
| `POST` | `/api/v1/auth/login` | Public | Sign in, sets auth cookies |
| `POST` | `/api/v1/auth/refresh` | Refresh cookie | Rotate the token pair |
| `POST` | `/api/v1/auth/logout` | Access | Revoke the current session, clear cookies |
| `GET` | `/api/v1/auth/me` | Access | Current user and profile summary |
| `POST` | `/api/v1/auth/change-password` | Access | Change password, revokes other sessions |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request a reset (dev returns a demo token) |
| `POST` | `/api/v1/auth/reset-password` | Public | Consume the reset token |
| `GET` | `/api/v1/auth/sessions` | Access | List active devices |
| `DELETE` | `/api/v1/auth/sessions/{sessionId}` | Access | Revoke one session |
| `POST` | `/api/v1/auth/sessions/revoke-all` | Access | Revoke every other session |

**Customers**

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/customers/me` | Customer | Own profile, preferences, balances |
| `PUT` | `/api/v1/customers/me` | Customer | Update own profile |
| `GET` | `/api/v1/customers/me/preferences` | Customer | Notification and locale preferences |
| `PATCH` | `/api/v1/customers/me/preferences` | Customer | Update preferences |
| `GET` | `/api/v1/customers/dashboard` | Customer | Aggregated dashboard payload |
| `GET` | `/api/v1/customers` | Admin | Paginated customer directory |
| `GET` | `/api/v1/customers/{id}` | Admin | Customer detail |
| `PATCH` | `/api/v1/customers/{id}` | Admin | Admin edit of customer fields |
| `PATCH` | `/api/v1/customers/{id}/block` | Admin | Block customer and deactivate login |
| `PATCH` | `/api/v1/customers/{id}/unblock` | Admin | Unblock and reactivate login |
| `GET` | `/api/v1/customers/{id}/orders` | Admin | Customer order history |
| `GET` | `/api/v1/customers/{id}/payments` | Admin | Customer payments |
| `GET` | `/api/v1/customers/{id}/tickets` | Admin | Customer support tickets |

**Notifications**

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/v1/notifications` | Access | Paginated list, `?unread=true` filter |
| `GET` | `/api/v1/notifications/unread-count` | Access | Unread badge count |
| `GET` | `/api/v1/notifications/unread` | Access | Alias for the nav badge poller |
| `PATCH` | `/api/v1/notifications/read-all` | Access | Mark all read |
| `PATCH` | `/api/v1/notifications/{id}/read` | Access | Mark one read |
| `DELETE` | `/api/v1/notifications/{id}` | Access | Delete one notification |

The frontend API clients under `frontend/src/lib/api/` define 131 call sites for
deliveries, orders, payments, wallet, coupons, promotions, tracking, support and admin.
Those are the target contract; see [Project status](#project-status) for what is live
today.

---

## Cross-cutting concerns

**Security**

- JWTs delivered only via HTTP-only cookies for the web app; no `localStorage`
- Distinct access and refresh secrets, both length-validated at boot in production
- Two-stage authentication: token verification plus a live session check
- Refresh rotation with reuse detection as a theft response
- RBAC with a permission enum, plus per-resource ownership checks
- Audit log with secret redaction and field-level diffs
- Validation whitelist rejects unknown request fields outright
- Generic `500` responses; internal error detail never returned
- Socket.IO handshake uses the same token, session check and origin allowlist

**Reliability**

- Redis is optional at every call site: cache misses degrade to MongoDB, locks
  degrade to no-ops, and the process still boots
- Health endpoint reports each dependency separately instead of a single boolean
- Payment creation is idempotent, and a distributed lock guards assignment races
- Indexes and TTLs declared on every schema; automatic index building disabled in
  production

**Observability**

- Structured request logging with method, path, status and stack for failures
- Audit trail for authentication, account and administrative actions
- Nest dependency-resolution tracing during startup

---

## Project status

**Complete and verified**

- Backend bootstrap, configuration, validation and the full common layer
- All 25 domain schemas, registered and index-clean at startup
- Auth module, verified end to end: register, login, `/auth/me`, refresh rotation,
  session listing, plus validation and role-denial cases
- Live session enforcement on every authenticated request
- Customers module: profile, preferences, dashboard, admin directory and blocking
- Notifications module
- Socket.IO gateway with authorised rooms
- Health, Swagger and OpenAPI endpoints

**In progress**

- Backend modules for deliveries, orders, payments, wallet, coupons, promotions,
  tracking, reviews, support, admin, analytics and exports
- Seed data and the Jest/Supertest suite
- Admin route pages and customer route-group URL segment
- Wizard validation, live tracking initialisation, support form wiring

**Known gaps**

- Redis is not running in the local environment, so cache and distributed-lock paths
  are exercised only through their fallback behaviour
- `mongodb-memory-server` postinstall is blocked by the local npm install-script policy,
  so in-memory e2e runs fall back to the local MongoDB service
- The admin UI components are type-correct but not yet verified against live endpoints

---

## Roadmap

1. Complete the delivery, order, payment, wallet and marketing backend modules
2. Seed script with demo couriers, vehicles, services, coupons and orders
3. Jest + Supertest coverage for auth, session revocation and the payment simulator
4. Postman collection generated from the OpenAPI document
5. Admin route pages wired to the real endpoints
6. Wizard validation, scheduled-delivery enforcement and order identity resolution
7. Smart ETA, automatic courier assignment and route optimisation
8. Proof of delivery capture, ratings, reviews and in-app chat
9. Heatmaps, alerts, exports, global search and a command menu
10. Dashboard customisation and analytics reporting
11. CI pipeline, Docker compose, and deployment documentation
