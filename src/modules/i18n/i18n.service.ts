import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductTranslation } from './entities/product-translation.entity';

@Injectable()
export class I18nService {
  constructor(
    @InjectRepository(ProductTranslation)
    private transRepo: Repository<ProductTranslation>,
  ) {}

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
