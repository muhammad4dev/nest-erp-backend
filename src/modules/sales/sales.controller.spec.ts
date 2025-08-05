import { Test, TestingModule } from '@nestjs/testing';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { InvoiceService } from './invoice.service';
import { PermissionsGuard } from '../identity/guards/permissions.guard';

describe('SalesController', () => {
  let controller: SalesController;

  const mockSalesService = {};
  const mockInvoiceService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalesController],
      providers: [
        { provide: SalesService, useValue: mockSalesService },
        { provide: InvoiceService, useValue: mockInvoiceService },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SalesController>(SalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
