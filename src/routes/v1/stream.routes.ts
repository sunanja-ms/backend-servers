import { FastifyInstance } from 'fastify';
import { createReadStream, existsSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const HLS_ROOT = join(__dirname, '..', '..', '..', 'src', 'storage', 'hls');
const ALLOWED_RESOLUTIONS = ['1440p', '1080p', '720p', '480p', '360p', '240p'];

const MIME_TYPES: Record<string, string> = {
  '.m3u8': 'application/vnd.apple.mpegurl',
  '.ts': 'video/mp2t',
  '.mp4': 'video/mp4',
};

function getMimeType(filename: string): string {
  const ext = extname(filename).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function streamRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/:resolution/:file', {
    schema: {
      description: 'Stream HLS video segment or playlist',
      tags: ['Stream'],
      security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
      params: {
        type: 'object',
        required: ['resolution', 'file'],
        properties: {
          resolution: { type: 'string' },
          file: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    const { resolution, file } = request.params as { resolution: string; file: string };

    if (!ALLOWED_RESOLUTIONS.includes(resolution)) {
      return reply.code(404).send({
        success: false,
        error: 'Not Found',
        message: `Resolution '${resolution}' not found. Available: ${ALLOWED_RESOLUTIONS.join(', ')}`,
        statusCode: 404,
      });
    }

    if (file.includes('..') || file.includes('/') || file.includes('\\')) {
      return reply.code(400).send({
        success: false,
        error: 'Bad Request',
        message: 'Invalid filename',
        statusCode: 400,
      });
    }

    const filePath = join(HLS_ROOT, resolution, file);

    if (!existsSync(filePath)) {
      return reply.code(404).send({
        success: false,
        error: 'Not Found',
        message: 'File not found',
        statusCode: 404,
      });
    }

    const stat = statSync(filePath);
    const mimeType = getMimeType(file);

    reply.header('Content-Type', mimeType);
    reply.header('Content-Length', stat.size);
    reply.header('Cache-Control', 'public, max-age=3600');
    reply.header('Access-Control-Allow-Origin', '*');

    return reply.send(createReadStream(filePath));
  });

  fastify.get('/master.m3u8', {
    schema: {
      description: 'Get master HLS playlist',
      tags: ['Stream'],
      security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    },
  }, async (request, reply) => {
    const filePath = join(HLS_ROOT, 'master.m3u8');

    if (!existsSync(filePath)) {
      return reply.code(404).send({
        success: false,
        error: 'Not Found',
        message: 'Master playlist not found',
        statusCode: 404,
      });
    }

    const stat = statSync(filePath);
    reply.header('Content-Type', 'application/vnd.apple.mpegurl');
    reply.header('Content-Length', stat.size);
    reply.header('Cache-Control', 'no-cache');

    return reply.send(createReadStream(filePath));
  });
}

streamRoutes.autoPrefix = '/stream';
export default streamRoutes;
