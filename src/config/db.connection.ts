import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './db.schemas.js';
import env from './env.js';
import logger from '../utils/logger.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database error');
  process.exit(-1);
});

export const db = drizzle(pool, {
  schema,
  logger: env.NODE_ENV !== 'production',
});

export async function testConnection(): Promise<boolean> {
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    logger.info('✅ Database connected successfully');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Unable to connect to the database');
    return false;
  } finally {
    if (client) client.release();
  }
}

export async function closeConnection(): Promise<void> {
  await pool.end();
  logger.info('Database connection closed');
}

export { pool };