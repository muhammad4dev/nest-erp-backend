import { Test, TestingModule } from '@nestjs/testing';
import { ProcurementController } from './procurement.controller';
import { ProcurementService } from './procurement.service';
import { VendorBillService } from './vendor-bill.service';
import { PermissionsGuard } from '../identity/guards/permissions.guard';

describe('ProcurementController', () => {
  let controller: ProcurementController;

  const mockProcurementService = {};
  const mockVendorBillService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcurementController],
      providers: [
        { provide: ProcurementService, useValue: mockProcurementService },
        { provide: VendorBillService, useValue: mockVendorBillService },
      ],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProcurementController>(ProcurementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
