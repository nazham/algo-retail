import { Inject, Injectable } from '@nestjs/common';
import { DB_CONNECTION } from '../db/database.module';
import * as schema from '../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, and, desc } from 'drizzle-orm';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(DB_CONNECTION) private db: NodePgDatabase<typeof schema>,
  ) {}

  // ─── Shared Helpers ───────────────────────────────────────────

  private buildDateFilter(
    column: ReturnType<typeof sql>,
    from?: string,
    to?: string,
  ) {
    const filters: ReturnType<typeof sql>[] = [];
    if (from) {
      const fromDate = new Date(from);
      fromDate.setHours(0, 0, 0, 0);
      filters.push(sql`${column} >= ${fromDate}`);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filters.push(sql`${column} <= ${toDate}`);
    }
    return filters;
  }

  // ─── 1. Sales Summary ─────────────────────────────────────────

  async getSalesSummary(tenantId: string, from?: string, to?: string) {
    const dateFilters = this.buildDateFilter(
      sql`${schema.orders.createdAt}`,
      from,
      to,
    );

    const completedFilter = and(
      eq(schema.orders.tenantId, tenantId),
      eq(schema.orders.status, 'COMPLETED'),
      ...dateFilters,
    );

    const allStatusFilter = and(
      eq(schema.orders.tenantId, tenantId),
      ...dateFilters,
    );

    const [kpis, unitsSoldResult, dailySeries, topProducts, paymentBreakdown] =
      await Promise.all([
        // KPIs — only completed orders count as revenue
        this.db
          .select({
            totalRevenue: sql<number>`COALESCE(SUM(${schema.orders.grandTotal}), 0)`,
            totalOrders: sql<number>`CAST(COUNT(*) AS INTEGER)`,
          })
          .from(schema.orders)
          .where(completedFilter),

        // Total units sold (clean JOIN instead of nested subquery)
        this.db
          .select({
            totalUnitsSold: sql<number>`COALESCE(CAST(SUM(${schema.orderItems.quantity}) AS INTEGER), 0)`,
          })
          .from(schema.orderItems)
          .innerJoin(
            schema.orders,
            eq(schema.orderItems.orderId, schema.orders.id),
          )
          .where(completedFilter),

        // Daily revenue series
        this.db
          .select({
            date: sql<string>`TO_CHAR(${schema.orders.createdAt}, 'YYYY-MM-DD')`,
            revenue: sql<number>`COALESCE(SUM(${schema.orders.grandTotal}), 0)`,
            orders: sql<number>`CAST(COUNT(*) AS INTEGER)`,
          })
          .from(schema.orders)
          .where(completedFilter)
          .groupBy(sql`TO_CHAR(${schema.orders.createdAt}, 'YYYY-MM-DD')`)
          .orderBy(sql`TO_CHAR(${schema.orders.createdAt}, 'YYYY-MM-DD')`),

        // Top 10 products by revenue
        this.db
          .select({
            productName: schema.orderItems.productName,
            totalRevenue: sql<number>`COALESCE(SUM(${schema.orderItems.subtotal}), 0)`,
            totalQuantity: sql<number>`COALESCE(SUM(${schema.orderItems.quantity}), 0)`,
          })
          .from(schema.orderItems)
          .innerJoin(
            schema.orders,
            eq(schema.orderItems.orderId, schema.orders.id),
          )
          .where(completedFilter)
          .groupBy(schema.orderItems.productName)
          .orderBy(desc(sql`SUM(${schema.orderItems.subtotal})`))
          .limit(10),

        // Payment method breakdown (all statuses for visibility)
        this.db
          .select({
            method: schema.orders.paymentMethod,
            revenue: sql<number>`COALESCE(SUM(${schema.orders.grandTotal}), 0)`,
            count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
          })
          .from(schema.orders)
          .where(allStatusFilter)
          .groupBy(schema.orders.paymentMethod),
      ]);

    const stats = kpis[0];
    const totalRevenue = Number(stats?.totalRevenue ?? 0);
    const totalOrders = Number(stats?.totalOrders ?? 0);

    return {
      kpis: {
        totalRevenue,
        totalOrders,
        avgOrderValue:
          totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
        totalUnitsSold: Number(unitsSoldResult[0]?.totalUnitsSold ?? 0),
      },
      dailySeries: dailySeries.map((d) => ({
        date: d.date,
        revenue: Number(d.revenue),
        orders: Number(d.orders),
      })),
      topProducts: topProducts.map((p) => ({
        productName: p.productName,
        totalRevenue: Number(p.totalRevenue),
        totalQuantity: Number(p.totalQuantity),
      })),
      paymentBreakdown: paymentBreakdown.map((p) => ({
        method: p.method || 'UNKNOWN',
        revenue: Number(p.revenue),
        count: Number(p.count),
      })),
    };
  }

  // ─── 2. Profit & Loss ─────────────────────────────────────────

  async getProfitAndLoss(tenantId: string, from?: string, to?: string) {
    const orderDateFilters = this.buildDateFilter(
      sql`${schema.orders.createdAt}`,
      from,
      to,
    );
    const movementDateFilters = this.buildDateFilter(
      sql`${schema.inventoryMovements.createdAt}`,
      from,
      to,
    );

    const completedFilter = and(
      eq(schema.orders.tenantId, tenantId),
      eq(schema.orders.status, 'COMPLETED'),
      ...orderDateFilters,
    );

    const saleMovementFilter = and(
      eq(schema.inventoryMovements.tenantId, tenantId),
      eq(schema.inventoryMovements.type, 'SALE'),
      ...movementDateFilters,
    );

    const [revenueAndTaxRow, cogsRow, dailyRevenue, dailyCogs] =
      await Promise.all([
        // Total revenue, tax collected & discounts given
        this.db
          .select({
            revenue: sql<number>`COALESCE(SUM(${schema.orders.grandTotal}), 0)`,
            taxCollected: sql<number>`COALESCE(SUM(${schema.orders.taxTotal}), 0)`,
            discountsGiven: sql<number>`COALESCE(SUM(${schema.orders.discountTotal}), 0)`,
          })
          .from(schema.orders)
          .where(completedFilter),

        // COGS from inventory movements (cost snapshot × quantity sold)
        this.db
          .select({
            cogs: sql<number>`COALESCE(SUM(ABS(${schema.inventoryMovements.quantity}) * ${schema.inventoryMovements.costPrice}), 0)`,
          })
          .from(schema.inventoryMovements)
          .where(saleMovementFilter),

        // Daily revenue series
        this.db
          .select({
            date: sql<string>`TO_CHAR(${schema.orders.createdAt}, 'YYYY-MM-DD')`,
            revenue: sql<number>`COALESCE(SUM(${schema.orders.grandTotal}), 0)`,
          })
          .from(schema.orders)
          .where(completedFilter)
          .groupBy(sql`TO_CHAR(${schema.orders.createdAt}, 'YYYY-MM-DD')`)
          .orderBy(sql`TO_CHAR(${schema.orders.createdAt}, 'YYYY-MM-DD')`),

        // Daily COGS series
        this.db
          .select({
            date: sql<string>`TO_CHAR(${schema.inventoryMovements.createdAt}, 'YYYY-MM-DD')`,
            cogs: sql<number>`COALESCE(SUM(ABS(${schema.inventoryMovements.quantity}) * ${schema.inventoryMovements.costPrice}), 0)`,
          })
          .from(schema.inventoryMovements)
          .where(saleMovementFilter)
          .groupBy(
            sql`TO_CHAR(${schema.inventoryMovements.createdAt}, 'YYYY-MM-DD')`,
          )
          .orderBy(
            sql`TO_CHAR(${schema.inventoryMovements.createdAt}, 'YYYY-MM-DD')`,
          ),
      ]);

    const revenueStats = revenueAndTaxRow[0];
    const revenue = Number(revenueStats?.revenue ?? 0);
    const cogs = Number(cogsRow[0]?.cogs ?? 0);
    const grossProfit = revenue - cogs;

    // Merge daily series (revenue + cogs on same date axis)
    const dateMap = new Map<
      string,
      { date: string; revenue: number; cogs: number; profit: number }
    >();
    for (const d of dailyRevenue) {
      dateMap.set(d.date, {
        date: d.date,
        revenue: Number(d.revenue),
        cogs: 0,
        profit: Number(d.revenue),
      });
    }
    for (const d of dailyCogs) {
      const existing = dateMap.get(d.date);
      const cogsVal = Number(d.cogs);
      if (existing) {
        existing.cogs = cogsVal;
        existing.profit = existing.revenue - cogsVal;
      } else {
        dateMap.set(d.date, {
          date: d.date,
          revenue: 0,
          cogs: cogsVal,
          profit: -cogsVal,
        });
      }
    }
    const dailySeries = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return {
      kpis: {
        revenue,
        cogs,
        grossProfit,
        grossMarginPercent:
          revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0,
        taxCollected: Number(revenueStats?.taxCollected ?? 0),
        discountsGiven: Number(revenueStats?.discountsGiven ?? 0),
      },
      dailySeries,
    };
  }

  // ─── 3. Inventory Report ───────────────────────────────────────

  async getInventoryReport(
    tenantId: string,
    lowStockPage = 1,
    lowStockLimit = 10,
    movementsPage = 1,
    movementsLimit = 10,
    from?: string,
    to?: string,
  ) {
    const lowStockOffset = (lowStockPage - 1) * lowStockLimit;
    const movementsOffset = (movementsPage - 1) * movementsLimit;

    const lowStockWhere = and(
      eq(schema.products.tenantId, tenantId),
      eq(schema.products.isActive, true),
      sql`${schema.products.stock} <= GREATEST(${schema.products.reorderPoint}, 10)`,
    );

    // Build movement filters: default to last 30 days if no date filters are supplied
    let movementsWhere;
    if (from || to) {
      const dateFilters = this.buildDateFilter(
        sql`${schema.inventoryMovements.createdAt}`,
        from,
        to,
      );
      movementsWhere = and(
        eq(schema.inventoryMovements.tenantId, tenantId),
        ...dateFilters,
      );
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      movementsWhere = and(
        eq(schema.inventoryMovements.tenantId, tenantId),
        sql`${schema.inventoryMovements.createdAt} >= ${thirtyDaysAgo}`,
      );
    }

    const [
      stockSummary,
      categoryBreakdown,
      lowStockItems,
      lowStockTotalResult,
      movementSummary,
      movementsList,
      movementsTotalResult,
    ] = await Promise.all([
      // Overall stock valuation & counts
      this.db
        .select({
          totalStockValue: sql<number>`COALESCE(SUM(
            CASE WHEN ${schema.products.isActive} = true
              THEN ${schema.products.stock} * ${schema.products.costPrice}
              ELSE 0
            END
          ), 0)`,
          totalRetailValue: sql<number>`COALESCE(SUM(
            CASE WHEN ${schema.products.isActive} = true
              THEN ${schema.products.stock} * ${schema.products.price}
              ELSE 0
            END
          ), 0)`,
          activeSkus: sql<number>`CAST(COUNT(*) FILTER (WHERE ${schema.products.isActive} = true) AS INTEGER)`,
          inactiveSkus: sql<number>`CAST(COUNT(*) FILTER (WHERE ${schema.products.isActive} = false) AS INTEGER)`,
          lowStockCount: sql<number>`CAST(COUNT(*) FILTER (
            WHERE ${schema.products.isActive} = true
              AND ${schema.products.stock} <= GREATEST(${schema.products.reorderPoint}, 10)
              AND ${schema.products.stock} > 0
          ) AS INTEGER)`,
          outOfStockCount: sql<number>`CAST(COUNT(*) FILTER (
            WHERE ${schema.products.isActive} = true
              AND ${schema.products.stock} <= 0
          ) AS INTEGER)`,
        })
        .from(schema.products)
        .where(eq(schema.products.tenantId, tenantId)),

      // Stock value by category
      this.db
        .select({
          categoryName: sql<string>`COALESCE(${schema.categories.name}, 'Uncategorized')`,
          stockValue: sql<number>`COALESCE(SUM(${schema.products.stock} * ${schema.products.costPrice}), 0)`,
          itemCount: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        })
        .from(schema.products)
        .leftJoin(
          schema.categories,
          eq(schema.products.categoryId, schema.categories.id),
        )
        .where(
          and(
            eq(schema.products.tenantId, tenantId),
            eq(schema.products.isActive, true),
          ),
        )
        .groupBy(schema.categories.name)
        .orderBy(
          desc(
            sql`SUM(${schema.products.stock} * ${schema.products.costPrice})`,
          ),
        ),

      // Low stock items (paginated)
      this.db
        .select({
          id: schema.products.id,
          name: schema.products.name,
          sku: schema.products.sku,
          stock: schema.products.stock,
          reorderPoint: schema.products.reorderPoint,
          costPrice: schema.products.costPrice,
          price: schema.products.price,
        })
        .from(schema.products)
        .where(lowStockWhere)
        .orderBy(schema.products.stock)
        .limit(lowStockLimit)
        .offset(lowStockOffset),

      // Total low stock count
      this.db
        .select({ count: sql<number>`CAST(count(*) AS INTEGER)` })
        .from(schema.products)
        .where(lowStockWhere),

      // Movement summary (filtered by selected date range or 30 days)
      this.db
        .select({
          type: schema.inventoryMovements.type,
          totalQuantity: sql<number>`COALESCE(SUM(ABS(${schema.inventoryMovements.quantity})), 0)`,
          totalValue: sql<number>`COALESCE(SUM(ABS(${schema.inventoryMovements.quantity}) * COALESCE(${schema.inventoryMovements.costPrice}, 0)), 0)`,
          count: sql<number>`CAST(COUNT(*) AS INTEGER)`,
        })
        .from(schema.inventoryMovements)
        .where(movementsWhere)
        .groupBy(schema.inventoryMovements.type),

      // Detailed movements log (paginated, date filtered)
      this.db
        .select({
          id: schema.inventoryMovements.id,
          type: schema.inventoryMovements.type,
          quantity: schema.inventoryMovements.quantity,
          costPrice: schema.inventoryMovements.costPrice,
          reason: schema.inventoryMovements.reason,
          remarks: schema.inventoryMovements.remarks,
          createdAt: schema.inventoryMovements.createdAt,
          productName: schema.products.name,
          productSku: schema.products.sku,
          userName: schema.user.name,
        })
        .from(schema.inventoryMovements)
        .innerJoin(
          schema.products,
          eq(schema.inventoryMovements.productId, schema.products.id),
        )
        .leftJoin(
          schema.user,
          eq(schema.inventoryMovements.userId, schema.user.id),
        )
        .where(movementsWhere)
        .orderBy(desc(schema.inventoryMovements.createdAt))
        .limit(movementsLimit)
        .offset(movementsOffset),

      // Total count of detailed movements matching filter
      this.db
        .select({ count: sql<number>`CAST(count(*) AS INTEGER)` })
        .from(schema.inventoryMovements)
        .where(movementsWhere),
    ]);

    const summary = stockSummary[0];
    const lowStockTotal = lowStockTotalResult[0]?.count ?? 0;
    const lowStockTotalPages = Math.ceil(lowStockTotal / lowStockLimit);

    const movementsTotal = movementsTotalResult[0]?.count ?? 0;
    const movementsTotalPages = Math.ceil(movementsTotal / movementsLimit);

    return {
      kpis: {
        totalStockValue: Number(summary?.totalStockValue ?? 0),
        totalRetailValue: Number(summary?.totalRetailValue ?? 0),
        activeSkus: Number(summary?.activeSkus ?? 0),
        inactiveSkus: Number(summary?.inactiveSkus ?? 0),
        lowStockCount: Number(summary?.lowStockCount ?? 0),
        outOfStockCount: Number(summary?.outOfStockCount ?? 0),
      },
      categoryBreakdown: categoryBreakdown.map((c) => ({
        categoryName: c.categoryName,
        stockValue: Number(c.stockValue),
        itemCount: Number(c.itemCount),
      })),
      lowStockItems: lowStockItems.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: Number(p.stock ?? 0),
        reorderPoint: Number(p.reorderPoint ?? 0),
        costPrice: Number(p.costPrice ?? 0),
        price: Number(p.price ?? 0),
      })),
      lowStockTotal,
      lowStockPage: lowStockPage,
      lowStockLimit: lowStockLimit,
      lowStockTotalPages,
      movementSummary: movementSummary.map((m) => ({
        type: m.type,
        totalQuantity: Number(m.totalQuantity),
        totalValue: Number(m.totalValue),
        count: Number(m.count),
      })),
      movements: movementsList.map((m) => ({
        id: m.id,
        type: m.type,
        quantity: Number(m.quantity ?? 0),
        costPrice: Number(m.costPrice ?? 0),
        reason: m.reason || null,
        remarks: m.remarks || null,
        createdAt: m.createdAt?.toISOString() ?? new Date().toISOString(),
        productName: m.productName,
        productSku: m.productSku,
        userName: m.userName || null,
      })),
      movementsTotal,
      movementsPage: movementsPage,
      movementsLimit: movementsLimit,
      movementsTotalPages,
    };
  }
}
