import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('fiscal_periods')
export class FiscalPeriod extends BaseEntity {
  @ApiProperty({ example: '2025-Q1' })
  @Column()
  name: string; // e.g., '2025-Q1'

  @ApiProperty({ example: '2025-01-01' })
  @Column({ type: 'date' })
  startDate: string;

  @ApiProperty({ example: '2025-03-31' })
  @Column({ type: 'date' })
  endDate: string;

  @ApiProperty({ example: false })
  @Column({ default: false, name: 'is_closed' })
  isClosed: boolean;
}
