import FastifyStatic from '@fastify/static';
import { FastifyInstance } from 'fastify';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticRoot = join(__dirname, '..', '..', 'public', 'dist');
const productImagesRoot = join(__dirname, '..', '..', 'storage', 'products');

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

  // Hashed asset names change on every build, so they must be resolved at request time
  // instead of the boot-time glob above. SPA fallback stays on the root registration.
  const assetsRoot = join(staticRoot, 'assets');
  if (existsSync(assetsRoot)) {
    await fastify.register(FastifyStatic, {
      root: assetsRoot,
      prefix: '/assets/',
      decorateReply: false,
    });
  }

  // Avatars are public: they appear in the navbar for any logged-in viewer.
  const avatarsRoot = join(__dirname, '..', '..', 'storage', 'avatars');
  if (existsSync(avatarsRoot)) {
    await fastify.register(FastifyStatic, {
      root: avatarsRoot,
      prefix: '/storage/avatars/',
      decorateReply: false,
    });
  }

  // Only public product images are served; payment proofs go through GET /api/v1/orders/:id/proof.
  // wildcard: true — uploaded files appear after startup, so routes cannot be pre-registered.
  if (existsSync(productImagesRoot)) {
    await fastify.register(FastifyStatic, {
      root: productImagesRoot,
      prefix: '/storage/products/',
      decorateReply: false,
      setHeaders: (res) => {
        res.header('X-Content-Type-Options', 'nosniff');
        res.header('Content-Security-Policy', "default-src 'none'; img-src 'self'");
      },
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
