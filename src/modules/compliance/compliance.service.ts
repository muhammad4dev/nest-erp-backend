import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { SalesOrderLine } from '../sales/entities/sales-order-line.entity';
import {
  EtaInvoiceDto,
  EtaPartyDto,
  EtaInvoiceLineDto,
  EtaAddressDto,
} from './dto/eta-invoice.dto';

@Injectable()
export class ComplianceService {
  // In a real app, issuer data comes from Tenant configuration
  private readonly issuerData: EtaPartyDto = {
    address: {
      country: 'EG',
      governate: 'Cairo',
      regionCity: 'Nasr City',
      street: 'Finance St',
      buildingNumber: '10',
    },
    type: 'B',
    id: '100-200-300', // My Tax ID
    name: 'My ERP Tenant Company',
  };

  mapToCanonical(order: SalesOrder): EtaInvoiceDto {
    if (!order.partner || !order.lines) {
      throw new InternalServerErrorException(
        'Order must have loaded Partner and Lines',
      );
    }

    // Default Receiver Address (Mock if missing)
    const receiverAddress: EtaAddressDto = {
      country: 'EG',
      governate: 'Giza',
      regionCity: 'Dokki',
      street: 'Tahrir St',
      buildingNumber: '5',
    };

    const lines = order.lines.map((line: SalesOrderLine) => {
      // Basic Tax Logic (Assumption: 14% VAT built-in or calculated)
      // For this scaffold, assuming price includes tax or simple calc
      const quantity = Number(line.quantity);
      const unitPrice = Number(line.unitPrice);
      const salesTotal = quantity * unitPrice;
      const discount = (Number(line.discountRate || 0) / 100) * salesTotal;
      const netTotal = salesTotal - discount;

      // Detailed tax calculation would go here. Assuming 14% VAT T1
      const taxRate = 14;
      const taxAmount = netTotal * (taxRate / 100);
      const total = netTotal + taxAmount;

      const etaLine: EtaInvoiceLineDto = {
        description: line.product?.name || 'Item',
        itemType: 'GS1',
        itemCode: line.product?.taxCode || 'DEFAULT-CODE',
        unitType: line.product?.uom?.name || 'UNIT', // Should be ETA code like "EA"
        quantity: quantity,
        unitValue: {
          currencySold: 'EGP',
          amountEGP: unitPrice,
        },
        salesTotal: salesTotal,
        total: total,
        valueDifference: 0,
        totalTaxableFees: 0,
        netTotal: netTotal,
        itemsDiscount: discount,
        taxableItems: [
          {
            taxType: 'T1',
            amount: taxAmount,
            rate: taxRate,
            subType: 'V009',
          },
        ],
      };
      return etaLine;
    });

    const totalSales = lines.reduce((sum, l) => sum + l.salesTotal, 0);
    const totalDiscount = lines.reduce((sum, l) => sum + l.itemsDiscount, 0);
    const netAmount = lines.reduce((sum, l) => sum + l.netTotal, 0);
    const totalTax = lines.reduce(
      (sum, l) => sum + l.taxableItems[0].amount,
      0,
    ); // Simplified
    const totalAmount = netAmount + totalTax;

    return {
      issuer: this.issuerData,
      receiver: {
        address: receiverAddress,
        type: order.partner.taxId ? 'B' : 'P',
        id: order.partner.taxId || '',
        name: order.partner.name,
      },
      documentType: 'I',
      documentTypeVersion: '1.0',
      dateTimeIssued: new Date(order.orderDate).toISOString(), // Should be UTC
      taxpayerActivityCode: '4620', // Retail trade
      internalID: order.orderNumber,
      invoiceLines: lines,
      totalSalesAmount: totalSales,
      totalDiscountAmount: totalDiscount,
      netAmount: netAmount,
      taxTotals: [
        {
          taxType: 'T1',
          amount: totalTax,
        },
      ],
      totalAmount: totalAmount,
      extraDiscountAmount: 0,
      totalItemsDiscountAmount: 0,
    };
  }
}
