import { AsyncLocalStorage } from 'async_hooks';
import { EntityManager } from 'typeorm';

export interface TenantStore {
  tenantId: string;
  userId?: string;
  entityManager?: EntityManager;
}

/**
 * AsyncLocalStorage for tenant context.
 * Stores tenant ID, user ID, and optionally a transaction-scoped EntityManager.
 */
export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<TenantStore>();

  static run<T>(store: TenantStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  static get(): TenantStore | undefined {
    return this.storage.getStore();
  }

  static getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  /**
   * Get the transaction-scoped EntityManager for RLS-aware operations.
   * This is set by the TenantTransactionInterceptor.
   */
  static getEntityManager(): EntityManager | undefined {
    return this.storage.getStore()?.entityManager;
  }

  /**
   * Set the EntityManager in the current context.
   * Used by TenantTransactionInterceptor to provide transaction-scoped manager.
   */
  static setEntityManager(manager: EntityManager): void {
    const store = this.storage.getStore();
    if (store) {
      store.entityManager = manager;
    }
  }
}
