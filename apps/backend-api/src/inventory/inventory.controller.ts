import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { UniversalAuthGuard } from 'src/auth/universal-auth.guard';
import { CurrentTenant } from 'src/auth/current-tenant.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import {
  AddStockDto,
  AdjustStockDto,
  MovementsQueryDto,
} from './dto/inventory.dto';

@Controller('inventory')
@UseGuards(UniversalAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * Quick Stock In - Add stock to a product
   */
  @Post(':productId/add')
  async addStock(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string | undefined,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() data: AddStockDto,
  ) {
    return this.inventoryService.addStock(tenantId, productId, data, userId);
  }

  /**
   * Stock Adjustment - Set actual physical stock
   */
  @Post(':productId/adjust')
  async adjustStock(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string | undefined,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() data: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(tenantId, productId, data, userId);
  }

  /**
   * Get movement history for a product
   */
  @Get(':productId/movements')
  async getMovements(
    @CurrentTenant() tenantId: string,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: MovementsQueryDto,
  ) {
    return this.inventoryService.getMovements(tenantId, productId, query);
  }
}
