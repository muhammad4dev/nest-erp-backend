import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Partner } from './partner.entity';
import { SalesOrderLine } from './sales-order-line.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  CONFIRMED = 'CONFIRMED',
  INVOICED = 'INVOICED',
  CANCELLED = 'CANCELLED',
}

@Entity('sales_orders')
export class SalesOrder extends BaseEntity {
  @ApiProperty({ example: 'SO-2025-0001' })
  @Column({ unique: true })
  orderNumber: string; // Generated Sequence

  @ApiPropertyOptional({ type: () => Partner })
  @ManyToOne(() => Partner)
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'partner_id' })
  partnerId: string;

  @ApiProperty({ example: '2025-01-20' })
  @Column({ type: 'date', name: 'order_date' })
  orderDate: string;

  @ApiProperty({ enum: SalesOrderStatus, default: SalesOrderStatus.DRAFT })
  @Column({
    type: 'enum',
    enum: SalesOrderStatus,
    default: SalesOrderStatus.DRAFT,
  })
  status: SalesOrderStatus;

  @ApiProperty({ example: 1250.75 })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  totalAmount: number;

  @ApiPropertyOptional({ type: () => [SalesOrderLine] })
  @OneToMany(() => SalesOrderLine, (line) => line.order, { cascade: true })
  lines: SalesOrderLine[];
}
