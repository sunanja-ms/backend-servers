import { FastifyInstance } from 'fastify';
import { ProductController } from '../../controllers/product.controller.js';
import { ProductService } from '../../services/product.service.js';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.js';

async function productRoutes(fastify: FastifyInstance): Promise<void> {
  const productService = new ProductService();
  const productController = new ProductController(productService);

  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', {
    schema: {
      description: 'Get all products (paginated)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', minimum: 1, default: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          sortBy: { type: 'string', enum: ['name', 'price', 'stock', 'createdAt', 'updatedAt'] },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
          search: { type: 'string' },
          isActive: { type: 'string', enum: ['true', 'false'] },
          categoryId: { type: 'number' },
          includeDeleted: { type: 'boolean', default: false },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  price: { type: 'string' },
                  stock: { type: 'number' },
                  userId: { type: 'number' },
                  isActive: { type: 'boolean' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, productController.getAll);

  fastify.get('/:id', {
    schema: {
      description: 'Get product by ID',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'string' },
                stock: { type: 'number' },
                userId: { type: 'number' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, productController.getById);

  fastify.post('/', {
    schema: {
      description: 'Create a new product',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          stock: { type: 'number', minimum: 0, default: 0 },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'string' },
                stock: { type: 'number' },
                userId: { type: 'number' },
                isActive: { type: 'boolean' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, productController.create);

  fastify.put('/:id', {
    schema: {
      description: 'Update product (owner or admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          stock: { type: 'number', minimum: 0 },
          isActive: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'string' },
                stock: { type: 'number' },
                userId: { type: 'number' },
                isActive: { type: 'boolean' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, productController.update);

  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [requireRole(['admin'])],
    schema: {
      description: 'Delete product (Admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
    },
  }, productController.delete);

  fastify.patch('/:id/stock', {
    schema: {
      description: 'Update product stock (owner or admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        required: ['quantity'],
        properties: {
          quantity: { type: 'number', minimum: 1 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
                stock: { type: 'number' },
                updatedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, productController.updateStock);

  fastify.patch<{ Params: { id: string } }>('/:id/restore', {
    preHandler: [requireRole(['admin'])],
    schema: {
      description: 'Restore soft-deleted product (Admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'number' } },
        required: ['id'],
      },
    },
  }, productController.restore);

  fastify.post<{ Params: { id: string } }>('/:id/images', {
    schema: {
      description: 'Upload product image',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { id: { type: 'number' } }, required: ['id'] },
    },
  }, productController.uploadImage);

  fastify.delete<{ Params: { id: string; imageId: string } }>('/:id/images/:imageId', {
    schema: {
      description: 'Delete product image',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: { id: { type: 'number' }, imageId: { type: 'number' } },
        required: ['id', 'imageId'],
      },
    },
  }, productController.deleteImage);

  fastify.patch<{ Params: { id: string }; Body: { isActive: boolean } }>('/:id/toggle-status', {
    preHandler: [requireRole(['admin'])],
    schema: {
      description: 'Toggle product status (Admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'number' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        required: ['isActive'],
        properties: {
          isActive: { type: 'boolean' },
        },
      },
    },
  }, productController.toggleStatus);
}

productRoutes.autoPrefix = '/products';
export default productRoutes;
