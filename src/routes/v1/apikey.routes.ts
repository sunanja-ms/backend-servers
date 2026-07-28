import { FastifyInstance } from 'fastify';
import { ApiKeyController } from '../../controllers/apikey.controller.js';
import { ApiKeyService } from '../../services/apikey.service.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

async function apikeyRoutes(fastify: FastifyInstance): Promise<void> {
  const apiKeyService = new ApiKeyService();
  const apiKeyController = new ApiKeyController(apiKeyService);

  fastify.post('/', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Create a new API key',
      tags: ['API Keys'],
      security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
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
                name: { type: 'string' },
                prefix: { type: 'string' },
                key: { type: 'string', description: 'Full API key — shown only once' },
                expiresAt: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, apiKeyController.create);

  fastify.get('/', {
    preHandler: [authMiddleware],
    schema: {
      description: 'List your API keys',
      tags: ['API Keys'],
      security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
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
                  id: { type: 'number' },
                  name: { type: 'string' },
                  prefix: { type: 'string' },
                  expiresAt: { type: 'string' },
                  lastUsedAt: { type: ['string', 'null'] },
                  createdAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, apiKeyController.list);

  fastify.delete('/:id', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Revoke an API key',
      tags: ['API Keys'],
      security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'number' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, apiKeyController.revoke);
}

apikeyRoutes.autoPrefix = '/api-keys';
export default apikeyRoutes;
