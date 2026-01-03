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
import { StockReceipt, ReceiptStatus } from './entities/stock-receipt.entity';
import { StockReceiptLine } from './entities/stock-receipt-line.entity';
import { StockIssue, IssueStatus } from './entities/stock-issue.entity';
import { StockIssueLine } from './entities/stock-issue-line.entity';
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
import { AuditLog } from '../../common/entities/audit-log.entity';
import { StockLedgerQueryDto, StockLedgerEntry } from './dto/stock-ledger.dto';
import {
  StockValuationQueryDto,
  StockValuationEntry,
} from './dto/inventory-reports.dto';
import { wrapTenantRepository } from '../../common/repositories/tenant-repository-wrapper';
import { TenantContext } from '../../common/context/tenant.context';

@Injectable()
export class InventoryService {
  private quantRepository: Repository<StockQuant>;
  private productRepository: Repository<Product>;
  private locationRepository: Repository<Location>;
  private auditLogRepository: Repository<AuditLog>;
  private receiptRepository: Repository<StockReceipt>;
  private receiptLineRepository: Repository<StockReceiptLine>;
  private issueRepository: Repository<StockIssue>;
  private issueLineRepository: Repository<StockIssueLine>;

  constructor(
    @InjectRepository(StockQuant)
    quantRepositoryBase: Repository<StockQuant>,
    @InjectRepository(Product)
    productRepositoryBase: Repository<Product>,
    @InjectRepository(Location)
    locationRepositoryBase: Repository<Location>,
    @InjectRepository(AuditLog)
    auditLogRepositoryBase: Repository<AuditLog>,
    @InjectRepository(StockReceipt)
    receiptRepositoryBase: Repository<StockReceipt>,
    @InjectRepository(StockReceiptLine)
    receiptLineRepositoryBase: Repository<StockReceiptLine>,
    @InjectRepository(StockIssue)
    issueRepositoryBase: Repository<StockIssue>,
    @InjectRepository(StockIssueLine)
    issueLineRepositoryBase: Repository<StockIssueLine>,
    private dataSource: DataSource,
  ) {
    this.quantRepository = wrapTenantRepository(quantRepositoryBase);
    this.productRepository = wrapTenantRepository(productRepositoryBase);
    this.locationRepository = wrapTenantRepository(locationRepositoryBase);
    this.auditLogRepository = wrapTenantRepository(auditLogRepositoryBase);
    this.receiptRepository = wrapTenantRepository(receiptRepositoryBase);
    this.receiptLineRepository = wrapTenantRepository(
      receiptLineRepositoryBase,
    );
    this.issueRepository = wrapTenantRepository(issueRepositoryBase);
    this.issueLineRepository = wrapTenantRepository(issueLineRepositoryBase);
  }

  // ========== PRODUCT CRUD ==========

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const tenantId = TenantContext.requireTenantId();
    const existing = await this.productRepository.findOne({
      where: { sku: dto.sku },
    });
    if (existing) {
      throw new ConflictException('Product with this SKU already exists');
    }

    const product = this.productRepository.create({ ...dto, tenantId });
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
    const tenantId = TenantContext.requireTenantId();
    const location = this.locationRepository.create({ ...dto, tenantId });
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
    const tenantId = TenantContext.requireTenantId();
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException(
        'Source and destination locations must be different',
      );
    }

    // Use query runner to properly set tenant context for RLS
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set tenant context for RLS
      await queryRunner.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenantId],
      );

      const quantRepo = queryRunner.manager.getRepository(StockQuant);

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
          tenantId,
        });
        await quantRepo.save(destQuant);
      }

      const result = {
        success: true,
        message: `Transferred ${dto.quantity} units from ${dto.fromLocationId} to ${dto.toLocationId}`,
      };

      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
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
      const tenantId = TenantContext.requireTenantId();
      quant = this.quantRepository.create({
        productId: dto.productId,
        locationId: dto.locationId,
        quantity: dto.quantity,
        tenantId,
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

  // ========== STOCK RECEIPTS ==========

  async createReceipt(dto: CreateStockReceiptDto): Promise<StockReceipt> {
    const tenantId = TenantContext.requireTenantId();

    // Verify location exists
    const location = await this.locationRepository.findOne({
      where: { id: dto.locationId },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Verify all products exist
    for (const line of dto.lines) {
      const product = await this.productRepository.findOne({
        where: { id: line.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${line.productId} not found`);
      }
    }

    // Generate receipt number
    const count = await this.receiptRepository.count();
    const receiptNumber = `RCP-${String(count + 1).padStart(6, '0')}`;

    // Calculate totals
    const totalQuantity = dto.lines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    );
    const totalValue = dto.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitCost,
      0,
    );

    // Create receipt with lines (cascade will save lines)
    const receipt = this.receiptRepository.create({
      ...dto,
      receiptNumber,
      tenantId,
      status: ReceiptStatus.DRAFT,
      totalQuantity,
      totalValue,
      lines: dto.lines.map((line) => ({
        ...line,
        tenantId,
        lineTotal: line.quantity * line.unitCost,
      })),
    });

    return this.receiptRepository.save(receipt);
  }

  async getReceipts(filters?: {
    status?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StockReceipt[]> {
    const qb = this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.location', 'location')
      .leftJoinAndSelect('receipt.lines', 'lines')
      .leftJoinAndSelect('lines.product', 'product');

    if (filters?.status) {
      qb.andWhere('receipt.status = :status', { status: filters.status });
    }

    if (filters?.locationId) {
      qb.andWhere('receipt.locationId = :locationId', {
        locationId: filters.locationId,
      });
    }

    if (filters?.startDate) {
      qb.andWhere('receipt.receiptDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      qb.andWhere('receipt.receiptDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return qb.orderBy('receipt.receiptDate', 'DESC').getMany();
  }

  async getReceipt(id: string): Promise<StockReceipt> {
    const receipt = await this.receiptRepository.findOne({
      where: { id },
      relations: ['location', 'lines', 'lines.product'],
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return receipt;
  }

  async updateReceipt(
    id: string,
    dto: UpdateStockReceiptDto,
  ): Promise<StockReceipt> {
    const tenantId = TenantContext.requireTenantId();
    const receipt = await this.getReceipt(id);

    if (receipt.status !== ReceiptStatus.DRAFT) {
      throw new BadRequestException('Can only update DRAFT receipts');
    }

    // If lines are updated, delete old lines and recreate them
    if (dto.lines) {
      const totalQuantity = dto.lines.reduce(
        (sum, line) => sum + line.quantity,
        0,
      );
      const totalValue = dto.lines.reduce(
        (sum, line) => sum + line.quantity * line.unitCost,
        0,
      );
      dto.totalQuantity = totalQuantity;
      dto.totalValue = totalValue;

      // Delete old lines
      if (receipt.lines && receipt.lines.length > 0) {
        await this.receiptLineRepository.remove(receipt.lines);
      }

      // Create new lines with all required fields
      receipt.lines = dto.lines.map((line) =>
        this.receiptLineRepository.create({
          ...line,
          tenantId,
          receiptId: receipt.id,
          lineTotal: line.quantity * line.unitCost,
        }),
      );
    }

    // Update other fields
    Object.assign(receipt, {
      receiptDate: dto.receiptDate,
      sourceType: dto.sourceType,
      sourceReference: dto.sourceReference,
      notes: dto.notes,
      locationId: dto.locationId,
      totalQuantity: dto.totalQuantity,
      totalValue: dto.totalValue,
    });

    return this.receiptRepository.save(receipt);
  }

  async completeReceipt(id: string): Promise<StockReceipt> {
    const tenantId = TenantContext.requireTenantId();
    const receipt = await this.getReceipt(id);

    if (receipt.status !== ReceiptStatus.DRAFT) {
      throw new BadRequestException('Receipt is not in DRAFT status');
    }

    // Use query runner to properly set tenant context for RLS
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set tenant context for RLS
      await queryRunner.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenantId],
      );

      const quantRepo = queryRunner.manager.getRepository(StockQuant);
      const receiptRepo = queryRunner.manager.getRepository(StockReceipt);

      // Update stock quantities for each line
      for (const line of receipt.lines) {
        let quant = await quantRepo.findOne({
          where: {
            productId: line.productId,
            locationId: receipt.locationId,
          },
        });

        if (quant) {
          quant.quantity = Number(quant.quantity) + line.quantity;
          await quantRepo.save(quant);
        } else {
          quant = quantRepo.create({
            tenantId,
            productId: line.productId,
            locationId: receipt.locationId,
            quantity: line.quantity,
          });
          await quantRepo.save(quant);
        }
      }

      // Update receipt status
      receipt.status = ReceiptStatus.COMPLETED;
      receipt.completedAt = new Date();
      const updatedReceipt = await receiptRepo.save(receipt);

      await queryRunner.commitTransaction();
      return updatedReceipt;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteReceipt(id: string): Promise<void> {
    const receipt = await this.getReceipt(id);

    if (receipt.status === ReceiptStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed receipt');
    }

    await this.receiptRepository.remove(receipt);
  }

  // ========== STOCK ISSUES ==========

  async createIssue(dto: CreateStockIssueDto): Promise<StockIssue> {
    const tenantId = TenantContext.requireTenantId();

    // Verify location exists
    const location = await this.locationRepository.findOne({
      where: { id: dto.locationId },
    });
    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Verify all products exist
    for (const line of dto.lines) {
      const product = await this.productRepository.findOne({
        where: { id: line.productId },
      });
      if (!product) {
        throw new NotFoundException(`Product ${line.productId} not found`);
      }
    }

    // Generate issue number
    const count = await this.issueRepository.count();
    const issueNumber = `ISS-${String(count + 1).padStart(6, '0')}`;

    // Calculate totals
    const totalQuantity = dto.lines.reduce(
      (sum, line) => sum + line.quantity,
      0,
    );
    const totalValue = dto.lines.reduce(
      (sum, line) => sum + line.quantity * line.unitCost,
      0,
    );

    // Create issue with lines
    const issue = this.issueRepository.create({
      ...dto,
      issueNumber,
      tenantId,
      status: IssueStatus.DRAFT,
      totalQuantity,
      totalValue,
      lines: dto.lines.map((line) => ({
        ...line,
        tenantId,
        lineTotal: line.quantity * line.unitCost,
      })),
    });

    return this.issueRepository.save(issue);
  }

  async getIssues(filters?: {
    status?: string;
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<StockIssue[]> {
    const qb = this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.location', 'location')
      .leftJoinAndSelect('issue.lines', 'lines')
      .leftJoinAndSelect('lines.product', 'product');

    if (filters?.status) {
      qb.andWhere('issue.status = :status', { status: filters.status });
    }

    if (filters?.locationId) {
      qb.andWhere('issue.locationId = :locationId', {
        locationId: filters.locationId,
      });
    }

    if (filters?.startDate) {
      qb.andWhere('issue.issueDate >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      qb.andWhere('issue.issueDate <= :endDate', {
        endDate: filters.endDate,
      });
    }

    return qb.orderBy('issue.issueDate', 'DESC').getMany();
  }

  async getIssue(id: string): Promise<StockIssue> {
    const issue = await this.issueRepository.findOne({
      where: { id },
      relations: ['location', 'lines', 'lines.product'],
    });

    if (!issue) {
      throw new NotFoundException('Issue not found');
    }

    return issue;
  }

  async updateIssue(id: string, dto: UpdateStockIssueDto): Promise<StockIssue> {
    const tenantId = TenantContext.requireTenantId();
    const issue = await this.getIssue(id);

    if (issue.status !== IssueStatus.DRAFT) {
      throw new BadRequestException('Can only update DRAFT issues');
    }

    // If lines are updated, delete old lines and recreate them
    if (dto.lines) {
      const totalQuantity = dto.lines.reduce(
        (sum, line) => sum + line.quantity,
        0,
      );
      const totalValue = dto.lines.reduce(
        (sum, line) => sum + line.quantity * line.unitCost,
        0,
      );
      dto.totalQuantity = totalQuantity;
      dto.totalValue = totalValue;

      // Delete old lines
      if (issue.lines && issue.lines.length > 0) {
        await this.issueLineRepository.remove(issue.lines);
      }

      // Create new lines with all required fields
      issue.lines = dto.lines.map((line) =>
        this.issueLineRepository.create({
          ...line,
          tenantId,
          issueId: issue.id,
          lineTotal: line.quantity * line.unitCost,
        }),
      );
    }

    // Update other fields
    Object.assign(issue, {
      issueDate: dto.issueDate,
      issueType: dto.issueType,
      locationId: dto.locationId,
      customerId: dto.customerId,
      sourceReference: dto.sourceReference,
      notes: dto.notes,
      totalQuantity: dto.totalQuantity,
      totalValue: dto.totalValue,
    });

    return this.issueRepository.save(issue);
  }

  async completeIssue(id: string): Promise<StockIssue> {
    const tenantId = TenantContext.requireTenantId();
    const issue = await this.getIssue(id);

    if (issue.status !== IssueStatus.DRAFT) {
      throw new BadRequestException('Issue is not in DRAFT status');
    }

    // Use query runner to properly set tenant context for RLS
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Set tenant context for RLS
      await queryRunner.query(
        "SELECT set_config('app.current_tenant_id', $1, true)",
        [tenantId],
      );

      const quantRepo = queryRunner.manager.getRepository(StockQuant);
      const issueRepo = queryRunner.manager.getRepository(StockIssue);

      // Validate and update stock quantities for each line
      for (const line of issue.lines) {
        const quant = await quantRepo.findOne({
          where: {
            productId: line.productId,
            locationId: issue.locationId,
          },
        });

        if (!quant || Number(quant.quantity) < line.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${line.productId}`,
          );
        }

        quant.quantity = Number(quant.quantity) - line.quantity;
        await quantRepo.save(quant);
      }

      // Update issue status
      issue.status = IssueStatus.COMPLETED;
      issue.completedAt = new Date();
      const updatedIssue = await issueRepo.save(issue);

      await queryRunner.commitTransaction();
      return updatedIssue;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteIssue(id: string): Promise<void> {
    const issue = await this.getIssue(id);

    if (issue.status === IssueStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete completed issue');
    }

    await this.issueRepository.remove(issue);
  }
}
