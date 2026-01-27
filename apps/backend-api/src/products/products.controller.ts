import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Headers,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiKeyGuard } from 'src/auth/api-key.guard';

@Controller('products')
@UseGuards(ApiKeyGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('seed')
  seed(@Body() body: { products: any[] }) {
    return this.productsService.seed(body.products);
  }

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get('sync')
  async syncProducts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('lastSync') lastSync?: string,
  ) {
    return await this.productsService.getChangedProducts(tenantId, lastSync);
  }
}
