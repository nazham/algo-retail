import { DB, orders } from '@algo/db-local';
import { and, gte, lte } from 'drizzle-orm';

export class ReportRepository {
  constructor(private db: DB) {}

  /**
   * Get all orders for a specific date (in local timezone)
   */
  async getOrdersForDate(targetDate: Date) {
    // Create start and end of day in LOCAL timezone
    const startOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      0,
      0,
      0,
      0,
    );

    const endOfDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      23,
      59,
      59,
      999,
    );

    console.log('📊 ReportRepo: Querying orders for date range:', {
      start: startOfDay.toLocaleString(),
      end: endOfDay.toLocaleString(),
    });

    // Simple integer range query (timestamps are in milliseconds)
    const result = this.db
      .select()
      .from(orders)
      .where(and(gte(orders.createdAt, startOfDay), lte(orders.createdAt, endOfDay)))
      .all();

    console.log('📊 ReportRepo: Found', result.length, 'orders');

    return result;
  }
}
