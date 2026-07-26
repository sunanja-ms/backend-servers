import FastifyStatic from '@fastify/static';
import { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticRoot = join(__dirname, '..', '..', 'public', 'dist');

export default async function staticPlugin(fastify: FastifyInstance): Promise<void> {
  if (!existsSync(staticRoot)) {
    fastify.log.warn('Static directory not found, skipping static file serving');
    return;
  }

  await fastify.register(FastifyStatic, {
    root: staticRoot,
    prefix: '/',
    decorateReply: false,
    wildcard: false,
  });

  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith('/api') || request.url.startsWith('/docs')) {
      reply.code(404).send({
        success: false,
        error: 'Not Found',
        message: `Route ${request.method} ${request.url} not found`,
        statusCode: 404,
      });
    } else {
      reply.sendFile('index.html');
    }
  });
}
