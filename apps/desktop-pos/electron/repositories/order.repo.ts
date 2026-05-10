import { DB, schema } from '@algo/db-local';
import { CreateOrderDto, OrderResultDto } from '@algo/types';
import { randomUUID } from 'crypto';
import { desc, eq, sql, and, gte, lte, like, or } from 'drizzle-orm';

export class OrderRepository {
  /**
   * ⚠️ ARCHITECTURE NOTE:
   * We use `as any` casting for schema columns because of a Version Skew between
   * `better-sqlite3` v12.5.0 (App) and v12.6.0 (Shared Lib).
   *
   * This skew is INTENTIONAL to separate Electron (ABI 140) from Node CLI (ABI 127).
   * DO NOT REMOVE THE CASTS unless you resolve the ABI conflict.
   */
  constructor(private db: DB) {}

  // The main function can remain async (to match the Promise interface of the Repository)
  async create(data: CreateOrderDto): Promise<OrderResultDto> {
    return this.db.transaction((tx) => {
      // A. Insert Main Order
      const calculatedDiscountTotal = data.items.reduce(
        (sum, item) => sum + item.quantity * (item.discountAmount || 0),
        0,
      );
      const calculatedGrandTotal = data.subtotal - calculatedDiscountTotal + (data.taxTotal || 0);

      tx.insert(schema.orders)
        .values({
          id: data.id, // Matches schema id (text)
          orderNumber: data.orderNumber, // Matches schema orderNumber (text)
          createdAt: new Date(data.createdAt),

          status: 'COMPLETED',
          paymentMethod: data.paymentMethod,
          subtotal: data.subtotal,
          taxTotal: data.taxTotal,
          discountTotal: calculatedDiscountTotal,
          grandTotal: calculatedGrandTotal,
          isSynced: false,
        })
        .run(); // explicit .run() is sometimes needed in raw BS3, but Drizzle handles it usually.

      // B. Insert Items & Update Stock
      for (const item of data.items) {
        // 1. Get current cost price snapshot
        const product = tx
          .select({ costPrice: schema.products.costPrice })
          .from(schema.products)
          .where(eq(schema.products.id as any, item.productId) as any)
          .get();

        const currentCost = product?.costPrice ?? 0;

        tx.insert(schema.orderItems)
          .values({
            id: randomUUID(),
            orderId: data.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            costPrice: currentCost, // 🟢 SNAPSHOT
            discountAmount: (item.discountAmount ?? 0) * item.quantity,
            discountType: item.discountType ?? 'MANUAL',
            subtotal: (item.price - (item.discountAmount ?? 0)) * item.quantity,
          })
          .run();

        tx.update(schema.products)
          .set({
            stock: sql`${schema.products.stock} - ${item.quantity}` as any,
          })
          .where(eq(schema.products.id as any, item.productId) as any)
          .run();
      }

      return { orderId: data.id, orderNumber: data.orderNumber };
    });
  }

  async findAll(filters?: {
    page?: number;
    limit?: number;
    from?: string;
    to?: string;
    status?: string;
    search?: string;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions array
    const conditions = [];

    if (filters?.from) {
      const startTimestamp = new Date(filters.from).getTime();
      conditions.push(gte(schema.orders.createdAt as any, new Date(startTimestamp)));
    }

    if (filters?.to) {
      // Don't add extra day - frontend already sends end of day timestamp
      const endTimestamp = new Date(filters.to).getTime();
      conditions.push(lte(schema.orders.createdAt as any, new Date(endTimestamp)));
    }

    if (filters?.status) {
      conditions.push(eq(schema.orders.status as any, filters.status));
    }

    if (filters?.search) {
      // Search across order number AND product names in order items
      const searchPattern = `%${filters.search}%`;

      conditions.push(
        or(
          like(schema.orders.orderNumber as any, searchPattern),
          sql`EXISTS (
            SELECT 1 FROM order_items
            WHERE order_items.order_id = orders.id
            AND order_items.product_name LIKE ${searchPattern}
          )`,
        )! as any,
      );
    }

    // Combine conditions with AND, or use undefined if no conditions
    const whereClause = conditions.length > 0 ? (and(...conditions) as any) : undefined;

    // Get total count for pagination
    const countQuery = this.db
      .select({ count: sql<number>`cast(count(*) as integer)` as any })
      .from(schema.orders);

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const countResult = countQuery.get();
    // 🛡️ CAST SAFETY: better-sqlite3 may return BigInt or number depending on configuration.
    // 'Number()' is safe here as order count will not exceed Number.MAX_SAFE_INTEGER (2^53).
    const total = Number(countResult?.count || 0);

    // Get paginated data using query API
    const query: any = {
      orderBy: [desc(schema.orders.createdAt as any)],
      limit,
      offset,
      with: {
        items: true,
      },
    };

    if (whereClause) {
      query.where = whereClause;
    }

    const data = await this.db.query.orders.findMany(query);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
