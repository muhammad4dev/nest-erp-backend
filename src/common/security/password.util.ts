import * as bcrypt from 'bcrypt';

function parseRounds(): number {
  const envValue = process.env.BCRYPT_SALT_ROUNDS;
  const parsed = envValue ? Number(envValue) : 12;
  if (!Number.isFinite(parsed)) return 12;
  // Keep within a reasonable operational range.
  return Math.min(Math.max(Math.trunc(parsed), 10), 14);
}

const ROUNDS = parseRounds();

export function getBcryptRounds(): number {
  return ROUNDS;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}
