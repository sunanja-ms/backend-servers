import { db } from '../config/db.connection.js';
import { products, Product, NewProduct } from '../config/db.schemas.js';
import { eq, sql, asc, desc, Column } from 'drizzle-orm';
import logger from '../utils/logger.js';
import { PaginatedResponse, PaginationParams } from '../types/index.js';

const productSortableColumns: Record<string, Column> = {
  name: products.name,
  price: products.price,
  stock: products.stock,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

export class ProductModel {
  async findAll(
    userId?: number,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const offset = (page - 1) * limit;

    const sortColumn = pagination?.sortBy ? productSortableColumns[pagination.sortBy] : undefined;
    const orderBy = sortColumn
      ? pagination?.sortOrder === 'asc'
        ? asc(sortColumn)
        : desc(sortColumn)
      : desc(products.createdAt);

    const whereClause = userId ? eq(products.userId, userId) : undefined;

    const [allProducts, countResult] = await Promise.all([
      db.select().from(products).where(whereClause).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(products).where(whereClause),
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      data: allProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
    const [updatedProduct] = await db
      .update(products)
      .set({
        stock: sql`${products.stock} + ${quantity}`,
        updatedAt: new Date(),
      })
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
