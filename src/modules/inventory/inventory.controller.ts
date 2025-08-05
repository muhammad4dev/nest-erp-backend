import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { StockTransferDto, StockAdjustmentDto } from './dto/stock.dto';
import { StockLedgerQueryDto, StockLedgerEntry } from './dto/stock-ledger.dto';
import {
  StockValuationQueryDto,
  StockValuationEntry,
} from './dto/inventory-reports.dto';
import { Product } from './entities/product.entity';
import { Location } from './entities/location.entity';
import { StockQuant } from './entities/stock-quant.entity';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ========== PRODUCTS ==========

  @Post('products')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 409, description: 'SKU already exists.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.CREATE)
  createProduct(@Body() dto: CreateProductDto) {
    return this.inventoryService.createProduct(dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({
    status: 200,
    description: 'List of products.',
    type: [Product],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  findAllProducts() {
    return this.inventoryService.findAllProducts();
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({
    status: 200,
    description: 'Product details with translations.',
    type: Product,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.READ)
  findProduct(@Param('id') id: string) {
    return this.inventoryService.findProduct(id);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully.',
    type: Product,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @RequirePermissions(PERMISSIONS.PRODUCTS.UPDATE)
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.inventoryService.updateProduct(id, dto);
  }

  // ========== LOCATIONS ==========

  @Post('locations')
  @ApiOperation({ summary: 'Create a new location/warehouse' })
  @ApiResponse({
    status: 201,
    description: 'Location created successfully.',
    type: Location,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.LOCATIONS.CREATE)
  createLocation(@Body() dto: CreateLocationDto) {
    return this.inventoryService.createLocation(dto);
  }

  @Get('locations')
  @ApiOperation({ summary: 'List all locations/warehouses' })
  @ApiResponse({
    status: 200,
    description: 'List of locations.',
    type: [Location],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.LOCATIONS.READ)
  findAllLocations() {
    return this.inventoryService.findAllLocations();
  }

  @Get('locations/:id')
  @ApiOperation({ summary: 'Get location with its stock' })
  @ApiResponse({
    status: 200,
    description: 'Location with stock details.',
    type: Location,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  @RequirePermissions(PERMISSIONS.LOCATIONS.READ)
  findLocation(@Param('id') id: string) {
    return this.inventoryService.findLocation(id);
  }

  @Put('locations/:id')
  @ApiOperation({ summary: 'Update a location' })
  @ApiResponse({
    status: 200,
    description: 'Location updated successfully.',
    type: Location,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Location not found.' })
  @RequirePermissions(PERMISSIONS.LOCATIONS.UPDATE)
  updateLocation(@Param('id') id: string, @Body() dto: UpdateLocationDto) {
    return this.inventoryService.updateLocation(id, dto);
  }

  // ========== STOCK OPERATIONS ==========

  @Get('stock/:productId/:locationId')
  @ApiOperation({
    summary: 'Check available stock for a product in a location',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns the quantity available.',
    type: Number,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  checkStock(
    @Param('productId') productId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.inventoryService.getAvailableStock(productId, locationId);
  }

  @Get('stock/product/:productId')
  @ApiOperation({ summary: 'Get all stock locations for a product' })
  @ApiResponse({
    status: 200,
    description: 'Stock by location for the product.',
    type: [StockQuant],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getStockByProduct(@Param('productId') productId: string) {
    return this.inventoryService.getStockByProduct(productId);
  }

  @Get('stock/location/:locationId')
  @ApiOperation({ summary: 'Get all stock in a location' })
  @ApiResponse({
    status: 200,
    description: 'All products stocked in this location.',
    type: [StockQuant],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getStockByLocation(@Param('locationId') locationId: string) {
    return this.inventoryService.getStockByLocation(locationId);
  }

  @Post('stock/transfer')
  @ApiOperation({ summary: 'Transfer stock between locations' })
  @ApiResponse({ status: 200, description: 'Stock transferred successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Insufficient stock or invalid transfer.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.TRANSFER)
  transferStock(@Body() dto: StockTransferDto) {
    return this.inventoryService.transferStock(dto);
  }

  @Post('stock/adjust')
  @ApiOperation({ summary: 'Adjust stock (inventory count correction)' })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted successfully.',
    type: StockQuant,
  })
  @ApiResponse({ status: 400, description: 'Invalid adjustment.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.ADJUST)
  adjustStock(@Body() dto: StockAdjustmentDto) {
    return this.inventoryService.adjustStock(dto);
  }

  // ========== REPORTS ==========

  @Get('reports/stock-ledger')
  @ApiOperation({ summary: 'Get stock ledger (history of movements)' })
  @ApiResponse({
    status: 200,
    description: 'List of stock transaction history.',
    type: [StockLedgerEntry],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getStockLedger(@Query() query: StockLedgerQueryDto) {
    return this.inventoryService.getStockLedger(query);
  }

  @Get('reports/valuation')
  @ApiOperation({ summary: 'Get Stock Valuation Report' })
  @ApiResponse({
    status: 200,
    description: 'Current stock valuation.',
    type: [StockValuationEntry],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getStockValuation(@Query() query: StockValuationQueryDto) {
    return this.inventoryService.getStockValuation(query);
  }
}
