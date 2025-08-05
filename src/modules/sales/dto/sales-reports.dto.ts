import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SalesAnalysisGroupBy {
  CUSTOMER = 'CUSTOMER',
  PRODUCT = 'PRODUCT',
}

export class SalesAnalysisQueryDto {
  @ApiPropertyOptional({
    enum: SalesAnalysisGroupBy,
    default: SalesAnalysisGroupBy.CUSTOMER,
  })
  @IsOptional()
  @IsEnum(SalesAnalysisGroupBy)
  groupBy?: SalesAnalysisGroupBy;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SalesAnalysisEntry {
  @ApiProperty({ description: 'Group ID (Customer ID or Product ID)' })
  id: string;

  @ApiProperty({ description: 'Group Name (Customer Name or Product Name)' })
  name: string;

  @ApiProperty({ description: 'Total Order Count' })
  orderCount: number;

  @ApiProperty({ description: 'Total Revenue' })
  totalRevenue: number;
}
