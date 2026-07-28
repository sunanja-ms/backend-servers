import { db } from '../config/db.connection.js';
import { orders, orderItems, Order, NewOrder, NewOrderItem } from '../config/db.schemas.js';
import { eq, desc, sql, asc, and, inArray } from 'drizzle-orm';
import logger from '../utils/logger.js';
import type { PaginatedResponse, PaginationParams } from '../types/index.js';

export class OrderModel {
  async findAll(userId: number | undefined, pagination?: PaginationParams): Promise<PaginatedResponse<any>> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (userId) conditions.push(eq(orders.userId, userId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [allOrders, countResult] = await Promise.all([
      db.select().from(orders).where(whereClause).orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
      db.select({ total: sql<number>`count(*)::int` }).from(orders).where(whereClause),
    ]);

    const allOrderIds = allOrders.map(o => o.id);
    let itemsMap: Record<number, any[]> = {};

    if (allOrderIds.length) {
      const items = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, allOrderIds));
      
      itemsMap = {};
      for (const item of items) {
        if (!itemsMap[item.orderId]) itemsMap[item.orderId] = [];
        itemsMap[item.orderId].push(item);
      }
    }

    const data = allOrders.map(o => ({ ...o, items: itemsMap[o.id] || [] }));
    const total = countResult[0]?.total ?? 0;

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number): Promise<any | null> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return null;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }

  async create(userId: number, data: NewOrder, items: { productId: number; productName: string; price: string; quantity: number }[]): Promise<any> {
    const [order] = await db.insert(orders).values({ ...data, userId }).returning();
    if (!order) throw new Error('Failed to create order');

    const orderItemsData: NewOrderItem[] = items.map(i => ({
      orderId: order.id,
      productId: i.productId,
      productName: i.productName,
      price: i.price,
      quantity: i.quantity,
    }));

    await db.insert(orderItems).values(orderItemsData);
    logger.info(`Order created: #${order.id} by user ${userId}`);
    return this.findById(order.id);
  }

  async update(id: number, data: Partial<NewOrder>): Promise<any | null> {
    const [order] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    if (order) logger.info(`Order updated: #${id}`);
    return order ? this.findById(id) : null;
  }

  async updatePaymentProof(id: number, proofUrl: string): Promise<any | null> {
    const [order] = await db.update(orders).set({ paymentProof: proofUrl, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return order ? this.findById(id) : null;
  }
}
