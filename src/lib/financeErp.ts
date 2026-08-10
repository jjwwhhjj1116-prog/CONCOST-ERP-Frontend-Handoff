import type { CompanyId } from '@/types/models';

export type FinanceLedgerKind = 'REVENUE' | 'PURCHASE';
export type FinanceLedgerStatus =
  | 'PLANNED'
  | 'READY'
  | 'PARTIAL'
  | 'SETTLED'
  | 'OVERDUE'
  | 'CANCELLED';
export type TaxInvoiceDirection = 'SALES' | 'PURCHASE';
export type TaxInvoiceStatus =
  | 'DRAFT'
  | 'READY'
  | 'REQUESTED'
  | 'ISSUED'
  | 'RECEIVED'
  | 'CANCELLED'
  | 'FAILED';
export type ExpensePaymentMethod = 'CORPORATE_CARD' | 'PERSONAL_CARD' | 'CASH' | 'OTHER';
export type ExpensePolicyStatus = 'COMPLIANT' | 'WARNING' | 'BLOCKED';
export type ExpensePostingStatus = 'DRAFT' | 'APPROVAL_PENDING' | 'APPROVED' | 'POSTING_CANDIDATE';
export type BudgetScope = 'COMPANY' | 'ORGANIZATION' | 'PROJECT';
export type BudgetPeriod = 'MONTH' | 'QUARTER' | 'HALF_YEAR' | 'YEAR';
export type BudgetControlLevel = 'INFO' | 'WARN' | 'BLOCK';
export type CashDirection = 'IN' | 'OUT';
export type CashPlanStatus = 'PLANNED' | 'CONFIRMED' | 'SETTLED' | 'CANCELLED';
export type ClosingStatus = 'OPEN' | 'IN_PROGRESS' | 'REVIEW' | 'CLOSED' | 'REOPENED';
export type AgingBucket = 'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'DAYS_90_PLUS';
export type ControlSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface FinanceAuditEvent {
  id: string;
  action: string;
  actorId: string;
  entityType: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  sourceId: string | null;
  evidenceIds: string[];
  correlationId: string;
  createdAt: string;
  revision: number;
}

interface FinanceScopedRecord {
  id: string;
  companyId: CompanyId;
  revision: number;
  createdAt: string;
  updatedAt: string;
  audit: FinanceAuditEvent[];
}

export interface FinanceLedgerRecord extends FinanceScopedRecord {
  kind: FinanceLedgerKind;
  documentNo: string;
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
  totalAmount: number;
  settledAmount: number;
  status: FinanceLedgerStatus;
  taxInvoiceId: string | null;
  evidenceIds: string[];
  approvalDraftId: string | null;
  note: string;
}

export interface FinanceExpenseRecord extends FinanceScopedRecord {
  expenseNo: string;
  projectId: string | null;
  projectNo: string;
  title: string;
  category: string;
  paymentMethod: ExpensePaymentMethod;
  spentAt: string;
  amount: number;
  policyStatus: ExpensePolicyStatus;
  policyMessage: string;
  evidenceIds: string[];
  approvalDraftId: string | null;
  postingStatus: ExpensePostingStatus;
}

export interface FinanceTaxInvoice extends FinanceScopedRecord {
  invoiceNo: string;
  direction: TaxInvoiceDirection;
  projectId: string;
  projectNo: string;
  counterparty: string;
  issueDate: string;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: TaxInvoiceStatus;
  ledgerId: string;
  providerRequestId: string | null;
  lastProviderError: string | null;
}

export interface FinanceBudgetRecord extends FinanceScopedRecord {
  budgetNo: string;
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

export interface FinanceCashPlan extends FinanceScopedRecord {
  planNo: string;
  projectId: string | null;
  projectNo: string;
  title: string;
  direction: CashDirection;
  plannedDate: string;
  amount: number;
  fixed: boolean;
  sourceType: 'REVENUE' | 'PURCHASE' | 'EXPENSE' | 'FIXED_COST' | 'MANUAL';
  sourceId: string | null;
  status: CashPlanStatus;
}

export interface FinanceClosingChecklistItem {
  id: string;
  label: string;
  ownerRole: string;
  completed: boolean;
  completedAt: string | null;
}

export interface FinanceClosingPeriod extends FinanceScopedRecord {
  month: string;
  status: ClosingStatus;
  checklist: FinanceClosingChecklistItem[];
  closedAt: string | null;
  closedBy: string | null;
  reopenedAt: string | null;
  reopenReason: string | null;
}

export interface FinanceControlEvent extends FinanceScopedRecord {
  severity: ControlSeverity;
  controlType:
    | 'SOURCE_TRACE'
    | 'BUDGET_LIMIT'
    | 'CLOSING_LOCK'
    | 'UNAUTHORIZED_ACCESS'
    | 'PROVIDER_ERROR'
    | 'REVISION';
  title: string;
  detail: string;
  entityType: string;
  entityId: string;
  resolved: boolean;
}

export interface FinanceErpData {
  ledger: FinanceLedgerRecord[];
  expenses: FinanceExpenseRecord[];
  taxInvoices: FinanceTaxInvoice[];
  budgets: FinanceBudgetRecord[];
  cashPlans: FinanceCashPlan[];
  closings: FinanceClosingPeriod[];
  controls: FinanceControlEvent[];
}

export interface FinanceProjectProfitability {
  projectId: string;
  projectNo: string;
  projectName: string;
  orderAmount: number;
  revenuePlan: number;
  billed: number;
  collected: number;
  purchases: number;
  expenses: number;
  receivable: number;
  payable: number;
  managementProfit: number;
  marginRate: number;
  sourceIds: string[];
}

export interface CfoCockpitSummary {
  revenue: number;
  purchase: number;
  collectionDue: number;
  paymentDue: number;
  receivable: number;
  payable: number;
  plannedFunds: number;
  budgetExecutionRate: number;
  expense: number;
  projectProfit: number;
  closingProgress: number;
  alerts: number;
}

const now = '2026-08-10T09:00:00.000Z';

const audit = (
  action: string,
  actorId: string,
  entityType: string,
  entityId: string,
  revision: number,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  sourceId: string | null = null,
  evidenceIds: string[] = [],
  createdAt = now,
): FinanceAuditEvent => ({
  id: `audit-${entityId}-${revision}-${action.toLowerCase()}`,
  action,
  actorId,
  entityType,
  entityId,
  before,
  after,
  sourceId,
  evidenceIds,
  correlationId: `corr-${entityId}-${revision}`,
  createdAt,
  revision,
});

const scoped = (id: string, companyId: CompanyId, createdAt = now) => ({
  id,
  companyId,
  revision: 1,
  createdAt,
  updatedAt: createdAt,
  audit: [] as FinanceAuditEvent[],
});

const ledger = (
  id: string,
  companyId: CompanyId,
  input: Omit<FinanceLedgerRecord, keyof ReturnType<typeof scoped> | 'audit'>,
): FinanceLedgerRecord => ({ ...scoped(id, companyId), ...input });

const expense = (
  id: string,
  companyId: CompanyId,
  input: Omit<FinanceExpenseRecord, keyof ReturnType<typeof scoped> | 'audit'>,
): FinanceExpenseRecord => ({ ...scoped(id, companyId), ...input });

const budget = (
  id: string,
  companyId: CompanyId,
  input: Omit<FinanceBudgetRecord, keyof ReturnType<typeof scoped> | 'audit'>,
): FinanceBudgetRecord => ({ ...scoped(id, companyId), ...input });

const cash = (
  id: string,
  companyId: CompanyId,
  input: Omit<FinanceCashPlan, keyof ReturnType<typeof scoped> | 'audit'>,
): FinanceCashPlan => ({ ...scoped(id, companyId), ...input });

export const initialFinanceErpData: FinanceErpData = {
  ledger: [
    ledger('fin-ledger-kr-r1', 'CON_COST', {
      kind: 'REVENUE', documentNo: 'REV-2026-001', projectId: 'demo-project-concost-001', projectNo: '2026001', projectName: 'DEMO 도심 복합시설', counterparty: 'DEMO 건설 파트너', title: '착수금 청구', billingRound: 1, documentDate: '2026-07-15', dueDate: '2026-08-05', supplyAmount: 30_000_000, vatAmount: 3_000_000, totalAmount: 33_000_000, settledAmount: 20_000_000, status: 'PARTIAL', taxInvoiceId: 'tax-kr-sales-1', evidenceIds: ['ready-file-rev-001'], approvalDraftId: 'approval-demo-rev-001', note: '합성 데모 1차 청구',
    }),
    ledger('fin-ledger-kr-r2', 'CON_COST', {
      kind: 'REVENUE', documentNo: 'REV-2026-002', projectId: 'demo-project-concost-001', projectNo: '2026001', projectName: 'DEMO 도심 복합시설', counterparty: 'DEMO 건설 파트너', title: '중도금 청구 예정', billingRound: 2, documentDate: '2026-08-08', dueDate: '2026-08-28', supplyAmount: 45_000_000, vatAmount: 4_500_000, totalAmount: 49_500_000, settledAmount: 0, status: 'READY', taxInvoiceId: 'tax-kr-sales-2', evidenceIds: [], approvalDraftId: null, note: '합성 데모 2차 청구',
    }),
    ledger('fin-ledger-kr-r3', 'CON_COST', {
      kind: 'REVENUE', documentNo: 'REV-2026-003', projectId: 'demo-project-concost-002', projectNo: '2026002', projectName: 'DEMO 구조 검토', counterparty: 'DEMO 엔지니어링', title: '최종 성과금', billingRound: 1, documentDate: '2026-06-20', dueDate: '2026-07-10', supplyAmount: 18_000_000, vatAmount: 1_800_000, totalAmount: 19_800_000, settledAmount: 0, status: 'OVERDUE', taxInvoiceId: 'tax-kr-sales-3', evidenceIds: ['ready-file-rev-003'], approvalDraftId: null, note: '합성 데모 연체 채권',
    }),
    ledger('fin-ledger-kr-p1', 'CON_COST', {
      kind: 'PURCHASE', documentNo: 'PUR-2026-001', projectId: 'demo-project-concost-001', projectNo: '2026001', projectName: 'DEMO 도심 복합시설', counterparty: 'DEMO 현장조사 파트너', title: '현장조사 용역', billingRound: 1, documentDate: '2026-08-02', dueDate: '2026-08-22', supplyAmount: 8_000_000, vatAmount: 800_000, totalAmount: 8_800_000, settledAmount: 2_000_000, status: 'PARTIAL', taxInvoiceId: 'tax-kr-purchase-1', evidenceIds: ['ready-file-pur-001'], approvalDraftId: 'approval-demo-pur-001', note: '합성 데모 외주비',
    }),
    ledger('fin-ledger-kr-p2', 'CON_COST', {
      kind: 'PURCHASE', documentNo: 'PUR-2026-002', projectId: 'demo-project-concost-002', projectNo: '2026002', projectName: 'DEMO 구조 검토', counterparty: 'DEMO 출력센터', title: '성과품 출력비', billingRound: 1, documentDate: '2026-07-01', dueDate: '2026-07-31', supplyAmount: 1_200_000, vatAmount: 120_000, totalAmount: 1_320_000, settledAmount: 0, status: 'OVERDUE', taxInvoiceId: 'tax-kr-purchase-2', evidenceIds: [], approvalDraftId: null, note: '합성 데모 미지급',
    }),
    ledger('fin-ledger-vn-r1', 'VIET_QS', {
      kind: 'REVENUE', documentNo: 'VN-REV-2026-001', projectId: 'demo-project-vietqs-001', projectNo: 'VQ-2026-001', projectName: 'DEMO Hanoi quantity review', counterparty: 'DEMO Vietnam Client', title: 'First billing round', billingRound: 1, documentDate: '2026-08-01', dueDate: '2026-08-25', supplyAmount: 42_000_000, vatAmount: 0, totalAmount: 42_000_000, settledAmount: 10_000_000, status: 'PARTIAL', taxInvoiceId: null, evidenceIds: [], approvalDraftId: null, note: 'Synthetic Viet QS finance row',
    }),
  ],
  expenses: [
    expense('fin-expense-kr-1', 'CON_COST', {
      expenseNo: 'EXP-2026-001', projectId: 'demo-project-concost-001', projectNo: '2026001', title: '현장 이동 교통비', category: '출장·교통', paymentMethod: 'CORPORATE_CARD', spentAt: '2026-08-04', amount: 186_000, policyStatus: 'COMPLIANT', policyMessage: '증빙과 Project 연결이 확인되었습니다.', evidenceIds: ['ready-receipt-001'], approvalDraftId: 'approval-expense-001', postingStatus: 'APPROVED',
    }),
    expense('fin-expense-kr-2', 'CON_COST', {
      expenseNo: 'EXP-2026-002', projectId: 'demo-project-concost-002', projectNo: '2026002', title: '회의 식대', category: '회의비', paymentMethod: 'PERSONAL_CARD', spentAt: '2026-08-07', amount: 420_000, policyStatus: 'WARNING', policyMessage: '참석자와 회의 목적을 보완해야 합니다.', evidenceIds: [], approvalDraftId: null, postingStatus: 'DRAFT',
    }),
    expense('fin-expense-vn-1', 'VIET_QS', {
      expenseNo: 'VN-EXP-2026-001', projectId: 'demo-project-vietqs-001', projectNo: 'VQ-2026-001', title: 'Site survey transport', category: 'Travel', paymentMethod: 'CASH', spentAt: '2026-08-06', amount: 1_800_000, policyStatus: 'COMPLIANT', policyMessage: 'Synthetic demo expense.', evidenceIds: ['ready-receipt-vn-001'], approvalDraftId: null, postingStatus: 'DRAFT',
    }),
  ],
  taxInvoices: [
    { ...scoped('tax-kr-sales-1', 'CON_COST'), invoiceNo: 'TAX-S-2026-001', direction: 'SALES', projectId: 'demo-project-concost-001', projectNo: '2026001', counterparty: 'DEMO 건설 파트너', issueDate: '2026-07-15', supplyAmount: 30_000_000, vatAmount: 3_000_000, totalAmount: 33_000_000, status: 'ISSUED', ledgerId: 'fin-ledger-kr-r1', providerRequestId: 'provider-demo-historical', lastProviderError: null },
    { ...scoped('tax-kr-sales-2', 'CON_COST'), invoiceNo: 'TAX-S-2026-002', direction: 'SALES', projectId: 'demo-project-concost-001', projectNo: '2026001', counterparty: 'DEMO 건설 파트너', issueDate: '2026-08-08', supplyAmount: 45_000_000, vatAmount: 4_500_000, totalAmount: 49_500_000, status: 'DRAFT', ledgerId: 'fin-ledger-kr-r2', providerRequestId: null, lastProviderError: null },
    { ...scoped('tax-kr-sales-3', 'CON_COST'), invoiceNo: 'TAX-S-2026-003', direction: 'SALES', projectId: 'demo-project-concost-002', projectNo: '2026002', counterparty: 'DEMO 엔지니어링', issueDate: '2026-06-20', supplyAmount: 18_000_000, vatAmount: 1_800_000, totalAmount: 19_800_000, status: 'FAILED', ledgerId: 'fin-ledger-kr-r3', providerRequestId: null, lastProviderError: 'PROVIDER_NOT_CONFIGURED' },
    { ...scoped('tax-kr-purchase-1', 'CON_COST'), invoiceNo: 'TAX-P-2026-001', direction: 'PURCHASE', projectId: 'demo-project-concost-001', projectNo: '2026001', counterparty: 'DEMO 현장조사 파트너', issueDate: '2026-08-02', supplyAmount: 8_000_000, vatAmount: 800_000, totalAmount: 8_800_000, status: 'RECEIVED', ledgerId: 'fin-ledger-kr-p1', providerRequestId: null, lastProviderError: null },
  ],
  budgets: [
    budget('budget-kr-project-1', 'CON_COST', { budgetNo: 'BGT-2026-001', scope: 'PROJECT', scopeId: 'demo-project-concost-001', scopeName: '2026001 · DEMO 도심 복합시설', account: '외주용역비', category: 'Project 원가', periodType: 'YEAR', period: '2026', budgetAmount: 20_000_000, committedAmount: 8_800_000, actualAmount: 6_200_000, forecastAmount: 15_500_000, controlLevel: 'WARN' }),
    budget('budget-kr-dept-1', 'CON_COST', { budgetNo: 'BGT-2026-002', scope: 'ORGANIZATION', scopeId: 'MANAGEMENT_SUPPORT', scopeName: '경영지원본부', account: '회의비', category: '운영비', periodType: 'MONTH', period: '2026-08', budgetAmount: 5_000_000, committedAmount: 3_100_000, actualAmount: 2_850_000, forecastAmount: 4_700_000, controlLevel: 'INFO' }),
    budget('budget-kr-company-1', 'CON_COST', { budgetNo: 'BGT-2026-003', scope: 'COMPANY', scopeId: 'CON_COST', scopeName: 'CON-COST', account: '출장비', category: '운영비', periodType: 'QUARTER', period: '2026-Q3', budgetAmount: 12_000_000, committedAmount: 10_500_000, actualAmount: 9_800_000, forecastAmount: 13_200_000, controlLevel: 'BLOCK' }),
    budget('budget-vn-project-1', 'VIET_QS', { budgetNo: 'VN-BGT-2026-001', scope: 'PROJECT', scopeId: 'demo-project-vietqs-001', scopeName: 'VQ-2026-001 · DEMO Hanoi quantity review', account: 'Site survey', category: 'Project cost', periodType: 'YEAR', period: '2026', budgetAmount: 18_000_000, committedAmount: 8_000_000, actualAmount: 5_000_000, forecastAmount: 12_000_000, controlLevel: 'INFO' }),
  ],
  cashPlans: [
    cash('cash-kr-in-1', 'CON_COST', { planNo: 'CASH-2026-001', projectId: 'demo-project-concost-001', projectNo: '2026001', title: '중도금 수금 예정', direction: 'IN', plannedDate: '2026-08-28', amount: 49_500_000, fixed: false, sourceType: 'REVENUE', sourceId: 'fin-ledger-kr-r2', status: 'CONFIRMED' }),
    cash('cash-kr-in-2', 'CON_COST', { planNo: 'CASH-2026-002', projectId: 'demo-project-concost-002', projectNo: '2026002', title: '연체채권 회수 계획', direction: 'IN', plannedDate: '2026-08-18', amount: 19_800_000, fixed: false, sourceType: 'REVENUE', sourceId: 'fin-ledger-kr-r3', status: 'PLANNED' }),
    cash('cash-kr-out-1', 'CON_COST', { planNo: 'CASH-2026-003', projectId: 'demo-project-concost-001', projectNo: '2026001', title: '현장조사 잔금 지급', direction: 'OUT', plannedDate: '2026-08-22', amount: 6_800_000, fixed: false, sourceType: 'PURCHASE', sourceId: 'fin-ledger-kr-p1', status: 'CONFIRMED' }),
    cash('cash-kr-fixed-1', 'CON_COST', { planNo: 'CASH-2026-004', projectId: null, projectNo: '', title: '월 고정 운영비', direction: 'OUT', plannedDate: '2026-08-25', amount: 12_000_000, fixed: true, sourceType: 'FIXED_COST', sourceId: null, status: 'PLANNED' }),
    cash('cash-vn-in-1', 'VIET_QS', { planNo: 'VN-CASH-2026-001', projectId: 'demo-project-vietqs-001', projectNo: 'VQ-2026-001', title: 'First billing collection', direction: 'IN', plannedDate: '2026-08-25', amount: 32_000_000, fixed: false, sourceType: 'REVENUE', sourceId: 'fin-ledger-vn-r1', status: 'PLANNED' }),
  ],
  closings: [
    { ...scoped('closing-kr-2026-08', 'CON_COST'), month: '2026-08', status: 'IN_PROGRESS', checklist: [
      { id: 'close-kr-1', label: '매출·매입 원장 검토', ownerRole: 'FINANCE_OPERATOR', completed: true, completedAt: '2026-08-09T09:00:00.000Z' },
      { id: 'close-kr-2', label: '미수·미지급 Aging 검토', ownerRole: 'FINANCE_MANAGER', completed: false, completedAt: null },
      { id: 'close-kr-3', label: '경비 증빙·승인 확인', ownerRole: 'FINANCE_OPERATOR', completed: false, completedAt: null },
      { id: 'close-kr-4', label: '세금계산서 상태 확인', ownerRole: 'FINANCE_MANAGER', completed: false, completedAt: null },
      { id: 'close-kr-5', label: 'Project 손익 검토', ownerRole: 'FINANCE_MANAGER', completed: false, completedAt: null },
    ], closedAt: null, closedBy: null, reopenedAt: null, reopenReason: null },
    { ...scoped('closing-vn-2026-08', 'VIET_QS'), month: '2026-08', status: 'OPEN', checklist: [
      { id: 'close-vn-1', label: 'Review revenue and purchase ledger', ownerRole: 'FINANCE_OPERATOR', completed: false, completedAt: null },
      { id: 'close-vn-2', label: 'Review expense evidence', ownerRole: 'FINANCE_MANAGER', completed: false, completedAt: null },
    ], closedAt: null, closedBy: null, reopenedAt: null, reopenReason: null },
  ],
  controls: [
    { ...scoped('control-kr-1', 'CON_COST'), severity: 'WARNING', controlType: 'BUDGET_LIMIT', title: '출장비 예산 Forecast 초과', detail: '2026-Q3 Forecast가 승인 예산을 초과합니다.', entityType: 'FinanceBudgetRecord', entityId: 'budget-kr-company-1', resolved: false },
    { ...scoped('control-kr-2', 'CON_COST'), severity: 'CRITICAL', controlType: 'PROVIDER_ERROR', title: '세금계산서 Provider 미설정', detail: 'Provider 연결 전 발행 요청은 차단됩니다.', entityType: 'FinanceTaxInvoice', entityId: 'tax-kr-sales-3', resolved: false },
    { ...scoped('control-kr-3', 'CON_COST'), severity: 'INFO', controlType: 'SOURCE_TRACE', title: 'Project 원천 연결 확인', detail: 'Project번호와 원장 Source ID가 연결되어 있습니다.', entityType: 'FinanceLedgerRecord', entityId: 'fin-ledger-kr-r1', resolved: true },
  ],
};

const ledgerDisplay: Record<string, Pick<FinanceLedgerRecord, 'projectName' | 'counterparty' | 'title' | 'note'>> = {
  'fin-ledger-kr-r1': { projectName: 'DEMO 복합시설 원가검토', counterparty: 'DEMO 건설 파트너', title: '착수금 1차 청구', note: '합성 데모 1차 청구' },
  'fin-ledger-kr-r2': { projectName: 'DEMO 복합시설 원가검토', counterparty: 'DEMO 건설 파트너', title: '중도금 2차 청구 예정', note: '합성 데모 2차 청구' },
  'fin-ledger-kr-r3': { projectName: 'DEMO 구조 안전검토', counterparty: 'DEMO 엔지니어링', title: '최종 성과금', note: '합성 데모 연체 채권' },
  'fin-ledger-kr-p1': { projectName: 'DEMO 복합시설 원가검토', counterparty: 'DEMO 현장조사 파트너', title: '현장조사 용역', note: '합성 데모 외주비' },
  'fin-ledger-kr-p2': { projectName: 'DEMO 구조 안전검토', counterparty: 'DEMO 출력센터', title: '성과품 출력비', note: '합성 데모 미지급' },
};

const expenseDisplay: Record<string, Pick<FinanceExpenseRecord, 'title' | 'category' | 'policyMessage'>> = {
  'fin-expense-kr-1': { title: '현장 이동 교통비', category: '출장·교통', policyMessage: '증빙과 Project 연결을 확인했습니다.' },
  'fin-expense-kr-2': { title: '검토 회의 식비', category: '회의비', policyMessage: '참석자와 회의 목적을 보완해야 합니다.' },
};

const budgetDisplay: Record<string, Pick<FinanceBudgetRecord, 'scopeName' | 'account' | 'category'>> = {
  'budget-kr-project-1': { scopeName: '2026001 · DEMO 복합시설 원가검토', account: '외주용역비', category: 'Project 원가' },
  'budget-kr-dept-1': { scopeName: '경영지원본부', account: '회의비', category: '운영비' },
  'budget-kr-company-1': { scopeName: 'CON-COST', account: '출장비', category: '운영비' },
};

const cashDisplay: Record<string, string> = {
  'cash-kr-in-1': '중도금 수금 예정',
  'cash-kr-in-2': '연체채권 회수 계획',
  'cash-kr-out-1': '현장조사 잔금 지급',
  'cash-kr-fixed-1': '월 고정 운영비',
};

const taxCounterparty: Record<string, string> = {
  'tax-kr-sales-1': 'DEMO 건설 파트너',
  'tax-kr-sales-2': 'DEMO 건설 파트너',
  'tax-kr-sales-3': 'DEMO 엔지니어링',
  'tax-kr-purchase-1': 'DEMO 현장조사 파트너',
};

const closingLabels = [
  '매출·매입 원장 검토',
  '미수·미지급 Aging 검토',
  '경비 증빙·승인 확인',
  '세금계산서 상태 확인',
  'Project 관리손익 검토',
];

const controlDisplay: Record<string, Pick<FinanceControlEvent, 'title' | 'detail'>> = {
  'control-kr-1': { title: '출장비 예산 Forecast 초과', detail: '2026-Q3 Forecast가 승인 예산을 초과합니다.' },
  'control-kr-2': { title: '세금계산서 Provider 미설정', detail: 'Provider 연결 전 발행 요청은 차단됩니다.' },
  'control-kr-3': { title: 'Project 원천 연결 확인', detail: 'Project번호와 원장 Source ID가 연결되어 있습니다.' },
};

/** Runtime-only synthetic data with readable labels; no real company records are included. */
export const financeErpDemoData: FinanceErpData = {
  ledger: initialFinanceErpData.ledger.map((record) => ({ ...record, ...(ledgerDisplay[record.id] ?? {}) })),
  expenses: initialFinanceErpData.expenses.map((record) => ({ ...record, ...(expenseDisplay[record.id] ?? {}) })),
  taxInvoices: initialFinanceErpData.taxInvoices.map((record) => ({ ...record, counterparty: taxCounterparty[record.id] ?? record.counterparty })),
  budgets: initialFinanceErpData.budgets.map((record) => ({ ...record, ...(budgetDisplay[record.id] ?? {}) })),
  cashPlans: initialFinanceErpData.cashPlans.map((record) => ({ ...record, title: cashDisplay[record.id] ?? record.title })),
  closings: initialFinanceErpData.closings.map((record) => ({
    ...record,
    checklist: record.companyId === 'CON_COST'
      ? record.checklist.map((item, index) => ({ ...item, label: closingLabels[index] ?? item.label }))
      : record.checklist,
  })),
  controls: initialFinanceErpData.controls.map((record) => ({ ...record, ...(controlDisplay[record.id] ?? {}) })),
};

export const financeRemaining = (record: Pick<FinanceLedgerRecord, 'totalAmount' | 'settledAmount'>) =>
  Math.max(0, record.totalAmount - record.settledAmount);

const dayDiff = (from: string, to: string) =>
  Math.floor((Date.parse(to) - Date.parse(from)) / 86_400_000);

export function financeAgingBucket(record: FinanceLedgerRecord, asOf = '2026-08-10'): AgingBucket {
  const remaining = financeRemaining(record);
  if (!remaining || record.dueDate >= asOf) return 'CURRENT';
  const days = dayDiff(record.dueDate, asOf);
  if (days <= 30) return 'DAYS_1_30';
  if (days <= 60) return 'DAYS_31_60';
  if (days <= 90) return 'DAYS_61_90';
  return 'DAYS_90_PLUS';
}

export function buildAgingSummary(records: FinanceLedgerRecord[], kind: FinanceLedgerKind, asOf = '2026-08-10') {
  const initial: Record<AgingBucket, number> = {
    CURRENT: 0,
    DAYS_1_30: 0,
    DAYS_31_60: 0,
    DAYS_61_90: 0,
    DAYS_90_PLUS: 0,
  };
  return records
    .filter((record) => record.kind === kind && record.status !== 'CANCELLED')
    .reduce((result, record) => {
      result[financeAgingBucket(record, asOf)] += financeRemaining(record);
      return result;
    }, initial);
}

export function budgetExecution(record: FinanceBudgetRecord) {
  const executionRate = record.budgetAmount > 0 ? (record.actualAmount / record.budgetAmount) * 100 : 0;
  const forecastRate = record.budgetAmount > 0 ? (record.forecastAmount / record.budgetAmount) * 100 : 0;
  return {
    executionRate,
    forecastRate,
    balance: record.budgetAmount - record.actualAmount,
    availableAfterCommitment: record.budgetAmount - record.actualAmount - record.committedAmount,
    breached: record.controlLevel === 'BLOCK' && record.forecastAmount > record.budgetAmount,
  };
}

export function financeProjectProfitability(data: FinanceErpData): FinanceProjectProfitability[] {
  const projects = new Map<string, FinanceProjectProfitability>();
  for (const record of data.ledger) {
    if (!record.projectId || record.status === 'CANCELLED') continue;
    const current = projects.get(record.projectId) ?? {
      projectId: record.projectId,
      projectNo: record.projectNo,
      projectName: record.projectName,
      orderAmount: 0,
      revenuePlan: 0,
      billed: 0,
      collected: 0,
      purchases: 0,
      expenses: 0,
      receivable: 0,
      payable: 0,
      managementProfit: 0,
      marginRate: 0,
      sourceIds: [],
    };
    if (record.kind === 'REVENUE') {
      current.orderAmount += record.totalAmount;
      current.revenuePlan += record.totalAmount;
      current.billed += record.totalAmount;
      current.collected += record.settledAmount;
      current.receivable += financeRemaining(record);
    } else {
      current.purchases += record.totalAmount;
      current.payable += financeRemaining(record);
    }
    current.sourceIds.push(record.id);
    projects.set(record.projectId, current);
  }
  for (const record of data.expenses) {
    if (!record.projectId) continue;
    const current = projects.get(record.projectId);
    if (!current) continue;
    current.expenses += record.amount;
    current.sourceIds.push(record.id);
  }
  return [...projects.values()].map((record) => {
    const managementProfit = record.revenuePlan - record.purchases - record.expenses;
    return {
      ...record,
      managementProfit,
      marginRate: record.revenuePlan > 0 ? (managementProfit / record.revenuePlan) * 100 : 0,
    };
  });
}

export function financeForecast(data: FinanceErpData, asOf = '2026-08-10', days = 30) {
  const end = new Date(`${asOf}T00:00:00.000Z`);
  end.setUTCDate(end.getUTCDate() + days);
  const endDate = end.toISOString().slice(0, 10);
  const plans = data.cashPlans.filter((plan) =>
    plan.status !== 'CANCELLED' && plan.plannedDate >= asOf && plan.plannedDate <= endDate,
  );
  const inflow = plans.filter((plan) => plan.direction === 'IN').reduce((sum, plan) => sum + plan.amount, 0);
  const outflow = plans.filter((plan) => plan.direction === 'OUT').reduce((sum, plan) => sum + plan.amount, 0);
  return { days, inflow, outflow, net: inflow - outflow, count: plans.length };
}

export function closingProgress(period: FinanceClosingPeriod | undefined) {
  if (!period?.checklist.length) return 0;
  return (period.checklist.filter((item) => item.completed).length / period.checklist.length) * 100;
}

export function summarizeCfoCockpit(data: FinanceErpData): CfoCockpitSummary {
  const activeLedger = data.ledger.filter((record) => record.status !== 'CANCELLED');
  const revenue = activeLedger.filter((record) => record.kind === 'REVENUE').reduce((sum, record) => sum + record.totalAmount, 0);
  const purchase = activeLedger.filter((record) => record.kind === 'PURCHASE').reduce((sum, record) => sum + record.totalAmount, 0);
  const receivable = activeLedger.filter((record) => record.kind === 'REVENUE').reduce((sum, record) => sum + financeRemaining(record), 0);
  const payable = activeLedger.filter((record) => record.kind === 'PURCHASE').reduce((sum, record) => sum + financeRemaining(record), 0);
  const budgetAmount = data.budgets.reduce((sum, record) => sum + record.budgetAmount, 0);
  const actualAmount = data.budgets.reduce((sum, record) => sum + record.actualAmount, 0);
  const forecast = financeForecast(data, '2026-08-10', 90);
  const projects = financeProjectProfitability(data);
  return {
    revenue,
    purchase,
    collectionDue: receivable,
    paymentDue: payable + data.expenses.filter((record) => record.postingStatus !== 'POSTING_CANDIDATE').reduce((sum, record) => sum + record.amount, 0),
    receivable,
    payable,
    plannedFunds: forecast.net,
    budgetExecutionRate: budgetAmount ? (actualAmount / budgetAmount) * 100 : 0,
    expense: data.expenses.reduce((sum, record) => sum + record.amount, 0),
    projectProfit: projects.reduce((sum, record) => sum + record.managementProfit, 0),
    closingProgress: closingProgress(data.closings[0]),
    alerts: data.controls.filter((control) => !control.resolved && control.severity !== 'INFO').length,
  };
}

export function scopeFinanceErpData(data: FinanceErpData, companyId: CompanyId): FinanceErpData {
  return {
    ledger: data.ledger.filter((record) => record.companyId === companyId),
    expenses: data.expenses.filter((record) => record.companyId === companyId),
    taxInvoices: data.taxInvoices.filter((record) => record.companyId === companyId),
    budgets: data.budgets.filter((record) => record.companyId === companyId),
    cashPlans: data.cashPlans.filter((record) => record.companyId === companyId),
    closings: data.closings.filter((record) => record.companyId === companyId),
    controls: data.controls.filter((record) => record.companyId === companyId),
  };
}

const taxTransitions: Record<TaxInvoiceStatus, TaxInvoiceStatus[]> = {
  DRAFT: ['READY', 'CANCELLED'],
  READY: ['REQUESTED', 'CANCELLED'],
  REQUESTED: ['ISSUED', 'RECEIVED', 'FAILED'],
  ISSUED: ['CANCELLED'],
  RECEIVED: ['CANCELLED'],
  CANCELLED: [],
  FAILED: ['READY', 'CANCELLED'],
};

export function assertTaxInvoiceTransition(
  before: TaxInvoiceStatus,
  after: TaxInvoiceStatus,
  providerReady: boolean,
) {
  if (!taxTransitions[before].includes(after)) {
    throw new Error(`INVALID_TAX_INVOICE_TRANSITION:${before}:${after}`);
  }
  if (['REQUESTED', 'ISSUED', 'RECEIVED'].includes(after) && !providerReady) {
    throw new Error('TAX_PROVIDER_NOT_CONFIGURED');
  }
}

const closingTransitions: Record<ClosingStatus, ClosingStatus[]> = {
  OPEN: ['IN_PROGRESS'],
  IN_PROGRESS: ['REVIEW'],
  REVIEW: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['REOPENED'],
  REOPENED: ['IN_PROGRESS'],
};

export function assertClosingTransition(period: FinanceClosingPeriod, next: ClosingStatus, reason = '') {
  if (!closingTransitions[period.status].includes(next)) {
    throw new Error(`INVALID_CLOSING_TRANSITION:${period.status}:${next}`);
  }
  if (next === 'CLOSED' && period.checklist.some((item) => !item.completed)) {
    throw new Error('CLOSING_CHECKLIST_INCOMPLETE');
  }
  if (next === 'REOPENED' && reason.trim().length < 5) {
    throw new Error('REOPEN_REASON_REQUIRED');
  }
}

export function applyLedgerSettlement(record: FinanceLedgerRecord, amount: number, actorId: string, createdAt: string) {
  const remaining = financeRemaining(record);
  if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) {
    throw new Error('INVALID_SETTLEMENT_AMOUNT');
  }
  const settledAmount = record.settledAmount + amount;
  const status: FinanceLedgerStatus = settledAmount >= record.totalAmount ? 'SETTLED' : 'PARTIAL';
  const revision = record.revision + 1;
  const after = { settledAmount, status };
  return {
    ...record,
    ...after,
    revision,
    updatedAt: createdAt,
    audit: [
      audit(
        record.kind === 'REVENUE' ? 'COLLECTION_RECORDED' : 'PAYMENT_RECORDED',
        actorId,
        'FinanceLedgerRecord',
        record.id,
        revision,
        { settledAmount: record.settledAmount, status: record.status },
        after,
        record.id,
        record.evidenceIds,
        createdAt,
      ),
      ...record.audit,
    ],
  };
}

export function assertFinanceCompanyScope(record: { companyId: CompanyId }, selectedCompanyId: CompanyId) {
  if (record.companyId !== selectedCompanyId) throw new Error('FINANCE_COMPANY_SCOPE_MISMATCH');
}

export function buildFinanceHistoryUrl(
  pathname: string,
  currentSearch: string,
  changes: Record<string, string | null>,
) {
  const next = new URLSearchParams(currentSearch);
  Object.entries(changes).forEach(([key, value]) => {
    if (value) next.set(key, value);
    else next.delete(key);
  });
  next.delete('view');
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function allFinanceSourceIds(data: FinanceErpData) {
  return new Set([
    ...data.ledger.map((record) => record.id),
    ...data.expenses.map((record) => record.id),
    ...data.taxInvoices.map((record) => record.id),
    ...data.budgets.map((record) => record.id),
    ...data.cashPlans.map((record) => record.id),
    ...data.closings.map((record) => record.id),
    ...data.controls.map((record) => record.id),
  ]);
}
