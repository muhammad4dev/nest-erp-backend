import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { AccountType } from '../entities/account.entity';

export class CreateAccountDto {
  @ApiProperty({ example: '1010', description: 'Account code' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'Cash on Hand', description: 'Account name' })
  @IsString()
  name: string;

  @ApiProperty({ enum: AccountType, example: AccountType.ASSET })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiPropertyOptional({
    example: false,
    description: 'Is this a control account (e.g., AR, AP)?',
  })
  @IsOptional()
  @IsBoolean()
  isControlAccount?: boolean;

  @ApiPropertyOptional({
    example: '01935a5c-1234-7000-8000-000000000001',
    description: 'Parent account ID for hierarchical chart of accounts',
  })
  @IsOptional()
  @IsUUID()
  parentAccountId?: string;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}
