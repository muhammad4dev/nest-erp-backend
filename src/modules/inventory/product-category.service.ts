import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/product-category.dto';

@Injectable()
export class ProductCategoryService {
  constructor(
    @InjectRepository(ProductCategory)
    private categoryRepo: Repository<ProductCategory>,
  ) {}

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
    const existing = await this.categoryRepo.findOne({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Category code already exists');
    }

    const category = this.categoryRepo.create(dto);
    return this.categoryRepo.save(category);
  }

  async findAll(): Promise<ProductCategory[]> {
    return this.categoryRepo.find({
      relations: ['parent'],
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findTree(): Promise<ProductCategory[]> {
    // Return only root categories with children
    return this.categoryRepo.find({
      where: { parentId: undefined },
      relations: ['children', 'children.children'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    id: string,
    dto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    const category = await this.findOne(id);

    if (dto.code && dto.code !== category.code) {
      const existing = await this.categoryRepo.findOne({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Category code already exists');
      }
    }

    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const category = await this.findOne(id);

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    // Soft delete - just deactivate
    category.isActive = false;
    await this.categoryRepo.save(category);

    return { success: true };
  }
}
