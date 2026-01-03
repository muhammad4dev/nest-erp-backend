import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { StockReceipt } from './stock-receipt.entity';
import { Product } from './product.entity';

@Entity('stock_receipt_lines')
@Index(['tenantId', 'receiptId'])
@Index(['tenantId', 'productId'])
export class StockReceiptLine extends BaseEntity {
  @Column()
  receiptId: string;

  @ManyToOne(() => StockReceipt, (receipt) => receipt.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'receiptId' })
  receipt: StockReceipt;

  @Column()
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  variantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  unitCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  lineTotal: number;

  @Column({ nullable: true })
  batchNumber: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  serialNumbers: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;
}
