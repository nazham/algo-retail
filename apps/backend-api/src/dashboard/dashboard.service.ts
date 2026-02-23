import { Inject, Injectable } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, and, desc } from 'drizzle-orm';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  async getStats(tenantId: string) {
    // Build today's date range (UTC start/end of day)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Run all queries in parallel for performance
    const [todaySales, productStats, recentOrders] = await Promise.all([
      // 1. Today's revenue + order count
      this.db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(${schema.orders.grandTotal}), 0)`,
          orderCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.tenantId, tenantId),
            eq(schema.orders.status, 'COMPLETED'),
            sql`${schema.orders.createdAt} >= ${startOfDay}`,
            sql`${schema.orders.createdAt} <= ${endOfDay}`,
          ),
        ),

      // 2. Active products + low stock count
      this.db
        .select({
          activeProducts: sql<number>`CAST(COUNT(*) FILTER (WHERE ${schema.products.isActive} = true) AS INTEGER)`,
          lowStockItems: sql<number>`CAST(COUNT(*) FILTER (WHERE ${schema.products.isActive} = true AND ${schema.products.stock} < 10) AS INTEGER)`,
        })
        .from(schema.products)
        .where(eq(schema.products.tenantId, tenantId)),

      // 3. Recent 5 orders
      this.db.query.orders.findMany({
        where: eq(schema.orders.tenantId, tenantId),
        orderBy: [desc(schema.orders.createdAt)],
        limit: 5,
        columns: {
          id: true,
          orderNumber: true,
          grandTotal: true,
          status: true,
          createdAt: true,
          paymentMethod: true,
        },
      }),
    ]);

    const sales = todaySales[0];
    const products = productStats[0];

    return {
      todayRevenue: Number(sales?.totalRevenue ?? 0),
      todayOrders: Number(sales?.orderCount ?? 0),
      activeProducts: Number(products?.activeProducts ?? 0),
      lowStockItems: Number(products?.lowStockItems ?? 0),
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        grandTotal: o.grandTotal,
        status: o.status || 'COMPLETED',
        paymentMethod: o.paymentMethod || 'CASH',
        createdAt: o.createdAt?.toISOString() ?? new Date().toISOString(),
      })),
    };
  }
}
