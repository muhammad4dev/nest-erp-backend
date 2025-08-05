import { Test, TestingModule } from '@nestjs/testing';
import { HrmsController } from './hrms.controller';
import { HrmsService } from './hrms.service';
import { PermissionsGuard } from '../identity/guards/permissions.guard';

describe('HrmsController', () => {
  let controller: HrmsController;

  const mockHrmsService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HrmsController],
      providers: [{ provide: HrmsService, useValue: mockHrmsService }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<HrmsController>(HrmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
