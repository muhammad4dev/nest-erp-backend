import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Idempotent } from '../../common/decorators/idempotent.decorator';
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
import {
  CreateStockReceiptDto,
  UpdateStockReceiptDto,
} from './dto/stock-receipt.dto';
import {
  CreateStockIssueDto,
  UpdateStockIssueDto,
} from './dto/stock-issue.dto';
import { StockLedgerQueryDto, StockLedgerEntry } from './dto/stock-ledger.dto';
import {
  StockValuationQueryDto,
  StockValuationEntry,
} from './dto/inventory-reports.dto';
import { Product } from './entities/product.entity';
import { Location } from './entities/location.entity';
import { StockQuant } from './entities/stock-quant.entity';
import { StockReceipt } from './entities/stock-receipt.entity';
import { StockIssue } from './entities/stock-issue.entity';
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
  @Idempotent()
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
  findProduct(@Param('id', new ParseUUIDPipe()) id: string) {
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
  updateProduct(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
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
  findLocation(@Param('id', new ParseUUIDPipe()) id: string) {
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
  updateLocation(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.inventoryService.updateLocation(id, dto);
  }

  // ========== STOCK OPERATIONS ==========

  @Get('stock/product/:productId')
  @ApiOperation({ summary: 'Get all stock locations for a product' })
  @ApiResponse({
    status: 200,
    description: 'Stock by location for the product.',
    type: [StockQuant],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getStockByProduct(
    @Param('productId', new ParseUUIDPipe()) productId: string,
  ) {
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
  getStockByLocation(
    @Param('locationId', new ParseUUIDPipe()) locationId: string,
  ) {
    return this.inventoryService.getStockByLocation(locationId);
  }

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
    @Param('productId', new ParseUUIDPipe()) productId: string,
    @Param('locationId', new ParseUUIDPipe()) locationId: string,
  ) {
    return this.inventoryService.getAvailableStock(productId, locationId);
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

  // ========== STOCK RECEIPTS ==========

  @Post('receipts')
  @Idempotent()
  @ApiOperation({ summary: 'Create a new stock receipt' })
  @ApiResponse({
    status: 201,
    description: 'Stock receipt created successfully.',
    type: StockReceipt,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Location or product not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.CREATE)
  createReceipt(@Body() dto: CreateStockReceiptDto) {
    return this.inventoryService.createReceipt(dto);
  }

  @Get('receipts')
  @ApiOperation({ summary: 'List all stock receipts' })
  @ApiResponse({
    status: 200,
    description: 'List of stock receipts.',
    type: [StockReceipt],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getReceipts(
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryService.getReceipts({
      status,
      locationId,
      startDate,
      endDate,
    });
  }

  @Get('receipts/:id')
  @ApiOperation({ summary: 'Get stock receipt by ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock receipt details with lines.',
    type: StockReceipt,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Receipt not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getReceipt(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.getReceipt(id);
  }

  @Put('receipts/:id')
  @ApiOperation({ summary: 'Update a stock receipt' })
  @ApiResponse({
    status: 200,
    description: 'Stock receipt updated successfully.',
    type: StockReceipt,
  })
  @ApiResponse({ status: 400, description: 'Can only update DRAFT receipts.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Receipt not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.UPDATE)
  updateReceipt(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStockReceiptDto,
  ) {
    return this.inventoryService.updateReceipt(id, dto);
  }

  @Post('receipts/:id/complete')
  @ApiOperation({ summary: 'Complete a stock receipt (updates stock)' })
  @ApiResponse({
    status: 200,
    description: 'Receipt completed, stock updated.',
    type: StockReceipt,
  })
  @ApiResponse({ status: 400, description: 'Receipt not in DRAFT status.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Receipt not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.UPDATE)
  completeReceipt(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.completeReceipt(id);
  }

  @Post('receipts/:id/delete')
  @ApiOperation({ summary: 'Delete a stock receipt' })
  @ApiResponse({
    status: 200,
    description: 'Receipt deleted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete completed receipt.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Receipt not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.DELETE)
  deleteReceipt(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.deleteReceipt(id);
  }

  // ========== STOCK ISSUES ==========

  @Post('issues')
  @Idempotent()
  @ApiOperation({ summary: 'Create a new stock issue' })
  @ApiResponse({
    status: 201,
    description: 'Stock issue created successfully.',
    type: StockIssue,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Location or product not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.CREATE)
  createIssue(@Body() dto: CreateStockIssueDto) {
    return this.inventoryService.createIssue(dto);
  }

  @Get('issues')
  @ApiOperation({ summary: 'List all stock issues' })
  @ApiResponse({
    status: 200,
    description: 'List of stock issues.',
    type: [StockIssue],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getIssues(
    @Query('status') status?: string,
    @Query('locationId') locationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.inventoryService.getIssues({
      status,
      locationId,
      startDate,
      endDate,
    });
  }

  @Get('issues/:id')
  @ApiOperation({ summary: 'Get stock issue by ID' })
  @ApiResponse({
    status: 200,
    description: 'Stock issue details with lines.',
    type: StockIssue,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Issue not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.READ)
  getIssue(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.getIssue(id);
  }

  @Put('issues/:id')
  @ApiOperation({ summary: 'Update a stock issue' })
  @ApiResponse({
    status: 200,
    description: 'Stock issue updated successfully.',
    type: StockIssue,
  })
  @ApiResponse({ status: 400, description: 'Can only update DRAFT issues.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Issue not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.UPDATE)
  updateIssue(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStockIssueDto,
  ) {
    return this.inventoryService.updateIssue(id, dto);
  }

  @Post('issues/:id/complete')
  @ApiOperation({ summary: 'Complete a stock issue (deducts stock)' })
  @ApiResponse({
    status: 200,
    description: 'Issue completed, stock deducted.',
    type: StockIssue,
  })
  @ApiResponse({
    status: 400,
    description: 'Issue not in DRAFT status or insufficient stock.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Issue not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.UPDATE)
  completeIssue(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.completeIssue(id);
  }

  @Post('issues/:id/delete')
  @ApiOperation({ summary: 'Delete a stock issue' })
  @ApiResponse({
    status: 200,
    description: 'Issue deleted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Cannot delete completed issue.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Issue not found.' })
  @RequirePermissions(PERMISSIONS.STOCK.DELETE)
  deleteIssue(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.inventoryService.deleteIssue(id);
  }
}
