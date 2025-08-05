import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UomUnit } from './uom-unit.entity';
import { ProductTranslation } from '../../i18n/entities/product-translation.entity';
import { ProductCategory } from './product-category.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { ProductVariant } from './product-variant.entity';

export enum ProductType {
  GOODS = 'GOODS',
  SERVICE = 'SERVICE',
  CONSUMABLE = 'CONSUMABLE',
  DIGITAL = 'DIGITAL',
}

@Entity('products')
export class Product extends BaseEntity {
  @ApiProperty({ example: 'SKU-001' })
  @Column({ unique: true })
  sku: string;

  @ApiProperty({ example: 'Office Chair' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'Ergonomic office chair' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ enum: ProductType, default: ProductType.GOODS })
  @Column({ type: 'enum', enum: ProductType, default: ProductType.GOODS })
  type: ProductType;

  // Category relationship
  @ApiPropertyOptional({ type: () => ProductCategory })
  @ManyToOne(() => ProductCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory;

  @ApiPropertyOptional({ description: 'Category ID' })
  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId: string;

  // UOM relationship
  @ManyToOne(() => UomUnit)
  @JoinColumn({ name: 'uom_id' })
  uom: UomUnit;

  @ApiPropertyOptional({ description: 'Unit of Measure ID' })
  @Column({ type: 'uuid', name: 'uom_id', nullable: true })
  uomId: string;

  // Pricing
  @ApiProperty({ example: 99.99 })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  salesPrice: number;

  @ApiProperty({ example: 59.99 })
  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  costPrice: number;

  // Tax
  @ApiPropertyOptional({ example: 'EG-GOODS-001' })
  @Column({ name: 'tax_code', nullable: true })
  taxCode: string;

  // Additional fields for flexibility
  @ApiPropertyOptional({ example: '1234567890' })
  @Column({ nullable: true })
  barcode: string;

  @ApiPropertyOptional({ example: 5.5 })
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  weight: number;

  @ApiProperty({ example: true, default: true })
  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @ApiProperty({ example: true, default: false })
  @Column({ default: false, name: 'is_sellable' })
  isSellable: boolean;

  @ApiProperty({ example: true, default: false })
  @Column({ default: false, name: 'is_purchasable' })
  isPurchasable: boolean;

  @ApiProperty({ example: true, default: true })
  @Column({ default: true, name: 'track_inventory' })
  trackInventory: boolean;

  // For variant products
  @ApiProperty({ example: false, default: false })
  @Column({ default: false, name: 'has_variants' })
  hasVariants: boolean;

  // Image
  @ApiPropertyOptional({ example: 'https://example.com/product.jpg' })
  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl: string;

  // Custom metadata (flexible JSON field)
  @ApiPropertyOptional({ example: { brand: 'Nest' } })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  // Relationships
  @OneToMany(() => ProductTranslation, (tr) => tr.product, { cascade: true })
  translations: ProductTranslation[];

  @OneToMany(() => ProductAttributeValue, (av) => av.product, { cascade: true })
  attributeValues: ProductAttributeValue[];

  @ApiPropertyOptional({ type: () => [ProductVariant] })
  @OneToMany(() => ProductVariant, (v) => v.parentProduct, { cascade: true })
  variants: ProductVariant[];
}
