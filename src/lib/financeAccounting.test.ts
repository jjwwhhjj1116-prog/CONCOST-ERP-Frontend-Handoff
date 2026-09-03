import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AccountingDomainError,
  assertJournalEditable,
  assertPostingAllowed,
  createCorrectionJournal,
  createReversalJournal,
  evaluatePostingRequest,
  isDuplicatePostingRequest,
  summarizeJournalForAudit,
  syntheticKoreanDemoAccountingPeriod,
  syntheticKoreanDemoChartOfAccounts,
  syntheticKoreanDemoJournals,
  validateJournal,
  type AccountingPeriod,
  type JournalHeader,
  type PostingRequest,
} from '@/lib/financeAccounting';

const posted = syntheticKoreanDemoJournals[0];

const readyJournal = (overrides: Partial<JournalHeader> = {}): JournalHeader => ({
  ...posted,
  id: 'journal-ready-001',
  journalNo: 'DEMO-JN-READY-001',
  postingState: 'READY_TO_POST',
  idempotencyKey: 'posting:sales-invoice:ready-001:v1',
  lines: posted.lines.map((line) => ({ ...line, journalId: 'journal-ready-001' })),
  ...overrides,
});

const postingRequest = (overrides: Partial<PostingRequest> = {}): PostingRequest => ({
  id: 'posting-request-001',
  companyId: 'CON_COST',
  journalId: 'journal-ready-001',
  accountingPeriodId: syntheticKoreanDemoAccountingPeriod.id,
  source: posted.source,
  approvalState: 'APPROVED',
  postingState: 'READY_TO_POST',
  idempotencyKey: 'posting:sales-invoice:ready-001:v1',
  requestedBy: 'demo-finance-admin-001',
  requestedAt: '2026-08-10T10:00:00.000Z',
  correlationId: 'corr-posting-ready-001',
  ...overrides,
});

test('synthetic Korean demo CoA is company scoped, versioned, and journals balance in integer KRW', () => {
  assert.equal(syntheticKoreanDemoChartOfAccounts.companyId, 'CON_COST');
  assert.equal(syntheticKoreanDemoChartOfAccounts.version, 1);
  assert.ok(syntheticKoreanDemoChartOfAccounts.accounts.every((account) => (
    account.companyId === 'CON_COST'
    && account.chartVersion === syntheticKoreanDemoChartOfAccounts.version
  )));
  assert.ok(syntheticKoreanDemoJournals.every((journal) => validateJournal(journal).valid));
  assert.ok(syntheticKoreanDemoJournals.flatMap((journal) => journal.lines).every((line) => (
    Number.isSafeInteger(line.debitKrw) && Number.isSafeInteger(line.creditKrw)
  )));
});

test('balanced journal passes and unbalanced journal is rejected', () => {
  const balanced = validateJournal(posted);
  const unbalanced = validateJournal({
    ...posted,
    totalCreditKrw: posted.totalCreditKrw - 1,
    lines: posted.lines.map((line, index) => index === 1 ? { ...line, creditKrw: line.creditKrw - 1 } : line),
  });

  assert.equal(balanced.valid, true);
  assert.equal(balanced.debitTotalKrw, balanced.creditTotalKrw);
  assert.equal(unbalanced.valid, false);
  assert.ok(unbalanced.issues.some((item) => item.code === 'UNBALANCED_JOURNAL'));
});

test('journal line requires exactly one positive integer KRW side', () => {
  const bothSides = validateJournal({
    ...posted,
    lines: posted.lines.map((line, index) => index === 0 ? { ...line, debitKrw: 1_100_000, creditKrw: 1 } : line),
    totalCreditKrw: posted.totalCreditKrw + 1,
  });
  const fractional = validateJournal({
    ...posted,
    lines: posted.lines.map((line, index) => index === 0 ? { ...line, debitKrw: 1_100_000.5 } : line),
    totalDebitKrw: 1_100_000.5,
  });

  assert.ok(bothSides.issues.some((item) => item.code === 'INVALID_DEBIT_CREDIT_SIDE'));
  assert.ok(fractional.issues.some((item) => item.code === 'INVALID_KRW_AMOUNT'));
});

test('journal and posting validation reject cross-company data', () => {
  const mismatched = readyJournal({
    lines: readyJournal().lines.map((line, index) => index === 0 ? { ...line, companyId: 'VIET_QS' } : line),
  });
  const request = postingRequest();
  const result = evaluatePostingRequest(request, mismatched, syntheticKoreanDemoAccountingPeriod);

  assert.equal(result.allowed, false);
  assert.ok(result.issues.some((item) => item.code === 'COMPANY_SCOPE_MISMATCH'));
});

test('posting is blocked until approval, ready state, and open period all pass', () => {
  const journal = readyJournal({ approvalState: 'PENDING', postingState: 'NOT_POSTED' });
  const closedPeriod: AccountingPeriod = { ...syntheticKoreanDemoAccountingPeriod, state: 'CLOSED' };
  const result = evaluatePostingRequest(
    postingRequest({ approvalState: 'PENDING', postingState: 'NOT_POSTED' }),
    journal,
    closedPeriod,
  );

  assert.equal(result.allowed, false);
  assert.ok(result.issues.some((item) => item.code === 'APPROVAL_REQUIRED'));
  assert.ok(result.issues.some((item) => item.code === 'POSTING_STATE_NOT_READY'));
  assert.ok(result.issues.some((item) => item.code === 'ACCOUNTING_PERIOD_NOT_OPEN'));
  assert.equal(new Set(result.issues.map(({ code, path }) => `${code}:${path}`)).size, result.issues.length);
  assert.throws(
    () => assertPostingAllowed(postingRequest({ approvalState: 'PENDING' }), readyJournal(), syntheticKoreanDemoAccountingPeriod),
    (error) => error instanceof AccountingDomainError && error.code === 'APPROVAL_REQUIRED',
  );
});

test('valid posting request passes every frontend-safe precondition', () => {
  assert.doesNotThrow(() => assertPostingAllowed(
    postingRequest(),
    readyJournal(),
    syntheticKoreanDemoAccountingPeriod,
  ));
});

test('posted journal stays immutable and reversal swaps debit and credit into a new draft', () => {
  assert.throws(
    () => assertJournalEditable(posted),
    (error) => error instanceof AccountingDomainError && error.code === 'POSTED_JOURNAL_IMMUTABLE',
  );
  const reversal = createReversalJournal(posted, {
    id: 'demo-journal-reversal-001',
    journalNo: 'DEMO-JN-REVERSAL-001',
    accountingPeriodId: syntheticKoreanDemoAccountingPeriod.id,
    postingDate: '2026-08-11',
    idempotencyKey: 'reversal:demo-journal-sales-001:v1',
    reasonCode: 'DEMO_CORRECTION_REQUIRED',
    createdBy: 'demo-finance-admin-001',
    createdAt: '2026-08-11T09:00:00.000Z',
  });

  assert.equal(reversal.reversalOfJournalId, posted.id);
  assert.equal(reversal.correctionOfJournalId, null);
  assert.deepEqual(reversal.source, {
    companyId: posted.companyId,
    documentType: 'JOURNAL_REVERSAL',
    documentId: posted.id,
    documentRevision: posted.revision,
    eventId: `reversal-${posted.id}-${reversal.id}`,
  });
  assert.equal(reversal.reasonCode, 'DEMO_CORRECTION_REQUIRED');
  assert.equal(reversal.approvalState, 'DRAFT');
  assert.equal(reversal.postingState, 'NOT_POSTED');
  assert.equal(reversal.lines[0].debitKrw, posted.lines[0].creditKrw);
  assert.equal(reversal.lines[0].creditKrw, posted.lines[0].debitKrw);
  assert.equal(validateJournal(reversal).valid, true);
  assert.equal(Object.isFrozen(reversal), true);
  assert.equal(Object.isFrozen(reversal.lines[0]), true);
  assert.ok([reversal.source, reversal.dimensions, reversal.lines, reversal.lines[0].dimensions].every(Object.isFrozen));
  assert.notEqual(reversal.source, posted.source);
  assert.notEqual(reversal.dimensions, posted.dimensions);
  assert.notEqual(reversal.lines[0].dimensions, posted.lines[0].dimensions);
  assert.equal(posted.postingState, 'POSTED');
});

test('correction creates a balanced draft without changing the posted source', () => {
  const correction = createCorrectionJournal(posted, {
    id: 'demo-journal-correction-001',
    journalNo: 'DEMO-JN-CORRECTION-001',
    accountingPeriodId: syntheticKoreanDemoAccountingPeriod.id,
    postingDate: '2026-08-11',
    idempotencyKey: 'correction:demo-journal-sales-001:v1',
    reasonCode: 'DEMO_AMOUNT_CORRECTION',
    createdBy: 'demo-finance-admin-001',
    createdAt: '2026-08-11T09:10:00.000Z',
    lines: [
      { ...posted.lines[0], id: 'correction-line-1', debitKrw: 2_200_000, creditKrw: 0 },
      { ...posted.lines[1], id: 'correction-line-2', debitKrw: 0, creditKrw: 2_000_000 },
      { ...posted.lines[2], id: 'correction-line-3', debitKrw: 0, creditKrw: 200_000 },
    ],
  });

  assert.equal(correction.correctionOfJournalId, posted.id);
  assert.equal(correction.reversalOfJournalId, null);
  assert.deepEqual(correction.source, {
    companyId: posted.companyId,
    documentType: 'JOURNAL_CORRECTION',
    documentId: posted.id,
    documentRevision: posted.revision,
    eventId: `correction-${posted.id}-${correction.id}`,
  });
  assert.equal(correction.reasonCode, 'DEMO_AMOUNT_CORRECTION');
  assert.equal(correction.postingState, 'NOT_POSTED');
  assert.equal(validateJournal(correction).valid, true);
  assert.equal(posted.totalDebitKrw, 1_100_000);
});

test('replacement journals retain posted-source and balanced-correction guards', () => {
  const input = {
    id: 'demo-replacement-001', journalNo: 'DEMO-JN-REPLACEMENT-001',
    accountingPeriodId: posted.accountingPeriodId, postingDate: '2026-08-11',
    idempotencyKey: 'demo-replacement-001', reasonCode: 'DEMO_CORRECTION',
    createdBy: posted.createdBy, createdAt: posted.createdAt, lines: posted.lines,
  };
  for (const create of [createReversalJournal, createCorrectionJournal]) {
    assert.throws(() => create(readyJournal(), input), {
      name: 'AccountingDomainError', code: 'SOURCE_JOURNAL_NOT_POSTED',
    });
  }
  assert.throws(() => createCorrectionJournal(posted, { ...input, lines: [posted.lines[0]] }), {
    name: 'AccountingDomainError', code: 'UNBALANCED_JOURNAL',
  });
});

test('idempotency duplicate detection is company scoped and ignores the same request identity', () => {
  const candidate = postingRequest();
  assert.equal(isDuplicatePostingRequest(candidate, [{ ...candidate, id: 'existing-request' }]), true);
  assert.equal(isDuplicatePostingRequest(candidate, [{ ...candidate, id: 'existing-request', companyId: 'VIET_QS' }]), false);
  assert.equal(isDuplicatePostingRequest(candidate, [candidate]), false);

  const result = evaluatePostingRequest(
    candidate,
    readyJournal(),
    syntheticKoreanDemoAccountingPeriod,
    [{ ...candidate, id: 'existing-request' }],
  );
  assert.ok(result.issues.some((item) => item.code === 'IDEMPOTENCY_DUPLICATE'));
});

test('audit summary excludes journal descriptions and source bodies', () => {
  const summary = summarizeJournalForAudit(posted);
  const serialized = JSON.stringify(summary);

  assert.equal(summary.sourceDocumentId, posted.source.documentId);
  assert.equal(summary.lineCount, posted.lines.length);
  assert.equal(serialized.includes(posted.lines[0].description), false);
  assert.equal('lines' in summary, false);
  assert.equal('description' in summary, false);
});
