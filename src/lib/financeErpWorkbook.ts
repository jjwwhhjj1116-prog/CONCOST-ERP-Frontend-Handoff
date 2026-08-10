import ExcelJS from 'exceljs';

import type {
  BudgetControlLevel,
  BudgetPeriod,
  BudgetScope,
  CashDirection,
  CashPlanStatus,
  ExpensePaymentMethod,
  ExpensePolicyStatus,
  FinanceErpData,
  FinanceLedgerKind,
} from '@/lib/financeErp';

export interface FinanceLedgerWorkbookRow {
  kind: FinanceLedgerKind;
  projectId: string;
  projectNo: string;
  projectName: string;
  counterparty: string;
  title: string;
  billingRound: number;
  documentDate: string;
  dueDate: string;
  supplyAmount: number;
  vatAmount: number;
  settledAmount: number;
  note: string;
}

export interface FinanceExpenseWorkbookRow {
  projectId: string;
  projectNo: string;
  title: string;
  category: string;
  paymentMethod: ExpensePaymentMethod;
  spentAt: string;
  amount: number;
  policyStatus: ExpensePolicyStatus;
  policyMessage: string;
}

export interface FinanceBudgetWorkbookRow {
  scope: BudgetScope;
  scopeId: string;
  scopeName: string;
  account: string;
  category: string;
  periodType: BudgetPeriod;
  period: string;
  budgetAmount: number;
  committedAmount: number;
  actualAmount: number;
  forecastAmount: number;
  controlLevel: BudgetControlLevel;
}

export interface FinanceCashWorkbookRow {
  projectId: string;
  projectNo: string;
  title: string;
  direction: CashDirection;
  plannedDate: string;
  amount: number;
  fixed: boolean;
  sourceType: 'REVENUE' | 'PURCHASE' | 'EXPENSE' | 'FIXED_COST' | 'MANUAL';
  sourceId: string;
  status: CashPlanStatus;
}

export interface FinanceErpImportPreview {
  revenue: FinanceLedgerWorkbookRow[];
  purchase: FinanceLedgerWorkbookRow[];
  cashflow: FinanceCashWorkbookRow[];
  expenses: FinanceExpenseWorkbookRow[];
  budgets: FinanceBudgetWorkbookRow[];
  errors: string[];
}

const ledgerHeaders = [
  'Kind', 'ProjectId', 'ProjectNo', 'ProjectName', 'Counterparty', 'Title',
  'BillingRound', 'DocumentDate', 'DueDate', 'SupplyAmount', 'VatAmount',
  'SettledAmount', 'Note',
] as const;
const cashHeaders = [
  'ProjectId', 'ProjectNo', 'Title', 'Direction', 'PlannedDate', 'Amount',
  'Fixed', 'SourceType', 'SourceId', 'Status',
] as const;
const expenseHeaders = [
  'ProjectId', 'ProjectNo', 'Title', 'Category', 'PaymentMethod', 'SpentAt',
  'Amount', 'PolicyStatus', 'PolicyMessage',
] as const;
const budgetHeaders = [
  'Scope', 'ScopeId', 'ScopeName', 'Account', 'Category', 'PeriodType', 'Period',
  'BudgetAmount', 'CommittedAmount', 'ActualAmount', 'ForecastAmount', 'ControlLevel',
] as const;

const text = (value: ExcelJS.CellValue) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if ('text' in value) return String(value.text ?? '').trim();
    if ('result' in value) return String(value.result ?? '').trim();
  }
  return String(value).trim();
};

const isFormula = (value: ExcelJS.CellValue) =>
  Boolean(value && typeof value === 'object' && 'formula' in value);

const number = (value: ExcelJS.CellValue) => Number(text(value) || 0);
const boolean = (value: ExcelJS.CellValue) => ['true', '1', 'yes', 'y'].includes(text(value).toLowerCase());

const styleSheet = (sheet: ExcelJS.Worksheet) => {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${sheet.getColumn(sheet.columnCount).letter}1` };
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF243A73' } };
  sheet.getRow(1).height = 24;
  sheet.columns.forEach((column) => { column.width = Math.max(14, Math.min(28, column.header?.toString().length ?? 16)); });
};

const addLedgerSheet = (workbook: ExcelJS.Workbook, name: 'Revenue' | 'Purchase', data: FinanceErpData, kind: FinanceLedgerKind) => {
  const sheet = workbook.addWorksheet(name);
  sheet.addRow(ledgerHeaders);
  data.ledger.filter((record) => record.kind === kind).forEach((record) => {
    sheet.addRow([
      record.kind, record.projectId, record.projectNo, record.projectName,
      record.counterparty, record.title, record.billingRound, record.documentDate,
      record.dueDate, record.supplyAmount, record.vatAmount, record.settledAmount, record.note,
    ]);
  });
  styleSheet(sheet);
};

export async function buildFinanceErpWorkbook(data: FinanceErpData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CON-COST ERP DEMO';
  workbook.company = 'CON-COST';
  workbook.subject = 'Finance operational import/export workbook';

  addLedgerSheet(workbook, 'Revenue', data, 'REVENUE');
  addLedgerSheet(workbook, 'Purchase', data, 'PURCHASE');

  const cashflow = workbook.addWorksheet('Cashflow');
  cashflow.addRow(cashHeaders);
  data.cashPlans.forEach((record) => cashflow.addRow([
    record.projectId ?? '', record.projectNo, record.title, record.direction,
    record.plannedDate, record.amount, record.fixed, record.sourceType,
    record.sourceId ?? '', record.status,
  ]));
  styleSheet(cashflow);

  const expenses = workbook.addWorksheet('Expense');
  expenses.addRow(expenseHeaders);
  data.expenses.forEach((record) => expenses.addRow([
    record.projectId ?? '', record.projectNo, record.title, record.category,
    record.paymentMethod, record.spentAt, record.amount, record.policyStatus,
    record.policyMessage,
  ]));
  styleSheet(expenses);

  const budgets = workbook.addWorksheet('Budget');
  budgets.addRow(budgetHeaders);
  data.budgets.forEach((record) => budgets.addRow([
    record.scope, record.scopeId, record.scopeName, record.account, record.category,
    record.periodType, record.period, record.budgetAmount, record.committedAmount,
    record.actualAmount, record.forecastAmount, record.controlLevel,
  ]));
  styleSheet(budgets);

  return workbook;
}

const download = (content: BlobPart, fileName: string) => {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(new Blob([content], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

export async function exportFinanceErpWorkbook(data: FinanceErpData) {
  const workbook = await buildFinanceErpWorkbook(data);
  const buffer = await workbook.xlsx.writeBuffer();
  download(buffer, `concost-finance-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

const validateHeader = (
  sheet: ExcelJS.Worksheet | undefined,
  headers: readonly string[],
  errors: string[],
) => {
  if (!sheet) {
    errors.push(`MISSING_SHEET:${headers[0]}`);
    return false;
  }
  const actual = sheet.getRow(1).values as ExcelJS.CellValue[];
  const matches = headers.every((header, index) => text(actual[index + 1]).toLowerCase() === header.toLowerCase());
  if (!matches) errors.push(`TEMPLATE_MISMATCH:${sheet.name}`);
  return matches;
};

const formulaErrors = (sheet: ExcelJS.Worksheet | undefined) => {
  const errors: string[] = [];
  sheet?.eachRow((row, rowNumber) => row.eachCell((cell) => {
    if (isFormula(cell.value)) errors.push(`${sheet.name}!${cell.address}:FORMULA_BLOCKED:ROW_${rowNumber}`);
  }));
  return errors;
};

const readLedger = (sheet: ExcelJS.Worksheet | undefined, kind: FinanceLedgerKind): FinanceLedgerWorkbookRow[] => {
  if (!sheet) return [];
  const rows: FinanceLedgerWorkbookRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    if (!row.values || !row.getCell(2).value) return;
    rows.push({
      kind,
      projectId: text(row.getCell(2).value),
      projectNo: text(row.getCell(3).value),
      projectName: text(row.getCell(4).value),
      counterparty: text(row.getCell(5).value),
      title: text(row.getCell(6).value),
      billingRound: number(row.getCell(7).value),
      documentDate: text(row.getCell(8).value),
      dueDate: text(row.getCell(9).value),
      supplyAmount: number(row.getCell(10).value),
      vatAmount: number(row.getCell(11).value),
      settledAmount: number(row.getCell(12).value),
      note: text(row.getCell(13).value),
    });
  });
  return rows;
};

export async function previewFinanceErpWorkbook(buffer: ArrayBuffer): Promise<FinanceErpImportPreview> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const errors: string[] = [];
  const revenueSheet = workbook.getWorksheet('Revenue');
  const purchaseSheet = workbook.getWorksheet('Purchase');
  const cashSheet = workbook.getWorksheet('Cashflow');
  const expenseSheet = workbook.getWorksheet('Expense');
  const budgetSheet = workbook.getWorksheet('Budget');

  validateHeader(revenueSheet, ledgerHeaders, errors);
  validateHeader(purchaseSheet, ledgerHeaders, errors);
  validateHeader(cashSheet, cashHeaders, errors);
  validateHeader(expenseSheet, expenseHeaders, errors);
  validateHeader(budgetSheet, budgetHeaders, errors);
  [revenueSheet, purchaseSheet, cashSheet, expenseSheet, budgetSheet].forEach((sheet) => {
    errors.push(...formulaErrors(sheet));
  });

  const cashflow: FinanceCashWorkbookRow[] = [];
  cashSheet?.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || !row.getCell(3).value) return;
    cashflow.push({
      projectId: text(row.getCell(1).value),
      projectNo: text(row.getCell(2).value),
      title: text(row.getCell(3).value),
      direction: text(row.getCell(4).value) as CashDirection,
      plannedDate: text(row.getCell(5).value),
      amount: number(row.getCell(6).value),
      fixed: boolean(row.getCell(7).value),
      sourceType: text(row.getCell(8).value) as FinanceCashWorkbookRow['sourceType'],
      sourceId: text(row.getCell(9).value),
      status: text(row.getCell(10).value) as CashPlanStatus,
    });
  });

  const expenses: FinanceExpenseWorkbookRow[] = [];
  expenseSheet?.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || !row.getCell(3).value) return;
    expenses.push({
      projectId: text(row.getCell(1).value),
      projectNo: text(row.getCell(2).value),
      title: text(row.getCell(3).value),
      category: text(row.getCell(4).value),
      paymentMethod: text(row.getCell(5).value) as ExpensePaymentMethod,
      spentAt: text(row.getCell(6).value),
      amount: number(row.getCell(7).value),
      policyStatus: text(row.getCell(8).value) as ExpensePolicyStatus,
      policyMessage: text(row.getCell(9).value),
    });
  });

  const budgets: FinanceBudgetWorkbookRow[] = [];
  budgetSheet?.eachRow((row, rowNumber) => {
    if (rowNumber === 1 || !row.getCell(3).value) return;
    budgets.push({
      scope: text(row.getCell(1).value) as BudgetScope,
      scopeId: text(row.getCell(2).value),
      scopeName: text(row.getCell(3).value),
      account: text(row.getCell(4).value),
      category: text(row.getCell(5).value),
      periodType: text(row.getCell(6).value) as BudgetPeriod,
      period: text(row.getCell(7).value),
      budgetAmount: number(row.getCell(8).value),
      committedAmount: number(row.getCell(9).value),
      actualAmount: number(row.getCell(10).value),
      forecastAmount: number(row.getCell(11).value),
      controlLevel: text(row.getCell(12).value) as BudgetControlLevel,
    });
  });

  return {
    revenue: readLedger(revenueSheet, 'REVENUE'),
    purchase: readLedger(purchaseSheet, 'PURCHASE'),
    cashflow,
    expenses,
    budgets,
    errors,
  };
}

export async function previewFinanceErpFile(file: File) {
  const extension = file.name.toLowerCase().split('.').pop();
  if (extension === 'xlsm' || extension === 'xls') throw new Error('MACRO_OR_LEGACY_WORKBOOK_BLOCKED');
  if (extension !== 'xlsx') throw new Error('FINANCE_XLSX_REQUIRED');
  return previewFinanceErpWorkbook(await file.arrayBuffer());
}
