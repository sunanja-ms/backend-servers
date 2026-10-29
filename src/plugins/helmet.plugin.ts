import fastifyHelmet from '@fastify/helmet';
import { FastifyInstance } from 'fastify';
import env from '../config/env.js';

export default async function helmetPlugin(fastify: FastifyInstance): Promise<void> {
  const isProduction = env.NODE_ENV === 'production';
  
  await fastify.register(fastifyHelmet, {
    global: true,
    contentSecurityPolicy: isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'", "'sha256-6yHtHWe/3wJQEdz/FRNRnmNfn6Q4X82MugfsE/b1ZzE='"],
      },
    } : false,
  });
}