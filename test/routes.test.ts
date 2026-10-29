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
let user2Token: string;
let modToken: string;
let userId = 0;
let adminId = 0;
let user2Id = 0;
let modId = 0;
let productId = 0;
let user2ProductId = 0;
let apiKeyValue = '';
let apiKeyId = 0;

function assertErrorResponse(res: any, statusCode: number) {
  const body = res.json();
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.statusCode, statusCode);
  assert.ok(typeof body.error === 'string');
  assert.ok(typeof body.message === 'string');
  return body;
}

function multipart(filename: string, contentType: string) {
  const boundary = `----test${UNIQUE}`;
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="file"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    '',
    'test-bytes',
    `--${boundary}--`,
    '',
  ].join('\r\n');
  return { body, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } };
}

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
    const body = assertErrorResponse(res, 409);
    assert.ok(body.message.includes('already exists'));
  });

  it('POST /api/v1/auth/register - validates input', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'bad', password: '12', name: 'X' },
    });
    assert.strictEqual(res.statusCode, 400);
  });

  it('POST /api/v1/auth/register - rejects short password', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `short_${UNIQUE}@test.com`, password: 'ab', name: 'Short Pass' },
    });
    assert.strictEqual(res.statusCode, 400);
    assertErrorResponse(res, 400);
  });

  it('POST /api/v1/auth/register - rejects invalid email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: 'not-an-email', password: 'pass123456', name: 'Bad Email' },
    });
    assert.strictEqual(res.statusCode, 400);
    assertErrorResponse(res, 400);
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
    assertErrorResponse(res, 401);
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
    assertErrorResponse(res, 401);
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
    assertErrorResponse(res, 401);
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
    assertErrorResponse(res, 401);
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

  it('POST /api/v1/products - rejects negative price', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Neg Price', price: -5.99 },
    });
    assert.strictEqual(res.statusCode, 400);
    assertErrorResponse(res, 400);
  });

  it('POST /api/v1/products - rejects empty name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: '', price: 10 },
    });
    assert.strictEqual(res.statusCode, 400);
    assertErrorResponse(res, 400);
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

  it('GET /api/v1/products - paginates results', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products?page=1&limit=2',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length <= 2);
    assert.ok(body.message.includes('Page 1'));
  });

  it('GET /api/v1/products - returns page 2', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products?page=2&limit=2',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.message.includes('Page 2'));
  });

  it('GET /api/v1/products - sorts ascending by name', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products?sortBy=name&sortOrder=asc',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.data));
    if (body.data.length >= 2) {
      assert.ok(body.data[0].name <= body.data[1].name);
    }
  });

  it('GET /api/v1/products - sorts descending by name', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/products?sortBy=name&sortOrder=desc',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.data));
    if (body.data.length >= 2) {
      assert.ok(body.data[0].name >= body.data[1].name);
    }
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
    assertErrorResponse(res, 404);
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

  it('PUT /api/v1/products/:id - rejects zero price', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/products/${productId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { price: 0 },
    });
    assert.strictEqual(res.statusCode, 400);
    assertErrorResponse(res, 400);
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

  it('PATCH /api/v1/products/:id/stock - rejects zero quantity', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${productId}/stock`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { quantity: 0 },
    });
    assert.strictEqual(res.statusCode, 400);
    assertErrorResponse(res, 400);
  });

  it('PATCH /api/v1/products/:id/toggle-status - admin only', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${productId}/toggle-status`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { isActive: false },
    });
    assert.strictEqual(res.statusCode, 403);
    assertErrorResponse(res, 403);
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
    assertErrorResponse(res, 403);
  });
});

// ─── API Keys ─────────────────────────────────────────────────────

describe('API Keys', () => {
  it('POST /api/v1/api-keys - creates an API key', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: 'Test Key' },
    });
    assert.strictEqual(res.statusCode, 201);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.key.startsWith('ak_'));
    assert.strictEqual(body.data.name, 'Test Key');
    assert.ok(body.data.id);
    assert.ok(body.data.prefix);
    assert.ok(body.data.expiresAt);
    apiKeyValue = body.data.key;
    apiKeyId = body.data.id;
  });

  it('POST /api/v1/api-keys - rejects unauthenticated', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      payload: { name: 'No Auth Key' },
    });
    assert.strictEqual(res.statusCode, 401);
    assertErrorResponse(res, 401);
  });

  it('POST /api/v1/api-keys - validates input (empty name)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
      payload: { name: '' },
    });
    assert.strictEqual(res.statusCode, 400);
    assertErrorResponse(res, 400);
  });

  it('GET /api/v1/api-keys - lists API keys', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/api-keys',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 1);
    const key = body.data.find((k: any) => k.id === apiKeyId);
    assert.ok(key);
    assert.strictEqual(key.name, 'Test Key');
    assert.ok(key.prefix);
    assert.ok(key.expiresAt);
    assert.strictEqual(key.lastUsedAt, null);
  });

  it('GET /auth/me - auth works with API key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { 'x-api-key': apiKeyValue },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.id, userId);
    assert.strictEqual(body.data.email, `user_${UNIQUE}@test.com`);
  });

  it('GET /auth/me - rejects invalid API key', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { 'x-api-key': 'ak_invalidkey123456789012345678' },
    });
    assert.strictEqual(res.statusCode, 401);
    assertErrorResponse(res, 401);
  });

  it('DELETE /api/v1/api-keys/:id - revoke key', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/api-keys/${apiKeyId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.success, true);
  });

  it('GET /auth/me - revoked API key is rejected', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { 'x-api-key': apiKeyValue },
    });
    assert.strictEqual(res.statusCode, 401);
    assertErrorResponse(res, 401);
  });

  it('DELETE /api/v1/api-keys/:id - rejects non-existent key', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: '/api/v1/api-keys/999999',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 404);
    assertErrorResponse(res, 404);
  });
});

// ─── Second User Setup ───────────────────────────────────────────

describe('Second user setup', () => {
  it('registers second user and creates product', async () => {
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `user2_${UNIQUE}@test.com`, password: 'pass123456', name: 'User Two' },
    });
    assert.strictEqual(regRes.statusCode, 201);
    user2Id = regRes.json().data.id;

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `user2_${UNIQUE}@test.com`, password: 'pass123456' },
    });
    assert.strictEqual(loginRes.statusCode, 200);
    user2Token = loginRes.json().data.token;

    const prodRes = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { name: `User2 Product ${UNIQUE}`, description: 'Owned by user2', price: 19.99, stock: 50 },
    });
    assert.strictEqual(prodRes.statusCode, 201);
    user2ProductId = prodRes.json().data.id;
  });
});

// ─── Products — Ownership Enforcement ────────────────────────────

describe('Products — Ownership', () => {
  it('non-owner cannot update product', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/products/${productId}`,
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { name: 'Hacked Name' },
    });
    assert.strictEqual(res.statusCode, 403);
    const body = assertErrorResponse(res, 403);
    assert.ok(body.message.includes('own products'));
  });

  it('non-owner cannot update stock', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${productId}/stock`,
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { quantity: 999 },
    });
    assert.strictEqual(res.statusCode, 403);
    const body = assertErrorResponse(res, 403);
    assert.ok(body.message.includes('own products'));
  });

  it('owner can update own product', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/products/${user2ProductId}`,
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { name: `Updated by Owner ${UNIQUE}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.strictEqual(body.data.name, `Updated by Owner ${UNIQUE}`);
  });

  it('owner can update own stock', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/products/${user2ProductId}/stock`,
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { quantity: 10 },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json().success, true);
  });

  it('rejects a non-image upload', async () => {
    const form = multipart('evil.html', 'text/html');
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${productId}/images`,
      headers: { authorization: `Bearer ${userToken}`, ...form.headers },
      payload: form.body,
    });
    assert.strictEqual(res.statusCode, 400);
  });

  it('non-owner cannot delete an image', async () => {
    const form = multipart('photo.png', 'image/png');
    const upload = await app.inject({
      method: 'POST',
      url: `/api/v1/products/${productId}/images`,
      headers: { authorization: `Bearer ${userToken}`, ...form.headers },
      payload: form.body,
    });
    assert.strictEqual(upload.statusCode, 201);
    const imageId = upload.json().data.id;

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/products/${productId}/images/${imageId}`,
      headers: { authorization: `Bearer ${user2Token}` },
    });
    assert.strictEqual(res.statusCode, 403);
    assertErrorResponse(res, 403);

    const own = await app.inject({
      method: 'DELETE',
      url: `/api/v1/products/${productId}/images/${imageId}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(own.statusCode, 204);
  });
});

// ─── Cart & Orders ───────────────────────────────────────────────

describe('Cart & Orders', () => {
  it('POST /api/v1/cart - rejects unknown product', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/cart',
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { productId: 999999, quantity: 1 },
    });
    assert.strictEqual(res.statusCode, 404);
    assertErrorResponse(res, 404);
  });

  it('POST /api/v1/orders - creates order and decrements stock', async () => {
    const add = await app.inject({
      method: 'POST',
      url: '/api/v1/cart',
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { productId: user2ProductId, quantity: 2 },
    });
    assert.strictEqual(add.statusCode, 201);

    const before = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${user2ProductId}`,
      headers: { authorization: `Bearer ${user2Token}` },
    });
    const stockBefore = before.json().data.stock;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { shippingAddress: 'Jl. Test 1', phone: '08123456789' },
    });
    assert.strictEqual(res.statusCode, 201);
    const order = res.json().data;
    assert.strictEqual(order.items.length, 1);
    assert.strictEqual(order.items[0].quantity, 2);

    const after = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${user2ProductId}`,
      headers: { authorization: `Bearer ${user2Token}` },
    });
    assert.strictEqual(after.json().data.stock, stockBefore - 2);
  });

  it('POST /api/v1/orders - rejects insufficient stock and keeps stock', async () => {
    const add = await app.inject({
      method: 'POST',
      url: '/api/v1/cart',
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { productId: user2ProductId, quantity: 99999 },
    });
    assert.strictEqual(add.statusCode, 201);

    const before = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${user2ProductId}`,
      headers: { authorization: `Bearer ${user2Token}` },
    });
    const stockBefore = before.json().data.stock;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { authorization: `Bearer ${user2Token}` },
      payload: { shippingAddress: 'Jl. Test 2', phone: '08123456789' },
    });
    assert.strictEqual(res.statusCode, 409);
    assertErrorResponse(res, 409);

    const after = await app.inject({
      method: 'GET',
      url: `/api/v1/products/${user2ProductId}`,
      headers: { authorization: `Bearer ${user2Token}` },
    });
    assert.strictEqual(after.json().data.stock, stockBefore);
  });
});

// ─── Moderator Setup ──────────────────────────────────────────────

describe('Moderator setup', () => {
  it('registers moderator and sets role via DB', async () => {
    const regRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: { email: `mod_${UNIQUE}@test.com`, password: 'pass123456', name: 'Test Moderator' },
    });
    assert.strictEqual(regRes.statusCode, 201);
    modId = regRes.json().data.id;

    await db.update(users).set({ role: 'moderator' }).where(eq(users.id, modId));

    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: `mod_${UNIQUE}@test.com`, password: 'pass123456' },
    });
    assert.strictEqual(loginRes.statusCode, 200);
    modToken = loginRes.json().data.token;
  });
});

// ─── Users ────────────────────────────────────────────────────────

describe('Users', () => {
  it('GET /api/v1/users - admin only (regular user denied)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
    assertErrorResponse(res, 403);
  });

  it('GET /api/v1/users - moderator can list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: { authorization: `Bearer ${modToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length >= 2);
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

  it('GET /api/v1/users - paginates results', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users?page=1&limit=2',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length <= 2);
    assert.ok(body.message.includes('Page 1'));
  });

  it('GET /api/v1/users - sorts ascending by name', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users?sortBy=name&sortOrder=asc',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    const body = res.json();
    assert.ok(Array.isArray(body.data));
    if (body.data.length >= 2) {
      assert.ok(body.data[0].name <= body.data[1].name);
    }
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
    assertErrorResponse(res, 404);
  });

  it('GET /api/v1/users/:id - foreign profile forbidden', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${user2Id}`,
      headers: { authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
    assertErrorResponse(res, 403);
  });

  it('GET /api/v1/users/:id - moderator can read any profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/users/${user2Id}`,
      headers: { authorization: `Bearer ${modToken}` },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.json().data.id, user2Id);
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

  it('PUT /api/v1/users/:id - rejects invalid email', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/users/${userId}`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { email: 'not-valid' },
    });
    assert.strictEqual(res.statusCode, 400);
    assertErrorResponse(res, 400);
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
    assertErrorResponse(res, 400);
  });

  it('PATCH /api/v1/users/:id/toggle-status - non-admin forbidden', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${userId}/toggle-status`,
      headers: { authorization: `Bearer ${userToken}` },
      payload: { isActive: false },
    });
    assert.strictEqual(res.statusCode, 403);
    assertErrorResponse(res, 403);
  });

  it('PATCH /api/v1/users/:id/toggle-status - moderator forbidden', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${userId}/toggle-status`,
      headers: { authorization: `Bearer ${modToken}` },
      payload: { isActive: false },
    });
    assert.strictEqual(res.statusCode, 403);
    assertErrorResponse(res, 403);
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
    assertErrorResponse(res, 403);
  });

  it('DELETE /api/v1/users/:id - moderator forbidden', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${userId}`,
      headers: { authorization: `Bearer ${modToken}` },
    });
    assert.strictEqual(res.statusCode, 403);
    assertErrorResponse(res, 403);
  });

  it('DELETE /api/v1/users/:id - admin can delete user1', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${userId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 204);
  });

  it('DELETE /api/v1/users/:id - admin can delete user2', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${user2Id}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 204);
  });

  it('DELETE /api/v1/users/:id - admin can delete moderator', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${modId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 204);
  });

  it('DELETE /api/v1/users/:id - admin can delete self', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/users/${adminId}`,
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.statusCode, 204);
  });
});
