import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiKeyService } from '../services/apikey.service.js';
import { createApiKeySchema } from '../schemas/apikey.schema.js';
import { idSchema } from '../utils/validator.js';
import type { AuthRequest } from '../types/index.js';

export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = createApiKeySchema.parse(request.body);
    const userId = (request as AuthRequest).user.id;
    const result = await this.apiKeyService.create(userId, data);

    reply.status(201).send({
      success: true,
      message: 'API key created. Save the key — it will not be shown again.',
      data: {
        ...result.apiKey,
        key: result.rawKey,
      },
    });
  };

  list = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const keys = await this.apiKeyService.list(userId);

    reply.send({
      success: true,
      data: keys,
    });
  };

  revoke = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const { id } = idSchema.parse({ id: (request.params as { id: string }).id });
    await this.apiKeyService.revoke(id, userId);

    reply.send({
      success: true,
      message: 'API key revoked successfully',
    });
  };
}
