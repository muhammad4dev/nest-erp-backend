import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { IdentityModule } from './modules/identity/identity.module';
import { FinanceModule } from './modules/finance/finance.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SalesModule } from './modules/sales/sales.module';
import { ProcurementModule } from './modules/procurement/procurement.module';
import { HrmsModule } from './modules/hrms/hrms.module';
import { PosModule } from './modules/pos/pos.module';
import { I18nModule } from './modules/i18n/i18n.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantTransactionInterceptor } from './common/interceptors/tenant-transaction.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    IdentityModule,
    FinanceModule,
    InventoryModule,
    SalesModule,
    ProcurementModule,
    HrmsModule,
    PosModule,
    I18nModule,
    ComplianceModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantTransactionInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).exclude('/').forRoutes('*');
  }
}
