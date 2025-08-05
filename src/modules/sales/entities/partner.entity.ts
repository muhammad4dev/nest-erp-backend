import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PartnerType {
  BUSINESS = 'BUSINESS',
  PERSON = 'PERSON',
}

@Entity('partners')
export class Partner extends BaseEntity {
  @ApiProperty({ example: 'Acme Corp' })
  @Column()
  name: string;

  @ApiPropertyOptional({ example: 'info@acme.com' })
  @Column({ nullable: true })
  email: string;

  @ApiPropertyOptional({ example: '+20123456789' })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ enum: PartnerType, default: PartnerType.BUSINESS })
  @Column({
    type: 'enum',
    enum: PartnerType,
    default: PartnerType.BUSINESS,
    name: 'partner_type',
  })
  partnerType: PartnerType;

  @ApiProperty({ example: true })
  @Column({ name: 'is_customer', default: false })
  isCustomer: boolean;

  @ApiProperty({ example: false })
  @Column({ name: 'is_vendor', default: false })
  isVendor: boolean;

  @ApiPropertyOptional({ example: '123-456-789' })
  @Column({ name: 'tax_id', nullable: true })
  taxId: string;

  @ApiPropertyOptional({
    example: {
      country: 'Egypt',
      governate: 'Cairo',
      regionCity: 'Maadi',
      street: 'Street 9',
      buildingNumber: '123',
    },
  })
  @Column({ type: 'jsonb', nullable: true })
  address: {
    country?: string;
    governate?: string;
    regionCity?: string;
    street?: string;
    buildingNumber?: string;
  };

  @ApiPropertyOptional({
    example: {
      email: 'contact@acme.com',
      phone: '+20111111111',
    },
  })
  @Column({ type: 'jsonb', nullable: true })
  contact: {
    email?: string;
    phone?: string;
    fax?: string;
  };
}
