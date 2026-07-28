import { db } from '../config/db.connection.js';
import { cartItems, products, CartItem, NewCartItem } from '../config/db.schemas.js';
import { eq, and, sql } from 'drizzle-orm';
import logger from '../utils/logger.js';

export class CartModel {
  async findByUser(userId: number): Promise<any[]> {
    return db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        price: products.price,
        product: {
          id: products.id,
          name: products.name,
          price: products.price,
          stock: products.stock,
        },
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
  }

  async findById(id: number): Promise<any | null> {
    const [item] = await db.select().from(cartItems).where(eq(cartItems.id, id)).limit(1);
    return item || null;
  }

  async upsert(userId: number, productId: number, quantity: number): Promise<CartItem> {
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: sql`${cartItems.quantity} + ${quantity}` })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
      return updated!;
    }

    const [created] = await db.insert(cartItems).values({ userId, productId, quantity }).returning();
    if (!created) throw new Error('Failed to add to cart');
    return created;
  }

  async updateQuantity(id: number, userId: number, quantity: number): Promise<CartItem | null> {
    if (quantity < 1) {
      await this.delete(id, userId);
      return null;
    }
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
      .returning();
    return updated || null;
  }

  async delete(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
    return true;
  }

  async clearByUser(userId: number): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.userId, userId));
    logger.info(`Cart cleared for user ${userId}`);
  }
}
