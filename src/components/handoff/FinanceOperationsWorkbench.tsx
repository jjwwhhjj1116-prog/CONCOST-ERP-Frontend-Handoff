'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BookOpenCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  FileCheck2,
  FilePlus2,
  FileSpreadsheet,
  Filter,
  Landmark,
  LockKeyhole,
  Pencil,
  PieChart,
  Plus,
  Receipt,
  Search,
  ShieldAlert,
  TrendingUp,
  Upload,
  XCircle,
} from 'lucide-react';
import {
  type ElementType,
  type FormEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { FinanceHelpExperience } from '@/components/handoff/FinanceHelpExperience';
import { FinanceAccountingWorkbench } from '@/components/handoff/FinanceAccountingWorkbench';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import {
  ActionButtonGroup,
  SemanticActionButton,
} from '@/components/ui/SemanticActionButton';
import { evaluateFinanceAccess } from '@/lib/accessControl';
import {
  buildAgingSummary,
  buildFinanceHistoryUrl,
  budgetExecution,
  closingProgress,
  financeForecast,
  financeProjectProfitability,
  financeRemaining,
  scopeFinanceErpData,
  summarizeCfoCockpit,
  type AgingBucket,
  type BudgetControlLevel,
  type ClosingStatus,
  type FinanceBudgetRecord,
  type FinanceClosingPeriod,
  type FinanceControlEvent,
  type FinanceErpData,
  type FinanceExpenseRecord,
  type FinanceLedgerKind,
  type FinanceLedgerRecord,
  type FinanceProjectProfitability,
  type FinanceTaxInvoice,
  type TaxInvoiceStatus,
} from '@/lib/financeErp';
import {
  exportFinanceErpWorkbook,
  previewFinanceErpFile,
  type FinanceErpImportPreview,
} from '@/lib/financeErpWorkbook';
import {
  bindLedgerRowToProject,
  buildFinanceImportProject,
  inferVatMode,
  reconcileFinanceLedgerRows,
  vatAmountForMode,
  type FinanceProjectResolution,
  type FinanceVatMode,
} from '@/lib/financeEntry';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
} from '@/lib/frontendDataSource';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useAuthStore } from '@/store/authStore';
import {
  type FinanceBudgetDraft,
  type FinanceCashPlanDraft,
  type FinanceExpenseDraft,
  type FinanceLedgerDraft,
  useFinanceErpStore,
} from '@/store/financeErpStore';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import type { CompanyId, Project } from '@/types/models';

type Locale = 'ko' | 'vi' | 'en';
type FinanceView =
  | 'DASHBOARD'
  | 'REVENUE'
  | 'PURCHASES'
  | 'CASHFLOW'
  | 'EXPENSES'
  | 'TAX'
  | 'BUDGET'
  | 'TREASURY'
  | 'PROFITABILITY'
  | 'ACCOUNTING'
  | 'CLOSING'
  | 'CONTROLS';
type DrawerMode =
  | 'CREATE_LEDGER'
  | 'EDIT_LEDGER'
  | 'SETTLEMENT'
  | 'CREATE_EXPENSE'
  | 'CREATE_BUDGET'
  | 'CREATE_CASH_PLAN'
  | 'IMPORT'
  | 'LEDGER_DETAIL'
  | 'PROFIT_DETAIL'
  | 'REOPEN_CLOSING'
  | null;

interface FinanceCopy {
  eyebrow: string;
  title: string;
  description: string;
  views: Record<FinanceView, string>;
  demo: string;
  forbidden: string;
  serverRequired: string;
  search: string;
  filter: string;
  import: string;
  export: string;
  addRevenue: string;
  addPurchase: string;
  addExpense: string;
  addBudget: string;
  addCashPlan: string;
  edit: string;
  save: string;
  cancel: string;
  settle: string;
  amount: string;
  supply: string;
  vat: string;
  total: string;
  balance: string;
  project: string;
  counterparty: string;
  titleField: string;
  documentDate: string;
  dueDate: string;
  status: string;
  source: string;
  evidence: string;
  approval: string;
  noRows: string;
  noBankBalance: string;
  bankProvider: string;
  taxBlocked: string;
  importReady: string;
  validationFailed: string;
  company: string;
  billingRound: string;
  note: string;
  forecast: string;
  inflow: string;
  outflow: string;
  net: string;
  budget: string;
  actual: string;
  execution: string;
  managementProfit: string;
  margin: string;
  officialProfitNotice: string;
  overdue: string;
  providerNotConfigured: string;
  closingChecklist: string;
  closingLock: string;
  reopenReason: string;
  next: string;
  resolved: string;
  resolve: string;
  sourceTrace: string;
  audit: string;
  partial: string;
  alerts: string;
  drillDown: string;
  fileReady: string;
  importHint: string;
  cfoSummary: string;
  aging: string;
  cashCalendar: string;
  all: string;
}

const COPY: Record<Locale, FinanceCopy> = {
  ko: {
    eyebrow: 'CON-COST FINANCE ERP · CFO COCKPIT',
    title: '재무 운영센터',
    description: 'Project 수주부터 청구·수금·매입·경비·예산·자금·월마감까지 원천과 승인 이력을 연결합니다.',
    views: { DASHBOARD: '재무 대시보드', REVENUE: '매출·채권', PURCHASES: '매입·채무', CASHFLOW: '수금·지급', EXPENSES: '경비·법인카드', TAX: '세금계산서', BUDGET: '예산·실적', TREASURY: '자금계획', PROFITABILITY: 'Project 손익', ACCOUNTING: '회계·전표', CLOSING: '월 결산', CONTROLS: '내부통제' },
    demo: 'DEMO_LOCAL 합성 데이터입니다. 실제 장부·은행잔액·세금계산서 발행 결과가 아닙니다.',
    forbidden: '재무 접근권한이 없습니다.',
    serverRequired: '운영 저장은 Server Adapter와 FINANCE_ACCESS Capability가 필요합니다.',
    search: 'Project번호, 전표, 거래처, 적요 검색', filter: '필터', import: 'Excel 불러오기', export: 'Excel 내보내기',
    addRevenue: '매출 등록', addPurchase: '매입 등록', addExpense: '경비 등록', addBudget: '예산 등록', addCashPlan: '자금계획 등록', edit: '수정', save: '저장', cancel: '취소', settle: '수금·지급 기록',
    amount: '금액', supply: '공급가액', vat: 'VAT', total: '합계', balance: '잔액', project: 'Project', counterparty: '거래처', titleField: '거래 내용(적요)', documentDate: '증빙일', dueDate: '예정일', status: '상태', source: '원천', evidence: '증빙', approval: '전자결재 Draft', noRows: '조건에 맞는 데이터가 없습니다.',
    noBankBalance: '실시간 은행잔액을 표시하지 않습니다.', bankProvider: 'Bank Provider 연결·권한 확인 후 실제 잔액을 조회할 수 있습니다.', taxBlocked: '세금계산서 Provider 연결 전에는 발행 요청을 완료할 수 없습니다.', importReady: '검토 후 반영할 행', validationFailed: '가져오기 검증에 실패했습니다.', company: '회사', billingRound: '청구회차', note: '메모', forecast: '예측', inflow: '유입', outflow: '유출', net: '순자금', budget: '예산', actual: '집행', execution: '집행률', managementProfit: '관리손익', margin: '마진율', officialProfitNotice: '운영관리용 추정치이며 공식 법정손익이 아닙니다.', overdue: '연체', providerNotConfigured: 'PROVIDER_NOT_CONFIGURED', closingChecklist: '월마감 Checklist', closingLock: '마감 후 변경 잠금', reopenReason: '재오픈 사유', next: '다음 단계', resolved: '해결됨', resolve: '통제 확인 완료', sourceTrace: '원천 추적', audit: '변경이력', partial: '일부', alerts: '통제 알림', drillDown: '원천 보기', fileReady: 'READY File 참조만 연결', importHint: 'Revenue 단일 시트 또는 5개 표준 시트를 검증합니다. 수식·매크로는 차단됩니다.', cfoSummary: '핵심 재무지표', aging: '채권·채무 Aging', cashCalendar: '자금 Calendar', all: '전체',
  },
  vi: {
    eyebrow: 'CON-COST FINANCE ERP · CFO COCKPIT',
    title: 'Trung tâm vận hành tài chính',
    description: 'Kết nối nguồn dữ liệu và lịch sử phê duyệt từ hợp đồng dự án đến hóa đơn, thu chi, ngân sách, dòng tiền và khóa sổ.',
    views: { DASHBOARD: 'Bảng điều khiển', REVENUE: 'Doanh thu & phải thu', PURCHASES: 'Mua hàng & phải trả', CASHFLOW: 'Thu & chi', EXPENSES: 'Chi phí & thẻ công ty', TAX: 'Hóa đơn thuế', BUDGET: 'Ngân sách & thực tế', TREASURY: 'Kế hoạch dòng tiền', PROFITABILITY: 'Lợi nhuận dự án', ACCOUNTING: 'Kế toán & bút toán', CLOSING: 'Khóa sổ tháng', CONTROLS: 'Kiểm soát nội bộ' },
    demo: 'Đây là dữ liệu tổng hợp DEMO_LOCAL, không phải sổ kế toán, số dư ngân hàng hay kết quả phát hành thật.',
    forbidden: 'Bạn không có quyền truy cập tài chính.', serverRequired: 'Cần Server Adapter và FINANCE_ACCESS để lưu dữ liệu vận hành.',
    search: 'Tìm mã dự án, chứng từ, đối tác, nội dung', filter: 'Bộ lọc', import: 'Nhập Excel', export: 'Xuất Excel', addRevenue: 'Thêm doanh thu', addPurchase: 'Thêm mua hàng', addExpense: 'Thêm chi phí', addBudget: 'Thêm ngân sách', addCashPlan: 'Thêm kế hoạch tiền', edit: 'Chỉnh sửa', save: 'Lưu', cancel: 'Hủy', settle: 'Ghi nhận thanh toán', amount: 'Số tiền', supply: 'Giá trị trước thuế', vat: 'VAT', total: 'Tổng', balance: 'Còn lại', project: 'Dự án', counterparty: 'Đối tác', titleField: 'Nội dung', documentDate: 'Ngày chứng từ', dueDate: 'Ngày đến hạn', status: 'Trạng thái', source: 'Nguồn', evidence: 'Chứng từ', approval: 'Bản nháp phê duyệt', noRows: 'Không có dữ liệu phù hợp.', noBankBalance: 'Không hiển thị số dư ngân hàng giả.', bankProvider: 'Số dư thật chỉ hiển thị sau khi kết nối Bank Provider và xác minh quyền.', taxBlocked: 'Không thể hoàn tất yêu cầu phát hành trước khi kết nối Provider hóa đơn.', importReady: 'Dòng sẵn sàng nhập', validationFailed: 'Kiểm tra tệp nhập thất bại.', company: 'Công ty', billingRound: 'Đợt thanh toán', note: 'Ghi chú', forecast: 'Dự báo', inflow: 'Tiền vào', outflow: 'Tiền ra', net: 'Dòng tiền ròng', budget: 'Ngân sách', actual: 'Thực tế', execution: 'Tỷ lệ thực hiện', managementProfit: 'Lợi nhuận quản trị', margin: 'Biên lợi nhuận', officialProfitNotice: 'Chỉ là ước tính quản trị, không phải lợi nhuận pháp định.', overdue: 'Quá hạn', providerNotConfigured: 'PROVIDER_NOT_CONFIGURED', closingChecklist: 'Checklist khóa sổ tháng', closingLock: 'Khóa sau khi đóng kỳ', reopenReason: 'Lý do mở lại', next: 'Bước tiếp theo', resolved: 'Đã xử lý', resolve: 'Xác nhận xử lý', sourceTrace: 'Truy vết nguồn', audit: 'Lịch sử thay đổi', partial: 'Một phần', alerts: 'Cảnh báo kiểm soát', drillDown: 'Xem nguồn', fileReady: 'Chỉ liên kết File READY', importHint: 'Kiểm tra sheet Revenue riêng hoặc bộ 5 sheet chuẩn. Công thức và macro bị chặn.', cfoSummary: 'Chỉ số tài chính chính', aging: 'Tuổi nợ phải thu/trả', cashCalendar: 'Lịch dòng tiền', all: 'Tất cả',
  },
  en: {
    eyebrow: 'CON-COST FINANCE ERP · CFO COCKPIT',
    title: 'Finance operations center',
    description: 'Connect source and approval history from project award through billing, collection, purchasing, expenses, budget, treasury, and close.',
    views: { DASHBOARD: 'Finance dashboard', REVENUE: 'Revenue & AR', PURCHASES: 'Purchases & AP', CASHFLOW: 'Collections & payments', EXPENSES: 'Expense & cards', TAX: 'Tax invoices', BUDGET: 'Budget & actual', TREASURY: 'Treasury plan', PROFITABILITY: 'Project profitability', ACCOUNTING: 'Accounting & journals', CLOSING: 'Monthly close', CONTROLS: 'Internal controls' },
    demo: 'DEMO_LOCAL uses synthetic session data. It is not an operational ledger, live bank balance, or issued tax result.',
    forbidden: 'You do not have finance access.', serverRequired: 'Operational saves require the Server Adapter and FINANCE_ACCESS capability.',
    search: 'Search project number, document, counterparty, description', filter: 'Filter', import: 'Import Excel', export: 'Export Excel', addRevenue: 'Add revenue', addPurchase: 'Add purchase', addExpense: 'Add expense', addBudget: 'Add budget', addCashPlan: 'Add cash plan', edit: 'Edit', save: 'Save', cancel: 'Cancel', settle: 'Record settlement', amount: 'Amount', supply: 'Supply amount', vat: 'VAT', total: 'Total', balance: 'Balance', project: 'Project', counterparty: 'Counterparty', titleField: 'Description', documentDate: 'Document date', dueDate: 'Due date', status: 'Status', source: 'Source', evidence: 'Evidence', approval: 'Approval draft', noRows: 'No matching data.', noBankBalance: 'No fake bank balance is displayed.', bankProvider: 'Authorized live balances appear only after the Bank Provider is connected.', taxBlocked: 'Tax issuance cannot complete until the provider is connected.', importReady: 'Rows ready to import', validationFailed: 'Import validation failed.', company: 'Company', billingRound: 'Billing round', note: 'Note', forecast: 'Forecast', inflow: 'Inflow', outflow: 'Outflow', net: 'Net cash', budget: 'Budget', actual: 'Actual', execution: 'Execution rate', managementProfit: 'Management profit', margin: 'Margin', officialProfitNotice: 'Operational management estimate, not statutory profit.', overdue: 'Overdue', providerNotConfigured: 'PROVIDER_NOT_CONFIGURED', closingChecklist: 'Monthly close checklist', closingLock: 'Closed-period lock', reopenReason: 'Reopen reason', next: 'Next step', resolved: 'Resolved', resolve: 'Resolve control', sourceTrace: 'Source trace', audit: 'Change history', partial: 'Partial', alerts: 'Control alerts', drillDown: 'View sources', fileReady: 'READY file references only', importHint: 'Validates a Revenue-only workbook or all five standard sheets. Formulas and macros are blocked.', cfoSummary: 'Core finance metrics', aging: 'AR/AP aging', cashCalendar: 'Cash calendar', all: 'All',
  },
};

const ENTRY_COPY: Record<Locale, {
  titleHelp: string;
  autoVat: string;
  exemptVat: string;
  manualVat: string;
  vatHelp: string;
  payable: string;
  matched: string;
  newProject: string;
  blocked: string;
  projectImportHelp: string;
  importAction: string;
}> = {
  ko: {
    titleHelp: '거래 내용을 짧게 적습니다. 예: 1차 기성 청구, 구조검토 용역비, 외주비 지급',
    autoVat: 'VAT 자동 10%', exemptVat: '면세 0원', manualVat: '직접 입력',
    vatHelp: '일반 과세는 공급가액의 10%를 자동 계산합니다. 면세 또는 별도 세액만 모드를 바꾸세요.',
    payable: '공급가액 + VAT', matched: '기존 프로젝트 연결', newProject: '신규 프로젝트 후보', blocked: '확인 필요',
    projectImportHelp: 'ProjectId를 우선 확인하고, 없으면 같은 회사의 Project번호를 정확히 비교합니다. 프로젝트명만으로 자동 연결하지 않습니다.',
    importAction: '검토한 프로젝트와 재무자료 일괄 반영',
  },
  vi: {
    titleHelp: 'Mô tả ngắn giao dịch, ví dụ: hóa đơn đợt 1, phí tư vấn kết cấu, thanh toán thuê ngoài.',
    autoVat: 'VAT tự động 10%', exemptVat: 'Miễn thuế 0', manualVat: 'Nhập thủ công',
    vatHelp: 'Giao dịch chịu thuế được tính tự động 10% giá trị trước thuế. Chỉ đổi chế độ khi miễn thuế hoặc thuế khác.',
    payable: 'Trước thuế + VAT', matched: 'Liên kết dự án hiện có', newProject: 'Ứng viên dự án mới', blocked: 'Cần kiểm tra',
    projectImportHelp: 'Ưu tiên ProjectId; nếu trống, đối chiếu chính xác mã dự án trong cùng công ty. Không nối tự động chỉ bằng tên.',
    importAction: 'Xác nhận và nhập dự án cùng dữ liệu tài chính',
  },
  en: {
    titleHelp: 'Enter a short transaction description, such as first progress billing, structural review fee, or subcontract payment.',
    autoVat: 'Auto VAT 10%', exemptVat: 'Tax exempt', manualVat: 'Manual VAT',
    vatHelp: 'Taxable entries calculate 10% of supply amount automatically. Change mode only for exempt or exceptional tax.',
    payable: 'Supply + VAT', matched: 'Existing project match', newProject: 'New project candidate', blocked: 'Review required',
    projectImportHelp: 'ProjectId is checked first; otherwise the exact project number is matched inside the selected company. Project names are never used as an automatic join.',
    importAction: 'Confirm projects and import finance rows',
  },
};

const INPUT_CLASS = 'min-h-11 w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';
const PANEL_CLASS = 'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--cc-shadow-1)]';
const AS_OF_DATE = '2026-08-10';
const EMPTY_FINANCE_DATA: FinanceErpData = {
  ledger: [],
  expenses: [],
  taxInvoices: [],
  budgets: [],
  cashPlans: [],
  closings: [],
  controls: [],
};

const money = (value: number, locale: Locale, companyId: CompanyId) => new Intl.NumberFormat(
  locale === 'ko' ? 'ko-KR' : locale === 'vi' ? 'vi-VN' : 'en-US',
  { style: 'currency', currency: companyId === 'VIET_QS' ? 'VND' : 'KRW', maximumFractionDigits: 0 },
).format(value);

const percent = (value: number) => `${Number.isFinite(value) ? value.toFixed(1) : '0.0'}%`;
const today = () => new Date().toISOString().slice(0, 10);

const viewAlias: Record<string, FinanceView> = {
  SALES_PURCHASES: 'REVENUE',
  TAX_INVOICES: 'TAX',
  CASHFLOW: 'CASHFLOW',
  BUDGET: 'BUDGET',
  EXPENSES: 'EXPENSES',
  TREASURY: 'TREASURY',
  CLOSING: 'CLOSING',
  ACCOUNTING: 'ACCOUNTING',
};

const normalizeView = (value: string | null): FinanceView => {
  if (!value) return 'DASHBOARD';
  if (value in viewAlias) return viewAlias[value];
  return (['DASHBOARD', 'REVENUE', 'PURCHASES', 'CASHFLOW', 'EXPENSES', 'TAX', 'BUDGET', 'TREASURY', 'PROFITABILITY', 'ACCOUNTING', 'CLOSING', 'CONTROLS'] as FinanceView[]).includes(value as FinanceView)
    ? value as FinanceView
    : 'DASHBOARD';
};

const emptyLedger = (kind: FinanceLedgerKind, project?: Project): FinanceLedgerDraft => ({
  kind,
  projectId: project?.id ?? '',
  projectNo: project?.projectNo ?? '',
  projectName: project?.title ?? '',
  counterparty: project?.clientName ?? '',
  title: '',
  billingRound: 1,
  documentDate: today(),
  dueDate: today(),
  supplyAmount: 0,
  vatAmount: 0,
  note: '',
});

const emptyExpense = (project?: Project): FinanceExpenseDraft => ({
  projectId: project?.id ?? null,
  projectNo: project?.projectNo ?? '',
  title: '',
  category: '',
  paymentMethod: 'CORPORATE_CARD',
  spentAt: today(),
  amount: 0,
  policyStatus: 'COMPLIANT',
  policyMessage: '',
});

const emptyBudget = (): FinanceBudgetDraft => ({
  scope: 'COMPANY',
  scopeId: 'CON_COST',
  scopeName: 'CON-COST',
  account: '',
  category: '',
  periodType: 'MONTH',
  period: today().slice(0, 7),
  budgetAmount: 0,
  committedAmount: 0,
  actualAmount: 0,
  forecastAmount: 0,
  controlLevel: 'INFO',
});

const emptyCashPlan = (project?: Project): FinanceCashPlanDraft => ({
  projectId: project?.id ?? null,
  projectNo: project?.projectNo ?? '',
  title: '',
  direction: 'IN',
  plannedDate: today(),
  amount: 0,
  fixed: false,
  sourceType: 'MANUAL',
  sourceId: null,
  status: 'PLANNED',
});

export function FinanceOperationsWorkbench() {
  const { locale, setLocale } = useHandoffLocale();
  const t = COPY[locale];
  const mode = getRuntimeExecutionMode();
  const companyId = useUiStore((state) => state.brandWorkspace) as CompanyId;
  const currentUser = useAuthStore((state) => state.currentUser);
  const access = currentUser ? evaluateFinanceAccess(currentUser, mode) : null;
  const actorId = currentUser?.id ?? 'demo-finance-admin';
  const store = useFinanceErpStore();
  const projectRecords = useProjectStore((state) => state.projects);
  const searchParams = useSearchParams();
  const view = normalizeView(searchParams.get('financeView') ?? searchParams.get('view'));
  const selectedLedgerId = searchParams.get('financeId');
  const selectedProjectId = searchParams.get('projectId');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [ledgerDraft, setLedgerDraft] = useState<FinanceLedgerDraft>(() => emptyLedger('REVENUE'));
  const [vatMode, setVatMode] = useState<FinanceVatMode>('AUTO_10');
  const [expenseDraft, setExpenseDraft] = useState<FinanceExpenseDraft>(() => emptyExpense());
  const [budgetDraft, setBudgetDraft] = useState<FinanceBudgetDraft>(() => emptyBudget());
  const [cashDraft, setCashDraft] = useState<FinanceCashPlanDraft>(() => emptyCashPlan());
  const [settlementAmount, setSettlementAmount] = useState(0);
  const [reopenReason, setReopenReason] = useState('');
  const [importPreview, setImportPreview] = useState<FinanceErpImportPreview | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const replaceProjects = useProjectStore((state) => state.replaceProjects);

  const adapterReady = process.env.NEXT_PUBLIC_FINANCE_ADAPTER_READY === 'true';
  const taxProviderReady = process.env.NEXT_PUBLIC_TAX_PROVIDER_READY === 'true';
  const bankProviderReady = process.env.NEXT_PUBLIC_BANK_PROVIDER_READY === 'true';
  const boundary = getFrontendModuleBoundary('FINANCE', { locale, adapterReady });

  const financeData = useMemo<FinanceErpData>(() => ({
    ledger: store.ledger,
    expenses: store.expenses,
    taxInvoices: store.taxInvoices,
    budgets: store.budgets,
    cashPlans: store.cashPlans,
    closings: store.closings,
    controls: store.controls,
  }), [store.budgets, store.cashPlans, store.closings, store.controls, store.expenses, store.ledger, store.taxInvoices]);
  const runtimeData = boundary.isSimulation ? financeData : EMPTY_FINANCE_DATA;
  const scoped = useMemo(() => scopeFinanceErpData(runtimeData, companyId), [companyId, runtimeData]);
  const projects = useMemo(
    () => boundary.isSimulation
      ? projectRecords.filter((project) => project.companyId === companyId)
      : [],
    [boundary.isSimulation, companyId, projectRecords],
  );
  const importResolutions = useMemo(
    () => importPreview
      ? reconcileFinanceLedgerRows([...importPreview.revenue, ...importPreview.purchase], projectRecords, companyId)
      : [],
    [companyId, importPreview, projectRecords],
  );
  const importBlockingReasons = useMemo(
    () => importResolutions
      .filter((resolution) => resolution.status === 'BLOCKED')
      .map((resolution) => `${resolution.row.projectNo || resolution.key}: ${resolution.reason}`),
    [importResolutions],
  );
  const summary = useMemo(() => summarizeCfoCockpit(scoped), [scoped]);
  const profitability = useMemo(() => financeProjectProfitability(scoped), [scoped]);
  const revenueAging = useMemo(() => buildAgingSummary(scoped.ledger, 'REVENUE', AS_OF_DATE), [scoped.ledger]);
  const purchaseAging = useMemo(() => buildAgingSummary(scoped.ledger, 'PURCHASE', AS_OF_DATE), [scoped.ledger]);
  const selectedLedger = scoped.ledger.find((record) => record.id === selectedLedgerId) ?? null;
  const selectedProfit = profitability.find((record) => record.projectId === selectedProjectId) ?? null;
  const currentClosing = scoped.closings[0];

  const setUrl = (changes: Record<string, string | null>) => {
    const href = buildFinanceHistoryUrl(window.location.pathname, searchParams.toString(), changes);
    window.history.pushState(null, '', href);
  };

  const switchView = (next: FinanceView) => setUrl({ financeView: next, financeId: null, projectId: null });

  const run = async <T,>(simulate: () => T | Promise<T>) => {
    setBusy(true);
    setError('');
    try {
      const result = await executeFrontendMutation(boundary, { simulate });
      setMessage(result.message);
      if (result.kind === 'BLOCKED') setError(result.message);
      return result;
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : 'FINANCE_OPERATION_FAILED';
      setError(detail);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const openLedger = (kind: FinanceLedgerKind, record?: FinanceLedgerRecord) => {
    setLedgerDraft(record ? {
      kind: record.kind,
      projectId: record.projectId,
      projectNo: record.projectNo,
      projectName: record.projectName,
      counterparty: record.counterparty,
      title: record.title,
      billingRound: record.billingRound,
      documentDate: record.documentDate,
      dueDate: record.dueDate,
      supplyAmount: record.supplyAmount,
      vatAmount: record.vatAmount,
      note: record.note,
    } : emptyLedger(kind, projects[0]));
    setVatMode(record ? inferVatMode(record.supplyAmount, record.vatAmount) : 'AUTO_10');
    setDrawer(record ? 'EDIT_LEDGER' : 'CREATE_LEDGER');
  };

  const submitLedger = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => {
      if (drawer === 'EDIT_LEDGER' && selectedLedger) {
        store.updateLedger(companyId, selectedLedger.id, ledgerDraft, actorId);
        return selectedLedger.id;
      }
      return store.createLedger(companyId, ledgerDraft, actorId);
    });
    if (result && result.kind !== 'BLOCKED') {
      setDrawer(null);
      setUrl({ financeView: ledgerDraft.kind === 'REVENUE' ? 'REVENUE' : 'PURCHASES', financeId: result.data });
    }
  };

  const submitSettlement = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedLedger) return;
    const result = await run(() => store.recordSettlement(companyId, selectedLedger.id, settlementAmount, actorId));
    if (result && result.kind !== 'BLOCKED') setDrawer(null);
  };

  const submitExpense = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => store.createExpense(companyId, expenseDraft, actorId));
    if (result && result.kind !== 'BLOCKED') {
      setDrawer(null);
      switchView('EXPENSES');
    }
  };

  const submitBudget = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => store.createBudget(companyId, budgetDraft, actorId));
    if (result && result.kind !== 'BLOCKED') {
      setDrawer(null);
      switchView('BUDGET');
    }
  };

  const submitCashPlan = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => store.createCashPlan(companyId, cashDraft, actorId));
    if (result && result.kind !== 'BLOCKED') {
      setDrawer(null);
      switchView('TREASURY');
    }
  };

  const readImport = async (file?: File) => {
    if (!file) return;
    setError('');
    try {
      setImportPreview(await previewFinanceErpFile(file));
      setDrawer('IMPORT');
    } catch (cause) {
      setImportPreview(null);
      setError(cause instanceof Error ? cause.message : 'FINANCE_IMPORT_FAILED');
    }
  };

  const confirmImport = async () => {
    if (!importPreview || importPreview.errors.length || importBlockingReasons.length) return;
    const result = await run(() => {
      const ids: string[] = [];
      const createdProjects = new Map<string, Project>();
      for (const resolution of importResolutions) {
        let project = resolution.project;
        if (resolution.status === 'CREATE_CANDIDATE' && resolution.candidateKey) {
          project = createdProjects.get(resolution.candidateKey) ?? buildFinanceImportProject(companyId, resolution.row);
          createdProjects.set(resolution.candidateKey, project);
        }
        if (!project) throw new Error(`FINANCE_IMPORT_PROJECT_UNRESOLVED:${resolution.key}`);
        const row = bindLedgerRowToProject(resolution.row, project);
        const id = store.createLedger(companyId, row, actorId);
        ids.push(id);
        if (row.settledAmount > 0) store.recordSettlement(companyId, id, row.settledAmount, actorId);
      }
      importPreview.cashflow.forEach((row) => ids.push(store.createCashPlan(companyId, { ...row, projectId: row.projectId || null, sourceId: row.sourceId || null }, actorId)));
      importPreview.expenses.forEach((row) => ids.push(store.createExpense(companyId, { ...row, projectId: row.projectId || null }, actorId)));
      importPreview.budgets.forEach((row) => ids.push(store.createBudget(companyId, row, actorId)));
      if (createdProjects.size) replaceProjects([...projectRecords, ...createdProjects.values()]);
      return ids;
    });
    if (result && result.kind !== 'BLOCKED') {
      setDrawer(null);
      setImportPreview(null);
    }
  };

  const filteredLedger = useMemo(() => scoped.ledger.filter((record) => {
    const text = `${record.documentNo} ${record.projectNo} ${record.projectName} ${record.counterparty} ${record.title}`.toLowerCase();
    const statusMatches = statusFilter === 'ALL' || record.status === statusFilter;
    return text.includes(query.toLowerCase()) && statusMatches;
  }), [query, scoped.ledger, statusFilter]);

  if (!access?.allowed) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-950">
        <ShieldAlert className="h-8 w-8" />
        <h1 className="mt-3 text-xl font-black">{t.forbidden}</h1>
        <p className="mt-2 text-sm font-semibold">{access?.reason ?? 'AUTH_REQUIRED'} · {t.serverRequired}</p>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-4 pb-12">
      <FinanceHeader
        companyId={companyId}
        locale={locale}
        summary={summary}
        showMetrics={boundary.isSimulation}
        t={t}
        onLocale={setLocale}
        onView={switchView}
        guideControls={(
          <FinanceHelpExperience
            locale={locale}
            companyId={companyId}
            userId={actorId}
            currentView={view}
            onViewChange={switchView}
          />
        )}
      />
      <div data-finance-guide="safety" className="space-y-3">
        <RuntimeCapabilityPanel boundary={boundary} />
        {boundary.isSimulation && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-950">
            {t.demo}
          </p>
        )}
      </div>
      <FinanceNavigation view={view} t={t} onChange={switchView} />
      {view !== 'ACCOUNTING' && <FinanceToolbar
        view={view}
        query={query}
        statusFilter={statusFilter}
        t={t}
        onQuery={setQuery}
        onStatus={setStatusFilter}
        onAdd={() => {
          if (view === 'PURCHASES') openLedger('PURCHASE');
          else if (view === 'EXPENSES') {
            setExpenseDraft(emptyExpense(projects[0]));
            setDrawer('CREATE_EXPENSE');
          } else if (view === 'BUDGET') {
            setBudgetDraft({ ...emptyBudget(), scopeId: companyId, scopeName: companyId === 'CON_COST' ? 'CON-COST' : 'Viet QS' });
            setDrawer('CREATE_BUDGET');
          } else if (view === 'TREASURY' || view === 'CASHFLOW') {
            setCashDraft(emptyCashPlan(projects[0]));
            setDrawer('CREATE_CASH_PLAN');
          } else openLedger('REVENUE');
        }}
        onImport={() => importRef.current?.click()}
        onExport={() => void run(async () => {
          await exportFinanceErpWorkbook(scoped);
          return true;
        })}
      />}
      <input ref={importRef} type="file" accept=".xlsx" className="sr-only" onChange={(event) => void readImport(event.target.files?.[0])} />
      {(message || error) && <MessageBanner message={error || message} error={Boolean(error)} />}

      <div data-finance-guide="workspace" className="min-w-0">
        {view === 'DASHBOARD' && (
          <DashboardView
            data={scoped}
            locale={locale}
            companyId={companyId}
            t={t}
            revenueAging={revenueAging}
            purchaseAging={purchaseAging}
            onView={switchView}
          />
        )}
        {(view === 'REVENUE' || view === 'PURCHASES') && (
          <LedgerWorkspace
            records={filteredLedger.filter((record) => record.kind === (view === 'REVENUE' ? 'REVENUE' : 'PURCHASE'))}
            selected={selectedLedger}
            locale={locale}
            companyId={companyId}
            t={t}
            onSelect={(record) => setUrl({ financeView: view, financeId: record.id })}
            onDetail={(record) => {
              setUrl({ financeView: view, financeId: record.id });
              setDrawer('LEDGER_DETAIL');
            }}
            onEdit={(record) => {
              setUrl({ financeView: view, financeId: record.id });
              openLedger(record.kind, record);
            }}
            onSettlement={(record) => {
              setUrl({ financeView: view, financeId: record.id });
              setSettlementAmount(financeRemaining(record));
              setDrawer('SETTLEMENT');
            }}
          />
        )}
        {view === 'CASHFLOW' && <CashflowView data={scoped} locale={locale} companyId={companyId} t={t} revenueAging={revenueAging} purchaseAging={purchaseAging} />}
        {view === 'EXPENSES' && <ExpenseView records={scoped.expenses} locale={locale} companyId={companyId} t={t} />}
        {view === 'TAX' && (
          <TaxView
            records={scoped.taxInvoices}
            locale={locale}
            companyId={companyId}
            t={t}
            providerReady={taxProviderReady}
            busy={busy}
            onTransition={(record, next) => void run(() => store.transitionTaxInvoice(companyId, record.id, next, taxProviderReady, actorId))}
          />
        )}
        {view === 'BUDGET' && <BudgetView records={scoped.budgets} locale={locale} companyId={companyId} t={t} />}
        {view === 'TREASURY' && <TreasuryView data={scoped} locale={locale} companyId={companyId} t={t} providerReady={bankProviderReady} />}
        {view === 'PROFITABILITY' && (
          <ProfitabilityView
            records={profitability}
            locale={locale}
            companyId={companyId}
            t={t}
            onDetail={(record) => {
              setUrl({ financeView: 'PROFITABILITY', projectId: record.projectId });
              setDrawer('PROFIT_DETAIL');
            }}
          />
        )}
        {view === 'ACCOUNTING' && (
          <FinanceAccountingWorkbench
            companyId={companyId}
            locale={locale}
            isSimulation={boundary.isSimulation}
            adapterReady={adapterReady}
          />
        )}
        {view === 'CLOSING' && currentClosing && (
          <ClosingView
            period={currentClosing}
            t={t}
            busy={busy}
            onToggle={(itemId) => void run(() => store.toggleClosingChecklist(companyId, currentClosing.id, itemId, actorId))}
            onTransition={(next) => void run(() => store.transitionClosing(companyId, currentClosing.id, next, actorId))}
            onReopen={() => setDrawer('REOPEN_CLOSING')}
          />
        )}
        {view === 'CLOSING' && !currentClosing && <EmptyState label={t.noRows} />}
        {view === 'CONTROLS' && (
          <ControlsView
            records={scoped.controls}
            t={t}
            busy={busy}
            onResolve={(record) => void run(() => store.resolveControl(companyId, record.id, actorId))}
          />
        )}
      </div>

      <DetailDrawer
        open={drawer !== null}
        title={drawerTitle(drawer, t)}
        description={boundary.isSimulation ? t.demo : t.serverRequired}
        canEdit={!['LEDGER_DETAIL', 'PROFIT_DETAIL'].includes(drawer ?? '')}
        onClose={() => setDrawer(null)}
        footer={<DrawerFooter drawer={drawer} t={t} busy={busy} importPreview={importPreview} importBlockingReasons={importBlockingReasons} locale={locale} onClose={() => setDrawer(null)} onImport={() => void confirmImport()} />}
      >
        {(drawer === 'CREATE_LEDGER' || drawer === 'EDIT_LEDGER') && <LedgerForm value={ledgerDraft} projects={projects} t={t} locale={locale} vatMode={vatMode} onVatMode={setVatMode} onChange={setLedgerDraft} onSubmit={submitLedger} />}
        {drawer === 'SETTLEMENT' && selectedLedger && <SettlementForm record={selectedLedger} value={settlementAmount} locale={locale} companyId={companyId} t={t} onChange={setSettlementAmount} onSubmit={submitSettlement} />}
        {drawer === 'CREATE_EXPENSE' && <ExpenseForm value={expenseDraft} projects={projects} t={t} onChange={setExpenseDraft} onSubmit={submitExpense} />}
        {drawer === 'CREATE_BUDGET' && <BudgetForm value={budgetDraft} t={t} onChange={setBudgetDraft} onSubmit={submitBudget} />}
        {drawer === 'CREATE_CASH_PLAN' && <CashPlanForm value={cashDraft} projects={projects} t={t} onChange={setCashDraft} onSubmit={submitCashPlan} />}
        {drawer === 'IMPORT' && <ImportPreview preview={importPreview} resolutions={importResolutions} t={t} locale={locale} />}
        {drawer === 'LEDGER_DETAIL' && selectedLedger && <LedgerDetail record={selectedLedger} locale={locale} companyId={companyId} t={t} />}
        {drawer === 'PROFIT_DETAIL' && selectedProfit && <ProfitDetail record={selectedProfit} data={scoped} locale={locale} companyId={companyId} t={t} />}
        {drawer === 'REOPEN_CLOSING' && currentClosing && (
          <form id="finance-reopen-form" onSubmit={async (event) => {
            event.preventDefault();
            const result = await run(() => store.transitionClosing(companyId, currentClosing.id, 'REOPENED', actorId, reopenReason));
            if (result && result.kind !== 'BLOCKED') setDrawer(null);
          }}>
            <Field label={t.reopenReason}>
              <textarea autoFocus required minLength={5} value={reopenReason} onChange={(event) => setReopenReason(event.target.value)} className={`${INPUT_CLASS} min-h-32`} />
            </Field>
          </form>
        )}
      </DetailDrawer>
    </section>
  );
}

function FinanceHeader({ companyId, locale, summary, showMetrics, t, onLocale, onView, guideControls }: {
  companyId: CompanyId;
  locale: Locale;
  summary: ReturnType<typeof summarizeCfoCockpit>;
  showMetrics: boolean;
  t: FinanceCopy;
  onLocale: (locale: Locale) => void;
  onView: (view: FinanceView) => void;
  guideControls: ReactNode;
}) {
  const unavailable = '—';
  const baseCards: Array<{ label: string; value: string; icon: ElementType; tone: string; view: FinanceView }> = [
    { label: t.views.REVENUE, value: money(summary.revenue, locale, companyId), icon: ArrowUpRight, tone: 'text-emerald-700 bg-emerald-50', view: 'REVENUE' },
    { label: t.views.PURCHASES, value: money(summary.purchase, locale, companyId), icon: ArrowDownRight, tone: 'text-rose-700 bg-rose-50', view: 'PURCHASES' },
    { label: t.views.CASHFLOW, value: money(summary.collectionDue, locale, companyId), icon: Banknote, tone: 'text-sky-700 bg-sky-50', view: 'CASHFLOW' },
    { label: t.balance, value: money(summary.receivable, locale, companyId), icon: Clock3, tone: 'text-amber-700 bg-amber-50', view: 'CASHFLOW' },
    { label: t.views.TREASURY, value: money(summary.plannedFunds, locale, companyId), icon: Landmark, tone: 'text-indigo-700 bg-indigo-50', view: 'TREASURY' },
    { label: t.views.BUDGET, value: percent(summary.budgetExecutionRate), icon: PieChart, tone: 'text-violet-700 bg-violet-50', view: 'BUDGET' },
    { label: t.views.EXPENSES, value: money(summary.expense, locale, companyId), icon: Receipt, tone: 'text-orange-700 bg-orange-50', view: 'EXPENSES' },
    { label: t.managementProfit, value: money(summary.projectProfit, locale, companyId), icon: TrendingUp, tone: 'text-teal-700 bg-teal-50', view: 'PROFITABILITY' },
    { label: t.views.CLOSING, value: percent(summary.closingProgress), icon: BookOpenCheck, tone: 'text-blue-700 bg-blue-50', view: 'CLOSING' },
    { label: t.alerts, value: String(summary.alerts), icon: AlertTriangle, tone: 'text-red-700 bg-red-50', view: 'CONTROLS' },
  ];
  const cards = baseCards.map((card) => ({
    ...card,
    value: showMetrics ? card.value : unavailable,
  }));
  return (
    <header data-finance-guide="summary" className={`${PANEL_CLASS} overflow-hidden border-t-4 border-t-orange-500`}>
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-[10px] font-black tracking-[.14em] text-orange-700">{t.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black text-[var(--color-text-main)]">{t.title}</h1>
          <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[var(--color-text-sub)]">{t.description}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
            <span className="rounded-full bg-orange-100 px-3 py-1 text-orange-800">{t.company}: {companyId}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">AS OF {AS_OF_DATE}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {guideControls}
          <HandoffLanguageToggle locale={locale} onChange={onLocale} />
        </div>
      </div>
      <div className="grid grid-cols-2 border-t border-[var(--color-border)] sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((card) => (
          <button key={`${card.label}-${card.view}`} type="button" onClick={() => onView(card.view)} className="group min-h-28 border-b border-r border-[var(--color-border)] p-4 text-left transition hover:bg-[var(--cc-surface-2)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500">
            <span className={`grid h-8 w-8 place-items-center rounded-lg ${card.tone}`}><card.icon className="h-4 w-4" /></span>
            <span className="mt-3 block text-[10px] font-black text-[var(--color-text-sub)]">{card.label}</span>
            <strong className="mt-1 block truncate text-base font-black text-[var(--color-text-main)]">{card.value}</strong>
          </button>
        ))}
      </div>
    </header>
  );
}

function FinanceNavigation({ view, t, onChange }: { view: FinanceView; t: FinanceCopy; onChange: (view: FinanceView) => void }) {
  return (
    <nav data-finance-guide="navigation" aria-label="Finance modules" className={`${PANEL_CLASS} cc-scrollbar overflow-x-auto p-2`}>
      <div className="flex min-w-max items-center gap-1">
        {(Object.keys(t.views) as FinanceView[]).map((item) => (
          <button key={item} type="button" onClick={() => onChange(item)} aria-current={view === item ? 'page' : undefined} className={`min-h-11 rounded-lg px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${view === item ? 'bg-orange-600 text-white shadow-sm' : 'text-[var(--color-text-sub)] hover:bg-orange-50 hover:text-orange-800'}`}>
            {t.views[item]}
          </button>
        ))}
      </div>
    </nav>
  );
}

function FinanceToolbar({ view, query, statusFilter, t, onQuery, onStatus, onAdd, onImport, onExport }: {
  view: FinanceView;
  query: string;
  statusFilter: string;
  t: FinanceCopy;
  onQuery: (value: string) => void;
  onStatus: (value: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onExport: () => void;
}) {
  const addLabel = view === 'PURCHASES' ? t.addPurchase : view === 'EXPENSES' ? t.addExpense : view === 'BUDGET' ? t.addBudget : view === 'TREASURY' || view === 'CASHFLOW' ? t.addCashPlan : t.addRevenue;
  const addVisible = ['REVENUE', 'PURCHASES', 'CASHFLOW', 'EXPENSES', 'BUDGET', 'TREASURY'].includes(view);
  return (
    <div data-finance-guide="toolbar" className={`${PANEL_CLASS} flex flex-wrap items-center gap-3 p-3`}>
      <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 sm:min-w-80">
        <Search className="h-4 w-4 shrink-0 text-[var(--color-text-sub)]" />
        <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={t.search} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" />
      </label>
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-xs font-black">
        <Filter className="h-4 w-4" />
        <select value={statusFilter} onChange={(event) => onStatus(event.target.value)} className="bg-transparent outline-none">
          <option value="ALL">{t.all}</option>
          {['PLANNED', 'READY', 'PARTIAL', 'SETTLED', 'OVERDUE', 'CANCELLED'].map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
      </label>
      <ActionButtonGroup label="Finance data actions">
        {addVisible && <SemanticActionButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={onAdd}>{addLabel}</SemanticActionButton>}
        <SemanticActionButton variant="document" size="sm" icon={<Upload className="h-4 w-4" />} onClick={onImport}>{t.import}</SemanticActionButton>
        <SemanticActionButton variant="document" size="sm" icon={<Download className="h-4 w-4" />} onClick={onExport}>{t.export}</SemanticActionButton>
      </ActionButtonGroup>
    </div>
  );
}

function DashboardView({ data, locale, companyId, t, revenueAging, purchaseAging, onView }: {
  data: FinanceErpData;
  locale: Locale;
  companyId: CompanyId;
  t: FinanceCopy;
  revenueAging: Record<AgingBucket, number>;
  purchaseAging: Record<AgingBucket, number>;
  onView: (view: FinanceView) => void;
}) {
  const forecasts = [7, 30, 90].map((days) => financeForecast(data, AS_OF_DATE, days));
  const profit = financeProjectProfitability(data);
  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <section className={`${PANEL_CLASS} p-5 xl:col-span-7`}>
        <SectionTitle icon={Banknote} title={t.aging} action={t.views.CASHFLOW} onAction={() => onView('CASHFLOW')} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <AgingPanel kind="REVENUE" data={revenueAging} locale={locale} companyId={companyId} />
          <AgingPanel kind="PURCHASE" data={purchaseAging} locale={locale} companyId={companyId} />
        </div>
      </section>
      <section className={`${PANEL_CLASS} p-5 xl:col-span-5`}>
        <SectionTitle icon={Landmark} title={t.views.TREASURY} action={t.views.TREASURY} onAction={() => onView('TREASURY')} />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {forecasts.map((forecast) => <ForecastCard key={forecast.days} forecast={forecast} locale={locale} companyId={companyId} />)}
        </div>
      </section>
      <section className={`${PANEL_CLASS} p-5 xl:col-span-7`}>
        <SectionTitle icon={TrendingUp} title={t.views.PROFITABILITY} action={t.drillDown} onAction={() => onView('PROFITABILITY')} />
        <div className="mt-4 space-y-3">
          {profit.slice(0, 4).map((project) => {
            const width = Math.max(0, Math.min(100, project.marginRate));
            return <button key={project.projectId} type="button" onClick={() => onView('PROFITABILITY')} className="block w-full rounded-lg border border-[var(--color-border)] p-3 text-left transition hover:border-teal-300 hover:bg-teal-50/50 focus-visible:ring-2 focus-visible:ring-teal-500">
              <span className="flex items-center justify-between gap-3"><strong className="truncate text-sm font-black">{project.projectNo} · {project.projectName}</strong><span className="text-xs font-black text-teal-800">{percent(project.marginRate)}</span></span>
              <span className="mt-3 block h-2 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-teal-600" style={{ width: `${width}%` }} /></span>
              <span className="mt-2 flex justify-between text-[10px] font-bold text-[var(--color-text-sub)]"><span>{t.managementProfit}</span><span>{money(project.managementProfit, locale, companyId)}</span></span>
            </button>;
          })}
        </div>
      </section>
      <section className={`${PANEL_CLASS} p-5 xl:col-span-5`}>
        <SectionTitle icon={ShieldAlert} title={t.alerts} action={t.views.CONTROLS} onAction={() => onView('CONTROLS')} />
        <div className="mt-4 space-y-2">
          {data.controls.filter((control) => !control.resolved).slice(0, 5).map((control) => <ControlRow key={control.id} control={control} />)}
          {!data.controls.some((control) => !control.resolved) && <EmptyState label={t.noRows} compact />}
        </div>
      </section>
      <section className={`${PANEL_CLASS} p-5 xl:col-span-12`}>
        <SectionTitle icon={PieChart} title={t.views.BUDGET} action={t.views.BUDGET} onAction={() => onView('BUDGET')} />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {data.budgets.slice(0, 3).map((record) => <BudgetSummaryCard key={record.id} record={record} locale={locale} companyId={companyId} />)}
        </div>
      </section>
    </div>
  );
}

function LedgerWorkspace({ records, selected, locale, companyId, t, onSelect, onDetail, onEdit, onSettlement }: {
  records: FinanceLedgerRecord[];
  selected: FinanceLedgerRecord | null;
  locale: Locale;
  companyId: CompanyId;
  t: FinanceCopy;
  onSelect: (record: FinanceLedgerRecord) => void;
  onDetail: (record: FinanceLedgerRecord) => void;
  onEdit: (record: FinanceLedgerRecord) => void;
  onSettlement: (record: FinanceLedgerRecord) => void;
}) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={`${PANEL_CLASS} min-w-0 overflow-hidden`}>
        <div className="cc-scrollbar overflow-x-auto">
          <table className="w-full min-w-[920px] text-left text-xs">
            <thead className="bg-[var(--cc-surface-2)]">
              <tr>{['No', t.project, t.counterparty, t.titleField, t.billingRound, t.total, t.balance, t.dueDate, t.status, ''].map((label, index) => <th key={`${label}-${index}`} className="border-b border-[var(--color-border)] px-3 py-3 font-black">{label}</th>)}</tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} tabIndex={0} onClick={() => onSelect(record)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect(record); }} className={`cursor-pointer border-b border-[var(--color-border)] transition hover:bg-orange-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 ${selected?.id === record.id ? 'bg-orange-50 shadow-[inset_4px_0_0_#ea580c]' : ''}`}>
                  <td className="px-3 py-3 font-black">{record.documentNo}</td>
                  <td className="px-3 py-3"><span className="font-black">{record.projectNo}</span><span className="mt-1 block max-w-40 truncate text-[10px] text-[var(--color-text-sub)]">{record.projectName}</span></td>
                  <td className="px-3 py-3 font-semibold">{record.counterparty}</td>
                  <td className="px-3 py-3 font-semibold">{record.title}</td>
                  <td className="px-3 py-3 text-center">{record.billingRound}</td>
                  <td className="px-3 py-3 font-black">{money(record.totalAmount, locale, companyId)}</td>
                  <td className="px-3 py-3 font-black text-orange-800">{money(financeRemaining(record), locale, companyId)}</td>
                  <td className={`px-3 py-3 ${record.status === 'OVERDUE' ? 'font-black text-red-700' : ''}`}>{record.dueDate}</td>
                  <td className="px-3 py-3"><StatusBadge status={record.status} /></td>
                  <td className="px-3 py-3"><button type="button" onClick={(event) => { event.stopPropagation(); onDetail(record); }} className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--color-border)] hover:bg-orange-100" aria-label={t.drillDown}><ChevronRight className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!records.length && <EmptyState label={t.noRows} />}
      </section>
      <aside className={`${PANEL_CLASS} h-fit p-5 xl:sticky xl:top-20`}>
        {selected ? (
          <>
            <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black tracking-[.12em] text-orange-700">{selected.documentNo}</p><h2 className="mt-1 text-lg font-black">{selected.title}</h2><p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">{selected.projectNo} · {selected.counterparty}</p></div><StatusBadge status={selected.status} /></div>
            <dl className="mt-5 grid grid-cols-2 gap-2"><Info label={t.supply} value={money(selected.supplyAmount, locale, companyId)} /><Info label={t.vat} value={money(selected.vatAmount, locale, companyId)} /><Info label={t.total} value={money(selected.totalAmount, locale, companyId)} /><Info label={t.balance} value={money(financeRemaining(selected), locale, companyId)} /></dl>
            <div className="mt-5 flex flex-wrap gap-2"><SemanticActionButton size="sm" variant="edit" icon={<Pencil className="h-4 w-4" />} onClick={() => onEdit(selected)}>{t.edit}</SemanticActionButton>{financeRemaining(selected) > 0 && <SemanticActionButton size="sm" variant="save" icon={<Banknote className="h-4 w-4" />} onClick={() => onSettlement(selected)}>{t.settle}</SemanticActionButton>}<SemanticActionButton size="sm" variant="view" onClick={() => onDetail(selected)}>{t.drillDown}</SemanticActionButton></div>
            <Link href={`/approvals?compose=1&financeEntryId=${encodeURIComponent(selected.id)}&projectId=${encodeURIComponent(selected.projectId)}`} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-teal-600 bg-teal-50 px-3 text-xs font-black text-teal-800 transition hover:bg-teal-100"><FilePlus2 className="h-4 w-4" />{t.approval}</Link>
          </>
        ) : <EmptyState label={t.noRows} compact />}
      </aside>
    </div>
  );
}

function CashflowView({ data, locale, companyId, t, revenueAging, purchaseAging }: { data: FinanceErpData; locale: Locale; companyId: CompanyId; t: FinanceCopy; revenueAging: Record<AgingBucket, number>; purchaseAging: Record<AgingBucket, number> }) {
  return <div className="grid gap-4 xl:grid-cols-2"><section className={`${PANEL_CLASS} p-5 xl:col-span-2`}><SectionTitle icon={Banknote} title={t.aging} /><div className="mt-4 grid gap-3 md:grid-cols-2"><AgingPanel kind="REVENUE" data={revenueAging} locale={locale} companyId={companyId} /><AgingPanel kind="PURCHASE" data={purchaseAging} locale={locale} companyId={companyId} /></div></section><section className={`${PANEL_CLASS} min-w-0 overflow-hidden xl:col-span-2`}><div className="cc-scrollbar overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-[var(--cc-surface-2)]"><tr>{['No', t.project, t.titleField, t.inflow, t.outflow, t.dueDate, t.source, t.status].map((label) => <th key={label} className="border-b px-3 py-3 font-black">{label}</th>)}</tr></thead><tbody>{data.cashPlans.map((record) => <tr key={record.id} className="border-b border-[var(--color-border)] hover:bg-sky-50/60"><td className="px-3 py-3 font-black">{record.planNo}</td><td className="px-3 py-3">{record.projectNo || '-'}</td><td className="px-3 py-3 font-semibold">{record.title}</td><td className="px-3 py-3 font-black text-emerald-700">{record.direction === 'IN' ? money(record.amount, locale, companyId) : '-'}</td><td className="px-3 py-3 font-black text-rose-700">{record.direction === 'OUT' ? money(record.amount, locale, companyId) : '-'}</td><td className="px-3 py-3">{record.plannedDate}</td><td className="px-3 py-3">{record.sourceType} · {record.sourceId ?? '-'}</td><td className="px-3 py-3"><StatusBadge status={record.status} /></td></tr>)}</tbody></table></div></section></div>;
}

function ExpenseView({ records, locale, companyId, t }: { records: FinanceExpenseRecord[]; locale: Locale; companyId: CompanyId; t: FinanceCopy }) {
  return <section className={`${PANEL_CLASS} min-w-0 overflow-hidden`}><div className="cc-scrollbar overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs"><thead className="bg-[var(--cc-surface-2)]"><tr>{['No', t.project, t.titleField, 'Category', 'Method', t.amount, 'Policy', t.evidence, t.status, ''].map((label, index) => <th key={`${label}-${index}`} className="border-b px-3 py-3 font-black">{label}</th>)}</tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-[var(--color-border)] hover:bg-orange-50/60"><td className="px-3 py-3 font-black">{record.expenseNo}</td><td className="px-3 py-3">{record.projectNo || '-'}</td><td className="px-3 py-3 font-semibold">{record.title}</td><td className="px-3 py-3">{record.category}</td><td className="px-3 py-3">{record.paymentMethod}</td><td className="px-3 py-3 font-black">{money(record.amount, locale, companyId)}</td><td className="px-3 py-3"><StatusBadge status={record.policyStatus} /></td><td className="px-3 py-3">{record.evidenceIds.length ? `${record.evidenceIds.length} READY` : t.fileReady}</td><td className="px-3 py-3"><StatusBadge status={record.postingStatus} /></td><td className="px-3 py-3"><Link href={`/approvals?compose=1&expenseId=${encodeURIComponent(record.id)}&projectId=${encodeURIComponent(record.projectId ?? '')}`} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-teal-600 bg-teal-50 px-2 font-black text-teal-800 hover:bg-teal-100"><FilePlus2 className="h-3.5 w-3.5" />{t.approval}</Link></td></tr>)}</tbody></table></div>{!records.length && <EmptyState label={t.noRows} />}</section>;
}

function TaxView({ records, locale, companyId, t, providerReady, busy, onTransition }: { records: FinanceTaxInvoice[]; locale: Locale; companyId: CompanyId; t: FinanceCopy; providerReady: boolean; busy: boolean; onTransition: (record: FinanceTaxInvoice, next: TaxInvoiceStatus) => void }) {
  return <div className="space-y-3"><p className={`rounded-lg border p-4 text-xs font-bold ${providerReady ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`}>{providerReady ? 'Provider capability detected. Server authorization still applies.' : t.taxBlocked}</p><section className={`${PANEL_CLASS} min-w-0 overflow-hidden`}><div className="cc-scrollbar overflow-x-auto"><table className="w-full min-w-[940px] text-left text-xs"><thead className="bg-[var(--cc-surface-2)]"><tr>{['No', 'Direction', t.project, t.counterparty, t.documentDate, t.supply, t.vat, t.total, t.status, 'Action'].map((label) => <th key={label} className="border-b px-3 py-3 font-black">{label}</th>)}</tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-[var(--color-border)] hover:bg-amber-50/60"><td className="px-3 py-3 font-black">{record.invoiceNo}</td><td className="px-3 py-3">{record.direction}</td><td className="px-3 py-3">{record.projectNo}</td><td className="px-3 py-3 font-semibold">{record.counterparty}</td><td className="px-3 py-3">{record.issueDate}</td><td className="px-3 py-3">{money(record.supplyAmount, locale, companyId)}</td><td className="px-3 py-3">{money(record.vatAmount, locale, companyId)}</td><td className="px-3 py-3 font-black">{money(record.totalAmount, locale, companyId)}</td><td className="px-3 py-3"><StatusBadge status={record.status} /></td><td className="px-3 py-3"><div className="flex gap-2">{record.status === 'DRAFT' && <SemanticActionButton size="sm" variant="edit" loading={busy} onClick={() => onTransition(record, 'READY')}>READY</SemanticActionButton>}{record.status === 'READY' && <SemanticActionButton size="sm" variant="save" loading={busy} disabled={!providerReady} disabledReason={t.taxBlocked} onClick={() => onTransition(record, 'REQUESTED')}>REQUEST</SemanticActionButton>}{record.status === 'FAILED' && <SemanticActionButton size="sm" variant="warning" loading={busy} onClick={() => onTransition(record, 'READY')}>RETRY READY</SemanticActionButton>}</div></td></tr>)}</tbody></table></div></section></div>;
}

function BudgetView({ records, locale, companyId, t }: { records: FinanceBudgetRecord[]; locale: Locale; companyId: CompanyId; t: FinanceCopy }) {
  return <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">{records.map((record) => <BudgetSummaryCard key={record.id} record={record} locale={locale} companyId={companyId} detailed />)}{!records.length && <div className="lg:col-span-2 xl:col-span-3"><EmptyState label={t.noRows} /></div>}</div>;
}

function TreasuryView({ data, locale, companyId, t, providerReady }: { data: FinanceErpData; locale: Locale; companyId: CompanyId; t: FinanceCopy; providerReady: boolean }) {
  const forecasts = [7, 30, 90].map((days) => financeForecast(data, AS_OF_DATE, days));
  const byDate = [...data.cashPlans].sort((a, b) => a.plannedDate.localeCompare(b.plannedDate));
  return <div className="space-y-4"><section className={`${PANEL_CLASS} p-5`}><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-indigo-700"><Landmark className="h-5 w-5" /></span><div><h2 className="text-lg font-black">{t.noBankBalance}</h2><p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">{providerReady ? t.bankProvider : `${t.providerNotConfigured} · ${t.bankProvider}`}</p></div></div><div className="mt-5 grid grid-cols-3 gap-3">{forecasts.map((forecast) => <ForecastCard key={forecast.days} forecast={forecast} locale={locale} companyId={companyId} />)}</div></section><section className={`${PANEL_CLASS} p-5`}><SectionTitle icon={CalendarDays} title={t.cashCalendar} /><div className="mt-4 divide-y divide-[var(--color-border)]">{byDate.map((record) => <div key={record.id} className="grid gap-2 py-3 sm:grid-cols-[100px_minmax(0,1fr)_160px_110px] sm:items-center"><span className="text-xs font-black">{record.plannedDate}</span><span className="min-w-0"><strong className="block truncate text-sm font-black">{record.title}</strong><small className="text-[10px] font-semibold text-[var(--color-text-sub)]">{record.projectNo || record.sourceType}</small></span><strong className={record.direction === 'IN' ? 'text-emerald-700' : 'text-rose-700'}>{record.direction === 'IN' ? '+' : '-'} {money(record.amount, locale, companyId)}</strong><StatusBadge status={record.status} /></div>)}</div></section></div>;
}

function ProfitabilityView({ records, locale, companyId, t, onDetail }: { records: FinanceProjectProfitability[]; locale: Locale; companyId: CompanyId; t: FinanceCopy; onDetail: (record: FinanceProjectProfitability) => void }) {
  return <section className={`${PANEL_CLASS} min-w-0 overflow-hidden`}><div className="border-b border-[var(--color-border)] bg-teal-50 px-5 py-4 text-xs font-bold text-teal-950">{t.officialProfitNotice}</div><div className="cc-scrollbar overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-xs"><thead className="bg-[var(--cc-surface-2)]"><tr>{[t.project, 'Order', 'Billed', 'Collected', 'Purchase', t.views.EXPENSES, 'AR', 'AP', t.managementProfit, t.margin, ''].map((label) => <th key={label} className="border-b px-3 py-3 font-black">{label}</th>)}</tr></thead><tbody>{records.map((record) => <tr key={record.projectId} className="border-b border-[var(--color-border)] hover:bg-teal-50/60"><td className="px-3 py-3"><strong className="block">{record.projectNo}</strong><span className="text-[10px] text-[var(--color-text-sub)]">{record.projectName}</span></td><td className="px-3 py-3">{money(record.orderAmount, locale, companyId)}</td><td className="px-3 py-3">{money(record.billed, locale, companyId)}</td><td className="px-3 py-3">{money(record.collected, locale, companyId)}</td><td className="px-3 py-3">{money(record.purchases, locale, companyId)}</td><td className="px-3 py-3">{money(record.expenses, locale, companyId)}</td><td className="px-3 py-3">{money(record.receivable, locale, companyId)}</td><td className="px-3 py-3">{money(record.payable, locale, companyId)}</td><td className={`px-3 py-3 font-black ${record.managementProfit >= 0 ? 'text-teal-700' : 'text-red-700'}`}>{money(record.managementProfit, locale, companyId)}</td><td className="px-3 py-3 font-black">{percent(record.marginRate)}</td><td className="px-3 py-3"><SemanticActionButton variant="view" size="sm" onClick={() => onDetail(record)}>{t.drillDown}</SemanticActionButton></td></tr>)}</tbody></table></div></section>;
}

function ClosingView({ period, t, busy, onToggle, onTransition, onReopen }: { period: FinanceClosingPeriod; t: FinanceCopy; busy: boolean; onToggle: (itemId: string) => void; onTransition: (next: ClosingStatus) => void; onReopen: () => void }) {
  const progress = closingProgress(period);
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"><section className={`${PANEL_CLASS} p-5`}><SectionTitle icon={ClipboardCheck} title={`${t.closingChecklist} · ${period.month}`} /><div className="mt-5 space-y-3">{period.checklist.map((item) => <button key={item.id} type="button" disabled={period.status === 'CLOSED' || busy} onClick={() => onToggle(item.id)} className={`flex min-h-16 w-full items-center gap-3 rounded-lg border p-4 text-left transition focus-visible:ring-2 focus-visible:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-60 ${item.completed ? 'border-emerald-300 bg-emerald-50' : 'border-[var(--color-border)] hover:border-orange-300 hover:bg-orange-50'}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${item.completed ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'}`}><Check className="h-4 w-4" /></span><span><strong className="block text-sm font-black">{item.label}</strong><small className="mt-1 block text-[10px] font-semibold text-[var(--color-text-sub)]">{item.ownerRole} · {item.completedAt ?? 'PENDING'}</small></span></button>)}</div></section><aside className={`${PANEL_CLASS} h-fit p-5`}><StatusBadge status={period.status} /><strong className="mt-4 block text-3xl font-black">{percent(progress)}</strong><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div><p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-bold leading-5"><LockKeyhole className="mr-2 inline h-4 w-4" />{t.closingLock}</p><div className="mt-4 space-y-2">{period.status === 'OPEN' && <SemanticActionButton className="w-full" variant="primary" onClick={() => onTransition('IN_PROGRESS')}>IN PROGRESS</SemanticActionButton>}{period.status === 'IN_PROGRESS' && <SemanticActionButton className="w-full" variant="edit" onClick={() => onTransition('REVIEW')}>REVIEW</SemanticActionButton>}{period.status === 'REVIEW' && <><SemanticActionButton className="w-full" variant="success" disabled={progress < 100} disabledReason="CLOSING_CHECKLIST_INCOMPLETE" onClick={() => onTransition('CLOSED')}>CLOSE</SemanticActionButton><SemanticActionButton className="w-full" variant="warning" onClick={() => onTransition('IN_PROGRESS')}>BACK TO REVIEW</SemanticActionButton></>}{period.status === 'CLOSED' && <SemanticActionButton className="w-full" variant="warning" onClick={onReopen}>REOPEN</SemanticActionButton>}{period.status === 'REOPENED' && <SemanticActionButton className="w-full" variant="edit" onClick={() => onTransition('IN_PROGRESS')}>RESUME</SemanticActionButton>}</div></aside></div>;
}

function ControlsView({ records, t, busy, onResolve }: { records: FinanceControlEvent[]; t: FinanceCopy; busy: boolean; onResolve: (record: FinanceControlEvent) => void }) {
  return <div className="grid gap-3 lg:grid-cols-2">{records.map((record) => <article key={record.id} className={`${PANEL_CLASS} border-l-4 p-5 ${record.severity === 'CRITICAL' ? 'border-l-red-600' : record.severity === 'WARNING' ? 'border-l-amber-500' : 'border-l-sky-500'}`}><div className="flex items-start justify-between gap-3"><div><StatusBadge status={record.severity} /><h2 className="mt-3 text-base font-black">{record.title}</h2><p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">{record.detail}</p></div>{record.resolved ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" /> : <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3"><span className="text-[10px] font-bold text-[var(--color-text-sub)]">{record.controlType} · {record.entityType} · {record.entityId}</span>{!record.resolved && <SemanticActionButton variant="success" size="sm" loading={busy} onClick={() => onResolve(record)}>{t.resolve}</SemanticActionButton>}</div></article>)}</div>;
}

function LedgerForm({ value, projects, t, locale, vatMode, onVatMode, onChange, onSubmit }: { value: FinanceLedgerDraft; projects: Project[]; t: FinanceCopy; locale: Locale; vatMode: FinanceVatMode; onVatMode: (mode: FinanceVatMode) => void; onChange: (value: FinanceLedgerDraft) => void; onSubmit: (event: FormEvent) => void }) {
  const entry = ENTRY_COPY[locale];
  const chooseProject = (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    onChange({ ...value, projectId, projectNo: project?.projectNo ?? '', projectName: project?.title ?? '', counterparty: value.counterparty || project?.clientName || '' });
  };
  const changeSupply = (supplyAmount: number) => onChange({
    ...value,
    supplyAmount,
    vatAmount: vatAmountForMode(supplyAmount, vatMode, value.vatAmount),
  });
  const changeVatMode = (mode: FinanceVatMode) => {
    onVatMode(mode);
    onChange({ ...value, vatAmount: vatAmountForMode(value.supplyAmount, mode, value.vatAmount) });
  };
  const totalAmount = value.supplyAmount + value.vatAmount;

  return (
    <form id="finance-ledger-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label={t.project} wide><select required value={value.projectId} onChange={(event) => chooseProject(event.target.value)} className={INPUT_CLASS}><option value="">-</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.projectNo ?? '-'} · {project.title}</option>)}</select></Field>
      <Field label={t.titleField} wide>
        <input autoFocus required value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} placeholder={locale === 'ko' ? '예: 1차 기성 청구' : undefined} className={INPUT_CLASS} />
        <span className="mt-2 block text-[11px] font-semibold leading-4 text-[var(--color-text-sub)]">{entry.titleHelp}</span>
      </Field>
      <Field label={t.counterparty}><input required value={value.counterparty} onChange={(event) => onChange({ ...value, counterparty: event.target.value })} className={INPUT_CLASS} /></Field>
      <Field label={t.billingRound}><input type="number" min="1" required value={value.billingRound} onChange={(event) => onChange({ ...value, billingRound: Number(event.target.value) })} className={INPUT_CLASS} /></Field>
      <Field label={t.documentDate}><input type="date" required value={value.documentDate} onChange={(event) => onChange({ ...value, documentDate: event.target.value })} className={INPUT_CLASS} /></Field>
      <Field label={t.dueDate}><input type="date" required value={value.dueDate} onChange={(event) => onChange({ ...value, dueDate: event.target.value })} className={INPUT_CLASS} /></Field>
      <Field label={t.supply}><input type="number" min="0" required value={value.supplyAmount || ''} onChange={(event) => changeSupply(Number(event.target.value))} className={INPUT_CLASS} /></Field>
      <Field label={t.vat}><input type="number" min="0" required readOnly={vatMode !== 'MANUAL'} value={value.vatAmount} onChange={(event) => onChange({ ...value, vatAmount: Number(event.target.value) })} className={`${INPUT_CLASS} ${vatMode !== 'MANUAL' ? 'cursor-not-allowed bg-sky-50 text-sky-900' : ''}`} /></Field>
      <fieldset className="sm:col-span-2">
        <legend className="text-xs font-black text-[var(--color-text-sub)]">VAT</legend>
        <div className="mt-2 grid grid-cols-3 gap-2" role="radiogroup" aria-label="VAT calculation mode">
          {([['AUTO_10', entry.autoVat], ['EXEMPT', entry.exemptVat], ['MANUAL', entry.manualVat]] as [FinanceVatMode, string][]).map(([mode, label]) => (
            <button key={mode} type="button" role="radio" aria-checked={vatMode === mode} onClick={() => changeVatMode(mode)} className={`min-h-11 rounded-lg border px-2 text-xs font-black transition focus-visible:ring-2 focus-visible:ring-orange-500 ${vatMode === mode ? 'border-orange-500 bg-orange-50 text-orange-800 shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-orange-300 hover:bg-orange-50/60'}`}>{label}</button>
          ))}
        </div>
        <p className="mt-2 text-[11px] font-semibold leading-4 text-[var(--color-text-sub)]">{entry.vatHelp}</p>
      </fieldset>
      <div className="sm:col-span-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4"><span className="text-[10px] font-black text-emerald-800">{entry.payable}</span><strong className="mt-1 block text-xl font-black text-emerald-950">{new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : locale === 'vi' ? 'vi-VN' : 'en-US').format(totalAmount)}</strong></div>
      <Field label={t.note} wide><textarea value={value.note} onChange={(event) => onChange({ ...value, note: event.target.value })} className={`${INPUT_CLASS} min-h-24`} /></Field>
    </form>
  );
}

function SettlementForm({ record, value, locale, companyId, t, onChange, onSubmit }: { record: FinanceLedgerRecord; value: number; locale: Locale; companyId: CompanyId; t: FinanceCopy; onChange: (value: number) => void; onSubmit: (event: FormEvent) => void }) {
  const remaining = financeRemaining(record);
  return <form id="finance-settlement-form" onSubmit={onSubmit} className="space-y-4"><Info label={t.balance} value={money(remaining, locale, companyId)} /><Field label={t.amount}><input autoFocus type="number" required min="1" max={remaining} value={value || ''} onChange={(event) => onChange(Number(event.target.value))} className={INPUT_CLASS} /></Field><p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs font-bold text-sky-900">{t.partial}: {money(value, locale, companyId)} / {money(record.totalAmount, locale, companyId)}</p></form>;
}

function ExpenseForm({ value, projects, t, onChange, onSubmit }: { value: FinanceExpenseDraft; projects: Project[]; t: FinanceCopy; onChange: (value: FinanceExpenseDraft) => void; onSubmit: (event: FormEvent) => void }) {
  return <form id="finance-expense-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Field label={t.project} wide><select value={value.projectId ?? ''} onChange={(event) => { const project = projects.find((item) => item.id === event.target.value); onChange({ ...value, projectId: event.target.value || null, projectNo: project?.projectNo ?? '' }); }} className={INPUT_CLASS}><option value="">-</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.projectNo ?? '-'} · {project.title}</option>)}</select></Field><Field label={t.titleField} wide><input autoFocus required value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} className={INPUT_CLASS} /></Field><Field label="Category"><input required value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })} className={INPUT_CLASS} /></Field><Field label="Payment method"><select value={value.paymentMethod} onChange={(event) => onChange({ ...value, paymentMethod: event.target.value as FinanceExpenseDraft['paymentMethod'] })} className={INPUT_CLASS}>{['CORPORATE_CARD', 'PERSONAL_CARD', 'CASH', 'OTHER'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label={t.documentDate}><input type="date" required value={value.spentAt} onChange={(event) => onChange({ ...value, spentAt: event.target.value })} className={INPUT_CLASS} /></Field><Field label={t.amount}><input type="number" min="0" required value={value.amount || ''} onChange={(event) => onChange({ ...value, amount: Number(event.target.value) })} className={INPUT_CLASS} /></Field><Field label="Policy"><select value={value.policyStatus} onChange={(event) => onChange({ ...value, policyStatus: event.target.value as FinanceExpenseDraft['policyStatus'] })} className={INPUT_CLASS}>{['COMPLIANT', 'WARNING', 'BLOCKED'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Policy message"><input value={value.policyMessage} onChange={(event) => onChange({ ...value, policyMessage: event.target.value })} className={INPUT_CLASS} /></Field><p className="sm:col-span-2 rounded-lg border border-dashed border-sky-300 bg-sky-50 p-4 text-xs font-bold text-sky-900"><FileCheck2 className="mr-2 inline h-4 w-4" />{t.fileReady}</p></form>;
}

function BudgetForm({ value, t, onChange, onSubmit }: { value: FinanceBudgetDraft; t: FinanceCopy; onChange: (value: FinanceBudgetDraft) => void; onSubmit: (event: FormEvent) => void }) {
  return <form id="finance-budget-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Field label="Scope"><select value={value.scope} onChange={(event) => onChange({ ...value, scope: event.target.value as FinanceBudgetDraft['scope'] })} className={INPUT_CLASS}>{['COMPANY', 'ORGANIZATION', 'PROJECT'].map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="Period"><input required value={value.period} onChange={(event) => onChange({ ...value, period: event.target.value })} className={INPUT_CLASS} /></Field><Field label="Scope name" wide><input autoFocus required value={value.scopeName} onChange={(event) => onChange({ ...value, scopeName: event.target.value, scopeId: value.scopeId || event.target.value })} className={INPUT_CLASS} /></Field><Field label="Account"><input required value={value.account} onChange={(event) => onChange({ ...value, account: event.target.value })} className={INPUT_CLASS} /></Field><Field label="Category"><input required value={value.category} onChange={(event) => onChange({ ...value, category: event.target.value })} className={INPUT_CLASS} /></Field><Field label={t.budget}><input type="number" min="0" required value={value.budgetAmount || ''} onChange={(event) => onChange({ ...value, budgetAmount: Number(event.target.value) })} className={INPUT_CLASS} /></Field><Field label="Committed"><input type="number" min="0" value={value.committedAmount || ''} onChange={(event) => onChange({ ...value, committedAmount: Number(event.target.value) })} className={INPUT_CLASS} /></Field><Field label={t.actual}><input type="number" min="0" value={value.actualAmount || ''} onChange={(event) => onChange({ ...value, actualAmount: Number(event.target.value) })} className={INPUT_CLASS} /></Field><Field label={t.forecast}><input type="number" min="0" value={value.forecastAmount || ''} onChange={(event) => onChange({ ...value, forecastAmount: Number(event.target.value) })} className={INPUT_CLASS} /></Field><Field label="Control"><select value={value.controlLevel} onChange={(event) => onChange({ ...value, controlLevel: event.target.value as BudgetControlLevel })} className={INPUT_CLASS}>{['INFO', 'WARN', 'BLOCK'].map((item) => <option key={item}>{item}</option>)}</select></Field></form>;
}

function CashPlanForm({ value, projects, t, onChange, onSubmit }: { value: FinanceCashPlanDraft; projects: Project[]; t: FinanceCopy; onChange: (value: FinanceCashPlanDraft) => void; onSubmit: (event: FormEvent) => void }) {
  return <form id="finance-cash-plan-form" onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2"><Field label={t.project} wide><select value={value.projectId ?? ''} onChange={(event) => { const project = projects.find((item) => item.id === event.target.value); onChange({ ...value, projectId: event.target.value || null, projectNo: project?.projectNo ?? '' }); }} className={INPUT_CLASS}><option value="">-</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.projectNo ?? '-'} · {project.title}</option>)}</select></Field><Field label={t.titleField} wide><input autoFocus required value={value.title} onChange={(event) => onChange({ ...value, title: event.target.value })} className={INPUT_CLASS} /></Field><Field label="Direction"><select value={value.direction} onChange={(event) => onChange({ ...value, direction: event.target.value as FinanceCashPlanDraft['direction'] })} className={INPUT_CLASS}><option value="IN">IN</option><option value="OUT">OUT</option></select></Field><Field label={t.dueDate}><input type="date" required value={value.plannedDate} onChange={(event) => onChange({ ...value, plannedDate: event.target.value })} className={INPUT_CLASS} /></Field><Field label={t.amount}><input type="number" min="0" required value={value.amount || ''} onChange={(event) => onChange({ ...value, amount: Number(event.target.value) })} className={INPUT_CLASS} /></Field><Field label="Source"><select value={value.sourceType} onChange={(event) => onChange({ ...value, sourceType: event.target.value as FinanceCashPlanDraft['sourceType'] })} className={INPUT_CLASS}>{['REVENUE', 'PURCHASE', 'EXPENSE', 'FIXED_COST', 'MANUAL'].map((item) => <option key={item}>{item}</option>)}</select></Field></form>;
}

function ImportPreview({ preview, resolutions, t, locale }: { preview: FinanceErpImportPreview | null; resolutions: FinanceProjectResolution[]; t: FinanceCopy; locale: Locale }) {
  if (!preview) return <EmptyState label={t.importHint} />;
  const entry = ENTRY_COPY[locale];
  const counts = [{ label: 'Revenue', value: preview.revenue.length }, { label: 'Purchase', value: preview.purchase.length }, { label: 'Cashflow', value: preview.cashflow.length }, { label: 'Expense', value: preview.expenses.length }, { label: 'Budget', value: preview.budgets.length }];
  const matched = resolutions.filter((item) => item.status === 'MATCHED_ID' || item.status === 'MATCHED_NO').length;
  const candidates = new Set(resolutions.filter((item) => item.status === 'CREATE_CANDIDATE').map((item) => item.candidateKey)).size;
  const blocked = resolutions.filter((item) => item.status === 'BLOCKED').length;
  return <div className="space-y-4"><p className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-xs font-bold leading-5 text-sky-950">{t.importHint}<br />{entry.projectImportHelp}</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{counts.map((item) => <Info key={item.label} label={item.label} value={String(item.value)} />)}</div><div className="grid grid-cols-3 gap-2"><Info label={entry.matched} value={String(matched)} /><Info label={entry.newProject} value={String(candidates)} /><Info label={entry.blocked} value={String(blocked)} /></div>{resolutions.length > 0 && <div className="cc-scrollbar max-h-72 overflow-auto rounded-lg border border-[var(--color-border)]"><table className="w-full min-w-[640px] text-left text-xs"><thead className="sticky top-0 bg-[var(--cc-surface-2)]"><tr><th className="px-3 py-3">Type</th><th className="px-3 py-3">Project No</th><th className="px-3 py-3">Project</th><th className="px-3 py-3">Result</th></tr></thead><tbody>{resolutions.map((resolution) => { const label = resolution.status === 'CREATE_CANDIDATE' ? entry.newProject : resolution.status === 'BLOCKED' ? entry.blocked : entry.matched; return <tr key={resolution.key} className="border-t border-[var(--color-border)] hover:bg-orange-50/60"><td className="px-3 py-3 font-black">{resolution.row.kind}</td><td className="px-3 py-3 font-black">{resolution.row.projectNo || '-'}</td><td className="px-3 py-3">{resolution.project?.title ?? resolution.row.projectName}</td><td className="px-3 py-3"><StatusBadge status={label} />{resolution.reason && <span className="ml-2 text-[10px] font-bold text-red-700">{resolution.reason}</span>}</td></tr>; })}</tbody></table></div>}<div className={`rounded-lg border p-4 text-xs font-bold ${preview.errors.length || blocked ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{preview.errors.length ? `${t.validationFailed}: ${preview.errors.join(' · ')}` : blocked ? `${t.validationFailed}: ${blocked}` : `${t.importReady}: ${counts.reduce((sum, item) => sum + item.value, 0)} · ${entry.importAction}`}</div></div>;
}

function LedgerDetail({ record, locale, companyId, t }: { record: FinanceLedgerRecord; locale: Locale; companyId: CompanyId; t: FinanceCopy }) {
  return <div className="space-y-4"><dl className="grid grid-cols-2 gap-2"><Info label="No" value={record.documentNo} /><Info label={t.status} value={record.status} /><Info label={t.total} value={money(record.totalAmount, locale, companyId)} /><Info label={t.balance} value={money(financeRemaining(record), locale, companyId)} /></dl><section className="rounded-lg border border-sky-200 bg-sky-50 p-4"><h3 className="flex items-center gap-2 text-sm font-black text-sky-950"><FileCheck2 className="h-4 w-4" />{t.sourceTrace}</h3><p className="mt-2 break-all text-xs font-semibold text-sky-900">projectId={record.projectId}<br />projectNo={record.projectNo}<br />taxInvoiceId={record.taxInvoiceId ?? '-'}<br />evidence={record.evidenceIds.join(', ') || '-'}</p></section><section><h3 className="text-sm font-black">{t.audit}</h3><div className="mt-3 space-y-2">{record.audit.map((event) => <article key={event.id} className="rounded-lg border border-[var(--color-border)] p-3"><div className="flex justify-between gap-2"><strong className="text-xs font-black">{event.action}</strong><span className="text-[10px] text-[var(--color-text-sub)]">rev {event.revision}</span></div><p className="mt-2 text-[10px] font-semibold text-[var(--color-text-sub)]">{event.actorId} · {event.createdAt} · {event.correlationId}</p></article>)}{!record.audit.length && <EmptyState label={t.noRows} compact />}</div></section></div>;
}

function ProfitDetail({ record, data, locale, companyId, t }: { record: FinanceProjectProfitability; data: FinanceErpData; locale: Locale; companyId: CompanyId; t: FinanceCopy }) {
  const sources = [...data.ledger, ...data.expenses].filter((item) => record.sourceIds.includes(item.id));
  return <div className="space-y-4"><p className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-xs font-bold text-teal-950">{t.officialProfitNotice}</p><dl className="grid grid-cols-2 gap-2"><Info label={t.project} value={`${record.projectNo} · ${record.projectName}`} /><Info label={t.margin} value={percent(record.marginRate)} /><Info label={t.managementProfit} value={money(record.managementProfit, locale, companyId)} /><Info label={t.balance} value={money(record.receivable - record.payable, locale, companyId)} /></dl><section><h3 className="text-sm font-black">{t.sourceTrace}</h3><div className="mt-3 space-y-2">{sources.map((source) => <article key={source.id} className="rounded-lg border border-[var(--color-border)] p-3"><div className="flex items-center justify-between gap-3"><strong className="text-xs font-black">{'documentNo' in source ? source.documentNo : source.expenseNo}</strong><span className="text-xs font-black">{money('totalAmount' in source ? source.totalAmount : source.amount, locale, companyId)}</span></div><p className="mt-1 text-[10px] font-semibold text-[var(--color-text-sub)]">{source.id} · revision {source.revision}</p></article>)}</div></section></div>;
}

function DrawerFooter({ drawer, t, busy, importPreview, importBlockingReasons, locale, onClose, onImport }: { drawer: DrawerMode; t: FinanceCopy; busy: boolean; importPreview: FinanceErpImportPreview | null; importBlockingReasons: string[]; locale: Locale; onClose: () => void; onImport: () => void }) {
  if (drawer === 'LEDGER_DETAIL' || drawer === 'PROFIT_DETAIL') return <SemanticActionButton variant="neutral" className="w-full" onClick={onClose}>{t.cancel}</SemanticActionButton>;
  const form = drawer === 'CREATE_LEDGER' || drawer === 'EDIT_LEDGER' ? 'finance-ledger-form' : drawer === 'SETTLEMENT' ? 'finance-settlement-form' : drawer === 'CREATE_EXPENSE' ? 'finance-expense-form' : drawer === 'CREATE_BUDGET' ? 'finance-budget-form' : drawer === 'CREATE_CASH_PLAN' ? 'finance-cash-plan-form' : drawer === 'REOPEN_CLOSING' ? 'finance-reopen-form' : undefined;
  const importErrors = [...(importPreview?.errors ?? []), ...importBlockingReasons];
  return <ActionButtonGroup label="Finance drawer actions" className="justify-end"><SemanticActionButton variant="neutral" onClick={onClose}>{t.cancel}</SemanticActionButton>{drawer === 'IMPORT' ? <SemanticActionButton variant="save" loading={busy} disabled={!importPreview || Boolean(importErrors.length)} disabledReason={importErrors.join(' · ') || 'Preview required'} onClick={onImport}>{ENTRY_COPY[locale].importAction}</SemanticActionButton> : form ? <SemanticActionButton variant="save" type="submit" form={form} loading={busy}>{drawer === 'SETTLEMENT' ? t.settle : t.save}</SemanticActionButton> : null}</ActionButtonGroup>;
}

function drawerTitle(drawer: DrawerMode, t: FinanceCopy) {
  if (drawer === 'CREATE_LEDGER') return t.addRevenue;
  if (drawer === 'EDIT_LEDGER') return t.edit;
  if (drawer === 'SETTLEMENT') return t.settle;
  if (drawer === 'CREATE_EXPENSE') return t.addExpense;
  if (drawer === 'CREATE_BUDGET') return t.addBudget;
  if (drawer === 'CREATE_CASH_PLAN') return t.addCashPlan;
  if (drawer === 'IMPORT') return t.import;
  if (drawer === 'PROFIT_DETAIL') return t.views.PROFITABILITY;
  if (drawer === 'REOPEN_CLOSING') return t.reopenReason;
  return t.drillDown;
}

function AgingPanel({ kind, data, locale, companyId }: { kind: FinanceLedgerKind; data: Record<AgingBucket, number>; locale: Locale; companyId: CompanyId }) {
  const labels: Record<AgingBucket, string> = { CURRENT: 'Current', DAYS_1_30: '1–30', DAYS_31_60: '31–60', DAYS_61_90: '61–90', DAYS_90_PLUS: '90+' };
  const max = Math.max(1, ...Object.values(data));
  return <div className="rounded-lg border border-[var(--color-border)] p-4"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${kind === 'REVENUE' ? 'bg-emerald-500' : 'bg-rose-500'}`} /><strong className="text-sm font-black">{kind === 'REVENUE' ? 'AR · Receivable' : 'AP · Payable'}</strong></div><div className="mt-4 grid grid-cols-5 gap-2">{(Object.keys(labels) as AgingBucket[]).map((bucket) => <div key={bucket} className="min-w-0"><div className="flex h-24 items-end rounded bg-slate-50 p-1"><span className={`block w-full rounded-sm ${kind === 'REVENUE' ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ height: `${Math.max(4, (data[bucket] / max) * 100)}%` }} /></div><span className="mt-2 block text-center text-[9px] font-black">{labels[bucket]}</span><span className="mt-1 block truncate text-center text-[8px] font-bold text-[var(--color-text-sub)]" title={money(data[bucket], locale, companyId)}>{money(data[bucket], locale, companyId)}</span></div>)}</div></div>;
}

function ForecastCard({ forecast, locale, companyId }: { forecast: ReturnType<typeof financeForecast>; locale: Locale; companyId: CompanyId }) {
  return <article className="min-w-0 rounded-lg border border-[var(--color-border)] p-3"><strong className="text-sm font-black">{forecast.days}D</strong><span className="mt-2 block truncate text-xs font-black text-emerald-700">+{money(forecast.inflow, locale, companyId)}</span><span className="mt-1 block truncate text-xs font-black text-rose-700">−{money(forecast.outflow, locale, companyId)}</span><span className="mt-2 block border-t pt-2 text-[10px] font-black">NET {money(forecast.net, locale, companyId)}</span></article>;
}

function BudgetSummaryCard({ record, locale, companyId, detailed = false }: { record: FinanceBudgetRecord; locale: Locale; companyId: CompanyId; detailed?: boolean }) {
  const execution = budgetExecution(record);
  const tone = record.controlLevel === 'BLOCK' ? 'border-red-300' : record.controlLevel === 'WARN' ? 'border-amber-300' : 'border-emerald-300';
  return <article className={`${PANEL_CLASS} ${tone} p-4`}><div className="flex items-start justify-between gap-3"><div><span className="text-[9px] font-black tracking-[.12em] text-[var(--color-text-sub)]">{record.budgetNo} · {record.scope}</span><h3 className="mt-1 text-sm font-black">{record.scopeName}</h3><p className="mt-1 text-[10px] font-semibold text-[var(--color-text-sub)]">{record.account} · {record.period}</p></div><StatusBadge status={record.controlLevel} /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${execution.breached ? 'bg-red-600' : record.controlLevel === 'WARN' ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${Math.min(100, execution.executionRate)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] font-black"><span>{percent(execution.executionRate)}</span><span>{money(record.actualAmount, locale, companyId)} / {money(record.budgetAmount, locale, companyId)}</span></div>{detailed && <dl className="mt-4 grid grid-cols-2 gap-2"><Info label="Committed" value={money(record.committedAmount, locale, companyId)} /><Info label="Forecast" value={money(record.forecastAmount, locale, companyId)} /><Info label="Balance" value={money(execution.balance, locale, companyId)} /><Info label="Available" value={money(execution.availableAfterCommitment, locale, companyId)} /></dl>}</article>;
}

function ControlRow({ control }: { control: FinanceControlEvent }) {
  return <div className={`rounded-lg border p-3 ${control.severity === 'CRITICAL' ? 'border-red-200 bg-red-50' : control.severity === 'WARNING' ? 'border-amber-200 bg-amber-50' : 'border-sky-200 bg-sky-50'}`}><div className="flex items-center justify-between gap-3"><strong className="text-xs font-black">{control.title}</strong><StatusBadge status={control.severity} /></div><p className="mt-2 text-[10px] font-semibold leading-4 text-[var(--color-text-sub)]">{control.detail}</p></div>;
}

function SectionTitle({ icon: Icon, title, action, onAction }: { icon: ElementType; title: string; action?: string; onAction?: () => void }) {
  return <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-orange-50 text-orange-700"><Icon className="h-4 w-4" /></span><h2 className="text-base font-black">{title}</h2></div>{action && onAction && <button type="button" onClick={onAction} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 text-xs font-black text-orange-700 hover:bg-orange-50 focus-visible:ring-2 focus-visible:ring-orange-500">{action}<ChevronRight className="h-4 w-4" /></button>}</div>;
}

function StatusBadge({ status }: { status: string }) {
  const positive = ['SETTLED', 'ISSUED', 'RECEIVED', 'COMPLIANT', 'APPROVED', 'POSTING_CANDIDATE', 'CLOSED', 'INFO', 'READY', 'CONFIRMED'];
  const negative = ['OVERDUE', 'FAILED', 'CANCELLED', 'BLOCKED', 'CRITICAL'];
  const warning = ['PARTIAL', 'WARNING', 'WARN', 'REVIEW', 'REOPENED', 'REQUESTED', 'APPROVAL_PENDING'];
  const tone = positive.includes(status) ? 'bg-emerald-100 text-emerald-800' : negative.includes(status) ? 'bg-red-100 text-red-800' : warning.includes(status) ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black ${tone}`}>{status}</span>;
}

function MessageBanner({ message, error }: { message: string; error: boolean }) {
  return <p role={error ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-xs font-bold ${error ? 'border-red-200 bg-red-50 text-red-900' : 'border-sky-200 bg-sky-50 text-sky-900'}`}>{error ? <XCircle className="mr-2 inline h-4 w-4" /> : <CheckCircle2 className="mr-2 inline h-4 w-4" />}{message}</p>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3"><dt className="text-[9px] font-black text-[var(--color-text-sub)]">{label}</dt><dd className="mt-1 truncate text-xs font-black" title={value}>{value}</dd></div>;
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`text-xs font-black text-[var(--color-text-sub)] ${wide ? 'sm:col-span-2' : ''}`}>{label}<span className="mt-1 block">{children}</span></label>;
}

function EmptyState({ label, compact = false }: { label: string; compact?: boolean }) {
  return <div className={`grid place-items-center rounded-lg border border-dashed border-[var(--color-border)] p-5 text-center text-xs font-bold text-[var(--color-text-sub)] ${compact ? 'min-h-24' : 'min-h-44'}`}><span><FileSpreadsheet className="mx-auto mb-3 h-7 w-7 text-slate-400" />{label}</span></div>;
}
