import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { UniversalAuthGuard } from '../auth/universal-auth.guard';
import { CurrentTenant } from '../auth/current-tenant.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/stats
   * Returns KPI data for the current tenant's dashboard.
   */
  @Get('stats')
  @UseGuards(UniversalAuthGuard)
  async getStats(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getStats(tenantId);
  }
}
