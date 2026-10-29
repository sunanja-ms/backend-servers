import { FastifyInstance } from 'fastify';
import { UserController } from '../../controllers/user.controller.js';
import { UserService } from '../../services/user.service.js';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.js';

async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const userService = new UserService();
  const userController = new UserController(userService);

  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', {
    preHandler: [requireRole(['admin', 'moderator'])],
    schema: {
      description: 'Get all users (paginated)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          sortBy: { type: 'string', enum: ['name', 'email', 'role', 'createdAt', 'updatedAt'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string' },
          isActive: { type: 'string', enum: ['true', 'false'] },
          includeDeleted: { type: 'boolean', default: false },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
  }, userController.getAll);

  fastify.get('/:id', {
    schema: {
      description: 'Get user by ID',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
  }, userController.getById);

  fastify.put('/:id', {
    schema: {
      description: 'Update user (owner or admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2 },
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object', additionalProperties: true },
          },
        },
      },
    },
  }, userController.update);

  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [requireRole(['admin'])],
    schema: {
      description: 'Delete user (Admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
    },
  }, userController.delete);

  fastify.post('/:id/change-password', {
    schema: {
      description: 'Change user password (owner or admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 6 },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
    },
  }, userController.updatePassword);

  fastify.post<{ Params: { id: string } }>('/:id/avatar', {
    schema: {
      description: 'Upload avatar (owner or admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                email: { type: 'string' },
                name: { type: 'string' },
                avatarUrl: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, userController.uploadAvatar);

  fastify.delete<{ Params: { id: string } }>('/:id/avatar', {
    schema: {
      description: 'Remove avatar (owner or admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id'],
      },
    },
  }, userController.deleteAvatar);

  fastify.patch<{ Params: { id: string } }>('/:id/restore', {
    preHandler: [requireRole(['admin'])],
    schema: {
      description: 'Restore soft-deleted user (Admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id'],
      },
    },
  }, userController.restore);

  fastify.patch<{ Params: { id: string }; Body: { isActive: boolean } }>('/:id/toggle-status', {
    preHandler: [requireRole(['admin'])],
    schema: {
      description: 'Toggle user status (Admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        required: ['isActive'],
        properties: {
          isActive: { type: 'boolean' },
        },
      },
    },
  }, userController.toggleStatus);
}

userRoutes.autoPrefix = '/users';
export default userRoutes;
