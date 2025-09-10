import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity('payment_terms')
export class PaymentTerm extends BaseEntity {
  @ApiProperty({ example: 'Net 30' })
  @Column()
  name: string;

  @ApiProperty({ example: 30, description: 'Days until due' })
  @Column({ type: 'int', default: 0 })
  days: number;

  @ApiProperty({ example: false })
  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @ApiProperty({ example: 'Full payment due in 30 days' })
  @Column({ type: 'text', nullable: true })
  description: string;
}
