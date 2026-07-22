import { FastifyInstance } from 'fastify';
import autoload from '@fastify/autoload';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function registerPlugins(fastify: FastifyInstance): Promise<void> {
  try {
    // Auto-load all plugins from plugins directory
    await fastify.register(autoload, {
      dir: join(__dirname, '..', 'plugins'),
      dirNameRoutePrefix: false,
      ignorePattern: /^.*\.(test|spec)\.ts$/,
      maxDepth: 1,
    });

    logger.info('✅ All plugins registered successfully');
  } catch (error) {
        logger.error({ err: error }, 'Unexpected error occurred while registering plugins');

    throw error;
  }
}