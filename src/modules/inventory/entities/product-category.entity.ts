import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('product_categories')
export class ProductCategory extends BaseEntity {
  @ApiProperty({ example: 'Electronics' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Electronic gadgets and devices' })
  @Column({ nullable: true })
  description: string;

  @ApiProperty({ example: 'ELEC' })
  @Column({ unique: true })
  code: string;

  // Hierarchical support
  @ManyToOne(() => ProductCategory, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: ProductCategory;

  @ApiPropertyOptional({ description: 'Parent category ID' })
  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId: string;

  @OneToMany(() => ProductCategory, (cat) => cat.parent)
  children: ProductCategory[];

  @ApiProperty({ example: true, default: true })
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  // For tree structure ordering
  @ApiProperty({ example: 0, default: 0 })
  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;
}
