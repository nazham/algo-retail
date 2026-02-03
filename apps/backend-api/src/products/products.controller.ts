import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  Delete,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { UniversalAuthGuard } from 'src/auth/universal-auth.guard';
import { CurrentTenant } from 'src/auth/current-tenant.decorator';
import {
  ProductQueryDto,
  UpdateProductDto,
  ExportProductsDto,
  CreateProductDto,
} from './dto/product.dto';
import { Param, Patch, HttpCode, HttpStatus } from '@nestjs/common';

@Controller('products')
@UseGuards(UniversalAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.createProduct(tenantId, createProductDto);
  }

  @Post('seed')
  seed(@CurrentTenant() tenantId: string, @Body() body: { products: any[] }) {
    return this.productsService.seed(tenantId, body.products);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() query: ProductQueryDto) {
    return this.productsService.findAllPaginated(tenantId, query);
  }

  @Get('export')
  export(@CurrentTenant() tenantId: string, @Query() query: ExportProductsDto) {
    return this.productsService.getExportData(tenantId, query);
  }

  @Get(':id/batches')
  findBatches(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productsService.findBatches(tenantId, id);
  }

  @Patch(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() body: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, tenantId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.productsService.softDeleteProduct(id, tenantId);
  }

  @Get('sync')
  async syncProducts(
    @CurrentTenant() tenantId: string,
    @Query('lastSync') lastSync?: string,
  ) {
    const items = await this.productsService.getChangedProducts(
      tenantId,
      lastSync,
    );
    return {
      items,
      serverTime: new Date().toISOString(),
    };
  }
  @Get('categories/sync')
  async syncCategories(
    @CurrentTenant() tenantId: string,
    @Query('lastSync') lastSync?: string,
  ) {
    const items = await this.productsService.getChangedCategories(
      tenantId,
      lastSync,
    );
    return {
      items,
      serverTime: new Date().toISOString(),
    };
  }
}
