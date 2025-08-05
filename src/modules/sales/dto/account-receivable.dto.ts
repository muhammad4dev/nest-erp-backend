import { IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ARAgingQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Partner/Customer' })
  @IsOptional()
  @IsUUID()
  partnerId?: string;

  @ApiPropertyOptional({
    description: 'Reference date for aging (default: today)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class ARAgingEntry {
  @ApiProperty({ description: 'Customer ID' })
  partnerId: string;

  @ApiProperty({ description: 'Customer Name' })
  partnerName: string;

  @ApiProperty({ description: 'Amount Due (Not yet overdue)' })
  currentAmount: number;

  @ApiProperty({ description: 'Overdue 1-30 days' })
  overdue1To30: number;

  @ApiProperty({ description: 'Overdue 31-60 days' })
  overdue31To60: number;

  @ApiProperty({ description: 'Overdue 61-90 days' })
  overdue61To90: number;

  @ApiProperty({ description: 'Overdue 90+ days' })
  overdue90Plus: number;

  @ApiProperty({ description: 'Total Outstanding Balance' })
  totalDue: number;
}
