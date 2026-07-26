import { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../types/errors.js';
import { ErrorResponse } from '../types/index.js';
import logger from '../utils/logger.js';
import env from '../config/env.js';

export function setupErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler((error: any, request, reply) => {
    const statusCode = error?.statusCode || 500;

    logger.error({
      error: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
      statusCode,
      ip: request.ip,
    });

    if (error instanceof AppError) {
      const response: ErrorResponse = {
        success: false,
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
      };
      if (error.details) {
        response.details = error.details;
      }
      return reply.status(error.statusCode).send(response);
    }

    if (error instanceof ZodError) {
      const response: ErrorResponse = {
        success: false,
        error: 'Validation Error',
        message: 'Invalid request data',
        statusCode: 400,
        details: error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      };
      return reply.status(400).send(response);
    }

    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Authorization header is required',
        statusCode: 401,
      } as ErrorResponse);
    }

    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Token has expired',
        statusCode: 401,
      } as ErrorResponse);
    }

    if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
      return reply.status(401).send({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid token',
        statusCode: 401,
      } as ErrorResponse);
    }

    if (error.code === 'FST_RATE_LIMIT') {
      return reply.status(429).send({
        success: false,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        statusCode: 429,
      } as ErrorResponse);
    }

    const isProduction = env.NODE_ENV === 'production';
    return reply.status(statusCode).send({
      success: false,
      error: error?.name || 'Internal Server Error',
      message: isProduction ? 'Something went wrong' : error?.message,
      statusCode,
      ...(isProduction ? {} : { stack: error?.stack }),
    } as ErrorResponse);
  });
}
