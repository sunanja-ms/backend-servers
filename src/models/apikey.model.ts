import { db } from '../config/db.connection.js';
import { apiKeys, users, ApiKey } from '../config/db.schemas.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import env from '../config/env.js';
import type { ApiKeyInfo } from '../types/index.js';

const API_KEY_EXPIRY_DAYS = parseInt(env.API_KEY_EXPIRY_DAYS, 10);

function generateApiKey(): { rawKey: string; keyHash: string; prefix: string } {
  const rawKey = 'ak_' + crypto.randomBytes(16).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const prefix = rawKey.substring(0, 8);
  return { rawKey, keyHash, prefix };
}

function toApiKeyInfo(row: ApiKey): ApiKeyInfo {
  return {
    id: row.id,
    name: row.name,
    prefix: row.prefix,
    expiresAt: row.expiresAt,
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
  };
}

export class ApiKeyModel {
  async create(
    userId: number,
    name: string
  ): Promise<{ rawKey: string; apiKey: ApiKeyInfo }> {
    const { rawKey, keyHash, prefix } = generateApiKey();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + API_KEY_EXPIRY_DAYS);

    const [apiKey] = await db
      .insert(apiKeys)
      .values({
        userId,
        name,
        keyHash,
        prefix,
        expiresAt,
      })
      .returning();

    if (!apiKey) {
      throw new Error('Failed to create API key');
    }

    logger.info(`API key created: ${apiKey.name} for user ${userId}`);
    return { rawKey, apiKey: toApiKeyInfo(apiKey) };
  }

  async findByPrefix(prefix: string): Promise<ApiKey | null> {
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.prefix, prefix))
      .limit(1);
    return key || null;
  }

  async findByUser(userId: number): Promise<ApiKeyInfo[]> {
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));

    return keys.map(toApiKeyInfo);
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const [key] = await db
      .delete(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)))
      .returning();

    if (key) {
      logger.info(`API key deleted: ${key.name} (id=${id})`);
    }
    return !!key;
  }

  async updateLastUsed(id: number): Promise<void> {
    await db
      .update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, id));
  }

  async validateKey(
    rawKey: string
  ): Promise<{ userId: number; role: string } | null> {
    const prefix = rawKey.substring(0, 8);
    const key = await this.findByPrefix(prefix);
    if (!key) return null;

    if (new Date() > key.expiresAt) {
      await db.delete(apiKeys).where(eq(apiKeys.id, key.id));
      return null;
    }

    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    if (key.keyHash !== keyHash) return null;

    await this.updateLastUsed(key.id);

    const [user] = await db
      .select({ id: users.id, role: users.role, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, key.userId))
      .limit(1);

    if (!user || !user.isActive) return null;

    return { userId: user.id, role: user.role as string };
  }
}
