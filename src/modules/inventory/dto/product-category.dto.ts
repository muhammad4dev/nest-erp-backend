import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateProductCategoryDto {
  @ApiProperty({ example: 'Electronics', description: 'Category name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ELEC', description: 'Unique category code' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Electronic devices and accessories' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Parent category ID for hierarchical structure',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ example: 0, description: 'Sort order for display' })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateProductCategoryDto extends PartialType(
  CreateProductCategoryDto,
) {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
