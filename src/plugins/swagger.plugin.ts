import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import env from '../config/env.js';

export default async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
  const isProduction = env.NODE_ENV === 'production';

  if (isProduction && process.env.ENABLE_SWAGGER !== 'true') {
    return;
  }

  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Fastify Backend API',
        description: `
# Fastify Backend API Documentation

## Overview
Production-ready REST API built with Fastify, Drizzle ORM, and PostgreSQL.

## Features
- JWT Authentication - Secure token-based authentication
- User Management - Full CRUD operations for users
- Product Management - Complete product lifecycle management
- Role-Based Access - Admin, Moderator, and User roles
- Rate Limiting - DDoS protection (100 req/min)
- Swagger/OpenAPI - Interactive API documentation
- Security Headers - Helmet.js integration
- Structured Logging - Pino integration

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Roles & Permissions
| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all resources |
| **Moderator** | Manage products, view users |
| **User** | Manage own profile and products |

## Rate Limiting
- Default: 100 requests per minute
- Health check endpoint excluded
- Returns 429 status code when limit exceeded

## Response Format
All responses follow a consistent format:

\`\`\`json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
\`\`\`

## Error Response
\`\`\`json
{
  "success": false,
  "error": "Error Type",
  "message": "Error description",
  "statusCode": 400,
  "details": [ ... ]
}
\`\`\`
        `,
        version: '1.0.0',
        contact: {
          name: 'API Support',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development Server',
        },
      ],
      tags: [
        {
          name: 'Health',
          description: 'Health check and monitoring endpoints',
        },
        {
          name: 'Auth',
          description: 'Authentication endpoints - Register, Login, Profile',
        },
        {
          name: 'Users',
          description: 'User management endpoints - CRUD operations',
        },
        {
          name: 'Products',
          description: 'Product management endpoints - CRUD operations',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT token in the format: Bearer <token>',
          },
        },
        schemas: {
          SuccessResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string', example: 'Operation successful' },
            },
          },
          ErrorResponse: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: { type: 'string', example: 'Validation Error' },
              message: { type: 'string', example: 'Invalid request data' },
              statusCode: { type: 'number', example: 400 },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string', example: 'email' },
                    message: { type: 'string', example: 'Invalid email format' },
                    code: { type: 'string', example: 'invalid_string' },
                  },
                },
              },
            },
          },
          User: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              email: { type: 'string', format: 'email', example: 'user@example.com' },
              name: { type: 'string', example: 'John Doe' },
              role: {
                type: 'string',
                enum: ['admin', 'moderator', 'user'],
                example: 'user',
              },
              isActive: { type: 'boolean', example: true },
              lastLoginAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
              },
            },
          },
          UserResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/SuccessResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            ],
          },
          UsersResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/SuccessResponse' },
              {
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            ],
          },
          RegisterRequest: {
            type: 'object',
            required: ['email', 'password', 'name'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 6 },
              name: { type: 'string', minLength: 2 },
            },
          },
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' },
            },
          },
          LoginResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/SuccessResponse' },
              {
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            ],
          },
          Product: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Laptop Pro' },
              description: { type: 'string', nullable: true },
              price: { type: 'number', format: 'decimal' },
              stock: { type: 'number', example: 10 },
              userId: { type: 'number', example: 1 },
              isActive: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          ProductResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/SuccessResponse' },
              {
                properties: {
                  data: { $ref: '#/components/schemas/Product' },
                },
              },
            ],
          },
          ProductsResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/SuccessResponse' },
              {
                properties: {
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            ],
          },
          CreateProductRequest: {
            type: 'object',
            required: ['name', 'price'],
            properties: {
              name: { type: 'string', minLength: 1 },
              description: { type: 'string' },
              price: { type: 'number', minimum: 0 },
              stock: { type: 'number', minimum: 0, default: 0 },
            },
          },
          UpdateProductRequest: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 1 },
              description: { type: 'string' },
              price: { type: 'number', minimum: 0 },
              stock: { type: 'number', minimum: 0 },
              isActive: { type: 'boolean' },
            },
          },
          UpdateStockRequest: {
            type: 'object',
            required: ['quantity'],
            properties: {
              quantity: { type: 'number', minimum: 1 },
            },
          },
          ToggleStatusRequest: {
            type: 'object',
            required: ['isActive'],
            properties: {
              isActive: { type: 'boolean' },
            },
          },
          UpdateUserRequest: {
            type: 'object',
            properties: {
              name: { type: 'string', minLength: 2 },
              email: { type: 'string', format: 'email' },
            },
          },
          UpdatePasswordRequest: {
            type: 'object',
            required: ['currentPassword', 'newPassword'],
            properties: {
              currentPassword: { type: 'string', minLength: 6 },
              newPassword: { type: 'string', minLength: 6 },
            },
          },
          HealthResponse: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
            },
          },
        },
        parameters: {
          idParam: {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'number' },
            description: 'Resource ID',
          },
        },
        responses: {
          Unauthorized: {
            description: 'Unauthorized - Invalid or missing token',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          Forbidden: {
            description: 'Forbidden - Insufficient permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          NotFound: {
            description: 'Not Found - Resource does not exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          ValidationError: {
            description: 'Validation Error - Invalid input data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
  });

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
    staticCSP: true,
    transformStaticCSP: (header) => header,
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
      displayOperationId: true,
      displayRequestDuration: true,
      filter: true,
      maxDisplayedTags: 10,
      showExtensions: true,
      showCommonExtensions: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      syntaxHighlight: {
        activate: true,
        theme: 'agate',
      },
      tryItOutEnabled: true,
      withCredentials: true,
    },
    theme: {
      title: 'Fastify API Documentation',
      css: [
        {
          filename: 'theme.css',
          content: `
            .swagger-ui .topbar {
              background-color: #1a202c;
            }
            .swagger-ui .topbar .download-url-wrapper .select-label {
              color: #ffffff;
            }
            .swagger-ui .info .title {
              color: #2d3748;
            }
            .swagger-ui .scheme-container {
              background-color: #f7fafc;
            }
            .swagger-ui .btn.authorize {
              border-color: #4a5568;
              color: #4a5568;
            }
            .swagger-ui .btn.authorize svg {
              fill: #4a5568;
            }
          `,
        },
      ],
    },
  });

  fastify.log.info('Swagger documentation available at /docs');
}
