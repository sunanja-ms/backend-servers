# Architecture Design Document

**Version:** 1.0.0
**Date:** 2026-07-22

---

## 📐 Overall Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Client │
│ (Web/Mobile App) │
└────────────────────┬───────────────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Fastify Server │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ Plugins │ │ Middleware │ │ Routes │ │
│ │ - CORS │ │ - Auth │ │ - /api/v1/auth │ │
│ │ - Helmet │ │ - Error │ │ - /api/v1/users │ │
│ │ - JWT │ │ │ │ - /api/v1/prod │ │
│ │ - RateLimit │ └──────────────┘ └──────────────────┘ │
│ │ - Swagger │ │ │
│ └──────────────┘ │ │
└────────────────────────────────┬──────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Service Layer │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ Auth │ │ User │ │ Product │ │
│ │ Service │ │ Service │ │ Service │ │
│ └──────────────┘ └──────────────┘ └──────────────────┘ │
└────────────────────────────────┬────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Model Layer │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│ │ User │ │ Product │ │ Database │ │
│ │ Model │ │ Model │ │ Connection │ │
│ └──────────────┘ └──────────────┘ └──────────────────┘ │
└────────────────────────────────┬────────────────────────────┘
│
▼
┌─────────────────────────────────────────────────────────────┐
│ Database Layer │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ PostgreSQL 16 │ │
│ │ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │ │
│ │ │ Users │ │ Products │ │ Migrations │ │ │
│ │ │ Table │ │ Table │ │ │ │ │
│ │ └────────────┘ └────────────┘ └──────────────┘ │ │
│ └──────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Folder Structure

```
backend-server/
├── .env # Environment variables
├── .gitignore # Git ignore file
├── docker-compose.yml # Docker configuration
├── Dockerfile # Docker build file
├── drizzle.config.ts # Drizzle ORM config
├── package.json # Project dependencies
├── tsconfig.json # TypeScript config
│
├── src/
│ ├── server.ts # Entry point
│ │
│ ├── config/ # Configuration files
│ │ ├── env.ts # Environment validation
│ │ ├── db.connection.ts # Database connection
│ │ ├── db.schemas.ts # Database schemas
│ │ └── plugin.register.ts # Plugin registration
│ │
│ ├── plugins/ # Fastify plugins
│ │ ├── cors.plugin.ts
│ │ ├── helmet.plugin.ts
│ │ ├── jwt.plugin.ts
│ │ ├── rate-limit.plugin.ts
│ │ ├── sensible.plugin.ts
│ │ └── swagger.plugin.ts
│ │
│ ├── middlewares/ # Middleware functions
│ │ ├── auth.middleware.ts
│ │ └── error.middleware.ts
│ │
│ ├── routes/ # API routes
│ │ └── v1/
│ │ ├── auth.routes.ts
│ │ ├── user.routes.ts
│ │ └── product.routes.ts
│ │
│ ├── controllers/ # Request handlers
│ │ ├── auth.controller.ts
│ │ ├── user.controller.ts
│ │ └── product.controller.ts
│ │
│ ├── services/ # Business logic
│ │ ├── auth.service.ts
│ │ ├── user.service.ts
│ │ └── product.service.ts
│ │
│ ├── models/ # Database models
│ │ ├── user.model.ts
│ │ └── product.model.ts
│ │
│ ├── schemas/ # Validation schemas
│ │ ├── user.schema.ts
│ │ └── product.schema.ts
│ │
│ ├── types/ # TypeScript types
│ │ └── index.ts
│ │
│ └── utils/ # Utility functions
│ ├── logger.ts
│ ├── validator.ts
│ └── health.routes.ts
│
└── dist/ # Build output
```

---

## 🔄 Data Flow

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Fastify
    participant AuthService
    participant UserModel
    participant Database

    Client->>Fastify: POST /auth/register
    Fastify->>AuthService: register(data)
    AuthService->>UserModel: findByEmail(email)
    UserModel->>Database: SELECT users
    Database-->>UserModel: User exists?
    UserModel-->>AuthService: null/User
    AuthService->>UserModel: create(data)
    UserModel->>Database: INSERT users
    Database-->>UserModel: New user
    UserModel-->>AuthService: User data
    AuthService-->>Fastify: User created
    Fastify-->>Client: 201 Created
```

### Request Flow

```
1. Client Request
   └─▶ HTTP Request
       └─▶ Fastify Server
           └─▶ Plugins (CORS, Helmet, RateLimit)
               └─▶ Auth Middleware (if required)
                   └─▶ Route Handler
                       └─▶ Controller
                           └─▶ Service
                               └─▶ Model
                                   └─▶ Database
                                       └─▶ Response
```

---

## 🛠️ Technology Stack

### Why These Technologies?

| Technology      | Version      | Reason                                              |
| --------------- | ------------ | --------------------------------------------------- |
| **Fastify**     | 5.7.2        | High performance, low overhead, built-in validation |
| **TypeScript**  | 5.9.2        | Type safety, better DX, maintainability             |
| **Drizzle ORM** | 0.45.1       | Type-safe queries, lightweight, SQL-like syntax     |
| **PostgreSQL**  | 16           | Reliable, ACID compliant, JSON support              |
| **Pino**        | 9.6.0        | Extremely fast, JSON logging, structured logs       |
| **Zod**         | 3.25.76      | Type-safe validation, schema definition             |
| **bcryptjs**    | 3.0.0        | Industry standard for password hashing              |
| **JWT**         | @fastify/jwt | Secure authentication, stateless                    |

### Package Architecture

```mermaid
graph TD
    A[Fastify] --> B[@fastify/autoload]
    A --> C[@fastify/cors]
    A --> D[@fastify/helmet]
    A --> E[@fastify/jwt]
    A --> F[@fastify/rate-limit]
    A --> G[@fastify/sensible]
    A --> H[@fastify/swagger]
    A --> I[@fastify/swagger-ui]

    J[Drizzle ORM] --> K[pg]
    L[Zod] --> A
    M[Pino] --> A
    N[bcryptjs] --> O[Auth Service]
```

---

## 🔒 Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────┐
│                 Security Layers             │
├─────────────────────────────────────────────┤
│  1. Helmet.js (Security Headers)            │
│  2. CORS (Cross-Origin Resource Sharing)    │
│  3. Rate Limiting (DDoS Protection)         │
│  4. JWT Authentication                      │
│  5. Role-Based Access Control               │
│  6. Input Validation (Zod)                 │
│  7. Password Hashing (bcrypt)              │
│  8. Environment Variables                  │
└─────────────────────────────────────────────┘
```

### Authentication Flow

```typescript
// JWT Token Structure
{
  id: number,
  email: string,
  name: string,
  role: 'admin' | 'user' | 'moderator'
}

// Header Requirement
Authorization: Bearer <token>

// Password Hashing
const salt = await bcrypt.genSalt(12);
const hash = await bcrypt.hash(password, salt);
```

---

## 📊 Database Schema

### ER Diagram

```mermaid
erDiagram
    users {
        serial id PK
        varchar email UK
        text password
        varchar name
        user_role role
        boolean is_active
        timestamp last_login_at
        timestamp created_at
        timestamp updated_at
    }

    products {
        serial id PK
        varchar name
        text description
        decimal price
        integer stock
        integer user_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    users ||--o{ products : "has"
```

### Indexes

```sql
-- Users Table
CREATE UNIQUE INDEX email_idx ON users (email);
CREATE INDEX role_idx ON users (role);

-- Products Table
CREATE INDEX user_id_idx ON products (user_id);
CREATE INDEX name_idx ON products (name);
```

---

## 🔄 Error Handling Strategy

### Error Flow

```
1. Error Occurs
   └─▶ Fastify Error Handler
       ├─▶ ZodError → 400 Validation Error
       ├─▶ JWT Error → 401 Unauthorized
       ├─▶ RateLimit → 429 Too Many Requests
       └─▶ Generic → 500 Internal Server Error
           └─▶ Log to Pino
               └─▶ Response with Error Details
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  details?: unknown;
}
```

---

## 🚀 Deployment Architecture

### Docker Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: fastify_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:password@postgres:5432/fastify_db
    depends_on:
      postgres:
        condition: service_healthy
```

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Security
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRES_IN=7d

# Rate Limit
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

---

## 📈 Performance Optimization

### Optimization Strategies

1. **Database Optimization**
   - Proper indexing
   - Connection pooling
   - Query optimization

2. **API Optimization**
   - Compression (gzip/brotli)
   - Response caching
   - Payload validation

3. **Application Optimization**
   - Async/await non-blocking
   - Logging level management
   - Memory optimization

---

## 🔐 Monitoring & Logging

### Logging Strategy

```typescript
// Pino Logger Configuration
const logger = pino({
  level: env.LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
    },
  },
});

// Log Levels
logger.fatal("Application crash");
logger.error("Error occurred");
logger.warn("Warning message");
logger.info("Info message");
logger.debug("Debug info");
logger.trace("Trace info");
```

### Health Check

```typescript
GET /health
{
  status: 'ok',
  timestamp: '2026-07-22T15:26:09.998Z',
  uptime: 123.45,
  environment: 'development',
  database: {
    status: 'connected',
    totalCount: 10,
    idleCount: 5
  }
}
```

---

## 🧪 Testing Strategy

### Testing Pyramid

```
    ┌─────────┐
    │  E2E    │
    │  Tests  │
   ┌┴─────────┴┐
   │  Integration │
   │   Tests     │
  ┌┴─────────────┴┐
  │    Unit Tests  │
  └────────────────┘
```

### Test Types

1. **Unit Tests**: Service layer, Models
2. **Integration Tests**: API endpoints, Database
3. **E2E Tests**: Full user flows

---

## 📝 Development Workflow

```mermaid
gitGraph
    commit
    branch develop
    checkout develop
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout develop
    merge feature
    commit
    branch release
    checkout release
    commit
    checkout main
    merge release
```

### Development Process

1. **Feature Development**
   - Create feature branch from `develop`
   - Write code with tests
   - Code review
   - Merge to `develop`

2. **Release Process**
   - Create release branch
   - Update version
   - Run tests
   - Deploy to staging
   - Merge to `main`

3. **Hotfix Process**
   - Create hotfix branch from `main`
   - Fix critical bug
   - Deploy urgent fix
   - Merge to `main` and `develop`
