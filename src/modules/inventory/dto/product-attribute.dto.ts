import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AttributeType } from '../entities/product-attribute.entity';

export class CreateProductAttributeDto {
  @ApiProperty({ example: 'Color', description: 'Attribute name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'color', description: 'Unique attribute code' })
  @IsString()
  code: string;

  @ApiProperty({ enum: AttributeType, example: AttributeType.SELECT })
  @IsEnum(AttributeType)
  type: AttributeType;

  @ApiPropertyOptional({
    example: false,
    description: 'Is this attribute required?',
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Can be used for filtering products?',
  })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Used to create product variants?',
  })
  @IsOptional()
  @IsBoolean()
  isVariant?: boolean;

  @ApiPropertyOptional({
    example: ['Red', 'Blue', 'Green'],
    description: 'Options for SELECT/MULTI_SELECT types',
  })
  @IsOptional()
  @IsArray()
  options?: string[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateProductAttributeDto extends PartialType(
  CreateProductAttributeDto,
) {}
