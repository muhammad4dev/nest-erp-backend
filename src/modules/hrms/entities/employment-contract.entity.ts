import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Employee } from './employee.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

@Entity('employment_contracts')
export class EmploymentContract extends BaseEntity {
  @ManyToOne(() => Employee, (emp) => emp.contracts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @Column({ type: 'uuid', name: 'employee_id' })
  employeeId: string;

  @ApiProperty({ example: '2025-01-01' })
  @Column({ type: 'date', name: 'start_date' })
  startDate: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @Column({ type: 'date', name: 'end_date', nullable: true })
  endDate: string;

  @ApiProperty({ example: 5000.0 })
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  wage: number; // Monthly Basic Salary

  @ApiProperty({ enum: ContractStatus, default: ContractStatus.DRAFT })
  @Column({ type: 'enum', enum: ContractStatus, default: ContractStatus.DRAFT })
  status: ContractStatus;

  @ApiProperty({ example: 'Senior Developer' })
  @Column({ name: 'job_position' })
  jobPosition: string;
}
