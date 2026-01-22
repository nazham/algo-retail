import { ReportRepository } from '../repositories/report.repo';
import { NativePrinterService } from './native-printer.service';
import { zReportTemplate, ZReportData } from '../templates/z-report.template';

export class ReportService {
  constructor(private reportRepo: ReportRepository) {}

  /**
   * Get aggregated report data for a specific date (for preview)
   */
  async getReportData(targetDate: Date = new Date()): Promise<ZReportData> {
    // Fetch orders for the target date
    const dailyOrders = await this.reportRepo.getOrdersForDate(targetDate);

    console.log('📊 ReportService: Aggregating', dailyOrders.length, 'orders');

    return this.aggregateOrderData(dailyOrders, targetDate);
  }

  /**
   * Print the daily Z-Report
   */
  async printDailyReport(targetDate: Date = new Date()) {
    try {
      const reportData = await this.getReportData(targetDate);

      console.log('🖨️ Generating Z-Report...');
      return await NativePrinterService.print(zReportTemplate, reportData);
    } catch (error) {
      console.error('❌ Z-Report Generation Failed:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Private: Aggregate order data into Z-Report format
   */
  private aggregateOrderData(dailyOrders: any[], targetDate: Date): ZReportData {
    // Calculate shift times from orders (no separate DB call)
    const { shiftStart, shiftEnd } = this.calculateShiftTimes(dailyOrders);
    // Aggregate totals (all values in cents)
    const grossSales = dailyOrders.reduce((acc, o) => acc + (o.subtotal || 0), 0);
    const totalDiscounts = dailyOrders.reduce((acc, o) => acc + (o.discountTotal || 0), 0);
    const totalTax = dailyOrders.reduce((acc, o) => acc + (o.taxTotal || 0), 0);
    const netSales = dailyOrders.reduce((acc, o) => acc + o.grandTotal, 0);

    // Payment method breakdown
    const paymentMap = new Map<string, { amount: number; count: number }>();
    for (const order of dailyOrders) {
      const method = order.paymentMethod || 'UNKNOWN';
      const current = paymentMap.get(method) || { amount: 0, count: 0 };
      paymentMap.set(method, {
        amount: current.amount + order.grandTotal,
        count: current.count + 1,
      });
    }

    const paymentBreakdown = Array.from(paymentMap.entries()).map(([method, stats]) => ({
      method,
      ...stats,
    }));

    return {
      shopName: process.env.SHOP_NAME || 'Algo Retail',
      generatedAt: new Date().toLocaleString(),
      date: targetDate.toLocaleDateString(),
      shiftStart,
      shiftEnd,
      totalOrders: dailyOrders.length,
      grossSales,
      totalDiscounts,
      totalTax,
      netSales,
      paymentBreakdown,
    };
  }

  /**
   * Private: Calculate shift times from orders (local time)
   */
  private calculateShiftTimes(orders: any[]): {
    shiftStart: string | null;
    shiftEnd: string | null;
  } {
    if (orders.length === 0) {
      return { shiftStart: null, shiftEnd: null };
    }

    // Sort by createdAt (which is now a Date object thanks to Drizzle!)
    const sorted = [...orders].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    return {
      shiftStart: sorted[0].createdAt.toLocaleTimeString(),
      shiftEnd: sorted[sorted.length - 1].createdAt.toLocaleTimeString(),
    };
  }
}
