import { create } from 'zustand';

import {
  assertFinanceTransition,
  assertSalesTransition,
  createAuditEntry,
  financeBalance,
  findContactDuplicates,
  initialFinanceClosingItems,
  initialFinanceEntries,
  initialSalesActivities,
  initialSalesContacts,
  initialSalesCustomers,
  initialSalesOpportunities,
  type DuplicateReviewStatus,
  type FinanceClosingItem,
  type FinanceEntry,
  type FinanceEntryInput,
  type FinanceEvidence,
  type FinanceStatus,
  type SalesActivity,
  type SalesActivityInput,
  type SalesContact,
  type SalesContactInput,
  type SalesCustomer,
  type SalesCustomerInput,
  type SalesOpportunity,
  type SalesOpportunityInput,
  type SalesStage,
} from '@/lib/businessOperations';
import type { CompanyId } from '@/types/models';

interface BusinessOperationsState {
  customers: SalesCustomer[];
  contacts: SalesContact[];
  activities: SalesActivity[];
  sales: SalesOpportunity[];
  finance: FinanceEntry[];
  closingItems: FinanceClosingItem[];
  createCustomer: (companyId: CompanyId, input: SalesCustomerInput, actorId: string) => string;
  createContact: (companyId: CompanyId, input: SalesContactInput, actorId: string) => string;
  resolveContactDuplicate: (id: string, status: DuplicateReviewStatus, actorId: string) => void;
  createActivity: (companyId: CompanyId, input: SalesActivityInput, actorId: string) => string;
  createSales: (companyId: CompanyId, input: SalesOpportunityInput, actorId: string) => string;
  updateSales: (id: string, input: SalesOpportunityInput, actorId: string) => void;
  transitionSales: (id: string, nextStage: SalesStage, actorId: string) => void;
  linkEstimateRequest: (id: string, estimateRequestId: string, actorId: string) => void;
  archiveSales: (id: string, actorId: string) => void;
  createFinance: (companyId: CompanyId, input: FinanceEntryInput, actorId: string) => string;
  updateFinance: (id: string, input: FinanceEntryInput, actorId: string) => void;
  transitionFinance: (id: string, nextStatus: FinanceStatus, actorId: string) => void;
  recordFinancePayment: (id: string, amount: number, actorId: string) => void;
  addFinanceEvidence: (id: string, evidence: FinanceEvidence, actorId: string) => void;
  archiveFinance: (id: string, actorId: string) => void;
  toggleClosingItem: (id: string, actorId: string) => void;
}

const nextId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`;
const now = () => new Date().toISOString();
const customerNo = (companyId: CompanyId, count: number) => `${companyId === 'VIET_QS' ? 'V' : 'C'}-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
const documentNo = (companyId: CompanyId, count: number) => `FIN-${companyId === 'VIET_QS' ? 'VN-' : ''}${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

export const useBusinessOperationsStore = create<BusinessOperationsState>((set, get) => ({
  customers: initialSalesCustomers,
  contacts: initialSalesContacts,
  activities: initialSalesActivities,
  sales: initialSalesOpportunities,
  finance: initialFinanceEntries,
  closingItems: initialFinanceClosingItems,
  createCustomer: (companyId, input, actorId) => {
    const id = nextId('customer');
    const createdAt = now();
    const record: SalesCustomer = { ...input, id, companyId, customerNo: customerNo(companyId, get().customers.filter((item) => item.companyId === companyId).length), revision: 1, createdAt, updatedAt: createdAt, archivedAt: null, audit: [createAuditEntry('CUSTOMER_CREATED', actorId, 1, null, input, createdAt)] };
    set((state) => ({ customers: [record, ...state.customers] }));
    return id;
  },
  createContact: (companyId, input, actorId) => {
    const id = nextId('contact');
    const createdAt = now();
    const duplicateStatus = findContactDuplicates(get().contacts, { companyId, email: input.email, phone: input.phone }).length ? 'REVIEW_REQUIRED' : (input.duplicateStatus ?? 'CLEAR');
    const record: SalesContact = { ...input, id, companyId, duplicateStatus, revision: 1, createdAt, updatedAt: createdAt, archivedAt: null, audit: [createAuditEntry('CONTACT_CREATED', actorId, 1, null, { ...input, duplicateStatus }, createdAt)] };
    set((state) => ({ contacts: [record, ...state.contacts] }));
    return id;
  },
  resolveContactDuplicate: (id, status, actorId) => set((state) => ({ contacts: state.contacts.map((record) => {
    if (record.id !== id) return record;
    const updatedAt = now(); const revision = record.revision + 1;
    return { ...record, duplicateStatus: status, revision, updatedAt, audit: [createAuditEntry('CONTACT_DUPLICATE_REVIEWED', actorId, revision, { duplicateStatus: record.duplicateStatus }, { duplicateStatus: status }, updatedAt), ...record.audit] };
  }) })),
  createActivity: (companyId, input, actorId) => {
    const id = nextId('activity'); const createdAt = now();
    const record: SalesActivity = { ...input, id, companyId, revision: 1, createdAt, updatedAt: createdAt, archivedAt: null, audit: [createAuditEntry('SALES_ACTIVITY_CREATED', actorId, 1, null, input, createdAt)] };
    set((state) => ({ activities: [record, ...state.activities] }));
    return id;
  },
  createSales: (companyId, input, actorId) => {
    const id = nextId('sales'); const createdAt = now();
    const record: SalesOpportunity = { ...input, id, companyId, revision: 1, createdAt, updatedAt: createdAt, archivedAt: null, audit: [createAuditEntry('SALES_CREATED', actorId, 1, null, input, createdAt)], estimateRequestId: input.estimateRequestId ?? null, projectId: input.projectId ?? null };
    set((state) => ({ sales: [record, ...state.sales] }));
    return id;
  },
  updateSales: (id, input, actorId) => set((state) => ({ sales: state.sales.map((record) => {
    if (record.id !== id) return record;
    const updatedAt = now(); const revision = record.revision + 1;
    const after = { ...input, estimateRequestId: input.estimateRequestId ?? record.estimateRequestId, projectId: input.projectId ?? record.projectId };
    return { ...record, ...after, revision, updatedAt, audit: [createAuditEntry('SALES_UPDATED', actorId, revision, record, after, updatedAt), ...record.audit] };
  }) })),
  transitionSales: (id, nextStage, actorId) => set((state) => ({ sales: state.sales.map((record) => {
    if (record.id !== id) return record;
    assertSalesTransition(record.stage, nextStage);
    const updatedAt = now(); const revision = record.revision + 1;
    return { ...record, stage: nextStage, probability: nextStage === 'WON' ? 100 : nextStage === 'LOST' ? 0 : record.probability, revision, updatedAt, audit: [createAuditEntry('SALES_STAGE_CHANGED', actorId, revision, { stage: record.stage }, { stage: nextStage }, updatedAt), ...record.audit] };
  }) })),
  linkEstimateRequest: (id, estimateRequestId, actorId) => set((state) => ({ sales: state.sales.map((record) => {
    if (record.id !== id) return record;
    const updatedAt = now(); const revision = record.revision + 1;
    return { ...record, estimateRequestId, revision, updatedAt, audit: [createAuditEntry('ESTIMATE_REQUEST_LINKED', actorId, revision, { estimateRequestId: record.estimateRequestId }, { estimateRequestId }, updatedAt), ...record.audit] };
  }) })),
  archiveSales: (id, actorId) => set((state) => ({ sales: state.sales.map((record) => {
    if (record.id !== id) return record;
    const archivedAt = now(); const revision = record.revision + 1;
    return { ...record, archivedAt, updatedAt: archivedAt, revision, audit: [createAuditEntry('SALES_ARCHIVED', actorId, revision, record, { archivedAt }, archivedAt), ...record.audit] };
  }) })),
  createFinance: (companyId, input, actorId) => {
    const id = nextId('finance'); const createdAt = now();
    const record: FinanceEntry = { ...input, id, companyId, documentNo: input.documentNo || documentNo(companyId, get().finance.filter((item) => item.companyId === companyId).length), evidence: input.evidence ?? [], evidenceStatus: input.evidenceStatus ?? 'MISSING', revision: 1, createdAt, updatedAt: createdAt, archivedAt: null, audit: [createAuditEntry('FINANCE_CREATED', actorId, 1, null, input, createdAt)] };
    set((state) => ({ finance: [record, ...state.finance] }));
    return id;
  },
  updateFinance: (id, input, actorId) => set((state) => ({ finance: state.finance.map((record) => {
    if (record.id !== id) return record;
    const updatedAt = now(); const revision = record.revision + 1;
    const after = { ...input, documentNo: input.documentNo || record.documentNo, evidence: input.evidence ?? record.evidence, evidenceStatus: input.evidenceStatus ?? record.evidenceStatus };
    return { ...record, ...after, revision, updatedAt, audit: [createAuditEntry('FINANCE_UPDATED', actorId, revision, record, after, updatedAt), ...record.audit] };
  }) })),
  transitionFinance: (id, nextStatus, actorId) => set((state) => ({ finance: state.finance.map((record) => {
    if (record.id !== id) return record;
    assertFinanceTransition(record.status, nextStatus);
    const updatedAt = now(); const revision = record.revision + 1;
    return { ...record, status: nextStatus, revision, updatedAt, audit: [createAuditEntry('FINANCE_STATUS_CHANGED', actorId, revision, { status: record.status }, { status: nextStatus }, updatedAt), ...record.audit] };
  }) })),
  recordFinancePayment: (id, amount, actorId) => set((state) => ({ finance: state.finance.map((record) => {
    if (record.id !== id) return record;
    if (amount <= 0 || amount > financeBalance(record)) throw new Error('INVALID_PAYMENT_AMOUNT');
    const updatedAt = now(); const revision = record.revision + 1; const paidAmount = record.paidAmount + amount;
    const status = paidAmount >= record.totalAmount && record.status === 'APPROVED' ? 'RECONCILED' : record.status;
    return { ...record, paidAmount, status, revision, updatedAt, audit: [createAuditEntry('FINANCE_PAYMENT_RECORDED', actorId, revision, { paidAmount: record.paidAmount, status: record.status }, { paidAmount, status }, updatedAt), ...record.audit] };
  }) })),
  addFinanceEvidence: (id, evidence, actorId) => set((state) => ({ finance: state.finance.map((record) => {
    if (record.id !== id) return record;
    if (evidence.state !== 'READY') throw new Error('FILE_NOT_READY');
    const updatedAt = now(); const revision = record.revision + 1;
    return { ...record, evidence: [...record.evidence, evidence], evidenceStatus: 'READY', revision, updatedAt, audit: [createAuditEntry('FINANCE_EVIDENCE_LINKED', actorId, revision, { evidenceIds: record.evidence.map((item) => item.id) }, { evidenceId: evidence.id, checksum: evidence.checksum, classification: evidence.classification }, updatedAt), ...record.audit] };
  }) })),
  archiveFinance: (id, actorId) => set((state) => ({ finance: state.finance.map((record) => {
    if (record.id !== id) return record;
    const archivedAt = now(); const revision = record.revision + 1;
    return { ...record, archivedAt, updatedAt: archivedAt, revision, audit: [createAuditEntry('FINANCE_ARCHIVED', actorId, revision, record, { archivedAt }, archivedAt), ...record.audit] };
  }) })),
  toggleClosingItem: (id, actorId) => set((state) => ({ closingItems: state.closingItems.map((record) => {
    if (record.id !== id) return record;
    const updatedAt = now(); const revision = record.revision + 1; const completed = !record.completed; const completedAt = completed ? updatedAt : null;
    return { ...record, completed, completedAt, revision, updatedAt, audit: [createAuditEntry('FINANCE_CLOSING_TOGGLED', actorId, revision, { completed: record.completed }, { completed }, updatedAt), ...record.audit] };
  }) })),
}));
