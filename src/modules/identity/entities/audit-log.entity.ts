import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('system_audit_logs')
export class SystemAuditLog {
  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ApiProperty({ example: 'users' })
  @Column({ name: 'table_name' })
  tableName: string;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ name: 'record_id' })
  recordId: string;

  @ApiProperty({ example: 'UPDATE' })
  @Column()
  action: string;

  @ApiProperty({ example: { name: 'Old Name' } })
  @Column({ name: 'old_data', type: 'jsonb', nullable: true })
  oldData: Record<string, any>;

  @ApiProperty({ example: { name: 'New Name' } })
  @Column({ name: 'new_data', type: 'jsonb', nullable: true })
  newData: Record<string, any>;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ name: 'changed_by', type: 'uuid', nullable: true })
  changedBy: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
