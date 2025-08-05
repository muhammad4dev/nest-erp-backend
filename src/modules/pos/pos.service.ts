import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  SalesOrder,
  SalesOrderStatus,
} from '../sales/entities/sales-order.entity';
import { SalesOrderLine } from '../sales/entities/sales-order-line.entity';
import { SyncOrderDto } from './dto/sync-order.dto';

@Injectable()
export class PosService {
  private readonly logger = new Logger(PosService.name);

  constructor(private dataSource: DataSource) {}

  async syncOrders(orders: SyncOrderDto[]): Promise<any> {
    const results = {
      synced: 0,
      failed: 0,
      errors: [] as { id: string; error: string }[],
    };

    // Process sequentially or in parallel?
    // Transaction per order to avoid partial batch failure blocking valid orders?
    // Or one big transaction?
    // For sync, usually best to accept valid ones and report errors for others.

    for (const orderDto of orders) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Idempotency check
        const existing = await queryRunner.manager.findOne(SalesOrder, {
          where: { id: orderDto.id },
        });
        if (existing) {
          // Already synced
          await queryRunner.rollbackTransaction();
          results.synced++;
          continue;
        }

        const order = new SalesOrder();
        order.id = orderDto.id; // Trust client UUID
        order.orderNumber = `POS-${orderDto.id.substring(0, 8)}`; // Simple Order # logic
        order.partnerId = orderDto.partnerId;
        order.orderDate = orderDto.orderDate;
        order.status = SalesOrderStatus.CONFIRMED;
        order.totalAmount = orderDto.lines.reduce(
          (sum, l) =>
            sum + l.quantity * l.unitPrice * (1 - l.discountRate / 100),
          0,
        );

        // Save Request
        // Note: We construct entities manually or use create, but passing ID is key.

        await queryRunner.manager.save(SalesOrder, order);

        // Lines
        // We'd map lines here. relying on SalesOrder cascade if configured or saving manually.
        // SalesOrder has @OneToMany with cascade: true.
        order.lines = orderDto.lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discountRate: l.discountRate,
          subtotal: l.quantity * l.unitPrice * (1 - l.discountRate / 100),
          order: order,
        })) as unknown as SalesOrderLine[];

        await queryRunner.manager.save(SalesOrder, order); // Should save lines due to cascade

        await queryRunner.commitTransaction();
        results.synced++;
      } catch (err: unknown) {
        await queryRunner.rollbackTransaction();
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error';
        const errorStack = err instanceof Error ? err.stack : undefined;
        this.logger.error(
          `Failed to sync order ${orderDto.id}: ${errorMessage}`,
          errorStack,
        );
        results.failed++;
        results.errors.push({ id: orderDto.id, error: errorMessage });
      } finally {
        await queryRunner.release();
      }
    }

    return results;
  }
}
