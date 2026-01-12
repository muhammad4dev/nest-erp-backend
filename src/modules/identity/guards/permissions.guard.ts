import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { UserService } from '../user.service';
import { User } from '../entities/user.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    tenantId: string;
  };
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    if (!user || !user.userId) {
      return false;
    }

    const headerTenant = request.headers?.['x-tenant-id'] as string | undefined;
    const tokenTenant = user.tenantId;

    if (tokenTenant && headerTenant && tokenTenant !== headerTenant) {
      return false;
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();

    try {
      // Step 1: Set RLS context FIRST so we can see the data
      await qr.startTransaction();
      await qr.query("SELECT set_config('app.current_tenant_id', $1, true)", [
        tokenTenant ?? headerTenant,
      ]);
      await qr.query("SELECT set_config('app.current_user_id', $1, true)", [
        user.userId,
      ]);

      // Step 2: Fetch user permissions using the configured RLS context
      // MUST use qr.manager to use the same connection where we set the config!
      const fullUser = await qr.manager.getRepository(User).findOne({
        where: { id: user.userId },
        select: ['id', 'permissions', 'tenantId'],
      });

      if (!fullUser) {
        console.warn(`[PermissionsGuard] User ${user.userId} not found in DB`);
        await qr.rollbackTransaction(); // Rollback if user not found since we started tx
        return false;
      }

      const userPermissions = fullUser.permissions || [];

      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        console.warn(
          `Permission Denied for user ${user.userId}. Missing one of: ${requiredPermissions.join(', ')}`,
        );
        throw new ForbiddenException('Insufficient permissions');
      }

      await qr.commitTransaction();
      return true;
    } catch (e) {
      if (qr.isTransactionActive) {
        await qr.rollbackTransaction();
      }
      throw e;
    } finally {
      await qr.release();
    }
  }
}
