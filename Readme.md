# Fastify Backend API v1.2.0

Production-ready REST API built with **Fastify v5**, **Drizzle ORM**, and **PostgreSQL**.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Request Flow](#request-flow)
5. [Getting Started](#getting-started)
6. [Environment Variables](#environment-variables)
7. [Database Schema](#database-schema)
8. [Authentication](#authentication)
9. [API Reference](#api-reference)
10. [Error Handling](#error-handling)
11. [Plugins & Middleware](#plugins--middleware)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Endpoint Summary](#endpoint-summary)
15. [Changelog](#changelog)

---

## Features

- **JWT Authentication** — Register, login, token validation
- **API Key Authentication** — Create, list, revoke API keys with `X-API-Key` header
- **Role-Based Access Control** — Admin, Moderator, User roles
- **Full CRUD** — Users and Products with ownership enforcement
- **Pagination & Sorting** — Configurable page, limit, sortBy, sortOrder
- **Product Stock Management** — Update stock with quantity delta
- **Toggle Status** — Activate/deactivate users and products (admin only)
- **Rate Limiting** — Global rate limit with per-route auth overrides, `x-ratelimit-*` headers
- **User Cache** — In-memory LRU cache (60s TTL, 10k max) for JWT auth lookups
- **Swagger/OpenAPI** — Auto-generated docs at `/docs`
- **Compression** — gzip/deflate in production (threshold 1024 bytes)
- **Static Files** — SPA serving from `public/dist/` with API 404 fallback
- **Security Headers** — Helmet.js integration
- **HLS Adaptive Streaming** — 6-resolution video streaming (1440p→240p) via Plyr + hls.js player with JWT/API key auth
- **Custom Video Player** — Plyr-based player with play/pause, seekbar, volume, fullscreen, PiP, speed control, resolution switcher, keyboard shortcuts
- **Footer** — Sticky footer with app info, pushed to bottom via flex layout
- **Health Check** — `/health` endpoint with DB pool status
- **Input Validation** — Zod schemas for request bodies + route-level JSON Schema
- **Structured Logging** — Pino logger with configurable levels
- **Error Handling** — Centralized error handler with `AppError` class

---

## Tech Stack

| Package | Version | Purpose |
|---------|---------|---------|
| Fastify | ^5.7.2 | HTTP framework |
| TypeScript | ^5.9.2 | Type-safe JavaScript |
| Drizzle ORM | ^0.45.1 | Database ORM |
| PostgreSQL | 18+ | Relational database |
| Zod | ^3.25.76 | Schema validation |
| @fastify/jwt | ^10.1.0 | JWT authentication |
| @fastify/cors | ^11.2.0 | CORS configuration |
| @fastify/helmet | ^13.0.0 | Security headers |
| @fastify/rate-limit | ^10.0.0 | Rate limiting |
| @fastify/swagger | ^9.7.0 | OpenAPI documentation |
| @fastify/swagger-ui | ^5.0.0 | Swagger UI |
| @fastify/compress | ^9.1.0 | gzip/deflate compression |
| @fastify/static | ^10.1.2 | Static file serving |
| @fastify/autoload | ^6.0.0 | Auto-load plugins & routes |
| bcryptjs | ^3.0.0 | Password hashing |
| pino | ^9.6.0 | Structured logging |
| pino-pretty | ^13.0.0 | Log formatting (dev) |
| drizzle-kit | ^0.30.0 | Database migrations & studio |
| autocannon | ^8.0.0 | Load testing (dev) |
| plyr | ^3.8.4 | Video player UI (frontend) |
| hls.js | ^1.6.16 | HLS streaming (frontend) |

---

## Project Structure

```
backend-server/
├── .env                          # Environment variables
├── .gitignore
├── drizzle.config.ts             # Drizzle ORM config
├── package.json
├── tsconfig.json
├── AGENTS.md                     # Agent instructions
├── Readme.md                     # This file
├── log.md                        # Load test results
│
├── src/
│   ├── app.ts                    # buildServer() — extractable for testing
│   ├── server.ts                 # Entry point, DB connect, signal handlers
│   │
│   ├── config/
│   │   ├── db.connection.ts      # pg Pool + Drizzle instance (max 50, idle 10s)
│   │   ├── db.schemas.ts         # Drizzle table definitions (users, products, api_keys)
│   │   ├── env.ts                # Zod-validated env vars
│   │   └── plugin.register.ts    # Autoloads plugins/ (encapsulate: false)
│   │
│   ├── controllers/
│   │   ├── apikey.controller.ts  # API key create, list, revoke
│   │   ├── auth.controller.ts    # Register, login, me, validate
│   │   ├── product.controller.ts # CRUD + stock + toggle + pagination
│   │   └── user.controller.ts    # CRUD + password + toggle + pagination
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts     # JWT + X-API-Key auth, user cache (60s TTL, 10k LRU)
│   │   └── error.middleware.ts    # Centralized error handler (Zod, JWT, AppError, 429)
│   │
│   ├── models/
│   │   ├── apikey.model.ts       # API key DB operations (create, validate, revoke)
│   │   ├── product.model.ts      # Drizzle product queries (pagination, sorting)
│   │   └── user.model.ts         # Drizzle user queries (pagination, sorting)
│   │
│   ├── plugins/
│   │   ├── compress.plugin.ts    # gzip/deflate (production only, threshold 1024)
│   │   ├── cors.plugin.ts        # CORS configuration
│   │   ├── helmet.plugin.ts      # Security headers
│   │   ├── jwt.plugin.ts         # JWT sign/verify (HS256, 7d default)
│   │   ├── rate-limit.plugin.ts  # Global rate limit + allowList + headers
│   │   ├── sensible.plugin.ts    # Sensible defaults
│   │   ├── static.plugin.ts      # SPA static file serving (public/dist/)
│   │   └── swagger.plugin.ts     # OpenAPI 3.0.3 + Swagger UI (/docs)
│   │
│   ├── routes/
│   │   └── v1/
│   │       ├── apikey.routes.ts  # /api/v1/api-keys (CRUD, auth required)
│   │       ├── auth.routes.ts    # /api/v1/auth (register, login, me, validate)
│   │       ├── product.routes.ts # /api/v1/products (CRUD, stock, toggle, pagination)
│   │       └── user.routes.ts    # /api/v1/users (CRUD, password, toggle, pagination)
│   │
│   ├── schemas/
│   │   ├── apikey.schema.ts      # Zod: createApiKeySchema (name: 1-100 chars)
│   │   ├── common.schema.ts      # Zod: toggleStatusSchema
│   │   ├── product.schema.ts     # Zod: product validation
│   │   └── user.schema.ts        # Zod: user validation
│   │
│   ├── services/
│   │   ├── apikey.service.ts     # API key business logic
│   │   ├── auth.service.ts       # Auth business logic
│   │   ├── product.service.ts    # Product business logic (pagination)
│   │   └── user.service.ts       # User business logic (pagination)
│   │
│   ├── types/
│   │   ├── errors.ts             # AppError class with static factories
│   │   └── index.ts              # TypeScript interfaces (JWTPayload, AuthRequest, PaginationParams, ApiKeyInfo, etc.)
│   │
│   └── utils/
│       ├── health.routes.ts      # GET /health (DB pool status)
│       ├── logger.ts             # Pino logger config
│       └── validator.ts          # parsePagination(), validateSchema(), idSchema
│
├── test/
│   ├── routes.test.ts            # Integration tests (67 tests, 9 suites, node:test)
│   └── load-test.mjs             # autocannon load test (100 connections, 10s, 14 endpoints)
│
├── drizzle/
│   ├── 0000_giant_surge.sql      # Initial migration
│   ├── 0001_furry_martin_li.sql  # api_keys table migration
│   └── meta/
│
├── src/
│   └── scripts/
│       ├── transcode.mjs         # HLS transcoder (1.mp4 → HLS)
│       └── transcode.sh          # Shell wrapper
├── src/
│   └── storage/
│       └── hls/                  # HLS output (6 resolutions + master.m3u8)
├── ai/                           # Project docs (PRD, Architecture, Design, Schema, Rules)
├── public/
│   └── src/
│       ├── api/stream.js         # Stream API (master URL & resolution URLs)
│       ├── components/Footer.vue  # Sticky footer
│       ├── components/VideoPlayer.vue # HLS player (Plyr + hls.js)
│       └── views/StreamView.vue  # Stream page
├── dist/                         # TypeScript build output
```

---

## Request Flow

```
Client Request
      │
      ▼
┌─────────────┐
│   Fastify   │
│   Server    │
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Plugins   │  CORS, Helmet, Rate Limit, JWT, Compress, Static, Swagger
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Middleware  │  authMiddleware (JWT + API Key + cache), errorMiddleware
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Routes    │  /api/v1/auth, /users, /products, /api-keys
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Controllers │  AuthController, UserController, ProductController, ApiKeyController
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Services   │  AuthService, UserService, ProductService, ApiKeyService
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Models    │  userModel, productModel, apiKeyModel (Drizzle queries)
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ PostgreSQL  │  Users, Products, API Keys
└─────────────┘
```

---

## Getting Started

### Prerequisites

- Node.js >= 20.x
- PostgreSQL >= 14.x

### Install

```bash
git clone <repository-url>
cd backend-server
npm install
```

### Setup Database

```bash
# Generate migration
npm run db:generate

# Run migration
npm run db:migrate

# Or push schema directly (dev)
npm run db:push
```

### Run

```bash
# Development (hot reload)
npm run dev

# Build
npm run build

# Production
npm start
```

Server runs at `http://localhost:3000`. Swagger docs at `http://localhost:3000/docs`.

### Frontend

```bash
cd public
npm install
npm run build     # Build SPA → public/dist/
```

The SPA is served by the backend at the root URL (`/`). No separate frontend server needed.

### HLS Transcoding

Place a source video at `src/storage/1.mp4`, then:

```bash
npm run transcode
```

Outputs 6-resolution HLS streams to `src/storage/hls/`. Stream available at `/api/v1/stream/master.m3u8` (authenticated).

### Commands

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server with tsx watch hot reload |
| `npm run build` | tsc compile to `dist/` |
| `npm start` | Node production server |
| `npm test` | Node built-in test runner (67 tests, requires live DB) |
| `npm run test:load` | autocannon load test (100 connections, 10s, 14 endpoints) |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Run Drizzle migration |
| `npm run db:push` | Push schema to DB (dev shortcut) |
| `npm run transcode` | Transcode 1.mp4 → HLS (6 resolutions) |
| `npm run db:studio` | Open Drizzle Studio (browser UI) |
| `cd public && npm run build` | Build Vue frontend (Vite → public/dist/) |

---

## Environment Variables

All env vars are validated at startup via Zod (`src/config/env.ts`). Missing or invalid vars crash immediately.

### Required

| Variable | Type | Description |
|----------|------|-------------|
| `DATABASE_URL` | `string` | PostgreSQL connection string |
| `JWT_SECRET` | `string` | JWT signing secret (min 32 chars) |

### Optional (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | `development`, `production`, or `test` |
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `JWT_EXPIRES_IN` | `7d` | JWT token lifetime |
| `RATE_LIMIT_MAX` | `1000` | Global rate limit (requests per window) |
| `RATE_LIMIT_WINDOW` | `60000` | Global rate limit window (ms) |
| `RATE_LIMIT_AUTH_MAX` | `20` | Auth endpoint rate limit (per window) |
| `RATE_LIMIT_AUTH_WINDOW` | `60000` | Auth rate limit window (ms) |
| `BCRYPT_ROUNDS` | `12` | bcrypt hash rounds |
| `API_KEY_EXPIRY_DAYS` | `30` | API key validity period (days) |
| `CORS_ORIGIN` | `*` | Allowed CORS origins (comma-separated) |
| `LOG_LEVEL` | `info` | Pino log level |

### Dev `.env` (current)

```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://kana:kanataka_dev@localhost:5432/kanataka
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-change-this
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=1000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_AUTH_MAX=20
RATE_LIMIT_AUTH_WINDOW=60000
BCRYPT_ROUNDS=4
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
```

---

## Database Schema

### Users

| Column | Type | Constraint |
|--------|------|------------|
| `id` | `serial` | PRIMARY KEY |
| `email` | `varchar(255)` | NOT NULL, UNIQUE |
| `password` | `text` | NOT NULL (bcrypt) |
| `name` | `varchar(100)` | NOT NULL |
| `role` | `user_role enum` | DEFAULT `'user'` |
| `is_active` | `boolean` | DEFAULT `true` |
| `last_login_at` | `timestamp` | NULLABLE |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() |

Indexes: `email_idx` (UNIQUE), `role_idx`

### Products

| Column | Type | Constraint |
|--------|------|------------|
| `id` | `serial` | PRIMARY KEY |
| `name` | `varchar(255)` | NOT NULL |
| `description` | `text` | NULLABLE |
| `price` | `decimal(10,2)` | NOT NULL |
| `stock` | `integer` | NOT NULL, DEFAULT 0 |
| `user_id` | `integer` | FK → users.id ON DELETE CASCADE |
| `is_active` | `boolean` | DEFAULT `true` |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() |

Indexes: `user_id_idx`, `name_idx`

### API Keys

| Column | Type | Constraint |
|--------|------|------------|
| `id` | `serial` | PRIMARY KEY |
| `user_id` | `integer` | FK → users.id ON DELETE CASCADE, NOT NULL |
| `name` | `varchar(100)` | NOT NULL |
| `key_hash` | `text` | NOT NULL (SHA-256) |
| `prefix` | `varchar(10)` | NOT NULL, UNIQUE |
| `expires_at` | `timestamp` | NOT NULL |
| `last_used_at` | `timestamp` | NULLABLE |
| `created_at` | `timestamp` | NOT NULL, DEFAULT NOW() |
| `updated_at` | `timestamp` | NOT NULL, DEFAULT NOW() |

Indexes: `api_key_user_id_idx`, `api_key_prefix_idx` (UNIQUE)

### Relations

```
users (1) ──────< (n) products     ON DELETE CASCADE
users (1) ──────< (n) api_keys     ON DELETE CASCADE
```

### Enums

```sql
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
```

---

## Authentication

### JWT Authentication

```
1. Register (POST /api/v1/auth/register)
   → Password hashed with bcrypt → User saved to DB

2. Login (POST /api/v1/auth/login)
   → Password verified → JWT token returned (HS256, 7d default)

3. Access Protected Endpoint
   → Header: Authorization: Bearer <token>
   → JWT verified → User data attached to request
   → User looked up in DB (cached 60s in memory, LRU 10k max)

4. Role Check (if required)
   → requireRole(['admin']) checks user.role → 403 if unauthorized
```

### API Key Authentication

```
1. Create API Key (POST /api/v1/api-keys)
   → Requires JWT auth → Returns full key once (ak_ + 32 hex = 36 chars)
   → SHA-256 hash stored in DB, prefix (first 8 chars) for lookup

2. Authenticate via API Key
   → Header: X-API-Key: ak_12345678...
   → Auth middleware looks up by prefix → Verifies SHA-256 hash → Checks expiry
   → User role and data resolved from DB (with JWT user cache)

3. Revoke API Key (DELETE /api/v1/api-keys/:id)
   → Requires JWT auth → Soft deletes from DB
```

### User Cache

The auth middleware caches user lookups in-memory:
- **TTL**: 60 seconds
- **Max entries**: 10,000 (LRU eviction)
- **Key**: user ID
- **Invalidated on**: password change, user deletion, user status toggle

### Role Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access. Manage all users/products, toggle status, delete anything |
| **Moderator** | List all users and all products |
| **User** | Manage own profile and products only |

---

## API Reference

**Base URL**: `http://localhost:3000/api/v1`

---

### 1. Health Check

#### GET /health

Returns server and database status. **No authentication required.**

**Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": "2026-07-27T12:00:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "database": {
    "status": "connected",
    "totalCount": 50,
    "idleCount": 45,
    "waitingCount": 0
  }
}
```

---

### 2. Authentication

#### POST /api/v1/auth/register

Register a new user. **No authentication required.**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Valid email, unique |
| `password` | `string` | Yes | Min 6 characters |
| `name` | `string` | Yes | Min 2 characters |

**Response (201 Created):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "createdAt": "2026-07-27T12:00:00.000Z"
  }
}
```

---

#### POST /api/v1/auth/login

Login and receive a JWT token. **No authentication required.**

**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | `string` | Yes |
| `password` | `string` | Yes |

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    }
  }
}
```

---

#### GET /api/v1/auth/me

Get current user profile. **Requires JWT or API Key.**

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "isActive": true,
    "lastLoginAt": "2026-07-27T12:00:00.000Z",
    "createdAt": "2026-07-27T12:00:00.000Z"
  }
}
```

---

#### POST /api/v1/auth/validate

Validate a JWT token. **Requires JWT or API Key.**

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}
```

---

### 3. API Keys

All API key endpoints require **JWT authentication**.

#### POST /api/v1/api-keys

Create a new API key. **The full key is returned only once.**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | 1-100 characters |

**Response (201 Created):**

```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "id": 1,
    "name": "My App Key",
    "prefix": "ak_12345678",
    "key": "ak_1234567890abcdef1234567890abcdef",
    "expiresAt": "2026-08-26T12:00:00.000Z",
    "createdAt": "2026-07-27T12:00:00.000Z"
  }
}
```

---

#### GET /api/v1/api-keys

List all API keys for the authenticated user.

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "My App Key",
      "prefix": "ak_12345678",
      "expiresAt": "2026-08-26T12:00:00.000Z",
      "lastUsedAt": "2026-07-27T12:00:00.000Z",
      "createdAt": "2026-07-27T12:00:00.000Z"
    }
  ]
}
```

---

#### DELETE /api/v1/api-keys/:id

Revoke (delete) an API key.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

### 4. Users

All user endpoints require **JWT or API Key authentication**.

#### GET /api/v1/users

List all users. **Admin & Moderator only.** Supports pagination and sorting.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (min 1) |
| `limit` | `number` | `10` | Items per page (1-100) |
| `sortBy` | `string` | `createdAt` | Sort field: `name`, `email`, `role`, `createdAt`, `updatedAt` |
| `sortOrder` | `string` | `desc` | Sort order: `asc` or `desc` |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user",
      "isActive": true,
      "lastLoginAt": "2026-07-27T12:00:00.000Z",
      "createdAt": "2026-07-27T12:00:00.000Z"
    }
  ]
}
```

---

#### GET /api/v1/users/:id

Get user by ID. **Requires authentication.**

---

#### PUT /api/v1/users/:id

Update user. **Owner or admin only.**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Min 2 characters |
| `email` | `string` | No | Valid email format |

---

#### DELETE /api/v1/users/:id

Delete user. **Admin only.**

---

#### POST /api/v1/users/:id/change-password

Change password. **Owner or admin only.**

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `currentPassword` | `string` | Yes | Current password (min 6 chars) |
| `newPassword` | `string` | Yes | New password (min 6 chars) |

---

#### PATCH /api/v1/users/:id/toggle-status

Activate/deactivate user. **Admin only.**

**Request Body:**

```json
{ "isActive": false }
```

---

### 5. Products

All product endpoints require **JWT or API Key authentication**.

#### GET /api/v1/products

List products. Regular users see only their own. Admin/Moderator see all. Supports pagination and sorting.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | `number` | `1` | Page number (min 1) |
| `limit` | `number` | `10` | Items per page (1-100) |
| `sortBy` | `string` | `createdAt` | Sort field: `name`, `price`, `stock`, `createdAt`, `updatedAt` |
| `sortOrder` | `string` | `desc` | Sort order: `asc` or `desc` |

---

#### GET /api/v1/products/:id

Get product by ID.

---

#### POST /api/v1/products

Create a new product.

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Min 1 character |
| `description` | `string` | No | Product description |
| `price` | `number` | Yes | Positive number |
| `stock` | `number` | No | Default: 0 |

---

#### PUT /api/v1/products/:id

Update product. **Owner or admin only.**

---

#### DELETE /api/v1/products/:id

Delete product. **Admin only.**

---

#### PATCH /api/v1/products/:id/stock

Update product stock. **Owner or admin only.** Quantity must be >= 1.

**Request Body:**

```json
{ "quantity": 5 }
```

---

#### PATCH /api/v1/products/:id/toggle-status

Activate/deactivate product. **Admin only.**

---

### 6. Streaming

All stream endpoints require **JWT or API Key authentication**. Serves HLS video content.

#### GET /api/v1/stream/master.m3u8

Returns the master HLS playlist with all 6 variant streams.

**Response (200 OK):**

```
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=12000000,RESOLUTION=2560x1440,NAME="1440p"
1440p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,NAME="1080p"
1080p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720,NAME="720p"
720p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480,NAME="480p"
480p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360,NAME="360p"
360p/playlist.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=400000,RESOLUTION=426x240,NAME="240p"
240p/playlist.m3u8
```

#### GET /api/v1/stream/:resolution/:file

Stream a specific resolution playlist or segment.

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `resolution` | `string` | One of: `1440p`, `1080p`, `720p`, `480p`, `360p`, `240p` |
| `file` | `string` | Filename (e.g., `playlist.m3u8`, `segment-000.ts`) |

**MIME Types:**

| Extension | MIME Type |
|-----------|-----------|
| `.m3u8` | `application/vnd.apple.mpegurl` |
| `.ts` | `video/mp2t` |

**Security:** Resolution whitelist enforced, path traversal rejected (`..`, `/`, `\`). Cache: playlists `no-cache`, segments `public, max-age=3600`.

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "statusCode": 400
}
```

### HTTP Status Codes

| Code | Type | When |
|------|------|------|
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing token, invalid token, expired token, invalid API key |
| 403 | Forbidden | Insufficient role/ownership |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate email or unique constraint |
| 429 | Too Many Requests | Rate limit exceeded (`Retry-After` header included) |
| 500 | Internal Server Error | Unexpected error |

### Error Examples

**Validation Error:**

```json
{
  "success": false,
  "error": "Error",
  "message": "body/email must match format \"email\"",
  "statusCode": 400
}
```

**Unauthorized (no token):**

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authorization header is required",
  "statusCode": 401
}
```

**Forbidden:**

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "statusCode": 403
}
```

**Rate Limited:**

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded. Please try again later.",
  "statusCode": 429
}
```

---

## Plugins & Middleware

### Plugins (8)

| Plugin | Module | Description |
|--------|--------|-------------|
| CORS | `@fastify/cors` | Cross-origin resource sharing via `CORS_ORIGIN` |
| Helmet | `@fastify/helmet` | Security headers (CSP in production) |
| JWT | `@fastify/jwt` | JWT sign/verify (HS256, 7d default) |
| Rate Limit | `@fastify/rate-limit` | Global limit + `/health` and `/docs` allowlisted, `x-ratelimit-*` headers |
| Swagger | `@fastify/swagger` | OpenAPI 3.0.3 docs at `/docs` (disabled in production unless `ENABLE_SWAGGER=true`) |
| Swagger UI | `@fastify/swagger-ui` | Swagger UI interface |
| Compress | `@fastify/compress` | gzip/deflate (production only, threshold 1024 bytes) |
| Static | `@fastify/static` | Serves SPA from `public/dist/` with `decorateReply: true` for `reply.sendFile()`, API 404 fallback sends `index.html` |
| Sensible | `@fastify/sensible` | Sensible defaults |
| Autoload | `@fastify/autoload` | Auto-loads `plugins/` and `routes/v1/` directories |

### Middleware (2)

| Middleware | File | Description |
|------------|------|-------------|
| `authMiddleware` | `auth.middleware.ts` | Verifies JWT or API key, checks user active, attaches user to request. Uses in-memory LRU cache (60s TTL, 10k max). Supports `invalidateUserCache(userId)` on password change / deletion / toggle |
| `requireRole(roles)` | `auth.middleware.ts` | Checks user role against allowed list. Returns 403 if unauthorized |
| `setupErrorHandler` | `error.middleware.ts` | Global handler for ZodError, AppError, JWT errors, rate limit errors (429 with `Retry-After`), and generic 500s |

### Plugin Loading

Plugins are loaded via `@fastify/autoload` in `src/config/plugin.register.ts` with `encapsulate: false` — this ensures decorators like `fastify.jwt` are accessible in route handlers.

---

## Testing

### Run Tests

```bash
# Unit/integration tests (requires live PostgreSQL)
npm test

# Load test (100 connections, 10s, 14 endpoints)
npm run test:load
```

### Integration Tests

Uses **Node.js built-in `node:test`** runner with **Fastify `app.inject()`** (no real HTTP server needed).

**9 Test Suites, 67 Tests:**

| Suite | Tests | Coverage |
|-------|-------|----------|
| Health Check | 1 | GET /health, DB connection |
| Authentication | 11 | Register, duplicate email, short password, invalid email, login, wrong password, me, unauth, validate, invalid token |
| Admin Setup | 1 | Promote user to admin via DB |
| Products | 19 | Create, unauthenticated, input validation, negative price, empty name, list, pagination (page 1 & 2), sort asc/desc, get by ID, 404, update, zero price, stock update, zero stock, toggle status, delete non-admin |
| API Keys | 9 | Create, unauthenticated, empty name validation, list, auth via X-API-Key, invalid key, revoke, revoked key rejected, non-existent key |
| Second User Setup | 1 | Register user2 + create product |
| Products — Ownership | 4 | Non-owner can't update, can't update stock, owner can update, owner can update stock |
| Moderator Setup | 1 | Register moderator + promote via DB |
| Users | 20 | List (denied for regular, moderator, admin), pagination, sort, get by ID, 404, update, invalid email, change password, wrong password, toggle (non-admin, mod, admin), delete (non-admin, mod, user1, user2, mod, self) |

Tests are **stateful** — each suite builds on previous results (registered users, tokens, product IDs).

### Error Response Helper

Tests use `assertErrorResponse(res, statusCode)` helper that asserts `success === false`, `error` (string), `message` (string), and `statusCode` on every error test.

### Load Test

Uses **autocannon** (100 connections, 10 pipelining, 10s duration) testing 14 endpoints:

1. GET /health
2. POST /auth/register
3. POST /auth/login
4. GET /auth/me
5. POST /auth/validate
6. GET /users (admin)
7. GET /users/:id
8. GET /products
9. POST /products
10. GET /products/:id
11. PUT /products/:id
12. PATCH /products/:id/stock
13. PATCH /products/:id/toggle-status (admin)
14. PATCH /users/:id/toggle-status (admin)

Results saved to `test/load-test-results.json`. See `log.md` for analysis.

---

## Deployment

### Build & Run

```bash
npm run build
npm start
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `JWT_SECRET` to a strong 32+ character secret
- [ ] Set `CORS_ORIGIN` to specific domain(s)
- [ ] Disable Swagger (`ENABLE_SWAGGER` unset or `false`)
- [ ] Use HTTPS reverse proxy (nginx, caddy, Cloudflare)
- [ ] Set `BCRYPT_ROUNDS` to 12+ (default in code, dev uses 4)
- [ ] Set `RATE_LIMIT_MAX` appropriately for production traffic
- [ ] Set up database backups
- [ ] Monitor via `GET /health`

### PM2

```bash
npm run build
pm2 start dist/server.js --name fastify-api
pm2 save && pm2 startup
```

---

## Endpoint Summary

| # | Endpoint | Method | Auth | Role | Description |
|---|----------|--------|------|------|-------------|
| 1 | `/health` | GET | No | Public | Health check |
| 2 | `/api/v1/auth/register` | POST | No | Public | Register user |
| 3 | `/api/v1/auth/login` | POST | No | Public | Login |
| 4 | `/api/v1/auth/me` | GET | JWT/Key | User | Current profile |
| 5 | `/api/v1/auth/validate` | POST | JWT/Key | User | Validate token |
| 6 | `/api/v1/api-keys` | POST | JWT/Key | User | Create API key |
| 7 | `/api/v1/api-keys` | GET | JWT/Key | User | List API keys |
| 8 | `/api/v1/api-keys/:id` | DELETE | JWT/Key | User | Revoke API key |
| 9 | `/api/v1/users` | GET | JWT/Key | Admin, Moderator | List users (paginated) |
| 10 | `/api/v1/users/:id` | GET | JWT/Key | User | Get user by ID |
| 11 | `/api/v1/users/:id` | PUT | JWT/Key | Owner, Admin | Update user |
| 12 | `/api/v1/users/:id` | DELETE | JWT/Key | Admin | Delete user |
| 13 | `/api/v1/users/:id/change-password` | POST | JWT/Key | Owner, Admin | Change password |
| 14 | `/api/v1/users/:id/toggle-status` | PATCH | JWT/Key | Admin | Toggle status |
| 15 | `/api/v1/products` | GET | JWT/Key | User | List products (paginated) |
| 16 | `/api/v1/products/:id` | GET | JWT/Key | User | Get product by ID |
| 17 | `/api/v1/products` | POST | JWT/Key | User | Create product |
| 18 | `/api/v1/products/:id` | PUT | JWT/Key | Owner, Admin | Update product |
| 19 | `/api/v1/products/:id` | DELETE | JWT/Key | Admin | Delete product |
| 20 | `/api/v1/products/:id/stock` | PATCH | JWT/Key | Owner, Admin | Update stock |
| 21 | `/api/v1/products/:id/toggle-status` | PATCH | JWT/Key | Admin | Toggle status |
| 22 | `/api/v1/stream/master.m3u8` | GET | JWT/Key | User | Master HLS playlist |
| 23 | `/api/v1/stream/:resolution/:file` | GET | JWT/Key | User | HLS resolution playlist or segment |

---

## Changelog

### v1.2.0 (2026-07-28)

- **HLS Adaptive Streaming** — Transcode 1.mp4 to 6 resolutions (1440p→240p) with FFmpeg, serve via authenticated endpoints
- **Custom Video Player** — Plyr v3.8.4 + hls.js v1.6.16 with quality/speed controls, fullscreen, PiP, keyboard shortcuts
- **Authored HLS Streaming** — JWT/API Key auth on all stream endpoints, custom AuthLoader for HLS.js, path traversal protection
- **Footer** — Sticky footer with app info, flex layout positions it at bottom
- **Quality Selector Fix** — Plain number array for Plyr quality options, event listeners registered before loadSource, switchingLevel guard prevents feedback loop
- **Static Plugin Fix** — `decorateReply: true` enables SPA fallback via `reply.sendFile()`
- **23 Endpoints** — Added 2 streaming endpoints (master.m3u8, resolution/file)

### v1.1.0 (2026-07-27)

- **API Key Authentication** — Create, list, revoke API keys. Authenticate via `X-API-Key` header with SHA-256 hashing and 30-day expiry
- **Pagination & Sorting** — All list endpoints support `page`, `limit`, `sortBy`, `sortOrder` query params
- **Ownership Enforcement** — Users can only update/delete their own products; admins can update any
- **User Cache** — In-memory LRU cache (60s TTL, 10k max) for JWT auth lookups
- **Per-Route Rate Limiting** — Auth endpoints have separate configurable rate limit
- **Rate Limit Headers** — `x-ratelimit-limit`, `x-ratelimit-remaining`, `x-ratelimit-reset`, `retry-after` headers
- **Centralized Error Handling** — `AppError` class with static factories, ZodError mapping, 429 Retry-After header
- **Static File Serving** — SPA support from `public/dist/` with API 404 fallback
- **Compression** — gzip/deflate in production (threshold 1024 bytes)
- **Configurable bcrypt rounds** — `BCRYPT_ROUNDS` env var
- **Moderator Role** — Moderator can list all users and products
- **67 Tests** — Expanded from 34 to 67 across 9 suites (API Keys, Ownership, Moderator, Pagination)

### v1.0.0 (2026-07-22)

- Initial release
- JWT authentication (register, login, me, validate)
- Role-based access control (admin, moderator, user)
- CRUD Users (get all, get by ID, update, delete, change password, toggle status)
- CRUD Products (get all, get by ID, create, update, delete, update stock, toggle status)
- Rate limiting
- Swagger/OpenAPI documentation
- Health check endpoint
- PostgreSQL with Drizzle ORM
- Integration tests (34 tests)
- Docker support

---

**Built with Fastify v5.7.2 + Drizzle ORM + PostgreSQL**
