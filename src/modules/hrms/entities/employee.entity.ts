import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EmploymentContract } from './employment-contract.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('employees')
export class Employee extends BaseEntity {
  @ApiProperty({ example: 'EMP-001' })
  @Column({ unique: true })
  code: string; // Employee ID/Badge Number

  @ApiProperty({ example: 'John' })
  @Column({ name: 'first_name' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Column({ name: 'last_name' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  @Column({ unique: true })
  email: string;

  @ApiPropertyOptional({ example: '+20123456789' })
  @Column({ nullable: true })
  phone: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  @Column({ name: 'job_title', nullable: true })
  jobTitle: string; // Current Job Title

  @ApiPropertyOptional({ example: 'Engineering' })
  @Column({ name: 'department', nullable: true })
  department: string;

  @ApiProperty({ example: '2025-01-01' })
  @Column({ type: 'date', name: 'hire_date' })
  hireDate: string;

  @ApiPropertyOptional({ type: () => [EmploymentContract] })
  @OneToMany(() => EmploymentContract, (contract) => contract.employee, {
    cascade: true,
  })
  contracts: EmploymentContract[];
}
