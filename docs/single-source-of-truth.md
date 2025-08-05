# Single Source of Truth: Database Setup

## Architecture Decision

**Problem**: Originally created separate `test/setup-test-db.ts` duplicating logic from `scripts/setup-db.ts`.

**Solution**: Use `scripts/setup-db.ts` as the **single source of truth** for all database operations.

## How It Works

### Environment-Based Configuration

```typescript
// scripts/setup-db.ts
if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test' }); // Test environment
} else {
  dotenv.config(); // Dev/prod (.env)
}
```

### Commands

```bash
# Development database
npm run db:setup                 # Creates dev database
npm run db:teardown              # Not typically used for dev

# Test database
npm run test:db:setup            # Creates test database (NODE_ENV=test)
npm run test:db:teardown         # Drops test database (NODE_ENV=test)

# E2E tests (automatic setup/teardown)
npm run test:e2e                 # Jest global setup/teardown handles DB
```

## Benefits

✅ **DRY Principle**: One implementation, multiple configurations  
✅ **Consistency**: Dev and test use identical setup logic  
✅ **Maintainability**: Changes apply to all environments  
✅ **Less Code**: Removed 200+ lines of duplicate code

## Files Involved

- **Single Source**: `scripts/setup-db.ts`
  - Creates database (admin-owned)
  - Creates non-superuser app role
  - Runs schema synchronization
  - Applies UUID v7 defaults
  - Installs RLS policies
  - Installs audit triggers
  - **New**: Teardown function

- **Test Integration**:
  - `test/global-setup.ts` - Calls `setup-db.ts` before tests
  - `test/global-teardown.ts` - Calls `setup-db.ts teardown` after tests
  - `test/jest-setup.ts` - Loads `.env.test` for each test file

- **Configuration**:
  - `.env` - Development database config
  - `.env.test` - Test database config

## Migration Path

### Before (Duplicated)

```
test/setup-test-db.ts  (200 lines)
  - setupTestDatabase()
  - teardownTestDatabase()

scripts/setup-db.ts    (200 lines)
  - setupAdminConnection()
  - setupSchema()
```

### After (Consolidated)

```
scripts/setup-db.ts    (250 lines)
  - setupAdminConnection()
  - setupSchema()
  - teardownDatabase()     ← New
  - bootstrap()            ← Routes setup vs teardown
```

## Usage Examples

### Development

```bash
# Setup dev database once
npm run db:setup

# Start dev server
npm run start:dev
```

### Testing

```bash
# Manual test database management
npm run test:db:setup     # Create test DB
npm run test:e2e          # Run tests
npm run test:db:teardown  # Clean up

# Or let Jest handle it automatically
npm run test:e2e          # Setup → Tests → Teardown
```

### CI/CD

```yaml
- name: Setup test database
  run: npm run test:db:setup
  env:
    NODE_ENV: test

- name: Run E2E tests
  run: npm run test:e2e

- name: Cleanup
  run: npm run test:db:teardown
  if: always()
```

## Key Insight

**Environment variables drive behavior, not separate scripts.**

This is the Unix philosophy: write programs that do one thing well, configured by their environment.
