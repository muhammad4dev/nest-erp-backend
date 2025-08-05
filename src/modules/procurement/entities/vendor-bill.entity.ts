import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Partner } from '../../sales/entities/partner.entity';
import { PurchaseOrder } from './purchase-order.entity';
import { VendorBillLine } from './vendor-bill-line.entity';
import { PaymentTerm } from '../../finance/entities/payment-term.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VendorBillType {
  BILL = 'BILL',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
}

export enum VendorBillStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('vendor_bills')
@Index(['partnerId', 'status'])
export class VendorBill extends BaseEntity {
  @ApiProperty({ example: 'BILL-12345' })
  @Column({ name: 'bill_reference' })
  billReference: string;

  @ApiPropertyOptional({ type: () => Partner })
  @ManyToOne(() => Partner)
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'partner_id' })
  partnerId: string;

  @ApiPropertyOptional({ type: () => PurchaseOrder })
  @ManyToOne(() => PurchaseOrder, { nullable: true })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: PurchaseOrder;

  @ApiPropertyOptional({ example: '01935a5c-1234-7000-8000-000000000002' })
  @Column({ type: 'uuid', name: 'purchase_order_id', nullable: true })
  purchaseOrderId: string;

  @ApiPropertyOptional({ type: () => VendorBill })
  @ManyToOne(() => VendorBill, { nullable: true })
  @JoinColumn({ name: 'original_bill_id' })
  originalBill: VendorBill;

  @ApiPropertyOptional({ example: '01935a5c-1234-7000-8000-000000000003' })
  @Column({ type: 'uuid', name: 'original_bill_id', nullable: true })
  originalBillId: string;

  @ApiProperty({ enum: VendorBillType, default: VendorBillType.BILL })
  @Column({ type: 'enum', enum: VendorBillType, default: VendorBillType.BILL })
  type: VendorBillType;

  @ApiProperty({ enum: VendorBillStatus, default: VendorBillStatus.DRAFT })
  @Column({
    type: 'enum',
    enum: VendorBillStatus,
    default: VendorBillStatus.DRAFT,
  })
  status: VendorBillStatus;

  @ApiPropertyOptional({ example: '2025-01-20T10:00:00Z' })
  @Column({ type: 'timestamptz', name: 'received_at', nullable: true })
  receivedAt: Date;

  @ApiPropertyOptional({ example: '2025-02-20' })
  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate: string;

  // Amounts
  @ApiProperty({ example: 0.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'total_discount_amount',
  })
  totalDiscountAmount: number;

  @ApiProperty({ example: 4500.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'net_amount',
  })
  netAmount: number;

  @ApiProperty({ example: 630.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'tax_amount',
  })
  taxAmount: number;

  @ApiProperty({ example: 5130.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'total_amount',
  })
  totalAmount: number;

  @ApiProperty({ example: 0.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'amount_paid',
  })
  amountPaid: number;

  @ApiPropertyOptional({ type: () => PaymentTerm })
  @ManyToOne(() => PaymentTerm)
  @JoinColumn({ name: 'payment_term_id' })
  paymentTerm: PaymentTerm;

  @ApiProperty({ example: 'uuid' })
  @Column({ type: 'uuid', name: 'payment_term_id', nullable: true })
  paymentTermId: string;

  // Virtual field
  get balanceDue(): number {
    return Number(this.totalAmount) - Number(this.amountPaid);
  }

  get isOverdue(): boolean {
    if (this.status === VendorBillStatus.PAID) return false;
    if (!this.dueDate) return false;
    return new Date(this.dueDate) < new Date();
  }

  @ApiPropertyOptional({ example: 'Vendor was helpful' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiPropertyOptional({ type: () => [VendorBillLine] })
  @OneToMany(() => VendorBillLine, (line) => line.bill, { cascade: true })
  lines: VendorBillLine[];
}
