# Future Roadmap (Todos)

This document outlines the planned enhancements and future directions for the NestJS ERP system.

## 📈 High Priority

- **Unit/Integration Testing Coverage**: Reach >80% coverage for all modules.
- **Postgres Table Partitioning**: Implement partitioning for `system_audit_logs` to ensure performance as data grows.
- **Two-Factor Authentication (2FA)**: Add support for TOTP-based authentication.

## 🚀 Feature Enhancements

- **Advanced Reporting Engine**: Implement a dynamic report builder for Finance and Sales.
- **Workflow / BPMN Integration**: Add support for customizable approval workflows (e.g., PO approval limits).
- **Webhooks System**: Provide a mechanism for external systems to subscribe to ERP events (e.g., `invoice.posted`).
- **File Storage Module**: Integrate with S3/Minio for storing invoice PDFs and employee documents.

## 🛠️ Technical Debt & Optimization

- **Caching Layer**: Implement Redis-based caching for high-read entities (Products, UOMs).
- **Message queue**: Migrate background tasks (Email, ETA submission) to BullMQ or RabbitMQ.
- **Frontend Scaffold**: Build the initial React/Inter Admin dashboard using the existing Swagger specs.

## 🌍 Globalization

- **Multi-Currency Support**: Add exchange rate management and currency revaluation logic.
- **RTL Language Support**: Ensure the future UI supports Arabic/Farsi.
