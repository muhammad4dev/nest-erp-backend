import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { StockIssue } from './stock-issue.entity';
import { Product } from './product.entity';

@Entity('stock_issue_lines')
@Index(['tenantId', 'issueId'])
@Index(['tenantId', 'productId'])
export class StockIssueLine extends BaseEntity {
  @Column()
  issueId: string;

  @ManyToOne(() => StockIssue, (issue) => issue.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'issueId' })
  issue: StockIssue;

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

  @Column({ type: 'jsonb', nullable: true })
  serialNumbers: string[];

  @Column({ type: 'text', nullable: true })
  notes: string;
}
