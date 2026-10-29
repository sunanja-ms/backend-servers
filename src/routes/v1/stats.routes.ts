import { StatsService } from '../../services/stats.service.js';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.js';
import { FastifyInstance } from 'fastify';

async function statsRoutes(fastify: FastifyInstance): Promise<void> {
  const statsService = new StatsService();

  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/overview', {
    preHandler: [requireRole(['admin', 'moderator'])],
    schema: {
      description: 'Dashboard totals, 14-day order series and low-stock count',
      tags: ['Stats'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          threshold: { type: 'number', minimum: 0, maximum: 1000, default: 10 },
        },
      },
    },
  }, async (request, reply) => {
    const { threshold } = request.query as { threshold?: number };
    const data = await statsService.overview(threshold);
    reply.send({ success: true, data });
  });
}

statsRoutes.autoPrefix = '/stats';
export default statsRoutes;
