import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UniversalAuthGuard } from 'src/auth/universal-auth.guard';
import { CurrentTenant } from 'src/auth/current-tenant.decorator';

@Controller('orders')
@UseGuards(UniversalAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @CurrentTenant() tenantId: string,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(tenantId, createOrderDto);
  }

  @Get()
  findAll(@CurrentTenant() tenantId: string, @Query() query: GetOrdersDto) {
    return this.ordersService.findAll(tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.ordersService.findOne(tenantId, id);
  }
}
