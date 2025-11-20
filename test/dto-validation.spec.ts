import { validate } from 'class-validator';
import { CreateJournalLineDto } from '../src/modules/finance/dto/create-journal-entry.dto';
import { CreatePaymentTermDto } from '../src/modules/finance/dto/payment-term.dto';
import { CreateUserDto } from '../src/modules/identity/dto/user.dto';

describe('DTO Validation', () => {
  it('CreateJournalLineDto should reject invalid UUID', async () => {
    const dto = new CreateJournalLineDto();
    // @ts-expect-error testing invalid type
    dto.accountId = 'not-a-uuid';
    dto.debit = 100;
    dto.credit = 0;
    dto.description = 'test';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.property === 'accountId')).toBe(true);
  });

  it('CreatePaymentTermDto should enforce positive days', async () => {
    const dto = new CreatePaymentTermDto();
    // @ts-expect-error testing invalid value
    dto.days = -5; // Invalid
    dto.name = 'Net -5';

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'days')).toBe(true);
  });

  it('CreateUserDto should enforce email format and min password length', async () => {
    const dto = new CreateUserDto();
    dto.email = 'invalid-email'; // Invalid
    // @ts-expect-error testing invalid value
    dto.password = 'short';
    dto.tenantId = '01935a5c-1234-7000-8000-000000000001';

    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
});
