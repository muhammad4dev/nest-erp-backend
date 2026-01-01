import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Role, Permission } from './entities/role.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from './decorators/require-permissions.decorator';
import { PermissionsGuard } from './guards/permissions.guard';
import { PERMISSIONS } from './constants/permissions.enum';

@ApiTags('roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created.', type: Role })
  @RequirePermissions(PERMISSIONS.ROLES.CREATE)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all roles' })
  @ApiResponse({ status: 200, description: 'List of roles.', type: [Role] })
  @RequirePermissions(PERMISSIONS.ROLES.READ)
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions/list')
  @ApiOperation({ summary: 'List all available system permissions' })
  @ApiResponse({
    status: 200,
    description: 'List of all system permissions with metadata.',
    type: [Permission],
  })
  @RequirePermissions(PERMISSIONS.ROLES.READ)
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get role details' })
  @ApiResponse({ status: 200, description: 'Role details.', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @RequirePermissions(PERMISSIONS.ROLES.READ)
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated.', type: Role })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @RequirePermissions(PERMISSIONS.ROLES.UPDATE)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted.' })
  @ApiResponse({ status: 404, description: 'Role not found.' })
  @RequirePermissions(PERMISSIONS.ROLES.DELETE)
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.rolesService.remove(id);
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Assign permissions to a role' })
  @ApiBody({ type: AssignPermissionsDto })
  @ApiResponse({
    status: 200,
    description: 'Permissions assigned.',
    type: Role,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid permission IDs provided.',
  })
  @ApiResponse({
    status: 404,
    description: 'Role not found.',
  })
  @RequirePermissions(PERMISSIONS.ROLES.UPDATE)
  assignPermissions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(id, dto.permissionIds);
  }
}
