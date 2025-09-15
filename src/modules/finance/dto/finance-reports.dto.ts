import { IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TrialBalanceQueryDto {
  @ApiPropertyOptional({ description: 'Start date for the period' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for the period' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class TrialBalanceEntry {
  @ApiProperty({ description: 'Account ID' })
  accountId: string;

  @ApiProperty({ description: 'Account Code' })
  accountCode: string;

  @ApiProperty({ description: 'Account Name' })
  accountName: string;

  @ApiProperty({ description: 'Total Debit amount' })
  debit: number;

  @ApiProperty({ description: 'Total Credit amount' })
  credit: number;

  @ApiProperty({ description: 'Net Balance (Debit - Credit)' })
  balance: number;
}

export class GeneralLedgerQueryDto {
  @ApiPropertyOptional({ description: 'Filter by specific account' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GeneralLedgerEntry {
  @ApiProperty()
  date: Date;

  @ApiProperty()
  journalEntryNumber: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  accountName: string;

  @ApiProperty()
  debit: number;

  @ApiProperty()
  credit: number;

  @ApiProperty({ description: 'Running balance' })
  balance: number;
}
