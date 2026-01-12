import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, Permission } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';
import { TenantContext } from '../../common/context/tenant.context';
import { UserPermissionsService } from './user-permissions.service';

@Injectable()
export class RolesService {
  private roleRepo: Repository<Role>;
  private permissionRepo: Repository<Permission>;

  constructor(
    @InjectRepository(Role)
    roleRepoBase: Repository<Role>,
    @InjectRepository(Permission)
    permissionRepoBase: Repository<Permission>,
    private readonly userPermissionsService: UserPermissionsService,
  ) {
    this.roleRepo = wrapTenantRepository(roleRepoBase);
    this.permissionRepo = wrapTenantRepository(permissionRepoBase);
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const tenantId = TenantContext.requireTenantId();

    const role = this.roleRepo.create({
      name: dto.name,
      description: dto.description,
      tenantId,
    });

    return this.roleRepo.save(role);
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({ relations: ['permissions'] });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions'],
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (dto.name) role.name = dto.name;
    if (dto.description !== undefined) role.description = dto.description;

    return this.roleRepo.save(role);
  }

  async remove(id: string): Promise<void> {
    const result = await this.roleRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Role not found');
  }

  async listPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find();
  }

  async assignPermissions(
    roleId: string,
    permissionIds: string[],
  ): Promise<Role> {
    const role = await this.findOne(roleId);

    // Find permissions by IDs
    const permissions = await this.permissionRepo.findByIds(permissionIds);

    // Validate all permissions were found
    if (permissions.length !== permissionIds.length) {
      throw new BadRequestException(
        `Some permissions not found. Expected ${permissionIds.length}, found ${permissions.length}`,
      );
    }

    role.permissions = permissions;
    const savedRole = await this.roleRepo.save(role);

    // Sync denormalized permissions for all users with this role
    await this.userPermissionsService.syncRolePermissions(roleId);

    return savedRole;
  }
}
