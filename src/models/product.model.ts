import { db } from '../config/db.connection.js';
import { products, categories, productImages, Product, NewProduct } from '../config/db.schemas.js';
import { eq, sql, asc, desc, isNull, and, or, ilike, inArray } from 'drizzle-orm';
import logger from '../utils/logger.js';
import type { PaginatedResponse, PaginationParams } from '../types/index.js';

const productSortableColumns: Record<string, any> = {
  name: products.name,
  price: products.price,
  stock: products.stock,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

export class ProductModel {
  async findAll(userId?: number, pagination?: PaginationParams): Promise<PaginatedResponse<any>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 12;
    const offset = (page - 1) * limit;

    const sortColumn = pagination?.sortBy ? productSortableColumns[pagination.sortBy] : undefined;
    const orderBy = sortColumn
      ? pagination?.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
      : desc(products.createdAt);

    const conditions = [isNull(products.deletedAt)];
    if (pagination?.includeDeleted) conditions.pop();
    if (userId) conditions.push(eq(products.userId, userId));
    if (pagination?.search) {
      const q = `%${pagination.search}%`;
      conditions.push(or(ilike(products.name, q), ilike(products.description, q))!);
    }
    if (pagination?.isActive) conditions.push(eq(products.isActive, pagination.isActive === 'true'));
    if (pagination?.categoryId) conditions.push(eq(products.categoryId, Number(pagination.categoryId)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allProducts, countResult] = await Promise.all([
      db.select().from(products).where(whereClause as any).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(products).where(whereClause),
    ]);

    const productIds = allProducts.map(p => p.id);
    let imagesMap: Record<number, any[]> = {};
    let categoryIds = allProducts.map(p => p.categoryId).filter(Boolean) as number[];
    let categoriesMap: Record<number, any> = {};

    if (productIds.length) {
      const imgs = await db.select().from(productImages).where(inArray(productImages.productId, productIds));
      imagesMap = {};
      for (const img of imgs) {
        if (!imagesMap[img.productId]) imagesMap[img.productId] = [];
        imagesMap[img.productId].push(img);
      }
    }

    if (categoryIds.length) {
      const cats = await db.select().from(categories).where(inArray(categories.id, categoryIds));
      for (const c of cats) categoriesMap[c.id] = c;
    }

    const data = allProducts.map(p => ({
      ...p,
      images: imagesMap[p.id] || [],
      category: categoriesMap[p.categoryId!] || null,
    }));

    const total = countResult[0]?.total ?? 0;
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number): Promise<any | null> {
    const [product] = await db.select().from(products).where(and(eq(products.id, id), isNull(products.deletedAt))).limit(1);
    if (!product) return null;

    const images = await db.select().from(productImages).where(eq(productImages.productId, id));
    let category = null;
    if (product.categoryId) {
      const [cat] = await db.select().from(categories).where(eq(categories.id, product.categoryId)).limit(1);
      category = cat || null;
    }
    return { ...product, images, category };
  }

  async create(data: NewProduct): Promise<any> {
    const [product] = await db.insert(products).values(data).returning();
    if (!product) throw new Error('Failed to create product');
    logger.info(`Product created: ${product.name}`);
    return { ...product, images: [], category: null };
  }

  async update(id: number, data: Partial<NewProduct>): Promise<any | null> {
    const [product] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(and(eq(products.id, id), isNull(products.deletedAt))).returning();
    if (!product) return null;
    logger.info(`Product updated: ${product.name}`);
    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const [product] = await db.update(products).set({ deletedAt: new Date(), updatedAt: new Date() }).where(and(eq(products.id, id), isNull(products.deletedAt))).returning();
    if (product) logger.info(`Product soft-deleted: ${product.name}`);
    return !!product;
  }

  async restore(id: number): Promise<any | null> {
    const [product] = await db.update(products).set({ deletedAt: null, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return product ? this.findById(id) : null;
  }

  async updateStock(id: number, quantity: number): Promise<any | null> {
    const [updatedProduct] = await db.update(products).set({ stock: sql`${products.stock} + ${quantity}`, updatedAt: new Date() }).where(and(eq(products.id, id), isNull(products.deletedAt))).returning();
    return updatedProduct || null;
  }

  async toggleStatus(id: number, isActive: boolean): Promise<any | null> {
    const [product] = await db.update(products).set({ isActive, updatedAt: new Date() }).where(and(eq(products.id, id), isNull(products.deletedAt))).returning();
    if (product) logger.info(`Product ${isActive ? 'activated' : 'deactivated'}: ${product.name}`);
    return product || null;
  }

  async addImage(productId: number, url: string, isPrimary?: boolean): Promise<any> {
    if (isPrimary) {
      await db.update(productImages).set({ isPrimary: false }).where(eq(productImages.productId, productId));
    }
    const [img] = await db.insert(productImages).values({ productId, url, isPrimary: isPrimary ?? false }).returning();
    return img;
  }

  async deleteImage(imageId: number): Promise<boolean> {
    await db.delete(productImages).where(eq(productImages.id, imageId));
    return true;
  }
}
