import {
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  IsNumber,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJournalLineDto {
  @ApiProperty({
    example: '0192a7e0-1234-7abc-8def-0123456789ab',
    description: 'Account UUID',
  })
  @IsUUID()
  accountId: string;

  @ApiProperty({ example: 1000.0, description: 'Debit amount' })
  @IsNumber()
  debit: number;

  @ApiProperty({ example: 0, description: 'Credit amount' })
  @IsNumber()
  credit: number;

  @ApiProperty({
    example: 'Office supplies expense',
    description: 'Line description',
  })
  @IsString()
  description: string;
}

export class CreateJournalEntryDto {
  @ApiProperty({
    example: 'JE-2024-001',
    description: 'Journal entry reference',
  })
  @IsString()
  reference: string;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Transaction date (ISO 8601)',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    example: 'Monthly expense recording',
    description: 'Entry description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    type: [CreateJournalLineDto],
    description: 'Journal entry lines',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines: CreateJournalLineDto[];
}
