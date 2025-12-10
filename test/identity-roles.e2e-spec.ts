import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryFailedError } from 'typeorm';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { UserFixture } from './fixtures/user.fixture';
import { Role } from '../src/modules/identity/entities/role.entity';
import { User } from '../src/modules/identity/entities/user.entity';

/**
 * Identity / Roles E2E Tests
 *
 * Focus: tenant-scoped role creation and RLS enforcement on roles.
 */
describe('Identity Roles - Tenant Isolation (E2E)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
    if (app) {
      await app.close();
    }
  });

  it('should keep roles isolated per tenant', async () => {
    const tenantA = await UserFixture.createTenant(dataSource);
    const tenantB = await UserFixture.createTenant(dataSource);

    const adminA = await UserFixture.createAdminUser(dataSource, tenantA.id);
    const viewerB = await UserFixture.createViewerUser(dataSource, tenantB.id);

    // Query adminA inside Tenant A context and verify roles
    const qrA = dataSource.createQueryRunner();
    await qrA.connect();
    await qrA.startTransaction();
    await qrA.query(`SET LOCAL app.current_tenant_id = '${tenantA.id}'`);
    const loadedA = await qrA.manager.findOne(User, {
      where: { id: adminA.id },
      relations: ['roles'],
    });
    await qrA.commitTransaction();
    await qrA.release();

    expect(loadedA).not.toBeNull();
    expect(loadedA?.roles.map((r) => r.name)).toContain('admin');

    // Query viewerB inside Tenant B context and verify roles are separate
    const qrB = dataSource.createQueryRunner();
    await qrB.connect();
    await qrB.startTransaction();
    await qrB.query(`SET LOCAL app.current_tenant_id = '${tenantB.id}'`);
    const loadedB = await qrB.manager.findOne(User, {
      where: { id: viewerB.id },
      relations: ['roles'],
    });
    await qrB.commitTransaction();
    await qrB.release();

    expect(loadedB).not.toBeNull();
    expect(loadedB?.roles.map((r) => r.name)).toEqual(['viewer']);
  });

  it('should prevent cross-tenant role insertion (RLS)', async () => {
    const tenantA = await UserFixture.createTenant(dataSource);
    const tenantB = await UserFixture.createTenant(dataSource);

    const qr = dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    await qr.query(`SET LOCAL app.current_tenant_id = '${tenantA.id}'`);

    await expect(
      qr.manager.insert(Role, {
        name: 'cross-tenant-role',
        tenantId: tenantB.id,
      }),
    ).rejects.toBeInstanceOf(QueryFailedError);

    await qr.rollbackTransaction();
    await qr.release();
  });
});
