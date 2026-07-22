import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service.js';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from '../schemas/product.schema.js';
import { idSchema } from '../utils/validator.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

export class ProductController {
  constructor(private productService: ProductService) {}

  getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user?.id;
    const products = await this.productService.findAll(userId);

    reply.send({
      success: true,
      data: products,
    });
  };

  getById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const product = await this.productService.findById(id);

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'Product not found',
      });
    }

    reply.send({
      success: true,
      data: product,
    });
  };

  create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = createProductSchema.parse(request.body);
    const userId = (request as AuthRequest).user.id;

    const product = await this.productService.create({
      ...data,
      price: data.price.toString(),
      userId,
    });

    reply.status(201).send({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  };

  update = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const data = updateProductSchema.parse(request.body);
    const updateData = {
      ...data,
      price: data.price !== undefined ? data.price.toString() : undefined,
    };

    const product = await this.productService.update(id, updateData);

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'Product not found',
      });
    }

    reply.send({
      success: true,
      message: 'Product updated successfully',
      data: product,
    });
  };

  delete = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });

    const deleted = await this.productService.delete(id);

    if (!deleted) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'Product not found',
      });
    }

    reply.status(204).send();
  };

  updateStock = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { quantity } = updateStockSchema.parse(request.body);

    const product = await this.productService.updateStock(id, quantity);

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'Product not found',
      });
    }

    reply.send({
      success: true,
      message: 'Stock updated successfully',
      data: product,
    });
  };

  toggleStatus = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { isActive } = request.body as { isActive: boolean };

    if (typeof isActive !== 'boolean') {
      return reply.status(400).send({
        success: false,
        error: 'Bad Request',
        message: 'isActive must be a boolean',
      });
    }

    const product = await this.productService.toggleProductStatus(id, isActive);

    if (!product) {
      return reply.status(404).send({
        success: false,
        error: 'Not Found',
        message: 'Product not found',
      });
    }

    reply.send({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: product,
    });
  };
}