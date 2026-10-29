import { FastifyInstance } from 'fastify';
import { OrderController } from '../../controllers/order.controller.js';
import { OrderService } from '../../services/order.service.js';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.js';

async function orderRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new OrderController(new OrderService());

  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', { schema: { description: 'List orders (admin: all, user: own)', tags: ['Orders'], security: [{ bearerAuth: [] }] } }, controller.getAll);

  fastify.get<{ Params: { id: string } }>('/:id', { schema: { description: 'Get order detail', tags: ['Orders'], security: [{ bearerAuth: [] }] } }, controller.getById);

  fastify.get<{ Params: { id: string } }>('/:id/proof', { schema: { description: 'Download payment proof (owner or admin)', tags: ['Orders'], security: [{ bearerAuth: [] }] } }, controller.downloadProof);

  fastify.get<{ Params: { id: string } }>('/:id/receipt', { schema: { description: 'Printable order receipt as HTML (owner or admin)', tags: ['Orders'], security: [{ bearerAuth: [] }] } }, controller.getReceipt);

  fastify.post('/', { schema: { description: 'Create order from cart', tags: ['Orders'], security: [{ bearerAuth: [] }] } }, controller.create);

  fastify.patch<{ Params: { id: string } }>('/:id/status', { preHandler: [requireRole(['admin'])], schema: { description: 'Update order status', tags: ['Orders'], security: [{ bearerAuth: [] }] } }, controller.updateStatus);

  fastify.patch<{ Params: { id: string } }>('/:id/payment', { preHandler: [requireRole(['admin'])], schema: { description: 'Update payment status', tags: ['Orders'], security: [{ bearerAuth: [] }] } }, controller.updatePayment);

  fastify.patch<{ Params: { id: string } }>('/:id/pay', { schema: { description: 'Upload payment proof', tags: ['Orders'], security: [{ bearerAuth: [] }] } }, controller.uploadProof);
}

orderRoutes.autoPrefix = '/orders';
export default orderRoutes;
