import { buildServer } from './app.js';
import { testConnection } from './config/db.connection.js';
import logger from './utils/logger.js';
import env from './config/env.js';

async function startServer() {
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    const fastify = await buildServer();
    server = fastify;

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

let server: Awaited<ReturnType<typeof buildServer>> | null = null;

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  if (server) await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  if (server) await server.close();
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
