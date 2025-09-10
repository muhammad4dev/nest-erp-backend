import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

@Entity('accounts')
export class Account extends BaseEntity {
  @ApiProperty({ example: '1010' })
  @Column()
  code: string; // e.g., '1010'

  @ApiProperty({ example: 'Cash in Hand' })
  @Column()
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSET })
  @Column({ type: 'enum', enum: AccountType })
  type: AccountType;

  @ApiProperty({ example: false })
  @Column({ default: false, name: 'is_control_account' })
  isControlAccount: boolean;

  @ApiPropertyOptional({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', nullable: true, name: 'parent_account_id' })
  parentAccountId: string;
}
