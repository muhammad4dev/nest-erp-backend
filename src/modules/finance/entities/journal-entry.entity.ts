import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { JournalLine } from './journal-line.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum JournalStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  VOIDED = 'VOIDED',
}

@Entity('journal_entries')
export class JournalEntry extends BaseEntity {
  @ApiPropertyOptional({ example: 'INV/2025/001' })
  @Column({ nullable: true })
  reference: string;

  @ApiProperty({ example: '2025-01-15' })
  @Column({ type: 'date', name: 'transaction_date' })
  transactionDate: string;

  @ApiProperty({ enum: JournalStatus, default: JournalStatus.DRAFT })
  @Column({ type: 'enum', enum: JournalStatus, default: JournalStatus.DRAFT })
  status: JournalStatus;

  @ApiPropertyOptional({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', nullable: true, name: 'branch_id' })
  branchId: string;

  @ApiPropertyOptional({ type: () => [JournalLine] })
  @OneToMany(() => JournalLine, (line) => line.journalEntry, { cascade: true })
  lines: JournalLine[];
}
