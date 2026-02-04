import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AdjustmentReason {
  DAMAGED = 'DAMAGED',
  EXPIRED = 'EXPIRED',
  THEFT = 'THEFT',
  COUNT_ERROR = 'COUNT_ERROR',
  OTHER = 'OTHER',
}

export class AddStockDto {
  @IsNumber()
  @Min(0.01, { message: 'Quantity must be greater than 0' })
  @Max(100000, { message: 'Quantity cannot exceed 100,000 per transaction' })
  quantity: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Remarks cannot exceed 500 characters' })
  remarks?: string;
}

export class AdjustStockDto {
  @IsNumber()
  @Min(0, { message: 'Actual stock cannot be negative' })
  @Max(100000, { message: 'Stock cannot exceed 100,000' })
  actualStock: number;

  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Remarks cannot exceed 500 characters' })
  remarks?: string;
}

export class MovementsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'Maximum limit is 100' })
  limit?: number = 20;
}
