import {
  Controller,
  Post,
  Get,
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
import { I18nService } from './i18n.service';
import { CreateProductTranslationDto } from './dto/create-product-translation.dto';
import { ProductTranslation } from './entities/product-translation.entity';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

@ApiTags('i18n')
@Controller('i18n')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class I18nController {
  constructor(private readonly i18nService: I18nService) {}

  @Post('products/translations')
  @ApiOperation({ summary: 'Add a product translation' })
  @ApiResponse({
    status: 201,
    description: 'Translation added successfully.',
    type: ProductTranslation,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.I18N.CREATE)
  addProductTranslation(@Body() dto: CreateProductTranslationDto) {
    return this.i18nService.addProductTranslation(
      dto.productId,
      dto.locale,
      dto.name,
    );
  }

  @Get('products/:productId/translations')
  @ApiOperation({ summary: 'Get a product translation by locale' })
  @ApiQuery({ name: 'locale', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Translation found.',
    type: ProductTranslation,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Translation not found.' })
  @RequirePermissions(PERMISSIONS.I18N.READ)
  getProductTranslation(
    @Param('productId') productId: string,
    @Query('locale') locale: string,
  ) {
    return this.i18nService.getProductTranslation(productId, locale);
  }
}
