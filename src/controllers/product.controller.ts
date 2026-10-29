import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service.js';
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
} from '../schemas/product.schema.js';
import { toggleStatusSchema } from '../schemas/common.schema.js';
import { idSchema, parsePagination } from '../utils/validator.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';
import { AppError } from '../types/errors.js';
import { processImage } from '../utils/upload.js';
import { writeFile, unlink } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join, basename } from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const imagesDir = join(__dirname, '..', '..', 'storage', 'products');
if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

export class ProductController {
  constructor(private productService: ProductService) {}

  getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const authReq = request as AuthRequest;
    const isPrivileged = authReq.user?.role === 'admin' || authReq.user?.role === 'moderator';
    const pagination = parsePagination(request.query as Record<string, unknown>);

    // Customers browse every active product; staff also see inactive and soft-deleted ones.
    const result = await this.productService.findAll(pagination, !isPrivileged);

    reply.send({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
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

  restore = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });

    const product = await this.productService.restore(id);

    if (!product) {
      throw AppError.notFound('Product not found or not deleted');
    }

    reply.send({
      success: true,
      message: 'Product restored successfully',
      data: product,
    });
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

  uploadImage = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const authReq = request as AuthRequest;
    const product = await this.productService.findById(id);
    if (!product) throw AppError.notFound('Product not found');
    if (product.userId !== authReq.user.id && authReq.user.role !== 'admin') throw AppError.forbidden();

    if ((product.images?.length ?? 0) >= 5) {
      throw AppError.badRequest('A product can have at most 5 images');
    }

    const data = await request.file();
    if (!data) throw AppError.badRequest('No file uploaded');

    let buffer: Buffer;
    try {
      buffer = await data.toBuffer();
    } catch {
      throw AppError.badRequest('File too large (max 5 MB)');
    }

    const webp = await processImage(buffer, { maxWidth: 1200 });
    const filename = `prod_${id}_${randomUUID()}.webp`;
    const filepath = join(imagesDir, filename);
    await writeFile(filepath, webp);

    const url = `/storage/products/${filename}`;
    const fields = data.fields as any;
    const rawPrimary = fields?.isPrimary;
    const declaredPrimary = (Array.isArray(rawPrimary) ? rawPrimary[0]?.value : rawPrimary?.value) === 'true';
    const isPrimary = declaredPrimary || (product.images?.length ?? 0) === 0;

    let image;
    try {
      image = await this.productService.addImage(id, url, isPrimary);
    } catch (error) {
      await unlink(filepath).catch(() => undefined);
      throw error;
    }

    reply.status(201).send({ success: true, message: 'Image uploaded', data: image });
  };

  deleteImage = async (
    request: FastifyRequest<{ Params: { id: string; imageId: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { id: imageId } = idSchema.parse({ id: request.params.imageId });

    const authReq = request as AuthRequest;
    const product = await this.productService.findById(id);
    if (!product) throw AppError.notFound('Product not found');
    if (product.userId !== authReq.user.id && authReq.user.role !== 'admin') {
      throw AppError.forbidden('You can only modify your own products');
    }

    const image = await this.productService.findImage(id, imageId);
    if (!image) throw AppError.notFound('Image not found');

    const deleted = await this.productService.deleteImage(id, imageId);
    if (!deleted) throw AppError.notFound('Image not found');

    const filename = basename(image.url);
    if (filename) await unlink(join(imagesDir, filename)).catch(() => undefined);

    reply.status(204).send();
  };

  setPrimaryImage = async (
    request: FastifyRequest<{ Params: { id: string; imageId: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { id } = idSchema.parse({ id: request.params.id });
    const { id: imageId } = idSchema.parse({ id: request.params.imageId });

    const authReq = request as AuthRequest;
    const product = await this.productService.findById(id);
    if (!product) throw AppError.notFound('Product not found');
    if (product.userId !== authReq.user.id && authReq.user.role !== 'admin') {
      throw AppError.forbidden('You can only modify your own products');
    }

    const image = await this.productService.setPrimaryImage(id, imageId);
    if (!image) throw AppError.notFound('Image not found');

    reply.send({ success: true, message: 'Primary image updated', data: image });
  };

  getLowStock = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const threshold = Math.min(Math.max(Number((request.query as any).threshold ?? 10), 0), 1000);
    const data = await this.productService.findLowStock(threshold);
    reply.send({ success: true, data });
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
