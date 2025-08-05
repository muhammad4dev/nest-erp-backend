import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('product_variants')
@Index(['parentProductId', 'sku'], { unique: true })
export class ProductVariant extends BaseEntity {
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_product_id' })
  parentProduct: Product;

  @ApiProperty({ description: 'Parent product ID' })
  @Column({ type: 'uuid', name: 'parent_product_id' })
  parentProductId: string;

  @ApiProperty({ example: 'SKU-001-RED-L' })
  @Column({ unique: true })
  sku: string;

  @ApiPropertyOptional({ example: 'Red - Large' })
  @Column({ nullable: true })
  name: string; // e.g., "Red - Large"

  // Variant attribute values stored as JSON for flexibility
  // e.g., { "color": "Red", "size": "Large" }
  @ApiProperty({ example: { color: 'Red', size: 'Large' } })
  @Column({ type: 'jsonb', name: 'variant_attributes' })
  variantAttributes: Record<string, string>;

  @ApiPropertyOptional({ example: 109.99 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
    name: 'sales_price',
  })
  salesPrice: number;

  @ApiPropertyOptional({ example: 69.99 })
  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    nullable: true,
    name: 'cost_price',
  })
  costPrice: number;

  @ApiPropertyOptional({ example: '1234567890' })
  @Column({ nullable: true })
  barcode: string;

  @ApiProperty({ example: true, default: true })
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  // Weight for shipping calculations
  @ApiPropertyOptional({ example: 0.5 })
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;

  // Image URL for variant
  @ApiPropertyOptional({ example: 'https://example.com/variant.jpg' })
  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl: string;
}
