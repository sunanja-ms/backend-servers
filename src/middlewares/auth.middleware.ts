import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db.connection.js';
import { users } from '../config/db.schemas.js';
import { eq } from 'drizzle-orm';
import type { AuthRequest, UserRole } from '../types/index.js';
import { AppError } from '../types/errors.js';
import { ApiKeyModel } from '../models/apikey.model.js';

export type { AuthRequest };

interface CachedUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  cachedAt: number;
}

const userCache = new Map<number, CachedUser>();
const CACHE_TTL_MS = 60_000;

function getCachedUser(userId: number): CachedUser | null {
  const cached = userCache.get(userId);
  if (!cached) return null;
  if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
    userCache.delete(userId);
    return null;
  }
  return cached;
}

function setCachedUser(user: CachedUser): void {
  if (userCache.size > 10_000) {
    const oldestKey = userCache.keys().next().value;
    if (oldestKey !== undefined) userCache.delete(oldestKey);
  }
  userCache.set(user.id, { ...user, cachedAt: Date.now() });
}

export function invalidateUserCache(userId: number): void {
  userCache.delete(userId);
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKeyHeader = request.headers['x-api-key'] as string | undefined;

  if (apiKeyHeader) {
    try {
      const apiKeyModel = new ApiKeyModel();
      const result = await apiKeyModel.validateKey(apiKeyHeader);

      if (!result) {
        throw AppError.unauthorized('Invalid or expired API key');
      }

      let cachedUser = getCachedUser(result.userId);

      if (!cachedUser) {
        const user = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            isActive: users.isActive,
          })
          .from(users)
          .where(eq(users.id, result.userId))
          .limit(1);

        if (!user[0]) {
          throw AppError.unauthorized('User not found');
        }

        if (!user[0].isActive) {
          throw AppError.forbidden('User account is deactivated');
        }

        cachedUser = {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          role: user[0].role as UserRole,
          isActive: user[0].isActive,
          cachedAt: Date.now(),
        };
        setCachedUser(cachedUser);
      } else if (!cachedUser.isActive) {
        userCache.delete(result.userId);
        throw AppError.forbidden('User account is deactivated');
      }

      (request as AuthRequest).user = {
        id: cachedUser.id,
        email: cachedUser.email,
        name: cachedUser.name,
        role: cachedUser.role,
      };
      return;
    } catch (error) {
      if (error instanceof AppError) {
        return reply.status(error.statusCode).send({
          success: false,
          error: error.name,
          message: error.message,
          statusCode: error.statusCode,
        });
      }
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired API key',
        statusCode: 401,
      });
    }
  }

  try {
    await request.jwtVerify();

    const decoded = request.user as { id: number };
    if (!decoded?.id) {
      throw AppError.unauthorized('Invalid token payload');
    }

    let cachedUser = getCachedUser(decoded.id);

    if (!cachedUser) {
      const user = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          isActive: users.isActive,
        })
        .from(users)
        .where(eq(users.id, decoded.id))
        .limit(1);

      if (!user[0]) {
        throw AppError.unauthorized('User not found');
      }

      if (!user[0].isActive) {
        throw AppError.forbidden('User account is deactivated');
      }

      cachedUser = {
        id: user[0].id,
        email: user[0].email,
        name: user[0].name,
        role: user[0].role as UserRole,
        isActive: user[0].isActive,
        cachedAt: Date.now(),
      };
      setCachedUser(cachedUser);
    } else if (!cachedUser.isActive) {
      userCache.delete(decoded.id);
      throw AppError.forbidden('User account is deactivated');
    }

    (request as AuthRequest).user = {
      id: cachedUser.id,
      email: cachedUser.email,
      name: cachedUser.name,
      role: cachedUser.role,
    };
  } catch (error) {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
      });
    }
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
      statusCode: 401,
    });
  }
}

export function requireRole(roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!(request as AuthRequest).user) {
      await authMiddleware(request, reply);
      if (reply.sent) return;
    }
    const user = (request as AuthRequest).user;
    if (!user || !user.role || !roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
        statusCode: 403,
      });
    }
  };
}
