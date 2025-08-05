import { IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty({
    example: '2024-01-15',
    description: 'Contract start date (ISO 8601)',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: '2025-01-15',
    description: 'Contract end date (ISO 8601)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 15000.0, description: 'Monthly wage' })
  @IsNumber()
  wage: number;

  @ApiProperty({
    example: 'Senior Developer',
    description: 'Job position title',
  })
  @IsString()
  jobPosition: string;
}
