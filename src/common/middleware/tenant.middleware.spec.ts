import { BadRequestException } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware';

describe('TenantMiddleware', () => {
  it('throws BadRequestException when x-tenant-id header is missing', () => {
    const middleware = new TenantMiddleware();
    const req: any = { headers: {} };
    const res: any = {};
    const next = jest.fn();

    expect(() => middleware.use(req, res, next)).toThrow(BadRequestException);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() when x-tenant-id header is provided', () => {
    const middleware = new TenantMiddleware();
    const req: any = {
      headers: { 'x-tenant-id': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' },
    };
    const res: any = {};
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
