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
  ApiQuery,
} from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { InvoiceService } from './invoice.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesOrderStatus, SalesOrder } from './entities/sales-order.entity';
import { InvoiceStatus, Invoice } from './entities/invoice.entity';
import {
  SalesAnalysisQueryDto,
  SalesAnalysisEntry,
} from './dto/sales-reports.dto';
import { ARAgingQueryDto, ARAgingEntry } from './dto/account-receivable.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
    private readonly invoiceService: InvoiceService,
  ) {}

  // ========== SALES ORDERS ==========

  @Post('orders')
  @ApiOperation({ summary: 'Create a new sales order' })
  @ApiResponse({
    status: 201,
    description: 'Sales order created successfully.',
    type: SalesOrder,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.SALES_ORDERS.CREATE)
  create(@Body() dto: CreateSalesOrderDto) {
    return this.salesService.createOrder(dto.partnerId, dto.lines);
  }

  @Get('orders')
  @ApiOperation({ summary: 'List all sales orders' })
  @ApiQuery({ name: 'status', required: false, enum: SalesOrderStatus })
  @ApiResponse({
    status: 200,
    description: 'List of sales orders.',
    type: [SalesOrder],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.SALES_ORDERS.READ)
  findAllOrders(@Query('status') status?: SalesOrderStatus) {
    return this.salesService.findAll(status);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Get sales order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Sales order details.',
    type: SalesOrder,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.SALES_ORDERS.READ)
  findOrder(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Put('orders/:id')
  @ApiOperation({ summary: 'Update a draft sales order' })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully.',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Only draft orders can be updated or bad request.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.SALES_ORDERS.UPDATE)
  updateOrder(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto) {
    return this.salesService.update(id, dto);
  }

  @Post('orders/:id/send')
  @ApiOperation({ summary: 'Send quote to customer' })
  @ApiResponse({
    status: 200,
    description: 'Quote sent successfully.',
    type: SalesOrder,
  })
  @ApiResponse({ status: 400, description: 'Only draft orders can be sent.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.SALES_ORDERS.UPDATE)
  sendQuote(@Param('id') id: string) {
    return this.salesService.sendQuote(id);
  }

  @Post('orders/:id/confirm')
  @ApiOperation({ summary: 'Confirm a draft/sent sales order' })
  @ApiResponse({
    status: 200,
    description: 'Order confirmed successfully.',
    type: SalesOrder,
  })
  @ApiResponse({
    status: 400,
    description: 'Only drafts or sent quotes can be confirmed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.SALES_ORDERS.UPDATE)
  confirmOrder(@Param('id') id: string) {
    return this.salesService.confirmOrder(id);
  }

  @Post('orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel a sales order' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully.',
    type: SalesOrder,
  })
  @ApiResponse({ status: 400, description: 'Cannot cancel invoiced order.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.SALES_ORDERS.CANCEL)
  cancelOrder(@Param('id') id: string) {
    return this.salesService.cancelOrder(id);
  }

  @Post('orders/:id/invoice')
  @ApiOperation({ summary: 'Generate an invoice from a confirmed sales order' })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully.',
    type: Invoice,
  })
  @ApiResponse({
    status: 400,
    description: 'Only confirmed orders can be invoiced.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.INVOICES.CREATE)
  createInvoice(@Param('id') orderId: string) {
    return this.invoiceService.createFromOrder(orderId);
  }

  // ========== INVOICES ==========

  @Get('invoices')
  @ApiOperation({ summary: 'List all invoices' })
  @ApiQuery({ name: 'status', required: false, enum: InvoiceStatus })
  @ApiResponse({
    status: 200,
    description: 'List of invoices.',
    type: [Invoice],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.INVOICES.READ)
  findAllInvoices(@Query('status') status?: InvoiceStatus) {
    return this.invoiceService.findAll(status);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({ status: 200, description: 'Invoice details.', type: Invoice })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  @RequirePermissions(PERMISSIONS.INVOICES.READ)
  getInvoice(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Post('invoices/:id/post')
  @ApiOperation({ summary: 'Post (finalize) an invoice' })
  @ApiResponse({
    status: 200,
    description: 'Invoice posted successfully.',
    type: Invoice,
  })
  @ApiResponse({
    status: 400,
    description: 'Only draft invoices can be posted.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  @RequirePermissions(PERMISSIONS.INVOICES.POST)
  postInvoice(@Param('id') id: string) {
    return this.invoiceService.postInvoice(id);
  }

  // ========== REPORTS ==========

  @Get('reports/analysis')
  @ApiOperation({ summary: 'Get Sales Analysis Report' })
  @ApiResponse({
    status: 200,
    description: 'Sales Analysis.',
    type: [SalesAnalysisEntry],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.SALES_ORDERS.READ)
  getSalesAnalysis(@Query() query: SalesAnalysisQueryDto) {
    return this.salesService.getSalesAnalysis(query);
  }

  @Get('reports/ar-aging')
  @ApiOperation({ summary: 'Get Accounts Receivable Aging Report' })
  @ApiResponse({
    status: 200,
    description: 'AR Aging.',
    type: [ARAgingEntry],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.INVOICES.READ)
  getARAgingReport(@Query() query: ARAgingQueryDto) {
    return this.salesService.getARAgingReport(query);
  }
}
