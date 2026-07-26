import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { buildServer } from '../src/app.js';
import { db } from '../src/config/db.connection.js';
import { users } from '../src/config/db.schemas.js';
import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';

const UNIQUE = Date.now();

let app: FastifyInstance;
let userToken: string;
let adminToken: string;
let userId = 0;
let adminId = 0;
let productId = 0;

before(async () => {
  app = await buildServer();
  await app.ready();
});

after(async () => {
  await app.close();
});

// ─── Health ───────────────────────────────────────────────────────

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.timestamp);
  });
});

// ─── Auth: Register & Login ──────────────────────────────────────

describe('Auth', () => {
  it('POST /api/v1/auth/register - creates a user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `user_${UNIQUE}@test.com`, password: 'pass123456', name: 'Test User' },
    });
    assert.strictEqual(res.statusCode, 201);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.email, `user_${UNIQUE}@test.com`);
    userId = body.data.id;
  });

  it('POST /api/v1/auth/register - rejects duplicate email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `user_${UNIQUE}@test.com`, password: 'pass123456', name: 'Dup User' },
    });
    assert.strictEqual(res.statusCode, 409);
  });

  it('POST /api/v1/auth/register - validates input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'bad', password: '12', name: 'X' },
    });
    assert.strictEqual(res.statusCode, 400);
  });

  it('POST /api/v1/auth/login - returns token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `user_${UNIQUE}@test.com`, password: 'pass123456' },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.token);
    assert.strictEqual(body.data.user.email, `user_${UNIQUE}@test.com`);
    userToken = body.data.token;
  });

  it('POST /api/v1/auth/login - rejects wrong password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `user_${UNIQUE}@test.com`, password: 'wrong' },
    });
    assert.strictEqual(res.statusCode, 401);
  });

  it('GET /api/v1/auth/me - returns current user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.id, userId);
    assert.strictEqual(body.data.email, `user_${UNIQUE}@test.com`);
  });

  it('GET /api/v1/auth/me - rejects unauthenticated', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/me' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('POST /api/v1/auth/validate - validates token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/validate',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.valid, true);
  });

  it('POST /api/v1/auth/validate - rejects invalid token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/validate',
      headers: { authorization: 'Bearer invalid.token.here' },
    });
    assert.strictEqual(res.statusCode, 401);
  });
});

// ─── Admin Setup ──────────────────────────────────────────────────

describe('Admin setup', () => {
  it('registers admin and sets role via DB', async () => {
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `admin_${UNIQUE}@test.com`, password: 'pass123456', name: 'Test Admin' },
    });
    assert.strictEqual(regRes.statusCode, 201);
    adminId = regRes.json().data.id;

    await db.update(users).set({ role: 'admin' }).where(eq(users.id, adminId));

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `admin_${UNIQUE}@test.com`, password: 'pass123456' },
    });
    assert.strictEqual(loginRes.statusCode, 200);
    adminToken = loginRes.json().data.token;
  });
});

// ─── Products ─────────────────────────────────────────────────────

describe('Products', () => {
  it('POST /api/v1/products - creates product', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: `Product ${UNIQUE}`, description: 'A test product', price: 29.99, stock: 100 },
    });
    assert.strictEqual(res.statusCode, 201);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.name, `Product ${UNIQUE}`);
    assert.ok(body.data.id);
    productId = body.data.id;
  });

  it('POST /api/v1/products - rejects unauthenticated', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      payload: { name: 'No Auth', price: 10 },
    });
    assert.strictEqual(res.statusCode, 401);
  });

  it('POST /api/v1/products - validates input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: '', price: -1 },
    });
    assert.strictEqual(res.statusCode, 400);
  });

  it('GET /api/v1/products - lists products', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });

  it('GET /api/v1/products/:id - gets product by id', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${productId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.id, productId);
    assert.strictEqual(body.data.name, `Product ${UNIQUE}`);
  });

  it('GET /api/v1/products/:id - returns 404 for missing', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products/999999',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 404);
  });

  it('PUT /api/v1/products/:id - updates product', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/products/${productId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: `Updated ${UNIQUE}`, price: 39.99 },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.name, `Updated ${UNIQUE}`);
  });

  it('PATCH /api/v1/products/:id/stock - updates stock', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${productId}/stock`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { quantity: 5 },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
  });

  it('PATCH /api/v1/products/:id/toggle-status - admin only', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${productId}/toggle-status`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { isActive: false },
    });
    assert.strictEqual(res.statusCode, 403);
  });

  it('PATCH /api/v1/products/:id/toggle-status - admin can toggle', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${productId}/toggle-status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { isActive: false },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.isActive, false);
  });

  it('DELETE /api/v1/products/:id - non-admin forbidden', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/products/${productId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
  });

  it('DELETE /api/v1/products/:id - admin can delete', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/products/${productId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 204);
  });
});

// ─── Users ────────────────────────────────────────────────────────

describe('Users', () => {
  it('GET /api/v1/users - admin only', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
  });

  it('GET /api/v1/users - admin can list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 2);
  });

  it('GET /api/v1/users/:id - returns user', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${userId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.id, userId);
  });

  it('GET /api/v1/users/:id - returns 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/999999',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 404);
  });

  it('PUT /api/v1/users/:id - updates user', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${userId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: `Renamed ${UNIQUE}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.name, `Renamed ${UNIQUE}`);
  });

  it('POST /api/v1/users/:id/change-password - changes password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/users/${userId}/change-password`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { currentPassword: 'pass123456', newPassword: 'newpass12345' },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json().success, true);
  });

  it('POST /api/v1/users/:id/change-password - rejects wrong current password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/users/${userId}/change-password`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { currentPassword: 'wrongold', newPassword: 'newpass12345' },
    });
    assert.strictEqual(res.statusCode, 400);
  });

  it('PATCH /api/v1/users/:id/toggle-status - non-admin forbidden', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${userId}/toggle-status`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { isActive: false },
    });
    assert.strictEqual(res.statusCode, 403);
  });

  it('PATCH /api/v1/users/:id/toggle-status - admin can toggle', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${userId}/toggle-status`,
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { isActive: false },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.isActive, false);
  });

  it('DELETE /api/v1/users/:id - non-admin forbidden', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${userId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
  });

  it('DELETE /api/v1/users/:id - admin can delete', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${adminId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 204);
  });
});
