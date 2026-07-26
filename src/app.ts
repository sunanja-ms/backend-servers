import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerPlugins } from './config/plugin.register.js';
import { closeConnection } from './config/db.connection.js';
import { setupErrorHandler } from './middlewares/error.middleware.js';
import logger from './utils/logger.js';
import env from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV !== 'production'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: true,
              },
            }
          : undefined,
    },
    trustProxy: env.NODE_ENV === 'production',
    caseSensitive: true,
    ignoreTrailingSlash: true,
    maxParamLength: 5000,
    bodyLimit: 10485760,
  });

  setupErrorHandler(fastify);

  await registerPlugins(fastify);

  await fastify.register(autoload, {
    dir: join(__dirname, 'utils'),
    options: { prefix: '/' },
    maxDepth: 1,
    ignorePattern: /^.*\.(test|spec)\.ts$|^logger\.ts$|^validator\.ts$/,
  });

  await fastify.register(autoload, {
    dir: join(__dirname, 'routes', 'v1'),
    options: { prefix: '/api/v1' },
    maxDepth: 1,
    ignorePattern: /^.*\.(test|spec)\.ts$/,
  });

  fastify.addHook('onClose', async () => {
    await closeConnection();
    logger.info('Server shutting down...');
  });

  return fastify;
}
