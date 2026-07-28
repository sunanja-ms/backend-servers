import { FastifyRequest, FastifyReply } from 'fastify';
import { CartService } from '../services/cart.service.js';
import { addToCartSchema, updateCartItemSchema } from '../schemas/cart.schema.js';
import { idSchema } from '../utils/validator.js';
import { AppError } from '../types/errors.js';
import type { AuthRequest } from '../middlewares/auth.middleware.js';

export class CartController {
  constructor(private cartService: CartService) {}

  getCart = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const items = await this.cartService.getCart(userId);
    reply.send({ success: true, data: items });
  };

  addItem = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const { productId, quantity } = addToCartSchema.parse(request.body);
    const item = await this.cartService.addItem(userId, productId, quantity);
    reply.status(201).send({ success: true, message: 'Added to cart', data: item });
  };

  updateItem = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const { id } = idSchema.parse({ id: request.params.id });
    const { quantity } = updateCartItemSchema.parse(request.body);
    const item = await this.cartService.updateItem(id, userId, quantity);
    reply.send({ success: true, message: quantity < 1 ? 'Item removed' : 'Cart updated', data: item });
  };

  removeItem = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> => {
    const userId = (request as AuthRequest).user.id;
    const { id } = idSchema.parse({ id: request.params.id });
    await this.cartService.removeItem(id, userId);
    reply.status(204).send();
  };
}
