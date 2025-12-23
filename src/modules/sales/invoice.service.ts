import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Invoice, InvoiceStatus, InvoiceType } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { SalesOrder, SalesOrderStatus } from './entities/sales-order.entity';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceLine)
    private lineRepo: Repository<InvoiceLine>,
    @InjectRepository(SalesOrder)
    private orderRepo: Repository<SalesOrder>,
    private dataSource: DataSource,
  ) {}

  async findAll(status?: InvoiceStatus): Promise<Invoice[]> {
    const query = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partner', 'partner')
      .orderBy('inv.createdAt', 'DESC');

    if (status) {
      query.where('inv.status = :status', { status });
    }

    return query.getMany();
  }

  /**
   * Generate an invoice from a confirmed sales order
   */
  async createFromOrder(orderId: string): Promise<Invoice> {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.findOne(SalesOrder, {
        where: { id: orderId },
        relations: ['partner', 'lines', 'lines.product'],
      });

      if (!order) {
        throw new NotFoundException('Sales Order not found');
      }

      if (order.status !== SalesOrderStatus.CONFIRMED) {
        throw new BadRequestException('Only confirmed orders can be invoiced');
      }

      // Create invoice
      const invoice = manager.create(Invoice, {
        number: `INV-${Date.now()}`,
        partnerId: order.partnerId,
        salesOrderId: order.id,
        type: InvoiceType.INVOICE,
        status: InvoiceStatus.DRAFT,
        tenantId: order.tenantId,
      });

      await manager.save(Invoice, invoice);

      // Create invoice lines from order lines
      let netAmount = 0;
      let taxAmount = 0;

      for (const orderLine of order.lines) {
        const quantity = Number(orderLine.quantity);
        const unitPrice = Number(orderLine.unitPrice);
        const discountRate = Number(orderLine.discountRate || 0);

        const subtotal = quantity * unitPrice;
        const discountAmount = subtotal * (discountRate / 100);
        const lineNet = subtotal - discountAmount;
        const lineTax = lineNet * 0.14; // 14% VAT
        const lineTotal = lineNet + lineTax;

        const invoiceLine = manager.create(InvoiceLine, {
          invoiceId: invoice.id,
          productId: orderLine.productId,
          description: orderLine.product?.name || '',
          quantity,
          unitPrice,
          discountRate,
          discountAmount,
          taxAmount: lineTax,
          lineTotal,
          tenantId: order.tenantId,
        });

        await manager.save(InvoiceLine, invoiceLine);

        netAmount += lineNet;
        taxAmount += lineTax;
      }

      // Update invoice totals
      invoice.netAmount = netAmount;
      invoice.taxAmount = taxAmount;
      invoice.totalAmount = netAmount + taxAmount;

      await manager.save(Invoice, invoice);

      // Mark order as invoiced
      order.status = SalesOrderStatus.INVOICED;
      await manager.save(SalesOrder, order);

      return invoice;
    });
  }

  /**
   * Post (finalize) an invoice
   */
  async postInvoice(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: ['lines'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only draft invoices can be posted');
    }

    invoice.status = InvoiceStatus.SENT;
    invoice.issuedAt = new Date();

    return this.invoiceRepo.save(invoice);
  }

  /**
   * Get invoice by ID
   */
  async findOne(id: string): Promise<Invoice> {
    const tenantId = TenantContext.getTenantId();

    const qb = this.invoiceRepo
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partner', 'partner')
      .leftJoinAndSelect('inv.lines', 'lines')
      .leftJoinAndSelect('lines.product', 'product')
      .leftJoinAndSelect('inv.salesOrder', 'salesOrder')
      .where('inv.id = :id', { id });

    if (tenantId) {
      qb.andWhere('inv.tenantId = :tenantId', { tenantId });
    }

    const invoice = await qb.getOne();

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }
}
