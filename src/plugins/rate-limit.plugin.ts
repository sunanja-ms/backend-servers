import fastifyRateLimit from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';
import env from '../config/env.js';

export default async function rateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyRateLimit, {
    max: parseInt(env.RATE_LIMIT_MAX, 10),
    timeWindow: parseInt(env.RATE_LIMIT_WINDOW, 10),
    keyGenerator: (req) => req.ip || 'unknown',
    allowList: (req) => req.url === '/health' || req.url === '/health/',
  });
}