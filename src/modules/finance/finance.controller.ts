import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Idempotent } from '../../common/decorators/idempotent.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JournalEntryService } from './journal-entry.service';
import { FiscalPeriodService } from './fiscal-period.service';
import { AccountService } from './account.service';
import { JournalEntry } from './entities/journal-entry.entity';
import { FiscalPeriod } from './entities/fiscal-period.entity';
import { Account } from './entities/account.entity';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import {
  CreateFiscalPeriodDto,
  UpdateFiscalPeriodDto,
  ClosePeriodDto,
} from './dto/fiscal-period.dto';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { AccountType } from './entities/account.entity';
import {
  TrialBalanceQueryDto,
  TrialBalanceEntry,
  GeneralLedgerQueryDto,
  GeneralLedgerEntry,
} from './dto/finance-reports.dto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RequirePermissions } from '../identity/decorators/require-permissions.decorator';
import { PermissionsGuard } from '../identity/guards/permissions.guard';
import { PERMISSIONS } from '../identity/constants/permissions.enum';

import { PaymentTerm } from './entities/payment-term.entity';
import {
  CreatePaymentTermDto,
  UpdatePaymentTermDto,
} from './dto/payment-term.dto';

@ApiTags('finance')
@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly journalEntryService: JournalEntryService,
    private readonly fiscalPeriodService: FiscalPeriodService,
    private readonly accountService: AccountService,
  ) {}

  // ========== JOURNAL ENTRIES ==========

  @Post('journal-entries')
  @Idempotent()
  @ApiOperation({ summary: 'Create a new journal entry' })
  @ApiResponse({
    status: 201,
    description: 'The journal entry has been successfully created.',
    type: JournalEntry,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.JOURNALS.CREATE)
  create(@Body() dto: CreateJournalEntryDto) {
    return this.financeService.createJournalEntry(
      dto.description,
      new Date(dto.date),
      dto.lines,
    );
  }

  @Post('journal-entries/:id/post')
  @ApiOperation({ summary: 'Post a journal entry (make it immutable)' })
  @ApiResponse({
    status: 200,
    description: 'Journal entry posted successfully.',
    type: JournalEntry,
  })
  @ApiResponse({
    status: 400,
    description: 'Entry is unbalanced or period is closed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.JOURNALS.APPROVE)
  postEntry(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.journalEntryService.post(id);
  }

  // ========== FISCAL PERIODS ==========

  @Post('periods')
  @Idempotent()
  @ApiOperation({ summary: 'Create a new fiscal period' })
  @ApiResponse({
    status: 201,
    description: 'Fiscal period created successfully.',
    type: FiscalPeriod,
  })
  @ApiResponse({
    status: 400,
    description: 'Period overlaps with existing period.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.FISCAL_PERIODS.CREATE)
  createPeriod(@Body() dto: CreateFiscalPeriodDto) {
    return this.fiscalPeriodService.create(dto);
  }

  @Get('periods')
  @ApiOperation({ summary: 'List all fiscal periods' })
  @ApiResponse({
    status: 200,
    description: 'List of fiscal periods.',
    type: [FiscalPeriod],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.FISCAL_PERIODS.READ)
  findAllPeriods() {
    return this.fiscalPeriodService.findAll();
  }

  @Get('periods/current')
  @ApiOperation({ summary: 'Get the current fiscal period' })
  @ApiResponse({
    status: 200,
    description: 'Current fiscal period.',
    type: FiscalPeriod,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.FISCAL_PERIODS.READ)
  getCurrentPeriod() {
    return this.fiscalPeriodService.getCurrentPeriod();
  }

  @Get('periods/:id')
  @ApiOperation({ summary: 'Get fiscal period by ID' })
  @ApiResponse({
    status: 200,
    description: 'Fiscal period details.',
    type: FiscalPeriod,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Period not found.' })
  @RequirePermissions(PERMISSIONS.FISCAL_PERIODS.READ)
  findPeriod(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fiscalPeriodService.findOne(id);
  }

  @Put('periods/:id')
  @ApiOperation({ summary: 'Update a fiscal period' })
  @ApiResponse({
    status: 200,
    description: 'Fiscal period updated.',
    type: FiscalPeriod,
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot modify closed period or bad request.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.FISCAL_PERIODS.UPDATE)
  updatePeriod(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateFiscalPeriodDto,
  ) {
    return this.fiscalPeriodService.update(id, dto);
  }

  @Post('periods/:id/close')
  @ApiOperation({ summary: 'Close a fiscal period' })
  @ApiResponse({
    status: 200,
    description: 'Period closed successfully.',
    type: FiscalPeriod,
  })
  @ApiResponse({
    status: 400,
    description: 'Unposted entries exist or period already closed.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.FISCAL_PERIODS.UPDATE)
  closePeriod(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ClosePeriodDto,
  ) {
    return this.fiscalPeriodService.closePeriod(id, dto.force);
  }

  @Post('periods/:id/reopen')
  @ApiOperation({ summary: 'Reopen a closed fiscal period' })
  @ApiResponse({
    status: 200,
    description: 'Period reopened successfully.',
    type: FiscalPeriod,
  })
  @ApiResponse({ status: 400, description: 'Period is not closed.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.FISCAL_PERIODS.UPDATE)
  reopenPeriod(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.fiscalPeriodService.reopenPeriod(id);
  }

  // ========== CHART OF ACCOUNTS ==========

  @Post('accounts')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully.',
    type: Account,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 409, description: 'Account code already exists.' })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.CREATE)
  createAccount(@Body() dto: CreateAccountDto) {
    return this.accountService.create(dto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List all accounts (Chart of Accounts)' })
  @ApiQuery({ name: 'type', required: false, enum: AccountType })
  @ApiResponse({
    status: 200,
    description: 'List of accounts.',
    type: [Account],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.READ)
  findAllAccounts(@Query('type') type?: AccountType) {
    return this.accountService.findAll(type);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiResponse({ status: 200, description: 'Account details.', type: Account })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.READ)
  findAccount(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.accountService.findOne(id);
  }

  @Put('accounts/:id')
  @ApiOperation({ summary: 'Update an account' })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully.',
    type: Account,
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @ApiResponse({ status: 409, description: 'Account code already exists.' })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.UPDATE)
  updateAccount(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountService.update(id, dto);
  }

  // ========== REPORTS ==========

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Get Trial Balance Report' })
  @ApiResponse({
    status: 200,
    description: 'Trial Balance.',
    type: [TrialBalanceEntry],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.READ)
  getTrialBalance(@Query() query: TrialBalanceQueryDto) {
    return this.financeService.getTrialBalance(query);
  }

  @Get('reports/general-ledger')
  @ApiOperation({ summary: 'Get General Ledger Report' })
  @ApiResponse({
    status: 200,
    description: 'General Ledger.',
    type: [GeneralLedgerEntry],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.READ)
  getGeneralLedger(@Query() query: GeneralLedgerQueryDto) {
    return this.financeService.getGeneralLedger(query);
  }

  // ========== CONFIGURATION ==========

  @Get('config/payment-terms')
  @ApiOperation({ summary: 'Get available payment terms' })
  @ApiResponse({
    status: 200,
    description: 'List of payment terms.',
    type: [PaymentTerm],
  })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.READ)
  getPaymentTerms() {
    return this.financeService.findAllPaymentTerms();
  }

  @Post('payment-terms')
  @Idempotent()
  @RequirePermissions(PERMISSIONS.ACCOUNTS.CREATE)
  @ApiOperation({ summary: 'Create a payment term' })
  @ApiResponse({
    status: 201,
    description: 'Payment term created.',
    type: PaymentTerm,
  })
  createPaymentTerm(@Body() dto: CreatePaymentTermDto) {
    return this.financeService.createPaymentTerm(dto);
  }

  @Put('payment-terms/:id')
  @ApiOperation({ summary: 'Update a payment term' })
  @ApiResponse({
    status: 200,
    description: 'Payment term updated.',
    type: PaymentTerm,
  })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.UPDATE)
  updatePaymentTerm(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdatePaymentTermDto,
  ) {
    return this.financeService.updatePaymentTerm(id, dto);
  }

  @Delete('payment-terms/:id')
  @ApiOperation({ summary: 'Delete a payment term' })
  @ApiResponse({
    status: 200,
    description: 'Payment term deleted.',
  })
  @ApiResponse({ status: 404, description: 'Payment term not found.' })
  @RequirePermissions(PERMISSIONS.ACCOUNTS.DELETE)
  deletePaymentTerm(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.financeService.deletePaymentTerm(id);
  }
}
