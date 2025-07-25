import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const config = new DocumentBuilder()
    .setTitle('ERP API')
    .setDescription(
      'The ERP Backend API. Download the collection: [JSON](/api-json) | [YAML](/api-yaml)',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('finance', 'Finance & Accounting endpoints')
    .addTag('sales', 'Sales & CRM endpoints')
    .addTag('procurement', 'Procurement endpoints')
    .addTag('inventory', 'Inventory management endpoints')
    .addTag('products', 'Product catalog & customization')
    .addTag('hrms', 'Human Resources endpoints')
    .addTag('pos', 'Point of Sale endpoints')
    .addTag('i18n', 'Localization endpoints')
    .addTag('compliance', 'ETA eInvoicing compliance endpoints')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Expose OpenAPI JSON at /api-json and YAML at /api-yaml
  SwaggerModule.setup('api', app, document, {
    jsonDocumentUrl: 'api-json',
    yamlDocumentUrl: 'api-yaml',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
