import FastifyStatic from '@fastify/static';
import { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticRoot = join(__dirname, '..', '..', 'public', 'dist');
const storageRoot = join(__dirname, '..', '..', 'storage');

export default async function staticPlugin(fastify: FastifyInstance): Promise<void> {
  if (existsSync(staticRoot)) {
    await fastify.register(FastifyStatic, {
      root: staticRoot,
      prefix: '/',
      decorateReply: true,
      wildcard: false,
    });
  } else {
    fastify.log.warn('Static directory not found, skipping SPA serving');
  }

  if (existsSync(storageRoot)) {
    await fastify.register(FastifyStatic, {
      root: storageRoot,
      prefix: '/storage/',
      decorateReply: false,
      wildcard: false,
    });
  }

  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api') || request.url.startsWith('/docs')) {
      reply.code(404).send({
        success: false,
        error: 'Not Found',
        message: `Route ${request.method} ${request.url} not found`,
        statusCode: 404,
      });
    } else if (existsSync(staticRoot)) {
      reply.sendFile('index.html');
    } else {
      reply.code(404).send({ success: false, error: 'Not Found' });
    }
  });
}
