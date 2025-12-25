import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';
import { VendorBill, VendorBillStatus } from './entities/vendor-bill.entity';
import { APAgingQueryDto, APAgingEntry } from './dto/account-payable.dto';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';

@Injectable()
export class ProcurementService {
  private poRepo: Repository<PurchaseOrder>;
  private billRepo: Repository<VendorBill>;

  constructor(
    @InjectRepository(PurchaseOrder)
    poRepoBase: Repository<PurchaseOrder>,
    @InjectRepository(VendorBill)
    billRepoBase: Repository<VendorBill>,
    private dataSource: DataSource,
  ) {
    this.poRepo = wrapTenantRepository(poRepoBase);
    this.billRepo = wrapTenantRepository(billRepoBase);
  }

  async createRFQ(data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    const rfq = this.poRepo.create({
      ...data,
      status: PurchaseOrderStatus.RFQ,
      orderNumber: `PO-${Date.now()}`, // Sequencer needed
    });
    return this.poRepo.save(rfq);
  }

  async confirmOrder(id: string): Promise<PurchaseOrder> {
    return this.dataSource.transaction(async (manager) => {
      const po = await manager.findOne(PurchaseOrder, {
        where: { id },
        relations: ['lines'],
      });

      if (!po) throw new NotFoundException('Purchase Order not found');

      if (
        po.status !== PurchaseOrderStatus.RFQ &&
        po.status !== PurchaseOrderStatus.RFQ_SENT
      ) {
        throw new BadRequestException('Only RFQs can be confirmed to Orders');
      }

      po.status = PurchaseOrderStatus.PURCHASE_ORDER;
      return manager.save(PurchaseOrder, po);
    });
  }

  async getAPAgingReport(query: APAgingQueryDto): Promise<APAgingEntry[]> {
    const qb = this.billRepo
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.partner', 'partner')
      .where('bill.status NOT IN (:...statuses)', {
        statuses: [VendorBillStatus.PAID, VendorBillStatus.CANCELLED],
      });

    if (query.partnerId) {
      qb.andWhere('bill.partnerId = :partnerId', {
        partnerId: query.partnerId,
      });
    }

    const bills = await qb.getMany();
    const today = query.date ? new Date(query.date) : new Date();
    const map = new Map<string, APAgingEntry>();

    for (const bill of bills) {
      if (!map.has(bill.partnerId)) {
        map.set(bill.partnerId, {
          partnerId: bill.partnerId,
          partnerName: bill.partner.name,
          currentAmount: 0,
          overdue1To30: 0,
          overdue31To60: 0,
          overdue61To90: 0,
          overdue90Plus: 0,
          totalDue: 0,
        });
      }

      const entry = map.get(bill.partnerId)!;
      const amountDue = Number(bill.totalAmount) - Number(bill.amountPaid);

      entry.totalDue += amountDue;

      if (!bill.dueDate) {
        entry.currentAmount += amountDue;
        continue;
      }

      const dueDate = new Date(bill.dueDate);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        entry.currentAmount += amountDue;
      } else if (diffDays <= 30) {
        entry.overdue1To30 += amountDue;
      } else if (diffDays <= 60) {
        entry.overdue31To60 += amountDue;
      } else if (diffDays <= 90) {
        entry.overdue61To90 += amountDue;
      } else {
        entry.overdue90Plus += amountDue;
      }
    }

    return Array.from(map.values());
  }
}
