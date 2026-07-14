import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetReportDateRangeDto {
  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO date string' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO date string' })
  to?: string;
}

export class GetInventoryReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  lowStockPage?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'Maximum lowStockLimit is 100' })
  lowStockLimit?: number = 10;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  movementsPage?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100, { message: 'Maximum movementsLimit is 100' })
  movementsLimit?: number = 10;

  @IsOptional()
  @IsDateString({}, { message: 'from must be a valid ISO date string' })
  from?: string;

  @IsOptional()
  @IsDateString({}, { message: 'to must be a valid ISO date string' })
  to?: string;
}
