import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Idempotent } from '../../common/decorators/idempotent.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProcurementService } from './procurement.service';
import { VendorBillService } from './vendor-bill.service';
import { CreateRFQDto } from './dto/create-rfq.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { VendorBill } from './entities/vendor-bill.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';
import { APAgingQueryDto, APAgingEntry } from './dto/account-payable.dto';
import { PurchaseOrderLine } from './entities/purchase-order-line.entity';

@ApiTags('procurement')
@Controller('procurement')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProcurementController {
  constructor(
    private readonly procurementService: ProcurementService,
    private readonly vendorBillService: VendorBillService,
  ) {}

  @Post('rfq')
  @Idempotent()
  @ApiOperation({ summary: 'Create a Request for Quotation (RFQ)' })
  @ApiResponse({
    status: 201,
    description: 'RFQ created successfully.',
    type: PurchaseOrder,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PURCHASE_ORDERS.CREATE)
  createRFQ(@Body() dto: CreateRFQDto) {
    return this.procurementService.createRFQ({
      partnerId: dto.partnerId,
      orderDate: dto.orderDate,
      lines: dto.lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })) as PurchaseOrderLine[],
    });
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all Purchase Orders / RFQs' })
  @ApiResponse({
    status: 200,
    description: 'List of orders.',
    type: [PurchaseOrder],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PURCHASE_ORDERS.READ)
  findAll(@Query() query: PurchaseOrderQueryDto) {
    return this.procurementService.findAll(query);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get Purchase Order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Purchase Order details.',
    type: PurchaseOrder,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.PURCHASE_ORDERS.READ)
  getOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.procurementService.findOne(id);
  }

  @Post('orders/:id/confirm')
  @ApiOperation({ summary: 'Confirm an RFQ into a Purchase Order' })
  @ApiResponse({
    status: 200,
    description: 'Order confirmed successfully.',
    type: PurchaseOrder,
  })
  @ApiResponse({ status: 400, description: 'Only RFQs can be confirmed.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.PURCHASE_ORDERS.CONFIRM)
  confirmOrder(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.procurementService.confirmOrder(id);
  }

  @Post('orders/:id/bill')
  @ApiOperation({ summary: 'Create a vendor bill from a purchase order' })
  @ApiResponse({
    status: 201,
    description: 'Vendor bill created successfully.',
    type: VendorBill,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @ApiResponse({
    status: 400,
    description: 'Only received orders can be billed.',
  })
  @RequirePermissions(PERMISSIONS.VENDOR_BILLS.CREATE)
  createBill(
    @Param('id', new ParseUUIDPipe()) orderId: string,
    @Body('vendorReference') vendorReference: string,
  ) {
    return this.vendorBillService.createFromOrder(
      orderId,
      vendorReference || `BILL-${Date.now()}`,
    );
  }

  @Post('bills/:id/post')
  @ApiOperation({ summary: 'Post (finalize) a vendor bill' })
  @ApiResponse({
    status: 200,
    description: 'Bill posted successfully.',
    type: VendorBill,
  })
  @ApiResponse({ status: 400, description: 'Only draft bills can be posted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Bill not found.' })
  @RequirePermissions(PERMISSIONS.VENDOR_BILLS.POST)
  postBill(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vendorBillService.postBill(id);
  }

  @Get('bills/:id')
  @ApiOperation({ summary: 'Get vendor bill by ID' })
  @ApiResponse({
    status: 200,
    description: 'Vendor bill details.',
    type: VendorBill,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Bill not found.' })
  @RequirePermissions(PERMISSIONS.VENDOR_BILLS.READ)
  getBill(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.vendorBillService.findOne(id);
  }

  // ========== REPORTS ==========

  @Get('reports/ap-aging')
  @ApiOperation({ summary: 'Get Accounts Payable Aging Report' })
  @ApiResponse({
    status: 200,
    description: 'AP Aging.',
    type: [APAgingEntry],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.VENDOR_BILLS.READ)
  getAPAgingReport(@Query() query: APAgingQueryDto) {
    return this.procurementService.getAPAgingReport(query);
  }
}
