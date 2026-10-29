import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import env from '../config/env.js';

export default async function corsPlugin(fastify: FastifyInstance): Promise<void> {
  const origins = env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);
  const hasWildcard = origins.includes('*');
  const allowList = origins.filter(o => o !== '*');

  await fastify.register(fastifyCors, {
    // Never reflect the caller origin while allowing credentials: that lets any site
    // read authenticated responses. Wildcard mode is credential-less by design.
    origin: hasWildcard || allowList.length === 0 ? '*' : allowList,
    credentials: !hasWildcard && allowList.length > 0,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-API-Key'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
  });
}