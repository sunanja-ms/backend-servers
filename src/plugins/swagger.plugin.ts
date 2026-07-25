import { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import env from '../config/env.js';

export default async function swaggerPlugin(fastify: FastifyInstance): Promise<void> {
  const isDevelopment = env.NODE_ENV !== 'production';
  
  // Always register Swagger in development, optional in production
  if (!isDevelopment) {
    // In production, only register if explicitly enabled
    if (process.env.ENABLE_SWAGGER !== 'true') {
      return;
    }
  }

  // Register Swagger/OpenAPI
  await fastify.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Fastify Backend API',
        description: `
# 🚀 Fastify Backend API Documentation

## Overview
Production-ready REST API built with Fastify, Drizzle ORM, and PostgreSQL.

## Features
- 🔐 **JWT Authentication** - Secure token-based authentication
- 👤 **User Management** - Full CRUD operations for users
- 📦 **Product Management** - Complete product lifecycle management
- 🛡️ **Role-Based Access** - Admin, Moderator, and User roles
- 📊 **Rate Limiting** - DDoS protection (100 req/min)
- 📝 **Swagger/OpenAPI** - Interactive API documentation
- 🔒 **Security Headers** - Helmet.js integration
- 📈 **Structured Logging** - Pino integration

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

## Testing
### cURL Examples
\`\`\`bash
# Register user
curl -X POST http://localhost:3000/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@example.com","password":"password123"}'

# Get profile (with token)
curl -X GET http://localhost:3000/api/v1/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
        `,
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
          url: 'https://example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
        termsOfService: 'https://example.com/terms',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: 'Development Server',
          variables: {
            port: {
              default: env.PORT,
              description: 'Server port',
            },
          },
        },
        {
          url: 'https://api.example.com',
          description: 'Production Server',
        },
        {
          url: 'https://staging-api.example.com',
          description: 'Staging Server',
        },
      ],
      tags: [
        {
          name: 'Health',
          description: 'Health check and monitoring endpoints',
          externalDocs: {
            description: 'Health monitoring guide',
            url: 'https://example.com/health-guide',
          },
        },
        {
          name: 'Auth',
          description: 'Authentication endpoints - Register, Login, Profile',
          externalDocs: {
            description: 'Authentication guide',
            url: 'https://example.com/auth-guide',
          },
        },
        {
          name: 'Users',
          description: 'User management endpoints - CRUD operations',
          externalDocs: {
            description: 'User management guide',
            url: 'https://example.com/users-guide',
          },
        },
        {
          name: 'Products',
          description: 'Product management endpoints - CRUD operations',
          externalDocs: {
            description: 'Product management guide',
            url: 'https://example.com/products-guide',
          },
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
          // === Common Response Schemas ===
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
          
          // === User Schemas ===
          User: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              email: { type: 'string', format: 'email', example: 'user@example.com' },
              name: { type: 'string', example: 'John Doe' },
              role: { 
                type: 'string', 
                enum: ['admin', 'moderator', 'user'],
                example: 'user' 
              },
              isActive: { type: 'boolean', example: true },
              lastLoginAt: { 
                type: 'string', 
                format: 'date-time',
                example: '2026-07-22T15:26:09.998Z',
                nullable: true 
              },
              createdAt: { 
                type: 'string', 
                format: 'date-time',
                example: '2026-07-22T15:26:09.998Z' 
              },
              updatedAt: { 
                type: 'string', 
                format: 'date-time',
                example: '2026-07-22T15:26:09.998Z' 
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
          
          // === Auth Schemas ===
          RegisterRequest: {
            type: 'object',
            required: ['email', 'password', 'name'],
            properties: {
              email: { 
                type: 'string', 
                format: 'email', 
                example: 'user@example.com',
                description: 'User email address (unique)',
              },
              password: { 
                type: 'string', 
                minLength: 6, 
                example: 'password123',
                description: 'Password (minimum 6 characters)',
              },
              name: { 
                type: 'string', 
                minLength: 2, 
                example: 'John Doe',
                description: 'User full name',
              },
            },
          },
          LoginRequest: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { 
                type: 'string', 
                format: 'email', 
                example: 'user@example.com',
                description: 'User email address',
              },
              password: { 
                type: 'string', 
                example: 'password123',
                description: 'User password',
              },
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
                      token: { 
                        type: 'string', 
                        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        description: 'JWT access token (valid for 7 days)',
                      },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            ],
          },
          ValidateTokenResponse: {
            type: 'object',
            allOf: [
              { $ref: '#/components/schemas/SuccessResponse' },
              {
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean', example: true },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'number', example: 1 },
                          email: { type: 'string', example: 'user@example.com' },
                          name: { type: 'string', example: 'John Doe' },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
          
          // === Product Schemas ===
          Product: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'Laptop Pro' },
              description: { 
                type: 'string', 
                example: 'High-end laptop with 16GB RAM',
                nullable: true 
              },
              price: { 
                type: 'number', 
                format: 'decimal',
                example: 15000000,
                description: 'Price in IDR',
              },
              stock: { type: 'number', example: 10 },
              userId: { type: 'number', example: 1 },
              isActive: { type: 'boolean', example: true },
              createdAt: { 
                type: 'string', 
                format: 'date-time',
                example: '2026-07-22T15:26:09.998Z' 
              },
              updatedAt: { 
                type: 'string', 
                format: 'date-time',
                example: '2026-07-22T15:26:09.998Z' 
              },
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
              name: { 
                type: 'string', 
                minLength: 1, 
                example: 'Laptop Pro',
                description: 'Product name',
              },
              description: { 
                type: 'string', 
                example: 'High-end laptop with 16GB RAM',
                description: 'Product description (optional)',
              },
              price: { 
                type: 'number', 
                minimum: 0, 
                example: 15000000,
                description: 'Product price in IDR',
              },
              stock: { 
                type: 'number', 
                minimum: 0, 
                default: 0, 
                example: 10,
                description: 'Available stock quantity',
              },
            },
          },
          UpdateProductRequest: {
            type: 'object',
            properties: {
              name: { 
                type: 'string', 
                minLength: 1, 
                example: 'Laptop Pro Max',
                description: 'Product name (optional)',
              },
              description: { 
                type: 'string', 
                example: 'Updated description',
                description: 'Product description (optional)',
              },
              price: { 
                type: 'number', 
                minimum: 0, 
                example: 18000000,
                description: 'Product price (optional)',
              },
              stock: { 
                type: 'number', 
                minimum: 0, 
                example: 15,
                description: 'Stock quantity (optional)',
              },
              isActive: { 
                type: 'boolean', 
                example: true,
                description: 'Active status (optional)',
              },
            },
          },
          UpdateStockRequest: {
            type: 'object',
            required: ['quantity'],
            properties: {
              quantity: { 
                type: 'number', 
                minimum: 0, 
                example: 5,
                description: 'Quantity to add (positive) or remove (negative)',
              },
            },
          },
          ToggleStatusRequest: {
            type: 'object',
            required: ['isActive'],
            properties: {
              isActive: { 
                type: 'boolean', 
                example: false,
                description: 'Set product active/inactive status',
              },
            },
          },
          
          // === Update Schemas ===
          UpdateUserRequest: {
            type: 'object',
            properties: {
              name: { 
                type: 'string', 
                minLength: 2, 
                example: 'Jane Doe',
                description: 'User full name (optional)',
              },
              email: { 
                type: 'string', 
                format: 'email', 
                example: 'jane@example.com',
                description: 'User email (optional)',
              },
            },
          },
          UpdatePasswordRequest: {
            type: 'object',
            required: ['currentPassword', 'newPassword'],
            properties: {
              currentPassword: { 
                type: 'string', 
                minLength: 6, 
                example: 'oldpassword123',
                description: 'Current password',
              },
              newPassword: { 
                type: 'string', 
                minLength: 6, 
                example: 'newpassword123',
                description: 'New password (minimum 6 characters)',
              },
            },
          },
          ToggleUserStatusRequest: {
            type: 'object',
            required: ['isActive'],
            properties: {
              isActive: { 
                type: 'boolean', 
                example: false,
                description: 'Set user active/inactive status',
              },
            },
          },
          
          // === Health Schemas ===
          HealthResponse: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              timestamp: { 
                type: 'string', 
                format: 'date-time',
                example: '2026-07-22T15:26:09.998Z' 
              },
              uptime: { type: 'number', example: 123.45 },
              environment: { type: 'string', example: 'development' },
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'connected' },
                  totalCount: { type: 'number', example: 10 },
                  idleCount: { type: 'number', example: 5 },
                  waitingCount: { type: 'number', example: 0 },
                },
              },
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
                example: {
                  success: false,
                  error: 'Unauthorized',
                  message: 'Invalid or expired token',
                  statusCode: 401,
                },
              },
            },
          },
          Forbidden: {
            description: 'Forbidden - Insufficient permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error: 'Forbidden',
                  message: 'Insufficient permissions',
                  statusCode: 403,
                },
              },
            },
          },
          NotFound: {
            description: 'Not Found - Resource does not exist',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error: 'Not Found',
                  message: 'Resource not found',
                  statusCode: 404,
                },
              },
            },
          },
          ValidationError: {
            description: 'Validation Error - Invalid input data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error: 'Validation Error',
                  message: 'Invalid request data',
                  statusCode: 400,
                  details: [
                    {
                      field: 'email',
                      message: 'Invalid email format',
                      code: 'invalid_string',
                    },
                  ],
                },
              },
            },
          },
          RateLimitExceeded: {
            description: 'Too Many Requests - Rate limit exceeded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: {
                  success: false,
                  error: 'Too Many Requests',
                  message: 'Rate limit exceeded. Please try again later.',
                  statusCode: 429,
                },
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
      externalDocs: {
        description: 'Find more info here',
        url: 'https://example.com/api-docs',
      },
    },
  });

  // Register Swagger UI
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
      title: '🚀 Fastify API Documentation',
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
            .swagger-ui .info .title small {
              background-color: #4a5568;
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

  // Log Swagger registration
  fastify.log.info('📚 Swagger documentation available at /docs');
}