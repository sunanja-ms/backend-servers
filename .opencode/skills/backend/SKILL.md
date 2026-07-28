---
name: fastify-backend
description: Use when working on this Fastify backend server — adding routes, controllers, services, models, middleware, plugins, database schemas, migrations, tests, or load tests. Covers Drizzle ORM, PostgreSQL, Zod validation, JWT/API key auth, and Fastify plugins. Use when the user mentions fastify, drizzle, postgres, routes, controllers, services, models, middleware, plugins, schemas, migrations, or backend API development in this project.
---

# Fastify Backend Skill

## When to Use

Use this skill for ANY task involving this backend codebase:
- Adding/modifying routes, controllers, services, or models
- Database schema changes, migrations, or Drizzle ORM queries
- Middleware (auth, error handling, rate limiting)
- Plugin configuration (CORS, JWT, Swagger, compression, static files)
- Zod validation schemas
- Tests (integration, load) or deployment
- Bug fixes, refactoring, or performance tuning

## Quick Reference

### Commands (from AGENTS.md)

```bash
npm run dev              # tsx watch hot-reload dev server
npm run build            # tsc → dist/
npm start                # node dist/server.js
npm test                 # NODE_ENV=test node --import tsx --test test/routes.test.ts
npm run test:load        # autocannon load test (100 connections, 10s, 14 endpoints)
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # drizzle-kit migrate
npm run db:push          # drizzle-kit push (schema → DB directly)
npm run db:studio        # drizzle-kit studio (browser UI)
```

**No eslint, prettier, or typecheck scripts exist.** Do not run lint commands.

### Project Structure

```
src/
  app.ts                  ← buildServer() — extractable for testing
  server.ts               ← startup, DB connection test, signal handlers
  config/
    db.connection.ts      ← pg Pool (max 50, idle 10s) + Drizzle instance
    db.schemas.ts         ← Drizzle table definitions (users, products, api_keys)
    env.ts                ← Zod-validated env vars
    plugin.register.ts    ← autoloads plugins/ (encapsulate: false)
  controllers/            ← request handlers (thin, delegates to services)
  services/               ← business logic
  models/                 ← Drizzle query wrappers
  schemas/                ← Zod validation schemas (apikey, common, product, user)
  middlewares/             ← authMiddleware (JWT + API Key + cache), errorMiddleware
  plugins/                ← cors, jwt, helmet, compress, static, rate-limit, swagger, sensible
  routes/v1/              ← autoloaded under /api/v1 with autoPrefix
  types/                  ← TypeScript interfaces + AppError class
  utils/                  ← health route, logger, validator (parsePagination)
```

### ESM Rules

- `"type": "module"` — everything is ESM
- All internal imports use `.js` extension: `import { db } from '../config/db.connection.js'`
- TypeScript interfaces use `import type` to avoid runtime ESM errors
- `verbatimModuleSyntax: false` in tsconfig, but `tsx` still requires `import type` for type-only imports

### Autoload Gotchas

1. **`index.ts` blocks siblings.** If an `index.ts` exists in a directory, ALL other files are silently ignored. Never create `index.ts` in `routes/v1/` or `plugins/`.
2. **Routes must set `autoPrefix`.** Each route file exports with `autoPrefix` set. Without it, routes overlap.

### Key Patterns

**Adding a new route:**
1. Create route file in `src/routes/v1/<name>.routes.ts`
2. Set `autoPrefix` on the exported function
3. Create controller in `src/controllers/<name>.controller.ts`
4. Create service in `src/services/<name>.service.ts`
5. Create model in `src/models/<name>.model.ts` (Drizzle queries)
6. Create Zod schema in `src/schemas/<name>.schema.ts` (if validation needed)

**Adding a new DB table:**
1. Add table definition to `src/config/db.schemas.ts`
2. Run `npm run db:generate` to create migration SQL
3. Run `npm run db:migrate` to apply

**Error handling:**
- Use `AppError` class from `src/types/errors.ts` with static factories: `AppError.badRequest()`, `AppError.unauthorized()`, `AppError.forbidden()`, `AppError.notFound()`, `AppError.conflict()`
- Zod errors are caught by `error.middleware.ts` automatically
- Route-level errors bubble up to the centralized error handler

**Auth:**
- JWT: `Authorization: Bearer <token>` header
- API Key: `X-API-Key: ak_...` header
- Both resolved in `src/middlewares/auth.middleware.ts` with in-memory user cache (60s TTL, 10k LRU)
- Use `requireRole(['admin'])` preHandler for role checks

**Pagination:**
- Query params: `page`, `limit`, `sortBy`, `sortOrder`
- Parse with `parsePagination(query)` from `src/utils/validator.ts`
- Default: page=1, limit=10, sortOrder=desc

**Rate limiting:**
- Global: `RATE_LIMIT_MAX` (1000), `RATE_LIMIT_WINDOW` (60s)
- Auth routes: `RATE_LIMIT_AUTH_MAX` (20), `RATE_LIMIT_AUTH_WINDOW` (60s) via `config.rateLimit`
- Health check and /docs are allowlisted

### Environment Variables

All validated via Zod at startup (`src/config/env.ts`).

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | (required) | PostgreSQL connection string |
| `JWT_SECRET` | (required, min 32) | JWT signing secret |
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `RATE_LIMIT_MAX` | `1000` | Global rate limit |
| `RATE_LIMIT_WINDOW` | `60000` | Global window (ms) |
| `RATE_LIMIT_AUTH_MAX` | `20` | Auth rate limit |
| `RATE_LIMIT_AUTH_WINDOW` | `60000` | Auth window (ms) |
| `BCRYPT_ROUNDS` | `12` | Hash rounds (dev uses 4) |
| `API_KEY_EXPIRY_DAYS` | `30` | API key validity |
| `CORS_ORIGIN` | `*` | Allowed origins |
| `LOG_LEVEL` | `info` | Pino log level |

### DB Tables

- **users**: id, email, password, name, role (enum: admin/moderator/user), isActive, lastLoginAt, createdAt, updatedAt
- **products**: id, name, description, price (decimal), stock (int), userId (FK→users), isActive, createdAt, updatedAt
- **api_keys**: id, userId (FK→users), name, keyHash (SHA-256), prefix (unique, 8 chars), expiresAt, lastUsedAt, createdAt, updatedAt

### Testing

- Uses **Node's built-in `node:test`** — NOT Jest/Vitest
- Tests use `app.inject()` (Fastify HTTP injection) — no real server starts
- **Requires live PostgreSQL** — tests hit real DB
- `UNIQUE = Date.now()` prevents email collisions
- Test order is stateful: Health → Auth → Admin → Products → API Keys → Second User → Ownership → Moderator → Users
- 67 tests across 9 suites
- Use `assertErrorResponse(res, statusCode)` helper for error assertions

## Looking Up Documentation

When working with external packages or need current API docs, use `websearch` and `webfetch`:

**Fastify docs:** Search for "fastify [feature]" or fetch `https://fastify.dev/docs/latest/`
- Routes: `https://fastify.dev/docs/latest/Reference/Routes/`
- Plugins: `https://fastify.dev/docs/latest/Reference/Plugins/`
- Hooks: `https://fastify.dev/docs/latest/Reference/Hooks/`
- Decorators: `https://fastify.dev/docs/latest/Reference/Decorators/`

**Drizzle ORM docs:** Search for "drizzle-orm [feature]" or fetch `https://orm.drizzle.team/docs/`
- Queries: `https://orm.drizzle.team/docs/select`
- Insert/Update: `https://orm.drizzle.team/docs/insert`
- Schema: `https://orm.drizzle.team/docs/sql-schema-declaration`
- Migrations: `https://orm.drizzle.team/docs/migrations`
- PostgreSQL specific: `https://orm.drizzle.team/docs/learn/tutorials/drizzle-with-postgresqljs`

**Zod docs:** Search "zod [validation]" or fetch `https://zod.dev/`

**Node.js built-in test:** Search "node:test [feature]" or fetch `https://nodejs.org/api/test.html`

**Package-specific:**
- `@fastify/jwt`: search "fastify jwt plugin docs"
- `@fastify/rate-limit`: search "fastify rate-limit docs"
- `@fastify/autoload`: search "fastify autoload docs"
- `bcryptjs`: search "bcryptjs npm docs"
- `autocannon`: search "autocannon load testing npm"

**When stuck:** Always search the web before guessing at API shapes. Package APIs change between versions — verify against current docs.

## Common Gotchas

1. **Price is `decimal` in Drizzle but `number` in Zod** — controllers convert with `.toString()` when writing to DB
2. **`count()` from drizzle-orm doesn't work** — use `sql<number>\`count(*)::int\`` instead
3. **Column sort lookup via `table[columnName]` fails TS** — use explicit `Record<string, Column>` map objects
4. **`import type` required** for interfaces/type aliases in ESM — otherwise tsx throws runtime errors
5. **Auth middleware caches users** — after password change, user deletion, or status toggle, call `invalidateUserCache(userId)`
6. **API keys use SHA-256** — full key shown once at creation, prefix (first 8 chars) used for lookup
7. **Static plugin** skips if `public/dist/` doesn't exist — no crash, just no static files
8. **Swagger disabled in production** unless `ENABLE_SWAGGER=true` env var is set
