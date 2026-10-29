# AGENTS.md — Fastify Backend Server

## Commands

```bash
npm run dev              # tsx watch hot-reload dev server
npm run build            # tsc → dist/
npm start                # node dist/server.js
npm test                 # NODE_ENV=test node --import tsx --test test/routes.test.ts
npm run test:load        # autocannon load test (separate script)
npm run transcode        # Node.js HLS transcoder (src/storage/1.mp4 → src/storage/hls/)
npm run db:generate      # drizzle-kit generate
npm run db:migrate       # drizzle-kit migrate
npm run db:push          # drizzle-kit push (schema → DB directly)
npm run db:studio        # drizzle-kit studio (browser UI)
sudo bash scripts/install-db.sh  # install PostgreSQL, enable systemd unit, create role + db

# Frontend (in public/)
cd public && npm run build   # Vite build → public/dist/
```

No eslint, prettier, or typecheck script exists. Do not run lint commands.

## Autoload Gotcha

This repo uses `@fastify/autoload` v6. Two critical behaviors:

1. **`index.ts` blocks siblings.** If an `index.ts` exists in a directory, ALL other files in that directory are silently ignored. Before this was fixed, `src/routes/v1/index.ts` was blocking all route files. If routes stop loading, check for stray `index.ts` files.

2. **Routes must set `autoPrefix`.** Each route file exports a function with `autoPrefix` set (e.g., `authRoutes.autoPrefix = '/auth'`). Without it, routes register at the autoload's prefix root and overlap.

```
src/routes/v1/auth.routes.ts     → autoPrefix: '/auth'      → /api/v1/auth/...
src/routes/v1/apikey.routes.ts   → autoPrefix: '/api-keys'  → /api/v1/api-keys/...
src/routes/v1/cart.routes.ts     → autoPrefix: '/cart'      → /api/v1/cart/...
src/routes/v1/category.routes.ts → autoPrefix: '/categories' → /api/v1/categories/...
src/routes/v1/order.routes.ts    → autoPrefix: '/orders'    → /api/v1/orders/...
src/routes/v1/product.routes.ts  → autoPrefix: '/products'  → /api/v1/products/...
src/routes/v1/stream.routes.ts   → autoPrefix: '/stream'    → /api/v1/stream/...
src/routes/v1/user.routes.ts     → autoPrefix: '/users'     → /api/v1/users/...
```

Health check lives in `src/utils/health.routes.ts` and is autoloaded at `/` (root prefix).

## Plugin Encapsulation

`src/config/plugin.register.ts` sets `encapsulate: false` on the plugins autoload. This is required so decorators like `fastify.jwt` are accessible inside route handlers. If you remove it, routes will get "fastify.jwt is not decorated" errors.

## Static Plugin

`src/plugins/static.plugin.ts` serves the SPA from `public/dist/`. Must set `decorateReply: true` so `reply.sendFile()` is available for the SPA fallback handler. The fallback sends `index.html` for any non-API route, enabling Vue Router's `createWebHistory()`.

Only `storage/products/` is served publicly, at `/storage/products/`. Payment proofs stay in `storage/proofs/` and are downloaded from `GET /api/v1/orders/:id/proof` (owner or admin). Uploads derive the file extension from the declared mime type via `src/utils/upload.ts`; the client filename is ignored. Accepted types: JPEG, PNG, WebP, GIF.

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
- Test structure: Health → Auth → Admin setup → Products → API Keys → Second user setup → Products Ownership → Moderator setup → Users (ordered, stateful).

## Environment

- Env vars validated at startup via Zod (`src/config/env.ts`). Missing or invalid vars crash immediately.
- Required vars: `DATABASE_URL`, `JWT_SECRET` (min 32 chars).
- Defaults: `PORT=3000`, `HOST=0.0.0.0`, `JWT_EXPIRES_IN=7d`, `NODE_ENV=development`.
- Other vars: `RATE_LIMIT_MAX=1000`, `RATE_LIMIT_WINDOW=60000`, `RATE_LIMIT_AUTH_MAX=20`, `RATE_LIMIT_AUTH_WINDOW=60000`, `BCRYPT_ROUNDS=12` (dev uses 4), `API_KEY_EXPIRY_DAYS=30`, `CORS_ORIGIN=*`, `LOG_LEVEL=info`.

## Architecture

```
src/
  app.ts                  ← buildServer() — extractable for testing
  server.ts               ← startup, DB connection test, signal handlers
  config/
    plugin.register.ts    ← autoloads plugins/ directory
    db.connection.ts      ← pg Pool + Drizzle instance
    db.schemas.ts         ← Drizzle table definitions (users, products, api_keys)
    env.ts                ← Zod-validated env vars
  routes/v1/              ← autoloaded under /api/v1 with autoPrefix
  controllers/            ← request handlers (thin, delegates to services)
  services/               ← business logic
  models/                 ← Drizzle query wrappers
  schemas/                ← Zod validation schemas (apikey, common, product, user)
  middlewares/             ← authMiddleware (JWT + API Key + cache), errorMiddleware
  plugins/                ← cors, jwt, helmet, compress, static, rate-limit, swagger, sensible
  scripts/                ← transcode.mjs (HLS transcoder), transcode.sh
  storage/
    hls/                  ← HLS output: 6 resolution dirs + master.m3u8
  utils/                  ← health route, logger, validator (parsePagination)
  types/                  ← TypeScript interfaces + AppError class
```

`app.ts` exports `buildServer()` which creates the Fastify instance, registers plugins and autoloads, and returns it. `server.ts` calls `buildServer()` then starts listening — this separation lets tests use `buildServer()` without starting the HTTP server.

## Frontend (Vue 3 + Vite + Pinia)

```
public/src/
  App.vue                 ← root layout (Navbar + Sidebar + Footer + router-view)
  main.js                 ← Vue app bootstrap
  api/                    ← Axios API clients (auth, users, products, apikeys, stream)
  components/             ← Navbar, Sidebar, Footer, Modal, Toast, Skeleton, VideoPlayer
  views/                  ← Dashboard, Login, Register, Profile, Products, Users, ApiKeys, Stream
  router/index.js         ← Vue Router (auth guards, 9 routes)
  stores/                 ← Pinia stores (auth, theme, toast)
  styles/main.css         ← CSS variables, layout, responsive (dark/light themes)
  utils/export.js         ← CSV export helper
```

### VideoPlayer

Uses `plyr` v3.8.4 + `hls.js` v1.6.16 for HLS adaptive streaming. Key details:
- Quality selector uses Plyr's built-in settings panel (gear icon)
- Quality options built from `hls.levels` after `MANIFEST_PARSED` event
- Custom `AuthLoader` wraps HLS.js default loader to inject `Authorization: Bearer` header
- HLS event listeners registered BEFORE `loadSource()`/`attachMedia()` to prevent race conditions
- `switchingLevel` guard prevents feedback loop between `onChange` and `LEVEL_SWITCHED` events
- Falls back to native HLS on Safari (`canPlayType('application/vnd.apple.mpegurl')`)

### Footer

`Footer.vue` — simple centered bar at bottom of `.content` area. Pushed to bottom via `flex: 1` on `.content-body` wrapper and `margin-top: auto` on footer.

## Streaming

HLS transcoding pipeline:
1. Place source video at `src/storage/1.mp4`
2. Run `npm run transcode` — outputs 6 resolutions (1440p → 240p) to `src/storage/hls/`
3. Each resolution: 7 segments, VOD playlist, 4s segment duration
4. `master.m3u8` lists all variant streams with BANDWIDTH + RESOLUTION

Stream authenticated via `authMiddleware` (JWT or API Key):
- `GET /api/v1/stream/master.m3u8` — master playlist
- `GET /api/v1/stream/:resolution/:file` — resolution playlist or segment
- Only 6 resolutions allowed: 1440p, 1080p, 720p, 480p, 360p, 240p
- Path traversal prevented (rejects `..`, `/`, `\` in filename)
- Correct MIME types: `.m3u8` → `application/vnd.apple.mpegurl`, `.ts` → `video/mp2t`

## Persona & Output Rules

Apply these rules to all replies.

1. **No yapping.** Do not open with phrases like "Sure, I can help with that" or "Here is the code". Output the result immediately.
2. **No unsolicited explanation.** Explain code only when the user explicitly asks.
3. **Code only.** When asked for a script, return only the code block. Do not explain how to run it unless asked.
4. **No greetings.** Skip hello, thank you, and apologies.
5. **Read only when needed.** Check memory (MCP) before reading a file. Do not read files unrelated to the prompt.
6. **Bullet points.** When explaining, use short bullets. One sentence per bullet.
