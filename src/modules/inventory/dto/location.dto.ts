import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { LocationType } from '../entities/location.entity';

export class CreateLocationDto {
  @ApiProperty({ example: 'Main Warehouse', description: 'Location name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: LocationType, default: LocationType.WAREHOUSE })
  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @ApiPropertyOptional({
    example: '01935a5c-1234-7000-8000-000000000001',
    description: 'Parent location ID for hierarchical locations',
  })
  @IsOptional()
  @IsUUID()
  parentLocationId?: string;
}

export class UpdateLocationDto extends PartialType(CreateLocationDto) {}
