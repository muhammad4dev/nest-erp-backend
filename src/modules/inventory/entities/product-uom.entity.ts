import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { UomUnit } from './uom-unit.entity';

/**
 * ProductUom maps a product to a specific unit of measure with conversion factor.
 * Allows products to have multiple selling/purchasing units.
 */
@Entity('product_uoms')
@Index(['productId', 'uomId'], { unique: true })
export class ProductUom extends BaseEntity {
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => UomUnit)
  @JoinColumn({ name: 'uom_id' })
  uom: UomUnit;

  @Column({ type: 'uuid', name: 'uom_id' })
  uomId: string;

  @Column({
    type: 'decimal',
    precision: 18,
    scale: 6,
    default: 1,
    name: 'conversion_factor',
  })
  conversionFactor: number;

  @Column({ default: false, name: 'is_purchase_uom' })
  isPurchaseUom: boolean;

  @Column({ default: false, name: 'is_sales_uom' })
  isSalesUom: boolean;

  @Column({ type: 'varchar', nullable: true })
  barcode: string;
}
