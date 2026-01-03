import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend development
  if (process.env.NODE_ENV !== 'production') {
    app.enableCors({
      origin: ['http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'x-tenant-id',
        'X-Tenant-Id',
        'Idempotency-Key',
      ],
    });
  }

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('ERP API')
    .setDescription(
      'The ERP Backend API. Download the collection: [JSON](/api-json) | [YAML](/api-yaml)',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management endpoints')
    .addTag('roles', 'Role & Permission management endpoints')
    .addTag('tenants', 'Tenant management endpoints')
    .addTag('finance', 'Finance & Accounting endpoints')
    .addTag('sales', 'Sales & CRM endpoints')
    .addTag('partners', 'Partners (Customers & Vendors) endpoints')
    .addTag('procurement', 'Procurement endpoints')
    .addTag('inventory', 'Inventory management endpoints')
    .addTag('products', 'Product catalog & customization')
    .addTag('hrms', 'Human Resources endpoints')
    .addTag('pos', 'Point of Sale endpoints')
    .addTag('i18n', 'Localization endpoints')
    .addTag('compliance', 'ETA eInvoicing compliance endpoints')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-tenant-id',
        description:
          'Tenant identifier (required for all requests; enforces RLS)',
      },
      'tenant-id',
    )
    .addSecurityRequirements('tenant-id')
    .addSecurityRequirements('bearer')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const isOperationObject = (
    value: unknown,
  ): value is { security?: Array<Record<string, string[]>> } =>
    typeof value === 'object' &&
    value !== null &&
    'responses' in (value as Record<string, unknown>);

  // Ensure every operation requires the tenant header, even if controller-level security overrides top-level
  for (const path of Object.values(document.paths ?? {})) {
    for (const method of Object.values(path ?? {})) {
      if (!isOperationObject(method)) continue;

      const security = Array.isArray(method.security)
        ? [...method.security]
        : [];
      if (!security.some((s) => 'tenant-id' in s)) {
        security.push({ 'tenant-id': [] });
      }
      if (!security.some((s) => 'bearer' in s)) {
        security.push({ bearer: [] });
      }
      method.security = security;
    }
  }

  // Expose OpenAPI JSON at /api-json and YAML at /api-yaml
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api-json',
    yamlDocumentUrl: 'api-yaml',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      // Optional: if security overrides miss the header, enforce it via request interceptor
      requestInterceptor: (rawReq: unknown) => {
        const req = (rawReq ?? {}) as {
          headers?: Record<string, string>;
          tenantId?: string;
        };

        req.headers = req.headers ?? {};
        // Keep whatever user set; do not overwrite.
        req.headers['x-tenant-id'] =
          req.headers['x-tenant-id'] ??
          req.tenantId ??
          req.headers['X-TENANT-ID'];

        return req;
      },
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
