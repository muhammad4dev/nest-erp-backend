import {
  IsEnum,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CostingMethod } from '../../../common/entities/inventory/inventory-valuation.entity';

export class ValuationSummaryQueryDto {
  @ApiPropertyOptional({ description: 'Filter by location ID' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Filter by product category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'As of date for valuation snapshot' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}

export class ValuationByLocationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by product category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'As of date for valuation snapshot' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}

export class ValuationByCategoryQueryDto {
  @ApiPropertyOptional({ description: 'Filter by location ID' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'As of date for valuation snapshot' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}

export class ValuationMovementQueryDto {
  @ApiPropertyOptional({ description: 'Filter by location ID' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({ description: 'Start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date' })
  @IsDateString()
  endDate: string;
}

export class UpdateCostingMethodDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Location ID (null for all locations)' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ enum: CostingMethod, description: 'Costing method' })
  @IsEnum(CostingMethod)
  costingMethod: CostingMethod;
}

export class UpdateStandardCostDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Location ID (null for all locations)' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ description: 'Standard cost' })
  @IsNumber()
  standardCost: number;
}

export class CostLayersQueryDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Location ID' })
  @IsUUID()
  locationId: string;
}

// Response DTOs

export interface ValuationSummaryDto {
  totalQuantity: number;
  totalValue: number;
  averageCost: number;
  productCount: number;
  locationCount: number;
  lastUpdated: Date;
}

export interface ValuationByLocationDto {
  locationId: string;
  locationName: string;
  totalQuantity: number;
  totalValue: number;
  averageCost: number;
  productCount: number;
}

export interface ValuationByCategoryDto {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  totalValue: number;
  averageCost: number;
  productCount: number;
}

export interface ProductValuationDto {
  productId: string;
  productName: string;
  sku: string;
  locationId?: string;
  locationName?: string;
  costingMethod: CostingMethod;
  quantity: number;
  value: number;
  averageCost: number;
  standardCost?: number;
  lastCost?: number;
  lastMovementDate?: Date;
}

export interface ValuationMovementDto {
  date: Date;
  productId: string;
  productName: string;
  locationId: string;
  locationName: string;
  transactionType: string; // RECEIPT, ISSUE, TRANSFER, ADJUSTMENT
  quantity: number;
  unitCost: number;
  valueChange: number;
  runningQuantity: number;
  runningValue: number;
}

export interface CostLayerDto {
  id: string;
  receiptDate: Date;
  originalQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  layerValue: number;
  batchNumber?: string;
  expiryDate?: Date;
  receiptNumber?: string;
}
