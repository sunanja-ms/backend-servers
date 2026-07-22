import fastifySensible from '@fastify/sensible';
import { FastifyInstance } from 'fastify';

export default async function sensiblePlugin(fastify: FastifyInstance): Promise<void> {
  fastify.register(fastifySensible);
}