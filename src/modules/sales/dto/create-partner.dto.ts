import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartnerType } from '../entities/partner.entity';

export class CreatePartnerDto {
  @ApiProperty({
    example: 'Acme Corporation',
    description: 'Legal name of the partner',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'contact@acme.com' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: PartnerType, default: PartnerType.BUSINESS })
  @IsOptional()
  @IsEnum(PartnerType)
  partnerType?: PartnerType;

  @ApiPropertyOptional({
    example: true,
    description: 'Is this partner a customer?',
  })
  @IsOptional()
  @IsBoolean()
  isCustomer?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Is this partner a vendor?',
  })
  @IsOptional()
  @IsBoolean()
  isVendor?: boolean;

  @ApiPropertyOptional({
    example: '123456789',
    description: 'Tax ID / VAT number for ETA compliance',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    example: {
      country: 'EG',
      governate: 'Cairo',
      street: '123 Main St',
      buildingNumber: '1',
    },
    description: 'Address for ETA eInvoicing',
  })
  @IsOptional()
  @IsObject()
  address?: {
    country?: string;
    governate?: string;
    regionCity?: string;
    street?: string;
    buildingNumber?: string;
  };

  @ApiPropertyOptional({
    example: { email: 'billing@acme.com', phone: '+201234567890' },
    description: 'Contact details',
  })
  @IsOptional()
  @IsObject()
  contact?: {
    email?: string;
    phone?: string;
    fax?: string;
  };
}
