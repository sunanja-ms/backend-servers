import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/db.connection.js';
import { users } from '../config/db.schemas.js';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends FastifyRequest {
  user: {
    id: number;
    email: string;
    name: string;
    role: string | null;
  };
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();

    const decoded = request.user as { id: number };
    if (!decoded?.id) {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token payload',
      });
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
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'User not found',
      });
    }

    if (!user[0].isActive) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'User account is deactivated',
      });
    }

    (request as AuthRequest).user = {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name,
      role: user[0].role,
    };
  } catch (error) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await authMiddleware(request, reply);
    const user = (request as AuthRequest).user;
    if (!user || !user.role || !roles.includes(user.role)) {
      return reply.status(403).send({
        success: false,
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}