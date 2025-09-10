import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { JournalEntry } from './journal-entry.entity';
import { Account } from './account.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('journal_lines')
export class JournalLine extends BaseEntity {
  @ManyToOne(() => JournalEntry, (journal) => journal.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'journal_entry_id' })
  journalEntry: JournalEntry;

  @ApiProperty({ description: 'Journal Entry ID' })
  @Column({ type: 'uuid', name: 'journal_entry_id' })
  journalEntryId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @ApiProperty({ description: 'Account ID' })
  @Column({ type: 'uuid', name: 'account_id' })
  accountId: string;

  @ApiPropertyOptional({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', nullable: true, name: 'partner_id' })
  partnerId: string; // Reference to unified Partner entity

  @ApiProperty({ example: 1000 })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  debit: number;

  @ApiProperty({ example: 0 })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  credit: number;

  @ApiPropertyOptional({ example: 'Initial balance' })
  @Column({ nullable: true })
  description: string;
}
