import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductAttributeValue } from './product-attribute-value.entity';

export enum AttributeType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT', // Single select from options
  MULTI_SELECT = 'MULTI_SELECT', // Multiple select
  DATE = 'DATE',
  COLOR = 'COLOR',
}

@Entity('product_attributes')
export class ProductAttribute extends BaseEntity {
  @ApiProperty({ example: 'Color' })
  @Column()
  name: string;

  @ApiProperty({ example: 'color' })
  @Column({ unique: true })
  code: string;

  @ApiProperty({ enum: AttributeType, example: AttributeType.SELECT })
  @Column({ type: 'enum', enum: AttributeType, default: AttributeType.TEXT })
  type: AttributeType;

  @ApiProperty({ example: false })
  @Column({ default: false, name: 'is_required' })
  isRequired: boolean;

  @ApiProperty({ example: true })
  @Column({ default: false, name: 'is_filterable' })
  isFilterable: boolean;

  @ApiProperty({ example: true })
  @Column({ default: false, name: 'is_variant' })
  isVariant: boolean; // Used to create product variants

  // For SELECT/MULTI_SELECT types - store options as JSON
  @ApiPropertyOptional({ example: ['Red', 'Blue', 'Green'] })
  @Column({ type: 'jsonb', nullable: true })
  options: string[];

  @ApiProperty({ example: 0, default: 0 })
  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @OneToMany(() => ProductAttributeValue, (value) => value.attribute)
  values: ProductAttributeValue[];
}
