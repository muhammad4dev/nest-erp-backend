import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'Manager', description: 'Role name' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    example: 'Manager with access to Sales & Finance',
    description: 'Role description',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
