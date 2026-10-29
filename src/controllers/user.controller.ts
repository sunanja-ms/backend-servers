import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service.js';
import { updateUserSchema, updatePasswordSchema } from '../schemas/user.schema.js';
import { toggleStatusSchema } from '../schemas/common.schema.js';
import { idSchema, parsePagination } from '../utils/validator.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { invalidateUserCache } from '../middlewares/auth.middleware.js';
import { AppError } from '../types/errors.js';
import { processImage } from '../utils/upload.js';
import { writeFile, unlink } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

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

    const authReq = request as AuthRequest;
    const isOwner = authReq.user.id === id;
    const canRead = isOwner || authReq.user.role === 'admin' || authReq.user.role === 'moderator';
    if (!canRead) {
      throw AppError.forbidden('You can only view your own profile');
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

  uploadAvatar = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const authReq = request as AuthRequest;
    if (authReq.user.id !== id && authReq.user.role !== 'admin') {
      throw AppError.forbidden('You can only change your own avatar');
    }

    const existing = await this.userService.findById(id);
    if (!existing) throw AppError.notFound('User not found');

    const data = await request.file();
    if (!data) throw AppError.badRequest('No file uploaded');

    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch {
      throw AppError.badRequest('File too large (max 5 MB)');
    }

    const webp = await processImage(buffer, { maxWidth: 300, square: true });
    const filename = `avatar_${id}_${randomUUID()}.webp`;
    await writeFile(join(avatarsDir, filename), webp);

    const user = await this.userService.updateUser(id, { avatarUrl: `/storage/avatars/${filename}` });
    if (!user) throw AppError.notFound('User not found');

    await removeAvatarFile(existing.avatarUrl);
    invalidateUserCache(id);

    reply.status(201).send({ success: true, message: 'Avatar updated', data: user });
  };

  deleteAvatar = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const authReq = request as AuthRequest;
    if (authReq.user.id !== id && authReq.user.role !== 'admin') {
      throw AppError.forbidden('You can only change your own avatar');
    }

    const existing = await this.userService.findById(id);
    if (!existing) throw AppError.notFound('User not found');

    const user = await this.userService.updateUser(id, { avatarUrl: null });
    await removeAvatarFile(existing.avatarUrl);
    invalidateUserCache(id);

    reply.send({ success: true, message: 'Avatar removed', data: user });
  };
}

const avatarsDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'storage', 'avatars');
if (!existsSync(avatarsDir)) mkdirSync(avatarsDir, { recursive: true });

// Only delete files that live inside our avatars directory.
async function removeAvatarFile(avatarUrl: string | null): Promise<void> {
  if (!avatarUrl) return;
  const filename = basename(avatarUrl);
  if (!filename) return;
  await unlink(join(avatarsDir, filename)).catch(() => undefined);
}
