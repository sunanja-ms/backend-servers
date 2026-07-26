import { FastifyInstance } from 'fastify';
import { pool } from '../config/db.connection.js';

export default async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', {
    schema: {
      description: 'Health check endpoint',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
            environment: { type: 'string' },
            database: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                totalCount: { type: 'number' },
                idleCount: { type: 'number' },
                waitingCount: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    let dbStatus = 'connected';
    let poolStats = {};

    try {
      const client = await pool.connect();
      client.release();
      poolStats = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      };
    } catch (error) {
      dbStatus = 'disconnected';
    }

    reply.send({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus,
        ...poolStats,
      },
    });
  });
}