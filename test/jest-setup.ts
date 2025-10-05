/**
 * Jest Setup File (runs before each test file)
 *
 * Loads test environment variables and configures test utilities.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Ensure .env.test is loaded for each test file
dotenv.config({ path: resolve(__dirname, '../.env.test') });

// Increase timeout for database operations
jest.setTimeout(30000);

// Suppress console logs during tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };
