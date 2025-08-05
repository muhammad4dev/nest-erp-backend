import {
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseOrderLineDto {
  @ApiProperty({
    example: '0192a7e0-1234-7abc-8def-0123456789ab',
    description: 'Product UUID',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 100, description: 'Quantity to order' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 50.0, description: 'Unit price' })
  @IsNumber()
  unitPrice: number;
}

export class CreateRFQDto {
  @ApiProperty({
    example: '0192a7e0-1234-7abc-8def-0123456789ab',
    description: 'Vendor/Partner UUID',
  })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Order date (ISO 8601)' })
  @IsDateString()
  orderDate: string;

  @ApiProperty({ type: [CreatePurchaseOrderLineDto], description: 'RFQ lines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines: CreatePurchaseOrderLineDto[];
}
