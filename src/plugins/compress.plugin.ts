import fastifyCompress from '@fastify/compress';
import { FastifyInstance } from 'fastify';
import env from '../config/env.js';

export default async function compressPlugin(fastify: FastifyInstance): Promise<void> {
  const isProduction = env.NODE_ENV === 'production';
  
  fastify.register(fastifyCompress, {
    global: isProduction,
    threshold: 1024,
    encodings: ['gzip', 'deflate'],
  });
}