import { db } from '../config/db.connection.js';
import { products, Product, NewProduct } from '../config/db.schemas.js';
import { eq } from 'drizzle-orm';
import logger from '../utils/logger.js';

export class ProductModel {
  async findAll(userId?: number): Promise<Product[]> {
    if (userId) {
      return await db.select().from(products).where(eq(products.userId, userId));
    }
    return await db.select().from(products);
  }

  async findById(id: number): Promise<Product | null> {
    const product = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return product[0] || null;
  }

  async create(data: NewProduct): Promise<Product> {
    const [product] = await db.insert(products).values(data).returning();

    if (!product) {
      throw new Error('Failed to create product');
    }

    logger.info(`Product created: ${product.name}`);
    return product;
  }

  async update(id: number, data: Partial<NewProduct>): Promise<Product | null> {
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };

    const [product] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();

    if (product) {
      logger.info(`Product updated: ${product.name}`);
    }
    return product || null;
  }

  async delete(id: number): Promise<boolean> {
    const [product] = await db.delete(products).where(eq(products.id, id)).returning();

    if (product) {
      logger.info(`Product deleted: ${product.name}`);
    }
    return !!product;
  }

  async updateStock(id: number, quantity: number): Promise<Product | null> {
    const product = await this.findById(id);
    if (!product) return null;

    const newStock = product.stock + quantity;
    if (newStock < 0) {
      throw new Error('Insufficient stock');
    }

    const [updatedProduct] = await db
      .update(products)
      .set({ stock: newStock, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (updatedProduct) {
      logger.info(`Stock updated for product: ${updatedProduct.name}`);
    }
    return updatedProduct || null;
  }

  async toggleStatus(id: number, isActive: boolean): Promise<Product | null> {
    const [product] = await db
      .update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (product) {
      logger.info(`Product ${isActive ? 'activated' : 'deactivated'}: ${product.name}`);
    }
    return product || null;
  }
}