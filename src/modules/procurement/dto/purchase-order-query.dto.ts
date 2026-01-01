import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PurchaseOrderStatus } from '../entities/purchase-order.entity';

export class PurchaseOrderQueryDto {
  @ApiPropertyOptional({ enum: PurchaseOrderStatus })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  partnerId?: string;
}
