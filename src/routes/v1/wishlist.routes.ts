import { FastifyInstance } from 'fastify';
import { WishlistController } from '../../controllers/wishlist.controller.js';
import { WishlistService } from '../../services/wishlist.service.js';
import { ProductService } from '../../services/product.service.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

async function wishlistRoutes(fastify: FastifyInstance): Promise<void> {
  const wishlistController = new WishlistController(new WishlistService(), new ProductService());

  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', {
    schema: {
      description: 'List wishlist products for the current user',
      tags: ['Wishlist'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
  }, wishlistController.getAll);

  fastify.get('/ids', {
    schema: {
      description: 'List wishlisted product IDs for the current user',
      tags: ['Wishlist'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
          },
        },
      },
    },
  }, wishlistController.getIds);

  fastify.post<{ Params: { productId: string } }>('/:productId', {
    schema: {
      description: 'Add a product to the wishlist',
      tags: ['Wishlist'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { productId: { type: 'number' } }, required: ['productId'] },
    },
  }, wishlistController.add);

  fastify.delete<{ Params: { productId: string } }>('/:productId', {
    schema: {
      description: 'Remove a product from the wishlist',
      tags: ['Wishlist'],
      security: [{ bearerAuth: [] }],
      params: { type: 'object', properties: { productId: { type: 'number' } }, required: ['productId'] },
    },
  }, wishlistController.remove);
}

wishlistRoutes.autoPrefix = '/wishlist';
export default wishlistRoutes;
