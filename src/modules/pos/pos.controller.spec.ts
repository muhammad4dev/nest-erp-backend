import { Test, TestingModule } from '@nestjs/testing';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PermissionsGuard } from '../identity/guards/permissions.guard';

describe('PosController', () => {
  let controller: PosController;

  const mockPosService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PosController],
      providers: [{ provide: PosService, useValue: mockPosService }],
    })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PosController>(PosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
