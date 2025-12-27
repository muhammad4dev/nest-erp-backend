import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IdempotencyLog } from '../entities/idempotency-log.entity';
import { TenantContext } from '../context/tenant.context';
import { wrapTenantRepository } from '../repositories/tenant-repository-wrapper';

export interface IdempotencyPayload {
  endpoint: string;
  method: string;
  requestBody: Record<string, any>;
  responseBody: Record<string, any>;
  statusCode: number;
}

@Injectable()
export class IdempotencyService {
  private readonly EXPIRY_HOURS = 24;
  private repo: Repository<IdempotencyLog>;

  constructor(
    @InjectRepository(IdempotencyLog)
    repoBase: Repository<IdempotencyLog>,
  ) {
    this.repo = wrapTenantRepository(repoBase);
  }

  async checkAndStore(
    idempotencyKey: string,
    payload: IdempotencyPayload,
  ): Promise<{ cached: boolean; result?: any }> {
    const tenantId = TenantContext.requireTenantId();

    // Check for existing idempotency log
    const existing = await this.repo.findOne({
      where: {
        tenantId,
        idempotencyKey,
      },
    });

    if (existing) {
      // Validate the request matches the cached one
      if (
        existing.endpoint !== payload.endpoint ||
        existing.method !== payload.method
      ) {
        throw new BadRequestException(
          'Idempotency key reused for different endpoint or method',
        );
      }
      return { cached: true, result: existing.responseBody };
    }

    // Store new idempotency log
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + this.EXPIRY_HOURS);

    const log = this.repo.create({
      tenantId,
      idempotencyKey,
      ...payload,
      expiresAt,
    });

    await this.repo.save(log);
    return { cached: false };
  }

  async updateResult(
    idempotencyKey: string,
    responseBody: Record<string, any>,
    statusCode: number,
  ): Promise<void> {
    const tenantId = TenantContext.requireTenantId();

    await this.repo.update(
      {
        tenantId,
        idempotencyKey,
      },
      {
        responseBody,
        statusCode,
      },
    );
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}
