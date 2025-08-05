import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UomUnit } from './uom-unit.entity';

@Entity('uom_categories')
export class UomCategory extends BaseEntity {
  @Column()
  name: string; // e.g., 'Weight', 'Length'

  @OneToMany(() => UomUnit, (unit) => unit.category)
  units: UomUnit[];
}
