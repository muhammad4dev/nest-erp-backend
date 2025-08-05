import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum LocationType {
  WAREHOUSE = 'WAREHOUSE',
  VENDOR = 'VENDOR',
  CUSTOMER = 'CUSTOMER',
  LOSS = 'LOSS',
}

@Entity('locations')
export class Location extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'enum', enum: LocationType, default: LocationType.WAREHOUSE })
  type: LocationType;

  // Hierarchical location support
  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'parent_location_id' })
  parentLocation: Location;

  @Column({ type: 'uuid', nullable: true, name: 'parent_location_id' })
  parentLocationId: string;
}
