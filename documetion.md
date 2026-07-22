# 📚 Complete Documentation Context

## Fastify Backend API Platform

---

## 📁 Project Structure Overview

```
backend-server/
├── 📄 .env                          # Environment variables
├── 📄 .gitignore                    # Git ignore file
├── 📄 docker-compose.yml             # Docker configuration
├── 📄 Dockerfile                     # Docker build file
├── 📄 drizzle.config.ts              # Drizzle ORM config
├── 📄 package.json                   # Project dependencies
├── 📄 tsconfig.json                  # TypeScript config
│
├── 📁 src/
│   ├── 📄 server.ts                  # Entry point
│   │
│   ├── 📁 config/                    # Configuration files
│   │   ├── 📄 env.ts                # Environment validation
│   │   ├── 📄 db.connection.ts      # Database connection
│   │   ├── 📄 db.schemas.ts         # Database schemas
│   │   └── 📄 plugin.register.ts    # Plugin registration
│   │
│   ├── 📁 plugins/                   # Fastify plugins
│   │   ├── 📄 cors.plugin.ts
│   │   ├── 📄 helmet.plugin.ts
│   │   ├── 📄 jwt.plugin.ts
│   │   ├── 📄 rate-limit.plugin.ts
│   │   ├── 📄 sensible.plugin.ts
│   │   └── 📄 swagger.plugin.ts
│   │
│   ├── 📁 middlewares/              # Middleware functions
│   │   ├── 📄 auth.middleware.ts
│   │   └── 📄 error.middleware.ts
│   │
│   ├── 📁 routes/                   # API routes
│   │   └── 📁 v1/
│   │       ├── 📄 auth.routes.ts
│   │       ├── 📄 user.routes.ts
│   │       └── 📄 product.routes.ts
│   │
│   ├── 📁 controllers/              # Request handlers
│   │   ├── 📄 auth.controller.ts
│   │   ├── 📄 user.controller.ts
│   │   └── 📄 product.controller.ts
│   │
│   ├── 📁 services/                 # Business logic
│   │   ├── 📄 auth.service.ts
│   │   ├── 📄 user.service.ts
│   │   └── 📄 product.service.ts
│   │
│   ├── 📁 models/                   # Database models
│   │   ├── 📄 user.model.ts
│   │   └── 📄 product.model.ts
│   │
│   ├── 📁 schemas/                  # Validation schemas
│   │   ├── 📄 user.schema.ts
│   │   └── 📄 product.schema.ts
│   │
│   ├── 📁 types/                    # TypeScript types
│   │   └── 📄 index.ts
│   │
│   └── 📁 utils/                    # Utility functions
│       ├── 📄 logger.ts
│       ├── 📄 validator.ts
│       └── 📄 health.routes.ts
│
└── 📁 dist/                         # Build output
```

---

## 🔧 Tech Stack

### Core Dependencies

| Package         | Version | Description                    |
| --------------- | ------- | ------------------------------ |
| **Fastify**     | 5.7.2   | High-performance web framework |
| **TypeScript**  | 5.9.2   | Type-safe JavaScript           |
| **Drizzle ORM** | 0.45.1  | Type-safe SQL ORM              |
| **PostgreSQL**  | 16      | Relational database            |
| **Pino**        | 9.6.0   | Fast logging                   |
| **Zod**         | 3.25.76 | Schema validation              |

### Fastify Plugins

| Plugin              | Version | Purpose                  |
| ------------------- | ------- | ------------------------ |
| @fastify/autoload   | 6.0.0   | Auto-load plugins/routes |
| @fastify/cors       | 11.2.0  | CORS configuration       |
| @fastify/helmet     | 13.0.0  | Security headers         |
| @fastify/jwt        | 10.1.0  | JWT authentication       |
| @fastify/rate-limit | 10.0.0  | Rate limiting            |
| @fastify/sensible   | 6.0.0   | Useful utilities         |
| @fastify/swagger    | 9.7.0   | OpenAPI documentation    |
| @fastify/swagger-ui | 5.0.0   | Swagger UI interface     |

---

## 🔐 Authentication & Authorization

### JWT Token Structure

```typescript
{
  id: number; // User ID
  email: string; // User email
  name: string; // User name
  role: "admin" | "user" | "moderator";
  iat: number; // Issued at
  exp: number; // Expiration
}
```

### Role-Based Access Control

| Role          | Permissions                                  |
| ------------- | -------------------------------------------- |
| **Admin**     | Full access - Manage users, products, system |
| **Moderator** | Manage products, view users                  |
| **User**      | Manage own products, view profile            |

---

## 📡 API Endpoints

### Authentication (Auth)

| Method | Endpoint                | Description       | Auth |
| ------ | ----------------------- | ----------------- | ---- |
| POST   | `/api/v1/auth/register` | Register new user | ❌   |
| POST   | `/api/v1/auth/login`    | Login user        | ❌   |
| GET    | `/api/v1/auth/me`       | Get current user  | ✅   |
| POST   | `/api/v1/auth/validate` | Validate token    | ✅   |

### Users Management

| Method | Endpoint                            | Description        | Auth | Role  |
| ------ | ----------------------------------- | ------------------ | ---- | ----- |
| GET    | `/api/v1/users`                     | Get all users      | ✅   | Admin |
| GET    | `/api/v1/users/:id`                 | Get user by ID     | ✅   | User  |
| PUT    | `/api/v1/users/:id`                 | Update user        | ✅   | User  |
| DELETE | `/api/v1/users/:id`                 | Delete user        | ✅   | Admin |
| POST   | `/api/v1/users/:id/change-password` | Change password    | ✅   | User  |
| PATCH  | `/api/v1/users/:id/toggle-status`   | Toggle user status | ✅   | Admin |

### Products Management

| Method | Endpoint                             | Description           | Auth | Role  |
| ------ | ------------------------------------ | --------------------- | ---- | ----- |
| GET    | `/api/v1/products`                   | Get all products      | ✅   | User  |
| GET    | `/api/v1/products/:id`               | Get product by ID     | ✅   | User  |
| POST   | `/api/v1/products`                   | Create product        | ✅   | User  |
| PUT    | `/api/v1/products/:id`               | Update product        | ✅   | User  |
| DELETE | `/api/v1/products/:id`               | Delete product        | ✅   | Admin |
| PATCH  | `/api/v1/products/:id/stock`         | Update stock          | ✅   | User  |
| PATCH  | `/api/v1/products/:id/toggle-status` | Toggle product status | ✅   | Admin |

---

## 📊 Database Schema

### Users Table

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
```

### Products Table

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

### Enums

```sql
CREATE TYPE user_role AS ENUM ('admin', 'moderator', 'user');
```

---

## 🚀 Environment Variables

### Required Variables

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fastify_db

# Security
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d

# Rate Limit
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
```

---

## 🔄 Development Workflow

### Commands

```bash
# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database operations
npm run db:generate      # Generate migration
npm run db:migrate        # Run migration
npm run db:push           # Push schema (dev)
npm run db:studio         # Open database studio

# Code quality
npm run lint              # Run linter
npm run format            # Format code
```

### Git Workflow

```bash
# Feature branch
git checkout -b feature/feature-name
git add .
git commit -m "feat: add new feature"
git push origin feature/feature-name

# Create PR to develop
# After review, merge to develop

# Release
git checkout -b release/v1.0.0
git merge develop
git tag v1.0.0
git push origin main --tags
```

---

## 📝 Development Rules

### Coding Standards

1. **TypeScript First** - Use proper types
2. **Async/Await** - Use async/await, not callbacks
3. **Error Handling** - Always handle errors
4. **Validation** - Validate all inputs with Zod
5. **Logging** - Use Pino, not console.log
6. **Security** - Always validate and sanitize

### Commit Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** feat, fix, docs, style, refactor, test, chore, perf, security

---

## 🧪 Testing

### Test Structure

```
src/__tests__/
├── unit/
│   ├── services/
│   └── models/
├── integration/
│   ├── routes/
│   └── database/
└── e2e/
    └── api/
```

### Test Commands

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

---

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t fastify-api .

# Run container
docker run -p 3000:3000 fastify-api

# Docker Compose
docker-compose up -d

# Stop
docker-compose down
```

### Production

```bash
# Build
npm run build

# Run with PM2
pm2 start dist/server.js --name fastify-api
pm2 save
pm2 startup

# Nginx reverse proxy
# See nginx.conf for configuration
```

---

## 📚 Documentation Access

- **Swagger UI:** http://localhost:3000/docs
- **Health Check:** http://localhost:3000/health
- **API Base:** http://localhost:3000/api/v1

---

## 🔗 Quick Links

- [Fastify Documentation](https://fastify.dev/docs/latest/)
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [Pino Logging](https://getpino.io/)

---

## 📞 Support

| Channel | Contact                                                              |
| ------- | -------------------------------------------------------------------- |
| Email   | support@example.com                                                  |
| GitHub  | [Repository Issues](https://github.com/yourusername/fastify-backend) |
| Docs    | [Documentation Site](https://docs.example.com)                       |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Web/Mobile)                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Fastify Server                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Plugins    │  │   Middleware │  │    Routes        │ │
│  │  - CORS      │  │  - Auth      │  │  - /api/v1/*     │ │
│  │  - Helmet    │  │  - Error     │  └──────────────────┘ │
│  │  - JWT       │  └──────────────┘                       │
│  │  - RateLimit │                                          │
│  │  - Swagger   │                                          │
│  └──────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Auth       │  │   User       │  │   Product        │ │
│  │   Service    │  │   Service    │  │   Service        │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Model Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   User       │  │   Product    │  │   Database       │ │
│  │   Model      │  │   Model      │  │   Connection     │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Users      │  │   Products   │  │   Migrations     │ │
│  │   Table      │  │   Table      │  │                  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Features

- ✅ **Fastify** - High-performance web framework
- ✅ **TypeScript** - Full type safety
- ✅ **Drizzle ORM** - Type-safe SQL queries
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Role-Based Access** - Admin/Moderator/User roles
- ✅ **Rate Limiting** - DDoS protection
- ✅ **Swagger/OpenAPI** - Auto-generated documentation
- ✅ **Pino Logging** - Structured logging
- ✅ **Zod Validation** - Schema validation
- ✅ **Security Headers** - Helmet.js integration
- ✅ **CORS** - Cross-origin support
- ✅ **Docker** - Containerized deployment

---

## 📊 Monitoring & Health

### Health Check Endpoint

```http
GET /health
```

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

## 🔐 Security Best Practices

1. **Password Hashing** - bcrypt with 12 rounds
2. **JWT** - HS256 algorithm
3. **Rate Limiting** - 100 requests per minute
4. **CORS** - Allowed origins only
5. **Helmet** - Security headers
6. **Validation** - Zod schema validation
7. **Environment** - Secrets in .env
8. **HTTPS** - Use in production
9. **Input Sanitization** - Prevent injection
10. **Error Handling** - No stack traces in production

---

**Last Updated:** 2026-07-22
**Version:** 1.0.0
**Status:** Production Ready ✅

---

_This documentation contains all the necessary information for development, deployment, and maintenance of the Fastify Backend API Platform._
