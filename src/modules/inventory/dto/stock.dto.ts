import { IsNumber, IsUUID, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockTransferDto {
  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @IsUUID()
  productId: string;

  @ApiProperty({
    example: '01935a5c-1234-7000-8000-000000000002',
    description: 'Source location ID',
  })
  @IsUUID()
  fromLocationId: string;

  @ApiProperty({
    example: '01935a5c-1234-7000-8000-000000000003',
    description: 'Destination location ID',
  })
  @IsUUID()
  toLocationId: string;

  @ApiProperty({ example: 10, description: 'Quantity to transfer' })
  @IsNumber()
  @Min(0.0001)
  quantity: number;

  @ApiPropertyOptional({
    example: 'TF-2024-001',
    description: 'Reference number',
  })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class StockAdjustmentDto {
  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000002' })
  @IsUUID()
  locationId: string;

  @ApiProperty({
    example: 5,
    description: 'Quantity adjustment (positive to add, negative to subtract)',
  })
  @IsNumber()
  quantity: number;

  @ApiProperty({
    example: 'Physical count adjustment',
    description: 'Reason for adjustment',
  })
  @IsString()
  reason: string;
}
