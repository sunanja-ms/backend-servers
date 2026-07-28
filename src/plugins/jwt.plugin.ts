import fastifyJwt from '@fastify/jwt';
import { FastifyInstance } from 'fastify';
import env from '../config/env.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: number;
      email: string;
      name: string;
      role: string;
    };
  }
}

export default async function jwtPlugin(fastify: FastifyInstance): Promise<void> {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
      algorithm: 'HS256',
    },
    verify: {
      algorithms: ['HS256'],
    },
  });
}
