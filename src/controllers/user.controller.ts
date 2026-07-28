import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service.js';
import { updateUserSchema, updatePasswordSchema } from '../schemas/user.schema.js';
import { toggleStatusSchema } from '../schemas/common.schema.js';
import { idSchema, parsePagination } from '../utils/validator.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { invalidateUserCache } from '../middlewares/auth.middleware.js';
import { AppError } from '../types/errors.js';

export class UserController {
  constructor(private userService: UserService) {}

  getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const pagination = parsePagination(request.query as Record<string, unknown>);
    const result = await this.userService.findAll(pagination);

    reply.send({
      success: true,
      data: result.data,
      message: `Page ${result.page} of ${result.totalPages} (${result.total} total)`,
    });
  };

  getById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const user = await this.userService.findById(id);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    reply.send({
      success: true,
      data: user,
    });
  };

  update = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const data = updateUserSchema.parse(request.body);

    const authReq = request as AuthRequest;
    const isOwner = authReq.user.id === id;
    const isAdmin = authReq.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('You can only update your own profile');
    }

    const user = await this.userService.updateUser(id, data);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    invalidateUserCache(id);

    reply.send({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  };

  delete = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });

    const deleted = await this.userService.deleteUser(id);

    if (!deleted) {
      throw AppError.notFound('User not found');
    }

    invalidateUserCache(id);

    reply.status(204).send();
  };

  restore = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });

    const user = await this.userService.restoreUser(id);

    if (!user) {
      throw AppError.notFound('User not found or not deleted');
    }

    invalidateUserCache(id);

    reply.send({
      success: true,
      message: 'User restored successfully',
      data: user,
    });
  };

  updatePassword = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { currentPassword, newPassword } = updatePasswordSchema.parse(request.body);

    const authReq = request as AuthRequest;
    const isOwner = authReq.user.id === id;
    const isAdmin = authReq.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('You can only change your own password');
    }

    const updated = await this.userService.updatePassword(id, currentPassword, newPassword);

    if (!updated) {
      throw AppError.badRequest('Invalid current password or user not found');
    }

    invalidateUserCache(id);

    reply.send({
      success: true,
      message: 'Password updated successfully',
    });
  };

  toggleStatus = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { isActive } = toggleStatusSchema.parse(request.body ?? {});

    const user = await this.userService.toggleUserStatus(id, isActive);

    if (!user) {
      throw AppError.notFound('User not found');
    }

    invalidateUserCache(id);

    reply.send({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  };
}
