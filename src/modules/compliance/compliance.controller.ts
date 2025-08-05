import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrder } from '../sales/entities/sales-order.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepo: Repository<SalesOrder>,
  ) {}

  @Get('einvoice/:orderId')
  @ApiOperation({ summary: 'Generate ETA Canonical JSON for a Sales Order' })
  @ApiResponse({
    status: 200,
    description: 'Canonical eInvoice JSON returned.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  @RequirePermissions(PERMISSIONS.COMPLIANCE.READ_REPORT)
  async generateEInvoice(@Param('orderId') orderId: string) {
    const order = await this.salesOrderRepo.findOne({
      where: { id: orderId },
      relations: ['partner', 'lines', 'lines.product', 'lines.product.uom'],
    });
    if (!order) {
      return { error: 'Order not found' };
    }
    return this.complianceService.mapToCanonical(order);
  }
}
