import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Company/Tenant name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'acme_corp',
    description: 'Schema name for database isolation (optional)',
  })
  @IsOptional()
  @IsString()
  schemaName?: string;
}

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Acme Corporation' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true, description: 'Is tenant active?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
