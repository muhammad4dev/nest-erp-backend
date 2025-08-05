import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { PartnerService } from './partner.service';
import { PartnerController } from './partner.controller';
import { SalesOrder } from './entities/sales-order.entity';
import { SalesOrderLine } from './entities/sales-order-line.entity';
import { Partner } from './entities/partner.entity';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SalesOrder,
      SalesOrderLine,
      Partner,
      Invoice,
      InvoiceLine,
    ]),
  ],
  controllers: [SalesController, PartnerController],
  providers: [SalesService, InvoiceService, PartnerService],
  exports: [SalesService, InvoiceService, PartnerService],
})
export class SalesModule {}
