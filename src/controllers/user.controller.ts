import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service.js';
import { updateUserSchema, updatePasswordSchema } from '../schemas/user.schema.js';
import { idSchema } from '../utils/validator.js';

export class UserController {
  constructor(private userService: UserService) {}

  getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const users = await this.userService.findAll();

    reply.send({
      success: true,
      data: users,
    });
  };

  getById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const user = await this.userService.findById(id);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
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

    const user = await this.userService.updateUser(id, data);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    }

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
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    reply.status(204).send();
  };

  updatePassword = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { currentPassword, newPassword } = updatePasswordSchema.parse(request.body);

    const updated = await this.userService.updatePassword(id, currentPassword, newPassword);

    if (!updated) {
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message: 'Invalid current password or user not found',
      });
    }

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
    const { isActive } = request.body as { isActive: boolean };

    if (typeof isActive !== 'boolean') {
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message: 'isActive must be a boolean',
      });
    }

    const user = await this.userService.toggleUserStatus(id, isActive);

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    reply.send({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  };
}