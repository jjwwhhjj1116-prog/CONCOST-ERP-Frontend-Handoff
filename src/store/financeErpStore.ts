import { create } from 'zustand';

import {
  applyLedgerSettlement,
  assertClosingTransition,
  assertFinanceCompanyScope,
  assertTaxInvoiceTransition,
  financeErpDemoData,
  type BudgetControlLevel,
  type BudgetPeriod,
  type BudgetScope,
  type CashDirection,
  type CashPlanStatus,
  type ClosingStatus,
  type ExpensePaymentMethod,
  type ExpensePolicyStatus,
  type FinanceAuditEvent,
  type FinanceBudgetRecord,
  type FinanceControlEvent,
  type FinanceErpData,
  type FinanceExpenseRecord,
  type FinanceLedgerKind,
  type FinanceLedgerRecord,
  type FinanceTaxInvoice,
  type TaxInvoiceStatus,
} from '@/lib/financeErp';
import type { CompanyId } from '@/types/models';

export interface FinanceLedgerDraft {
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
  note: string;
}

export interface FinanceExpenseDraft {
  projectId: string | null;
  projectNo: string;
  title: string;
  category: string;
  paymentMethod: ExpensePaymentMethod;
  spentAt: string;
  amount: number;
  policyStatus: ExpensePolicyStatus;
  policyMessage: string;
}

export interface FinanceBudgetDraft {
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

export interface FinanceCashPlanDraft {
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

interface FinanceErpStore extends FinanceErpData {
  createLedger: (companyId: CompanyId, input: FinanceLedgerDraft, actorId: string) => string;
  updateLedger: (companyId: CompanyId, id: string, input: FinanceLedgerDraft, actorId: string) => void;
  recordSettlement: (companyId: CompanyId, id: string, amount: number, actorId: string) => void;
  createExpense: (companyId: CompanyId, input: FinanceExpenseDraft, actorId: string) => string;
  createBudget: (companyId: CompanyId, input: FinanceBudgetDraft, actorId: string) => string;
  createCashPlan: (companyId: CompanyId, input: FinanceCashPlanDraft, actorId: string) => string;
  transitionTaxInvoice: (
    companyId: CompanyId,
    id: string,
    next: TaxInvoiceStatus,
    providerReady: boolean,
    actorId: string,
  ) => void;
  toggleClosingChecklist: (companyId: CompanyId, closingId: string, itemId: string, actorId: string) => void;
  transitionClosing: (
    companyId: CompanyId,
    closingId: string,
    next: ClosingStatus,
    actorId: string,
    reason?: string,
  ) => void;
  resolveControl: (companyId: CompanyId, id: string, actorId: string) => void;
}

const nextId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
const timestamp = () => new Date().toISOString();

const auditEvent = (
  action: string,
  actorId: string,
  entityType: string,
  entityId: string,
  revision: number,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
  sourceId: string | null = null,
  evidenceIds: string[] = [],
  createdAt = timestamp(),
): FinanceAuditEvent => ({
  id: nextId('finance-audit'),
  action,
  actorId,
  entityType,
  entityId,
  before,
  after,
  sourceId,
  evidenceIds,
  correlationId: nextId('corr'),
  createdAt,
  revision,
});

const controlEvent = (
  companyId: CompanyId,
  controlType: FinanceControlEvent['controlType'],
  severity: FinanceControlEvent['severity'],
  title: string,
  detail: string,
  entityType: string,
  entityId: string,
): FinanceControlEvent => {
  const createdAt = timestamp();
  return {
    id: nextId('finance-control'),
    companyId,
    revision: 1,
    createdAt,
    updatedAt: createdAt,
    audit: [],
    controlType,
    severity,
    title,
    detail,
    entityType,
    entityId,
    resolved: false,
  };
};

const cloneInitial = (): FinanceErpData => structuredClone(financeErpDemoData);
const initial = cloneInitial();

export const useFinanceErpStore = create<FinanceErpStore>((set, get) => ({
  ...initial,
  createLedger: (companyId, input, actorId) => {
    const id = nextId('finance-ledger');
    const createdAt = timestamp();
    const count = get().ledger.filter((record) => record.companyId === companyId && record.kind === input.kind).length + 1;
    const documentNo = `${input.kind === 'REVENUE' ? 'REV' : 'PUR'}-${companyId === 'VIET_QS' ? 'VN-' : ''}${createdAt.slice(0, 4)}-${String(count).padStart(3, '0')}`;
    const totalAmount = Math.max(0, input.supplyAmount) + Math.max(0, input.vatAmount);
    const taxInvoiceId = nextId('finance-tax');
    const record: FinanceLedgerRecord = {
      ...input,
      id,
      companyId,
      documentNo,
      totalAmount,
      settledAmount: 0,
      status: 'PLANNED',
      taxInvoiceId,
      evidenceIds: [],
      approvalDraftId: null,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
      audit: [auditEvent('FINANCE_LEDGER_CREATED', actorId, 'FinanceLedgerRecord', id, 1, null, { ...input, totalAmount }, input.projectId, [], createdAt)],
    };
    const invoice: FinanceTaxInvoice = {
      id: taxInvoiceId,
      companyId,
      invoiceNo: `${input.kind === 'REVENUE' ? 'TAX-S' : 'TAX-P'}-${createdAt.slice(0, 4)}-${String(count).padStart(3, '0')}`,
      direction: input.kind === 'REVENUE' ? 'SALES' : 'PURCHASE',
      projectId: input.projectId,
      projectNo: input.projectNo,
      counterparty: input.counterparty,
      issueDate: input.documentDate,
      supplyAmount: input.supplyAmount,
      vatAmount: input.vatAmount,
      totalAmount,
      status: 'DRAFT',
      ledgerId: id,
      providerRequestId: null,
      lastProviderError: null,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
      audit: [auditEvent('TAX_INVOICE_DRAFT_CREATED', actorId, 'FinanceTaxInvoice', taxInvoiceId, 1, null, { ledgerId: id, totalAmount }, id, [], createdAt)],
    };
    set((state) => ({
      ledger: [record, ...state.ledger],
      taxInvoices: [invoice, ...state.taxInvoices],
      controls: [controlEvent(companyId, 'SOURCE_TRACE', 'INFO', '원장 Source 연결 생성', `${documentNo}가 ${input.projectNo}에 연결되었습니다.`, 'FinanceLedgerRecord', id), ...state.controls],
    }));
    return id;
  },
  updateLedger: (companyId, id, input, actorId) => set((state) => ({
    ledger: state.ledger.map((record) => {
      if (record.id !== id) return record;
      assertFinanceCompanyScope(record, companyId);
      const updatedAt = timestamp();
      const revision = record.revision + 1;
      const totalAmount = Math.max(0, input.supplyAmount) + Math.max(0, input.vatAmount);
      const after = { ...input, totalAmount };
      return {
        ...record,
        ...after,
        revision,
        updatedAt,
        audit: [auditEvent('FINANCE_LEDGER_UPDATED', actorId, 'FinanceLedgerRecord', id, revision, {
          projectId: record.projectId,
          counterparty: record.counterparty,
          title: record.title,
          dueDate: record.dueDate,
          totalAmount: record.totalAmount,
        }, after, record.projectId, record.evidenceIds, updatedAt), ...record.audit],
      };
    }),
  })),
  recordSettlement: (companyId, id, amount, actorId) => set((state) => ({
    ledger: state.ledger.map((record) => {
      if (record.id !== id) return record;
      assertFinanceCompanyScope(record, companyId);
      return applyLedgerSettlement(record, amount, actorId, timestamp());
    }),
  })),
  createExpense: (companyId, input, actorId) => {
    const id = nextId('finance-expense');
    const createdAt = timestamp();
    const count = get().expenses.filter((record) => record.companyId === companyId).length + 1;
    const record: FinanceExpenseRecord = {
      ...input,
      id,
      companyId,
      expenseNo: `EXP-${companyId === 'VIET_QS' ? 'VN-' : ''}${createdAt.slice(0, 4)}-${String(count).padStart(3, '0')}`,
      evidenceIds: [],
      approvalDraftId: null,
      postingStatus: 'DRAFT',
      revision: 1,
      createdAt,
      updatedAt: createdAt,
      audit: [auditEvent('FINANCE_EXPENSE_CREATED', actorId, 'FinanceExpenseRecord', id, 1, null, { ...input }, input.projectId, [], createdAt)],
    };
    set((state) => ({
      expenses: [record, ...state.expenses],
      controls: input.policyStatus === 'COMPLIANT' ? state.controls : [controlEvent(companyId, 'BUDGET_LIMIT', input.policyStatus === 'BLOCKED' ? 'CRITICAL' : 'WARNING', '경비 정책 확인 필요', input.policyMessage, 'FinanceExpenseRecord', id), ...state.controls],
    }));
    return id;
  },
  createBudget: (companyId, input, actorId) => {
    const id = nextId('finance-budget');
    const createdAt = timestamp();
    const count = get().budgets.filter((record) => record.companyId === companyId).length + 1;
    const record: FinanceBudgetRecord = {
      ...input,
      id,
      companyId,
      budgetNo: `BGT-${companyId === 'VIET_QS' ? 'VN-' : ''}${createdAt.slice(0, 4)}-${String(count).padStart(3, '0')}`,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
      audit: [auditEvent('FINANCE_BUDGET_CREATED', actorId, 'FinanceBudgetRecord', id, 1, null, { ...input }, input.scopeId, [], createdAt)],
    };
    set((state) => ({ budgets: [record, ...state.budgets] }));
    return id;
  },
  createCashPlan: (companyId, input, actorId) => {
    const id = nextId('finance-cash-plan');
    const createdAt = timestamp();
    const count = get().cashPlans.filter((record) => record.companyId === companyId).length + 1;
    set((state) => ({
      cashPlans: [{
        ...input,
        id,
        companyId,
        planNo: `CASH-${companyId === 'VIET_QS' ? 'VN-' : ''}${createdAt.slice(0, 4)}-${String(count).padStart(3, '0')}`,
        revision: 1,
        createdAt,
        updatedAt: createdAt,
        audit: [auditEvent('FINANCE_CASH_PLAN_CREATED', actorId, 'FinanceCashPlan', id, 1, null, { ...input }, input.sourceId, [], createdAt)],
      }, ...state.cashPlans],
    }));
    return id;
  },
  transitionTaxInvoice: (companyId, id, next, providerReady, actorId) => set((state) => ({
    taxInvoices: state.taxInvoices.map((record) => {
      if (record.id !== id) return record;
      assertFinanceCompanyScope(record, companyId);
      assertTaxInvoiceTransition(record.status, next, providerReady);
      const updatedAt = timestamp();
      const revision = record.revision + 1;
      const providerRequestId = next === 'REQUESTED' ? nextId('tax-provider-request') : record.providerRequestId;
      return {
        ...record,
        status: next,
        providerRequestId,
        lastProviderError: null,
        revision,
        updatedAt,
        audit: [auditEvent('TAX_INVOICE_STATUS_CHANGED', actorId, 'FinanceTaxInvoice', id, revision, { status: record.status }, { status: next, providerRequestId }, record.ledgerId, [], updatedAt), ...record.audit],
      };
    }),
  })),
  toggleClosingChecklist: (companyId, closingId, itemId, actorId) => set((state) => ({
    closings: state.closings.map((period) => {
      if (period.id !== closingId) return period;
      assertFinanceCompanyScope(period, companyId);
      if (period.status === 'CLOSED') throw new Error('CLOSING_PERIOD_LOCKED');
      const updatedAt = timestamp();
      const revision = period.revision + 1;
      const checklist = period.checklist.map((item) => item.id === itemId ? {
        ...item,
        completed: !item.completed,
        completedAt: item.completed ? null : updatedAt,
      } : item);
      return {
        ...period,
        checklist,
        revision,
        updatedAt,
        audit: [auditEvent('CLOSING_CHECKLIST_UPDATED', actorId, 'FinanceClosingPeriod', closingId, revision, { itemId, completed: period.checklist.find((item) => item.id === itemId)?.completed }, { itemId, completed: checklist.find((item) => item.id === itemId)?.completed }, period.month, [], updatedAt), ...period.audit],
      };
    }),
  })),
  transitionClosing: (companyId, closingId, next, actorId, reason = '') => set((state) => ({
    closings: state.closings.map((period) => {
      if (period.id !== closingId) return period;
      assertFinanceCompanyScope(period, companyId);
      assertClosingTransition(period, next, reason);
      const updatedAt = timestamp();
      const revision = period.revision + 1;
      const after = {
        status: next,
        closedAt: next === 'CLOSED' ? updatedAt : period.closedAt,
        closedBy: next === 'CLOSED' ? actorId : period.closedBy,
        reopenedAt: next === 'REOPENED' ? updatedAt : period.reopenedAt,
        reopenReason: next === 'REOPENED' ? reason.trim() : period.reopenReason,
      };
      return {
        ...period,
        ...after,
        revision,
        updatedAt,
        audit: [auditEvent('FINANCE_CLOSING_STATUS_CHANGED', actorId, 'FinanceClosingPeriod', closingId, revision, { status: period.status }, after, period.month, [], updatedAt), ...period.audit],
      };
    }),
  })),
  resolveControl: (companyId, id, actorId) => set((state) => ({
    controls: state.controls.map((record) => {
      if (record.id !== id) return record;
      assertFinanceCompanyScope(record, companyId);
      const updatedAt = timestamp();
      const revision = record.revision + 1;
      return {
        ...record,
        resolved: true,
        revision,
        updatedAt,
        audit: [auditEvent('FINANCE_CONTROL_RESOLVED', actorId, 'FinanceControlEvent', id, revision, { resolved: record.resolved }, { resolved: true }, record.entityId, [], updatedAt), ...record.audit],
      };
    }),
  })),
}));
