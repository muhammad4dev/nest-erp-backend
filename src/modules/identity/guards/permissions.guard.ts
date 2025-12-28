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
import { TenantContext } from '../../../common/context/tenant.context';

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
    await qr.startTransaction();
    try {
      await qr.query("SELECT set_config('app.current_tenant_id', $1, true)", [
        tokenTenant ?? headerTenant,
      ]);
      await qr.query("SELECT set_config('app.current_user_id', $1, true)", [
        user.userId,
      ]);

      const fullUser = (await TenantContext.run(
        {
          tenantId: tokenTenant ?? headerTenant ?? '',
          userId: user.userId,
          entityManager: qr.manager,
        },
        async () => this.userService.findOne(user.userId),
      )) as User;

      const userRoles = fullUser.roles || [];
      // Map permissions to the canonical "action:resource" format
      const userPermissions = userRoles.flatMap((role) =>
        role.permissions
          ? role.permissions.map((p) => `${p.action}:${p.resource}`)
          : [],
      );

      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );

      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }

      await qr.commitTransaction();
      return true;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }
}
