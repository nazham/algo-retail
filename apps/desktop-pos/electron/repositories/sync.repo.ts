import { DB, schema } from '@algo/db-local';
import { eq, inArray, and, lte, sql } from 'drizzle-orm';

export class SyncRepository {
  /**
   * ⚠️ ARCHITECTURE NOTE:
   * We use `as any` casting for schema columns because of a Version Skew between
   * `better-sqlite3` v12.5.0 (App) and v12.6.0 (Shared Lib).
   *
   * This skew is INTENTIONAL to separate Electron (ABI 140) from Node CLI (ABI 127).
   * DO NOT REMOVE THE CASTS unless you resolve the ABI conflict.
   */
  constructor(private db: DB) {}

  // 1. Find orders where isSynced = false
  async getUnsyncedOrders(limit = 10) {
    // Get the Orders
    const orders = this.db
      .select()
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.isSynced as any, false),
          lte(schema.orders.retryCount as any, 3), // 🛡️ Dead Letter Queue Logic
        ) as any,
      )
      .limit(limit)
      .all(); // .all() is synchronous in better-sqlite3

    if (orders.length === 0) return [];

    // Get the Items for these orders
    const orderIds = orders.map((o) => o.id);
    const items = this.db
      .select()
      .from(schema.orderItems)
      .where(inArray(schema.orderItems.orderId as any, orderIds) as any)
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
      .where(inArray(schema.orders.id as any, orderIds) as any)
      .run();
  }

  // 3. Handle Sync Failures
  async incrementRetryCount(orderId: string, error: string) {
    this.db
      .update(schema.orders)
      .set({
        retryCount: sql`${schema.orders.retryCount} + 1` as any,
        syncError: error,
      })
      .where(eq(schema.orders.id as any, orderId) as any)
      .run();
  }
}
