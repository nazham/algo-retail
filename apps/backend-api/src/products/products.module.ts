import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductBulkService } from './product-bulk.service';
import { ProductBulkController } from './product-bulk.controller';

@Module({
  controllers: [ProductsController, ProductBulkController],
  providers: [ProductsService, ProductBulkService],
})
export class ProductsModule {}
