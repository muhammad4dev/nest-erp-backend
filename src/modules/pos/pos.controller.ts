import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service';
import { SyncOrderDto } from './dto/sync-order.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

@ApiTags('pos')
@Controller('pos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('sync')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Sync offline orders',
    description:
      'Accepts an array of orders created offline. **Important:** IDs must be generated client-side (UUID v7) to ensure offline persistence and idempotency.',
  })
  @ApiBody({ type: [SyncOrderDto] })
  @ApiResponse({ status: 200, description: 'Batch sync processing result.' })
  @ApiResponse({ status: 400, description: 'Bad request (invalid orders).' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.POS.SYNC)
  sync(@Body() orders: SyncOrderDto[]) {
    return this.posService.syncOrders(orders);
  }
}
