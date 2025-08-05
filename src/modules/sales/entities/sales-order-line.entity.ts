import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { SalesOrder } from './sales-order.entity';
import { Product } from '../../inventory/entities/product.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('sales_order_lines')
export class SalesOrderLine extends BaseEntity {
  @ManyToOne(() => SalesOrder, (order) => order.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: SalesOrder;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @ApiPropertyOptional({ type: () => Product })
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000002' })
  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ApiProperty({ example: 5.5 })
  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantity: number;

  @ApiProperty({ example: 100.0 })
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 10 })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountRate: number; // Percentage

  @ApiProperty({ example: 495.0 })
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  subtotal: number;
}
