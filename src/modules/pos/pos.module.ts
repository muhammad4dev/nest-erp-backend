import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { SalesOrder } from '../sales/entities/sales-order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SalesOrder])],
  providers: [PosService],
  controllers: [PosController],
})
export class PosModule {}
