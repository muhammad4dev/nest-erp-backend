import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('users')
export class User extends BaseEntity {
  @ApiProperty({ example: 'user@example.com' })
  @Column({ unique: false })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @ApiPropertyOptional({ example: { theme: 'dark' } })
  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, unknown>;

  @ApiProperty({ example: true })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  /**
   * Denormalized permissions cache.
   * Automatically synced when roles/permissions change.
   * Format: ["action:resource", ...]
   */
  @ApiProperty({ example: ['read:user', 'create:invoice'] })
  @Column('text', { array: true, default: '{}' })
  permissions: string[];

  @ApiPropertyOptional({ type: () => [Role] })
  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
