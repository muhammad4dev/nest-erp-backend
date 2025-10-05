import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load test environment
dotenv.config({ path: resolve(__dirname, '../.env.test') });

import { execSync } from 'child_process';

/**
 * Jest Global Teardown for E2E Tests
 *
 * Runs once after all test suites complete:
 * 1. Drops test database
 * 2. Removes test role
 * 3. Cleans up resources
 */
export default async function globalTeardown() {
  console.log('\n🧹 Jest Global Teardown: Cleaning up test database...\n');

  try {
    execSync(
      'ts-node -r tsconfig-paths/register scripts/setup-db.ts teardown',
      {
        stdio: 'inherit',
        env: { ...process.env }, // .env.test already loaded
      },
    );

    console.log('\n✅ Global teardown complete!\n');
  } catch (error) {
    console.error('\n❌ Global teardown failed:', error);
    // Don't throw - allow tests to finish even if cleanup fails
  }
}
