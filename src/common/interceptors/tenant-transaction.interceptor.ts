import {
  Injectable,
  NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { type Observable, from, lastValueFrom } from 'rxjs';
import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { Request } from 'express';
import { TenantContext } from '../context/tenant.context';

interface TransactionContext {
  queryRunner: QueryRunner;
  manager: EntityManager;
}

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId?: string;
    userId?: string;
  };
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
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const headerTenant = req.headers?.['x-tenant-id'];
    const tokenTenant = req.user?.tenantId;
    const userId = req.user?.userId;

    // If authenticated, enforce that header tenant matches token tenant to avoid confusing RLS 404s
    if (
      tokenTenant &&
      typeof headerTenant === 'string' &&
      headerTenant !== tokenTenant
    ) {
      throw new Error(
        'Unauthorized: tenant mismatch between token and x-tenant-id header',
      );
    }

    // Record userId in context if available (for audit triggers)
    if (userId) {
      TenantContext.setUserId(userId);
    }

    // If no tenant context, skip transaction (for public routes like health check)
    if (!tenantId) {
      return next.handle();
    }

    const userIdFromContext = TenantContext.getUserId();

    // Wrap the transaction logic in a Promise-based flow
    return from(this.executeWithTransaction(tenantId, userIdFromContext, next));
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

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // Set tenant context for RLS using set_config (allows parameterization)
      // SET LOCAL does not support bind parameters; set_config does and is scoped to the transaction when `is_local=true`.
      await queryRunner.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenantId],
      );

      if (userId) {
        await queryRunner.query(
          "SELECT set_config('app.current_user_id', $1, true)",
          [userId],
        );
      }

      return { queryRunner, manager: queryRunner.manager };
    } catch (error) {
      await queryRunner.release();
      throw error;
    }
  }
}
