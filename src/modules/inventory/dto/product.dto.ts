import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ProductType } from '../entities/product.entity';

export class CreateProductDto {
  @ApiProperty({ example: 'SKU-001', description: 'Unique product SKU' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 'Office Chair', description: 'Product name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Ergonomic office chair with lumbar support',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ProductType, default: ProductType.GOODS })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({
    example: '01935a5c-1234-7000-8000-000000000001',
    description: 'Category ID',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    example: '01935a5c-1234-7000-8000-000000000001',
    description: 'Unit of Measure ID',
  })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @ApiPropertyOptional({ example: 99.99, description: 'Sales price' })
  @IsOptional()
  @IsNumber()
  salesPrice?: number;

  @ApiPropertyOptional({ example: 59.99, description: 'Cost price' })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({
    example: 'EG-GOODS-001',
    description: 'ETA tax code (EGS/GPC)',
  })
  @IsOptional()
  @IsString()
  taxCode?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 5.5, description: 'Weight in KG' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isSellable?: boolean;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isPurchasable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: { color: 'red' },
    description: 'Flexible metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}
