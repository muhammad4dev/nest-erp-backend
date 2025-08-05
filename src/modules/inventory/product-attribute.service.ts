import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductAttribute } from './entities/product-attribute.entity';
import {
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
} from './dto/product-attribute.dto';

@Injectable()
export class ProductAttributeService {
  constructor(
    @InjectRepository(ProductAttribute)
    private attributeRepo: Repository<ProductAttribute>,
  ) {}

  async create(dto: CreateProductAttributeDto): Promise<ProductAttribute> {
    const existing = await this.attributeRepo.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Attribute code already exists');
    }

    const attribute = this.attributeRepo.create(dto);
    return this.attributeRepo.save(attribute);
  }

  async findAll(): Promise<ProductAttribute[]> {
    return this.attributeRepo.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findVariantAttributes(): Promise<ProductAttribute[]> {
    return this.attributeRepo.find({
      where: { isVariant: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findFilterableAttributes(): Promise<ProductAttribute[]> {
    return this.attributeRepo.find({
      where: { isFilterable: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductAttribute> {
    const attribute = await this.attributeRepo.findOne({
      where: { id },
    });

    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }

    return attribute;
  }

  async findByCode(code: string): Promise<ProductAttribute | null> {
    return this.attributeRepo.findOne({ where: { code } });
  }

  async update(
    id: string,
    dto: UpdateProductAttributeDto,
  ): Promise<ProductAttribute> {
    const attribute = await this.findOne(id);

    if (dto.code && dto.code !== attribute.code) {
      const existing = await this.attributeRepo.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Attribute code already exists');
      }
    }

    Object.assign(attribute, dto);
    return this.attributeRepo.save(attribute);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const attribute = await this.findOne(id);
    await this.attributeRepo.remove(attribute);
    return { success: true };
  }
}
