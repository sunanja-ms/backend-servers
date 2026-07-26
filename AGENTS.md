# AGENTS.md — Fastify Backend Server

## Commands

```bash
npm run dev              # tsx watch hot-reload dev server
npm run build            # tsc → dist/
npm start                # node dist/server.js
npm test                 # NODE_ENV=test node --import tsx --test test/routes.test.ts
npm run test:load        # autocannon load test (separate script)
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # drizzle-kit migrate
npm run db:push          # drizzle-kit push (schema → DB directly)
npm run db:studio        # drizzle-kit studio (browser UI)
```

No eslint, prettier, or typecheck script exists. Do not run lint commands.

## Autoload Gotcha

This repo uses `@fastify/autoload` v6. Two critical behaviors:

1. **`index.ts` blocks siblings.** If an `index.ts` exists in a directory, ALL other files in that directory are silently ignored. Before this was fixed, `src/routes/v1/index.ts` was blocking all route files. If routes stop loading, check for stray `index.ts` files.

2. **Routes must set `autoPrefix`.** Each route file exports a function with `autoPrefix` set (e.g., `authRoutes.autoPrefix = '/auth'`). Without it, routes register at the autoload's prefix root and overlap.

```
src/routes/v1/auth.routes.ts     → autoPrefix: '/auth'     → /api/v1/auth/...
src/routes/v1/product.routes.ts  → autoPrefix: '/products'  → /api/v1/products/...
src/routes/v1/user.routes.ts     → autoPrefix: '/users'     → /api/v1/users/...
```

Health check lives in `src/utils/health.routes.ts` and is autoloaded at `/` (root prefix).

## Plugin Encapsulation

`src/config/plugin.register.ts` sets `encapsulate: false` on the plugins autoload. This is required so decorators like `fastify.jwt` are accessible inside route handlers. If you remove it, routes will get "fastify.jwt is not decorated" errors.

## ESM

- `"type": "module"` in package.json — everything is ESM.
- All internal imports use `.js` extension (e.g., `import { db } from '../config/db.connection.js'`).
- `tsconfig.json` targets ES2022 with `module: NodeNext` / `moduleResolution: NodeNext`.
- `verbatimModuleSyntax` is temporarily disabled (`false`) in tsconfig.

## Testing

- Uses **Node's built-in `node:test`** — not Jest or Vitest.
- Tests use `app.inject()` (Fastify's HTTP injection) — no real server starts.
- **Requires a live PostgreSQL database** — tests hit the real DB. Set `DATABASE_URL` in env.
- `UNIQUE = Date.now()` prevents email collisions across runs.
- Test structure: Health → Auth → Admin setup → Products → Users (ordered, stateful).

## Environment

- Env vars validated at startup via Zod (`src/config/env.ts`). Missing or invalid vars crash immediately.
- Required vars: `DATABASE_URL`, `JWT_SECRET` (min 32 chars).
- Defaults: `PORT=3000`, `HOST=0.0.0.0`, `JWT_EXPIRES_IN=7d`, `NODE_ENV=development`.

## Architecture

```
src/
  app.ts                  ← buildServer() — extractable for testing
  server.ts               ← startup, DB connection test, signal handlers
  config/
    plugin.register.ts    ← autoloads plugins/ directory
    db.connection.ts      ← pg Pool + Drizzle instance
    db.schemas.ts         ← Drizzle table definitions
    env.ts                ← Zod-validated env vars
  routes/v1/              ← autoloaded under /api/v1 with autoPrefix
  controllers/            ← request handlers (thin, delegates to services)
  services/               ← business logic
  models/                 ← Drizzle query wrappers
  schemas/                ← Zod validation schemas (separate from route schemas)
  middlewares/             ← authMiddleware, requireRole
  plugins/                ← cors, jwt, helmet, compress, rate-limit, swagger, sensible
  utils/                  ← health route, logger, validator
  types/                  ← TypeScript interfaces
```

`app.ts` exports `buildServer()` which creates the Fastify instance, registers plugins and autoloads, and returns it. `server.ts` calls `buildServer()` then starts listening — this separation lets tests use `buildServer()` without starting the HTTP server.
