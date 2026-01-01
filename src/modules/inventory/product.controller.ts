import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ProductCategoryService } from './product-category.service';
import { ProductAttributeService } from './product-attribute.service';
import { ProductVariantService } from './product-variant.service';
import { ProductCategory } from './entities/product-category.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductVariant } from './entities/product-variant.entity';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/product-category.dto';
import {
  CreateProductAttributeDto,
  UpdateProductAttributeDto,
} from './dto/product-attribute.dto';
import {
  CreateProductVariantDto,
  UpdateProductVariantDto,
} from './dto/product-variant.dto';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(
    private readonly categoryService: ProductCategoryService,
    private readonly attributeService: ProductAttributeService,
    private readonly variantService: ProductVariantService,
  ) {}

  // ========== CATEGORIES ==========

  @Post('categories')
  @ApiOperation({ summary: 'Create a product category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully.',
    type: ProductCategory,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 409, description: 'Category code already exists.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.CREATE)
  createCategory(@Body() dto: CreateProductCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all categories' })
  @ApiResponse({
    status: 200,
    description: 'List of categories.',
    type: [ProductCategory],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  findAllCategories() {
    return this.categoryService.findAll();
  }

  @Get('categories/tree')
  @ApiOperation({ summary: 'Get categories as hierarchical tree' })
  @ApiResponse({
    status: 200,
    description: 'Category tree structure.',
    type: [ProductCategory],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  getCategoryTree() {
    return this.categoryService.findTree();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Category details.',
    type: ProductCategory,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  findCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.findOne(id);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully.',
    type: ProductCategory,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.UPDATE)
  updateCategory(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Deactivate a category' })
  @ApiResponse({ status: 200, description: 'Category deactivated.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete category with subcategories.',
  })
  @RequirePermissions(PERMISSIONS.PRODUCTS.DELETE)
  removeCategory(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.categoryService.remove(id);
  }

  // ========== ATTRIBUTES ==========

  @Post('attributes')
  @ApiOperation({ summary: 'Create a custom product attribute' })
  @ApiResponse({
    status: 201,
    description: 'Attribute created successfully.',
    type: ProductAttribute,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 409, description: 'Attribute code already exists.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.CREATE)
  createAttribute(@Body() dto: CreateProductAttributeDto) {
    return this.attributeService.create(dto);
  }

  @Get('attributes')
  @ApiOperation({ summary: 'List all product attributes' })
  @ApiResponse({
    status: 200,
    description: 'List of attributes.',
    type: [ProductAttribute],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  findAllAttributes() {
    return this.attributeService.findAll();
  }

  @Get('attributes/variant')
  @ApiOperation({
    summary: 'Get attributes used for variants (e.g., size, color)',
  })
  @ApiResponse({
    status: 200,
    description: 'Variant attributes.',
    type: [ProductAttribute],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  getVariantAttributes() {
    return this.attributeService.findVariantAttributes();
  }

  @Get('attributes/filterable')
  @ApiOperation({ summary: 'Get filterable attributes for search/filter UI' })
  @ApiResponse({
    status: 200,
    description: 'Filterable attributes.',
    type: [ProductAttribute],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  getFilterableAttributes() {
    return this.attributeService.findFilterableAttributes();
  }

  @Get('attributes/:id')
  @ApiOperation({ summary: 'Get attribute by ID' })
  @ApiResponse({
    status: 200,
    description: 'Attribute details.',
    type: ProductAttribute,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Attribute not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  findAttribute(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.attributeService.findOne(id);
  }

  @Put('attributes/:id')
  @ApiOperation({ summary: 'Update an attribute' })
  @ApiResponse({
    status: 200,
    description: 'Attribute updated successfully.',
    type: ProductAttribute,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Attribute not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.UPDATE)
  updateAttribute(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductAttributeDto,
  ) {
    return this.attributeService.update(id, dto);
  }

  @Delete('attributes/:id')
  @ApiOperation({ summary: 'Delete an attribute' })
  @ApiResponse({ status: 200, description: 'Attribute deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Attribute not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.DELETE)
  removeAttribute(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.attributeService.remove(id);
  }

  // ========== VARIANTS ==========

  @Post('variants')
  @ApiOperation({ summary: 'Create a product variant' })
  @ApiResponse({
    status: 201,
    description: 'Variant created successfully.',
    type: ProductVariant,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 409, description: 'Variant SKU already exists.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.CREATE)
  createVariant(@Body() dto: CreateProductVariantDto) {
    return this.variantService.create(dto);
  }

  @Get(':productId/variants')
  @ApiOperation({ summary: 'Get all variants for a product' })
  @ApiResponse({
    status: 200,
    description: 'List of variants.',
    type: [ProductVariant],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  findProductVariants(
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
    return this.variantService.findByProduct(productId);
  }

  @Get('variants/:id')
  @ApiOperation({ summary: 'Get variant by ID' })
  @ApiResponse({
    status: 200,
    description: 'Variant details.',
    type: ProductVariant,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Variant not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  findVariant(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.variantService.findOne(id);
  }

  @Put('variants/:id')
  @ApiOperation({ summary: 'Update a variant' })
  @ApiResponse({
    status: 200,
    description: 'Variant updated successfully.',
    type: ProductVariant,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Variant not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.UPDATE)
  updateVariant(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.variantService.update(id, dto);
  }

  @Delete('variants/:id')
  @ApiOperation({ summary: 'Deactivate a variant' })
  @ApiResponse({ status: 200, description: 'Variant deactivated.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Variant not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.DELETE)
  removeVariant(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.variantService.remove(id);
  }

  @Post(':productId/variants/generate')
  @ApiOperation({
    summary: 'Auto-generate variants from attribute combinations',
  })
  @ApiResponse({
    status: 201,
    description: 'Variants generated successfully.',
    type: [ProductVariant],
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.CREATE)
  generateVariants(
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Body() combinations: Array<Record<string, string>>,
  ) {
    return this.variantService.generateVariants(productId, combinations);
  }
}
