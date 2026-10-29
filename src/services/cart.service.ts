import { CartModel } from '../models/cart.model.js';
import { ProductModel } from '../models/product.model.js';
import { AppError } from '../types/errors.js';

export class CartService {
  private model = new CartModel();
  private productModel = new ProductModel();

  async getCart(userId: number) {
    return this.model.findByUser(userId);
  }

  async addItem(userId: number, productId: number, quantity: number) {
    const product = await this.productModel.findById(productId);
    if (!product || !product.isActive) {
      throw AppError.notFound('Product not found');
    }
    return this.model.upsert(userId, productId, quantity);
  }

  async updateItem(id: number, userId: number, quantity: number) {
    if (quantity < 1) {
      await this.model.delete(id, userId);
      return null;
    }
    return this.model.updateQuantity(id, userId, quantity);
  }

  async removeItem(id: number, userId: number) {
    return this.model.delete(id, userId);
  }

  async clearCart(userId: number) {
    return this.model.clearByUser(userId);
  }
}
