import { DB, schema } from '@algo/db-local';
import { CreateOrderDto, OrderResultDto } from '@algo/types';
import { randomUUID } from 'crypto';
import { desc, eq, sql, and, gte, lte, like, or } from 'drizzle-orm';

export class OrderRepository {
  constructor(private db: DB) {}

  // The main function can remain async (to match the Promise interface of the Repository)
  async create(data: CreateOrderDto): Promise<OrderResultDto> {
    return this.db.transaction((tx) => {
      // A. Insert Main Order
      tx.insert(schema.orders)
        .values({
          id: data.id, // Matches schema id (text)
          orderNumber: data.orderNumber, // Matches schema orderNumber (text)
          // Schema expects 'timestamp_ms' (Date or Integer), but DTO has ISO String.
          // We convert it here so Drizzle handles the integer math.
          createdAt: new Date(data.createdAt),

          status: 'COMPLETED',
          paymentMethod: data.paymentMethod,
          subtotal: data.subtotal,
          taxTotal: data.taxTotal,
          discountTotal: data.discountTotal,
          grandTotal: data.grandTotal,
          isSynced: false,
        })
        .run(); // explicit .run() is sometimes needed in raw BS3, but Drizzle handles it usually.
      // With Drizzle + BS3, just calling the method synchronously works.

      // B. Insert Items & Update Stock
      for (const item of data.items) {
        tx.insert(schema.orderItems)
          .values({
            id: randomUUID(),
            orderId: data.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price,
            subtotal: item.price * item.quantity,
          })
          .run();

        tx.update(schema.products)
          .set({
            stock: sql`${schema.products.stock} - ${item.quantity}`,
          })
          .where(eq(schema.products.id, item.productId))
          .run();
      }

      return { orderId: data.id, orderNumber: data.orderNumber };
    });
  }

  async findAll(filters?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    searchTerm?: string;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const offset = (page - 1) * limit;

    // Build where conditions array
    const conditions = [];

    if (filters?.startDate) {
      const startTimestamp = new Date(filters.startDate).getTime();
      conditions.push(gte(schema.orders.createdAt, new Date(startTimestamp)));
    }

    if (filters?.endDate) {
      // Don't add extra day - frontend already sends end of day timestamp
      const endTimestamp = new Date(filters.endDate).getTime();
      conditions.push(lte(schema.orders.createdAt, new Date(endTimestamp)));
    }

    if (filters?.status) {
      conditions.push(eq(schema.orders.status, filters.status));
    }

    if (filters?.searchTerm) {
      // Search across order number AND product names in order items
      const searchPattern = `%${filters.searchTerm}%`;

      conditions.push(
        or(
          like(schema.orders.orderNumber, searchPattern),
          sql`EXISTS (
            SELECT 1 FROM order_items
            WHERE order_items.order_id = orders.id
            AND order_items.product_name LIKE ${searchPattern}
          )`,
        )!,
      );
    }

    // Combine conditions with AND, or use undefined if no conditions
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countQuery = this.db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(schema.orders);

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const countResult = countQuery.get();
    const total = countResult?.count || 0;

    // Get paginated data using query API
    const query: any = {
      orderBy: [desc(schema.orders.createdAt)],
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
