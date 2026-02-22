import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { UniversalAuthGuard } from '../auth/universal-auth.guard';
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
}
