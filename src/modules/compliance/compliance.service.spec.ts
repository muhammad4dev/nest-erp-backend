import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { Partner } from '../sales/entities/partner.entity';
import { SalesOrderLine } from '../sales/entities/sales-order-line.entity';

describe('ComplianceService', () => {
  let service: ComplianceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComplianceService],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);
  });

  it('should map a SalesOrder to ETA Canonical JSON', () => {
    // Mock Data
    const partner = new Partner();
    partner.name = 'Client Corp';
    partner.taxId = '999-999-999';

    const line = new SalesOrderLine();
    line.unitPrice = 100;
    line.quantity = 2;
    line.discountRate = 10; // 10% discount. SalesTotal=200, Disc=20, Net=180
    // Tax on 180 is 14% = 25.2. Total = 205.2

    // We mocked product in service to have 'name', 'taxCode'. But entity expects relation.
    // In test we can just cast or assign partial
    (line as any).product = {
      name: 'Widget',
      taxCode: 'EG-123',
      uom: { name: 'EA' },
    };

    const order = new SalesOrder();
    order.orderNumber = 'SO-1001';
    order.orderDate = '2023-01-01';
    order.partner = partner;
    order.lines = [line];

    const result = service.mapToCanonical(order);

    expect(result.documentType).toBe('I');
    expect(result.receiver.name).toBe('Client Corp');
    expect(result.invoiceLines).toHaveLength(1);

    const mappedLine = result.invoiceLines[0];
    expect(mappedLine.netTotal).toBe(180);
    expect(mappedLine.taxableItems[0].amount).toBeCloseTo(25.2);
    expect(mappedLine.total).toBeCloseTo(205.2);

    expect(result.totalAmount).toBeCloseTo(205.2);
    expect(result.totalSalesAmount).toBe(200);
    expect(result.netAmount).toBe(180);
  });
});
