import { FastifyInstance } from 'fastify';
import { CartController } from '../../controllers/cart.controller.js';
import { CartService } from '../../services/cart.service.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

async function cartRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new CartController(new CartService());

  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', { schema: { description: 'Get cart items', tags: ['Cart'], security: [{ bearerAuth: [] }] } }, controller.getCart);
  fastify.post('/', { schema: { description: 'Add to cart', tags: ['Cart'], security: [{ bearerAuth: [] }] } }, controller.addItem);
  fastify.patch('/:id', { schema: { description: 'Update cart item qty', tags: ['Cart'], security: [{ bearerAuth: [] }] } }, controller.updateItem);
  fastify.delete('/:id', { schema: { description: 'Remove cart item', tags: ['Cart'], security: [{ bearerAuth: [] }] } }, controller.removeItem);
}

cartRoutes.autoPrefix = '/cart';
export default cartRoutes;
