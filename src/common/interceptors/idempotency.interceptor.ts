import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { IdempotencyService } from '../services/idempotency.service';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator';

interface CachedResult {
  statusCode?: number;
  responseBody?: unknown;
}

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private idempotencyService: IdempotencyService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const isIdempotent = this.reflector.get<boolean>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );

    if (!isIdempotent) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const idempotencyKey = request.headers['idempotency-key'];
    if (!idempotencyKey) {
      throw new BadRequestException(
        'Idempotency-Key header is required for this endpoint',
      );
    }

    if (typeof idempotencyKey !== 'string') {
      throw new BadRequestException('Idempotency-Key must be a string');
    }

    // Check if request was already processed
    const payload = {
      endpoint: request.path,
      method: request.method,
      requestBody: (request.body as Record<string, unknown>) || {},
      responseBody: {},
      statusCode: 200,
    };

    const result = await this.idempotencyService.checkAndStore(
      idempotencyKey,
      payload,
    );

    if (result.cached && result.result !== undefined) {
      // Return cached response
      const cachedResult = result.result as CachedResult;
      response.status(cachedResult.statusCode || 200);
      return new Observable((subscriber) => {
        subscriber.next(cachedResult.responseBody || result.result);
        subscriber.complete();
      });
    }

    // Process the request
    return next.handle().pipe(
      tap((data: unknown) => {
        // Update the idempotency log with the response
        void this.idempotencyService.updateResult(
          idempotencyKey,
          data as Record<string, any>,
          response.statusCode,
        );
      }),
    );
  }
}
