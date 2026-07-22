## 📚 Fastify Backend API Documentation

# Fastify Backend API v1.0.0

Dokumentasi lengkap API untuk backend Fastify dengan Drizzle ORM dan PostgreSQL.

---

## 📋 Daftar Isi

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Endpoints API](#endpoints-api)
   - [Health Check](#health-check)
   - [Auth](#auth)
   - [Users](#users)
   - [Products](#products)
4. [Error Handling](#error-handling)
5. [Testing](#testing)
6. [Deployment](#deployment)

---

## 🌐 Base URL

```
Development: http://localhost:3000
Production:  https://api.yourdomain.com
```

**API Version:** `/api/v1`

---

## 🔐 Authentication

Semua endpoint (kecuali yang ditandai) memerlukan **Bearer Token** untuk autentikasi.

### Headers:

```http
Authorization: Bearer <your_jwt_token>
Content-Type: application/json
```

---

## 📡 Endpoints API

### 1. Health Check

#### GET /health

Cek status server dan database.

**Response:**

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

Register user baru.

**Body:**

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

Login user.

**Body:**

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

Get current user profile. **(Requires Auth)**

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

Validate JWT token.

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

Semua endpoint users memerlukan **Authentication**.

#### GET /api/v1/users

Get all users. **(Admin Only)**

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

Get user by ID.

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

#### PUT /api/v1/users/:id

Update user.

**Headers:**

```http
Authorization: Bearer <token>
```

**Body:**

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

Delete user. **(Admin Only)**

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (204 No Content)**

---

#### POST /api/v1/users/:id/change-password

Change user password.

**Headers:**

```http
Authorization: Bearer <token>
```

**Body:**

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

Toggle user active status. **(Admin Only)**

**Headers:**

```http
Authorization: Bearer <token>
```

**Body:**

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

Semua endpoint products memerlukan **Authentication**.

#### GET /api/v1/products

Get all products.

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
      "price": 100000,
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

Get product by ID.

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
    "name": "Product 1",
    "description": "Description product",
    "price": 100000,
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

Create new product.

**Headers:**

```http
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

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

Update product.

**Headers:**

```http
Authorization: Bearer <token>
```

**Body:**

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

Delete product. **(Admin Only)**

**Headers:**

```http
Authorization: Bearer <token>
```

**Response (204 No Content)**

---

#### PATCH /api/v1/products/:id/stock

Update product stock.

**Headers:**

```http
Authorization: Bearer <token>
```

**Body:**

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

Toggle product active status. **(Admin Only)**

**Headers:**

```http
Authorization: Bearer <token>
```

**Body:**

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

## ❌ Error Handling

### Error Response Format:

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "statusCode": 400,
  "details": [] // Optional
}
```

### Common Error Codes:

| Status Code | Description                             |
| ----------- | --------------------------------------- |
| 400         | Bad Request - Validation error          |
| 401         | Unauthorized - Invalid/Expired token    |
| 403         | Forbidden - Insufficient permissions    |
| 404         | Not Found - Resource not found          |
| 409         | Conflict - Resource already exists      |
| 429         | Too Many Requests - Rate limit exceeded |
| 500         | Internal Server Error                   |

### Validation Error Example:

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

---

## 🧪 Testing

### Menggunakan cURL:

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
```

### Menggunakan Postman:

**Import Collection:**

```json
{
  "info": {
    "name": "Fastify API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    },
    {
      "key": "token",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "request": {
            "method": "POST",
            "url": "{{baseUrl}}/api/v1/auth/register",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}"
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🚀 Deployment

### Production Build:

```bash
# Build
npm run build

# Run with PM2
pm2 start dist/server.js --name fastify-api
pm2 save
pm2 startup

# Run with Docker
docker-compose up -d
```

### Environment Variables:

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

---

## 📊 API Statistics

| Endpoint                    | Method | Auth Required | Role   |
| --------------------------- | ------ | ------------- | ------ |
| /health                     | GET    | ❌            | Public |
| /auth/register              | POST   | ❌            | Public |
| /auth/login                 | POST   | ❌            | Public |
| /auth/me                    | GET    | ✅            | User   |
| /auth/validate              | POST   | ✅            | User   |
| /users                      | GET    | ✅            | Admin  |
| /users/:id                  | GET    | ✅            | User   |
| /users/:id                  | PUT    | ✅            | User   |
| /users/:id                  | DELETE | ✅            | Admin  |
| /users/:id/change-password  | POST   | ✅            | User   |
| /users/:id/toggle-status    | PATCH  | ✅            | Admin  |
| /products                   | GET    | ✅            | User   |
| /products/:id               | GET    | ✅            | User   |
| /products                   | POST   | ✅            | User   |
| /products/:id               | PUT    | ✅            | User   |
| /products/:id               | DELETE | ✅            | Admin  |
| /products/:id/stock         | PATCH  | ✅            | User   |
| /products/:id/toggle-status | PATCH  | ✅            | Admin  |

---

## 📝 Changelog

### v1.0.0 (2026-07-22)

- ✅ Initial release
- ✅ Authentication with JWT
- ✅ CRUD Users
- ✅ CRUD Products
- ✅ Role-based access (Admin/User)
- ✅ Rate limiting
- ✅ Swagger documentation
- ✅ PostgreSQL with Drizzle ORM

---

## 🔗 Links

- **Swagger UI:** http://localhost:3000/docs
- **Repository:** https://github.com/yourusername/fastify-backend
- **Postman Collection:** [Download](link-to-collection)

---

## 📧 Support

- **Email:** support@example.com
- **Issues:** https://github.com/yourusername/fastify-backend/issues
- **Documentation:** https://docs.example.com

---

**Made with ❤️ using Fastify v5.7.2**
