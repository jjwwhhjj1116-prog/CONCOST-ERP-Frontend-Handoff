import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyLedgerSettlement,
  assertClosingTransition,
  assertFinanceCompanyScope,
  assertTaxInvoiceTransition,
  buildAgingSummary,
  buildFinanceHistoryUrl,
  budgetExecution,
  financeAgingBucket,
  financeErpDemoData,
  financeForecast,
  financeProjectProfitability,
  scopeFinanceErpData,
  summarizeCfoCockpit,
} from '@/lib/financeErp';

test('finance navigation preserves the deployed base path and canonical query state', () => {
  const href = buildFinanceHistoryUrl(
    '/workspace/finance/',
    'view=SALES_PURCHASES&projectId=old-project',
    { financeView: 'REVENUE', projectId: null },
  );

  assert.equal(href, '/workspace/finance/?financeView=REVENUE');
  assert.equal(href.includes('/workspace/workspace/'), false);
});

test('finance ERP data is isolated by selected company across every collection', () => {
  const concost = scopeFinanceErpData(financeErpDemoData, 'CON_COST');
  const vietqs = scopeFinanceErpData(financeErpDemoData, 'VIET_QS');

  const concostCollections: Array<ReadonlyArray<{ companyId: string }>> = [
    concost.ledger,
    concost.expenses,
    concost.taxInvoices,
    concost.budgets,
    concost.cashPlans,
    concost.closings,
    concost.controls,
  ];
  const vietqsCollections: Array<ReadonlyArray<{ companyId: string }>> = [
    vietqs.ledger,
    vietqs.expenses,
    vietqs.taxInvoices,
    vietqs.budgets,
    vietqs.cashPlans,
    vietqs.closings,
    vietqs.controls,
  ];

  for (const records of concostCollections) {
    assert.ok(records.every((record) => record.companyId === 'CON_COST'));
  }
  for (const records of vietqsCollections) {
    assert.ok(records.every((record) => record.companyId === 'VIET_QS'));
  }
  assert.ok(concost.ledger.length > 0);
  assert.ok(vietqs.ledger.length > 0);
  const vietqsIds = new Set(vietqs.ledger.map((record) => record.id));
  assert.equal(concost.ledger.filter((record) => vietqsIds.has(record.id)).length, 0);
});

test('aging classifies receivables into current and overdue buckets', () => {
  const source = financeErpDemoData.ledger.find((record) => record.kind === 'REVENUE');
  assert.ok(source);
  const records = [
    { ...source, id: 'current', dueDate: '2026-08-20', settledAmount: 0 },
    { ...source, id: 'days-30', dueDate: '2026-07-20', settledAmount: 0 },
    { ...source, id: 'days-60', dueDate: '2026-06-20', settledAmount: 0 },
    { ...source, id: 'days-90', dueDate: '2026-05-20', settledAmount: 0 },
    { ...source, id: 'days-90-plus', dueDate: '2026-04-20', settledAmount: 0 },
  ];

  assert.deepEqual(records.map((record) => financeAgingBucket(record)), [
    'CURRENT', 'DAYS_1_30', 'DAYS_31_60', 'DAYS_61_90', 'DAYS_90_PLUS',
  ]);
  const summary = buildAgingSummary(records, 'REVENUE');
  assert.ok(Object.values(summary).every((amount) => amount === source.totalAmount));
});

test('partial settlement updates balance, status, revision, and before-after audit', () => {
  const source = financeErpDemoData.ledger.find((record) => record.id === 'fin-ledger-kr-r2');
  assert.ok(source);
  const updated = applyLedgerSettlement(source, 10_000_000, 'demo-finance-admin', '2026-08-10T10:00:00.000Z');

  assert.equal(updated.settledAmount, 10_000_000);
  assert.equal(updated.status, 'PARTIAL');
  assert.equal(updated.revision, source.revision + 1);
  assert.equal(updated.audit[0].action, 'COLLECTION_RECORDED');
  assert.deepEqual(updated.audit[0].before, { settledAmount: 0, status: source.status });
  assert.deepEqual(updated.audit[0].after, { settledAmount: 10_000_000, status: 'PARTIAL' });
  assert.throws(() => applyLedgerSettlement(source, source.totalAmount + 1, 'actor', '2026-08-10T10:00:00.000Z'), /INVALID_SETTLEMENT_AMOUNT/);
});

test('tax invoice provider transitions cannot report false success', () => {
  assert.doesNotThrow(() => assertTaxInvoiceTransition('DRAFT', 'READY', false));
  assert.throws(() => assertTaxInvoiceTransition('READY', 'REQUESTED', false), /TAX_PROVIDER_NOT_CONFIGURED/);
  assert.doesNotThrow(() => assertTaxInvoiceTransition('READY', 'REQUESTED', true));
  assert.throws(() => assertTaxInvoiceTransition('DRAFT', 'ISSUED', true), /INVALID_TAX_INVOICE_TRANSITION/);
});

test('budget controls expose forecast breach without fabricating bank balances', () => {
  const blocked = financeErpDemoData.budgets.find((record) => record.controlLevel === 'BLOCK');
  assert.ok(blocked);
  const result = budgetExecution(blocked);
  assert.equal(result.breached, true);
  assert.ok(result.forecastRate > 100);
  assert.equal(result.balance, blocked.budgetAmount - blocked.actualAmount);
});

test('project profitability retains canonical project source drill-down IDs', () => {
  const concost = scopeFinanceErpData(financeErpDemoData, 'CON_COST');
  const projects = financeProjectProfitability(concost);
  const project = projects.find((record) => record.projectId === 'demo-project-concost-001');

  assert.ok(project);
  assert.equal(project.projectNo, '2026001');
  assert.ok(project.sourceIds.includes('fin-ledger-kr-r1'));
  assert.ok(project.sourceIds.includes('fin-ledger-kr-p1'));
  assert.ok(project.sourceIds.includes('fin-expense-kr-1'));
  assert.equal(project.managementProfit, project.revenuePlan - project.purchases - project.expenses);
});

test('monthly closing requires a complete checklist and a reason for reopening', () => {
  const period = financeErpDemoData.closings.find((record) => record.companyId === 'CON_COST');
  assert.ok(period);
  assert.throws(() => assertClosingTransition(period, 'CLOSED'), /INVALID_CLOSING_TRANSITION/);

  const review = { ...period, status: 'REVIEW' as const };
  assert.throws(() => assertClosingTransition(review, 'CLOSED'), /CLOSING_CHECKLIST_INCOMPLETE/);
  const completed = { ...review, checklist: review.checklist.map((item) => ({ ...item, completed: true })) };
  assert.doesNotThrow(() => assertClosingTransition(completed, 'CLOSED'));
  const closed = { ...completed, status: 'CLOSED' as const };
  assert.throws(() => assertClosingTransition(closed, 'REOPENED', ''), /REOPEN_REASON_REQUIRED/);
  assert.doesNotThrow(() => assertClosingTransition(closed, 'REOPENED', '추가 증빙 반영'));
});

test('CFO summary and 7/30/90 forecasts remain company scoped', () => {
  const concost = scopeFinanceErpData(financeErpDemoData, 'CON_COST');
  const summary = summarizeCfoCockpit(concost);
  const forecasts = [7, 30, 90].map((days) => financeForecast(concost, '2026-08-10', days));

  assert.ok(summary.revenue > 0);
  assert.ok(summary.receivable > 0);
  assert.ok(summary.projectProfit > 0);
  assert.deepEqual(forecasts.map((item) => item.days), [7, 30, 90]);
  assert.ok(forecasts[2].count >= forecasts[1].count);
});

test('company scope assertion rejects cross-company mutation attempts', () => {
  const record = financeErpDemoData.ledger.find((item) => item.companyId === 'CON_COST');
  assert.ok(record);
  assert.doesNotThrow(() => assertFinanceCompanyScope(record, 'CON_COST'));
  assert.throws(() => assertFinanceCompanyScope(record, 'VIET_QS'), /FINANCE_COMPANY_SCOPE_MISMATCH/);
});
