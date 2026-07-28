import autocannon from 'autocannon';
import { spawn } from 'child_process';
import http from 'http';

const PORT = 3000;
const HOST = 'localhost';
const BASE = `http://${HOST}:${PORT}`;
const CONNECTIONS = 100;
const PIPELINING = 10;
const DURATION = 10;

function waitForServer(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, (res) => {
        res.resume();
        if (res.statusCode === 200) return resolve();
        setTimeout(check, 500);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Server timeout'));
        setTimeout(check, 500);
      });
    };
    check();
  });
}

function httpReq(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const opts = {
      hostname: HOST,
      port: PORT,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
    };
    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function seedData() {
  console.log('\n--- Seeding test data ---');

  const timestamp = Date.now();

  const adminReg = await httpReq('POST', '/api/v1/auth/register', {
    email: `loadtest_admin_${timestamp}@test.com`,
    password: 'password123',
    name: 'Load Test Admin',
  });
  console.log(`  Register admin: ${adminReg.status}`);

  const adminLogin = await httpReq('POST', '/api/v1/auth/login', {
    email: `loadtest_admin_${timestamp}@test.com`,
    password: 'password123',
  });
  const adminToken = adminLogin.body?.data?.token;

  if (adminToken) {
    await httpReq('PATCH', `/api/v1/users/${adminLogin.body.data.user.id}/toggle-status`, { isActive: true }, { Authorization: `Bearer ${adminToken}` });
  }

  const userTokens = [];
  const productIds = [];

  const batchSize = 10;
  for (let b = 0; b < 10; b++) {
    const promises = [];
    const batchEmails = [];
    for (let i = 0; i < batchSize; i++) {
      const idx = b * batchSize + i;
      const email = `loaduser_${timestamp}_${idx}@test.com`;
      batchEmails.push(email);
      promises.push(
        httpReq('POST', '/api/v1/auth/register', {
          email,
          password: 'password123',
          name: `Load User ${idx}`,
        })
      );
    }
    const results = await Promise.all(promises);
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 201 || r.status === 409) {
        const login = await httpReq('POST', '/api/v1/auth/login', {
          email: batchEmails[i],
          password: 'password123',
        });
        if (login.body?.data?.token) {
          userTokens.push(login.body.data.token);
        }
      }
    }
  }

  console.log(`  Created ${userTokens.length} user tokens`);

  for (let i = 0; i < Math.min(20, userTokens.length); i++) {
    const prod = await httpReq('POST', '/api/v1/products', {
      name: `Load Product ${i}`,
      description: `Test product ${i}`,
      price: 10000 + i * 1000,
      stock: 100,
    }, { Authorization: `Bearer ${userTokens[i]}` });
    if (prod.body?.data?.id) productIds.push(prod.body.data.id);
  }

  console.log(`  Created ${productIds.length} products`);
  return { adminToken, userTokens, productIds };
}

function runAutocannon(name, opts) {
  return new Promise((resolve, reject) => {
    const instance = autocannon(
      {
        ...opts,
        connections: opts.connections || CONNECTIONS,
        pipelining: opts.pipelining || PIPELINING,
        duration: opts.duration || DURATION,
        title: name,
        url: opts.url || BASE,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    autocannon.track(instance, { renderProgressBar: false });
  });
}

function printResult(name, result) {
  const pad = (s, n) => String(s).padEnd(n);
  const rpad = (s, n) => String(s).padStart(n);

  console.log(`\n  ${'='.repeat(60)}`);
  console.log(`  ${name}`);
  console.log(`  ${'='.repeat(60)}`);
  console.log(`  ${pad('Req/s:', 20)} ${rpad(result.requests.average, 8)} avg | ${rpad(result.requests.total, 10)} total`);
  console.log(`  ${pad('Throughput:', 20)} ${rpad((result.throughput.average / 1024 / 1024).toFixed(2), 8)} MB/s | ${rpad((result.throughput.total / 1024 / 1024).toFixed(2), 8)} MB total`);
  console.log(`  ${pad('Latency avg:', 20)} ${rpad(result.latency.average.toFixed(2), 8)} ms`);
  console.log(`  ${pad('Latency p50:', 20)} ${rpad(result.latency.p50.toFixed(2), 8)} ms`);
  console.log(`  ${pad('Latency p90:', 20)} ${rpad(result.latency.p90.toFixed(2), 8)} ms`);
  console.log(`  ${pad('Latency p99:', 20)} ${rpad(result.latency.p99.toFixed(2), 8)} ms`);
  console.log(`  ${pad('Errors:', 20)} ${rpad(result.errors || 0, 8)}`);
  console.log(`  ${pad('Timeouts:', 20)} ${rpad(result.timeouts || 0, 8)}`);
  console.log(`  ${pad('Non-2xx:', 20)} ${rpad(result.non2xx || 0, 8)}`);

  if (result.statusCodeStats) {
    const codes = Object.entries(result.statusCodeStats)
      .map(([code, stats]) => `${code}:${stats.count}`)
      .join(' | ');
    console.log(`  Status: ${codes}`);
  }
}

function toResultTable(name, result) {
  return {
    name,
    reqAvg: result.requests.average,
    reqTotal: result.requests.total,
    throughputMB: (result.throughput.average / 1024 / 1024).toFixed(2),
    latencyAvg: result.latency.average.toFixed(2),
    p50: result.latency.p50.toFixed(2),
    p90: result.latency.p90.toFixed(2),
    p99: result.latency.p99.toFixed(2),
    errors: result.errors || 0,
    non2xx: result.non2xx || 0,
    timeouts: result.timeouts || 0,
  };
}

async function main() {
  console.log('========================================');
  console.log('  Fastify Backend Load Test');
  console.log(`  ${CONNECTIONS} concurrent users | ${DURATION}s duration`);
  console.log('========================================');

  console.log('\n[1/4] Starting server...');
  const child = spawn('npx', ['tsx', 'src/server.ts'], {
    cwd: '/root/backend/backend-server',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0' },
  });

  let serverOutput = '';
  child.stdout.on('data', (d) => (serverOutput += d.toString()));
  child.stderr.on('data', (d) => (serverOutput += d.toString()));

  try {
    await waitForServer(`${BASE}/health`);
    console.log('  Server is ready!');
  } catch (e) {
    console.error('  Failed to start server:', e.message);
    console.error('  Server output:\n', serverOutput);
    child.kill('SIGTERM');
    process.exit(1);
  }

  let adminToken, userTokens, productIds;
  try {
    const seed = await seedData();
    adminToken = seed.adminToken;
    userTokens = seed.userTokens;
    productIds = seed.productIds;
  } catch (e) {
    console.error('  Seed failed:', e.message);
    child.kill('SIGTERM');
    process.exit(1);
  }

  const results = [];

  console.log('\n[2/4] Running load tests...');

  console.log('\n--- Test 1/14: GET /health (public) ---');
  try {
    const r = await runAutocannon('GET /health', { url: `${BASE}/health`, method: 'GET' });
    printResult('GET /health', r);
    results.push(toResultTable('GET /health', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 2/14: POST /auth/register (public) ---');
  let regTokens = [];
  try {
    const r = await runAutocannon('POST /auth/register', {
      url: `${BASE}/api/v1/auth/register`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `reg_${Date.now()}@test.com`, password: 'password123', name: 'Load Reg User' }),
      setupRequest: (req) => {
        const email = `reg_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`;
        return { ...req, body: JSON.stringify({ email, password: 'password123', name: 'Load Reg User' }) };
      },
    });
    printResult('POST /auth/register', r);
    results.push(toResultTable('POST /auth/register', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 3/14: POST /auth/login (public) ---');
  const loginTokens = [];
  try {
    const r = await runAutocannon('POST /auth/login', {
      url: `${BASE}/api/v1/auth/login`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      setupRequest: (req) => {
        const idx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        return { ...req, body: JSON.stringify({ email: `loaduser_${timestamp}_${idx}@test.com`, password: 'password123' }) };
      },
    });
    printResult('POST /auth/login', r);
    results.push(toResultTable('POST /auth/login', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 4/14: GET /auth/me (auth) ---');
  try {
    const r = await runAutocannon('GET /auth/me', {
      url: `${BASE}/api/v1/auth/me`,
      method: 'GET',
      setupRequest: (req) => {
        const idx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        return { ...req, headers: { ...req.headers, Authorization: `Bearer ${userTokens[idx]}` } };
      },
    });
    printResult('GET /auth/me', r);
    results.push(toResultTable('GET /auth/me', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 5/14: POST /auth/validate (auth) ---');
  try {
    const r = await runAutocannon('POST /auth/validate', {
      url: `${BASE}/api/v1/auth/validate`,
      method: 'POST',
      setupRequest: (req) => {
        const idx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        return { ...req, headers: { ...req.headers, Authorization: `Bearer ${userTokens[idx]}` } };
      },
    });
    printResult('POST /auth/validate', r);
    results.push(toResultTable('POST /auth/validate', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 6/14: GET /users (admin) ---');
  try {
    const r = await runAutocannon('GET /users', {
      url: `${BASE}/api/v1/users`,
      method: 'GET',
      setupRequest: (req) => ({ ...req, headers: { ...req.headers, Authorization: `Bearer ${adminToken}` } }),
    });
    printResult('GET /users', r);
    results.push(toResultTable('GET /users', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 7/14: GET /users/:id (auth) ---');
  try {
    const r = await runAutocannon('GET /users/:id', {
      url: `${BASE}/api/v1/users/1`,
      method: 'GET',
      setupRequest: (req) => {
        const idx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        const uid = idx + 2;
        return { ...req, url: `/api/v1/users/${uid}`, headers: { ...req.headers, Authorization: `Bearer ${userTokens[idx]}` } };
      },
    });
    printResult('GET /users/:id', r);
    results.push(toResultTable('GET /users/:id', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 8/14: GET /products (auth) ---');
  try {
    const r = await runAutocannon('GET /products', {
      url: `${BASE}/api/v1/products`,
      method: 'GET',
      setupRequest: (req) => {
        const idx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        return { ...req, headers: { ...req.headers, Authorization: `Bearer ${userTokens[idx]}` } };
      },
    });
    printResult('GET /products', r);
    results.push(toResultTable('GET /products', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 9/14: POST /products (auth) ---');
  try {
    const r = await runAutocannon('POST /products', {
      url: `${BASE}/api/v1/products`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      setupRequest: (req) => {
        const idx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        return {
          ...req,
          headers: { ...req.headers, Authorization: `Bearer ${userTokens[idx]}` },
          body: JSON.stringify({
            name: `Product ${Date.now()}_${Math.random().toString(36).slice(2)}`,
            description: 'Load test product',
            price: Math.floor(Math.random() * 100000) + 1000,
            stock: Math.floor(Math.random() * 100),
          }),
        };
      },
    });
    printResult('POST /products', r);
    results.push(toResultTable('POST /products', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 10/14: GET /products/:id (auth) ---');
  try {
    const r = await runAutocannon('GET /products/:id', {
      url: `${BASE}/api/v1/products/${productIds[0] || 1}`,
      method: 'GET',
      setupRequest: (req) => {
        const pidx = Math.floor(Math.random() * Math.max(1, productIds.length));
        const uidx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        return { ...req, url: `/api/v1/products/${productIds[pidx] || 1}`, headers: { ...req.headers, Authorization: `Bearer ${userTokens[uidx]}` } };
      },
    });
    printResult('GET /products/:id', r);
    results.push(toResultTable('GET /products/:id', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 11/14: PUT /products/:id (auth) ---');
  try {
    const r = await runAutocannon('PUT /products/:id', {
      url: `${BASE}/api/v1/products/${productIds[0] || 1}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      setupRequest: (req) => {
        const pidx = Math.floor(Math.random() * Math.max(1, productIds.length));
        const uidx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        return {
          ...req,
          url: `/api/v1/products/${productIds[pidx] || 1}`,
          headers: { ...req.headers, Authorization: `Bearer ${userTokens[uidx]}` },
          body: JSON.stringify({
            name: `Updated Product ${Date.now()}`,
            price: Math.floor(Math.random() * 100000) + 1000,
          }),
        };
      },
    });
    printResult('PUT /products/:id', r);
    results.push(toResultTable('PUT /products/:id', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 12/14: PATCH /products/:id/stock (auth) ---');
  try {
    const r = await runAutocannon('PATCH /products/:id/stock', {
      url: `${BASE}/api/v1/products/${productIds[0] || 1}/stock`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      setupRequest: (req) => {
        const pidx = Math.floor(Math.random() * Math.max(1, productIds.length));
        const uidx = Math.floor(Math.random() * Math.min(10, userTokens.length));
        const qty = Math.floor(Math.random() * 10) + 1;
        return {
          ...req,
          url: `/api/v1/products/${productIds[pidx] || 1}/stock`,
          headers: { ...req.headers, Authorization: `Bearer ${userTokens[uidx]}` },
          body: JSON.stringify({ quantity: qty }),
        };
      },
    });
    printResult('PATCH /products/:id/stock', r);
    results.push(toResultTable('PATCH /products/:id/stock', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 13/14: PATCH /products/:id/toggle-status (admin) ---');
  try {
    const r = await runAutocannon('PATCH /products/:id/toggle-status', {
      url: `${BASE}/api/v1/products/${productIds[0] || 1}/toggle-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      setupRequest: (req) => {
        const pidx = Math.floor(Math.random() * Math.max(1, productIds.length));
        return {
          ...req,
          url: `/api/v1/products/${productIds[pidx] || 1}/toggle-status`,
          headers: { ...req.headers, Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ isActive: true }),
        };
      },
    });
    printResult('PATCH /products/:id/toggle-status', r);
    results.push(toResultTable('PATCH /products/:id/toggle-status', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n--- Test 14/14: PATCH /users/:id/toggle-status (admin) ---');
  try {
    const r = await runAutocannon('PATCH /users/:id/toggle-status', {
      url: `${BASE}/api/v1/users/2/toggle-status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      setupRequest: (req) => {
        const uid = Math.floor(Math.random() * 10) + 2;
        return {
          ...req,
          url: `/api/v1/users/${uid}/toggle-status`,
          headers: { ...req.headers, Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ isActive: true }),
        };
      },
    });
    printResult('PATCH /users/:id/toggle-status', r);
    results.push(toResultTable('PATCH /users/:id/toggle-status', r));
  } catch (e) { console.error('  FAILED:', e.message); }

  console.log('\n[3/4] Shutting down server...');
  child.kill('SIGTERM');
  await new Promise((r) => child.on('close', r));

  console.log('\n[4/4] Generating summary...\n');

  console.log('========================================');
  console.log('  LOAD TEST SUMMARY');
  console.log(`  ${CONNECTIONS} concurrent users | ${DURATION}s duration | pipelining=${PIPELINING}`);
  console.log('========================================');
  console.log(
    '  ' +
    'Endpoint'.padEnd(40) +
    'Req/s'.padStart(10) +
    'Lat avg'.padStart(10) +
    'p50'.padStart(8) +
    'p90'.padStart(8) +
    'p99'.padStart(8) +
    'Errors'.padStart(8)
  );
  console.log('  ' + '-'.repeat(92));

  let totalReqs = 0;
  let totalErrors = 0;
  for (const r of results) {
    totalReqs += r.reqTotal;
    totalErrors += r.errors;
    console.log(
      '  ' +
      r.name.padEnd(40) +
      String(r.reqAvg).padStart(10) +
      (r.latencyAvg + 'ms').padStart(10) +
      (r.p50 + 'ms').padStart(8) +
      (r.p90 + 'ms').padStart(8) +
      (r.p99 + 'ms').padStart(8) +
      String(r.errors).padStart(8)
    );
  }
  console.log('  ' + '-'.repeat(92));
  console.log(`  TOTAL: ${totalReqs} requests | ${totalErrors} errors`);

  const fs = await import('fs');
  fs.writeFileSync(
    '/root/backend/backend-server/test/load-test-results.json',
    JSON.stringify({ config: { connections: CONNECTIONS, duration: DURATION, pipelining: PIPELINING }, results }, null, 2)
  );
  console.log('\n  Results saved to test/load-test-results.json');
  console.log('\nDone!');
}

main().catch((e) => {
  console.error('Load test failed:', e);
  process.exit(1);
});
