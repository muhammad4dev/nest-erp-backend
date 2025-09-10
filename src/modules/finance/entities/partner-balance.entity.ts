import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Partner } from '../../sales/entities/partner.entity';
import { Account } from './account.entity';

/**
 * PartnerBalance tracks the running AR/AP balance for each partner
 * against a specific control account (e.g., Accounts Receivable, Accounts Payable)
 */
@Entity('partner_balances')
@Index(['partnerId', 'accountId'], { unique: true })
export class PartnerBalance {
  @ApiProperty({ description: 'Partner ID' })
  @PrimaryColumn({ type: 'uuid', name: 'partner_id' })
  partnerId: string;

  @ApiProperty({ description: 'Account ID' })
  @PrimaryColumn({ type: 'uuid', name: 'account_id' })
  accountId: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Partner)
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ApiProperty({ example: 1500.5 })
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 2,
    default: 0,
  })
  balance: number;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  @Column({
    type: 'timestamptz',
    name: 'last_updated_at',
    default: () => 'NOW()',
  })
  lastUpdatedAt: Date;
}
