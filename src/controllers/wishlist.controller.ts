import { FastifyRequest, FastifyReply } from 'fastify';
import { WishlistService } from '../services/wishlist.service.js';
import { ProductService } from '../services/product.service.js';
import { idSchema } from '../utils/validator.js';
import { AppError } from '../types/errors.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class WishlistController {
  constructor(
    private wishlistService: WishlistService,
    private productService: ProductService
  ) {}

  getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const data = await this.wishlistService.findAll(userId);
    reply.send({ success: true, data });
  };

  getIds = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const data = await this.wishlistService.findIds(userId);
    reply.send({ success: true, data });
  };

  add = async (request: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const { id: productId } = idSchema.parse({ id: request.params.productId });

    const product = await this.productService.findById(productId);
    if (!product) throw AppError.notFound('Product not found');

    await this.wishlistService.add(userId, productId);
    reply.status(201).send({ success: true, message: 'Added to wishlist', data: { productId } });
  };

  remove = async (request: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const { id: productId } = idSchema.parse({ id: request.params.productId });

    const removed = await this.wishlistService.remove(userId, productId);
    if (!removed) throw AppError.notFound('Product is not in your wishlist');

    reply.status(204).send();
  };
}
