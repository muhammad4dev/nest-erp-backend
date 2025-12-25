import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockQuant } from './entities/stock-quant.entity';
import { Product } from './entities/product.entity';
import { Location } from './entities/location.entity';
import { UomUnit } from './entities/uom-unit.entity';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { CreateLocationDto, UpdateLocationDto } from './dto/location.dto';
import { StockTransferDto, StockAdjustmentDto } from './dto/stock.dto';
import { AuditLog } from '../../common/entities/audit-log.entity';
import { StockLedgerQueryDto, StockLedgerEntry } from './dto/stock-ledger.dto';
import {
  StockValuationQueryDto,
  StockValuationEntry,
} from './dto/inventory-reports.dto';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';

@Injectable()
export class InventoryService {
  private quantRepository: Repository<StockQuant>;
  private productRepository: Repository<Product>;
  private locationRepository: Repository<Location>;
  private auditLogRepository: Repository<AuditLog>;

  constructor(
    @InjectRepository(StockQuant)
    quantRepositoryBase: Repository<StockQuant>,
    @InjectRepository(Product)
    productRepositoryBase: Repository<Product>,
    @InjectRepository(Location)
    locationRepositoryBase: Repository<Location>,
    @InjectRepository(AuditLog)
    auditLogRepositoryBase: Repository<AuditLog>,
    private dataSource: DataSource,
  ) {
    this.quantRepository = wrapTenantRepository(quantRepositoryBase);
    this.productRepository = wrapTenantRepository(productRepositoryBase);
    this.locationRepository = wrapTenantRepository(locationRepositoryBase);
    this.auditLogRepository = wrapTenantRepository(auditLogRepositoryBase);
  }

  // ========== PRODUCT CRUD ==========

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const existing = await this.productRepository.findOne({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException('Product with this SKU already exists');
    }

    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async findAllProducts(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['uom'],
      order: { createdAt: 'DESC' },
    });
  }

  async findProduct(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['uom', 'translations'],
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findProduct(id);

    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.productRepository.findOne({
        where: { sku: dto.sku },
      });
      if (existing) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    Object.assign(product, dto);
    return this.productRepository.save(product);
  }

  // ========== LOCATION CRUD ==========

  async createLocation(dto: CreateLocationDto): Promise<Location> {
    const location = this.locationRepository.create(dto);
    return this.locationRepository.save(location);
  }

  async findAllLocations(): Promise<Location[]> {
    return this.locationRepository.find({
      relations: ['parentLocation'],
      order: { name: 'ASC' },
    });
  }

  async findLocation(id: string): Promise<Location & { stock: StockQuant[] }> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['parentLocation'],
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const stock = await this.quantRepository.find({
      where: { locationId: id },
      relations: ['product'],
    });

    return { ...location, stock };
  }

  async updateLocation(id: string, dto: UpdateLocationDto): Promise<Location> {
    const location = await this.locationRepository.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    Object.assign(location, dto);
    return this.locationRepository.save(location);
  }

  // ========== STOCK OPERATIONS ==========

  async getAvailableStock(
    productId: string,
    locationId: string,
  ): Promise<number> {
    const quant = await this.quantRepository.findOne({
      where: { productId, locationId },
    });
    return quant ? Number(quant.quantity) : 0;
  }

  async getStockByProduct(productId: string): Promise<StockQuant[]> {
    return this.quantRepository.find({
      where: { productId },
      relations: ['product'],
    });
  }

  async getStockByLocation(locationId: string): Promise<StockQuant[]> {
    return this.quantRepository.find({
      where: { locationId },
      relations: ['product'],
    });
  }

  async transferStock(
    dto: StockTransferDto,
  ): Promise<{ success: boolean; message: string }> {
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException(
        'Source and destination locations must be different',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const quantRepo = manager.getRepository(StockQuant);

      // Get or create source quant
      const sourceQuant = await quantRepo.findOne({
        where: { productId: dto.productId, locationId: dto.fromLocationId },
      });

      if (!sourceQuant || Number(sourceQuant.quantity) < dto.quantity) {
        throw new BadRequestException('Insufficient stock at source location');
      }

      // Decrease source
      sourceQuant.quantity = Number(sourceQuant.quantity) - dto.quantity;
      await quantRepo.save(sourceQuant);

      // Get or create destination quant
      let destQuant = await quantRepo.findOne({
        where: { productId: dto.productId, locationId: dto.toLocationId },
      });

      if (destQuant) {
        destQuant.quantity = Number(destQuant.quantity) + dto.quantity;
        await quantRepo.save(destQuant);
      } else {
        destQuant = quantRepo.create({
          productId: dto.productId,
          locationId: dto.toLocationId,
          quantity: dto.quantity,
        });
        await quantRepo.save(destQuant);
      }

      return {
        success: true,
        message: `Transferred ${dto.quantity} units from ${dto.fromLocationId} to ${dto.toLocationId}`,
      };
    });
  }

  async adjustStock(dto: StockAdjustmentDto): Promise<StockQuant> {
    let quant = await this.quantRepository.findOne({
      where: { productId: dto.productId, locationId: dto.locationId },
    });

    if (quant) {
      const newQty = Number(quant.quantity) + dto.quantity;
      if (newQty < 0) {
        throw new BadRequestException('Stock cannot be negative');
      }
      quant.quantity = newQty;
    } else {
      if (dto.quantity < 0) {
        throw new BadRequestException(
          'Cannot adjust non-existent stock to negative',
        );
      }
      quant = this.quantRepository.create({
        productId: dto.productId,
        locationId: dto.locationId,
        quantity: dto.quantity,
      });
    }

    return this.quantRepository.save(quant);
  }

  // Convert Quantity between UOMs
  convertUom(quantity: number, fromUnit: UomUnit, toUnit: UomUnit): number {
    if (fromUnit.id === toUnit.id) return quantity;

    const baseQty = quantity * Number(fromUnit.factor);
    return baseQty / Number(toUnit.factor);
  }

  // ========== REPORTING ==========

  async getStockLedger(
    query: StockLedgerQueryDto,
  ): Promise<StockLedgerEntry[]> {
    const qb = this.auditLogRepository.createQueryBuilder('log');

    qb.where('log.tableName = :tableName', { tableName: 'stock_quants' });

    // Filter by Product ID (in JSONB columns)
    // We check both newData and oldData because a DELETE might only have oldData
    qb.andWhere(
      "(log.newData->>'productId' = :productId OR log.oldData->>'productId' = :productId)",
      { productId: query.productId },
    );

    if (query.locationId) {
      qb.andWhere(
        "(log.newData->>'locationId' = :locationId OR log.oldData->>'locationId' = :locationId)",
        { locationId: query.locationId },
      );
    }

    if (query.startDate) {
      qb.andWhere('log.createdAt >= :startDate', {
        startDate: query.startDate,
      });
    }

    if (query.endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('log.createdAt', 'DESC');

    const logs: AuditLog[] = await qb.getMany();

    // Transform logs into Ledger Entries
    return logs.map((log) => {
      let change = 0;
      let balance = 0;
      let locId = '';

      if (log.action === 'INSERT') {
        const data = log.newData as Partial<StockQuant>;
        change = Number(data.quantity || 0);
        balance = Number(data.quantity || 0);
        locId = data.locationId || '';
      } else if (log.action === 'UPDATE') {
        const newData = log.newData as Partial<StockQuant>;
        const oldData = log.oldData as Partial<StockQuant>;
        const newQty = Number(newData.quantity || 0);
        const oldQty = Number(oldData.quantity || 0);
        change = newQty - oldQty;
        balance = newQty;
        locId = newData.locationId || '';
      } else if (log.action === 'DELETE') {
        const data = log.oldData as Partial<StockQuant>;
        change = -Number(data.quantity || 0);
        balance = 0;
        locId = data.locationId || '';
      }

      return {
        timestamp: log.createdAt,
        action: log.action,
        change,
        balance,
        locationId: locId,
        changedBy: log.changedBy,
        previousData: log.oldData,
        newData: log.newData,
      };
    });
  }

  async getStockValuation(
    query: StockValuationQueryDto,
  ): Promise<StockValuationEntry[]> {
    const qb = this.quantRepository
      .createQueryBuilder('quant')
      .leftJoinAndSelect('quant.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('quant.location', 'location')
      .where('quant.quantity > 0');

    if (query.locationId) {
      qb.andWhere('quant.locationId = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.categoryId) {
      qb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    const quants = await qb.getMany();

    return quants.map((q) => {
      const qty = Number(q.quantity);
      const cost = Number(q.product.costPrice);
      return {
        productId: q.product.id,
        productName: q.product.name,
        sku: q.product.sku,
        categoryName: q.product.category?.name || 'Uncategorized',
        locationName: q.location?.name || 'Unknown',
        quantity: qty,
        unitCost: cost,
        totalValue: qty * cost,
      };
    });
  }
}
