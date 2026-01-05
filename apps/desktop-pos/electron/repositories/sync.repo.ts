import { DB, schema } from '@algo/db-local';
import { eq, inArray } from 'drizzle-orm';

export class SyncRepository {
  constructor(private db: DB) {}

  // 1. Find orders where isSynced = false
  async getUnsyncedOrders(limit = 10) {
    // Get the Orders
    const orders = this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.isSynced, false))
      .limit(limit)
      .all(); // .all() is synchronous in better-sqlite3

    if (orders.length === 0) return [];

    // Get the Items for these orders
    const orderIds = orders.map((o) => o.id);
    const items = this.db
      .select()
      .from(schema.orderItems)
      .where(inArray(schema.orderItems.orderId, orderIds))
      .all();

    // Combine them (NestJS expects items inside the order object)
    return orders.map((order) => ({
      ...order,
      items: items.filter((i) => i.orderId === order.id),
    }));
  }

  // 2. Mark orders as synced after success
  async markOrdersAsSynced(orderIds: string[]) {
    if (orderIds.length === 0) return;

    this.db
      .update(schema.orders)
      .set({ isSynced: true })
      .where(inArray(schema.orders.id, orderIds))
      .run();
  }
}
