import { FastifyInstance } from 'fastify'
import multipart from '@fastify/multipart'

export default async function (fastify: FastifyInstance) {
  await fastify.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  })
}
