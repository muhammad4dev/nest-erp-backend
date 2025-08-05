import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiProperty({ description: 'Parent product ID' })
  @IsUUID()
  parentProductId: string;

  @ApiProperty({ example: 'SKU-001-RED-L', description: 'Unique variant SKU' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({
    example: 'Red - Large',
    description: 'Variant display name',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: { color: 'Red', size: 'Large' },
    description: 'Variant attribute values',
  })
  @IsObject()
  variantAttributes: Record<string, string>;

  @ApiPropertyOptional({ example: 109.99, description: 'Override sales price' })
  @IsOptional()
  @IsNumber()
  salesPrice?: number;

  @ApiPropertyOptional({ example: 69.99, description: 'Override cost price' })
  @IsOptional()
  @IsNumber()
  costPrice?: number;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 0.5, description: 'Weight in kg' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Image URL for variant' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class UpdateProductVariantDto extends PartialType(
  CreateProductVariantDto,
) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
