import { db } from '../config/db.connection.js';
import { categories, Category, NewCategory } from '../config/db.schemas.js';
import { eq, asc, isNull } from 'drizzle-orm';
import logger from '../utils/logger.js';

export class CategoryModel {
  async findAll(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async findById(id: number): Promise<Category | null> {
    const [cat] = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return cat || null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const [cat] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return cat || null;
  }

  async create(data: NewCategory): Promise<Category> {
    const [cat] = await db.insert(categories).values(data).returning();
    if (!cat) throw new Error('Failed to create category');
    logger.info(`Category created: ${cat.name}`);
    return cat;
  }

  async update(id: number, data: Partial<NewCategory>): Promise<Category | null> {
    const [cat] = await db.update(categories).set({ ...data, updatedAt: new Date() }).where(eq(categories.id, id)).returning();
    if (cat) logger.info(`Category updated: ${cat.name}`);
    return cat || null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    logger.info(`Category deleted: id=${id}`);
    return true;
  }
}
