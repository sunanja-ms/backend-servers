import { CartModel } from '../models/cart.model.js';

export class CartService {
  private model = new CartModel();

  async getCart(userId: number) {
    return this.model.findByUser(userId);
  }

  async addItem(userId: number, productId: number, quantity: number) {
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
