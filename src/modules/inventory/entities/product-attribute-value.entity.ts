import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from './product.entity';
import { ProductAttribute } from './product-attribute.entity';

@Entity('product_attribute_values')
@Index(['productId', 'attributeId'], { unique: true })
export class ProductAttributeValue extends BaseEntity {
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ApiProperty({ description: 'Product ID' })
  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => ProductAttribute, (attr) => attr.values, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'attribute_id' })
  attribute: ProductAttribute;

  @ApiProperty({ description: 'Attribute ID' })
  @Column({ type: 'uuid', name: 'attribute_id' })
  attributeId: string;

  // Store value as text - interpret based on attribute type
  @ApiPropertyOptional({ example: 'Some text value' })
  @Column({ type: 'text', nullable: true, name: 'text_value' })
  textValue: string;

  @ApiPropertyOptional({ example: 123.45 })
  @Column({ type: 'decimal', nullable: true, name: 'number_value' })
  numberValue: number;

  @ApiPropertyOptional({ example: true })
  @Column({ type: 'boolean', nullable: true, name: 'boolean_value' })
  booleanValue: boolean;

  @ApiPropertyOptional({ example: '2023-01-01' })
  @Column({ type: 'date', nullable: true, name: 'date_value' })
  dateValue: string;

  // For multi-select, store selected option indices
  @ApiPropertyOptional({ example: [0, 2] })
  @Column({ type: 'jsonb', nullable: true, name: 'selected_options' })
  selectedOptions: number[];
}
