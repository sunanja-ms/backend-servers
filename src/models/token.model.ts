import { db } from '../config/db.connection.js';
import { tokens, Token, NewToken } from '../config/db.schemas.js';
import { eq, and, isNull, gt } from 'drizzle-orm';
import crypto from 'crypto';

export class TokenModel {
  async create(userId: number, type: string, expiresInHours: number = 24): Promise<Token> {
    const tokenValue = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + expiresInHours * 3600000)

    const [token] = await db
      .insert(tokens)
      .values({ userId, type, token: tokenValue, expiresAt })
      .returning()

    return token
  }

  async findByToken(tokenValue: string, type: string): Promise<Token | null> {
    const [token] = await db
      .select()
      .from(tokens)
      .where(and(
        eq(tokens.token, tokenValue),
        eq(tokens.type, type),
        isNull(tokens.usedAt),
        gt(tokens.expiresAt, new Date())
      ))
      .limit(1)

    return token || null
  }

  async markUsed(id: number): Promise<void> {
    await db.update(tokens).set({ usedAt: new Date() }).where(eq(tokens.id, id))
  }
}
