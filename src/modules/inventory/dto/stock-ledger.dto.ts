import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockLedgerQueryDto {
  @ApiProperty({
    description: 'Product ID to get ledger for',
    example: '01935a5c-1234-7000-8000-000000000001',
  })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    description: 'Filter by specific location',
    example: '01935a5c-1234-7000-8000-000000000002',
  })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Start date for the report' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for the report' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class StockLedgerEntry {
  @ApiProperty({ description: 'Timestamp of the transaction' })
  timestamp: Date;

  @ApiProperty({ description: 'Type of action (ADJUSTMENT, TRANSFER, etc.)' })
  action: string; // 'INSERT' | 'UPDATE' | 'DELETE'

  @ApiProperty({ description: 'Quantity change' })
  change: number;

  @ApiProperty({ description: 'Resulting balance after transaction (approx)' })
  balance: number;

  @ApiProperty({ description: 'Location ID where change happened' })
  locationId: string;

  @ApiProperty({ description: 'User who performed the action' })
  changedBy: string;

  @ApiProperty({ description: 'Previous state data', required: false })
  previousData?: any;

  @ApiProperty({ description: 'New state data', required: false })
  newData?: any;
}
