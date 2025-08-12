import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string;
  userId?: string;
}

export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<TenantStore>();

  static run(store: TenantStore, callback: () => void) {
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
}
