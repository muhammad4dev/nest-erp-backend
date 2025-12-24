import {
  Injectable,
  NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { type Observable, from, lastValueFrom } from 'rxjs';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { TenantContext } from '../context/tenant.context';

interface TransactionContext {
  queryRunner: QueryRunner;
  manager: EntityManager;
}

/**
 * Interceptor that wraps every request in a transaction with RLS tenant context.
 * This sets `app.current_tenant_id` at the start of the transaction,
 * making all subsequent database operations automatically RLS-aware.
 *
 * The transaction-scoped EntityManager is stored in TenantContext and can be
 * accessed via TenantContext.getEntityManager() in services.
 */
@Injectable()
export class TenantTransactionInterceptor implements NestInterceptor {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<unknown> {
    const tenantId = TenantContext.getTenantId();

    // If no tenant context, skip transaction (for public routes like health check)
    if (!tenantId) {
      return next.handle();
    }

    const userId = TenantContext.getUserId();

    // Wrap the transaction logic in a Promise-based flow
    return from(this.executeWithTransaction(tenantId, userId, next));
  }

  private async executeWithTransaction(
    tenantId: string,
    userId: string | undefined,
    next: CallHandler<unknown>,
  ): Promise<unknown> {
    const { queryRunner, manager } = await this.setupTransaction(
      tenantId,
      userId,
    );

    // Store the transaction manager in context for services to use
    TenantContext.setEntityManager(manager);

    try {
      const result: unknown = await lastValueFrom(next.handle());
      await queryRunner.commitTransaction();
      return result;
    } catch (error: unknown) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async setupTransaction(
    tenantId: string,
    userId?: string,
  ): Promise<TransactionContext> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Set tenant context for RLS
    await queryRunner.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);

    if (userId) {
      await queryRunner.query(`SET LOCAL app.current_user_id = '${userId}'`);
    }

    return { queryRunner, manager: queryRunner.manager };
  }
}
