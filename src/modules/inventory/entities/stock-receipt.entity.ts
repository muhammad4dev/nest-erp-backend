import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Location } from './location.entity';
import { StockReceiptLine } from './stock-receipt-line.entity';

export enum ReceiptSourceType {
  PURCHASE = 'PURCHASE',
  PRODUCTION = 'PRODUCTION',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum ReceiptStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('stock_receipts')
@Index(['tenantId', 'receiptDate'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'receiptNumber'])
export class StockReceipt extends BaseEntity {
  @Column({ unique: true })
  receiptNumber: string;

  @Column({ type: 'date' })
  receiptDate: Date;

  @Column({
    type: 'enum',
    enum: ReceiptSourceType,
    default: ReceiptSourceType.PURCHASE,
  })
  sourceType: ReceiptSourceType;

  @Column({ nullable: true })
  sourceReference: string; // PO number, production order, etc.

  @Column()
  locationId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column({ nullable: true })
  supplierId: string; // Reference to partner/supplier

  @Column({
    type: 'enum',
    enum: ReceiptStatus,
    default: ReceiptStatus.DRAFT,
  })
  status: ReceiptStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  completedBy: string; // User who completed the receipt

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => StockReceiptLine, (line) => line.receipt, {
    cascade: true,
    eager: true,
  })
  lines: StockReceiptLine[];
}
