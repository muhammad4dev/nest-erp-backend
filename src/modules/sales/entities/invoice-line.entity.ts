import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Invoice } from './invoice.entity';
import { Product } from '../../inventory/entities/product.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('invoice_lines')
export class InvoiceLine extends BaseEntity {
  @ManyToOne(() => Invoice, (invoice) => invoice.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'invoice_id' })
  invoiceId: string;

  @ApiPropertyOptional({ type: () => Product })
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000002' })
  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ApiPropertyOptional({ example: 'Custom product' })
  @Column({ type: 'varchar', nullable: true })
  description: string;

  @ApiProperty({ example: 2.5 })
  @Column({ type: 'decimal', precision: 14, scale: 4, default: 1 })
  quantity: number;

  @ApiProperty({ example: 150.0 })
  @Column({ type: 'decimal', precision: 14, scale: 2, name: 'unit_price' })
  unitPrice: number;

  @ApiProperty({ example: 25.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'discount_amount',
  })
  discountAmount: number;

  @ApiProperty({ example: 5 })
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    name: 'discount_rate',
  })
  discountRate: number;

  @ApiProperty({ example: 49.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'tax_amount',
  })
  taxAmount: number;

  @ApiProperty({ example: 399.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'line_total',
  })
  lineTotal: number;
}
