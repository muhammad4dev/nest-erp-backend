import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('tenants')
export class Tenant {
  @ApiProperty({ example: '01935a5c-1234-7000-8000-000000000001' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Acme Corp' })
  @Column({ unique: true })
  name: string;

  @ApiPropertyOptional({ example: 'acme_corp' })
  @Column({ name: 'schema_name', nullable: true })
  schemaName: string;

  @ApiProperty({ example: '2023-01-01T00:00:00Z' })
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ApiProperty({ example: true })
  @Column({ default: true })
  isActive: boolean;
}
