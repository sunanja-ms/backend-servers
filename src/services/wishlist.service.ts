import { WishlistModel } from '../models/wishlist.model.js';

export class WishlistService {
  private wishlistModel = new WishlistModel();

  async findAll(userId: number): Promise<any[]> {
    return this.wishlistModel.findAll(userId);
  }

  async findIds(userId: number): Promise<number[]> {
    return this.wishlistModel.findIds(userId);
  }

  async add(userId: number, productId: number): Promise<boolean> {
    return this.wishlistModel.add(userId, productId);
  }

  async remove(userId: number, productId: number): Promise<boolean> {
    return this.wishlistModel.remove(userId, productId);
  }
}
