import { IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateSalesOrderLineDto } from './create-sales-order.dto';

export class UpdateSalesOrderDto {
  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;
}

export class UpdateSalesOrderLineDto extends PartialType(
  CreateSalesOrderLineDto,
) {}
