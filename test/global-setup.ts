import * as dotenv from 'dotenv';
import { resolve } from 'path';

// CRITICAL: Load test environment before any imports
dotenv.config({ path: resolve(__dirname, '../.env.test') });

import { execSync } from 'child_process';

/**
 * Jest Global Setup for E2E Tests
 *
 * Runs once before all test suites:
 * 1. Loads .env.test configuration
 * 2. Creates isolated test database
 * 3. Runs schema migrations
 * 4. Applies RLS policies and audit triggers
 * 5. Ensures UUID v7 defaults
 */
export default async function globalSetup() {
  console.log('\n🧪 Jest Global Setup: Initializing test database...\n');

  try {
    // Setup test database using setup-db.ts with .env.test
    console.log(
      '📋 Creating test database with RLS, UUID v7, and audit triggers...\n',
    );
    execSync('ts-node -r tsconfig-paths/register scripts/setup-db.ts', {
      stdio: 'inherit',
      env: { ...process.env }, // .env.test already loaded by dotenv.config above
    });

    console.log('\n✅ Global setup complete! Test database ready.\n');
  } catch (error) {
    console.error('\n❌ Global setup failed:', error);
    throw error;
  }
}
