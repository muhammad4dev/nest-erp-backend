import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Idempotency log for storing request results.
 * Allows safe retries of critical operations.
 */
@Entity('idempotency_logs')
export class IdempotencyLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  idempotencyKey: string;

  @Column({ type: 'varchar', length: 255 })
  endpoint: string;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'jsonb' })
  requestBody: Record<string, any>;

  @Column({ type: 'jsonb' })
  responseBody: Record<string, any>;

  @Column({ type: 'int' })
  statusCode: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  expiresAt: Date; // Entries expire after 24 hours
}
