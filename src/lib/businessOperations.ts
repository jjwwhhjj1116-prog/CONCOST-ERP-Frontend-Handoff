import type { CompanyId } from '@/types/models';

export type SalesStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type CustomerStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE';
export type ContactSource = 'MANUAL' | 'BUSINESS_CARD_OCR' | 'IMPORT';
export type DuplicateReviewStatus = 'CLEAR' | 'REVIEW_REQUIRED' | 'MERGED';
export type ContactStatus = 'ACTIVE' | 'INACTIVE';
export type GoogleContactSyncState = 'NOT_REQUESTED' | 'OPT_IN_PENDING' | 'PROVIDER_REQUIRED' | 'SYNCED';
export type BusinessCardReviewStatus = 'REVIEW_REQUIRED' | 'REGISTERED' | 'MERGED' | 'ARCHIVED';
export type BusinessCardCaptureSource = 'DESKTOP' | 'MOBILE' | 'MANUAL';
export type BusinessCardRegistrationDecision = 'NEW_CONTACT' | 'MERGE_CONTACT' | 'DIFFERENT_PERSON';
export type SalesActivityType = 'CALL' | 'MEETING' | 'MAIL' | 'MEMO' | 'TASK';
export type SalesActivityStatus = 'OPEN' | 'DONE';

export type FinanceEntryType = 'RECEIVABLE' | 'PAYABLE' | 'EXPENSE' | 'BUDGET';
export type FinanceStatus = 'DRAFT' | 'REVIEW_PENDING' | 'APPROVED' | 'RECONCILED' | 'VOID';
export type EvidenceStatus = 'MISSING' | 'READY' | 'VERIFIED';
export type TaxInvoiceStatus = 'NOT_REQUIRED' | 'DRAFT' | 'PROVIDER_REQUIRED' | 'ISSUED';
export type FinanceEvidenceState = 'SCANNING' | 'READY' | 'REJECTED';

export interface BusinessAuditEntry {
  id: string;
  action: string;
  actorId: string;
  before: string;
  after: string;
  createdAt: string;
  revision: number;
}

export interface ScopedBusinessRecord {
  id: string;
  companyId: CompanyId;
  revision: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  audit: BusinessAuditEntry[];
}

export interface SalesCustomer extends ScopedBusinessRecord {
  customerNo: string;
  name: string;
  industry: string;
  ownerId: string;
  status: CustomerStatus;
  note: string;
}

export interface SalesContact extends ScopedBusinessRecord {
  customerId: string;
  name: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  source: ContactSource;
  sourceBusinessCardId: string | null;
  duplicateStatus: DuplicateReviewStatus;
  lastContactAt: string | null;
  companyName: string;
  mobile: string;
  telephone: string;
  fax: string;
  homepage: string;
  address: string;
  ownerId: string;
  tags: string[];
  memo: string;
  status: ContactStatus;
  googleContactsOptIn: boolean;
  googleSyncState: GoogleContactSyncState;
}

export interface BusinessCardRecord extends ScopedBusinessRecord {
  contactId: string | null;
  customerId: string | null;
  captureSource: BusinessCardCaptureSource;
  fileName: string | null;
  fileSize: number | null;
  fileReferenceId: string | null;
  ocrMode: 'DEMO_SIMULATION' | 'PROVIDER' | 'MANUAL';
  ocrConfidence: Partial<Record<keyof import('@/lib/businessCardOcr').BusinessCardFields, number>>;
  reviewStatus: BusinessCardReviewStatus;
  registrationDecision: BusinessCardRegistrationDecision;
  duplicateCandidateIds: string[];
  reviewedFields: import('@/lib/businessCardOcr').BusinessCardFields;
  selectedMergeFields: Array<keyof import('@/lib/businessCardOcr').BusinessCardFields>;
  reviewedBy: string;
  reviewedAt: string;
}

export interface SalesActivity extends ScopedBusinessRecord {
  customerId: string;
  opportunityId: string | null;
  contactId: string | null;
  type: SalesActivityType;
  status: SalesActivityStatus;
  title: string;
  detail: string;
  happenedAt: string;
  ownerId: string;
}

export interface SalesOpportunity extends ScopedBusinessRecord {
  opportunityName: string;
  customerId: string;
  contactId: string | null;
  customerName: string;
  contactRole: string;
  expectedValue: number;
  probability: number;
  stage: SalesStage;
  expectedCloseDate: string;
  nextAction: string;
  ownerId: string;
  estimateRequestId: string | null;
  projectId: string | null;
}

export interface FinanceEvidence {
  id: string;
  fileName: string;
  state: FinanceEvidenceState;
  checksum: string;
  classification: 'FINANCE_INTERNAL' | 'FINANCE_RESTRICTED';
  createdAt: string;
}

export interface FinanceEntry extends ScopedBusinessRecord {
  entryType: FinanceEntryType;
  documentNo: string;
  title: string;
  counterparty: string;
  documentDate: string;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: FinanceStatus;
  evidenceStatus: EvidenceStatus;
  evidence: FinanceEvidence[];
  taxInvoiceStatus: TaxInvoiceStatus;
  projectId: string | null;
  projectNo: string;
  approvalDraftId: string | null;
  note: string;
}

export interface FinanceClosingItem extends ScopedBusinessRecord {
  month: string;
  label: string;
  completed: boolean;
  completedAt: string | null;
}

export type SalesCustomerInput = Omit<SalesCustomer, keyof ScopedBusinessRecord | 'customerNo'>;
export type SalesContactInput = Pick<SalesContact, 'customerId' | 'name' | 'department' | 'position' | 'email' | 'phone' | 'source' | 'sourceBusinessCardId' | 'lastContactAt'> & Partial<Pick<SalesContact, 'companyName' | 'mobile' | 'telephone' | 'fax' | 'homepage' | 'address' | 'ownerId' | 'tags' | 'memo' | 'status' | 'googleContactsOptIn' | 'googleSyncState'>> & {
  duplicateStatus?: DuplicateReviewStatus;
};

export interface BusinessCardRegistrationInput {
  fields: import('@/lib/businessCardOcr').BusinessCardFields;
  captureSource: BusinessCardCaptureSource;
  fileName: string | null;
  fileSize: number | null;
  fileReferenceId?: string | null;
  ocrMode: 'DEMO_SIMULATION' | 'PROVIDER' | 'MANUAL';
  fieldConfidence: Partial<Record<keyof import('@/lib/businessCardOcr').BusinessCardFields, number>>;
  decision: BusinessCardRegistrationDecision;
  duplicateContactId?: string | null;
  selectedMergeFields?: Array<keyof import('@/lib/businessCardOcr').BusinessCardFields>;
  customerId?: string | null;
  ownerId: string;
  tags: string[];
  memo: string;
  googleContactsOptIn: boolean;
}
export type SalesActivityInput = Omit<SalesActivity, keyof ScopedBusinessRecord>;
export type SalesOpportunityInput = Omit<SalesOpportunity, keyof ScopedBusinessRecord | 'estimateRequestId' | 'projectId'> & {
  estimateRequestId?: string | null;
  projectId?: string | null;
};
export type FinanceEntryInput = Omit<FinanceEntry, keyof ScopedBusinessRecord | 'documentNo' | 'evidence' | 'evidenceStatus'> & {
  documentNo?: string;
  evidence?: FinanceEvidence[];
  evidenceStatus?: EvidenceStatus;
};

const salesTransitions: Record<SalesStage, readonly SalesStage[]> = {
  LEAD: ['QUALIFIED', 'LOST'],
  QUALIFIED: ['PROPOSAL', 'LOST'],
  PROPOSAL: ['NEGOTIATION', 'WON', 'LOST'],
  NEGOTIATION: ['WON', 'LOST'],
  WON: [],
  LOST: [],
};

const financeTransitions: Record<FinanceStatus, readonly FinanceStatus[]> = {
  DRAFT: ['REVIEW_PENDING', 'VOID'],
  REVIEW_PENDING: ['DRAFT', 'APPROVED', 'VOID'],
  APPROVED: ['RECONCILED', 'VOID'],
  RECONCILED: [],
  VOID: [],
};

export const nextSalesStages = (stage: SalesStage) => salesTransitions[stage];
export const nextFinanceStatuses = (status: FinanceStatus) => financeTransitions[status];

export function assertSalesTransition(before: SalesStage, after: SalesStage) {
  if (!salesTransitions[before].includes(after)) throw new Error(`INVALID_SALES_TRANSITION:${before}:${after}`);
}

export function assertFinanceTransition(before: FinanceStatus, after: FinanceStatus) {
  if (!financeTransitions[before].includes(after)) throw new Error(`INVALID_FINANCE_TRANSITION:${before}:${after}`);
}

const cleanDigits = (value: string) => value.replace(/\D/g, '');
const cleanEmail = (value: string) => value.trim().toLowerCase();

export function findContactDuplicates(contacts: SalesContact[], candidate: Pick<SalesContact, 'companyId' | 'email' | 'phone'>) {
  const email = cleanEmail(candidate.email);
  const phone = cleanDigits(candidate.phone);
  return contacts.filter((contact) => contact.companyId === candidate.companyId && !contact.archivedAt && (
    (email.length > 0 && cleanEmail(contact.email) === email) ||
    (phone.length >= 8 && cleanDigits(contact.phone) === phone)
  ));
}

export function findBusinessCardDuplicateCandidates(
  contacts: SalesContact[],
  candidate: { companyId: CompanyId; email: string; mobile: string; name: string; companyName: string },
) {
  const email = cleanEmail(candidate.email);
  const mobile = cleanDigits(candidate.mobile);
  const name = candidate.name.trim().toLowerCase();
  const companyName = candidate.companyName.trim().toLowerCase();
  return contacts.filter((contact) => {
    if (contact.companyId !== candidate.companyId || contact.archivedAt || contact.status === 'INACTIVE') return false;
    const exactEmail = email.length > 0 && cleanEmail(contact.email) === email;
    const exactMobile = mobile.length >= 8 && cleanDigits(contact.mobile || contact.phone) === mobile;
    const samePersonAtCompany = name.length > 1 && companyName.length > 1
      && contact.name.trim().toLowerCase() === name
      && contact.companyName.trim().toLowerCase() === companyName;
    return exactEmail || exactMobile || samePersonAtCompany;
  });
}

export function mergeBusinessCardContact(
  contact: SalesContact,
  fields: import('@/lib/businessCardOcr').BusinessCardFields,
  selectedFields: Array<keyof import('@/lib/businessCardOcr').BusinessCardFields>,
) {
  const after = { ...contact };
  const assign = (key: keyof import('@/lib/businessCardOcr').BusinessCardFields, target: keyof SalesContact) => {
    if (!selectedFields.includes(key)) return;
    const value = fields[key].trim();
    if (value) (after[target] as string) = value;
  };
  assign('name', 'name');
  assign('company', 'companyName');
  assign('department', 'department');
  assign('position', 'position');
  assign('mobile', 'mobile');
  assign('mobile', 'phone');
  assign('telephone', 'telephone');
  assign('fax', 'fax');
  assign('email', 'email');
  assign('homepage', 'homepage');
  assign('address', 'address');
  return after;
}

export const companyCustomers = (entries: SalesCustomer[], companyId: CompanyId) =>
  entries.filter((entry) => entry.companyId === companyId && !entry.archivedAt);
export const companyContacts = (entries: SalesContact[], companyId: CompanyId) =>
  entries.filter((entry) => entry.companyId === companyId && !entry.archivedAt && entry.status !== 'INACTIVE');
export const companyActivities = (entries: SalesActivity[], companyId: CompanyId) =>
  entries.filter((entry) => entry.companyId === companyId && !entry.archivedAt);
export const companySales = (entries: SalesOpportunity[], companyId: CompanyId) =>
  entries.filter((entry) => entry.companyId === companyId && !entry.archivedAt);
export const companyFinance = (entries: FinanceEntry[], companyId: CompanyId) =>
  entries.filter((entry) => entry.companyId === companyId && !entry.archivedAt);
export const companyClosingItems = (entries: FinanceClosingItem[], companyId: CompanyId) =>
  entries.filter((entry) => entry.companyId === companyId && !entry.archivedAt);

export function summarizeSales(entries: SalesOpportunity[]) {
  const active = entries.filter((entry) => !['WON', 'LOST'].includes(entry.stage));
  return {
    activeCount: active.length,
    pipelineValue: active.reduce((total, entry) => total + entry.expectedValue, 0),
    weightedValue: active.reduce((total, entry) => total + entry.expectedValue * (entry.probability / 100), 0),
    wonCount: entries.filter((entry) => entry.stage === 'WON').length,
  };
}

export const financeBalance = (entry: FinanceEntry) => Math.max(0, entry.totalAmount - entry.paidAmount);
export const isFinanceOverdue = (entry: FinanceEntry, today: string) =>
  ['RECEIVABLE', 'PAYABLE'].includes(entry.entryType) && financeBalance(entry) > 0 && entry.dueDate < today && entry.status !== 'VOID';

export function calculateFinanceAmounts(supplyAmount: number, vatRate = 0.1) {
  const safeSupply = Math.max(0, Math.round(supplyAmount));
  const vatAmount = Math.max(0, Math.round(safeSupply * vatRate));
  return { supplyAmount: safeSupply, vatAmount, totalAmount: safeSupply + vatAmount };
}

export function summarizeFinance(entries: FinanceEntry[], today = new Date().toISOString().slice(0, 10)) {
  const active = entries.filter((entry) => entry.status !== 'VOID');
  return {
    receivable: active.filter((entry) => entry.entryType === 'RECEIVABLE').reduce((total, entry) => total + financeBalance(entry), 0),
    payable: active.filter((entry) => entry.entryType === 'PAYABLE').reduce((total, entry) => total + financeBalance(entry), 0),
    expense: active.filter((entry) => entry.entryType === 'EXPENSE').reduce((total, entry) => total + entry.totalAmount, 0),
    pendingReview: active.filter((entry) => entry.status === 'REVIEW_PENDING').length,
    evidenceMissing: active.filter((entry) => entry.evidenceStatus === 'MISSING').length,
    overdue: active.filter((entry) => isFinanceOverdue(entry, today)).length,
  };
}

const auditSnapshot = (value: unknown) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const snapshot = { ...(value as Record<string, unknown>) };
  Reflect.deleteProperty(snapshot, 'audit');
  return snapshot;
};

export const createAuditEntry = (action: string, actorId: string, revision: number, before: unknown, after: unknown, createdAt: string): BusinessAuditEntry => ({
  id: `${action.toLowerCase()}-${revision}-${createdAt}`,
  action,
  actorId,
  before: JSON.stringify(auditSnapshot(before)),
  after: JSON.stringify(auditSnapshot(after)),
  createdAt,
  revision,
});

const baseRecord = (id: string, companyId: CompanyId, createdAt: string) => ({
  id, companyId, revision: 1, createdAt, updatedAt: createdAt, archivedAt: null, audit: [],
});

export const initialSalesCustomers: SalesCustomer[] = [
  { ...baseRecord('customer-concost-001', 'CON_COST', '2026-08-01T09:00:00.000Z'), customerNo: 'C-2026-001', name: 'DEMO 건설 파트너', industry: '건설', ownerId: 'demo-concost-admin-001', status: 'ACTIVE', note: '합성 데모 거래처' },
  { ...baseRecord('customer-vietqs-001', 'VIET_QS', '2026-08-02T02:00:00.000Z'), customerNo: 'V-2026-001', name: 'DEMO Vietnam Client', industry: 'Construction', ownerId: 'demo-vietqs-admin-001', status: 'ACTIVE', note: 'Synthetic demo customer' },
];

export const initialSalesContacts: SalesContact[] = [
  { ...baseRecord('contact-concost-001', 'CON_COST', '2026-08-01T09:10:00.000Z'), customerId: 'customer-concost-001', name: '데모 담당자', companyName: 'DEMO 건설 파트너', department: '견적팀', position: '매니저', email: 'contact.kr@example.invalid', phone: '010-0000-1001', mobile: '010-0000-1001', telephone: '', fax: '', homepage: '', address: '', ownerId: 'demo-concost-admin-001', tags: ['DEMO', '명함'], memo: '합성 데모 연락처', status: 'ACTIVE', googleContactsOptIn: false, googleSyncState: 'NOT_REQUESTED', source: 'BUSINESS_CARD_OCR', sourceBusinessCardId: 'demo-card-concost-001', duplicateStatus: 'CLEAR', lastContactAt: '2026-08-05T01:00:00.000Z' },
  { ...baseRecord('contact-vietqs-001', 'VIET_QS', '2026-08-02T02:10:00.000Z'), customerId: 'customer-vietqs-001', name: 'Demo Contact VN', companyName: 'DEMO Vietnam Client', department: 'Cost', position: 'Manager', email: 'contact.vn@example.invalid', phone: '+84 000 000 1001', mobile: '+84 000 000 1001', telephone: '', fax: '', homepage: '', address: '', ownerId: 'demo-vietqs-admin-001', tags: ['DEMO', 'Business card'], memo: 'Synthetic demo contact', status: 'ACTIVE', googleContactsOptIn: false, googleSyncState: 'NOT_REQUESTED', source: 'BUSINESS_CARD_OCR', sourceBusinessCardId: 'demo-card-vietqs-001', duplicateStatus: 'REVIEW_REQUIRED', lastContactAt: null },
];

export const initialSalesOpportunities: SalesOpportunity[] = [
  { ...baseRecord('sales-concost-001', 'CON_COST', '2026-08-01T09:20:00.000Z'), opportunityName: '도심 복합시설 공사비 검토', customerId: 'customer-concost-001', contactId: 'contact-concost-001', customerName: 'DEMO 건설 파트너', contactRole: '견적 담당자', expectedValue: 85000000, probability: 65, stage: 'PROPOSAL', expectedCloseDate: '2026-08-28', nextAction: '제안 범위와 납기 확정', ownerId: 'demo-concost-admin-001', estimateRequestId: null, projectId: null },
  { ...baseRecord('sales-vietqs-001', 'VIET_QS', '2026-08-02T02:20:00.000Z'), opportunityName: 'Hanoi office quantity review', customerId: 'customer-vietqs-001', contactId: 'contact-vietqs-001', customerName: 'DEMO Vietnam Client', contactRole: 'Cost manager', expectedValue: 42000000, probability: 40, stage: 'QUALIFIED', expectedCloseDate: '2026-09-05', nextAction: 'Confirm drawing package', ownerId: 'demo-vietqs-admin-001', estimateRequestId: null, projectId: null },
];

export const initialSalesActivities: SalesActivity[] = [
  { ...baseRecord('activity-concost-001', 'CON_COST', '2026-08-05T01:00:00.000Z'), customerId: 'customer-concost-001', opportunityId: 'sales-concost-001', contactId: 'contact-concost-001', type: 'MEETING', status: 'DONE', title: '업무범위 검토 미팅', detail: '견적 의뢰 전 범위와 납기를 확인한 합성 데모 활동입니다.', happenedAt: '2026-08-05T01:00:00.000Z', ownerId: 'demo-concost-admin-001' },
  { ...baseRecord('activity-vietqs-001', 'VIET_QS', '2026-08-05T03:00:00.000Z'), customerId: 'customer-vietqs-001', opportunityId: 'sales-vietqs-001', contactId: 'contact-vietqs-001', type: 'TASK', status: 'OPEN', title: 'Confirm drawing package', detail: 'Synthetic follow-up task.', happenedAt: '2026-08-08T03:00:00.000Z', ownerId: 'demo-vietqs-admin-001' },
];

const amounts = calculateFinanceAmounts(32000000);
export const initialFinanceEntries: FinanceEntry[] = [
  { ...baseRecord('finance-concost-001', 'CON_COST', '2026-08-01T09:30:00.000Z'), entryType: 'RECEIVABLE', documentNo: 'FIN-2026-001', title: 'DEMO 프로젝트 1차 기성', counterparty: 'DEMO 건설 파트너', documentDate: '2026-08-01', ...amounts, paidAmount: 12000000, dueDate: '2026-08-25', status: 'REVIEW_PENDING', evidenceStatus: 'READY', evidence: [{ id: 'evidence-demo-001', fileName: 'demo-statement.pdf', state: 'READY', checksum: 'demo-sha256-not-production', classification: 'FINANCE_INTERNAL', createdAt: '2026-08-01T09:31:00.000Z' }], taxInvoiceStatus: 'DRAFT', projectId: 'demo-project-concost-001', projectNo: '2026001', approvalDraftId: null, note: '합성 데모 원장' },
  { ...baseRecord('finance-vietqs-001', 'VIET_QS', '2026-08-02T03:00:00.000Z'), entryType: 'EXPENSE', documentNo: 'FIN-VN-2026-001', title: 'DEMO site survey expense', counterparty: 'DEMO Vietnam Vendor', documentDate: '2026-08-02', supplyAmount: 1800000, vatAmount: 0, totalAmount: 1800000, paidAmount: 0, dueDate: '2026-08-18', status: 'DRAFT', evidenceStatus: 'MISSING', evidence: [], taxInvoiceStatus: 'NOT_REQUIRED', projectId: 'demo-project-vietqs-001', projectNo: 'VQ-2026-001', approvalDraftId: null, note: 'Synthetic demo ledger' },
];

export const initialFinanceClosingItems: FinanceClosingItem[] = [
  { ...baseRecord('closing-concost-001', 'CON_COST', '2026-08-01T09:40:00.000Z'), month: '2026-08', label: '매출·매입 증빙 검토', completed: false, completedAt: null },
  { ...baseRecord('closing-concost-002', 'CON_COST', '2026-08-01T09:41:00.000Z'), month: '2026-08', label: '수금·지급 대사', completed: false, completedAt: null },
  { ...baseRecord('closing-vietqs-001', 'VIET_QS', '2026-08-02T03:10:00.000Z'), month: '2026-08', label: 'Review expense evidence', completed: false, completedAt: null },
];
