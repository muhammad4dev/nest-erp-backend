export const PERMISSIONS = {
  ROLES: {
    CREATE: 'create:role',
    READ: 'read:role',
    UPDATE: 'update:role',
    DELETE: 'delete:role',
  },
  USERS: {
    CREATE: 'create:user',
    READ: 'read:user',
    UPDATE: 'update:user',
    DELETE: 'delete:user',
  },
  TENANTS: {
    CREATE: 'create:tenant',
    READ: 'read:tenant',
    UPDATE: 'update:tenant',
    DELETE: 'delete:tenant',
  },
  ACCOUNTS: {
    CREATE: 'create:account',
    READ: 'read:account',
    UPDATE: 'update:account',
    DELETE: 'delete:account',
  },
  JOURNALS: {
    CREATE: 'create:journal',
    READ: 'read:journal',
    APPROVE: 'approve:journal',
  },
  FISCAL_PERIODS: {
    CREATE: 'create:period',
    READ: 'read:period',
    UPDATE: 'update:period',
  },
  PRODUCTS: {
    CREATE: 'create:product',
    READ: 'read:product',
    UPDATE: 'update:product',
    DELETE: 'delete:product',
  },
  STOCK: {
    CREATE: 'create:stock',
    READ: 'read:stock',
    UPDATE: 'update:stock',
    DELETE: 'delete:stock',
    ADJUST: 'adjust:stock',
    TRANSFER: 'transfer:stock',
  },
  LOCATIONS: {
    CREATE: 'create:location',
    READ: 'read:location',
    UPDATE: 'update:location',
  },
  SALES_ORDERS: {
    CREATE: 'create:sales_order',
    READ: 'read:sales_order',
    UPDATE: 'update:sales_order',
    CANCEL: 'cancel:sales_order',
  },
  INVOICES: {
    CREATE: 'create:invoice',
    READ: 'read:invoice',
    POST: 'post:invoice',
  },
  PARTNERS: {
    CREATE: 'create:partner',
    READ: 'read:partner',
    UPDATE: 'update:partner',
    DELETE: 'delete:partner',
  },
  PURCHASE_ORDERS: {
    CREATE: 'create:purchase_order',
    READ: 'read:purchase_order',
    CONFIRM: 'confirm:purchase_order',
  },
  VENDOR_BILLS: {
    CREATE: 'create:vendor_bill',
    READ: 'read:vendor_bill',
    POST: 'post:vendor_bill',
  },
  EMPLOYEES: {
    CREATE: 'create:employee',
    READ: 'read:employee',
    UPDATE: 'update:employee',
  },
  CONTRACTS: {
    CREATE: 'create:contract',
    READ: 'read:contract',
    UPDATE: 'update:contract',
  },
  COMPLIANCE: {
    READ_REPORT: 'read:compliance_report',
  },
  I18N: {
    CREATE: 'create:translation',
    READ: 'read:translation',
  },
  POS: {
    SYNC: 'sync:pos',
  },
} as const;
