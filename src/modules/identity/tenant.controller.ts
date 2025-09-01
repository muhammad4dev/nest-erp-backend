import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { Tenant } from './entities/tenant.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { PERMISSIONS } from './constants/permissions.enum';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({
    status: 201,
    description: 'Tenant created successfully.',
    type: Tenant,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 409, description: 'Tenant name already exists.' })
  @RequirePermissions(PERMISSIONS.TENANTS.CREATE)
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants' })
  @ApiResponse({ status: 200, description: 'List of tenants.', type: [Tenant] })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.TENANTS.READ)
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant details.', type: Tenant })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  @RequirePermissions(PERMISSIONS.TENANTS.READ)
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiResponse({
    status: 200,
    description: 'Tenant updated successfully.',
    type: Tenant,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  @ApiResponse({ status: 409, description: 'Tenant name already exists.' })
  @RequirePermissions(PERMISSIONS.TENANTS.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a tenant (soft delete)' })
  @ApiResponse({ status: 200, description: 'Tenant deactivated.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  @RequirePermissions(PERMISSIONS.TENANTS.DELETE)
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
