import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'Manager' })
  name: string;

  @ApiPropertyOptional({ example: 'Manager with access to Sales & Finance' })
  description?: string;

  @ApiPropertyOptional({ example: ['create:invoice', 'read:report'] })
  permissions?: string[];
}
