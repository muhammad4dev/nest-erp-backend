import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';

@Injectable()
export class TenantService {
  private tenantRepo: Repository<Tenant>;

  constructor(
    @InjectRepository(Tenant)
    tenantRepoBase: Repository<Tenant>,
  ) {
    this.tenantRepo = wrapTenantRepository(tenantRepoBase);
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.tenantRepo.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Tenant name already exists');
    }

    const tenant = this.tenantRepo.create(dto);
    return this.tenantRepo.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    if (dto.name && dto.name !== tenant.name) {
      const existing = await this.tenantRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Tenant name already exists');
      }
    }

    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }

  async remove(id: string): Promise<void> {
    const tenant = await this.findOne(id);
    // Soft delete by deactivating
    tenant.isActive = false;
    await this.tenantRepo.save(tenant);
  }
}
