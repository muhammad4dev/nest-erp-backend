import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrmsService } from './hrms.service';
import { HrmsController } from './hrms.controller';
import { Employee } from './entities/employee.entity';
import { EmploymentContract } from './entities/employment-contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Employee, EmploymentContract])],
  controllers: [HrmsController],
  providers: [HrmsService],
  exports: [HrmsService],
})
export class HrmsModule {}
