import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class UpdateCategoryDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;
}

export class CategoryQueryDto {
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
}
