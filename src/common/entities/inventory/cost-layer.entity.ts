import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from '../../../modules/inventory/entities/product.entity';
import { Location } from '../../../modules/inventory/entities/location.entity';
import { StockReceipt } from '../../../modules/inventory/entities/stock-receipt.entity';

@Entity('cost_layers')
@Index(['tenantId', 'productId', 'locationId'])
@Index(['tenantId', 'productId', 'locationId', 'remainingQuantity'])
export class CostLayer extends BaseEntity {
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location?: Location;

  @Column({ name: 'receipt_id', type: 'uuid', nullable: true })
  receiptId?: string;

  @ManyToOne(() => StockReceipt, { nullable: true })
  @JoinColumn({ name: 'receipt_id' })
  receipt?: StockReceipt;

  @Column({ name: 'receipt_date', type: 'date' })
  receiptDate: Date;

  @Column({
    name: 'original_quantity',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  originalQuantity: number;

  @Column({
    name: 'remaining_quantity',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  remainingQuantity: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 15, scale: 4 })
  unitCost: number;

  @Column({ name: 'layer_value', type: 'decimal', precision: 15, scale: 4 })
  layerValue: number;

  @Column({ name: 'batch_number', nullable: true })
  batchNumber?: string;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}
