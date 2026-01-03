import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { ProductController } from './product.controller';
import { ProductCategoryService } from './product-category.service';
import { ProductAttributeService } from './product-attribute.service';
import { ProductVariantService } from './product-variant.service';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductAttribute } from './entities/product-attribute.entity';
import { ProductAttributeValue } from './entities/product-attribute-value.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { StockQuant } from './entities/stock-quant.entity';
import { Location } from './entities/location.entity';
import { UomCategory } from './entities/uom-category.entity';
import { UomUnit } from './entities/uom-unit.entity';
import { ProductUom } from './entities/product-uom.entity';
import { StockReceipt } from './entities/stock-receipt.entity';
import { StockReceiptLine } from './entities/stock-receipt-line.entity';
import { StockIssue } from './entities/stock-issue.entity';
import { StockIssueLine } from './entities/stock-issue-line.entity';
import { AuditLog } from '../../common/entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductCategory,
      ProductAttribute,
      ProductAttributeValue,
      ProductVariant,
      StockQuant,
      Location,
      UomCategory,
      UomUnit,
      ProductUom,
      StockReceipt,
      StockReceiptLine,
      StockIssue,
      StockIssueLine,
      AuditLog,
    ]),
  ],
  controllers: [InventoryController, ProductController],
  providers: [
    InventoryService,
    ProductCategoryService,
    ProductAttributeService,
    ProductVariantService,
  ],
  exports: [
    InventoryService,
    ProductCategoryService,
    ProductAttributeService,
    ProductVariantService,
  ],
})
export class InventoryModule {}
