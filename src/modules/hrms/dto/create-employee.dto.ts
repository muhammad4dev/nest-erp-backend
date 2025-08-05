import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John', description: 'First name of the employee' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the employee' })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email address',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: '+201234567890',
    description: 'Phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Software Engineer', description: 'Job title' })
  @IsString()
  jobTitle: string;

  @ApiProperty({ example: 'Engineering', description: 'Department' })
  @IsString()
  department: string;

  @ApiProperty({ example: '2024-01-15', description: 'Hire date (ISO 8601)' })
  @IsDateString()
  hireDate: string;
}
