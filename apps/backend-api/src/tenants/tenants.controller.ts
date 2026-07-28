import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { UniversalAuthGuard } from '../auth/universal-auth.guard';
import { SuperadminGuard } from '../auth/superadmin.guard';
import { CurrentTenant } from '../auth/current-tenant.decorator';
import { ShopConfigDto, ProvisionTenantDto } from './dto/shop-config.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * POST /tenants/provision
   * Creates a new tenant and assigns it to the authenticated user.
   * Called during onboarding after signup approval.
   */
  @Post('provision')
  @UseGuards(UniversalAuthGuard)
  async provision(@Req() req: any, @Body() body: ProvisionTenantDto) {
    const userId = req.user?.id;
    return this.tenantsService.provision(userId, body);
  }

  /**
   * GET /tenants/me
   * Returns the current user's tenant info.
   */
  @Get('me')
  @UseGuards(UniversalAuthGuard)
  async getMyTenant(@CurrentTenant() tenantId: string) {
    return this.tenantsService.getMyTenant(tenantId);
  }

  /**
   * PATCH /tenants/config
   * Updates the tenant's business config (ShopConfig).
   * Used by both web-admin settings and desktop-pos push.
   */
  @Patch('config')
  @UseGuards(UniversalAuthGuard)
  async updateConfig(
    @CurrentTenant() tenantId: string,
    @Body() body: ShopConfigDto,
  ) {
    return this.tenantsService.updateConfig(tenantId, body);
  }

  /**
   * POST /tenants/:id/seed-demo
   * Reusable super admin endpoint for populating mock demo data for a tenant.
   */
  @Post(':id/seed-demo')
  @UseGuards(UniversalAuthGuard, SuperadminGuard)
  async seedDemo(@Param('id') tenantId: string, @Req() req: any) {
    const seederUserId = req.user?.id;
    return this.tenantsService.seedDemoData(tenantId, seederUserId);
  }

  /**
   * POST /tenants/:id/wipe
   * Super admin endpoint to wipe clean all transactional/catalog data for a tenant
   * while keeping user data & tenant metadata.
   */
  @Post(':id/wipe')
  @UseGuards(UniversalAuthGuard, SuperadminGuard)
  async wipeTenant(@Param('id') tenantId: string) {
    return this.tenantsService.wipeTenant(tenantId);
  }

  /**
   * DELETE /tenants/:id
   * Reusable super admin endpoint to safely delete a tenant and all its associated data.
   */
  @Delete(':id')
  @UseGuards(UniversalAuthGuard, SuperadminGuard)
  async deleteTenant(@Param('id') tenantId: string) {
    return this.tenantsService.deleteTenant(tenantId);
  }
}
