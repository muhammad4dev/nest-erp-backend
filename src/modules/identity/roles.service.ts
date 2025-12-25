import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role, Permission } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';

@Injectable()
export class RolesService {
  private roleRepo: Repository<Role>;
  private permissionRepo: Repository<Permission>;

  constructor(
    @InjectRepository(Role)
    roleRepoBase: Repository<Role>,
    @InjectRepository(Permission)
    permissionRepoBase: Repository<Permission>,
  ) {
    this.roleRepo = wrapTenantRepository(roleRepoBase);
    this.permissionRepo = wrapTenantRepository(permissionRepoBase);
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const role = this.roleRepo.create({
      name: dto.name,
      description: dto.description,
    });

    if (dto.permissions && dto.permissions.length > 0) {
      // Find permissions by ID or Name (assuming ID for now, but name is often better for DTOs if IDs are UUIDs)
      // Implementation plan suggested permissions: string[]
      // We'll support binding by Permission Action (e.g. 'create:invoice') if passed as strings?
      // Or IDs. Let's assume IDs for strict relational mapping, but for a good UX, names are easier.
      // Let's assume these are Permission IDs for now as per standard relational linking.
      const permissions = await this.permissionRepo.findBy({
        action: In(dto.permissions), // Assuming we pass actions like 'create:invoice' for easier mapping
      });
      role.permissions = permissions;
    }

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
    if (dto.description) role.description = dto.description;

    if (dto.permissions) {
      const permissions = await this.permissionRepo.findBy({
        action: In(dto.permissions),
      });
      role.permissions = permissions;
    }

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
    permissionActions: string[],
  ): Promise<Role> {
    const role = await this.findOne(roleId);
    const permissions = await this.permissionRepo.findBy({
      action: In(permissionActions),
    });
    role.permissions = permissions;
    return this.roleRepo.save(role);
  }
}
