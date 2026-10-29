import { sql, count, sum, eq, isNull, and } from 'drizzle-orm';
import { db } from '../config/db.connection.js';
import { orders, users, products } from '../config/db.schemas.js';

export class StatsModel {
  async overview(threshold: number): Promise<any> {
    const [orderTotals] = await db
      .select({ total: count(), revenue: sum(orders.total) })
      .from(orders);

    const [paidTotals] = await db
      .select({ revenue: sum(orders.total) })
      .from(orders)
      .where(sql`${orders.paymentStatus} in ('paid', 'verified')`);

    const [userTotals] = await db.select({ total: count() }).from(users).where(isNull(users.deletedAt));

    const [productTotals] = await db
      .select({ total: count() })
      .from(products)
      .where(and(isNull(products.deletedAt), eq(products.isActive, true)));

    const [lowStock] = await db
      .select({ total: count() })
      .from(products)
      .where(and(isNull(products.deletedAt), sql`${products.stock} <= ${threshold}`));

    const series = await db.execute(sql`
      select to_char(d.day, 'YYYY-MM-DD') as date,
             count(o.id)::int as orders,
             coalesce(sum(o.total), 0)::text as revenue
      from generate_series(current_date - interval '13 days', current_date, interval '1 day') as d(day)
      left join orders o on date_trunc('day', o.created_at) = d.day
      group by d.day
      order by d.day
    `);

    const rows: any[] = (series as any).rows ?? (series as any);

    return {
      totalOrders: Number(orderTotals?.total ?? 0),
      totalRevenue: String(orderTotals?.revenue ?? '0'),
      paidRevenue: String(paidTotals?.revenue ?? '0'),
      totalUsers: Number(userTotals?.total ?? 0),
      activeProducts: Number(productTotals?.total ?? 0),
      lowStockCount: Number(lowStock?.total ?? 0),
      lowStockThreshold: threshold,
      series: rows.map((row) => ({
        date: row.date,
        orders: Number(row.orders ?? 0),
        revenue: String(row.revenue ?? '0'),
      })),
    };
  }
}
