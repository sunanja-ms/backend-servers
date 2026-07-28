import { FastifyRequest, FastifyReply } from 'fastify';
import { CategoryService } from '../services/category.service.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema.js';
import { idSchema } from '../utils/validator.js';
import { AppError } from '../types/errors.js';

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  getAll = async (_req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const categories = await this.categoryService.findAll();
    reply.send({ success: true, data: categories });
  };

  getById = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: req.params.id });
    const cat = await this.categoryService.findById(id);
    if (!cat) throw AppError.notFound('Category not found');
    reply.send({ success: true, data: cat });
  };

  create = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = createCategorySchema.parse(req.body);
    const cat = await this.categoryService.create(data);
    reply.status(201).send({ success: true, message: 'Category created', data: cat });
  };

  update = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: req.params.id });
    const data = updateCategorySchema.parse(req.body);
    const cat = await this.categoryService.update(id, data);
    if (!cat) throw AppError.notFound('Category not found');
    reply.send({ success: true, message: 'Category updated', data: cat });
  };

  delete = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const { id } = idSchema.parse({ id: req.params.id });
    await this.categoryService.delete(id);
    reply.status(204).send();
  };
}
