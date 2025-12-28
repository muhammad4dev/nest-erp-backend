import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';
import {
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from './dto/product-variant.dto';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class ProductVariantService {
  private variantRepo: Repository<ProductVariant>;
  private productRepo: Repository<Product>;

  constructor(
    @InjectRepository(ProductVariant)
    variantRepoBase: Repository<ProductVariant>,
    @InjectRepository(Product)
    productRepoBase: Repository<Product>,
  ) {
    this.variantRepo = wrapTenantRepository(variantRepoBase);
    this.productRepo = wrapTenantRepository(productRepoBase);
  }

  async create(dto: CreateProductVariantDto): Promise<ProductVariant> {
    const tenantId = TenantContext.requireTenantId();
    // Verify parent product exists
    const product = await this.productRepo.findOne({
      where: { id: dto.parentProductId },
    });

    if (!product) {
      throw new NotFoundException('Parent product not found');
    }

    // Check SKU uniqueness
    const existingSku = await this.variantRepo.findOne({
      where: { sku: dto.sku },
    });

    if (existingSku) {
      throw new ConflictException('Variant SKU already exists');
    }

    const variant = this.variantRepo.create({ ...dto, tenantId });
    const savedVariant = await this.variantRepo.save(variant);

    // Mark parent as having variants
    if (!product.hasVariants) {
      product.hasVariants = true;
      await this.productRepo.save(product);
    }

    return savedVariant;
  }

  async findByProduct(productId: string): Promise<ProductVariant[]> {
    return this.variantRepo.find({
      where: { parentProductId: productId, isActive: true },
      order: { sku: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductVariant> {
    const variant = await this.variantRepo.findOne({
      where: { id },
      relations: ['parentProduct'],
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    return variant;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    return this.variantRepo.findOne({
      where: { sku },
      relations: ['parentProduct'],
    });
  }

  async update(
    id: string,
    dto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.findOne(id);

    if (dto.sku && dto.sku !== variant.sku) {
      const existingSku = await this.variantRepo.findOne({
        where: { sku: dto.sku },
      });
      if (existingSku) {
        throw new ConflictException('Variant SKU already exists');
      }
    }

    Object.assign(variant, dto);
    return this.variantRepo.save(variant);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const variant = await this.findOne(id);

    // Soft delete - deactivate
    variant.isActive = false;
    await this.variantRepo.save(variant);

    return { success: true };
  }

  async generateVariants(
    productId: string,
    attributeCombinations: Array<Record<string, string>>,
  ): Promise<ProductVariant[]> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variants: ProductVariant[] = [];

    for (const attrs of attributeCombinations) {
      const variantName = Object.values(attrs).join(' - ');
      const skuSuffix = Object.values(attrs)
        .map((v) => v.toUpperCase().substring(0, 3))
        .join('-');

      const tenantId = TenantContext.requireTenantId();

      const variant = this.variantRepo.create({
        parentProductId: productId,
        sku: `${product.sku}-${skuSuffix}`,
        name: variantName,
        variantAttributes: attrs,
        salesPrice: product.salesPrice,
        costPrice: product.costPrice,
        tenantId,
      });

      variants.push(await this.variantRepo.save(variant));
    }

    // Mark product as having variants
    product.hasVariants = true;
    await this.productRepo.save(product);

    return variants;
  }
}
