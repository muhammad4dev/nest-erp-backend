import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EtaAddressDto {
  @IsString() country: string;
  @IsString() governate: string;
  @IsString() regionCity: string;
  @IsString() street: string;
  @IsString() buildingNumber: string;
}

export class EtaPartyDto {
  @ValidateNested() @Type(() => EtaAddressDto) address: EtaAddressDto;
  @IsString() type: 'B' | 'P'; // Business or Person
  @IsString() id: string; // Registration Number
  @IsString() name: string;
}

export class EtaTaxableItemDto {
  @IsString() taxType: string; // e.g., "T1" (VAT)
  @IsNumber() amount: number;
  @IsNumber() rate: number;
  @IsString() subType: string;
}

export class EtaUnitValueDto {
  @IsString() currencySold: string; // "EGP"
  @IsNumber() amountEGP: number;
}

export class EtaInvoiceLineDto {
  @IsString() description: string;
  @IsString() itemType: 'GPC' | 'EGS' | 'GS1';
  @IsString() itemCode: string;
  @IsString() unitType: string; // UOM Code
  @IsNumber() quantity: number;
  @ValidateNested() @Type(() => EtaUnitValueDto) unitValue: EtaUnitValueDto;
  @IsNumber() salesTotal: number;
  @IsNumber() total: number;
  @IsNumber() valueDifference: number;
  @IsNumber() totalTaxableFees: number;
  @IsNumber() netTotal: number;
  @IsNumber() itemsDiscount: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EtaTaxableItemDto)
  taxableItems: EtaTaxableItemDto[];
}

export class EtaTaxTotalDto {
  @IsString() taxType: string;
  @IsNumber() amount: number;
}

export class EtaInvoiceDto {
  @ValidateNested() @Type(() => EtaPartyDto) issuer: EtaPartyDto;
  @ValidateNested() @Type(() => EtaPartyDto) receiver: EtaPartyDto;
  @IsString() documentType: string; // "I"
  @IsString() documentTypeVersion: string; // "1.0"
  @IsDateString() dateTimeIssued: string;
  @IsString() taxpayerActivityCode: string;
  @IsString() internalID: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EtaInvoiceLineDto)
  invoiceLines: EtaInvoiceLineDto[];

  @IsNumber() totalSalesAmount: number;
  @IsNumber() totalDiscountAmount: number;
  @IsNumber() netAmount: number;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EtaTaxTotalDto)
  taxTotals: EtaTaxTotalDto[];
  @IsNumber() totalAmount: number;
  @IsNumber() extraDiscountAmount: number;
  @IsNumber() totalItemsDiscountAmount: number;
}
