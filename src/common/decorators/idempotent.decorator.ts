import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent';

/**
 * Marks a controller method as requiring idempotency.
 * The IdempotencyInterceptor will handle caching based on the Idempotency-Key header.
 *
 * Usage:
 * ```typescript
 * @Post('journal-entries')
 * @Idempotent()
 * async createJournalEntry(
 *   @Body() dto: CreateJournalEntryDto,
 *   @Headers('Idempotency-Key') idempotencyKey: string,
 * ) {
 *   return this.financeService.createJournalEntry(dto);
 * }
 * ```
 */
export function Idempotent() {
  return SetMetadata(IDEMPOTENT_KEY, true);
}
