import {
  SelectQueryBuilder,
  ObjectLiteral,
  Repository,
  EntityManager,
} from 'typeorm';
import { TenantContext } from '../context/tenant.context';
import { BadRequestException } from '@nestjs/common';

/**
 * Tenant Query Helpers
 *
 * Utilities for building tenant-aware queries that work with RLS policies.
 * These helpers provide a consistent way to apply tenant filters across the application.
 */

/**
 * Apply tenant filter to a QueryBuilder.
 * Adds WHERE clause for tenant_id using the current TenantContext.
 *
 * @param qb - The query builder to filter
 * @param alias - The table alias used in the query (default: qb.alias)
 * @returns The filtered query builder
 *
 * @example
 * ```typescript
 * const qb = this.userRepo.createQueryBuilder('user');
 * applyTenantScope(qb);
 * // Equivalent to: qb.andWhere('user.tenantId = :tenantId', { tenantId })
 * ```
 */
export function applyTenantScope<Entity extends ObjectLiteral>(
  qb: SelectQueryBuilder<Entity>,
  alias?: string,
): SelectQueryBuilder<Entity> {
  const tenantId = TenantContext.requireTenantId();
  const tableAlias = alias || qb.alias;

  return qb.andWhere(`${tableAlias}.tenantId = :tenantId`, { tenantId });
}

/**
 * Create a tenant-scoped repository instance.
 * If in a transaction context, returns the transaction-scoped repository.
 * Otherwise, returns the standard repository.
 *
 * @param repository - The repository to scope
 * @returns A tenant-aware repository instance
 */
export function getTenantRepository<Entity extends ObjectLiteral>(
  repository: Repository<Entity>,
): Repository<Entity> {
  const manager = TenantContext.getEntityManager();
  if (manager) {
    return manager.getRepository(repository.target);
  }
  return repository;
}

/**
 * Execute a function within a tenant context.
 * Validates that tenant context exists before executing.
 *
 * @param fn - The function to execute
 * @returns The result of the function
 * @throws BadRequestException if no tenant context
 *
 * @example
 * ```typescript
 * const result = await withTenantContext(async () => {
 *   return this.userRepo.find();
 * });
 * ```
 */
export async function withTenantContext<T>(fn: () => Promise<T>): Promise<T> {
  if (!TenantContext.isActive()) {
    throw new BadRequestException('Tenant context is required');
  }
  return fn();
}

/**
 * Get the current EntityManager with tenant context validation.
 * Throws if not in a tenant transaction context.
 *
 * @param fallbackManager - Optional fallback manager if not in transaction
 * @returns The transaction-scoped EntityManager
 * @throws BadRequestException if no tenant context and no fallback
 */
export function getTenantEntityManager(
  fallbackManager?: EntityManager,
): EntityManager {
  const manager = TenantContext.getEntityManager();
  if (manager) {
    return manager;
  }

  if (fallbackManager) {
    return fallbackManager;
  }

  throw new BadRequestException(
    'Operation requires transaction context. Use TenantTransactionInterceptor or wrap in transaction.',
  );
}

/**
 * Helper to build safe tenant-scoped WHERE conditions.
 * Useful for dynamic query building.
 *
 * @param alias - Table alias
 * @param additionalConditions - Additional WHERE conditions
 * @returns Object with condition string and parameters
 *
 * @example
 * ```typescript
 * const { condition, params } = buildTenantCondition('user', 'user.isActive = :isActive');
 * qb.where(condition, { ...params, isActive: true });
 * ```
 */
export function buildTenantCondition(
  alias: string,
  additionalConditions?: string,
): { condition: string; params: Record<string, unknown> } {
  const tenantId = TenantContext.requireTenantId();
  const condition = additionalConditions
    ? `${alias}.tenantId = :tenantId AND ${additionalConditions}`
    : `${alias}.tenantId = :tenantId`;

  return { condition, params: { tenantId } };
}

/**
 * Validate tenant ownership of an entity.
 * Throws if the entity doesn't belong to the current tenant.
 *
 * @param entity - Entity with tenantId property
 * @param entityName - Name of entity for error messages
 * @throws BadRequestException if tenant mismatch
 */
export function validateTenantOwnership(
  entity: { tenantId?: string },
  entityName = 'Entity',
): void {
  const currentTenantId = TenantContext.requireTenantId();

  if (!entity.tenantId) {
    throw new BadRequestException(`${entityName} does not have tenant context`);
  }

  if (entity.tenantId !== currentTenantId) {
    throw new BadRequestException(
      `${entityName} does not belong to current tenant`,
    );
  }
}
