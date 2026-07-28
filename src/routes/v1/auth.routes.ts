import { FastifyInstance } from 'fastify';
import { AuthController } from '../../controllers/auth.controller.js';
import { AuthService } from '../../services/auth.service.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import env from '../../config/env.js';

const authRateLimit = {
  max: parseInt(env.RATE_LIMIT_AUTH_MAX, 10),
  timeWindow: parseInt(env.RATE_LIMIT_AUTH_WINDOW, 10),
};

async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const authService = new AuthService(fastify);
  const authController = new AuthController(authService);

  fastify.post('/register', {
    config: { rateLimit: authRateLimit },
    schema: {
      description: 'Register a new user',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 2 },
        },
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
                role: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, authController.register);

  fastify.post('/login', {
    config: { rateLimit: authRateLimit },
    schema: {
      description: 'Login user',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
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
                token: { type: 'string' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                    role: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, authController.login);

  fastify.get('/me', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Get current user profile',
      tags: ['Auth'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
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
  }, authController.me);

  fastify.post('/validate', {
    schema: {
      description: 'Validate JWT token',
      tags: ['Auth'],
      headers: {
        type: 'object',
        properties: {
          authorization: { type: 'string' },
        },
        required: ['authorization'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                valid: { type: 'boolean' },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    email: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, authController.validateToken);

  fastify.post('/forgot-password', {
    config: { rateLimit: { max: 5, timeWindow: 60000 } },
    schema: {
      description: 'Request password reset email',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
    },
  }, authController.forgotPassword);

  fastify.post('/reset-password', {
    config: { rateLimit: { max: 5, timeWindow: 60000 } },
    schema: {
      description: 'Reset password with token',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string' },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
  }, authController.resetPassword);

  fastify.post('/verify-email', {
    schema: {
      description: 'Verify email with token',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' },
        },
      },
    },
  }, authController.verifyEmail);
}

authRoutes.autoPrefix = '/auth';
export default authRoutes;