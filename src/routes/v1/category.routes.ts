import { FastifyInstance } from 'fastify';
import { CategoryController } from '../../controllers/category.controller.js';
import { CategoryService } from '../../services/category.service.js';
import { authMiddleware, requireRole } from '../../middlewares/auth.middleware.js';

async function categoryRoutes(fastify: FastifyInstance): Promise<void> {
  const controller = new CategoryController(new CategoryService());

  fastify.get('/', { schema: { description: 'List all categories', tags: ['Categories'] } }, controller.getAll);

  fastify.get<{ Params: { id: string } }>('/:id', { schema: { description: 'Get category by ID', tags: ['Categories'] } }, controller.getById);

  fastify.post('/', { preHandler: [authMiddleware, requireRole(['admin'])], schema: { description: 'Create category', tags: ['Categories'], security: [{ bearerAuth: [] }] } }, controller.create);

  fastify.put<{ Params: { id: string } }>('/:id', { preHandler: [authMiddleware, requireRole(['admin'])], schema: { description: 'Update category', tags: ['Categories'], security: [{ bearerAuth: [] }] } }, controller.update);

  fastify.delete<{ Params: { id: string } }>('/:id', { preHandler: [authMiddleware, requireRole(['admin'])], schema: { description: 'Delete category', tags: ['Categories'], security: [{ bearerAuth: [] }] } }, controller.delete);
}

categoryRoutes.autoPrefix = '/categories';
export default categoryRoutes;
