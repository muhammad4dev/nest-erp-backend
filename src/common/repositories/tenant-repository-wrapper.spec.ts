import { ObjectLiteral, Repository, EntityManager } from 'typeorm';
import { wrapTenantRepository } from './tenant-repository-wrapper';
import { TenantContext } from '../context/tenant.context';

class TestEntity implements ObjectLiteral {
  [key: string]: any;
}

const BASE_TARGET = { label: 'base-target' };
const TENANT_TARGET = { label: 'tenant-target' };

describe('wrapTenantRepository', () => {
  const baseManager = {
    getRepository: jest.fn(),
  } as unknown as EntityManager;
  const tenantManager = {
    getRepository: jest.fn(),
  } as unknown as EntityManager;

  const baseRepo = {
    manager: baseManager,
    target: BASE_TARGET,
    find: jest.fn().mockResolvedValue(['base']),
  } as unknown as Repository<TestEntity>;

  const tenantRepo = {
    manager: tenantManager,
    target: TENANT_TARGET,
    find: jest.fn().mockResolvedValue(['tenant']),
  } as unknown as Repository<TestEntity>;

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('uses base repository when no transaction manager is in TenantContext', async () => {
    jest.spyOn(TenantContext, 'getEntityManager').mockReturnValue(undefined);

    const wrapped = wrapTenantRepository(baseRepo);
    const result = await wrapped.find();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const baseFind = baseRepo.find as jest.Mock;
    expect(baseFind).toHaveBeenCalledTimes(1);
    expect(result).toEqual(['base']);
  });

  it('switches to tenant-scoped repository when TenantContext provides a manager', async () => {
    (tenantManager.getRepository as jest.Mock).mockReturnValue(tenantRepo);
    jest
      .spyOn(TenantContext, 'getEntityManager')
      .mockReturnValue(tenantManager);

    const wrapped = wrapTenantRepository(baseRepo);
    const result = await wrapped.find();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    const tenantGetRepo = tenantManager.getRepository as jest.Mock;
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const tenantFind = tenantRepo.find as jest.Mock;
    expect(tenantGetRepo).toHaveBeenCalledWith(baseRepo.target);
    expect(tenantFind).toHaveBeenCalledTimes(1);
    expect(result).toEqual(['tenant']);
  });

  it('binds methods to the effective repository so `this` is correct', async () => {
    const callContexts: any[] = [];
    tenantRepo.find = jest.fn(function () {
      callContexts.push(this);
      return Promise.resolve(['tenant']);
    }) as any;

    (tenantManager.getRepository as jest.Mock).mockReturnValue(tenantRepo);
    jest
      .spyOn(TenantContext, 'getEntityManager')
      .mockReturnValue(tenantManager);

    const wrapped = wrapTenantRepository(baseRepo);
    await wrapped.find();

    expect(callContexts[0]).toBe(tenantRepo);
  });

  it('exposes non-function properties from the effective repository', () => {
    (tenantManager.getRepository as jest.Mock).mockReturnValue(tenantRepo);
    jest
      .spyOn(TenantContext, 'getEntityManager')
      .mockReturnValue(tenantManager);

    const wrapped = wrapTenantRepository(baseRepo);

    expect(wrapped.manager).toBe(tenantManager);
    expect(wrapped.target).toBe(tenantRepo.target);
  });
});
