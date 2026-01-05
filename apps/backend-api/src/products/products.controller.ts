import { Controller, Post, Body, Get } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
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
