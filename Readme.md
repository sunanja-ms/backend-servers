# Fastify Backend API v1.0.0

Dokumentasi lengkap backend REST API dibangun dengan **Fastify v5**, **Drizzle ORM**, dan **PostgreSQL**.

---

## Daftar Isi

1. [Tentang Proyek](#tentang-proyek)
2. [Tech Stack](#tech-stack)
3. [Arsitektur Proyek](#arsitektur-proyek)
4. [Persiapan Lingkungan](#persiapan-lingkungan)
5. [Instalasi & Menjalankan](#instalasi--menjalankan)
6. [Schema Database](#schema-database)
7. [Autentikasi & Otorisasi](#autentikasi--otorisasi)
8. [Referensi API](#referensi-api)
9. [Penanganan Error](#penanganan-error)
10. [Plugin & Middleware](#plugin--middleware)
11. [Pengujian (Testing)](#pengujian-testing)
12. [Deployment](#deployment)
13. [Tabel Ringkasan Endpoint](#tabel-ringkasan-endpoint)
14. [Catatan Pengembangan](#catatan-pengembangan)
15. [Changelog](#changelog)

---

## Tentang Proyek

Backend REST API untuk manajemen pengguna dan produk. Dibangun dengan arsitektur modular menggunakan pola MVC (Model-View-Controller) dan menerapkan autentikasi JWT, otorisasi berbasis peran (Role-Based Access Control), serta validasi data menggunakan Zod.

### Fitur Utama

- Autentikasi JWT (Register, Login, Token Validation)
- Otorisasi berbasis peran: Admin, Moderator, User
- CRUD lengkap untuk Users dan Products
- Manajemen stok produk
- Toggle status aktif/nonaktif untuk users dan products
- Rate limiting untuk proteksi DDoS
- Swagger/OpenAPI documentation
- Health check endpoint
- Validasi input dengan Zod
- Error handling terstruktur
- Logging dengan Pino

---

## Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Fastify | ^5.7.2 | HTTP framework utama |
| TypeScript | ^5.9.2 | Type-safe JavaScript |
| Drizzle ORM | ^0.45.1 | Database ORM untuk PostgreSQL |
| PostgreSQL | - | Database relasional |
| Zod | ^3.25.76 | Schema validation |
| @fastify/jwt | ^10.1.0 | Autentikasi JWT |
| @fastify/cors | ^11.2.0 | Cross-Origin Resource Sharing |
| @fastify/helmet | ^13.0.0 | Security headers |
| @fastify/rate-limit | ^10.0.0 | Rate limiting |
| @fastify/swagger | ^9.7.0 | OpenAPI documentation |
| @fastify/compress | ^9.1.0 | Gzip compression |
| @fastify/sensible | ^6.0.0 | Sensible defaults |
| @fastify/autoload | ^6.0.0 | Auto-load plugins & routes |
| bcryptjs | ^3.0.0 | Password hashing |
| pino | ^9.6.0 | Structured logging |
| pino-pretty | ^13.0.0 | Log formatting (dev) |
| drizzle-kit | ^0.30.0 | Database migrations & studio |

---

## Arsitektur Proyek

### Struktur Direktori

```
backend-server/
├── .env                          # Environment variables
├── .gitignore                    # Git ignore file
├── drizzle.config.ts             # Drizzle ORM config
├── package.json                  # Project dependencies
├── tsconfig.json                 # TypeScript config
│
├── src/
│   ├── app.ts                    # Build server (untuk testing)
│   ├── server.ts                 # Entry point (start server)
│   │
│   ├── config/
│   │   ├── db.connection.ts      # Koneksi database pool
│   │   ├── db.schemas.ts         # Database schemas (users, products)
│   │   ├── env.ts                # Environment validation (Zod)
│   │   └── plugin.register.ts    # Plugin registration (autoload)
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts    # Handler request auth
│   │   ├── product.controller.ts # Handler request product
│   │   └── user.controller.ts    # Handler request user
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # Verifikasi JWT + pengecekan role
│   │   └── error.middleware.ts   # Penanganan error (Zod, JWT, generic)
│   │
│   ├── models/
│   │   ├── product.model.ts      # Query database product (Drizzle)
│   │   └── user.model.ts         # Query database user (Drizzle)
│   │
│   ├── plugins/
│   │   ├── compress.plugin.ts    # Kompresi Gzip
│   │   ├── cors.plugin.ts        # Konfigurasi CORS
│   │   ├── helmet.plugin.ts      # Security headers
│   │   ├── jwt.plugin.ts         # JWT sign/verify
│   │   ├── rate-limit.plugin.ts  # Rate limiting
│   │   ├── sensible.plugin.ts    # Sensible defaults
│   │   └── swagger.plugin.ts     # Swagger/OpenAPI docs
│   │
│   ├── routes/
│   │   └── v1/
│   │       ├── auth.routes.ts    # Rute auth (register, login, me, validate)
│   │       ├── product.routes.ts # Rute product (CRUD, stock, toggle)
│   │       └── user.routes.ts    # Rute user (CRUD, password, toggle)
│   │
│   ├── schemas/
│   │   ├── product.schema.ts     # Validasi Zod untuk product
│   │   └── user.schema.ts        # Validasi Zod untuk user
│   │
│   ├── services/
│   │   ├── auth.service.ts       # Logika bisnis auth
│   │   ├── product.service.ts    # Logika bisnis product
│   │   └── user.service.ts       # Logika bisnis user
│   │
│   ├── types/
│   │   └── index.ts              # Definisi tipe TypeScript
│   │
│   └── utils/
│       ├── health.routes.ts      # Health check endpoint
│       ├── logger.ts             # Konfigurasi logger
│       └── validator.ts          # Utilitas validasi Zod
│
├── test/
│   ├── routes.test.ts            # Integration tests (34 tests, node:test)
│   └── load-test.mjs             # Load testing script
│
└── drizzle/
    ├── 0000_giant_surge.sql      # Migration SQL
    └── meta/
        ├── 0000_snapshot.json    # Schema snapshot
        └── _journal.json         # Migration journal
```

### Arsitektur Request Flow

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
│   Plugins   │  CORS, Helmet, Rate Limit, JWT, Swagger
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Middleware  │  authMiddleware, errorMiddleware
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Routes    │  auth.routes, user.routes, product.routes
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Controllers │  AuthController, UserController, ProductController
└─────┬───────┘
      │
      ▼
┌─────────────┐
│  Services   │  AuthService, UserService, ProductService
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Models    │  userModel, productModel (Drizzle queries)
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ PostgreSQL  │
└─────────────┘
```

---

## Persiapan Lingkungan

### Prasyarat

- Node.js >= 20.x
- PostgreSQL >= 14.x
- npm atau pnpm

### Variabel Environment

Buat file `.env` di root proyek:

```env
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-secret-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
```

### Referensi Environment Variables

| Variable | Tipe | Default | Deskripsi |
|----------|------|---------|-----------|
| `NODE_ENV` | `development\|production\|test` | `development` | Mode lingkungan |
| `PORT` | `string` | `3000` | Port server |
| `HOST` | `string` | `0.0.0.0` | Host server |
| `DATABASE_URL` | `string` | - | Koneksi PostgreSQL (wajib) |
| `JWT_SECRET` | `string` | - | Secret key JWT (min 32 karakter, wajib) |
| `JWT_EXPIRES_IN` | `string` | `7d` | Masa aktif token JWT |
| `RATE_LIMIT_MAX` | `string` | `100` | Maks request per window |
| `RATE_LIMIT_WINDOW` | `string` | `60000` | Window rate limit (ms) |
| `CORS_ORIGIN` | `string` | `*` | Origin yang diizinkan (pisahkan dengan koma) |
| `LOG_LEVEL` | `string` | `info` | Level logging Pino |

---

## Instalasi & Menjalankan

### 1. Clone & Install

```bash
git clone <repository-url>
cd backend-server
npm install
```

### 2. Setup Database

```bash
# Generate migration
npm run db:generate

# Jalankan migration
npm run db:migrate

# Atau push schema langsung (development)
npm run db:push

# Buka Drizzle Studio (GUI)
npm run db:studio
```

### 3. Menjalankan Server

```bash
# Development (dengan hot reload)
npm run dev

# Build untuk production
npm run build

# Jalankan production
npm start
```

Server akan berjalan di `http://localhost:3000` dan Swagger docs di `http://localhost:3000/docs`.

### Scripts yang Tersedia

| Script | Deskripsi |
|--------|-----------|
| `npm run dev` | Jalankan development server dengan hot reload |
| `npm run build` | Compile TypeScript ke JavaScript |
| `npm start` | Jalankan server production |
| `npm test` | Jalankan integration tests |
| `npm run test:load` | Jalankan load testing |
| `npm run db:generate` | Generate migration dari schema |
| `npm run db:migrate` | Jalankan migration |
| `npm run db:push` | Push schema ke database |
| `npm run db:studio` | Buka Drizzle Studio |

---

## Schema Database

### Tabel Users

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | `serial` | `PRIMARY KEY` | ID unik pengguna |
| `email` | `varchar(255)` | `NOT NULL, UNIQUE` | Email pengguna |
| `password` | `text` | `NOT NULL` | Password ter-hash (bcrypt) |
| `name` | `varchar(100)` | `NOT NULL` | Nama pengguna |
| `role` | `user_role enum` | `DEFAULT 'user'` | Peran (`admin`, `user`, `moderator`) |
| `is_active` | `boolean` | `DEFAULT true` | Status aktif |
| `last_login_at` | `timestamp` | `NULLABLE` | Terakhir login |
| `created_at` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Waktu pembuatan |
| `updated_at` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Waktu update terakhir |

**Indexes:**
- `email_idx` — UNIQUE index pada `email`
- `role_idx` — Index pada `role`

### Tabel Products

| Kolom | Tipe | Constraint | Deskripsi |
|-------|------|------------|-----------|
| `id` | `serial` | `PRIMARY KEY` | ID unik produk |
| `name` | `varchar(255)` | `NOT NULL` | Nama produk |
| `description` | `text` | `NULLABLE` | Deskripsi produk |
| `price` | `decimal(10,2)` | `NOT NULL` | Harga produk |
| `stock` | `integer` | `NOT NULL, DEFAULT 0` | Stok produk |
| `user_id` | `integer` | `FOREIGN KEY → users.id ON DELETE CASCADE` | ID pemilik produk |
| `is_active` | `boolean` | `DEFAULT true` | Status aktif |
| `created_at` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Waktu pembuatan |
| `updated_at` | `timestamp` | `NOT NULL, DEFAULT NOW()` | Waktu update terakhir |

**Indexes:**
- `user_id_idx` — Index pada `user_id`
- `name_idx` — Index pada `name`

### Relasi

```
users (1) ──────< (n) products
         one-to-many
         ON DELETE CASCADE
```

---

## Autentikasi & Otorisasi

### Alur Autentikasi JWT

```
1. Register (POST /api/v1/auth/register)
   │
   │  Request: { email, password, name }
   │  Password di-hash dengan bcrypt
   │  User disimpan ke database
   │
   ▼
2. Login (POST /api/v1/auth/login)
   │
   │  Request: { email, password }
   │  Verifikasi password dengan bcrypt
   │  Generate JWT token (7 hari)
   │
   ▼
3. Akses Endpoint Terproteksi
   │
   │  Header: Authorization: Bearer <token>
   │  JWT middleware memverifikasi token
   │  User data dilampirkan ke request
   │
   ▼
4. Role Check (jacent diperlukan)
   │
   │  requireRole(['admin']) memeriksa role user
   │  Jika role tidak sesuai → 403 Forbidden
   │
   ▼
5. Handler menangani request
```

### Role & Permissions

| Role | Keterangan | Permissions |
|------|------------|-------------|
| `admin` | Administrator | Full akses ke semua resource. Bisa hapus users/products, toggle status, melihat semua data |
| `moderator` | Moderator | Bisa melihat semua users dan semua products |
| `user` | User biasa | Kelola profil sendiri, kelola products sendiri. Hanya bisa melihat data sendiri |

### Contoh Header Autentikasi

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

---

## Referensi API

**Base URL:**

```
Development: http://localhost:3000
Production:  https://api.yourdomain.com
```

**API Version:** `/api/v1`

---

### 1. Health Check

#### GET /health

Cek status server dan database. **Tidak memerlukan autentikasi.**

**Response (200 OK):**

```json
{
  "status": "ok",
  "timestamp": "2026-07-22T15:26:09.998Z",
  "uptime": 123.45,
  "environment": "development",
  "database": {
    "status": "connected",
    "totalCount": 10,
    "idleCount": 5,
    "waitingCount": 0
  }
}
```

---

### 2. Authentication (Auth)

#### POST /api/v1/auth/register

Register user baru. **Tidak memerlukan autentikasi.**

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `email` | `string` | Ya | Email (format valid, unik) |
| `password` | `string` | Ya | Password (minimal 6 karakter) |
| `name` | `string` | Ya | Nama lengkap (minimal 2 karakter) |

**Contoh Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

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
    "createdAt": "2026-07-22T15:26:09.998Z"
  }
}
```

---

#### POST /api/v1/auth/login

Login user dan dapatkan JWT token. **Tidak memerlukan autentikasi.**

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `email` | `string` | Ya | Email terdaftar |
| `password` | `string` | Ya | Password |

**Contoh Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
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

Dapatkan profil user yang sedang login. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
```

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
    "lastLoginAt": "2026-07-22T15:26:09.998Z",
    "createdAt": "2026-07-22T15:26:09.998Z"
  }
}
```

---

#### POST /api/v1/auth/validate

Validasi JWT token. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
```

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

### 3. Users Management

Semua endpoint users memerlukan **Autentikasi**.

#### GET /api/v1/users

Dapatkan semua users. **Admin & Moderator Only.**

**Headers:**

```http
Authorization: Bearer <token>
```

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
      "lastLoginAt": "2026-07-22T15:26:09.998Z",
      "createdAt": "2026-07-22T15:26:09.998Z"
    }
  ]
}
```

---

#### GET /api/v1/users/:id

Dapatkan user berdasarkan ID. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID user |

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
    "lastLoginAt": "2026-07-22T15:26:09.998Z",
    "createdAt": "2026-07-22T15:26:09.998Z"
  }
}
```

---

#### PUT /api/v1/users/:id

Update user. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID user |

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `name` | `string` | Tidak | Nama baru (minimal 2 karakter) |
| `email` | `string` | Tidak | Email baru (format valid) |

**Contoh Request:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "email": "jane@example.com",
    "name": "Jane Doe",
    "role": "user",
    "isActive": true
  }
}
```

---

#### DELETE /api/v1/users/:id

Hapus user. **Admin Only.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID user |

**Response (204 No Content)**

---

#### POST /api/v1/users/:id/change-password

Ganti password user. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID user |

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `currentPassword` | `string` | Ya | Password saat ini (minimal 6 karakter) |
| `newPassword` | `string` | Ya | Password baru (minimal 6 karakter) |

**Contoh Request:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

#### PATCH /api/v1/users/:id/toggle-status

Aktifkan/nonaktifkan user. **Admin Only.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID user |

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `isActive` | `boolean` | Ya | Status aktif (`true`/`false`) |

**Contoh Request:**

```json
{
  "isActive": false
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "id": 1,
    "email": "jane@example.com",
    "name": "Jane Doe",
    "role": "user",
    "isActive": false
  }
}
```

---

### 4. Products Management

Semua endpoint products memerlukan **Autentikasi**.

#### GET /api/v1/products

Dapatkan semua products. **User biasa hanya melihat products sendiri. Admin/Moderator melihat semua.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Product 1",
      "description": "Description product",
      "price": "100000.00",
      "stock": 10,
      "userId": 1,
      "isActive": true,
      "createdAt": "2026-07-22T15:26:09.998Z",
      "updatedAt": "2026-07-22T15:26:09.998Z"
    }
  ]
}
```

---

#### GET /api/v1/products/:id

Dapatkan product berdasarkan ID. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID product |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Product 1",
    "description": "Description product",
    "price": "100000.00",
    "stock": 10,
    "userId": 1,
    "isActive": true,
    "createdAt": "2026-07-22T15:26:09.998Z",
    "updatedAt": "2026-07-22T15:26:09.998Z"
  }
}
```

---

#### POST /api/v1/products

Buat product baru. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `name` | `string` | Ya | Nama product (minimal 1 karakter) |
| `description` | `string` | Tidak | Deskripsi product |
| `price` | `number` | Ya | Harga product (positif) |
| `stock` | `number` | Tidak | Stok product (default: 0) |

**Contoh Request:**

```json
{
  "name": "Product 1",
  "description": "Description product",
  "price": 100000,
  "stock": 10
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Product 1",
    "description": "Description product",
    "price": "100000.00",
    "stock": 10,
    "userId": 1,
    "isActive": true,
    "createdAt": "2026-07-22T15:26:09.998Z"
  }
}
```

---

#### PUT /api/v1/products/:id

Update product. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID product |

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `name` | `string` | Tidak | Nama product |
| `description` | `string` | Tidak | Deskripsi product |
| `price` | `number` | Tidak | Harga product |
| `stock` | `number` | Tidak | Stok product |
| `isActive` | `boolean` | Tidak | Status aktif |

**Contoh Request:**

```json
{
  "name": "Product 1 Updated",
  "price": 150000,
  "stock": 20,
  "description": "Updated description"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Product 1 Updated",
    "description": "Updated description",
    "price": "150000.00",
    "stock": 20,
    "userId": 1,
    "isActive": true,
    "updatedAt": "2026-07-22T15:26:09.998Z"
  }
}
```

---

#### DELETE /api/v1/products/:id

Hapus product. **Admin Only.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID product |

**Response (204 No Content)**

---

#### PATCH /api/v1/products/:id/stock

Update stok product. **Memerlukan autentikasi.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID product |

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `quantity` | `number` | Ya | Jumlah (harus non-nol, positif untuk menambah) |

**Contoh Request:**

```json
{
  "quantity": 5
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Stock updated successfully",
  "data": {
    "id": 1,
    "name": "Product 1 Updated",
    "stock": 25,
    "updatedAt": "2026-07-22T15:26:09.998Z"
  }
}
```

---

#### PATCH /api/v1/products/:id/toggle-status

Aktifkan/nonaktifkan product. **Admin Only.**

**Headers:**

```http
Authorization: Bearer <token>
```

**Parameters:**

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `id` | `number` | ID product |

**Request Body:**

| Field | Tipe | Wajib | Deskripsi |
|-------|------|-------|-----------|
| `isActive` | `boolean` | Ya | Status aktif (`true`/`false`) |

**Contoh Request:**

```json
{
  "isActive": false
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Product deactivated successfully",
  "data": {
    "id": 1,
    "name": "Product 1 Updated",
    "price": "150000.00",
    "stock": 25,
    "userId": 1,
    "isActive": false
  }
}
```

---

## Penanganan Error

### Format Error Response

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "statusCode": 400,
  "details": []
}
```

### Kode Error yang Sering Terjadi

| Status Code | Tipe | Deskripsi |
|-------------|------|-----------|
| 400 | Bad Request | Validation error, request tidak valid |
| 401 | Unauthorized | Token tidak ada, invalid, atau expired |
| 403 | Forbidden | Tidak punya izin (role tidak sesuai) |
| 404 | Not Found | Resource tidak ditemukan |
| 409 | Conflict | Resource sudah ada (email duplikat) |
| 429 | Too Many Requests | Rate limit terlampaui |
| 500 | Internal Server Error | Error server internal |

### Contoh Error Validation (Zod)

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "statusCode": 400,
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_string"
    }
  ]
}
```

### Contoh Error JWT

**Token tidak ada:**

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Authorization header is required",
  "statusCode": 401
}
```

**Token expired:**

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Token has expired",
  "statusCode": 401
}
```

**Token invalid:**

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid token",
  "statusCode": 401
}
```

### Contoh Error Rate Limit

```json
{
  "success": false,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please try again later.",
  "statusCode": 429
}
```

### Catatan Produksi

Pada mode `production`, pesan error internal tidak ditampilkan ke client untuk keamanan. Response akan selalu:

```json
{
  "success": false,
  "error": "Internal Server Error",
  "message": "Something went wrong",
  "statusCode": 500
}
```

---

## Plugin & Middleware

### Plugins yang Terdaftar

| Plugin | Modul | Deskripsi |
|--------|-------|-----------|
| CORS | `@fastify/cors` | Mengatur Cross-Origin Resource Sharing. Mendukung multiple origins via env `CORS_ORIGIN` |
| Helmet | `@fastify/helmet` | Menambahkan security headers. CSP diaktifkan di production |
| JWT | `@fastify/jwt` | Autentikasi JWT. Token berlaku 7 hari, algoritma HS256 |
| Rate Limit | `@fastify/rate-limit` | Proteksi DDoS. Default: 100 req/60s. Health check dikecualikan |
| Swagger | `@fastify/swagger` | OpenAPI 3.0.3 documentation. Tersedia di `/docs` |
| Compress | `@fastify/compress` | Kompresi gzip/deflate. Aktif di production, threshold 1024 bytes |
| Sensible | `@fastify/sensible` | Sensible defaults untuk Fastify |
| Autoload | `@fastify/autoload` | Auto-load plugins dan routes secara otomatis |

### Konfigurasi Plugin

Plugin didaftarkan melalui `@fastify/autoload` dengan konfigurasi:

- **`encapsulate: false`** — Agar decorators (seperti `fastify.jwt`) tersedia global di semua route handlers
- **`ignorePattern`** — Mengabaikan file test (*.test.ts, *.spec.ts)
- **`maxDepth: 1`** — Hanya load file di direktori langsung

### Middleware

| Middleware | Lokasi | Deskripsi |
|------------|--------|-----------|
| `authMiddleware` | `src/middlewares/auth.middleware.ts` | Verifikasi JWT, cek user aktif, lampirkan data user ke request |
| `requireRole(roles)` | `src/middlewares/auth.middleware.ts` | Cek apakah user punya role yang diizinkan. Return 403 jika tidak |
| `setupErrorHandler` | `src/middlewares/error.middleware.ts` | Global error handler. Menangani ZodError, JWT errors, rate limit, dan generic errors |

### Alur Middleware

```
Request masuk
      │
      ▼
Rate Limit Check ──→ 429 Too Many Requests
      │
      ▼
CORS Check ──→ 403 Forbidden
      │
      ▼
Helmet Headers (ditambahkan ke response)
      │
      ▼
JWT Verify (jika endpoint terproteksi) ──→ 401 Unauthorized
      │
      ▼
User Lookup + Active Check ──→ 401/403
      │
      ▼
Role Check (jika diperlukan) ──→ 403 Forbidden
      │
      ▼
Route Handler
      │
      ▼
Response (dengan compression jika production)
```

---

## Pengujian (Testing)

### Menjalankan Tests

```bash
# Jalankan semua integration tests
npm test

# Jalankan load test
npm run test:load
```

### Integration Tests

Menggunakan **Node.js built-in test runner** (`node:test`) dan **Fastify `inject()`** untuk testing tanpa memulai server secara fisik.

**5 Test Suites, 34 Tests:**

| Suite | Tests | Deskripsi |
|-------|-------|-----------|
| Health Check | 1 | Health endpoint, database connection |
| Authentication | 4 | Register, login, me, validate token |
| Admin Setup | 1 | Promote user ke admin |
| Product Management | 14 | CRUD products, stock update, toggle status, otorisasi |
| User Management | 14 | CRUD users, change password, toggle status, otorisasi |

### Contoh cURL Testing

```bash
# 1. Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.data.token')

# 3. Get Profile
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Create Product
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":100000,"stock":10}'

# 5. Get Products
curl -X GET http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN"

# 6. Update Stock
curl -X PATCH http://localhost:3000/api/v1/products/1/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 5}'

# 7. Health Check
curl -X GET http://localhost:3000/health
```

---

## Deployment

### Docker

```bash
# Build image
docker build -t fastify-backend .

# Jalankan dengan docker-compose
docker-compose up -d

# Lihat logs
docker-compose logs -f
```

### PM2 (Production)

```bash
# Build
npm run build

# Jalankan dengan PM2
pm2 start dist/server.js --name fastify-api
pm2 save
pm2 startup

# Monitor
pm2 monit
pm2 logs fastify-api
```

### Checklist Produksi

- [ ] Set `NODE_ENV=production`
- [ ] Gunakan `JWT_SECRET` yang kuat (min 32 karakter)
- [ ] Set `CORS_ORIGIN` ke domain spesifik (bukan `*`)
- [ ] Konfigurasi `DATABASE_URL` dengan credentials aman
- [ ] Disable Swagger (`ENABLE_SWAGGER=false` atau jangan set `true`)
- [ ] Atur `LOG_LEVEL` ke `info` atau `warn`
- [ ] Gunakan HTTPS reverse proxy (nginx/caddy)
- [ ] Setup database backups
- [ ] Monitor dengan health check endpoint

### Environment Variables Produksi

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:secure-password@host:5432/dbname
JWT_SECRET=your-very-long-and-secure-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
ENABLE_SWAGGER=false
```

---

## Tabel Ringkasan Endpoint

| Endpoint | Method | Auth | Role | Deskripsi |
|----------|--------|------|------|-----------|
| `/health` | GET | Tidak | Public | Health check server & database |
| `/api/v1/auth/register` | POST | Tidak | Public | Register user baru |
| `/api/v1/auth/login` | POST | Tidak | Public | Login & dapatkan token |
| `/api/v1/auth/me` | GET | Ya | User | Dapatkan profil saat ini |
| `/api/v1/auth/validate` | POST | Ya | User | Validasi JWT token |
| `/api/v1/users` | GET | Ya | Admin, Moderator | Dapatkan semua users |
| `/api/v1/users/:id` | GET | Ya | User | Dapatkan user by ID |
| `/api/v1/users/:id` | PUT | Ya | User | Update user |
| `/api/v1/users/:id` | DELETE | Ya | Admin | Hapus user |
| `/api/v1/users/:id/change-password` | POST | Ya | User | Ganti password |
| `/api/v1/users/:id/toggle-status` | PATCH | Ya | Admin | Aktifkan/nonaktifkan user |
| `/api/v1/products` | GET | Ya | User* | Dapatkan semua products |
| `/api/v1/products/:id` | GET | Ya | User | Dapatkan product by ID |
| `/api/v1/products` | POST | Ya | User | Buat product baru |
| `/api/v1/products/:id` | PUT | Ya | User | Update product |
| `/api/v1/products/:id` | DELETE | Ya | Admin | Hapus product |
| `/api/v1/products/:id/stock` | PATCH | Ya | User | Update stok product |
| `/api/v1/products/:id/toggle-status` | PATCH | Ya | Admin | Aktifkan/nonaktifkan product |

> *User biasa hanya melihat products sendiri. Admin/Moderator melihat semua.

### Swagger Documentation

Swagger UI tersedia di: `http://localhost:3000/docs`

---

## Catatan Pengembangan

### ESM Modules

Proyek ini menggunakan **ES Modules** (`"type": "module"` di `package.json`). Semua import menggunakan sintaks ESM:

```typescript
import { FastifyInstance } from 'fastify';
import { db } from './config/db.connection.js';
```

### TypeScript

- Target: ES2022
- Module: Node16/NodeNext
- Strict mode enabled
- Path resolution otomatis dengan `tsc`

### Code Conventions

- **Controller** — Menangani request/response, memanggil service, mengembalikan response terstruktur
- **Service** — Logika bisnis, memanggil model
- **Model** — Query database menggunakan Drizzle ORM
- **Schema** — Validasi input menggunakan Zod
- **Route** — Mendefinisikan endpoint, schema, dan middleware

### Validasi

Menggunakan **Zod** untuk validasi request body di controllers. Error Zod ditangani oleh global error handler dan dikembalikan dalam format terstruktur.

---

## Changelog

### v1.0.0 (2026-07-22)

- Initial release
- Autentikasi JWT (Register, Login, Me, Validate)
- Otorisasi berbasis peran (Admin, Moderator, User)
- CRUD Users (Get All, Get By ID, Update, Delete, Change Password, Toggle Status)
- CRUD Products (Get All, Get By ID, Create, Update, Delete, Update Stock, Toggle Status)
- Rate limiting (100 req/60s)
- Swagger/OpenAPI documentation
- Health check endpoint
- PostgreSQL dengan Drizzle ORM
- Integration tests (34 tests)
- Docker support
- PM2 deployment support

---

**Built with Fastify v5.7.2 + Drizzle ORM + PostgreSQL**
