import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockValuationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Location' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Filter by Category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class StockValuationEntry {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productName: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  categoryName: string;

  @ApiProperty()
  locationName: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitCost: number;

  @ApiProperty()
  totalValue: number;
}
