import {
  IsString,
  IsNumber,
  IsUUID,
  IsDateString,
  ValidateNested,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD';

export class CreateOrderItemDto {
  @IsString()
  productId!: string;

  @IsString()
  productName!: string;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  price!: number;
}

export class CreateOrderDto {
  @IsUUID()
  id!: string;

  @IsString()
  orderNumber!: string;

  @IsDateString()
  createdAt!: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsNumber()
  @Min(0)
  taxTotal!: number;

  @IsNumber()
  @Min(0)
  discountTotal!: number;

  @IsNumber()
  @Min(0)
  grandTotal!: number;

  @IsString()
  paymentMethod!: PaymentMethod;

  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
