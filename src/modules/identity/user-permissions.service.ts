import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityTarget, ObjectLiteral } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';
import { TenantContext } from '../../common/context/tenant.context';

/**
 * Service responsible for calculating and syncing the denormalized
 * `User.permissions` column.
 *
 * This service is called when:
 * 1. A role is assigned to or removed from a user.
 * 2. A role's permissions are modified.
 */
@Injectable()
export class UserPermissionsService {
  private readonly logger = new Logger(UserPermissionsService.name);
  private userRepo: Repository<User>;
  private roleRepo: Repository<Role>;

  constructor(
    @InjectRepository(User)
    private readonly userRepoBase: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepoBase: Repository<Role>,
  ) {
    this.userRepo = wrapTenantRepository(userRepoBase);
    this.roleRepo = wrapTenantRepository(roleRepoBase);
  }

  /**
   * Calculate flat permission strings from a user's roles.
   * Returns unique permission strings in "action:resource" format.
   */
  calculatePermissions(user: User): string[] {
    if (!user.roles) return [];

    const permissions = new Set<string>();
    for (const role of user.roles) {
      if (role.permissions) {
        for (const perm of role.permissions) {
          permissions.add(`${perm.action}:${perm.resource}`);
        }
      }
    }
    return Array.from(permissions).sort();
  }

  /**
   * Helper to get the correct repository.
   * If we are in a transaction (TenantContext has manager), use that manager to ensure we see uncommitted changes.
   * Otherwise use the base/injected repository.
   */
  private getRepo<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    baseRepo: Repository<T>,
  ): Repository<T> {
    const manager = TenantContext.getEntityManager();
    if (manager) {
      return manager.getRepository(entity);
    }
    return baseRepo;
  }

  /**
   * Sync a single user's denormalized permissions column.
   * Loads roles with permissions and recalculates.
   */
  async syncUserPermissions(userId: string): Promise<void> {
    const userRepo = this.getRepo(User, this.userRepoBase);

    const user = await userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found for permission sync`);
      return;
    }

    const newPermissions = this.calculatePermissions(user);

    // Only update if permissions actually changed
    const currentPermissions = (user.permissions ?? []).sort();
    if (JSON.stringify(currentPermissions) === JSON.stringify(newPermissions)) {
      this.logger.debug(
        `User ${userId} permissions unchanged, skipping update`,
      );
      return;
    }

    user.permissions = newPermissions;
    await userRepo.save(user);
    this.logger.log(
      `Synced permissions for user ${userId}: ${newPermissions.length} permissions`,
    );
  }

  /**
   * Sync permissions for ALL users that have a specific role.
   * This is called when a role's permissions are changed.
   */
  async syncRolePermissions(roleId: string): Promise<void> {
    const userRepo = this.getRepo(User, this.userRepoBase);

    // Find all users with this role
    const usersWithRole = await userRepo
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role', 'role.id = :roleId', { roleId })
      .select('user.id')
      .getMany();

    if (usersWithRole.length === 0) {
      this.logger.debug(`No users found with role ${roleId}, skipping sync`);
      return;
    }

    this.logger.log(
      `Syncing permissions for ${usersWithRole.length} users with role ${roleId}`,
    );

    // Batch sync for performance
    for (const user of usersWithRole) {
      await this.syncUserPermissions(user.id);
    }

    this.logger.log(`Completed permission sync for role ${roleId}`);
  }

  /**
   * Batch sync all users' permissions.
   * Useful for initial migration or repair.
   */
  async syncAllUsersPermissions(): Promise<void> {
    const users = await this.userRepoBase.find({ select: ['id'] });
    this.logger.log(`Starting sync for ${users.length} users`);

    for (const user of users) {
      await this.syncUserPermissions(user.id);
    }

    this.logger.log('All users permission sync complete');
  }
}
