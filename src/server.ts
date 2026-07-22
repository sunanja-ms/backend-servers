import Fastify from 'fastify';
import autoload from '@fastify/autoload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { registerPlugins } from './config/plugin.register.js';
import { testConnection, closeConnection } from './config/db.connection.js';
import { setupErrorHandler } from './middlewares/error.middlewware.js';
import logger from './utils/logger.js';
import env from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function buildServer() {
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
    bodyLimit: 10485760, // 10MB
  });

  // Setup error handler
  setupErrorHandler(fastify);

  // Register all plugins
  await registerPlugins(fastify);

  // Register health routes
  await fastify.register(autoload, {
    dir: join(__dirname, 'utils'),
    options: { prefix: '/' },
    maxDepth: 1,
    ignorePattern: /^.*\.(test|spec)\.ts$/,
  });

  // Register v1 routes
  await fastify.register(autoload, {
    dir: join(__dirname, 'routes', 'v1'),
    options: { prefix: '/api/v1' },
    maxDepth: 1,
    ignorePattern: /^.*\.(test|spec)\.ts$/,
  });

  // Shutdown hook
  fastify.addHook('onClose', async () => {
    await closeConnection();
    logger.info('Server shutting down...');
  });

  return fastify;
}

async function startServer() {
  try {
    // Test database connection
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const fastify = await buildServer();

    // Start server
    await fastify.listen({
      port: parseInt(env.PORT, 10),
      host: env.HOST,
    });

    const address = fastify.server.address();
    const port = typeof address === 'string' ? address : address?.port;
    const host = typeof address === 'string' ? address : address?.address;

    logger.info(`🚀 Server running at http://${host || 'localhost'}:${port}`);
    logger.info(`📚 API Documentation at http://${host || 'localhost'}:${port}/docs`);
    logger.info(`🖥️  Environment: ${env.NODE_ENV}`);
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  logger.error({ err: error }, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  process.exit(1);
});

startServer();