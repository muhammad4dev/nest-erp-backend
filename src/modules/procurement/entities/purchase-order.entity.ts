import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Partner } from '../../sales/entities/partner.entity';
import { PurchaseOrderLine } from './purchase-order-line.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PurchaseOrderStatus {
  RFQ = 'RFQ',
  RFQ_SENT = 'RFQ_SENT',
  TO_APPROVE = 'TO_APPROVE',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  RECEIVED = 'RECEIVED',
  BILLED = 'BILLED',
  LOCKED = 'LOCKED',
  CANCELLED = 'CANCELLED',
}

@Entity('purchase_orders')
export class PurchaseOrder extends BaseEntity {
  @ApiProperty({ example: 'PO-2025-0001' })
  @Column({ unique: true })
  orderNumber: string;

  @ApiPropertyOptional({ type: () => Partner })
  @ManyToOne(() => Partner)
  @JoinColumn({ name: 'partner_id' })
  partner: Partner; // Vendor

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'partner_id' })
  partnerId: string;

  @ApiProperty({ example: '2025-01-20' })
  @Column({ type: 'date', name: 'order_date' })
  orderDate: string;

  @ApiProperty({ enum: PurchaseOrderStatus, default: PurchaseOrderStatus.RFQ })
  @Column({
    type: 'enum',
    enum: PurchaseOrderStatus,
    default: PurchaseOrderStatus.RFQ,
  })
  status: PurchaseOrderStatus;

  @ApiProperty({ example: 5000.0 })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @ApiPropertyOptional({ type: () => [PurchaseOrderLine] })
  @OneToMany(() => PurchaseOrderLine, (line) => line.order, { cascade: true })
  lines: PurchaseOrderLine[];
}
