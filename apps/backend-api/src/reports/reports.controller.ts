import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { UniversalAuthGuard } from '../auth/universal-auth.guard';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import {
  GetReportDateRangeDto,
  GetInventoryReportQueryDto,
} from './dto/report-query.dto';

@Controller('reports')
@UseGuards(UniversalAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * GET /reports/sales?from=YYYY-MM-DD&to=YYYY-MM-DD
   * Sales summary with KPIs, daily series, top products, payment breakdown.
   */
  @Get('sales')
  async getSalesSummary(
    @CurrentTenant() tenantId: string,
    @Query() query: GetReportDateRangeDto,
  ) {
    return this.reportsService.getSalesSummary(tenantId, query.from, query.to);
  }

  /**
   * GET /reports/profit-loss?from=YYYY-MM-DD&to=YYYY-MM-DD
   * P&L report with revenue, COGS, gross profit, daily series.
   */
  @Get('profit-loss')
  async getProfitAndLoss(
    @CurrentTenant() tenantId: string,
    @Query() query: GetReportDateRangeDto,
  ) {
    return this.reportsService.getProfitAndLoss(tenantId, query.from, query.to);
  }

  /**
   * GET /reports/inventory
   * Current inventory snapshot: valuation, categories, low stock, movements.
   */
  @Get('inventory')
  async getInventoryReport(
    @CurrentTenant() tenantId: string,
    @Query() query: GetInventoryReportQueryDto,
  ) {
    return this.reportsService.getInventoryReport(
      tenantId,
      query.lowStockPage,
      query.lowStockLimit,
      query.movementsPage,
      query.movementsLimit,
      query.from,
      query.to,
    );
  }
}
