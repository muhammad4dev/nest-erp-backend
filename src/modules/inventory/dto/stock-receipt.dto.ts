import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReceiptSourceType } from '../entities/stock-receipt.entity';

export class CreateStockReceiptLineDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitCost: number;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serialNumbers?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateStockReceiptDto {
  @IsDateString()
  receiptDate: string;

  @IsEnum(ReceiptSourceType)
  sourceType: ReceiptSourceType;

  @IsOptional()
  @IsString()
  sourceReference?: string;

  @IsString()
  locationId: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockReceiptLineDto)
  lines: CreateStockReceiptLineDto[];
}

export class UpdateStockReceiptDto {
  @IsOptional()
  @IsDateString()
  receiptDate?: string;

  @IsOptional()
  @IsEnum(ReceiptSourceType)
  sourceType?: ReceiptSourceType;

  @IsOptional()
  @IsString()
  sourceReference?: string;

  @IsOptional()
  @IsString()
  locationId?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  totalQuantity?: number;

  @IsOptional()
  @IsNumber()
  totalValue?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStockReceiptLineDto)
  lines?: CreateStockReceiptLineDto[];
}
