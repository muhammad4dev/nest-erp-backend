# NestJS ERP (Modular Monolith)

A production-grade, compliance-ready ERP backend built with **NestJS**, **PostgreSQL 18+**, and **TypeORM**.

## 🚀 Key Features

### 🛡️ Core Architecture

- **Multi-Tenancy**: Strict data isolation using Row-Level Security (RLS).
- **Security**: JWT-based authentication with Role-Based Access Control (RBAC).
- **Data Integrity**: **UUID v7** for all primary keys (time-request sortable) and immutable **Audit Logs** via PL/pgSQL triggers.
- **Double-Entry Bookkeeping**: Finance module enforces `Debits = Credits` at the database level.

### 📦 Modular Design

- **Finance**: General Ledger, Journals, Accounts, Trial Balance.
- **Inventory**: Multi-warehouse stock, Unit of Measure (UOM) conversion.
- **Supply Chain**: Sales (Quote->Invoice) & Procurement (RFQ->Bill).
- **HRMS**: Employee profiles and payroll structure.
- **POS**: Offline-first Point of Sale API with batch synchronization.
- **Localization**: Master data translation tables (e.g., bi-lingual Product names).
- **Compliance**: **ETA eInvoicing** integration (Egyptian Tax Authority) canonical JSON mapping.

## 🛠️ Tech Stack

- **Framework**: NestJS (Modular Monolith)
- **Database**: PostgreSQL 18+
- **ORM**: TypeORM
- **Package Manager**: pnpm

## 📖 Documentation

For detailed information, please refer to the following guides:

- [🚀 Core Architecture](docs/architecture.md)
- [🛠️ Developer Guide](docs/development.md)
- [📦 Database Setup & RLS](docs/db-setup.md) - **START HERE** for multi-tenant database initialization
- [⚙️ Operations & Maintenance](docs/operations.md)
- [🧪 Testing Strategy](docs/testing.md)
- [📈 Future Roadmap](docs/roadmap.md)

## ⚡ Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- Docker (for remote DB usage or local dev)

### Installation

```bash
pnpm install

# 2. Database Setup (Initial Dev Only)
# WARNING: This initializes RLS policies and Audit triggers.
pnpm db:setup
```

### Environment Config

Create a `.env` file in the root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=postgres
JWT_SECRET=super_secret_key
```

### Running the App

```bash
# Development
pnpm run start:dev

# Production Build
pnpm run build
pnpm run start:prod
```

### 📚 API Documentation

Once running, access the Swagger UI at:
http://localhost:3000/api

## 🧪 Testing & Verification

We prioritize strictly enforcing architectural boundaries.

### The Leak Test

A dedicated E2E test suite that attempts to access Tenant A's data using Tenant B's credentials. **This MUST fail** for the system to be considered secure.

```bash
# Run The Leak Test
pnpm test test/leak.e2e-spec.ts
```

### Unit Tests

Verify business logic for complex domains (Tax Calculation, PO Status transitions):

```bash
pnpm test
```

## 🏗️ Module Overview

| Module          | Description           | Key Entities                       |
| --------------- | --------------------- | ---------------------------------- |
| **Core**        | Kernel, Auth, Context | `Tenant`, `User`, `AuditLog`       |
| **Finance**     | Accounting Engine     | `JournalEntry`, `Account`          |
| **Inventory**   | Stock & Product       | `Product`, `StockQuant`, `UomUnit` |
| **Sales**       | CRM & Orders          | `SalesOrder`, `Partner`            |
| **Procurement** | Purchasing            | `PurchaseOrder`, `VendorBill`      |
| **POS**         | Retail API            | `PosSession` (stateless sync)      |
| **Compliance**  | Tax Authority         | `EtaInvoiceDto`                    |

## 🤝 Contribution

1.  Fork the repository.
2.  Create a feature branch (`feat/new-module`).
3.  Ensure "The Leak Test" passes.
4.  Submit a Pull Request.
