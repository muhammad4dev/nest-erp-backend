import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('system_audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column()
  tableName: string;

  @Column()
  recordId: string;

  @Column()
  action: string; // INSERT, UPDATE, DELETE

  @Column({ type: 'jsonb', nullable: true })
  oldData: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  newData: Record<string, unknown>;

  @Column({ type: 'uuid', nullable: true })
  changedBy: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
