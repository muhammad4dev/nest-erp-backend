import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from '../../../modules/inventory/entities/product.entity';
import { Location } from '../../../modules/inventory/entities/location.entity';

export enum CostingMethod {
  FIFO = 'FIFO', // First In First Out
  LIFO = 'LIFO', // Last In First Out
  AVERAGE = 'AVERAGE', // Weighted Average
  STANDARD = 'STANDARD', // Standard Costing
}

@Entity('inventory_valuations')
@Unique(['tenantId', 'productId', 'locationId'])
@Index(['tenantId', 'productId'])
@Index(['tenantId', 'locationId'])
export class InventoryValuation extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId?: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({
    name: 'costing_method',
    type: 'enum',
    enum: CostingMethod,
    default: CostingMethod.AVERAGE,
  })
  costingMethod: CostingMethod;

  @Column({
    name: 'current_quantity',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  currentQuantity: number;

  @Column({
    name: 'current_value',
    type: 'decimal',
    precision: 15,
    scale: 4,
    default: 0,
  })
  currentValue: number;

  @Column({
    name: 'average_cost',
    type: 'decimal',
    precision: 15,
    scale: 4,
    default: 0,
  })
  averageCost: number;

  @Column({
    name: 'standard_cost',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  standardCost?: number;

  @Column({
    name: 'last_cost',
    type: 'decimal',
    precision: 15,
    scale: 4,
    nullable: true,
  })
  lastCost?: number;

  @Column({ name: 'last_movement_date', type: 'timestamp', nullable: true })
  lastMovementDate?: Date;

  @Column({ name: 'last_valuation_date', type: 'timestamp', nullable: true })
  lastValuationDate?: Date;
}
