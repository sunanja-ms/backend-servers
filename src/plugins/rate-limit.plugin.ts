import fastifyRateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import env from '../config/env.js';

export default async function rateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  const max = parseInt(env.RATE_LIMIT_MAX, 10);
  const timeWindow = parseInt(env.RATE_LIMIT_WINDOW, 10);

  await fastify.register(fastifyRateLimit, {
    max,
    timeWindow,
    keyGenerator: (req) => req.ip || 'unknown',
    allowList: (req) =>
      req.url === '/health' ||
      req.url === '/health/' ||
      req.url === '/docs' ||
      req.url.startsWith('/docs/') ||
      req.url.startsWith('/swagger'),
    addHeadersOnExceeding: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });
}
