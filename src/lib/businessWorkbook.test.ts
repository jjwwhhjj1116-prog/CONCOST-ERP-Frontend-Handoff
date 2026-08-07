import assert from 'node:assert/strict';
import test from 'node:test';

import ExcelJS from 'exceljs';

import {
  initialFinanceEntries,
  initialSalesContacts,
  initialSalesCustomers,
} from '@/lib/businessOperations';
import { buildContactWorkbook, buildFinanceWorkbook } from '@/lib/businessWorkbook';

test('contact workbook preserves the operational directory columns', async () => {
  const workbook = await buildContactWorkbook(initialSalesContacts, initialSalesCustomers);
  const buffer = await workbook.xlsx.writeBuffer();
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(buffer);
  const sheet = loaded.getWorksheet('Contacts');

  assert.ok(sheet);
  const headers = sheet.getRow(1).values;
  assert.ok(Array.isArray(headers));
  assert.deepEqual(headers.slice(1), [
    'Customer', 'Name', 'Department', 'Position', 'Email', 'Phone',
  ]);
  assert.equal(sheet.rowCount, initialSalesContacts.length + 1);
  assert.match(String(sheet.getRow(2).getCell(5).value), /example\.invalid$/);
});

test('finance workbook preserves project, supply, VAT, and due-date semantics', async () => {
  const workbook = await buildFinanceWorkbook(initialFinanceEntries);
  const buffer = await workbook.xlsx.writeBuffer();
  const loaded = new ExcelJS.Workbook();
  await loaded.xlsx.load(buffer);
  const sheet = loaded.getWorksheet('Finance');

  assert.ok(sheet);
  const headers = sheet.getRow(1).values;
  assert.ok(Array.isArray(headers));
  assert.deepEqual(headers.slice(1), [
    'Type', 'Title', 'Counterparty', 'ProjectNo', 'DocumentDate',
    'SupplyAmount', 'VatAmount', 'DueDate',
  ]);
  assert.equal(Number(sheet.getRow(2).getCell(6).value), initialFinanceEntries[0].supplyAmount);
  assert.equal(Number(sheet.getRow(2).getCell(7).value), initialFinanceEntries[0].vatAmount);
});
