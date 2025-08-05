import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Product } from './product.entity';
import { Location } from './location.entity';

@Entity('stock_quants')
export class StockQuant extends BaseEntity {
  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ type: 'uuid', name: 'location_id' })
  locationId: string;

  @Column({ type: 'decimal', precision: 14, scale: 4, default: 0 })
  quantity: number;

  // Optimistic Locking is handled by BaseEntity's @VersionColumn 'version'
}
