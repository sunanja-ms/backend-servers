import { db } from '../config/db.connection.js';
import { users, User, NewUser } from '../config/db.schemas.js';
import { eq, asc, desc, sql, Column } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger.js';
import { PaginatedResponse, PaginationParams } from '../types/index.js';

const userSortableColumns: Record<string, Column> = {
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
  updatedAt: users.updatedAt,
};

export class UserModel {
  async findAll(
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Omit<User, 'password'>>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const offset = (page - 1) * limit;

    const sortColumn = pagination?.sortBy ? userSortableColumns[pagination.sortBy] : undefined;
    const orderBy = sortColumn
      ? pagination?.sortOrder === 'asc'
        ? asc(sortColumn)
        : desc(sortColumn)
      : desc(users.createdAt);

    const [allUsers, countResult] = await Promise.all([
      db.select().from(users).orderBy(orderBy).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(users),
    ]);

    const total = countResult[0]?.total ?? 0;

    return {
      data: allUsers.map(({ password, ...user }) => user),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<Omit<User, 'password'> | null> {
    const user: User[] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user[0]) return null;

    const { password, ...userWithoutPassword } = user[0];
    return userWithoutPassword;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user: User[] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user[0] || null;
  }

  async create(data: NewUser): Promise<Omit<User, 'password'>> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const [user] = await db
      .insert(users)
      .values({ ...data, password: hashedPassword })
      .returning();

    if (!user) {
      throw new Error('Failed to create user');
    }

    logger.info(`User created: ${user.email}`);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(
    id: number,
    data: Partial<Omit<User, 'id' | 'password' | 'createdAt' | 'updatedAt'>>
  ): Promise<Omit<User, 'password'> | null> {
    const updateData: Partial<Omit<User, 'id' | 'password' | 'createdAt' | 'updatedAt'>> & { updatedAt: Date } = {
      ...data,
      updatedAt: new Date(),
    };

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!user) return null;

    logger.info(`User updated: ${user.email}`);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updatePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!user[0]) return false;

    const isValid = await bcrypt.compare(currentPassword, user[0].password);
    if (!isValid) return false;

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, id));

    logger.info(`Password updated for user: ${user[0].email}`);
    return true;
  }

  async delete(id: number): Promise<boolean> {
    const [user] = await db.delete(users).where(eq(users.id, id)).returning();

    if (user) {
      logger.info(`User deleted: ${user.email}`);
    }
    return !!user;
  }

  async toggleStatus(id: number, isActive: boolean): Promise<Omit<User, 'password'> | null> {
    const [user] = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();

    if (!user) return null;

    logger.info(`User ${isActive ? 'activated' : 'deactivated'}: ${user.email}`);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateLastLogin(id: number): Promise<void> {
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, id));
  }
}
