import { DataSource } from 'typeorm';
import { User } from '../../src/modules/identity/entities/user.entity';
import { Tenant } from '../../src/modules/identity/entities/tenant.entity';
import { Role } from '../../src/modules/identity/entities/role.entity';
import * as bcrypt from 'bcrypt';

/**
 * User Fixture Factory
 *
 * Provides standardized methods for creating test users with consistent
 * tenant context and role assignments. All users are created within
 * proper RLS context to ensure tenant isolation.
 */
export class UserFixture {
  /**
   * Create a tenant for testing
   */
  static async createTenant(
    dataSource: DataSource,
    overrides?: Partial<Tenant>,
  ): Promise<Tenant> {
    const tenant = dataSource.manager.create(Tenant, {
      name: `Tenant-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      isActive: true,
      ...overrides,
    });
    return dataSource.manager.save(tenant);
  }

  /**
   * Create a basic user in a tenant
   */
  static async createUser(
    dataSource: DataSource,
    tenantId: string,
    overrides?: Partial<User>,
  ): Promise<User> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set RLS context
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );

      const user = queryRunner.manager.create(User, {
        email: `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}@example.com`,
        passwordHash: await bcrypt.hash('test-password-123', 10),
        tenantId,
        isActive: true,
        ...overrides,
      });

      const savedUser = await queryRunner.manager.save(user);
      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create multiple users in a single tenant
   */
  static async createUsers(
    dataSource: DataSource,
    tenantId: string,
    count: number,
    overridesFn?: (index: number) => Partial<User>,
  ): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      const user = await this.createUser(
        dataSource,
        tenantId,
        overridesFn?.(i),
      );
      users.push(user);
    }
    return users;
  }

  /**
   * Create a user with specific role assignments
   */
  static async createUserWithRoles(
    dataSource: DataSource,
    tenantId: string,
    roleNames: string[],
    overrides?: Partial<User>,
  ): Promise<User> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );

      // Create user
      const user = queryRunner.manager.create(User, {
        email: `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}@example.com`,
        passwordHash: await bcrypt.hash('test-password-123', 10),
        tenantId,
        isActive: true,
        ...overrides,
      });

      const savedUser = await queryRunner.manager.save(user);

      // Create and assign roles
      if (roleNames.length > 0) {
        const roles: Role[] = [];
        for (const roleName of roleNames) {
          const role = queryRunner.manager.create(Role, {
            name: roleName,
            tenantId,
          });
          const savedRole = await queryRunner.manager.save(role);
          roles.push(savedRole);
        }
        savedUser.roles = roles;
        await queryRunner.manager.save(savedUser);
      }

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Create an admin user
   */
  static async createAdminUser(
    dataSource: DataSource,
    tenantId: string,
    email?: string,
  ): Promise<User> {
    return this.createUserWithRoles(dataSource, tenantId, ['admin'], {
      email: email || `admin-${Date.now()}@example.com`,
    });
  }

  /**
   * Create a finance officer user (for Finance module tests)
   */
  static async createFinanceOfficer(
    dataSource: DataSource,
    tenantId: string,
  ): Promise<User> {
    return this.createUserWithRoles(dataSource, tenantId, [
      'finance_officer',
      'viewer',
    ]);
  }

  /**
   * Create a viewer-only user (read permissions)
   */
  static async createViewerUser(
    dataSource: DataSource,
    tenantId: string,
  ): Promise<User> {
    return this.createUserWithRoles(dataSource, tenantId, ['viewer']);
  }

  /**
   * Delete a user (cleanup helper)
   */
  static async deleteUser(
    dataSource: DataSource,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );
      await queryRunner.manager.delete(User, { id: userId, tenantId });
      await queryRunner.commitTransaction();
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  }

  /**
   * Find a user by email in tenant context
   */
  static async findUserByEmail(
    dataSource: DataSource,
    tenantId: string,
    email: string,
  ): Promise<User | null> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );
      const user = await queryRunner.manager.findOne(User, {
        where: { email },
      });
      await queryRunner.commitTransaction();
      return user;
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  }
}
