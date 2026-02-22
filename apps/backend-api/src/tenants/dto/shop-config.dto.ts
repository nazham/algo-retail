import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';

export class ShopConfigDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  addressLine2?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone1?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  phone2?: string;

  @IsEmail()
  @IsOptional()
  @MaxLength(255)
  email?: string;
}

export class ProvisionTenantDto extends ShopConfigDto {}
