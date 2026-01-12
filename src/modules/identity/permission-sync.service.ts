import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/role.entity';
import { PERMISSIONS } from './constants/permissions.enum';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';
import { UserPermissionsService } from './user-permissions.service';

@Injectable()
export class PermissionSyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PermissionSyncService.name);
  private permissionRepo: Repository<Permission>;

  constructor(
    @InjectRepository(Permission)
    permissionRepoBase: Repository<Permission>,
    private readonly userPermissionsService: UserPermissionsService,
  ) {
    this.permissionRepo = wrapTenantRepository(permissionRepoBase);
  }

  async onApplicationBootstrap() {
    this.logger.log('Synchronizing permissions...');
    await this.syncPermissions();

    this.logger.log('Synchronizing user denormalized permissions...');
    await this.userPermissionsService.syncAllUsersPermissions();
  }

  private async syncPermissions() {
    const flatPermissions = this.flattenPermissions(PERMISSIONS);
    let syncedCount = 0;

    for (const perm of flatPermissions) {
      const [action, resource] = perm.split(':');

      // Upsert logic: Using findOne + save for safety across DB providers
      // though simple onConflict would be faster for PG.
      const existing = await this.permissionRepo.findOne({
        where: { action, resource },
      });

      if (!existing) {
        await this.permissionRepo.save(
          this.permissionRepo.create({
            action,
            resource,
            description: `Auto-synced: ${action} ${resource}`,
            tenantId: '00000000-0000-0000-0000-000000000000', // System-level permission (global)
          }),
        );
        syncedCount++;
      }
    }

    this.logger.log(
      `Permissions synchronization complete. Synced ${syncedCount} new permissions.`,
    );
  }

  private flattenPermissions(obj: Record<string, unknown>): string[] {
    const result: string[] = [];
    for (const key in obj) {
      const value = obj[key];
      if (typeof value === 'string') {
        result.push(value);
      } else if (value && typeof value === 'object') {
        result.push(
          ...this.flattenPermissions(value as Record<string, unknown>),
        );
      }
    }
    return result;
  }
}
