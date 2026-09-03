import type { CompanyId } from '@/types/models';

export type KrwAmount = number;

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type AccountKind = 'GROUP' | 'POSTING';
export type ChartOfAccountsState = 'DRAFT' | 'ACTIVE' | 'RETIRED';
export type AccountingPeriodState = 'OPEN' | 'CLOSING' | 'CLOSED';
export type ApprovalState = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RECALLED';
export type PostingState = 'NOT_POSTED' | 'READY_TO_POST' | 'POSTED' | 'REVERSED' | 'BLOCKED';

export interface AccountCode {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly chartOfAccountsId: string;
  readonly chartVersion: number;
  readonly code: string;
  readonly name: string;
  readonly parentCode: string | null;
  readonly accountType: AccountType;
  readonly normalBalance: NormalBalance;
  readonly kind: AccountKind;
  readonly taxTarget: boolean;
  readonly active: boolean;
}

export interface ChartOfAccounts {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly version: number;
  readonly name: string;
  readonly state: ChartOfAccountsState;
  readonly effectiveFrom: string;
  readonly effectiveTo: string | null;
  readonly accounts: readonly AccountCode[];
}

export interface AccountingPeriod {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly fiscalYear: number;
  readonly periodNo: number;
  readonly startsOn: string;
  readonly endsOn: string;
  readonly state: AccountingPeriodState;
  readonly revision: number;
}

export interface AccountingDimensions {
  readonly projectId: string | null;
  readonly projectNo: string | null;
  readonly costCenterId: string | null;
  readonly organizationId: string | null;
}

export interface SourceDocumentLineage {
  readonly companyId: CompanyId;
  readonly documentType: string;
  readonly documentId: string;
  readonly documentRevision: number;
  readonly eventId: string;
}

export interface JournalLine {
  readonly id: string;
  readonly journalId: string;
  readonly companyId: CompanyId;
  readonly lineNo: number;
  readonly chartOfAccountsId: string;
  readonly chartVersion: number;
  readonly accountCode: string;
  readonly debitKrw: KrwAmount;
  readonly creditKrw: KrwAmount;
  readonly dimensions: Readonly<AccountingDimensions>;
  readonly description: string;
  readonly sourceReferenceId: string | null;
}

export interface JournalHeader {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly journalNo: string;
  readonly accountingPeriodId: string;
  readonly postingDate: string;
  readonly currency: 'KRW';
  readonly approvalState: ApprovalState;
  readonly postingState: PostingState;
  readonly idempotencyKey: string;
  readonly source: Readonly<SourceDocumentLineage>;
  readonly dimensions: Readonly<AccountingDimensions>;
  readonly totalDebitKrw: KrwAmount;
  readonly totalCreditKrw: KrwAmount;
  readonly lines: readonly Readonly<JournalLine>[];
  readonly revision: number;
  readonly reversalOfJournalId: string | null;
  readonly correctionOfJournalId: string | null;
  readonly reasonCode: string | null;
  readonly createdBy: string;
  readonly createdAt: string;
}

export interface PostingRequest {
  readonly id: string;
  readonly companyId: CompanyId;
  readonly journalId: string;
  readonly accountingPeriodId: string;
  readonly source: Readonly<SourceDocumentLineage>;
  readonly approvalState: ApprovalState;
  readonly postingState: PostingState;
  readonly idempotencyKey: string;
  readonly requestedBy: string;
  readonly requestedAt: string;
  readonly correlationId: string;
}

export type AccountingValidationCode =
  | 'EMPTY_JOURNAL'
  | 'INVALID_KRW_AMOUNT'
  | 'INVALID_DEBIT_CREDIT_SIDE'
  | 'UNBALANCED_JOURNAL'
  | 'HEADER_TOTAL_MISMATCH'
  | 'COMPANY_SCOPE_MISMATCH'
  | 'JOURNAL_LINEAGE_MISMATCH'
  | 'APPROVAL_REQUIRED'
  | 'POSTING_STATE_NOT_READY'
  | 'ACCOUNTING_PERIOD_NOT_OPEN'
  | 'POSTING_DATE_OUTSIDE_PERIOD'
  | 'IDEMPOTENCY_KEY_REQUIRED'
  | 'IDEMPOTENCY_DUPLICATE';

export interface AccountingValidationIssue {
  readonly code: AccountingValidationCode;
  readonly path: string;
  readonly message: string;
}

export interface JournalValidationResult {
  readonly valid: boolean;
  readonly debitTotalKrw: KrwAmount;
  readonly creditTotalKrw: KrwAmount;
  readonly issues: readonly AccountingValidationIssue[];
}

export interface PostingEvaluationResult {
  readonly allowed: boolean;
  readonly issues: readonly AccountingValidationIssue[];
}

export interface AuditSafeJournalSummary {
  readonly journalId: string;
  readonly companyId: CompanyId;
  readonly journalNo: string;
  readonly approvalState: ApprovalState;
  readonly postingState: PostingState;
  readonly sourceDocumentType: string;
  readonly sourceDocumentId: string;
  readonly sourceDocumentRevision: number;
  readonly lineCount: number;
  readonly accountCodes: readonly string[];
  readonly totalDebitKrw: KrwAmount;
  readonly totalCreditKrw: KrwAmount;
  readonly revision: number;
  readonly reversalOfJournalId: string | null;
  readonly correctionOfJournalId: string | null;
}

export class AccountingDomainError extends Error {
  readonly code: AccountingValidationCode | 'POSTED_JOURNAL_IMMUTABLE' | 'SOURCE_JOURNAL_NOT_POSTED';

  constructor(code: AccountingDomainError['code'], message: string = code) {
    super(message);
    this.name = 'AccountingDomainError';
    this.code = code;
  }
}

const issue = (
  code: AccountingValidationCode,
  path: string,
  message: string = code,
): AccountingValidationIssue => ({ code, path, message });

const isValidKrwAmount = (value: number) => Number.isSafeInteger(value) && value >= 0;

const addKrw = (current: number, amount: number) => {
  const next = current + amount;
  return Number.isSafeInteger(next) ? next : null;
};

export function validateJournal(journal: JournalHeader): JournalValidationResult {
  const issues: AccountingValidationIssue[] = [];
  let debitTotalKrw = 0;
  let creditTotalKrw = 0;

  if (journal.lines.length === 0) {
    issues.push(issue('EMPTY_JOURNAL', 'lines'));
  }
  if (!journal.idempotencyKey.trim()) {
    issues.push(issue('IDEMPOTENCY_KEY_REQUIRED', 'idempotencyKey'));
  }
  if (journal.source.companyId !== journal.companyId) {
    issues.push(issue('COMPANY_SCOPE_MISMATCH', 'source.companyId'));
  }

  journal.lines.forEach((line, index) => {
    const path = `lines[${index}]`;
    if (line.companyId !== journal.companyId) {
      issues.push(issue('COMPANY_SCOPE_MISMATCH', `${path}.companyId`));
    }
    if (line.journalId !== journal.id) {
      issues.push(issue('JOURNAL_LINEAGE_MISMATCH', `${path}.journalId`));
    }
    if (!isValidKrwAmount(line.debitKrw) || !isValidKrwAmount(line.creditKrw)) {
      issues.push(issue('INVALID_KRW_AMOUNT', path));
      return;
    }

    const hasDebit = line.debitKrw > 0;
    const hasCredit = line.creditKrw > 0;
    if (hasDebit === hasCredit) {
      issues.push(issue('INVALID_DEBIT_CREDIT_SIDE', path));
    }

    const nextDebit = addKrw(debitTotalKrw, line.debitKrw);
    const nextCredit = addKrw(creditTotalKrw, line.creditKrw);
    if (nextDebit === null || nextCredit === null) {
      issues.push(issue('INVALID_KRW_AMOUNT', path, 'KRW_TOTAL_EXCEEDS_SAFE_INTEGER'));
      return;
    }
    debitTotalKrw = nextDebit;
    creditTotalKrw = nextCredit;
  });

  if (!isValidKrwAmount(journal.totalDebitKrw) || !isValidKrwAmount(journal.totalCreditKrw)) {
    issues.push(issue('INVALID_KRW_AMOUNT', 'headerTotals'));
  } else if (
    journal.totalDebitKrw !== debitTotalKrw
    || journal.totalCreditKrw !== creditTotalKrw
  ) {
    issues.push(issue('HEADER_TOTAL_MISMATCH', 'headerTotals'));
  }

  if (debitTotalKrw !== creditTotalKrw) {
    issues.push(issue('UNBALANCED_JOURNAL', 'lines'));
  }

  return Object.freeze({
    valid: issues.length === 0,
    debitTotalKrw,
    creditTotalKrw,
    issues: Object.freeze(issues),
  });
}

export const isDuplicatePostingRequest = (
  candidate: Pick<PostingRequest, 'id' | 'companyId' | 'idempotencyKey'>,
  existing: readonly Pick<PostingRequest, 'id' | 'companyId' | 'idempotencyKey'>[],
) => existing.some((request) => (
  request.id !== candidate.id
  && request.companyId === candidate.companyId
  && request.idempotencyKey.trim() === candidate.idempotencyKey.trim()
));

export function evaluatePostingRequest(
  request: PostingRequest,
  journal: JournalHeader,
  period: AccountingPeriod,
  existingRequests: readonly PostingRequest[] = [],
): PostingEvaluationResult {
  const issues = [...validateJournal(journal).issues];

  if (
    request.companyId !== journal.companyId
    || request.companyId !== period.companyId
    || request.source.companyId !== request.companyId
    || journal.source.companyId !== request.companyId
  ) {
    issues.push(issue('COMPANY_SCOPE_MISMATCH', 'postingRequest.companyId'));
  }
  if (
    request.journalId !== journal.id
    || request.accountingPeriodId !== journal.accountingPeriodId
    || request.accountingPeriodId !== period.id
    || request.source.documentId !== journal.source.documentId
    || request.source.documentRevision !== journal.source.documentRevision
  ) {
    issues.push(issue('JOURNAL_LINEAGE_MISMATCH', 'postingRequest'));
  }
  if (request.approvalState !== 'APPROVED' || journal.approvalState !== 'APPROVED') {
    issues.push(issue('APPROVAL_REQUIRED', 'approvalState'));
  }
  if (request.postingState !== 'READY_TO_POST' || journal.postingState !== 'READY_TO_POST') {
    issues.push(issue('POSTING_STATE_NOT_READY', 'postingState'));
  }
  if (period.state !== 'OPEN') {
    issues.push(issue('ACCOUNTING_PERIOD_NOT_OPEN', 'accountingPeriod.state'));
  }
  if (journal.postingDate < period.startsOn || journal.postingDate > period.endsOn) {
    issues.push(issue('POSTING_DATE_OUTSIDE_PERIOD', 'postingDate'));
  }
  if (!request.idempotencyKey.trim() || request.idempotencyKey !== journal.idempotencyKey) {
    issues.push(issue('IDEMPOTENCY_KEY_REQUIRED', 'postingRequest.idempotencyKey'));
  }
  if (isDuplicatePostingRequest(request, existingRequests)) {
    issues.push(issue('IDEMPOTENCY_DUPLICATE', 'postingRequest.idempotencyKey'));
  }

  return Object.freeze({ allowed: issues.length === 0, issues: Object.freeze(issues) });
}

export function assertPostingAllowed(
  request: PostingRequest,
  journal: JournalHeader,
  period: AccountingPeriod,
  existingRequests: readonly PostingRequest[] = [],
) {
  const result = evaluatePostingRequest(request, journal, period, existingRequests);
  if (!result.allowed) {
    const first = result.issues[0];
    throw new AccountingDomainError(first.code, first.message);
  }
}

export const assertJournalEditable = (journal: JournalHeader) => {
  if (journal.postingState === 'POSTED' || journal.postingState === 'REVERSED') {
    throw new AccountingDomainError('POSTED_JOURNAL_IMMUTABLE');
  }
};

export const freezeJournal = (journal: JournalHeader): Readonly<JournalHeader> => Object.freeze({
  ...journal,
  source: Object.freeze({ ...journal.source }),
  dimensions: Object.freeze({ ...journal.dimensions }),
  lines: Object.freeze(journal.lines.map((line) => Object.freeze({
    ...line,
    dimensions: Object.freeze({ ...line.dimensions }),
  }))),
});

export type JournalLineDraft = Omit<JournalLine, 'journalId' | 'companyId'>;

export interface ReplacementJournalInput {
  readonly id: string;
  readonly journalNo: string;
  readonly accountingPeriodId: string;
  readonly postingDate: string;
  readonly idempotencyKey: string;
  readonly lines: readonly JournalLineDraft[];
  readonly reasonCode: string;
  readonly createdBy: string;
  readonly createdAt: string;
}

const totalLines = (lines: readonly Pick<JournalLine, 'debitKrw' | 'creditKrw'>[]) => lines.reduce(
  (totals, line) => ({
    debitKrw: totals.debitKrw + line.debitKrw,
    creditKrw: totals.creditKrw + line.creditKrw,
  }),
  { debitKrw: 0, creditKrw: 0 },
);

function replacementJournal(
  original: JournalHeader,
  input: Omit<ReplacementJournalInput, 'lines'>,
  lines: readonly JournalLine[],
  kind: 'REVERSAL' | 'CORRECTION',
): Readonly<JournalHeader> {
  const totals = totalLines(lines);
  return freezeJournal({
    id: input.id,
    companyId: original.companyId,
    journalNo: input.journalNo,
    accountingPeriodId: input.accountingPeriodId,
    postingDate: input.postingDate,
    currency: 'KRW',
    approvalState: 'DRAFT',
    postingState: 'NOT_POSTED',
    idempotencyKey: input.idempotencyKey,
    source: {
      companyId: original.companyId,
      documentType: `JOURNAL_${kind}`,
      documentId: original.id,
      documentRevision: original.revision,
      eventId: `${kind.toLowerCase()}-${original.id}-${input.id}`,
    },
    dimensions: original.dimensions,
    totalDebitKrw: totals.debitKrw,
    totalCreditKrw: totals.creditKrw,
    lines,
    revision: 1,
    reversalOfJournalId: kind === 'REVERSAL' ? original.id : null,
    correctionOfJournalId: kind === 'CORRECTION' ? original.id : null,
    reasonCode: input.reasonCode,
    createdBy: input.createdBy,
    createdAt: input.createdAt,
  });
}

export function createReversalJournal(
  original: JournalHeader,
  input: Omit<ReplacementJournalInput, 'lines'>,
): Readonly<JournalHeader> {
  if (original.postingState !== 'POSTED') {
    throw new AccountingDomainError('SOURCE_JOURNAL_NOT_POSTED');
  }
  const lines = original.lines.map<JournalLine>((line) => ({
    ...line,
    id: `${input.id}-line-${line.lineNo}`,
    journalId: input.id,
    debitKrw: line.creditKrw,
    creditKrw: line.debitKrw,
    description: '원전표 역분개',
    sourceReferenceId: line.id,
  }));
  return replacementJournal(original, input, lines, 'REVERSAL');
}

export function createCorrectionJournal(
  original: JournalHeader,
  input: ReplacementJournalInput,
): Readonly<JournalHeader> {
  if (original.postingState !== 'POSTED') {
    throw new AccountingDomainError('SOURCE_JOURNAL_NOT_POSTED');
  }
  const lines = input.lines.map<JournalLine>((line) => ({
    ...line,
    journalId: input.id,
    companyId: original.companyId,
  }));
  const correction = replacementJournal(original, input, lines, 'CORRECTION');
  const validation = validateJournal(correction);
  if (!validation.valid) {
    const first = validation.issues[0];
    throw new AccountingDomainError(first.code, first.message);
  }
  return correction;
}

export const summarizeJournalForAudit = (journal: JournalHeader): AuditSafeJournalSummary => Object.freeze({
  journalId: journal.id,
  companyId: journal.companyId,
  journalNo: journal.journalNo,
  approvalState: journal.approvalState,
  postingState: journal.postingState,
  sourceDocumentType: journal.source.documentType,
  sourceDocumentId: journal.source.documentId,
  sourceDocumentRevision: journal.source.documentRevision,
  lineCount: journal.lines.length,
  accountCodes: Object.freeze([...new Set(journal.lines.map((line) => line.accountCode))]),
  totalDebitKrw: journal.totalDebitKrw,
  totalCreditKrw: journal.totalCreditKrw,
  revision: journal.revision,
  reversalOfJournalId: journal.reversalOfJournalId,
  correctionOfJournalId: journal.correctionOfJournalId,
});

const demoDimensions = Object.freeze<AccountingDimensions>({
  projectId: 'demo-project-concost-001',
  projectNo: '2026001',
  costCenterId: 'demo-cost-center-management-support',
  organizationId: 'demo-organization-management-support',
});

const demoAccount = (
  code: string,
  name: string,
  accountType: AccountType,
  normalBalance: NormalBalance,
  kind: AccountKind,
  parentCode: string | null,
  taxTarget = false,
): AccountCode => Object.freeze({
  id: `demo-coa-concost-v1-${code}`,
  companyId: 'CON_COST',
  chartOfAccountsId: 'demo-coa-concost-v1',
  chartVersion: 1,
  code,
  name,
  parentCode,
  accountType,
  normalBalance,
  kind,
  taxTarget,
  active: true,
});

export const syntheticKoreanDemoChartOfAccounts: ChartOfAccounts = Object.freeze({
  id: 'demo-coa-concost-v1',
  companyId: 'CON_COST',
  version: 1,
  name: '합성 데모 계정과목 v1',
  state: 'ACTIVE',
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  accounts: Object.freeze([
    demoAccount('1000', '자산', 'ASSET', 'DEBIT', 'GROUP', null),
    demoAccount('1110', '보통예금', 'ASSET', 'DEBIT', 'POSTING', '1000'),
    demoAccount('1210', '외상매출금', 'ASSET', 'DEBIT', 'POSTING', '1000'),
    demoAccount('1350', '부가세대급금', 'ASSET', 'DEBIT', 'POSTING', '1000', true),
    demoAccount('2000', '부채', 'LIABILITY', 'CREDIT', 'GROUP', null),
    demoAccount('2110', '외상매입금', 'LIABILITY', 'CREDIT', 'POSTING', '2000'),
    demoAccount('2250', '부가세예수금', 'LIABILITY', 'CREDIT', 'POSTING', '2000', true),
    demoAccount('4000', '수익', 'REVENUE', 'CREDIT', 'GROUP', null),
    demoAccount('4110', '용역매출', 'REVENUE', 'CREDIT', 'POSTING', '4000'),
    demoAccount('5000', '비용', 'EXPENSE', 'DEBIT', 'GROUP', null),
    demoAccount('5110', '외주용역비', 'EXPENSE', 'DEBIT', 'POSTING', '5000'),
  ]),
});

const demoJournal = (
  id: string,
  journalNo: string,
  sourceType: string,
  sourceId: string,
  lines: readonly Omit<JournalLine, 'journalId' | 'companyId'>[],
): Readonly<JournalHeader> => {
  const scopedLines = lines.map<JournalLine>((line) => ({ ...line, journalId: id, companyId: 'CON_COST' }));
  const totals = totalLines(scopedLines);
  return freezeJournal({
    id,
    companyId: 'CON_COST',
    journalNo,
    accountingPeriodId: 'demo-period-concost-2026-08',
    postingDate: '2026-08-10',
    currency: 'KRW',
    approvalState: 'APPROVED',
    postingState: 'POSTED',
    idempotencyKey: `demo-posting:${sourceType}:${sourceId}:v1`,
    source: { companyId: 'CON_COST', documentType: sourceType, documentId: sourceId, documentRevision: 1, eventId: `demo-event-${sourceId}` },
    dimensions: demoDimensions,
    totalDebitKrw: totals.debitKrw,
    totalCreditKrw: totals.creditKrw,
    lines: scopedLines,
    revision: 1,
    reversalOfJournalId: null,
    correctionOfJournalId: null,
    reasonCode: null,
    createdBy: 'demo-finance-admin-001',
    createdAt: '2026-08-10T09:00:00.000Z',
  });
};

const demoLine = (
  id: string,
  lineNo: number,
  accountCode: string,
  debitKrw: number,
  creditKrw: number,
  description: string,
): Omit<JournalLine, 'journalId' | 'companyId'> => ({
  id,
  lineNo,
  chartOfAccountsId: syntheticKoreanDemoChartOfAccounts.id,
  chartVersion: syntheticKoreanDemoChartOfAccounts.version,
  accountCode,
  debitKrw,
  creditKrw,
  dimensions: demoDimensions,
  description,
  sourceReferenceId: null,
});

export const syntheticKoreanDemoAccountingPeriod: AccountingPeriod = Object.freeze({
  id: 'demo-period-concost-2026-08',
  companyId: 'CON_COST',
  fiscalYear: 2026,
  periodNo: 8,
  startsOn: '2026-08-01',
  endsOn: '2026-08-31',
  state: 'OPEN',
  revision: 1,
});

export const syntheticKoreanDemoJournals: readonly Readonly<JournalHeader>[] = Object.freeze([
  demoJournal('demo-journal-sales-001', 'DEMO-JN-202608-001', 'SALES_INVOICE', 'demo-sales-invoice-001', [
    demoLine('demo-journal-sales-001-line-1', 1, '1210', 1_100_000, 0, '합성 데모 매출채권'),
    demoLine('demo-journal-sales-001-line-2', 2, '4110', 0, 1_000_000, '합성 데모 용역매출'),
    demoLine('demo-journal-sales-001-line-3', 3, '2250', 0, 100_000, '합성 데모 부가세예수금'),
  ]),
  demoJournal('demo-journal-purchase-001', 'DEMO-JN-202608-002', 'PURCHASE_INVOICE', 'demo-purchase-invoice-001', [
    demoLine('demo-journal-purchase-001-line-1', 1, '5110', 500_000, 0, '합성 데모 외주용역비'),
    demoLine('demo-journal-purchase-001-line-2', 2, '1350', 50_000, 0, '합성 데모 부가세대급금'),
    demoLine('demo-journal-purchase-001-line-3', 3, '2110', 0, 550_000, '합성 데모 외상매입금'),
  ]),
]);
