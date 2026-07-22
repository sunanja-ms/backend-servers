import fastifyCors from '@fastify/cors';
import { FastifyInstance } from 'fastify';
import env from '../config/env.js';

export default async function corsPlugin(fastify: FastifyInstance): Promise<void> {
  const origins = env.CORS_ORIGIN.split(',').filter(Boolean);
  
  fastify.register(fastifyCors, {
    origin: origins.length > 0 ? origins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
  });
}