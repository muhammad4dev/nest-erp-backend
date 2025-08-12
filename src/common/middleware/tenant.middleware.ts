import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../context/tenant.context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantIdHeader = req.headers['x-tenant-id'];
    const tenantId = typeof tenantIdHeader === 'string' ? tenantIdHeader : '';

    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }

    TenantContext.run({ tenantId }, () => {
      next();
    });
  }
}
