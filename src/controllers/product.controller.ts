import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service.js';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from '../schemas/product.schema.js';
import { toggleStatusSchema } from '../schemas/common.schema.js';
import { idSchema, parsePagination } from '../utils/validator.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { AppError } from '../types/errors.js';

export class ProductController {
  constructor(private productService: ProductService) {}

  getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authReq = request as AuthRequest;
    const isAdmin = authReq.user?.role === 'admin' || authReq.user?.role === 'moderator';
    const userId = isAdmin ? undefined : authReq.user?.id;
    const pagination = parsePagination(request.query as Record<string, unknown>);

    const result = await this.productService.findAll(userId, pagination);

    reply.send({
      success: true,
      data: result.data,
      message: `Page ${result.page} of ${result.totalPages} (${result.total} total)`,
    });
  };

  getById = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const product = await this.productService.findById(id);

    if (!product) {
      throw AppError.notFound('Product not found');
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

    const existingProduct = await this.productService.findById(id);
    if (!existingProduct) {
      throw AppError.notFound('Product not found');
    }

    const authReq = request as AuthRequest;
    const isOwner = existingProduct.userId === authReq.user.id;
    const isAdmin = authReq.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('You can only update your own products');
    }

    const updateData = {
      ...data,
      price: data.price !== undefined ? data.price.toString() : undefined,
    };

    const product = await this.productService.update(id, updateData);

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
      throw AppError.notFound('Product not found');
    }

    reply.status(204).send();
  };

  updateStock = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { quantity } = updateStockSchema.parse(request.body);

    const existingProduct = await this.productService.findById(id);
    if (!existingProduct) {
      throw AppError.notFound('Product not found');
    }

    const authReq = request as AuthRequest;
    const isOwner = existingProduct.userId === authReq.user.id;
    const isAdmin = authReq.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw AppError.forbidden('You can only update stock for your own products');
    }

    const product = await this.productService.updateStock(id, quantity);

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
    const { isActive } = toggleStatusSchema.parse(request.body ?? {});

    const product = await this.productService.toggleProductStatus(id, isActive);

    if (!product) {
      throw AppError.notFound('Product not found');
    }

    reply.send({
      success: true,
      message: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: product,
    });
  };
}
