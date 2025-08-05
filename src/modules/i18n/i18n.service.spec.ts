import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from './i18n.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductTranslation } from './entities/product-translation.entity';

describe('I18nService', () => {
  let service: I18nService;

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I18nService,
        {
          provide: getRepositoryToken(ProductTranslation),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<I18nService>(I18nService);
  });

  it('should add a translation', async () => {
    const tData = { productId: 'uuid-1', locale: 'ar', name: 'منتج' };
    mockRepo.create.mockReturnValue(tData);
    mockRepo.save.mockResolvedValue({ id: 't-1', ...tData });

    const result = await service.addProductTranslation('uuid-1', 'ar', 'منتج');
    expect(result.id).toBe('t-1');
    expect(result.name).toBe('منتج');
  });

  it('should get a translation', async () => {
    mockRepo.findOne.mockResolvedValue({
      id: 't-1',
      locale: 'ar',
      name: 'منتج',
    });
    const result = await service.getProductTranslation('uuid-1', 'ar');
    expect(result.name).toBe('منتج');
  });
});
