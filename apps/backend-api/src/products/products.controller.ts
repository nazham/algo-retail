import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
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
}
