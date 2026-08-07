import ExcelJS from 'exceljs';

import type { FinanceEntry, SalesContact, SalesCustomer } from '@/lib/businessOperations';

export type ContactImportRow = {
  customerName: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
};

export type FinanceImportRow = {
  entryType: FinanceEntry['entryType'];
  title: string;
  counterparty: string;
  projectNo: string;
  documentDate: string;
  supplyAmount: number;
  vatAmount: number;
  dueDate: string;
};

export type ImportPreview<T> = { rows: T[]; errors: string[] };

const contactHeaders = ['Customer', 'Name', 'Department', 'Position', 'Email', 'Phone'] as const;
const financeHeaders = ['Type', 'Title', 'Counterparty', 'ProjectNo', 'DocumentDate', 'SupplyAmount', 'VatAmount', 'DueDate'] as const;

const formula = (value: ExcelJS.CellValue) => Boolean(value && typeof value === 'object' && 'formula' in value);
const text = (value: ExcelJS.CellValue) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text ?? '').trim();
    if ('result' in value) return String(value.result ?? '').trim();
  }
  return String(value).trim();
};

const csvEscape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const download = (content: BlobPart, type: string, fileName: string) => {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export async function buildContactWorkbook(contacts: SalesContact[], customers: SalesCustomer[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Contacts');
  sheet.addRow(contactHeaders);
  contacts.forEach((contact) => {
    const customer = customers.find((item) => item.id === contact.customerId);
    sheet.addRow([customer?.name ?? '', contact.name, contact.department, contact.position, contact.email, contact.phone]);
  });
  sheet.columns.forEach((column) => { column.width = 22; });
  sheet.getRow(1).font = { bold: true };
  return workbook;
}

export async function exportContactWorkbook(contacts: SalesContact[], customers: SalesCustomer[], format: 'XLSX' | 'CSV') {
  if (format === 'CSV') {
    const lines = [contactHeaders.join(','), ...contacts.map((contact) => {
      const customer = customers.find((item) => item.id === contact.customerId);
      return [customer?.name ?? '', contact.name, contact.department, contact.position, contact.email, contact.phone].map(csvEscape).join(',');
    })];
    download(`\uFEFF${lines.join('\r\n')}`, 'text/csv;charset=utf-8', 'sales-contacts.csv');
    return;
  }
  const workbook = await buildContactWorkbook(contacts, customers);
  const buffer = await workbook.xlsx.writeBuffer();
  download(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'sales-contacts.xlsx');
}

export async function buildFinanceWorkbook(entries: FinanceEntry[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Finance');
  sheet.addRow(financeHeaders);
  entries.forEach((entry) => sheet.addRow([entry.entryType, entry.title, entry.counterparty, entry.projectNo, entry.documentDate, entry.supplyAmount, entry.vatAmount, entry.dueDate]));
  sheet.columns.forEach((column) => { column.width = 20; });
  sheet.getRow(1).font = { bold: true };
  return workbook;
}

export async function exportFinanceWorkbook(entries: FinanceEntry[], format: 'XLSX' | 'CSV') {
  if (format === 'CSV') {
    const lines = [financeHeaders.join(','), ...entries.map((entry) => [entry.entryType, entry.title, entry.counterparty, entry.projectNo, entry.documentDate, entry.supplyAmount, entry.vatAmount, entry.dueDate].map(csvEscape).join(','))];
    download(`\uFEFF${lines.join('\r\n')}`, 'text/csv;charset=utf-8', 'finance-ledger.csv');
    return;
  }
  const workbook = await buildFinanceWorkbook(entries);
  const buffer = await workbook.xlsx.writeBuffer();
  download(buffer, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'finance-ledger.xlsx');
}

const parseCsv = (source: string) => {
  const rows: string[][] = [];
  let current = ''; let quoted = false; let row: string[] = [];
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' && quoted && source[index + 1] === '"') { current += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(current.trim()); current = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(current.trim()); current = '';
      if (row.some(Boolean)) rows.push(row);
      row = [];
      continue;
    }
    current += char;
  }
  row.push(current.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
};

async function fileRows(file: File): Promise<{ rows: string[][]; formulaRows: number[] }> {
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension === 'xlsm' || extension === 'xls') throw new Error('MACRO_OR_LEGACY_WORKBOOK_BLOCKED');
  if (extension === 'csv') return { rows: parseCsv(await file.text()), formulaRows: [] };
  if (extension !== 'xlsx') throw new Error('UNSUPPORTED_WORKBOOK');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return { rows: [], formulaRows: [] };
  const rows: string[][] = []; const formulaRows = new Set<number>();
  sheet.eachRow((row, rowNumber) => {
    const values: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      if (formula(cell.value)) formulaRows.add(rowNumber);
      values[columnNumber - 1] = text(cell.value);
    });
    rows.push(values);
  });
  return { rows, formulaRows: [...formulaRows] };
}

const validateHeaders = (actual: string[], expected: readonly string[]) => expected.every((header, index) => actual[index]?.trim().toLowerCase() === header.toLowerCase());

export async function previewContactImport(file: File): Promise<ImportPreview<ContactImportRow>> {
  const { rows, formulaRows } = await fileRows(file);
  const errors = formulaRows.map((row) => `Row ${row}: formula cells are not allowed.`);
  if (!validateHeaders(rows[0] ?? [], contactHeaders)) errors.push('CONTACT_TEMPLATE_MISMATCH');
  const data = rows.slice(1).map((row, index) => ({ customerName: row[0] ?? '', name: row[1] ?? '', department: row[2] ?? '', position: row[3] ?? '', email: row[4] ?? '', phone: row[5] ?? '', rowNumber: index + 2 }));
  data.forEach((row) => { if (!row.customerName || !row.name) errors.push(`Row ${row.rowNumber}: Customer and Name are required.`); });
  return { rows: data.map((row) => ({ customerName: row.customerName, name: row.name, department: row.department, position: row.position, email: row.email, phone: row.phone })), errors };
}

export async function previewFinanceImport(file: File): Promise<ImportPreview<FinanceImportRow>> {
  const { rows, formulaRows } = await fileRows(file);
  const errors = formulaRows.map((row) => `Row ${row}: formula cells are not allowed.`);
  if (!validateHeaders(rows[0] ?? [], financeHeaders)) errors.push('FINANCE_TEMPLATE_MISMATCH');
  const validTypes: FinanceEntry['entryType'][] = ['RECEIVABLE', 'PAYABLE', 'EXPENSE', 'BUDGET'];
  const data = rows.slice(1).map((row, index) => ({ entryType: row[0] as FinanceEntry['entryType'], title: row[1] ?? '', counterparty: row[2] ?? '', projectNo: row[3] ?? '', documentDate: row[4] ?? '', supplyAmount: Number(row[5] ?? 0), vatAmount: Number(row[6] ?? 0), dueDate: row[7] ?? '', rowNumber: index + 2 }));
  data.forEach((row) => {
    if (!validTypes.includes(row.entryType)) errors.push(`Row ${row.rowNumber}: invalid Type.`);
    if (!row.title || !row.counterparty || !row.documentDate || !row.dueDate || !Number.isFinite(row.supplyAmount) || !Number.isFinite(row.vatAmount)) errors.push(`Row ${row.rowNumber}: required value is missing or invalid.`);
  });
  return { rows: data.map((row) => ({ entryType: row.entryType, title: row.title, counterparty: row.counterparty, projectNo: row.projectNo, documentDate: row.documentDate, supplyAmount: row.supplyAmount, vatAmount: row.vatAmount, dueDate: row.dueDate })), errors };
}
