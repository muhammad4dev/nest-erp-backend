import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UomCategory } from './uom-category.entity';

@Entity('uom_units')
export class UomUnit extends BaseEntity {
  @Column()
  name: string; // e.g., 'Kilogram', 'Gram'

  @ManyToOne(() => UomCategory, (cat) => cat.units)
  @JoinColumn({ name: 'category_id' })
  category: UomCategory;

  @Column({ type: 'decimal', precision: 12, scale: 5, default: 1 })
  factor: number; // Ratio to reference unit (Reference unit has factor 1.0)

  @Column({ name: 'is_reference', default: false })
  isReference: boolean;

  @Column({ name: 'eta_code', nullable: true })
  etaCode: string; // e.g., 'KGM' for ETA eInvoicing
}
