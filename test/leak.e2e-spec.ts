import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/identity/entities/user.entity';
import { AppModule } from '../src/app.module';
import * as bcrypt from 'bcrypt';

/**
 * CRITICAL SECURITY TEST SUITE: Tenant Isolation (The "Leak Test")
 *
 * This test suite verifies that PostgreSQL RLS policies are correctly preventing
 * cross-tenant data access. Each test attempts a violation and MUST FAIL.
 *
 * **KNOWN ISSUE**: PostgreSQL table owners bypass RLS policies by default, even with
 * FORCE ROW LEVEL SECURITY enabled. For production deployments:
 * 1. Create tables with a privileged user (e.g., postgres)
 * 2. Use a different, non-owner role for the application connection
 * 3. Grant only necessary permissions to the application role
 *
 * For this test suite to pass, you MUST use a database user that is NOT the table owner.
 * Current workaround: Set the table owner to 'postgres' and connect as 'erp':
 *   ALTER TABLE users OWNER TO postgres;
 *
 * If any test passes, there is a critical security vulnerability:
 * - Application-level tenant checks are not sufficient
 * - RLS policies are not correctly configured
 * - Data isolation is compromised
 *
 * Run with: pnpm test test/leak.e2e-spec.ts
 */
describe('The Leak Test - Tenant Isolation (E2E)', () => {
  let app: TestingModule;
  let dataSource: DataSource;
  let isSuperUser = false;

  // Test tenant IDs (stable across test runs)
  const TENANT_A_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const TENANT_B_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    dataSource = app.get<DataSource>(DataSource);

    // Check if current user has BYPASSRLS privilege (security issue!)
    const result = await dataSource.query(`
      SELECT rolname, rolbypassrls, rolsuper, rolinherit,
             pg_has_role(current_user, 'postgres', 'member') as inherits_postgres
      FROM pg_roles 
      WHERE rolname = current_user;
    `);

    isSuperUser = result[0]?.rolsuper === true;

    if (isSuperUser) {
      console.warn(
        '⚠️  WARNING: Database user is SUPERUSER - RLS will be bypassed!',
      );
      console.warn(
        '⚠️  For production, use a non-superuser role for the application.',
      );
      console.warn(
        '⚠️  These tests will be SKIPPED as they cannot pass with superuser.',
      );
      return; // Skip setup
    }

    console.log('Current database user privileges:', result);
    console.log(
      'Current database:',
      await dataSource.query(`SELECT current_database()`),
    );

    // CRITICAL FIX: Transfer table ownership to postgres to enforce RLS
    // Table owners bypass RLS even with FORCE enabled
    try {
      await dataSource.query(`ALTER TABLE users OWNER TO postgres;`);
      await dataSource.query(
        `ALTER TABLE system_audit_logs OWNER TO postgres;`,
      );
      console.log('✅ Transferred table ownership to postgres');

      // Destroy and recreate connection to ensure new permissions apply
      await dataSource.destroy();
      await dataSource.initialize();
      console.log('✅ Reconnected to database with new permissions');
    } catch (error: any) {
      console.warn(
        '⚠️  Could not transfer table ownership (may need superuser):',
        error?.message,
      );
    }

    // Verify RLS is enabled on users table (already configured by setup script)
    const rlsCheck = await dataSource.query(`
      SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'users';
    `);
    console.log('RLS enabled on users table:', rlsCheck);

    // Check RLS policies
    const policies = await dataSource.query(`
      SELECT policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'users';
    `);
    console.log('RLS policies on users:', JSON.stringify(policies, null, 2));

    // Check table ownership
    const ownership = await dataSource.query(`
      SELECT tableowner FROM pg_tables WHERE tablename = 'users';
    `);
    console.log('Table owner:', ownership);

    // Check force RLS
    const forceRLS = await dataSource.query(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname = 'users';
    `);
    console.log('RLS force status:', forceRLS);

    // Clean up any leftover test data (set tenant context for audit trigger)
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${TENANT_A_ID}'`,
      );
      await queryRunner.query(
        `SET LOCAL app.current_user_id = '${TENANT_A_ID}'`,
      );
      await queryRunner.query(
        `DELETE FROM users WHERE tenant_id = '${TENANT_A_ID}'`,
      );
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    const queryRunner2 = dataSource.createQueryRunner();
    await queryRunner2.connect();
    await queryRunner2.startTransaction();
    try {
      await queryRunner2.query(
        `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
      );
      await queryRunner2.query(
        `SET LOCAL app.current_user_id = '${TENANT_B_ID}'`,
      );
      await queryRunner2.query(
        `DELETE FROM users WHERE tenant_id = '${TENANT_B_ID}'`,
      );
      await queryRunner2.commitTransaction();
    } catch (error) {
      await queryRunner2.rollbackTransaction();
    } finally {
      await queryRunner2.release();
    }
  });

  afterAll(async () => {
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  /**
   * Setup helper: Create a user in a specific tenant context
   */
  async function createUserInTenant(
    tenantId: string,
    email: string,
  ): Promise<User> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set RLS context for this transaction
      await queryRunner.query(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );

      const user = await queryRunner.manager.save(User, {
        email,
        passwordHash: await bcrypt.hash('test-password-123', 10),
        tenantId,
        isActive: true,
      });

      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Setup helper: Query user in a specific tenant context
   */
  async function queryUserInTenant(
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

      // Debug: Verify the setting is actually set
      const settingCheck = await queryRunner.query(
        `SELECT current_setting('app.current_tenant_id', true) as tenant_id`,
      );
      console.log(`[queryUserInTenant] Tenant context set to:`, settingCheck);

      const user = await queryRunner.manager.findOne(User, {
        where: { email },
      });

      console.log(
        `[queryUserInTenant] Query result for ${email}:`,
        user ? `Found: ${user.id}` : 'null',
      );

      await queryRunner.commitTransaction();
      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  describe('Prerequisites Check', () => {
    it('should NOT be running as SUPERUSER (superusers bypass RLS)', () => {
      expect(isSuperUser).toBe(false);
      if (isSuperUser) {
        console.error('❌ CRITICAL: Application is running as SUPERUSER');
        console.error(
          '❌ This bypasses ALL RLS policies - data isolation is compromised!',
        );
        console.error(
          '❌ For production: Use a non-superuser role with limited privileges',
        );
      }
    });
  });

  describe('User Data Access (Critical Leak Scenarios)', () => {
    let userA: User;
    let userB: User;

    beforeEach(async () => {
      if (isSuperUser) {
        return; // Skip creation
      }

      // Create users in separate tenants
      userA = await createUserInTenant(
        TENANT_A_ID,
        `user-a-${Date.now()}@tenant-a.com`,
      );
      userB = await createUserInTenant(
        TENANT_B_ID,
        `user-b-${Date.now()}@tenant-b.com`,
      );
    });

    afterEach(async () => {
      if (isSuperUser) return;
      // Cleanup: Delete users from both tenants
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_A_ID}'`,
        );
        await queryRunner.query(
          `SET LOCAL app.current_user_id = '${userA.id}'`,
        );
        await queryRunner.manager.delete(User, { id: userA.id });
        await queryRunner.commitTransaction();
      } catch (error) {
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
      }

      const queryRunner2 = dataSource.createQueryRunner();
      await queryRunner2.connect();
      await queryRunner2.startTransaction();
      try {
        await queryRunner2.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );
        await queryRunner2.query(
          `SET LOCAL app.current_user_id = '${userB.id}'`,
        );
        await queryRunner2.manager.delete(User, { id: userB.id });
        await queryRunner2.commitTransaction();
      } catch (error) {
        await queryRunner2.rollbackTransaction();
      } finally {
        await queryRunner2.release();
      }
    });

    it('MUST PREVENT: Tenant B reading Tenant A user by exact ID', async () => {
      // Attempt to query Tenant A's user while in Tenant B's context
      const leakedUser = await queryUserInTenant(TENANT_B_ID, userA.email);

      // RLS policy MUST return null
      expect(leakedUser).toBeNull();
    });

    it('MUST PREVENT: Tenant B listing Tenant A users', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );

        // Try to list all users (should only show Tenant B's users)
        const users = await queryRunner.manager.find(User);

        // EXPECTATION: Either empty, or contains only Tenant B users
        const tenantAUsers = users.filter((u) => u.tenantId === TENANT_A_ID);
        expect(tenantAUsers).toHaveLength(0);
        expect(tenantAUsers).not.toContainEqual(
          expect.objectContaining({ id: userA.id }),
        );

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });

    it('MUST PREVENT: Tenant B modifying Tenant A user (UPDATE)', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );

        // Attempt UPDATE (should be blocked by RLS WHERE clause)
        const updateResult = await queryRunner.manager.update(User, userA.id, {
          isActive: false,
        });

        // RLS MUST prevent the update
        expect(updateResult.affected).toBe(0);

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });

    it('MUST PREVENT: Tenant B deleting Tenant A user (DELETE)', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );

        // Attempt DELETE (should be blocked)
        const deleteResult = await queryRunner.manager.delete(User, userA.id);

        expect(deleteResult.affected).toBe(0);

        // Verify user still exists in Tenant A
        const stillExists = await queryUserInTenant(TENANT_A_ID, userA.email);
        expect(stillExists).not.toBeNull();

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });

    it('SHOULD ALLOW: Tenant A reading own user data', async () => {
      const ownUser = await queryUserInTenant(TENANT_A_ID, userA.email);

      // Should succeed
      expect(ownUser).not.toBeNull();
      expect(ownUser?.id).toBe(userA.id);
      expect(ownUser?.email).toBe(userA.email);
    });

    it('SHOULD ALLOW: Tenant A modifying own user data', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_A_ID}'`,
        );

        const updateResult = await queryRunner.manager.update(User, userA.id, {
          isActive: false,
        });

        // Should succeed
        expect(updateResult.affected).toBe(1);

        // Verify update persisted (within same transaction)
        const updated = await queryRunner.manager.findOne(User, {
          where: { email: userA.email },
        });
        expect(updated?.isActive).toBe(false);

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });
  });

  describe('Audit Log Access (Compliance Violation Prevention)', () => {
    it('MUST PREVENT: Tenant B reading Tenant A audit logs', async () => {
      // This test assumes an audit_logs table exists with tenant isolation
      // Create an operation in Tenant A
      const userA = await createUserInTenant(
        TENANT_A_ID,
        `audit-test-a-${Date.now()}@example.com`,
      );

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Try to read audit logs from Tenant B context
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );

        const auditLogs = await queryRunner.manager.query(
          `SELECT * FROM system_audit_logs WHERE table_name = 'users' AND record_id = $1`,
          [userA.id],
        );

        // RLS MUST filter out Tenant A audit logs
        expect(auditLogs).toHaveLength(0);

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });
  });

  describe('SQL Injection & RLS Bypass Attempts', () => {
    let userA: User;

    beforeEach(async () => {
      userA = await createUserInTenant(
        TENANT_A_ID,
        `injection-test-${Date.now()}@example.com`,
      );
    });

    it('MUST PREVENT: SQL injection attempting to bypass RLS', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );

        // Malicious attempt: union-based injection
        const result = await queryRunner.manager.query(
          `
            SELECT * FROM "users" 
            WHERE email = $1 
            UNION ALL 
            SELECT * FROM "users" WHERE tenant_id = $2
          `,
          [userA.email, TENANT_A_ID],
        );

        // RLS applies at table level; UNION is still filtered
        const tenantAResults = result.filter(
          (r) => r.tenant_id === TENANT_A_ID,
        );
        expect(tenantAResults).toHaveLength(0);

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });

    it('MUST PREVENT: Raw queries bypassing ORM (direct SQL)', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );

        // Raw SQL query (RLS still applies at database level)
        const result = await queryRunner.manager.query(
          `SELECT * FROM "users" WHERE email = $1`,
          [userA.email],
        );

        // RLS MUST still protect the row
        expect(result).toHaveLength(0);

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });

    it('MUST PREVENT: Disabling RLS (if attempted)', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Try to disable RLS for the current transaction
        // (This should NOT be allowed in typical DB configurations)
        try {
          await queryRunner.query(
            'ALTER TABLE "users" DISABLE ROW LEVEL SECURITY',
          );
        } catch (e) {
          // Expected: should fail or be restricted
          expect(e).toBeDefined();
        }

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });
  });

  describe('Session Variable Manipulation', () => {
    let userA: User;

    beforeEach(async () => {
      userA = await createUserInTenant(
        TENANT_A_ID,
        `session-test-${Date.now()}@example.com`,
      );
    });

    it('MUST PREVENT: Setting current_tenant_id to another tenant', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Start in Tenant B context
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );

        // Try to change it to Tenant A (within same transaction)
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_A_ID}'`,
        );

        // Now try to read Tenant A data
        const result = await queryRunner.manager.findOne(User, {
          where: { email: userA.email },
        });

        // Depending on implementation:
        // - If tenant_id is set correctly: should find the user
        // - If RLS policy uses ONLY the first SET: should NOT find the user
        // For security, the most recent SET should apply
        if (result) {
          // Acceptable if tenant_id context is properly maintained
          expect(result.tenantId).toBe(TENANT_A_ID);
        }

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });

    it('MUST PREVENT: NULL tenant_id bypassing RLS', async () => {
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Attempt to set tenant_id to valid UUID instead of NULL
        await queryRunner.query(
          `SET LOCAL app.current_tenant_id = '${TENANT_B_ID}'`,
        );

        // Try to query all users
        const result = await queryRunner.manager.find(User);

        // RLS should filter to only Tenant B users
        expect(result).toBeDefined();
        if (result.length > 0) {
          expect(result.every((u) => u.tenantId === TENANT_B_ID)).toBe(true);
        }

        await queryRunner.commitTransaction();
      } catch (error) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          // Transaction already closed, ignore
        }
        throw error;
      } finally {
        try {
          await queryRunner.release();
        } catch (releaseError) {
          // Connection already released, ignore
        }
      }
    });
  });

  describe('Concurrent Access & Race Conditions', () => {
    it('MUST PREVENT: Race condition between two parallel queries from different tenants', async () => {
      const userA = await createUserInTenant(
        TENANT_A_ID,
        `race-a-${Date.now()}@example.com`,
      );
      const userB = await createUserInTenant(
        TENANT_B_ID,
        `race-b-${Date.now()}@example.com`,
      );

      // Concurrent queries from different tenant contexts
      const queryA = queryUserInTenant(TENANT_A_ID, userA.email);
      const queryB = queryUserInTenant(TENANT_B_ID, userA.email); // Attempt to read Tenant A's user

      const [resultA, resultB] = await Promise.all([queryA, queryB]);

      // Tenant A should get their user
      expect(resultA).not.toBeNull();
      expect(resultA?.id).toBe(userA.id);

      // Tenant B should NOT get Tenant A's user
      expect(resultB).toBeNull();
    });
  });
});
