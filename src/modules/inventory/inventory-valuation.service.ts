import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import {
  InventoryValuation,
  CostingMethod,
} from '../../common/entities/inventory/inventory-valuation.entity';
import { CostLayer } from '../../common/entities/inventory/cost-layer.entity';
import { Product } from './entities/product.entity';
import { Location } from './entities/location.entity';
import { ProductCategory } from './entities/product-category.entity';
import {
  ValuationSummaryDto,
  ValuationByLocationDto,
  ValuationByCategoryDto,
  ProductValuationDto,
  CostLayerDto,
  UpdateCostingMethodDto,
  UpdateStandardCostDto,
} from './dto/valuation.dto';

export interface ValuationTransaction {
  productId: string;
  locationId: string;
  quantity: number; // positive for receipt, negative for issue
  unitCost: number;
  transactionDate: Date;
  receiptId?: string;
  batchNumber?: string;
  expiryDate?: Date;
}

@Injectable()
export class InventoryValuationService {
  private readonly logger = new Logger(InventoryValuationService.name);

  constructor(
    @InjectRepository(InventoryValuation)
    private valuationRepo: Repository<InventoryValuation>,
    @InjectRepository(CostLayer)
    private costLayerRepo: Repository<CostLayer>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Location)
    private locationRepo: Repository<Location>,
    @InjectRepository(ProductCategory)
    private categoryRepo: Repository<ProductCategory>,
    private dataSource: DataSource,
  ) {}

  /**
   * Process stock transaction and update valuation
   */
  async processTransaction(
    transaction: ValuationTransaction,
    tenantId: string,
  ): Promise<void> {
    const {
      productId,
      locationId,
      quantity,
      unitCost,
      transactionDate,
      receiptId,
      batchNumber,
      expiryDate,
    } = transaction;

    // Get or create valuation record
    let valuation = await this.valuationRepo.findOne({
      where: { tenantId, productId, locationId },
    });

    if (!valuation) {
      valuation = this.valuationRepo.create({
        tenantId,
        productId,
        locationId,
        costingMethod: CostingMethod.AVERAGE, // Default
        currentQuantity: 0,
        currentValue: 0,
        averageCost: 0,
      });
    }

    // Process based on costing method
    if (quantity > 0) {
      // Receipt
      await this.processReceipt(
        valuation,
        quantity,
        unitCost,
        transactionDate,
        receiptId,
        batchNumber,
        expiryDate,
        tenantId,
      );
    } else {
      // Issue
      await this.processIssue(
        valuation,
        Math.abs(quantity),
        transactionDate,
        tenantId,
      );
    }

    // Update last movement date
    valuation.lastMovementDate = transactionDate;
    valuation.lastValuationDate = new Date();

    await this.valuationRepo.save(valuation);
  }

  /**
   * Process stock receipt
   */
  private async processReceipt(
    valuation: InventoryValuation,
    quantity: number,
    unitCost: number,
    receiptDate: Date,
    receiptId?: string,
    batchNumber?: string,
    expiryDate?: Date,
    tenantId?: string,
  ): Promise<void> {
    valuation.lastCost = unitCost;

    if (
      valuation.costingMethod === CostingMethod.FIFO ||
      valuation.costingMethod === CostingMethod.LIFO
    ) {
      // Create cost layer for FIFO/LIFO
      const layer = this.costLayerRepo.create({
        tenantId,
        productId: valuation.productId,
        locationId: valuation.locationId,
        receiptId,
        receiptDate,
        originalQuantity: quantity,
        remainingQuantity: quantity,
        unitCost,
        layerValue: quantity * unitCost,
        batchNumber,
        expiryDate,
      });
      await this.costLayerRepo.save(layer);

      // Update valuation
      valuation.currentQuantity += quantity;
      valuation.currentValue += quantity * unitCost;
      valuation.averageCost =
        valuation.currentQuantity > 0
          ? valuation.currentValue / valuation.currentQuantity
          : 0;
    } else if (valuation.costingMethod === CostingMethod.AVERAGE) {
      // Weighted average
      const oldValue = valuation.currentValue;
      const oldQuantity = valuation.currentQuantity;
      const newValue = quantity * unitCost;

      valuation.currentQuantity = oldQuantity + quantity;
      valuation.currentValue = oldValue + newValue;
      valuation.averageCost =
        valuation.currentQuantity > 0
          ? valuation.currentValue / valuation.currentQuantity
          : 0;
    } else if (valuation.costingMethod === CostingMethod.STANDARD) {
      // Standard costing - use standard cost
      valuation.currentQuantity += quantity;
      valuation.currentValue =
        valuation.currentQuantity * (valuation.standardCost || unitCost);
      valuation.averageCost = valuation.standardCost || unitCost;
    }
  }

  /**
   * Process stock issue
   */
  private async processIssue(
    valuation: InventoryValuation,
    quantity: number,
    issueDate: Date,
    tenantId: string,
  ): Promise<void> {
    if (valuation.costingMethod === CostingMethod.FIFO) {
      await this.processFIFOIssue(valuation, quantity, tenantId);
    } else if (valuation.costingMethod === CostingMethod.LIFO) {
      await this.processLIFOIssue(valuation, quantity, tenantId);
    } else if (valuation.costingMethod === CostingMethod.AVERAGE) {
      // Average cost
      const costToRemove = quantity * valuation.averageCost;
      valuation.currentQuantity -= quantity;
      valuation.currentValue -= costToRemove;
      // Average cost remains the same
    } else if (valuation.costingMethod === CostingMethod.STANDARD) {
      // Standard cost
      const costToRemove =
        quantity * (valuation.standardCost || valuation.averageCost);
      valuation.currentQuantity -= quantity;
      valuation.currentValue -= costToRemove;
    }
  }

  /**
   * Process FIFO issue - consume oldest layers first
   */
  private async processFIFOIssue(
    valuation: InventoryValuation,
    quantity: number,
    tenantId: string,
  ): Promise<void> {
    let remainingToIssue = quantity;
    let totalCost = 0;

    // Get layers ordered by receipt date (oldest first)
    const layers = await this.costLayerRepo.find({
      where: {
        tenantId,
        productId: valuation.productId,
        locationId: valuation.locationId,
        remainingQuantity: MoreThan(0),
      },
      order: { receiptDate: 'ASC', createdAt: 'ASC' },
    });

    for (const layer of layers) {
      if (remainingToIssue <= 0) break;

      const quantityFromLayer = Math.min(
        remainingToIssue,
        layer.remainingQuantity,
      );
      const costFromLayer = quantityFromLayer * layer.unitCost;

      layer.remainingQuantity -= quantityFromLayer;
      layer.layerValue = layer.remainingQuantity * layer.unitCost;
      await this.costLayerRepo.save(layer);

      totalCost += costFromLayer;
      remainingToIssue -= quantityFromLayer;
    }

    valuation.currentQuantity -= quantity;
    valuation.currentValue -= totalCost;
    valuation.averageCost =
      valuation.currentQuantity > 0
        ? valuation.currentValue / valuation.currentQuantity
        : 0;
  }

  /**
   * Process LIFO issue - consume newest layers first
   */
  private async processLIFOIssue(
    valuation: InventoryValuation,
    quantity: number,
    tenantId: string,
  ): Promise<void> {
    let remainingToIssue = quantity;
    let totalCost = 0;

    // Get layers ordered by receipt date (newest first)
    const layers = await this.costLayerRepo.find({
      where: {
        tenantId,
        productId: valuation.productId,
        locationId: valuation.locationId,
        remainingQuantity: MoreThan(0),
      },
      order: { receiptDate: 'DESC', createdAt: 'DESC' },
    });

    for (const layer of layers) {
      if (remainingToIssue <= 0) break;

      const quantityFromLayer = Math.min(
        remainingToIssue,
        layer.remainingQuantity,
      );
      const costFromLayer = quantityFromLayer * layer.unitCost;

      layer.remainingQuantity -= quantityFromLayer;
      layer.layerValue = layer.remainingQuantity * layer.unitCost;
      await this.costLayerRepo.save(layer);

      totalCost += costFromLayer;
      remainingToIssue -= quantityFromLayer;
    }

    valuation.currentQuantity -= quantity;
    valuation.currentValue -= totalCost;
    valuation.averageCost =
      valuation.currentQuantity > 0
        ? valuation.currentValue / valuation.currentQuantity
        : 0;
  }

  /**
   * Get valuation summary
   */
  async getValuationSummary(
    tenantId: string,
    locationId?: string,
    categoryId?: string,
  ): Promise<ValuationSummaryDto> {
    const query = this.valuationRepo
      .createQueryBuilder('v')
      .select('SUM(v.current_quantity)', 'totalQuantity')
      .addSelect('SUM(v.current_value)', 'totalValue')
      .addSelect('COUNT(DISTINCT v.product_id)', 'productCount')
      .addSelect('COUNT(DISTINCT v.location_id)', 'locationCount')
      .addSelect('MAX(v.last_movement_date)', 'lastUpdated')
      .where('v.tenant_id = :tenantId', { tenantId });

    if (locationId) {
      query.andWhere('v.location_id = :locationId', { locationId });
    }

    if (categoryId) {
      query
        .innerJoin('v.product', 'p')
        .andWhere('p.category_id = :categoryId', { categoryId });
    }

    const result = await query.getRawOne<{
      totalQuantity: string | null;
      totalValue: string | null;
      productCount: string | null;
      locationCount: string | null;
      lastUpdated: Date | null;
    }>();

    const totalQuantity = parseFloat(result?.totalQuantity ?? '0') || 0;
    const totalValue = parseFloat(result?.totalValue ?? '0') || 0;
    const productCount = parseInt(result?.productCount ?? '0', 10) || 0;
    const locationCount = parseInt(result?.locationCount ?? '0', 10) || 0;
    const lastUpdated = result?.lastUpdated || new Date();

    return {
      totalQuantity,
      totalValue,
      averageCost: totalQuantity > 0 ? totalValue / totalQuantity : 0,
      productCount,
      locationCount,
      lastUpdated,
    };
  }

  /**
   * Get valuation by location
   */
  async getValuationByLocation(
    tenantId: string,
    categoryId?: string,
  ): Promise<ValuationByLocationDto[]> {
    const query = this.valuationRepo
      .createQueryBuilder('v')
      .select('v.location_id', 'locationId')
      .addSelect('l.name', 'locationName')
      .addSelect('SUM(v.current_quantity)', 'totalQuantity')
      .addSelect('SUM(v.current_value)', 'totalValue')
      .addSelect('COUNT(DISTINCT v.product_id)', 'productCount')
      .innerJoin(Location, 'l', 'l.id = v.location_id')
      .where('v.tenant_id = :tenantId', { tenantId })
      .groupBy('v.location_id')
      .addGroupBy('l.name');

    if (categoryId) {
      query
        .innerJoin(Product, 'p', 'p.id = v.product_id')
        .andWhere('p.category_id = :categoryId', { categoryId });
    }

    const results = await query.getRawMany<{
      locationId: string;
      locationName: string;
      totalQuantity: string;
      totalValue: string;
      productCount: string;
    }>();

    return results.map((r) => {
      const totalQuantity = parseFloat(r.totalQuantity) || 0;
      const totalValue = parseFloat(r.totalValue) || 0;

      return {
        locationId: r.locationId,
        locationName: r.locationName,
        totalQuantity,
        totalValue,
        averageCost: totalQuantity > 0 ? totalValue / totalQuantity : 0,
        productCount: parseInt(r.productCount) || 0,
      };
    });
  }

  /**
   * Get valuation by category
   */
  async getValuationByCategory(
    tenantId: string,
    locationId?: string,
  ): Promise<ValuationByCategoryDto[]> {
    const query = this.valuationRepo
      .createQueryBuilder('v')
      .select('p.category_id', 'categoryId')
      .addSelect('c.name', 'categoryName')
      .addSelect('SUM(v.current_quantity)', 'totalQuantity')
      .addSelect('SUM(v.current_value)', 'totalValue')
      .addSelect('COUNT(DISTINCT v.product_id)', 'productCount')
      .innerJoin(Product, 'p', 'p.id = v.product_id')
      .innerJoin(ProductCategory, 'c', 'c.id = p.category_id')
      .where('v.tenant_id = :tenantId', { tenantId })
      .groupBy('p.category_id')
      .addGroupBy('c.name');

    if (locationId) {
      query.andWhere('v.location_id = :locationId', { locationId });
    }

    const results = await query.getRawMany<{
      categoryId: string;
      categoryName: string;
      totalQuantity: string;
      totalValue: string;
      productCount: string;
    }>();

    return results.map((r) => {
      const totalQuantity = parseFloat(r.totalQuantity) || 0;
      const totalValue = parseFloat(r.totalValue) || 0;

      return {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        totalQuantity,
        totalValue,
        averageCost: totalQuantity > 0 ? totalValue / totalQuantity : 0,
        productCount: parseInt(r.productCount) || 0,
      };
    });
  }

  /**
   * Get product valuations
   */
  async getProductValuations(
    tenantId: string,
    locationId?: string,
    productId?: string,
  ): Promise<ProductValuationDto[]> {
    const query = this.valuationRepo
      .createQueryBuilder('v')
      .leftJoinAndSelect('v.product', 'p')
      .leftJoinAndSelect('v.location', 'l')
      .where('v.tenant_id = :tenantId', { tenantId });

    if (locationId) {
      query.andWhere('v.location_id = :locationId', { locationId });
    }

    if (productId) {
      query.andWhere('v.product_id = :productId', { productId });
    }

    const valuations = await query.getMany();

    return valuations.map((v) => ({
      productId: v.productId,
      productName: v.product?.name || '',
      sku: v.product?.sku || '',
      locationId: v.locationId,
      locationName: v.location?.name || '',
      costingMethod: v.costingMethod,
      quantity: v.currentQuantity,
      value: v.currentValue,
      averageCost: v.averageCost,
      standardCost: v.standardCost,
      lastCost: v.lastCost,
      lastMovementDate: v.lastMovementDate,
    }));
  }

  /**
   * Get cost layers for a product/location
   */
  async getCostLayers(
    tenantId: string,
    productId: string,
    locationId: string,
  ): Promise<CostLayerDto[]> {
    const layers = await this.costLayerRepo.find({
      where: {
        tenantId,
        productId,
        locationId,
        remainingQuantity: MoreThan(0),
      },
      order: { receiptDate: 'ASC' },
      relations: ['receipt'],
    });

    return layers.map((layer) => ({
      id: layer.id,
      receiptDate: layer.receiptDate,
      originalQuantity: layer.originalQuantity,
      remainingQuantity: layer.remainingQuantity,
      unitCost: layer.unitCost,
      layerValue: layer.layerValue,
      batchNumber: layer.batchNumber,
      expiryDate: layer.expiryDate,
      receiptNumber: layer.receipt?.receiptNumber,
    }));
  }

  /**
   * Update costing method for product
   */
  async updateCostingMethod(
    dto: UpdateCostingMethodDto,
    tenantId: string,
  ): Promise<void> {
    const { productId, locationId, costingMethod } = dto;

    if (locationId) {
      // Update specific location
      await this.valuationRepo.update(
        { tenantId, productId, locationId },
        { costingMethod },
      );
    } else {
      // Update all locations for this product
      await this.valuationRepo.update(
        { tenantId, productId },
        { costingMethod },
      );
    }
  }

  /**
   * Update standard cost for product
   */
  async updateStandardCost(
    dto: UpdateStandardCostDto,
    tenantId: string,
  ): Promise<void> {
    const { productId, locationId, standardCost } = dto;

    if (locationId) {
      await this.valuationRepo.update(
        { tenantId, productId, locationId },
        { standardCost },
      );
    } else {
      await this.valuationRepo.update(
        { tenantId, productId },
        { standardCost },
      );
    }
  }
}
