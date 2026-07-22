import { FastifyInstance } from 'fastify';
import { UserController } from '../../controllers/user.controller.js';
import { UserService } from '../../services/user.service.js';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.js';

export default async function userRoutes(fastify: FastifyInstance): Promise<void> {
  const userService = new UserService();
  const userController = new UserController(userService);

  // All routes require authentication
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', {
    schema: {
      description: 'Get all users',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  isActive: { type: 'boolean' },
                  lastLoginAt: { type: 'string' },
                  createdAt: { type: 'string' },
                },
              },
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
          id: { type: 'string' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                isActive: { type: 'boolean' },
                lastLoginAt: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, userController.getById);

  fastify.put('/:id', {
    schema: {
      description: 'Update user',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
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
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                role: { type: 'string' },
                isActive: { type: 'boolean' },
              },
            },
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
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, userController.delete);

  fastify.post('/:id/change-password', {
    schema: {
      description: 'Change user password',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
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

  fastify.patch<{ Params: { id: string }; Body: { isActive: boolean } }>('/:id/toggle-status', {
    preHandler: [requireRole(['admin'])],
    schema: {
      description: 'Toggle user status (Admin only)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
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