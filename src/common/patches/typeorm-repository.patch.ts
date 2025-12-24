import { Repository, ObjectLiteral } from 'typeorm';
import { TenantContext } from '../context/tenant.context';

/**
 * Patches TypeORM Repository prototype to be RLS-aware.
 * If a tenant transaction context exists (from TenantTransactionInterceptor),
 * calls are redirected to the transaction-scoped repository.
 *
 * This allows using simpler `this.repository.find()` syntax in services
 * without explicit `getManager()` handling.
 */
export function patchTypeORMRepository() {
  const methods: (keyof Repository<ObjectLiteral>)[] = [
    'find',
    'findBy',
    'findAndCount',
    'findAndCountBy',
    'findByIds',
    'findOne',
    'findOneBy',
    'findOneById',
    'findOneOrFail',
    'findOneByOrFail',
    'create',
    'merge',
    // 'preload', // Preload relies on merging into given entity, typically safe
    'save',
    'remove',
    'softRemove',
    'recover',
    'insert',
    'update',
    'upsert',
    'delete',
    'softDelete',
    'restore',
    'count',
    'countBy',
    'sum',
    'average',
    'minimum',
    'maximum',
    'increment',
    'decrement',
    'exist',
    'clear',
    'query',
    'createQueryBuilder',
  ];

  for (const method of methods) {
    const original = Repository.prototype[method];

    // Check if original method exists (to match TypeORM version)
    if (typeof original !== 'function') continue;

    (Repository.prototype as any)[method] = function (
      this: Repository<ObjectLiteral>,
      ...args: any[]
    ) {
      const tenantManager = TenantContext.getEntityManager();
      const currentManager = this.manager;

      // If we are in a tenant context, AND the current repository is NOT already bound to it,
      // redirect the call to a new repository instance from the tenant manager.
      if (tenantManager && currentManager !== tenantManager) {
        const tenantRepo = tenantManager.getRepository(this.target);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (tenantRepo[method] as any)(...args);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (original as any).apply(this, args);
    };
  }
}
