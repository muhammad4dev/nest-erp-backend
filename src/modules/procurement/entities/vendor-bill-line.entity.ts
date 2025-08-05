import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VendorBill } from './vendor-bill.entity';
import { Product } from '../../inventory/entities/product.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('vendor_bill_lines')
export class VendorBillLine extends BaseEntity {
  @ManyToOne(() => VendorBill, (bill) => bill.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_bill_id' })
  bill: VendorBill;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'vendor_bill_id' })
  vendorBillId: string;

  @ApiPropertyOptional({ type: () => Product })
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000002' })
  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ApiPropertyOptional({ example: 'Raw materials' })
  @Column({ type: 'varchar', nullable: true })
  description: string;

  @ApiProperty({ example: 10 })
  @Column({ type: 'decimal', precision: 14, scale: 4, default: 1 })
  quantity: number;

  @ApiProperty({ example: 450.0 })
  @Column({ type: 'decimal', precision: 14, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @ApiProperty({ example: 0.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'discount_amount',
  })
  discountAmount: number;

  @ApiProperty({ example: 63.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'tax_amount',
  })
  taxAmount: number;

  @ApiProperty({ example: 4563.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'line_total',
  })
  lineTotal: number;
}
