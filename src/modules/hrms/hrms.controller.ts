import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HrmsService } from './hrms.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { Employee } from './entities/employee.entity';
import { EmploymentContract } from './entities/employment-contract.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

@ApiTags('hrms')
@Controller('hrms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class HrmsController {
  constructor(private readonly hrmsService: HrmsService) {}

  @Post('employees')
  @ApiOperation({ summary: 'Register a new employee' })
  @ApiResponse({
    status: 201,
    description: 'Employee registered successfully.',
    type: Employee,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.EMPLOYEES.CREATE)
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.hrmsService.createEmployee(dto);
  }

  @Post('employees/:id/contracts')
  @ApiOperation({ summary: 'Add an employment contract to an employee' })
  @ApiResponse({
    status: 201,
    description: 'Contract added successfully.',
    type: EmploymentContract,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @RequirePermissions(PERMISSIONS.CONTRACTS.CREATE)
  addContract(@Param('id') employeeId: string, @Body() dto: CreateContractDto) {
    return this.hrmsService.addContract(employeeId, dto);
  }

  @Post('contracts/:id/activate')
  @ApiOperation({ summary: 'Activate a draft contract' })
  @ApiResponse({
    status: 200,
    description: 'Contract activated successfully.',
    type: EmploymentContract,
  })
  @ApiResponse({
    status: 400,
    description: 'Only draft contracts can be activated.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @RequirePermissions(PERMISSIONS.CONTRACTS.UPDATE)
  activateContract(@Param('id') id: string) {
    return this.hrmsService.activateContract(id);
  }
}
