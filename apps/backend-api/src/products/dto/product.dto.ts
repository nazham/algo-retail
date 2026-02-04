import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// PostgreSQL INT4 max value
const MAX_INT = 2147483647;
const MAX_STOCK = 99999999;

export class ProductQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isActive?: boolean;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_INT, { message: 'Price exceeds maximum allowed value' })
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_INT, { message: 'Cost price exceeds maximum allowed value' })
  costPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK, { message: 'Stock exceeds maximum allowed value' })
  stock?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  expiryDate?: string | null;

  @IsOptional()
  @IsString()
  mfgDate?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  uom?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_INT, { message: 'Wholesale price exceeds maximum allowed value' })
  wholesalePrice?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK, { message: 'Reorder point exceeds maximum allowed value' })
  reorderPoint?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK, { message: 'Safety stock exceeds maximum allowed value' })
  safetyStock?: number | null;
}

export class ExportProductsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  onlyAutoSkus?: boolean;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sku?: string; // If not provided, auto-generate

  @IsInt()
  @Min(0)
  @Max(MAX_INT, { message: 'Price exceeds maximum allowed value' })
  price: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_INT, { message: 'Cost price exceeds maximum allowed value' })
  costPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK, { message: 'Stock exceeds maximum allowed value' })
  stock?: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  mfgDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  uom?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_INT, { message: 'Wholesale price exceeds maximum allowed value' })
  wholesalePrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK, { message: 'Reorder point exceeds maximum allowed value' })
  reorderPoint?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_STOCK, { message: 'Safety stock exceeds maximum allowed value' })
  safetyStock?: number;
}
