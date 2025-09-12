import { IsString, IsDateString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateFiscalPeriodDto {
  @ApiProperty({ example: '2025-Q1', description: 'Period name' })
  @IsString()
  name: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Start date (YYYY-MM-DD)',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-03-31', description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;
}

export class UpdateFiscalPeriodDto extends PartialType(CreateFiscalPeriodDto) {}

export class ClosePeriodDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Force close even if unposted entries exist',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
