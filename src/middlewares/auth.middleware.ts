import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db.connection.js';
import { users } from '../config/db.schemas.js';
import { eq } from 'drizzle-orm';
import { AuthRequest, UserRole } from '../types/index.js';
import { AppError } from '../types/errors.js';

export { AuthRequest };

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();

    const decoded = request.user as { id: number };
    if (!decoded?.id) {
      throw AppError.unauthorized('Invalid token payload');
    }

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

    (request as AuthRequest).user = {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      role: user[0].role as UserRole,
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
