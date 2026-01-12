import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role, Permission } from './entities/role.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Branch } from './entities/branch.entity';
import { Tenant } from './entities/tenant.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { PermissionsGuard } from './guards/permissions.guard';
import { SystemAuditLog } from './entities/audit-log.entity';
import { PermissionSyncService } from './permission-sync.service';
import { UserPermissionsService } from './user-permissions.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      RefreshToken,
      Branch,
      Tenant,
      SystemAuditLog,
    ]),
  ],
  controllers: [UserController, TenantController, RolesController],
  providers: [
    UserService,
    TenantService,
    RolesService,
    PermissionsGuard,
    PermissionSyncService,
    UserPermissionsService,
  ],
  exports: [
    UserService,
    TenantService,
    RolesService,
    PermissionsGuard,
    TypeOrmModule,
    PermissionSyncService,
    UserPermissionsService,
  ],
})
export class IdentityModule {}
