import {
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSalesOrderLineDto {
  @ApiProperty({
    example: '0192a7e0-1234-7abc-8def-0123456789ab',
    description: 'Product UUID',
  })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10, description: 'Quantity ordered' })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 150.0, description: 'Unit price' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 5, description: 'Discount rate (percentage)' })
  @IsNumber()
  discountRate: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({
    example: '0192a7e0-1234-7abc-8def-0123456789ab',
    description: 'Partner/Customer UUID',
  })
  @IsUUID()
  partnerId: string;

  @ApiProperty({ example: '2024-01-15', description: 'Order date (ISO 8601)' })
  @IsDateString()
  date: string;

  @ApiProperty({ type: [CreateSalesOrderLineDto], description: 'Order lines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineDto)
  lines: CreateSalesOrderLineDto[];
}
