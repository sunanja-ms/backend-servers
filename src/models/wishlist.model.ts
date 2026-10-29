import { eq, and, inArray, desc } from 'drizzle-orm';
import { db } from '../config/db.connection.js';
import { wishlists, products, productImages } from '../config/db.schemas.js';

export class WishlistModel {
  async findAll(userId: number): Promise<any[]> {
    const rows = await db
      .select({ product: products, addedAt: wishlists.createdAt })
      .from(wishlists)
      .innerJoin(products, eq(wishlists.productId, products.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));

    if (rows.length === 0) return [];

    const ids = rows.map((row) => row.product.id);
    const images = await db.select().from(productImages).where(inArray(productImages.productId, ids));

    return rows.map((row) => ({
      ...row.product,
      images: images.filter((image) => image.productId === row.product.id),
      addedAt: row.addedAt,
    }));
  }

  async findIds(userId: number): Promise<number[]> {
    const rows = await db
      .select({ productId: wishlists.productId })
      .from(wishlists)
      .where(eq(wishlists.userId, userId));
    return rows.map((row) => row.productId);
  }

  async add(userId: number, productId: number): Promise<boolean> {
    const inserted = await db
      .insert(wishlists)
      .values({ userId, productId })
      .onConflictDoNothing({ target: [wishlists.userId, wishlists.productId] })
      .returning({ id: wishlists.id });
    return inserted.length > 0;
  }

  async remove(userId: number, productId: number): Promise<boolean> {
    const deleted = await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
      .returning({ id: wishlists.id });
    return deleted.length > 0;
  }
}
