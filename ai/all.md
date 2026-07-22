# 1. PRD (Product Requirements Document)

````markdown
# Product Requirements Document (PRD)

## Fastify Backend API Platform

**Version:** 1.0.0
**Date:** 2026-07-22
**Status:** Draft

---

## 📋 Project Overview

### Project Name

Fastify Backend API Platform - Production-ready REST API with Drizzle ORM and PostgreSQL

### Project Vision

Membangun backend API yang scalable, secure, dan maintainable untuk aplikasi modern menggunakan Fastify dengan arsitektur modular dan best practices terbaru.

### Project Scope

- Backend API untuk authentication, user management, dan product management
- Integrasi dengan PostgreSQL database
- Dokumentasi API dengan Swagger/OpenAPI
- Security features (JWT, rate limiting, CORS, helmet)
- Production-ready dengan logging dan error handling

---

## 🎯 MVP (Minimum Viable Product)

### Core Features

1. **Authentication System**
   - User registration
   - User login
   - JWT token generation
   - Token validation
   - User profile

2. **User Management**
   - Get all users (Admin only)
   - Get user by ID
   - Update user
   - Delete user
   - Change password
   - Toggle user status

3. **Product Management**
   - Create product
   - Get all products
   - Get product by ID
   - Update product
   - Delete product
   - Update product stock
   - Toggle product status

4. **Security Features**
   - JWT authentication
   - Role-based access control (Admin/User)
   - Rate limiting
   - CORS configuration
   - Helmet security headers

5. **Infrastructure**
   - PostgreSQL database with Drizzle ORM
   - Environment configuration
   - Logging system
   - Error handling
   - API documentation

---

## 📊 Success Metrics

### Technical Metrics

| Metric              | Target  | Measurement           |
| ------------------- | ------- | --------------------- |
| API Response Time   | < 100ms | Average response time |
| Uptime              | 99.9%   | Server availability   |
| Error Rate          | < 1%    | 5xx errors percentage |
| Database Query Time | < 50ms  | Average query time    |
| Code Coverage       | > 80%   | Test coverage         |

### Business Metrics

| Metric            | Target       | Measurement          |
| ----------------- | ------------ | -------------------- |
| User Registration | > 100/day    | Daily registrations  |
| Active Users      | > 1000/month | Monthly active users |
| API Requests      | > 10,000/day | Daily API calls      |

---

## 🛠 Technical Requirements

### Backend Requirements

- **Runtime:** Node.js 20+
- **Framework:** Fastify 5.7+
- **ORM:** Drizzle ORM 0.45+
- **Database:** PostgreSQL 16+
- **Language:** TypeScript 5.9+
- **Module System:** ES Modules (ESM)

### Required Dependencies

```json
{
  "dependencies": {
    "@fastify/autoload": "^6.0.0",
    "@fastify/cors": "^11.2.0",
    "@fastify/helmet": "^13.0.0",
    "@fastify/jwt": "^10.1.0",
    "@fastify/rate-limit": "^10.0.0",
    "@fastify/sensible": "^6.0.0",
    "@fastify/swagger": "^9.7.0",
    "@fastify/swagger-ui": "^5.0.0",
    "bcryptjs": "^3.0.0",
    "drizzle-orm": "^0.45.1",
    "pg": "^8.16.0",
    "pino": "^9.6.0",
    "zod": "^3.25.76"
  }
}
```
````

### Security Requirements

- Password hashing dengan bcryptjs (salt rounds: 12)
- JWT dengan HS256 algorithm
- Rate limiting (100 requests per minute)
- CORS dengan allowed origins
- Helmet.js untuk security headers
- Environment variables untuk sensitive data

---

## 📝 API Specifications

### Authentication Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/validate
```

### User Endpoints

```
GET    /api/v1/users
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
POST   /api/v1/users/:id/change-password
PATCH  /api/v1/users/:id/toggle-status
```

### Product Endpoints

```
GET    /api/v1/products
GET    /api/v1/products/:id
POST   /api/v1/products
PUT    /api/v1/products/:id
DELETE /api/v1/products/:id
PATCH  /api/v1/products/:id/stock
PATCH  /api/v1/products/:id/toggle-status
```

---

## 🚀 Timeline

### Phase 1: Foundation (Week 1)

- ✅ Project setup and configuration
- ✅ Database schema design
- ✅ Environment configuration

### Phase 2: Core Features (Week 2-3)

- ✅ Authentication system
- ✅ User management
- ✅ Product management

### Phase 3: Security & Infrastructure (Week 4)

- ✅ JWT implementation
- ✅ Rate limiting
- ✅ CORS and helmet
- ✅ Error handling

### Phase 4: Documentation & Testing (Week 5)

- ✅ API documentation (Swagger)
- ✅ Testing strategy
- ✅ Deployment setup

---

## 👥 Stakeholders

### Roles & Responsibilities

| Role              | Responsibility                       |
| ----------------- | ------------------------------------ |
| Project Manager   | Timeline, scope, deliverables        |
| Backend Developer | API development, database design     |
| DevOps Engineer   | Deployment, infrastructure           |
| QA Engineer       | Testing, quality assurance           |
| Product Owner     | Requirements, feature prioritization |

---

## ⚠️ Risks & Mitigation

### Technical Risks

| Risk                       | Impact | Mitigation                      |
| -------------------------- | ------ | ------------------------------- |
| Database connection issues | High   | Connection pooling, retry logic |
| Performance bottleneck     | Medium | Caching, query optimization     |
| Security vulnerabilities   | High   | Regular security audits         |
| API breaking changes       | Medium | Versioning strategy             |

### Timeline Risks

| Risk              | Impact | Mitigation                   |
| ----------------- | ------ | ---------------------------- |
| Scope creep       | High   | MVP prioritization           |
| Technical debt    | Medium | Code reviews, best practices |
| Team availability | Medium | Cross-training               |

````

---

# 2. Architecture.md

```markdown
# Architecture Design Document

**Version:** 1.0.0
**Date:** 2026-07-22

---

## 📐 Overall Architecture

### High-Level Architecture Diagram

````

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
│ │ - Swagger │ │
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

````

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
````

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

````

---

# 3. Design.md

```markdown
# Design Document

**Version:** 1.0.0
**Date:** 2026-07-22

---

## 🎨 Design Principles

### Core Design Principles

1. **Separation of Concerns**
   - Controller → Service → Model
   - Clear boundaries between layers
   - Single responsibility

2. **Dependency Injection**
   - Services injected into controllers
   - Models instantiated in services
   - Plugins registered at startup

3. **Error Handling**
   - Centralized error handling
   - Consistent error responses
   - Proper logging

4. **Security First**
   - Authentication required by default
   - Input validation on all requests
   - Rate limiting protection

---

## 🏛️ Design Patterns

### 1. MVC Pattern (Model-View-Controller)

````

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Controller │────▶│ Service │────▶│ Model │
│ │ │ │ │ │
│ - Request │ │ - Business │ │ - Database │
│ - Response │ │ - Logic │ │ - Queries │
└──────────────┘ └──────────────┘ └──────────────┘

````

### 2. Repository Pattern

```typescript
// Model sebagai Repository
class UserModel {
  async findAll(): Promise<User[]> { ... }
  async findById(id: number): Promise<User | null> { ... }
  async create(data: NewUser): Promise<User> { ... }
  async update(id: number, data: Partial<User>): Promise<User | null> { ... }
  async delete(id: number): Promise<boolean> { ... }
}
````

### 3. Factory Pattern

```typescript
// Plugin Factory
export async function registerPlugins(fastify: FastifyInstance) {
  await fastify.register(cors);
  await fastify.register(helmet);
  await fastify.register(jwt);
  // etc
}
```

---

## 📱 UI/UX Design (API Focus)

### API Design Principles

1. **Consistent Naming**
   - `/api/v1/resource`
   - `resource/:id`
   - Standard HTTP methods

2. **Clear Response Structure**

   ```json
   {
     "success": true,
     "data": { ... },
     "message": "Success message"
   }
   ```

3. **Meaningful Status Codes**
   - 200: Success
   - 201: Created
   - 400: Bad Request
   - 401: Unauthorized
   - 403: Forbidden
   - 404: Not Found
   - 429: Too Many Requests
   - 500: Internal Server Error

---

## 🗄️ Database Design

### Table Relationships

```mermaid
erDiagram
    users {
        int id PK
        string email
        string password
        string name
        enum role
        bool isActive
        datetime createdAt
        datetime updatedAt
    }

    products {
        int id PK
        string name
        text description
        decimal price
        int stock
        int userId FK
        bool isActive
        datetime createdAt
        datetime updatedAt
    }

    users ||--o{ products : "has many"
```

### Schema Design Decisions

#### Users Table

- `id`: Auto-incrementing primary key
- `email`: Unique, indexed for fast lookup
- `password`: Hashed using bcrypt
- `role`: Enum for role-based access
- `isActive`: Soft delete flag
- `lastLoginAt`: Track user activity

#### Products Table

- `id`: Auto-incrementing primary key
- `price`: Decimal for precise currency
- `stock`: Integer for inventory tracking
- `userId`: Foreign key to users
- `isActive`: Soft delete flag

---

## 🔐 Security Design

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    C->>S: POST /login (email, password)
    S->>DB: Find user by email
    DB-->>S: User data
    S->>S: Verify password (bcrypt)
    S->>S: Generate JWT
    S-->>C: Return JWT

    Note over C,S: Future requests
    C->>S: Request with JWT
    S->>S: Verify JWT
    S->>DB: Get user data
    S-->>C: Protected response
```

### JWT Token Design

```typescript
// Token Payload
{
  id: number,
  email: string,
  name: string,
  role: string,
  iat: number,  // Issued at
  exp: number   // Expiration
}
```

---

## 📊 API Response Design

### Success Response

```typescript
// Single Resource
{
  success: true,
  data: {
    id: 1,
    name: "John Doe",
    email: "john@example.com"
  }
}

// Collection
{
  success: true,
  data: [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Doe" }
  ]
}

// Created
{
  success: true,
  message: "User created successfully",
  data: { id: 1, name: "John Doe" }
}
```

### Error Response

```typescript
// Validation Error
{
  success: false,
  error: "Validation Error",
  message: "Invalid request data",
  statusCode: 400,
  details: [
    {
      field: "email",
      message: "Invalid email format"
    }
  ]
}

// Authentication Error
{
  success: false,
  error: "Unauthorized",
  message: "Invalid or expired token",
  statusCode: 401
}
```

---

## 🧩 Component Design

### 1. Controller Component

```typescript
class UserController {
  constructor(private userService: UserService) {}

  // Dependency injection
  // Single responsibility
  // Clear method names
  getAll = async (req, reply) => {
    const users = await this.userService.findAll();
    return reply.send({ success: true, data: users });
  };
}
```

### 2. Service Component

```typescript
class UserService {
  constructor(private userModel: UserModel) {}

  // Business logic
  // Transaction management
  // Error handling
  async updateUser(id: number, data: UpdateUserInput) {
    const user = await this.userModel.findById(id);
    if (!user) throw new Error("User not found");
    return this.userModel.update(id, data);
  }
}
```

### 3. Model Component

```typescript
class UserModel {
  // Database operations
  // Query building
  // Type safety
  async findById(id: number): Promise<User | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user || null;
  }
}
```

---

## 🔧 Technical Design Decisions

### 1. Why Fastify?

| Aspect            | Fastify             | Alternative      |
| ----------------- | ------------------- | ---------------- |
| Performance       | ✅ Very Fast        | Express (slower) |
| Schema Validation | ✅ Built-in         | Manual/AJV       |
| Logging           | ✅ Pino integration | Console/Winston  |
| Plugins           | ✅ Ecosystem        | Limited          |
| TypeScript        | ✅ Excellent        | Good             |

### 2. Why Drizzle ORM?

| Aspect         | Drizzle           | Alternative       |
| -------------- | ----------------- | ----------------- |
| Type Safety    | ✅ Full type-safe | Prisma (partial)  |
| Performance    | ✅ Very Fast      | Prisma (slower)   |
| SQL-like       | ✅ Native SQL     | Prisma (abstract) |
| Bundle Size    | ✅ Small          | Prisma (large)    |
| Learning Curve | ✅ Low            | Prisma (medium)   |

### 3. Why Zod for Validation?

| Aspect         | Zod          | Alternative   |
| -------------- | ------------ | ------------- |
| Type Safety    | ✅ Full      | Yup (partial) |
| Performance    | ✅ Fast      | Joi (slower)  |
| Bundle Size    | ✅ Small     | Joi (large)   |
| Error Messages | ✅ Detailed  | Yup (basic)   |
| TypeScript     | ✅ Excellent | Good          |

---

## 📝 Code Style Guide

### Naming Conventions

```typescript
// Classes: PascalCase
class UserService {}

// Interfaces: PascalCase with I prefix
interface IUser {}

// Functions: camelCase
function getUserById(id: number) {}

// Variables: camelCase
const userData = {};

// Constants: UPPER_SNAKE_CASE
const MAX_RETRY_COUNT = 3;

// Files: kebab-case
user - service.ts;
user.model.ts;
```

### TypeScript Guidelines

```typescript
// ✅ Good
interface User {
  id: number;
  email: string;
  name: string;
}

async function getUser(id: number): Promise<User | null> {
  return await userModel.findById(id);
}

// ❌ Bad
function getUser(id: any) {
  return userModel.findById(id);
}
```

### Error Handling Pattern

```typescript
// ✅ Good
try {
  const user = await userService.findById(id);
  if (!user) {
    throw new Error("User not found");
  }
  return user;
} catch (error) {
  logger.error({ error }, "Error getting user");
  throw error;
}

// ❌ Bad
try {
  const user = await userService.findById(id);
  return user;
} catch (error) {
  console.log(error);
  return null;
}
```

---

## 🚀 Performance Considerations

### Optimization Techniques

1. **Database Indexing**

   ```sql
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_products_user_id ON products(user_id);
   ```

2. **Query Optimization**

   ```typescript
   // ✅ Good - Select only needed fields
   const users = await db
     .select({ id: users.id, name: users.name })
     .from(users);

   // ❌ Bad - Select all fields
   const users = await db.select().from(users);
   ```

3. **Connection Pooling**

   ```typescript
   const pool = new Pool({
     max: 20, // Max connections
     idleTimeoutMillis: 30000,
   });
   ```

4. **Response Compression**
   ```typescript
   await fastify.register(compress, {
     global: true,
     threshold: 1024,
   });
   ```

---

## 🔄 Migration Strategy

### Database Migration Flow

```mermaid
graph LR
    A[Schema Changes] --> B[Generate Migration]
    B --> C[Review Migration]
    C --> D[Run Migration]
    D --> E[Test Changes]
    E --> F[Deploy]
```

### Migration Commands

```bash
# Generate migration
npm run db:generate

# Run migration
npm run db:migrate

# Push schema (development)
npm run db:push

# Open studio
npm run db:studio
```

---

## 📊 Monitoring & Analytics

### Key Metrics to Monitor

| Metric           | Tool           | Purpose      |
| ---------------- | -------------- | ------------ |
| Response Time    | Pino logs      | Performance  |
| Error Rate       | Error handler  | Reliability  |
| Request Count    | Fastify stats  | Usage        |
| Database Queries | Drizzle logger | Optimization |
| Memory Usage     | Node.js        | Resource     |

### Logging Example

```typescript
// Request logging
logger.info(
  {
    req: request,
    res: reply,
    responseTime: responseTime,
  },
  "Request completed",
);

// Error logging
logger.error(
  {
    err: error,
    req: request,
    error: error.message,
  },
  "Error occurred",
);
```

---

## 🧪 Testing Strategy

### Test Structure

```
src/
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   └── models/
│   ├── integration/
│   │   ├── routes/
│   │   └── database/
│   └── e2e/
│       └── api/
```

### Test Example

```typescript
import { describe, it, expect } from "vitest";

describe("UserService", () => {
  it("should create a user", async () => {
    const user = await userService.create({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });

    expect(user).toHaveProperty("id");
    expect(user.email).toBe("test@example.com");
  });
});
```

---

## 📚 API Documentation Design

### Swagger/OpenAPI Structure

```typescript
// Route Schema
{
  schema: {
    description: 'Create a new user',
    tags: ['Users'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 },
        name: { type: 'string', minLength: 2 }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' }
        }
      }
    }
  }
}
```

---

## 🎯 Future Improvements

### Phase 2 Features

1. **Caching Layer**
   - Redis for session management
   - Response caching for frequent queries

2. **Message Queue**
   - Bull for background jobs
   - Email notifications
   - Image processing

3. **Microservices**
   - Service discovery
   - API Gateway
   - Load balancing

4. **Monitoring**
   - APM integration (New Relic)
   - Metrics dashboard (Grafana)
   - Log aggregation (ELK)

5. **Testing**
   - Load testing with k6
   - Chaos engineering
   - Contract testing with Pact

````

---

# 4. Schema.md

```markdown
# Database Schema Documentation

**Version:** 1.0.0
**Date:** 2026-07-22

---

## 📊 Database Overview

### Database Type
**PostgreSQL 16** - Relational database with ACID compliance

### Schema Name
`public` (default)

### Total Tables
- Users (2)
- Products (2)

---

## 📋 Tables

### 1. Users Table

#### Table Name
`users`

#### Description
Menyimpan data user untuk autentikasi dan manajemen pengguna.

#### Schema Definition

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX email_idx ON users(email);
CREATE INDEX role_idx ON users(role);
````

#### Columns

| Column          | Type         | Constraints      | Default | Description                      |
| --------------- | ------------ | ---------------- | ------- | -------------------------------- |
| `id`            | SERIAL       | PRIMARY KEY      | Auto    | Unique identifier                |
| `email`         | VARCHAR(255) | UNIQUE, NOT NULL | -       | User email (login)               |
| `password`      | TEXT         | NOT NULL         | -       | Hashed password (bcrypt)         |
| `name`          | VARCHAR(100) | NOT NULL         | -       | User full name                   |
| `role`          | user_role    | ENUM             | 'user'  | User role (admin/user/moderator) |
| `is_active`     | BOOLEAN      | -                | true    | Active status (soft delete)      |
| `last_login_at` | TIMESTAMP    | -                | NULL    | Last login timestamp             |
| `created_at`    | TIMESTAMP    | NOT NULL         | NOW()   | Creation timestamp               |
| `updated_at`    | TIMESTAMP    | NOT NULL         | NOW()   | Last update timestamp            |

#### Indexes

| Index Name  | Columns | Type   | Purpose                     |
| ----------- | ------- | ------ | --------------------------- |
| `email_idx` | email   | UNIQUE | Fast email lookup for login |
| `role_idx`  | role    | INDEX  | Filtering users by role     |

#### Relations

| Relation    | Table    | Foreign Key | Type    |
| ----------- | -------- | ----------- | ------- |
| One-to-Many | products | user_id     | CASCADE |

---

### 2. Products Table

#### Table Name

`products`

#### Description

Menyimpan data produk yang dimiliki oleh user.

#### Schema Definition

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER DEFAULT 0 NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX user_id_idx ON products(user_id);
CREATE INDEX name_idx ON products(name);
```

#### Columns

| Column        | Type          | Constraints | Default | Description           |
| ------------- | ------------- | ----------- | ------- | --------------------- |
| `id`          | SERIAL        | PRIMARY KEY | Auto    | Unique identifier     |
| `name`        | VARCHAR(255)  | NOT NULL    | -       | Product name          |
| `description` | TEXT          | -           | NULL    | Product description   |
| `price`       | DECIMAL(10,2) | NOT NULL    | -       | Product price         |
| `stock`       | INTEGER       | NOT NULL    | 0       | Available stock       |
| `user_id`     | INTEGER       | FOREIGN KEY | NULL    | Owner user ID         |
| `is_active`   | BOOLEAN       | -           | true    | Product active status |
| `created_at`  | TIMESTAMP     | NOT NULL    | NOW()   | Creation timestamp    |
| `updated_at`  | TIMESTAMP     | NOT NULL    | NOW()   | Last update timestamp |

#### Indexes

| Index Name    | Columns | Type  | Purpose                 |
| ------------- | ------- | ----- | ----------------------- |
| `user_id_idx` | user_id | INDEX | Products by user        |
| `name_idx`    | name    | INDEX | Search products by name |

#### Foreign Keys

| Column    | References | On Delete | Description   |
| --------- | ---------- | --------- | ------------- |
| `user_id` | users.id   | CASCADE   | Product owner |

---

## 🎭 Enums

### 1. user_role

#### Description

Menentukan level akses user dalam sistem.

#### Values

| Value       | Description   | Permissions                          |
| ----------- | ------------- | ------------------------------------ |
| `admin`     | Administrator | Full access, manage users & products |
| `moderator` | Moderator     | Manage products, view users          |
| `user`      | Regular User  | Manage own products, view profile    |

#### Definition

```sql
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
```

---

## 📊 Relationships

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ PRODUCTS : "has"

    USERS {
        serial id PK
        varchar email
        text password
        varchar name
        user_role role
        boolean is_active
        timestamp last_login_at
        timestamp created_at
        timestamp updated_at
    }

    PRODUCTS {
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
```

---

## 🔄 Drizzle Schema Definition

### File: `src/config/db.schemas.ts`

```typescript
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  decimal,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

// === Enums ===
export const userRoleEnum = pgEnum("user_role", ["admin", "moderator", "user"]);

// === Users Table ===
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password: text("password").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    role: userRoleEnum("role").default("user"),
    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("email_idx").on(table.email),
    roleIdx: index("role_idx").on(table.role),
  }),
);

// === Products Table ===
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    stock: integer("stock").default(0).notNull(),
    userId: integer("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
    nameIdx: index("name_idx").on(table.name),
  }),
);

// === Types ===
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;
```

---

## 🔍 Query Examples

### Basic Queries

```typescript
// Get all users
const allUsers = await db.select().from(users);

// Get user by email
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, "user@example.com"))
  .limit(1);

// Get all products by user
const userProducts = await db
  .select()
  .from(products)
  .where(eq(products.userId, userId));

// Get product with user details (JOIN)
const productsWithUser = await db
  .select({
    id: products.id,
    name: products.name,
    price: products.price,
    userName: users.name,
    userEmail: users.email,
  })
  .from(products)
  .leftJoin(users, eq(products.userId, users.id));
```

### Insert Examples

```typescript
// Insert new user
const [newUser] = await db
  .insert(users)
  .values({
    email: "user@example.com",
    password: hashedPassword,
    name: "John Doe",
  })
  .returning();

// Insert new product
const [newProduct] = await db
  .insert(products)
  .values({
    name: "Product 1",
    price: "100000",
    stock: 10,
    userId: 1,
  })
  .returning();
```

### Update Examples

```typescript
// Update user
const [updatedUser] = await db
  .update(users)
  .set({ name: "Jane Doe", updatedAt: new Date() })
  .where(eq(users.id, 1))
  .returning();

// Update product stock
const [updatedProduct] = await db
  .update(products)
  .set({ stock: stock + 5, updatedAt: new Date() })
  .where(eq(products.id, 1))
  .returning();
```

### Delete Examples

```typescript
// Delete user (cascade will delete related products)
const [deletedUser] = await db.delete(users).where(eq(users.id, 1)).returning();

// Delete product
const [deletedProduct] = await db
  .delete(products)
  .where(eq(products.id, 1))
  .returning();
```

---

## 📈 Data Migration

### Migration Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Apply migration to database
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open database studio
npm run db:studio
```

### Migration Example

```sql
-- drizzle/migrations/0000_initial.sql
CREATE TYPE "public"."user_role" AS ENUM('admin', 'moderator', 'user');

CREATE TABLE "users" (
    "id" serial PRIMARY KEY,
    "email" varchar(255) NOT NULL UNIQUE,
    "password" text NOT NULL,
    "name" varchar(100) NOT NULL,
    "role" "user_role" DEFAULT 'user',
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp,
    "created_at" timestamp DEFAULT NOW() NOT NULL,
    "updated_at" timestamp DEFAULT NOW() NOT NULL
);

CREATE TABLE "products" (
    "id" serial PRIMARY KEY,
    "name" varchar(255) NOT NULL,
    "description" text,
    "price" decimal(10,2) NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "user_id" integer REFERENCES users(id) ON DELETE CASCADE,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp DEFAULT NOW() NOT NULL,
    "updated_at" timestamp DEFAULT NOW() NOT NULL
);

CREATE INDEX "email_idx" ON users("email");
CREATE INDEX "role_idx" ON users("role");
CREATE INDEX "user_id_idx" ON products("user_id");
CREATE INDEX "name_idx" ON products("name");
```

---

## 🗄️ Sample Data

### Insert Sample Users

```sql
INSERT INTO users (email, password, name, role) VALUES
('admin@example.com', '$2a$12$...', 'Admin User', 'admin'),
('user@example.com', '$2a$12$...', 'Regular User', 'user'),
('moderator@example.com', '$2a$12$...', 'Moderator', 'moderator');
```

### Insert Sample Products

```sql
INSERT INTO products (name, description, price, stock, user_id) VALUES
('Laptop Pro', 'High-end laptop with 16GB RAM', '15000000', 10, 1),
('Smartphone X', 'Latest smartphone with 5G', '8000000', 20, 1),
('Headphone Pro', 'Noise-cancelling headphones', '2000000', 50, 2),
('Monitor 4K', '27-inch 4K display', '5000000', 15, 2);
```

---

## 🔧 Indexing Strategy

### When to Create Indexes

| Situation     | Index Type | Example              |
| ------------- | ---------- | -------------------- |
| Foreign Keys  | B-Tree     | `userId` in products |
| Unique Fields | UNIQUE     | `email` in users     |
| Search Fields | B-Tree     | `name` in products   |
| Sort Fields   | B-Tree     | `createdAt` in users |

### Index Recommendations

```sql
-- For users table
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- For products table
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_user_active ON products(user_id, is_active);
```

---

## 🎯 Best Practices

### Database Design Rules

1. **Use Appropriate Data Types**
   - Use `VARCHAR` with length limits
   - Use `TEXT` for unlimited text
   - Use `DECIMAL` for monetary values
   - Use `TIMESTAMP` for dates

2. **Always Define NOT NULL**
   - Add `NOT NULL` to required fields
   - Use `DEFAULT` for optional fields

3. **Use Proper Indexes**
   - Index foreign keys
   - Index columns used in WHERE clauses
   - Don't over-index

4. **Use CASCADE Carefully**
   - Use `ON DELETE CASCADE` where appropriate
   - Be cautious with critical data

5. **Use Soft Delete**
   - Use `is_active` instead of hard delete
   - Keep history of deleted records

---

## 📊 Performance Metrics

### Query Performance Targets

| Operation              | Target Time | Current |
| ---------------------- | ----------- | ------- |
| SELECT (with index)    | < 10ms      | ~5ms    |
| SELECT (without index) | < 50ms      | ~30ms   |
| INSERT                 | < 20ms      | ~10ms   |
| UPDATE                 | < 20ms      | ~15ms   |
| DELETE                 | < 20ms      | ~10ms   |

### Monitoring Queries

```sql
-- Check query performance
SELECT
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename)) as size
FROM pg_tables
WHERE schemaname = 'public';
```

---

## 🔐 Security Considerations

### Data Protection

1. **Password Hashing**
   - Use bcrypt with salt rounds 12
   - Never store plain passwords

2. **SQL Injection Prevention**
   - Use Drizzle ORM (parameterized queries)
   - Validate all inputs with Zod

3. **Data Exposure**
   - Never expose password fields
   - Use select queries with specific fields

4. **Audit Trail**
   - Track `created_at` and `updated_at`
   - Log all critical operations

---

## 📚 Reference

### Drizzle ORM Documentation

- https://orm.drizzle.team/

### PostgreSQL Documentation

- https://www.postgresql.org/docs/16/

### JWT Documentation

- https://jwt.io/introduction
- https://github.com/fastify/fastify-jwt

````

---

# 5. Rules.md

```markdown
# Development Rules & Guidelines

**Version:** 1.0.0
**Date:** 2026-07-22

---

## 📋 Table of Contents

1. [Coding Standards](#coding-standards)
2. [Git Workflow](#git-workflow)
3. [Commit Convention](#commit-convention)
4. [Branch Strategy](#branch-strategy)
5. [Code Review Rules](#code-review-rules)
6. [Testing Rules](#testing-rules)
7. [Security Rules](#security-rules)
8. [Documentation Rules](#documentation-rules)
9. [Performance Rules](#performance-rules)
10. [Deployment Rules](#deployment-rules)

---

## 💻 Coding Standards

### TypeScript Rules

#### ✅ DO:

```typescript
// Use explicit types
interface User {
  id: number;
  email: string;
  name: string;
}

// Use async/await
async function getUser(id: number): Promise<User | null> {
  return await userModel.findById(id);
}

// Use proper error handling
try {
  const user = await getUser(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
} catch (error) {
  logger.error({ error }, 'Failed to get user');
  throw error;
}

// Use meaningful variable names
const userEmail = 'user@example.com';  // ✅ Good
const ue = 'user@example.com';         // ❌ Bad

// Use proper imports
import type { User } from './types.js';  // ✅ Type import
import { userService } from './services.js'; // ✅ Value import
````

#### ❌ DON'T:

```typescript
// ❌ Don't use any
function getData(data: any): any { ... }

// ❌ Don't use var
var user = getUser(); // ❌
const user = getUser(); // ✅

// ❌ Don't ignore errors
try {
  // code
} catch (e) {
  // Silent fail ❌
}

// ❌ Don't use magic numbers
const result = data * 3.14; // ❌
const PI = 3.14; // ✅
const result = data * PI;

// ❌ Don't use console.log in production
console.log('Debug info'); // ❌
logger.debug('Debug info'); // ✅
```

---

### Fastify Specific Rules

#### Plugin Rules

```typescript
// ✅ DO: Register plugins properly
export default async function plugin(fastify: FastifyInstance) {
  await fastify.register(cors, { origin: "*" });
  await fastify.register(helmet);
}

// ❌ DON'T: Use plugins without proper registration
fastify.use(cors()); // ❌
```

#### Route Rules

```typescript
// ✅ DO: Define routes with schemas
fastify.post("/users", {
  schema: {
    body: userSchema,
    response: {
      201: userResponseSchema,
    },
  },
  handler: createUser,
});

// ❌ DON'T: Skip schema validation
fastify.post("/users", handler); // ❌
```

#### Error Handling Rules

```typescript
// ✅ DO: Use consistent error handling
try {
  // code
} catch (error) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: "Validation Error",
      details: error.errors,
    });
  }
  throw error;
}

// ❌ DON'T: Throw raw errors
try {
  // code
} catch (error) {
  throw error; // ❌
}
```

---

## 🔀 Git Workflow

### Branch Strategy

```
main
└── develop
    ├── feature/feature-name
    ├── bugfix/bug-description
    ├── hotfix/critical-fix
    └── release/v1.0.0
```

### Branch Naming Convention

| Type    | Format                     | Example                 |
| ------- | -------------------------- | ----------------------- |
| Feature | `feature/description`      | `feature/user-auth`     |
| Bugfix  | `bugfix/issue-description` | `bugfix/login-error`    |
| Hotfix  | `hotfix/description`       | `hotfix/security-patch` |
| Release | `release/v{version}`       | `release/v1.0.0`        |

---

## 📝 Commit Convention

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | Description   | Example                                  |
| ---------- | ------------- | ---------------------------------------- |
| `feat`     | New feature   | `feat(auth): add user registration`      |
| `fix`      | Bug fix       | `fix(api): fix login validation`         |
| `docs`     | Documentation | `docs(readme): update API docs`          |
| `style`    | Code style    | `style: format code with prettier`       |
| `refactor` | Code refactor | `refactor(service): simplify auth logic` |
| `test`     | Testing       | `test: add unit tests for user service`  |
| `chore`    | Maintenance   | `chore: update dependencies`             |
| `perf`     | Performance   | `perf(db): add indexes to users table`   |
| `security` | Security      | `security: update JWT implementation`    |

### Examples

```bash
# Feature
git commit -m "feat(auth): add JWT token validation"
git commit -m "feat(user): add update profile endpoint"

# Fix
git commit -m "fix(api): fix rate limiting issue"
git commit -m "fix(db): fix connection pool timeout"

# Docs
git commit -m "docs: add API documentation"
git commit -m "docs(swagger): update schema definitions"

# Refactor
git commit -m "refactor(service): extract user validation logic"

# Test
git commit -m "test: add integration tests for auth routes"

# Chore
git commit -m "chore: update Fastify to v5.7.0"
```

---

## 🧪 Testing Rules

### Unit Tests

```typescript
// ✅ DO: Test each service method
describe("UserService", () => {
  it("should create a user", async () => {
    const user = await userService.create(userData);
    expect(user).toHaveProperty("id");
    expect(user.email).toBe(userData.email);
  });

  it("should throw error if email exists", async () => {
    await userService.create(userData);
    await expect(userService.create(userData)).rejects.toThrow(
      "User already exists",
    );
  });
});

// ❌ DON'T: Test multiple concerns
describe("UserService", () => {
  it("should handle everything", async () => {
    // ❌ Testing multiple things in one test
  });
});
```

### Integration Tests

```typescript
// ✅ DO: Test API endpoints
describe("POST /api/v1/auth/register", () => {
  it("should return 201 on successful registration", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: registerData,
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toHaveProperty("success", true);
  });
});

// ❌ DON'T: Skip error cases
// ❌ DON'T: Hard-code test data
```

### Test Coverage Rules

| Component   | Minimum Coverage |
| ----------- | ---------------- |
| Models      | 90%              |
| Services    | 90%              |
| Controllers | 80%              |
| Utils       | 80%              |
| Middleware  | 70%              |
| Total       | 80%              |

---

## 🚀 Performance Rules

### Database Optimization

```typescript
// ✅ DO: Use indexes
const users = await db.select().from(users).where(eq(users.email, email)); // email has index

// ✅ DO: Select only needed fields
const users = await db
  .select({
    id: users.id,
    name: users.name,
  })
  .from(users);

// ❌ DON'T: Select all without indexes
const users = await db.select().from(users); // ❌ Without WHERE

// ❌ DON'T: Select all fields if not needed
const users = await db.select().from(users); // ❌ If only need id,name
```

### API Optimization

```typescript
// ✅ DO: Use pagination
const users = await db
  .select()
  .from(users)
  .limit(10)
  .offset(page * 10);

// ✅ DO: Use compression
await fastify.register(compress, {
  global: true,
  threshold: 1024,
});

// ✅ DO: Use cache headers
reply.header("Cache-Control", "public, max-age=300");

// ❌ DON'T: Return large datasets without pagination
const allUsers = await db.select().from(users); // ❌

// ❌ DON'T: Disable compression
```

---

## 🔒 Security Rules

### Authentication Rules

```typescript
// ✅ DO: Always protect routes
fastify.get("/users", {
  preHandler: [authMiddleware], // ✅
  handler: getUsers,
});

fastify.get("/users", {
  // ❌ No auth middleware
  handler: getUsers, // ❌
});

// ✅ DO: Role-based access
fastify.delete("/users/:id", {
  preHandler: [authMiddleware, requireRole(["admin"])],
  handler: deleteUser,
});

// ❌ DON'T: Expose user data
const user = await userService.getUser(id);
return user; // ❌ Might include password

// ✅ DO: Remove sensitive data
const { password, ...userData } = user;
return userData; // ✅
```

### Input Validation Rules

```typescript
// ✅ DO: Validate all inputs
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const data = schema.parse(request.body);

// ✅ DO: Validate IDs
const id = z.coerce.number().int().positive().parse(params.id);

// ❌ DON'T: Trust user input
const { email, password } = request.body; // ❌

// ❌ DON'T: Use unsanitized input in queries
const id = params.id; // ❌
```

### Environment Rules

```typescript
// ✅ DO: Use environment variables
const JWT_SECRET = process.env.JWT_SECRET; // ✅

// ❌ DON'T: Hard-code secrets
const JWT_SECRET = "hardcoded-secret"; // ❌

// ✅ DO: Validate environment
const env = z
  .object({
    JWT_SECRET: z.string().min(32),
  })
  .parse(process.env);

// ❌ DON'T: Skip validation
```

---

## 📚 Documentation Rules

### Code Documentation

```typescript
/**
 * User Service
 *
 * Handles all user-related business logic
 *
 * @example
 * const userService = new UserService();
 * const user = await userService.createUser(data);
 */
export class UserService {
  /**
   * Create a new user
   *
   * @param data - User registration data
   * @returns Created user (without password)
   * @throws {Error} If user already exists
   */
  async createUser(data: RegisterInput): Promise<Omit<User, "password">> {
    // Implementation
  }
}
```

### API Documentation

```typescript
// ✅ DO: Document endpoints
fastify.post("/users", {
  schema: {
    description: "Create a new user",
    tags: ["Users"],
    body: {
      type: "object",
      required: ["email", "password", "name"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 6 },
        name: { type: "string", minLength: 2 },
      },
    },
    response: {
      201: {
        description: "User created successfully",
        type: "object",
        properties: {
          success: { type: "boolean" },
          data: { type: "object" },
        },
      },
    },
  },
  handler: createUser,
});

// ❌ DON'T: Skip documentation
fastify.post("/users", handler); // ❌
```

---

## 🤝 Code Review Rules

### What to Check in Code Review

1. **Functionality**
   - Does it work as expected?
   - Are edge cases handled?

2. **Code Quality**
   - Is it readable and maintainable?
   - Are there duplicate code?

3. **Performance**
   - Are there potential bottlenecks?
   - Is database optimized?

4. **Security**
   - Are there security vulnerabilities?
   - Is input properly validated?

5. **Testing**
   - Are there adequate tests?
   - Do tests cover edge cases?

6. **Documentation**
   - Is API documented?
   - Are complex logic explained?

### Review Checklist

```markdown
- [ ] Code follows style guide
- [ ] No console.log/console.error in production
- [ ] Proper error handling
- [ ] Input validation implemented
- [ ] Authentication/Authorization checked
- [ ] Database queries optimized
- [ ] Tests written and passing
- [ ] API documented
- [ ] No security vulnerabilities
- [ ] Performance impact assessed
```

---

## 🚫 What NOT to Do

### Code Mistakes

```typescript
// ❌ Don't Use 'any'
function getUser(id: any): any { ... }

// ✅ Do Use Proper Types
function getUser(id: number): Promise<User | null> { ... }

// ❌ Don't Ignore Errors
try {
  // code
} catch (e) {
  // Silent fail
}

// ✅ Do Handle Errors
try {
  // code
} catch (error) {
  logger.error(error);
  throw new Error('Operation failed');
}

// ❌ Don't Hardcode Values
const MAX_RETRIES = 3; // ❌

// ✅ Do Use Constants
const MAX_RETRIES = 3; // ✅ Define once

// ❌ Don't Mutate Inputs
function updateUser(user: User) {
  user.name = 'New Name'; // ❌ Mutating input
  return user;
}

// ✅ Do Create New Object
function updateUser(user: User) {
  return { ...user, name: 'New Name' };
}
```

---

## 🔧 Development Tools

### Required Extensions (VS Code)

1. **TypeScript** - Type checking
2. **ESLint** - Code linting
3. **Prettier** - Code formatting
4. **Drizzle** - Database queries
5. **Fastify** - Snippets

### ESLint Configuration

```javascript
module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/strict",
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn",
  },
};
```

### Prettier Configuration

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

---

## 📊 Performance Rules

### Benchmarking Standards

```typescript
// ✅ DO: Benchmark critical paths
const start = performance.now();
const result = await operation();
const duration = performance.now() - start;

if (duration > 100) {
  logger.warn({ duration }, "Slow operation detected");
}

// ❌ DON'T: Skip performance monitoring
```

### Memory Management

```typescript
// ✅ DO: Use streams for large data
const stream = fs.createReadStream(largeFile);
stream.pipe(response);

// ❌ DON'T: Load all data in memory
const data = fs.readFileSync(largeFile); // ❌

// ✅ DO: Clean up resources
try {
  const client = await pool.connect();
  // Use client
} finally {
  client.release();
}
```

---

## 📦 Dependency Rules

### Adding Dependencies

```bash
# ✅ DO: Use exact versions for production
npm install --save-exact package-name

# ✅ DO: Review package before adding
# Check:
# - Weekly downloads
# - GitHub stars
# - Last update
# - Security vulnerabilities

# ❌ DON'T: Add unnecessary dependencies
```

### Version Management

```json
{
  "dependencies": {
    "fastify": "^5.7.2", // ✅ Use caret for patches
    "drizzle-orm": "0.45.1" // ✅ Exact for critical
  }
}
```

---

## 🔄 CI/CD Rules

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run test",
      "pre-push": "npm run build"
    }
  }
}
```

### CI Pipeline Requirements

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

---

## 📋 Checklist Before Commit

### Pre-commit Checklist

- [ ] All tests pass
- [ ] Code is formatted
- [ ] No lint errors
- [ ] Types are correct
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables used
- [ ] Error handling implemented
- [ ] Security checks passed

---

## 🎯 Final Notes

### Remember

1. **Quality over Quantity**
2. **Write Code for Humans**
3. **Test Everything**
4. **Document as You Go**
5. **Review Before Commit**
6. **Keep It Simple**
7. **Stay Updated**
8. **Share Knowledge**

### Useful Commands

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm run test

# Build project
npm run build

# Generate migrations
npm run db:generate

# Push schema
npm run db:push
```

---

**Last Updated:** 2026-07-22
**Version:** 1.0.0

```

```
