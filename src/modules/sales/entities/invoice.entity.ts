import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Partner } from './partner.entity';
import { SalesOrder } from './sales-order.entity';
import { InvoiceLine } from './invoice-line.entity';
import { PaymentTerm } from '../../finance/entities/payment-term.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InvoiceType {
  INVOICE = 'INVOICE',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

@Entity('invoices')
@Index(['partnerId', 'status'])
export class Invoice extends BaseEntity {
  @ApiProperty({ example: 'INV-2025-0001' })
  @Column({ unique: true })
  number: string;

  @ApiPropertyOptional({ type: () => Partner })
  @ManyToOne(() => Partner)
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'partner_id' })
  partnerId: string;

  @ApiPropertyOptional({ type: () => SalesOrder })
  @ManyToOne(() => SalesOrder, { nullable: true })
  @JoinColumn({ name: 'sales_order_id' })
  salesOrder: SalesOrder;

  @ApiPropertyOptional({ example: '01935a5c-1234-7000-8000-000000000002' })
  @Column({ type: 'uuid', name: 'sales_order_id', nullable: true })
  salesOrderId: string;

  @ApiPropertyOptional({ type: () => Invoice })
  @ManyToOne(() => Invoice, { nullable: true })
  @JoinColumn({ name: 'original_invoice_id' })
  originalInvoice: Invoice;

  @ApiPropertyOptional({ example: '01935a5c-1234-7000-8000-000000000003' })
  @Column({ type: 'uuid', name: 'original_invoice_id', nullable: true })
  originalInvoiceId: string;

  @ApiProperty({ enum: InvoiceType, default: InvoiceType.INVOICE })
  @Column({ type: 'enum', enum: InvoiceType, default: InvoiceType.INVOICE })
  type: InvoiceType;

  @ApiProperty({ enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status: InvoiceStatus;

  @ApiPropertyOptional({ example: '2025-01-20T10:00:00Z' })
  @Column({ type: 'timestamptz', name: 'issued_at', nullable: true })
  issuedAt: Date;

  @ApiPropertyOptional({ example: '2025-02-20' })
  @Column({ type: 'date', name: 'due_date', nullable: true })
  dueDate: string;

  // ETA eInvoicing fields
  @ApiPropertyOptional({ example: '12345678-1234-1234-1234-123456789012' })
  @Column({ type: 'text', name: 'eta_uuid', nullable: true })
  etaUuid: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', name: 'eta_signature', nullable: true })
  etaSignature: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', name: 'eta_submission_id', nullable: true })
  etaSubmissionId: string;

  // Amounts
  @ApiProperty({ example: 50.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'total_discount_amount',
  })
  totalDiscountAmount: number;

  @ApiProperty({ example: 1000.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'net_amount',
  })
  netAmount: number;

  @ApiProperty({ example: 140.0 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0,
    name: 'tax_amount',
  })
  taxAmount: number;

  @ApiProperty({ example: 1140.0 })
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
    if (this.status === InvoiceStatus.PAID) return false;
    if (!this.dueDate) return false;
    return new Date(this.dueDate) < new Date();
  }

  @ApiPropertyOptional({ example: 'Handle with care' })
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiPropertyOptional({ type: () => [InvoiceLine] })
  @OneToMany(() => InvoiceLine, (line) => line.invoice, { cascade: true })
  lines: InvoiceLine[];
}
