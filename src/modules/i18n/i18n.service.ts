import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductTranslation } from './entities/product-translation.entity';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';

@Injectable()
export class I18nService {
  private transRepo: Repository<ProductTranslation>;

  constructor(
    @InjectRepository(ProductTranslation)
    transRepoBase: Repository<ProductTranslation>,
  ) {
    this.transRepo = wrapTenantRepository(transRepoBase);
  }

  async addProductTranslation(
    productId: string,
    locale: string,
    name: string,
  ): Promise<ProductTranslation> {
    const translation = this.transRepo.create({
      productId,
      locale,
      name,
    });
    return this.transRepo.save(translation);
  }

  async getProductTranslation(
    productId: string,
    locale: string,
  ): Promise<ProductTranslation | null> {
    const translation = await this.transRepo.findOne({
      where: { productId, locale },
    });
    if (!translation) return null; // Or fallback logic handled by caller
    return translation;
  }
}
