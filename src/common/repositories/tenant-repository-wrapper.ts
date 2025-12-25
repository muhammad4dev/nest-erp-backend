import { Repository, ObjectLiteral } from 'typeorm';
import { TenantContext } from '../context/tenant.context';

/**
 * Wraps a TypeORM Repository to be tenant-aware.
 * If in a transaction context, uses transaction-scoped repository.
 * Otherwise uses the base repository.
 *
 * Usage in service constructor:
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   private userRepo: Repository<User>;
 *
 *   constructor(@InjectRepository(User) repo: Repository<User>) {
 *     this.userRepo = wrapTenantRepository(repo);
 *   }
 * }
 * ```
 */
export function wrapTenantRepository<Entity extends ObjectLiteral>(
  baseRepository: Repository<Entity>,
): Repository<Entity> {
  return new Proxy(baseRepository, {
    get(target: Repository<Entity>, prop: string | symbol) {
      // Get the effective repository
      const tenantManager = TenantContext.getEntityManager();
      const currentManager = target.manager;

      let effectiveRepo = target;
      if (tenantManager && currentManager !== tenantManager) {
        effectiveRepo = tenantManager.getRepository(target.target);
      }

      // If it's a method, bind it to the effective repo
      const value = effectiveRepo[prop as keyof Repository<Entity>];
      if (typeof value === 'function') {
        const fn = value as (...args: unknown[]) => unknown;
        return (...args: Parameters<typeof fn>): ReturnType<typeof fn> =>
          fn.apply(effectiveRepo, args);
      }

      return value;
    },
  });
}
