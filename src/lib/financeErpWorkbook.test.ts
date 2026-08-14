import assert from 'node:assert/strict';
import test from 'node:test';

import {
  financeErpDemoData,
  scopeFinanceErpData,
} from '@/lib/financeErp';
import {
  buildFinanceErpWorkbook,
  previewFinanceErpWorkbook,
} from '@/lib/financeErpWorkbook';

const toArrayBuffer = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = new Uint8Array(buffer);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

test('finance ERP workbook round-trips five operational modules', async () => {
  const scoped = scopeFinanceErpData(financeErpDemoData, 'CON_COST');
  const workbook = await buildFinanceErpWorkbook(scoped);
  const preview = await previewFinanceErpWorkbook(toArrayBuffer(await workbook.xlsx.writeBuffer()));

  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), [
    'Revenue', 'Purchase', 'Cashflow', 'Expense', 'Budget',
  ]);
  assert.deepEqual(preview.errors, []);
  assert.equal(preview.revenue.length, scoped.ledger.filter((record) => record.kind === 'REVENUE').length);
  assert.equal(preview.purchase.length, scoped.ledger.filter((record) => record.kind === 'PURCHASE').length);
  assert.equal(preview.cashflow.length, scoped.cashPlans.length);
  assert.equal(preview.expenses.length, scoped.expenses.length);
  assert.equal(preview.budgets.length, scoped.budgets.length);
  assert.equal(preview.revenue[0].projectId, scoped.ledger.find((record) => record.kind === 'REVENUE')?.projectId);
  assert.equal(preview.budgets[0].budgetAmount, scoped.budgets[0].budgetAmount);
});

test('finance ERP import rejects formulas instead of evaluating workbook payloads', async () => {
  const scoped = scopeFinanceErpData(financeErpDemoData, 'CON_COST');
  const workbook = await buildFinanceErpWorkbook(scoped);
  const revenue = workbook.getWorksheet('Revenue');
  assert.ok(revenue);
  revenue.getCell('F2').value = { formula: 'HYPERLINK("https://example.invalid")', result: 'blocked' };

  const preview = await previewFinanceErpWorkbook(toArrayBuffer(await workbook.xlsx.writeBuffer()));
  assert.ok(preview.errors.some((error) => error.includes('FORMULA_BLOCKED')));
});

test('finance ERP import reports template drift instead of silently accepting it', async () => {
  const scoped = scopeFinanceErpData(financeErpDemoData, 'CON_COST');
  const workbook = await buildFinanceErpWorkbook(scoped);
  const budget = workbook.getWorksheet('Budget');
  assert.ok(budget);
  budget.getCell('A1').value = 'UnexpectedScopeHeader';

  const preview = await previewFinanceErpWorkbook(toArrayBuffer(await workbook.xlsx.writeBuffer()));
  assert.ok(preview.errors.includes('TEMPLATE_MISMATCH:Budget'));
});

test('finance ERP import accepts project-number matching and marks blank VAT for auto calculation', async () => {
  const scoped = scopeFinanceErpData(financeErpDemoData, 'CON_COST');
  const workbook = await buildFinanceErpWorkbook(scoped);
  const revenue = workbook.getWorksheet('Revenue');
  assert.ok(revenue);
  revenue.getCell('B2').value = '';
  revenue.getCell('K2').value = '';

  const preview = await previewFinanceErpWorkbook(toArrayBuffer(await workbook.xlsx.writeBuffer()));
  assert.equal(preview.revenue.length, scoped.ledger.filter((record) => record.kind === 'REVENUE').length);
  assert.equal(preview.revenue[0].projectId, '');
  assert.equal(preview.revenue[0].vatProvided, false);
});

test('finance ERP import accepts a revenue-only workbook used by management support', async () => {
  const scoped = scopeFinanceErpData(financeErpDemoData, 'CON_COST');
  const workbook = await buildFinanceErpWorkbook(scoped);
  ['Purchase', 'Cashflow', 'Expense', 'Budget'].forEach((name) => {
    const sheet = workbook.getWorksheet(name);
    assert.ok(sheet);
    workbook.removeWorksheet(sheet.id);
  });

  const preview = await previewFinanceErpWorkbook(toArrayBuffer(await workbook.xlsx.writeBuffer()));
  assert.deepEqual(preview.errors, []);
  assert.ok(preview.revenue.length > 0);
  assert.deepEqual(preview.purchase, []);
  assert.deepEqual(preview.cashflow, []);
  assert.deepEqual(preview.expenses, []);
  assert.deepEqual(preview.budgets, []);
});
