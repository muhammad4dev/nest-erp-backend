import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HrmsService } from './hrms.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
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

  @Get('employees')
  @ApiOperation({ summary: 'List employees' })
  @ApiResponse({ status: 200, description: 'Paginated list of employees.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.EMPLOYEES.READ)
  findEmployees(@Query() query: Record<string, unknown>) {
    return this.hrmsService.findEmployees(query);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee by ID' })
  @ApiResponse({
    status: 200,
    description: 'Employee details.',
    type: Employee,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @RequirePermissions(PERMISSIONS.EMPLOYEES.READ)
  findEmployeeById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.hrmsService.findEmployeeById(id);
  }

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

  @Put('employees/:id')
  @ApiOperation({ summary: 'Update employee' })
  @ApiResponse({
    status: 200,
    description: 'Employee updated.',
    type: Employee,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @RequirePermissions(PERMISSIONS.EMPLOYEES.UPDATE)
  updateEmployee(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.hrmsService.updateEmployee(id, dto);
  }

  @Delete('employees/:id')
  @ApiOperation({ summary: 'Delete employee' })
  @ApiResponse({ status: 200, description: 'Employee deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @RequirePermissions(PERMISSIONS.EMPLOYEES.UPDATE)
  removeEmployee(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.hrmsService.removeEmployee(id);
  }

  @Get('contracts')
  @ApiOperation({ summary: 'List contracts' })
  @ApiResponse({ status: 200, description: 'Paginated list of contracts.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.CONTRACTS.READ)
  findContracts(@Query() query: Record<string, unknown>) {
    return this.hrmsService.findContracts(query);
  }

  @Get('contracts/:id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiResponse({ status: 200, description: 'Contract details.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @RequirePermissions(PERMISSIONS.CONTRACTS.READ)
  findContractById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.hrmsService.findContractById(id);
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
  addContract(
    @Param('id', new ParseUUIDPipe()) employeeId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.hrmsService.addContract(employeeId, dto);
  }

  @Get('employees/:id/contracts')
  @ApiOperation({ summary: 'Get all contracts for an employee' })
  @ApiResponse({ status: 200, description: 'List of contracts for employee.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Employee not found.' })
  @RequirePermissions(PERMISSIONS.CONTRACTS.READ)
  findContractsByEmployeeId(
    @Param('id', new ParseUUIDPipe()) employeeId: string,
  ) {
    return this.hrmsService.findContractsByEmployeeId(employeeId);
  }

  @Put('contracts/:id')
  @ApiOperation({ summary: 'Update contract' })
  @ApiResponse({ status: 200, description: 'Contract updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @RequirePermissions(PERMISSIONS.CONTRACTS.UPDATE)
  updateContract(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateContractDto,
  ) {
    return this.hrmsService.updateContract(id, dto);
  }

  @Delete('contracts/:id')
  @ApiOperation({ summary: 'Delete contract' })
  @ApiResponse({ status: 200, description: 'Contract deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  @RequirePermissions(PERMISSIONS.CONTRACTS.UPDATE)
  removeContract(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.hrmsService.removeContract(id);
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
  activateContract(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.hrmsService.activateContract(id);
  }
}
