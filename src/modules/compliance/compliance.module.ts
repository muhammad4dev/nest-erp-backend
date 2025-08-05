import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { SalesOrder } from '../sales/entities/sales-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder])],
  providers: [ComplianceService],
  controllers: [ComplianceController],
})
export class ComplianceModule {}
