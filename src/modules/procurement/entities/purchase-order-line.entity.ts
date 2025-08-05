import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { Product } from '../../inventory/entities/product.entity';
import { UomUnit } from '../../inventory/entities/uom-unit.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('purchase_order_lines')
export class PurchaseOrderLine extends BaseEntity {
  @ManyToOne(() => PurchaseOrder, (order) => order.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: PurchaseOrder;

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

  @ApiProperty({ example: 100 })
  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantity: number;

  @ApiPropertyOptional({ type: () => UomUnit })
  @ManyToOne(() => UomUnit)
  @JoinColumn({ name: 'uom_id' })
  uom: UomUnit;

  @ApiPropertyOptional({ example: '01935a5c-1234-7000-8000-000000000003' })
  @Column({ type: 'uuid', name: 'uom_id', nullable: true })
  uomId: string;

  @ApiProperty({ example: 45.5 })
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  unitPrice: number;

  @ApiProperty({ example: 4550.0 })
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  subtotal: number;
}
