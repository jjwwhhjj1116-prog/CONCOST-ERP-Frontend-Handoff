import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertFinanceTransition,
  assertSalesTransition,
  calculateFinanceAmounts,
  companyContacts,
  companyFinance,
  companySales,
  financeBalance,
  findContactDuplicates,
  initialFinanceEntries,
  initialSalesContacts,
  initialSalesOpportunities,
  isFinanceOverdue,
  summarizeFinance,
  summarizeSales,
} from '@/lib/businessOperations';
import { useBusinessOperationsStore } from '@/store/businessOperationsStore';

test('sales and finance records are isolated by selected company', () => {
  const concostSales = companySales(initialSalesOpportunities, 'CON_COST');
  const vietqsSales = companySales(initialSalesOpportunities, 'VIET_QS');
  const concostFinance = companyFinance(initialFinanceEntries, 'CON_COST');
  const vietqsFinance = companyFinance(initialFinanceEntries, 'VIET_QS');

  assert.equal(concostSales.length, 1);
  assert.equal(vietqsSales.length, 1);
  assert.ok(concostSales.every((entry) => entry.companyId === 'CON_COST'));
  assert.ok(vietqsSales.every((entry) => entry.companyId === 'VIET_QS'));
  assert.ok(concostFinance.every((entry) => entry.companyId === 'CON_COST'));
  assert.ok(vietqsFinance.every((entry) => entry.companyId === 'VIET_QS'));
  assert.notEqual(concostSales[0].id, vietqsSales[0].id);
});

test('contact duplicate review never crosses company scope', () => {
  const concostContact = companyContacts(initialSalesContacts, 'CON_COST')[0];
  const sameCompany = findContactDuplicates(initialSalesContacts, {
    companyId: 'CON_COST',
    email: concostContact.email.toUpperCase(),
    phone: '',
  });
  const otherCompany = findContactDuplicates(initialSalesContacts, {
    companyId: 'VIET_QS',
    email: concostContact.email,
    phone: concostContact.phone,
  });

  assert.deepEqual(sameCompany.map((entry) => entry.id), [concostContact.id]);
  assert.equal(otherCompany.length, 0);
});

test('sales and finance state transitions reject shortcuts', () => {
  assert.doesNotThrow(() => assertSalesTransition('LEAD', 'QUALIFIED'));
  assert.throws(() => assertSalesTransition('LEAD', 'WON'), /INVALID_SALES_TRANSITION/);
  assert.doesNotThrow(() => assertFinanceTransition('DRAFT', 'REVIEW_PENDING'));
  assert.throws(() => assertFinanceTransition('DRAFT', 'RECONCILED'), /INVALID_FINANCE_TRANSITION/);
});

test('finance calculations expose partial balance and overdue state', () => {
  const amount = calculateFinanceAmounts(1_000_000);
  assert.deepEqual(amount, { supplyAmount: 1_000_000, vatAmount: 100_000, totalAmount: 1_100_000 });

  const entry = { ...initialFinanceEntries[0], ...amount, paidAmount: 400_000, dueDate: '2026-01-01' };
  assert.equal(financeBalance(entry), 700_000);
  assert.equal(isFinanceOverdue(entry, '2026-08-07'), true);

  const summary = summarizeFinance([entry], '2026-08-07');
  assert.equal(summary.receivable, 700_000);
  assert.equal(summary.overdue, 1);
});

test('operational store records before and after audit for partial receipts', () => {
  const originalFinance = useBusinessOperationsStore.getState().finance;
  const target = { ...initialFinanceEntries[0], status: 'APPROVED' as const, paidAmount: 0, audit: [] };
  useBusinessOperationsStore.setState({ finance: [target] });

  useBusinessOperationsStore.getState().recordFinancePayment(target.id, 5_000_000, 'demo-auditor');
  const updated = useBusinessOperationsStore.getState().finance[0];

  assert.equal(updated.paidAmount, 5_000_000);
  assert.equal(updated.revision, target.revision + 1);
  assert.equal(updated.audit[0].action, 'FINANCE_PAYMENT_RECORDED');
  assert.match(updated.audit[0].before, /paidAmount/);
  assert.match(updated.audit[0].after, /5000000/);

  useBusinessOperationsStore.setState({ finance: originalFinance });
});

test('summaries use active opportunity values only', () => {
  const summary = summarizeSales([
    initialSalesOpportunities[0],
    { ...initialSalesOpportunities[0], id: 'won', stage: 'WON', expectedValue: 10_000_000 },
  ]);
  assert.equal(summary.activeCount, 1);
  assert.equal(summary.pipelineValue, initialSalesOpportunities[0].expectedValue);
  assert.equal(summary.wonCount, 1);
});
