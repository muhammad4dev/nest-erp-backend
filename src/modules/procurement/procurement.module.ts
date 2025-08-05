import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcurementService } from './procurement.service';
import { ProcurementController } from './procurement.controller';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';
import { VendorBill } from './entities/vendor-bill.entity';
import { VendorBillLine } from './entities/vendor-bill-line.entity';
import { VendorBillService } from './vendor-bill.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PurchaseOrder,
      PurchaseOrderLine,
      VendorBill,
      VendorBillLine,
    ]),
  ],
  controllers: [ProcurementController],
  providers: [ProcurementService, VendorBillService],
  exports: [ProcurementService, VendorBillService],
})
export class ProcurementModule {}
