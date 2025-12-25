import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  VendorBill,
  VendorBillStatus,
  VendorBillType,
} from './entities/vendor-bill.entity';
import { VendorBillLine } from './entities/vendor-bill-line.entity';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';

@Injectable()
export class VendorBillService {
  private billRepo: Repository<VendorBill>;
  private lineRepo: Repository<VendorBillLine>;
  private orderRepo: Repository<PurchaseOrder>;

  constructor(
    @InjectRepository(VendorBill)
    billRepoBase: Repository<VendorBill>,
    @InjectRepository(VendorBillLine)
    lineRepoBase: Repository<VendorBillLine>,
    @InjectRepository(PurchaseOrder)
    orderRepoBase: Repository<PurchaseOrder>,
    private dataSource: DataSource,
  ) {
    this.billRepo = wrapTenantRepository(billRepoBase);
    this.lineRepo = wrapTenantRepository(lineRepoBase);
    this.orderRepo = wrapTenantRepository(orderRepoBase);
  }

  /**
   * Create a vendor bill from a received purchase order
   */
  async createFromOrder(
    orderId: string,
    vendorReference: string,
  ): Promise<VendorBill> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(PurchaseOrder, {
        where: { id: orderId },
        relations: ['partner', 'lines', 'lines.product'],
      });

      if (!order) {
        throw new NotFoundException('Purchase Order not found');
      }

      if (
        order.status !== PurchaseOrderStatus.RECEIVED &&
        order.status !== PurchaseOrderStatus.PURCHASE_ORDER
      ) {
        throw new BadRequestException(
          'Only received or confirmed orders can be billed',
        );
      }

      // Create bill
      const bill = manager.create(VendorBill, {
        billReference: vendorReference,
        partnerId: order.partnerId,
        purchaseOrderId: order.id,
        type: VendorBillType.BILL,
        status: VendorBillStatus.DRAFT,
        tenantId: order.tenantId,
        receivedAt: new Date(),
      });

      await manager.save(VendorBill, bill);

      // Create bill lines from order lines
      let netAmount = 0;
      let taxAmount = 0;

      for (const orderLine of order.lines) {
        const quantity = Number(orderLine.quantity);
        const unitPrice = Number(orderLine.unitPrice);

        const lineNet = quantity * unitPrice;
        const lineTax = lineNet * 0.14; // 14% VAT
        const lineTotal = lineNet + lineTax;

        const billLine = manager.create(VendorBillLine, {
          vendorBillId: bill.id,
          productId: orderLine.productId,
          description: orderLine.product?.name || '',
          quantity,
          unitPrice,
          discountAmount: 0,
          taxAmount: lineTax,
          lineTotal,
          tenantId: order.tenantId,
        });

        await manager.save(VendorBillLine, billLine);

        netAmount += lineNet;
        taxAmount += lineTax;
      }

      // Update bill totals
      bill.netAmount = netAmount;
      bill.taxAmount = taxAmount;
      bill.totalAmount = netAmount + taxAmount;

      await manager.save(VendorBill, bill);

      // Mark order as billed
      order.status = PurchaseOrderStatus.BILLED;
      await manager.save(PurchaseOrder, order);

      return bill;
    });
  }

  /**
   * Post (finalize) a vendor bill
   */
  async postBill(id: string): Promise<VendorBill> {
    const bill = await this.billRepo.findOne({
      where: { id },
      relations: ['lines'],
    });

    if (!bill) {
      throw new NotFoundException('Vendor Bill not found');
    }

    if (bill.status !== VendorBillStatus.DRAFT) {
      throw new BadRequestException('Only draft bills can be posted');
    }

    bill.status = VendorBillStatus.POSTED;

    return this.billRepo.save(bill);
  }

  /**
   * Get bill by ID
   */
  async findOne(id: string): Promise<VendorBill> {
    const bill = await this.billRepo.findOne({
      where: { id },
      relations: ['partner', 'lines', 'lines.product', 'purchaseOrder'],
    });

    if (!bill) {
      throw new NotFoundException('Vendor Bill not found');
    }

    return bill;
  }
}
