import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('branches')
@Index(['tenantId', 'code'], { unique: true })
export class Branch extends BaseEntity {
  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;
}
