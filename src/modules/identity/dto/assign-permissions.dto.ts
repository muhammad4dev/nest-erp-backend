import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    example: [
      '019b7011-6b2f-76b6-aa43-a183a5bd4169',
      '019b7011-6b3c-7ad0-be2d-81fea6701723',
    ],
    type: [String],
  })
  @IsArray()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}
