import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { SalesOrder, SalesOrderStatus } from './entities/sales-order.entity';
import { SalesOrderLine } from './entities/sales-order-line.entity';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import {
  SalesAnalysisGroupBy,
  SalesAnalysisQueryDto,
  SalesAnalysisEntry,
} from './dto/sales-reports.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { ARAgingQueryDto, ARAgingEntry } from './dto/account-receivable.dto';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(SalesOrder)
    private orderRepo: Repository<SalesOrder>,
    @InjectRepository(SalesOrderLine)
    private lineRepo: Repository<SalesOrderLine>,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    private dataSource: DataSource,
  ) {}

  // ========== CRUD OPERATIONS ==========

  async createOrder(
    partnerId: string,
    lines: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discountRate?: number;
    }>,
  ): Promise<SalesOrder> {
    const order = this.orderRepo.create({
      partner: { id: partnerId } as never,
      orderDate: new Date().toISOString().split('T')[0],
      orderNumber: `SO-${Date.now()}`,
      status: SalesOrderStatus.DRAFT,
      lines: lines.map((l) =>
        this.lineRepo.create({
          product: { id: l.productId } as never,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountRate: l.discountRate || 0,
        }),
      ),
    });
    return this.orderRepo.save(order);
  }

  async findAll(status?: SalesOrderStatus): Promise<SalesOrder[]> {
    const query = this.orderRepo
      .createQueryBuilder('so')
      .leftJoinAndSelect('so.partner', 'partner')
      .leftJoinAndSelect('so.lines', 'lines')
      .orderBy('so.createdAt', 'DESC');

    if (status) {
      query.where('so.status = :status', { status });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<SalesOrder> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['partner', 'lines', 'lines.product'],
    });

    if (!order) {
      throw new NotFoundException('Sales order not found');
    }

    return order;
  }

  async update(id: string, dto: UpdateSalesOrderDto): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be updated');
    }

    Object.assign(order, dto);
    return this.orderRepo.save(order);
  }

  // ========== STATE TRANSITIONS ==========

  async confirmOrder(id: string): Promise<SalesOrder> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(SalesOrder, {
        where: { id },
        relations: ['lines', 'lines.product'],
      });

      if (!order) throw new NotFoundException('Order not found');
      if (order.status !== SalesOrderStatus.DRAFT) {
        throw new BadRequestException('Only drafts can be confirmed');
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const line of order.lines) {
        const qty = Number(line.quantity);
        const price = Number(line.unitPrice);
        const discount = Number(line.discountRate || 0);
        const lineTotal = qty * price * (1 - discount / 100);
        totalAmount += lineTotal;
      }

      order.totalAmount = totalAmount;
      order.status = SalesOrderStatus.CONFIRMED;
      return manager.save(SalesOrder, order);
    });
  }

  async sendQuote(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException('Only draft orders can be sent as quotes');
    }

    order.status = SalesOrderStatus.SENT;
    return this.orderRepo.save(order);
  }

  async cancelOrder(id: string): Promise<SalesOrder> {
    const order = await this.findOne(id);

    if (order.status === SalesOrderStatus.INVOICED) {
      throw new BadRequestException('Cannot cancel an invoiced order');
    }

    if (order.status === SalesOrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled');
    }

    order.status = SalesOrderStatus.CANCELLED;
    return this.orderRepo.save(order);
  }

  // ========== LEGACY METHOD ==========

  async createQuote(data: Partial<SalesOrder>): Promise<SalesOrder> {
    const quote = this.orderRepo.create({
      ...data,
      status: SalesOrderStatus.DRAFT,
      orderNumber: `SO-${Date.now()}`,
    });
    return this.orderRepo.save(quote);
  }

  // ========== REPORTS ==========

  async getSalesAnalysis(
    query: SalesAnalysisQueryDto,
  ): Promise<SalesAnalysisEntry[]> {
    const groupBy = query.groupBy || SalesAnalysisGroupBy.CUSTOMER;

    if (groupBy === SalesAnalysisGroupBy.CUSTOMER) {
      const qb = this.orderRepo
        .createQueryBuilder('so')
        .leftJoin('so.partner', 'partner')
        .select('partner.id', 'id')
        .addSelect('partner.name', 'name')
        .addSelect('COUNT(so.id)', 'orderCount')
        .addSelect('SUM(so.totalAmount)', 'totalRevenue')
        .where('so.status IN (:...statuses)', {
          statuses: [SalesOrderStatus.CONFIRMED, SalesOrderStatus.INVOICED],
        })
        .groupBy('partner.id')
        .addGroupBy('partner.name');

      if (query.startDate) {
        qb.andWhere('so.orderDate >= :startDate', {
          startDate: query.startDate,
        });
      }

      if (query.endDate) {
        qb.andWhere('so.orderDate <= :endDate', {
          endDate: query.endDate,
        });
      }

      const results: SalesAnalysisEntry[] = await qb.getRawMany();

      return results.map((row) => ({
        id: row.id || 'N/A',
        name: row.name || 'Unknown Partner',
        orderCount: Number(row.orderCount),
        totalRevenue: Number(row.totalRevenue),
      }));
    } else {
      // Group by PRODUCT
      const qb = this.lineRepo
        .createQueryBuilder('line')
        .leftJoin('line.order', 'so')
        .leftJoin('line.product', 'product')
        .select('product.id', 'id')
        .addSelect('product.name', 'name')
        .addSelect('COUNT(DISTINCT so.id)', 'orderCount')
        .addSelect(
          'SUM((line.quantity * line.unitPrice) * (1 - line.discountRate / 100))',
          'totalRevenue',
        )
        .where('so.status IN (:...statuses)', {
          statuses: [SalesOrderStatus.CONFIRMED, SalesOrderStatus.INVOICED],
        })
        .groupBy('product.id')
        .addGroupBy('product.name');

      if (query.startDate) {
        qb.andWhere('so.orderDate >= :startDate', {
          startDate: query.startDate,
        });
      }

      if (query.endDate) {
        qb.andWhere('so.orderDate <= :endDate', {
          endDate: query.endDate,
        });
      }

      const results: SalesAnalysisEntry[] = await qb.getRawMany();

      return results.map((row) => ({
        id: row.id,
        name: row.name,
        orderCount: Number(row.orderCount),
        totalRevenue: Number(row.totalRevenue),
      }));
    }
  }

  async getARAgingReport(query: ARAgingQueryDto): Promise<ARAgingEntry[]> {
    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partner', 'partner')
      .where('inv.status NOT IN (:...statuses)', {
        statuses: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED],
      });

    if (query.partnerId) {
      qb.andWhere('inv.partnerId = :partnerId', {
        partnerId: query.partnerId,
      });
    }

    const invoices = await qb.getMany();
    const today = query.date ? new Date(query.date) : new Date();
    const map = new Map<string, ARAgingEntry>();

    for (const inv of invoices) {
      if (!map.has(inv.partnerId)) {
        map.set(inv.partnerId, {
          partnerId: inv.partnerId,
          partnerName: inv.partner.name,
          currentAmount: 0,
          overdue1To30: 0,
          overdue31To60: 0,
          overdue61To90: 0,
          overdue90Plus: 0,
          totalDue: 0,
        });
      }

      const entry = map.get(inv.partnerId)!;
      const amountDue = Number(inv.totalAmount) - Number(inv.amountPaid);

      entry.totalDue += amountDue;

      if (!inv.dueDate) {
        entry.currentAmount += amountDue;
        continue;
      }

      const dueDate = new Date(inv.dueDate);
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
