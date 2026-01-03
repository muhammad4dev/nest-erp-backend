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
import { StockIssueLine } from './stock-issue-line.entity';

export enum IssueType {
  SALE = 'SALE',
  PRODUCTION = 'PRODUCTION',
  WRITEOFF = 'WRITEOFF',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum IssueStatus {
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('stock_issues')
@Index(['tenantId', 'issueDate'])
@Index(['tenantId', 'status'])
@Index(['tenantId', 'issueNumber'])
export class StockIssue extends BaseEntity {
  @Column({ unique: true })
  issueNumber: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({
    type: 'enum',
    enum: IssueType,
    default: IssueType.SALE,
  })
  issueType: IssueType;

  @Column({ nullable: true })
  sourceReference: string; // SO number, production order, etc.

  @Column()
  locationId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location: Location;

  @Column({ nullable: true })
  customerId: string; // Reference to partner/customer

  @Column({
    type: 'enum',
    enum: IssueStatus,
    default: IssueStatus.DRAFT,
  })
  status: IssueStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalQuantity: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  completedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date;

  @OneToMany(() => StockIssueLine, (line) => line.issue, {
    cascade: true,
    eager: true,
  })
  lines: StockIssueLine[];
}
