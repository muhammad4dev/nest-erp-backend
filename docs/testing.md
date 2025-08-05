# Testing Strategy

We maintain a high-quality codebase through TDD and strict tenant isolation verification.

## 1. Test Categories

### Unit Tests

- **Focus**: Business logic, tax calculations, ledger balancing.
- **Location**: `src/**/*.spec.ts`
- **Command**: `npm run test`

### E2E Leak Test

The **Leak Test** is our most critical security verification. It ensures that a compromised tenant credentials cannot access another tenant's data.

- **Scenario**:
  1. Authenticate as `Tenant A`.
  2. Attempt to `GET` a resource belonging to `Tenant B`.
  3. The system MUST return `404 Not Found` or `403 Forbidden`.
- **Command**: `npm run test:e2e` (or specific filename `npm run test -- test/leak.e2e-spec.ts`).

## 2. CI/CD Integration

Tests are automatically executed on every Push and Pull Request.

- **Linting**: `npm run lint`
- **Build**: `npm run build`
- **Tests**: `npm run test:cov`

## 3. Code Coverage

We aim for **>80%** coverage in core modules (Finance, Inventory, Identity).

- **Report**: Run `npm run test:cov` to generate a report in `coverage/`.
