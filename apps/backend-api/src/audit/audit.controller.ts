import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { UniversalAuthGuard } from '../auth/universal-auth.guard';
import { CurrentTenant } from '../auth/current-tenant.decorator';

@Controller('audit-logs')
@UseGuards(UniversalAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getLogs(
    @CurrentTenant() tenantId: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getLogs(
      tenantId,
      entityType,
      entityId,
      page,
      limit,
    );
  }
}
