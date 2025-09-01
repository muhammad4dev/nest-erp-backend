import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';

@Entity('refresh_tokens')
@Index(['userId', 'isRevoked'])
export class RefreshToken extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ name: 'token_hash' })
  tokenHash: string;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;

  @Column({ default: false, name: 'is_revoked' })
  isRevoked: boolean;

  @Column({ type: 'varchar', nullable: true, name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'inet', nullable: true, name: 'ip_address' })
  ipAddress: string;
}
