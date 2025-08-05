import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PartnerService } from './partner.service';
import { Partner } from './entities/partner.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

@ApiTags('partners')
@Controller('partners')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new partner (customer or vendor)' })
  @ApiResponse({
    status: 201,
    description: 'Partner created successfully.',
    type: Partner,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PARTNERS.CREATE)
  create(@Body() dto: CreatePartnerDto) {
    return this.partnerService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all partners with optional filters' })
  @ApiQuery({ name: 'isCustomer', required: false, type: Boolean })
  @ApiQuery({ name: 'isVendor', required: false, type: Boolean })
  @ApiResponse({
    status: 200,
    description: 'List of partners.',
    type: [Partner],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.PARTNERS.READ)
  findAll(
    @Query('isCustomer') isCustomer?: string,
    @Query('isVendor') isVendor?: string,
  ) {
    return this.partnerService.findAll({
      isCustomer:
        isCustomer === 'true'
          ? true
          : isCustomer === 'false'
            ? false
            : undefined,
      isVendor:
        isVendor === 'true' ? true : isVendor === 'false' ? false : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get partner by ID' })
  @ApiResponse({ status: 200, description: 'Partner details.', type: Partner })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Partner not found.' })
  @RequirePermissions(PERMISSIONS.PARTNERS.READ)
  findOne(@Param('id') id: string) {
    return this.partnerService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a partner' })
  @ApiResponse({
    status: 200,
    description: 'Partner updated successfully.',
    type: Partner,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Partner not found.' })
  @RequirePermissions(PERMISSIONS.PARTNERS.UPDATE)
  update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.partnerService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a partner' })
  @ApiResponse({ status: 200, description: 'Partner deleted successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Partner not found.' })
  @RequirePermissions(PERMISSIONS.PARTNERS.DELETE)
  remove(@Param('id') id: string) {
    return this.partnerService.remove(id);
  }
}
