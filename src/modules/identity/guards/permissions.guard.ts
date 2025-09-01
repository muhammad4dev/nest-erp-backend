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

    // Fetch full user details with roles and permissions
    const fullUser = (await this.userService.findOne(user.userId)) as User;
    const userRoles = fullUser.roles || [];

    // Flatten all permissions from all roles
    const userPermissions = userRoles.flatMap((role) =>
      role.permissions ? role.permissions.map((p) => p.action) : [],
    );

    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
