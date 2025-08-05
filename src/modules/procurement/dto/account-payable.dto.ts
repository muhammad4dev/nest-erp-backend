import { IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class APAgingQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Partner/Vendor' })
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

export class APAgingEntry {
  @ApiProperty({ description: 'Vendor ID' })
  partnerId: string;

  @ApiProperty({ description: 'Vendor Name' })
  partnerName: string;

  @ApiProperty({ description: 'Amount Payble (Not yet overdue)' })
  currentAmount: number;

  @ApiProperty({ description: 'Overdue 1-30 days' })
  overdue1To30: number;

  @ApiProperty({ description: 'Overdue 31-60 days' })
  overdue31To60: number;

  @ApiProperty({ description: 'Overdue 61-90 days' })
  overdue61To90: number;

  @ApiProperty({ description: 'Overdue 90+ days' })
  overdue90Plus: number;

  @ApiProperty({ description: 'Total Payble Balance' })
  totalDue: number;
}
