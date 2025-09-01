import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('permissions')
export class Permission extends BaseEntity {
  @ApiProperty({ example: 'create' })
  @Column()
  action: string; // e.g., 'create', 'read'

  @ApiProperty({ example: 'invoice' })
  @Column()
  resource: string; // e.g., 'invoice', 'product'

  @ApiPropertyOptional({ example: 'Can create invoices' })
  @Column({ nullable: true })
  description: string;
}

@Entity('roles')
export class Role extends BaseEntity {
  @ApiProperty({ example: 'Admin' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Administrator with full access' })
  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Permission)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
