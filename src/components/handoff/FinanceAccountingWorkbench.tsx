'use client';

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  BookOpenCheck,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDollarSign,
  FileClock,
  FileLock2,
  GitCompareArrows,
  Layers3,
  ListChecks,
  LockKeyhole,
  Network,
  ReceiptText,
  Scale,
  Server,
  ShieldCheck,
  Waypoints,
  X,
} from 'lucide-react';
import {
  syntheticKoreanDemoAccountingPeriod,
  syntheticKoreanDemoChartOfAccounts,
  syntheticKoreanDemoJournals,
  validateJournal,
  type AccountCode,
  type JournalHeader,
} from '@/lib/financeAccounting';
import type { CompanyId } from '@/types/models';

type Locale = 'ko' | 'vi' | 'en';

export interface FinanceAccountingWorkbenchProps {
  companyId: CompanyId;
  locale: Locale;
  isSimulation: boolean;
  adapterReady: boolean;
}

interface Copy {
  eyebrow: string;
  title: string;
  description: string;
  demoBadge: string;
  demoNotice: string;
  serverBadge: string;
  adapterReady: string;
  backendRequired: string;
  backendBlockedTitle: string;
  backendBlockedBody: string;
  projectionEmptyTitle: string;
  projectionEmptyBody: string;
  scopeUnavailableTitle: string;
  scopeUnavailableBody: string;
  coa: string;
  coaDescription: string;
  version: string;
  status: string;
  effective: string;
  accounts: string;
  postingAccounts: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  normalBalance: string;
  taxTarget: string;
  journalList: string;
  journalListDescription: string;
  noJournals: string;
  journalDetail: string;
  selectJournal: string;
  source: string;
  project: string;
  approval: string;
  posting: string;
  balanced: string;
  debit: string;
  credit: string;
  descriptionLabel: string;
  total: string;
  postingReadiness: string;
  postingReadinessDescription: string;
  companyScope: string;
  approvalComplete: string;
  periodOpen: string;
  balancedJournal: string;
  idempotency: string;
  sourceLineage: string;
  ready: string;
  blocked: string;
  postingAction: string;
  postingDisabledDemo: string;
  postingDisabledServer: string;
  immutableTitle: string;
  immutableBody: string;
  reversalTitle: string;
  reversalBody: string;
  period: string;
  fiscalYear: string;
  periodNumber: string;
  range: string;
  revision: string;
  noOperationalData: string;
  yes: string;
  no: string;
  group: string;
  postingAccount: string;
  notApplicable: string;
}

const COPY: Record<Locale, Copy> = {
  ko: {
    eyebrow: 'FINANCE ACCOUNTING READINESS',
    title: '회계 처리 준비도',
    description: '계정과목, 복식부기 전표, 원천 계보와 전기 조건을 한 화면에서 점검합니다.',
    demoBadge: 'DEMO_LOCAL · SYNTHETIC',
    demoNotice: '아래 자료는 합성 데모입니다. 실제 회사 장부, 법정 회계장부 또는 세무 신고자료가 아닙니다.',
    serverBadge: 'SERVER MODE',
    adapterReady: 'ADAPTER READY',
    backendRequired: 'BACKEND_REQUIRED',
    backendBlockedTitle: '회계 Backend 연결이 필요합니다',
    backendBlockedBody: '서버 모드에서는 합성 전표로 대체하지 않습니다. 회사 범위가 검증된 회계 Adapter와 서버 Projection이 연결되어야 합니다.',
    projectionEmptyTitle: 'Adapter는 준비됐지만 회계 Projection이 없습니다',
    projectionEmptyBody: '이 컴포넌트는 운영 장부를 생성하거나 저장하지 않습니다. Backend가 회사별 계정과목·기간·전표 Projection을 제공해야 합니다.',
    scopeUnavailableTitle: '이 회사의 합성 회계 패키지가 없습니다',
    scopeUnavailableBody: 'CON-COST 합성 자료를 다른 회사에 표시하지 않습니다. 회사별 합성 패키지 또는 Backend Projection이 필요합니다.',
    coa: '계정과목 체계',
    coaDescription: '회사·버전 범위와 전기 가능한 계정의 상태를 확인합니다.',
    version: '버전',
    status: '상태',
    effective: '적용기간',
    accounts: '전체 계정',
    postingAccounts: '전기 가능',
    accountCode: '코드',
    accountName: '계정과목',
    accountType: '유형',
    normalBalance: '정상잔액',
    taxTarget: '부가세',
    journalList: '전표 목록',
    journalListDescription: '행을 선택하면 동일 전표의 차변·대변과 원천 계보를 확인할 수 있습니다.',
    noJournals: '표시할 회사 범위 전표가 없습니다.',
    journalDetail: '선택 전표 상세',
    selectJournal: '전표를 선택하세요.',
    source: '원천문서',
    project: '프로젝트',
    approval: '결재',
    posting: '전기',
    balanced: '대차평형',
    debit: '차변',
    credit: '대변',
    descriptionLabel: '적요',
    total: '합계',
    postingReadiness: '전기 준비도',
    postingReadinessDescription: 'Frontend 확인 항목입니다. 최종 판정과 전기는 Backend 트랜잭션이 수행해야 합니다.',
    companyScope: '회사 범위 일치',
    approvalComplete: '전자결재 승인 완료',
    periodOpen: '회계기간 OPEN',
    balancedJournal: '차변·대변 및 헤더 합계 일치',
    idempotency: '멱등키 존재',
    sourceLineage: '원천문서·Revision 계보 존재',
    ready: '확인',
    blocked: '차단',
    postingAction: '서버 전기 요청',
    postingDisabledDemo: '합성 데모에서는 실제 전기를 실행하지 않습니다.',
    postingDisabledServer: '이 표면에는 DB·Provider 동작이 없습니다. Backend API 연결 후에만 실행할 수 있습니다.',
    immutableTitle: '전기된 전표는 변경할 수 없습니다',
    immutableBody: 'POSTED 전표의 라인이나 금액을 직접 수정·삭제하지 않습니다. 원본은 감사 목적으로 보존합니다.',
    reversalTitle: '오류는 역분개·정정전표로 처리합니다',
    reversalBody: '원전표를 참조하는 REVERSAL 또는 CORRECTION 전표를 새 Revision으로 생성해야 합니다. 현재 화면은 원칙만 표시하며 생성 동작은 제공하지 않습니다.',
    period: '회계기간',
    fiscalYear: '회계연도',
    periodNumber: '기간',
    range: '전기일 범위',
    revision: 'Revision',
    noOperationalData: '운영 장부 데이터 없음',
    yes: '대상',
    no: '아님',
    group: '그룹',
    postingAccount: '전기계정',
    notApplicable: '해당 없음',
  },
  vi: {
    eyebrow: 'FINANCE ACCOUNTING READINESS',
    title: 'Mức độ sẵn sàng hạch toán',
    description: 'Kiểm tra hệ thống tài khoản, bút toán kép, nguồn dữ liệu và điều kiện ghi sổ trên một màn hình.',
    demoBadge: 'DEMO_LOCAL · DỮ LIỆU TỔNG HỢP',
    demoNotice: 'Dữ liệu bên dưới chỉ là dữ liệu demo tổng hợp, không phải sổ kế toán công ty, sổ pháp định hoặc hồ sơ khai thuế.',
    serverBadge: 'CHẾ ĐỘ MÁY CHỦ',
    adapterReady: 'ADAPTER SẴN SÀNG',
    backendRequired: 'BACKEND_REQUIRED',
    backendBlockedTitle: 'Cần kết nối Backend kế toán',
    backendBlockedBody: 'Chế độ máy chủ không thay thế bằng bút toán demo. Cần Adapter kế toán và Projection máy chủ đã xác minh phạm vi công ty.',
    projectionEmptyTitle: 'Adapter đã sẵn sàng nhưng chưa có Projection kế toán',
    projectionEmptyBody: 'Thành phần này không tạo hoặc lưu sổ vận hành. Backend phải cung cấp tài khoản, kỳ và bút toán theo từng công ty.',
    scopeUnavailableTitle: 'Không có gói kế toán tổng hợp cho công ty này',
    scopeUnavailableBody: 'Dữ liệu tổng hợp CON-COST không được hiển thị cho công ty khác. Cần gói riêng theo công ty hoặc Backend Projection.',
    coa: 'Hệ thống tài khoản',
    coaDescription: 'Kiểm tra phạm vi công ty, phiên bản và các tài khoản có thể ghi sổ.',
    version: 'Phiên bản', status: 'Trạng thái', effective: 'Hiệu lực', accounts: 'Tổng tài khoản', postingAccounts: 'Có thể ghi sổ',
    accountCode: 'Mã', accountName: 'Tài khoản', accountType: 'Loại', normalBalance: 'Số dư thường', taxTarget: 'VAT',
    journalList: 'Danh sách bút toán', journalListDescription: 'Chọn một hàng để xem Nợ/Có và nguồn dữ liệu của cùng bút toán.', noJournals: 'Không có bút toán trong phạm vi công ty.',
    journalDetail: 'Chi tiết bút toán đã chọn', selectJournal: 'Hãy chọn bút toán.', source: 'Chứng từ nguồn', project: 'Dự án', approval: 'Phê duyệt', posting: 'Ghi sổ', balanced: 'Cân đối',
    debit: 'Nợ', credit: 'Có', descriptionLabel: 'Diễn giải', total: 'Tổng',
    postingReadiness: 'Mức độ sẵn sàng ghi sổ', postingReadinessDescription: 'Đây là kiểm tra phía Frontend. Backend phải quyết định cuối cùng và ghi sổ trong giao dịch.',
    companyScope: 'Đúng phạm vi công ty', approvalComplete: 'Đã phê duyệt điện tử', periodOpen: 'Kỳ kế toán OPEN', balancedJournal: 'Nợ/Có và tổng tiêu đề khớp', idempotency: 'Có khóa idempotency', sourceLineage: 'Có nguồn chứng từ và Revision',
    ready: 'Đạt', blocked: 'Chặn', postingAction: 'Yêu cầu Backend ghi sổ', postingDisabledDemo: 'Demo tổng hợp không thực hiện ghi sổ thật.', postingDisabledServer: 'Bề mặt này không có hành vi DB hoặc Provider. Chỉ thực hiện sau khi kết nối Backend API.',
    immutableTitle: 'Không thể sửa bút toán đã ghi sổ', immutableBody: 'Không sửa hoặc xóa trực tiếp dòng và số tiền của bút toán POSTED. Bản gốc được giữ lại để kiểm toán.',
    reversalTitle: 'Sửa lỗi bằng bút toán đảo hoặc điều chỉnh', reversalBody: 'Phải tạo REVERSAL hoặc CORRECTION mới tham chiếu bút toán gốc. Màn hình này chỉ hiển thị nguyên tắc và không tạo dữ liệu.',
    period: 'Kỳ kế toán', fiscalYear: 'Năm tài chính', periodNumber: 'Kỳ', range: 'Phạm vi ngày ghi sổ', revision: 'Revision', noOperationalData: 'Không có dữ liệu sổ vận hành', yes: 'Có', no: 'Không', group: 'Nhóm', postingAccount: 'Tài khoản ghi sổ', notApplicable: 'Không áp dụng',
  },
  en: {
    eyebrow: 'FINANCE ACCOUNTING READINESS',
    title: 'Accounting readiness',
    description: 'Review the chart of accounts, double-entry journals, source lineage, and posting conditions in one operational surface.',
    demoBadge: 'DEMO_LOCAL · SYNTHETIC',
    demoNotice: 'The data below is synthetic demo data. It is not a company ledger, statutory book, or tax filing record.',
    serverBadge: 'SERVER MODE', adapterReady: 'ADAPTER READY', backendRequired: 'BACKEND_REQUIRED',
    backendBlockedTitle: 'Accounting Backend connection required', backendBlockedBody: 'Server mode never falls back to synthetic journals. A company-scoped accounting Adapter and server Projection must be connected.',
    projectionEmptyTitle: 'Adapter ready, accounting Projection unavailable', projectionEmptyBody: 'This component does not create or persist operational books. The Backend must provide company-scoped accounts, periods, and journal Projections.',
    scopeUnavailableTitle: 'No synthetic accounting package for this company', scopeUnavailableBody: 'CON-COST synthetic records are never projected into another company. A company-specific package or Backend Projection is required.',
    coa: 'Chart of accounts', coaDescription: 'Review company and version scope plus posting-account availability.', version: 'Version', status: 'Status', effective: 'Effective', accounts: 'Accounts', postingAccounts: 'Posting accounts',
    accountCode: 'Code', accountName: 'Account', accountType: 'Type', normalBalance: 'Normal balance', taxTarget: 'VAT',
    journalList: 'Journal list', journalListDescription: 'Select a row to inspect the debit and credit lines and source lineage of the same journal.', noJournals: 'No company-scoped journals are available.',
    journalDetail: 'Selected journal detail', selectJournal: 'Select a journal.', source: 'Source document', project: 'Project', approval: 'Approval', posting: 'Posting', balanced: 'Balanced', debit: 'Debit', credit: 'Credit', descriptionLabel: 'Description', total: 'Total',
    postingReadiness: 'Posting readiness', postingReadinessDescription: 'These are frontend checks. Final authorization and posting must run in a Backend transaction.', companyScope: 'Company scope matches', approvalComplete: 'Electronic approval complete', periodOpen: 'Accounting period OPEN', balancedJournal: 'Debit, credit, and header totals match', idempotency: 'Idempotency key present', sourceLineage: 'Source document and revision present',
    ready: 'Ready', blocked: 'Blocked', postingAction: 'Request server posting', postingDisabledDemo: 'Synthetic demo mode never performs real posting.', postingDisabledServer: 'This surface has no DB or Provider behavior. Posting is available only after Backend API integration.',
    immutableTitle: 'Posted journals are immutable', immutableBody: 'POSTED lines and amounts are never edited or deleted directly. The original remains available for audit.', reversalTitle: 'Correct errors with reversal and correction journals', reversalBody: 'Create a new REVERSAL or CORRECTION revision that references the original journal. This surface explains the rule and does not create records.',
    period: 'Accounting period', fiscalYear: 'Fiscal year', periodNumber: 'Period', range: 'Posting date range', revision: 'Revision', noOperationalData: 'No operational ledger data', yes: 'Yes', no: 'No', group: 'Group', postingAccount: 'Posting account', notApplicable: 'Not applicable',
  },
};

const PANEL = 'min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_24px_rgba(15,23,42,.06)]';

const accountTypeTone: Record<AccountCode['accountType'], string> = {
  ASSET: 'bg-sky-50 text-sky-800',
  LIABILITY: 'bg-rose-50 text-rose-800',
  EQUITY: 'bg-violet-50 text-violet-800',
  REVENUE: 'bg-emerald-50 text-emerald-800',
  EXPENSE: 'bg-amber-50 text-amber-900',
};

function money(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ko' ? 'ko-KR' : locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

function StatusBadge({ value }: { value: string }) {
  const positive = ['ACTIVE', 'OPEN', 'APPROVED', 'POSTED', 'READY_TO_POST'];
  const warning = ['DRAFT', 'PENDING', 'CLOSING', 'NOT_POSTED', 'REVERSED'];
  const tone = positive.includes(value)
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : warning.includes(value)
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : 'border-red-200 bg-red-50 text-red-800';
  return <span className={`inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[10px] font-black ${tone}`}>{value}</span>;
}

function SummaryMetric({ icon: Icon, label, value, tone = 'text-slate-800 bg-slate-50' }: { icon: typeof Scale; label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[var(--color-border)] bg-white p-3">
      <div className="flex items-center gap-2 text-[10px] font-black text-[var(--color-text-sub)]"><Icon className="h-4 w-4 shrink-0" />{label}</div>
      <div className={`mt-2 truncate rounded px-2 py-1 text-sm font-black ${tone}`} title={value}>{value}</div>
    </div>
  );
}

function EmptyPanel({ icon: Icon, title, body, blocked = false }: { icon: typeof Server; title: string; body: string; blocked?: boolean }) {
  const iconTone = blocked ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-[#475569]';
  return (
    <div className={`grid min-h-48 place-items-center rounded-lg border border-dashed p-6 text-center ${blocked ? 'border-amber-300 bg-amber-50/70' : 'border-[var(--color-border)] bg-[var(--cc-surface-2)]'}`}>
      <div className="max-w-xl">
        <span className={`mx-auto grid h-11 w-11 place-items-center rounded-lg ${iconTone}`}><Icon className="h-5 w-5" /></span>
        <strong className="mt-4 block text-sm font-black">{title}</strong>
        <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">{body}</p>
      </div>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, description }: { icon: typeof Scale; title: string; description: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-orange-50 text-orange-700"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0"><h2 className="text-base font-black text-[var(--color-text-main)]">{title}</h2><p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">{description}</p></div>
    </div>
  );
}

export function FinanceAccountingWorkbench({ companyId, locale, isSimulation, adapterReady }: FinanceAccountingWorkbenchProps) {
  const t = COPY[locale];
  const hasScopedDemo = isSimulation && companyId === syntheticKoreanDemoChartOfAccounts.companyId;
  const accounts = useMemo(() => hasScopedDemo ? syntheticKoreanDemoChartOfAccounts.accounts : [], [hasScopedDemo]);
  const journals = useMemo(() => hasScopedDemo ? syntheticKoreanDemoJournals.filter((journal) => journal.companyId === companyId) : [], [companyId, hasScopedDemo]);
  const period = hasScopedDemo && syntheticKoreanDemoAccountingPeriod.companyId === companyId ? syntheticKoreanDemoAccountingPeriod : null;
  const [selectedJournalId, setSelectedJournalId] = useState<string>(journals[0]?.id ?? '');
  const selectedJournal = journals.find((journal) => journal.id === selectedJournalId) ?? journals[0] ?? null;

  const accountByCode = useMemo(() => new Map(accounts.map((account) => [account.code, account])), [accounts]);
  const accountTree = useMemo(() => accounts.filter((account) => account.parentCode === null).map((root) => ({ root, children: accounts.filter((account) => account.parentCode === root.code) })), [accounts]);
  const journalValidation = selectedJournal ? validateJournal(selectedJournal) : null;
  const runtimeBlocked = !isSimulation && !adapterReady;
  const runtimeMessage = runtimeBlocked
    ? { icon: Server, title: t.backendBlockedTitle, body: t.backendBlockedBody, blocked: true }
    : !isSimulation
      ? { icon: Network, title: t.projectionEmptyTitle, body: t.projectionEmptyBody, blocked: false }
      : !hasScopedDemo
        ? { icon: ShieldCheck, title: t.scopeUnavailableTitle, body: t.scopeUnavailableBody, blocked: true }
        : null;
  const runtimeBadgeTone = isSimulation
    ? 'border-orange-200 bg-orange-50 text-orange-900'
    : 'border-slate-200 bg-slate-50 text-[#334155]';

  const readiness = selectedJournal && period ? [
    { label: t.companyScope, pass: selectedJournal.companyId === companyId && selectedJournal.source.companyId === companyId },
    { label: t.approvalComplete, pass: selectedJournal.approvalState === 'APPROVED' },
    { label: t.periodOpen, pass: period.state === 'OPEN' },
    { label: t.balancedJournal, pass: Boolean(journalValidation?.valid) },
    { label: t.idempotency, pass: selectedJournal.idempotencyKey.trim().length > 0 },
    { label: t.sourceLineage, pass: Boolean(selectedJournal.source.documentId && selectedJournal.source.documentRevision > 0) },
  ] : [];

  return (
    <section className="min-w-0 max-w-full space-y-5 overflow-x-clip" aria-labelledby="finance-accounting-title">
      <header className={`${PANEL} overflow-hidden`}>
        <div className="border-t-2 border-orange-500 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black tracking-[.12em] text-orange-700"><BookOpenCheck className="h-4 w-4" />{t.eyebrow}</div>
              <h1 id="finance-accounting-title" className="mt-2 text-xl font-black text-[var(--color-text-main)] sm:text-2xl">{t.title}</h1>
              <p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-[var(--color-text-sub)]">{t.description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-[10px] font-black ${runtimeBadgeTone}`}><CircleDollarSign className="h-4 w-4" />{isSimulation ? t.demoBadge : t.serverBadge}</span>
              <span className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-[10px] font-black ${adapterReady ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>{adapterReady ? <Check className="h-4 w-4" /> : <Ban className="h-4 w-4" />}{adapterReady ? t.adapterReady : t.backendRequired}</span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-[var(--color-border)] bg-white px-3 text-[10px] font-black">{companyId}</span>
            </div>
          </div>
          {isSimulation && hasScopedDemo && <p role="status" className="mt-5 flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs font-bold leading-5 text-orange-950"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{t.demoNotice}</p>}
        </div>
      </header>

      {runtimeMessage && <EmptyPanel {...runtimeMessage} />}

      <section className={`${PANEL} p-4 sm:p-5`} aria-labelledby="coa-heading">
        <SectionHeading icon={Layers3} title={t.coa} description={t.coaDescription} />
        {accounts.length ? <>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryMetric icon={Waypoints} label={t.version} value={`v${syntheticKoreanDemoChartOfAccounts.version}`} tone="bg-orange-50 text-orange-800" />
            <SummaryMetric icon={ShieldCheck} label={t.status} value={syntheticKoreanDemoChartOfAccounts.state} tone="bg-emerald-50 text-emerald-800" />
            <SummaryMetric icon={CalendarClock} label={t.effective} value={`${syntheticKoreanDemoChartOfAccounts.effectiveFrom} → ∞`} />
            <SummaryMetric icon={ListChecks} label={t.accounts} value={String(accounts.length)} />
            <SummaryMetric icon={ReceiptText} label={t.postingAccounts} value={String(accounts.filter((account) => account.kind === 'POSTING').length)} />
          </dl>
          <div className="mt-5 overflow-hidden rounded-lg border border-[var(--color-border)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-[var(--cc-surface-2)] text-[10px] font-black text-[var(--color-text-sub)]"><tr><th className="px-4 py-3">{t.accountCode}</th><th className="px-4 py-3">{t.accountName}</th><th className="px-4 py-3">{t.accountType}</th><th className="px-4 py-3">{t.normalBalance}</th><th className="px-4 py-3">{t.status}</th><th className="px-4 py-3">{t.taxTarget}</th></tr></thead>
                <tbody>{accountTree.flatMap(({ root, children }) => [root, ...children].map((account) => <tr key={account.id} className={`border-t border-[var(--color-border)] ${account.kind === 'GROUP' ? 'bg-slate-50/80' : 'hover:bg-orange-50/50'}`}><td className="px-4 py-3 font-black">{account.code}</td><td className="px-4 py-3"><span className="flex items-center gap-2" style={{ paddingInlineStart: account.parentCode ? 16 : 0 }}>{account.parentCode && <ChevronRight className="h-3.5 w-3.5 text-orange-600" />}<span className={account.kind === 'GROUP' ? 'font-black' : 'font-bold'}>{account.name}</span></span></td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9px] font-black ${accountTypeTone[account.accountType]}`}>{account.accountType}</span></td><td className="px-4 py-3 font-bold">{account.normalBalance}</td><td className="px-4 py-3 text-[10px] font-black text-[var(--color-text-sub)]">{account.kind === 'GROUP' ? t.group : t.postingAccount}</td><td className="px-4 py-3 font-bold">{account.taxTarget ? t.yes : t.no}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </> : <EmptyPanel icon={Layers3} title={t.noOperationalData} body={runtimeMessage?.body ?? t.scopeUnavailableBody} blocked={runtimeBlocked} />}
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(300px,.75fr)_minmax(0,1.45fr)]">
        <section className={`${PANEL} min-w-0 p-4 sm:p-5`} aria-labelledby="journal-list-heading">
          <SectionHeading icon={ReceiptText} title={t.journalList} description={t.journalListDescription} />
          <div className="mt-5 space-y-2">
            {journals.map((journal) => {
              const validation = validateJournal(journal);
              const selected = selectedJournal?.id === journal.id;
              return <button key={journal.id} type="button" aria-pressed={selected} onClick={() => setSelectedJournalId(journal.id)} className={`w-full rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${selected ? 'border-orange-500 bg-orange-50 shadow-[0_8px_18px_rgba(249,115,22,.12)]' : 'border-[var(--color-border)] bg-white hover:border-orange-300 hover:bg-orange-50/40'}`}><span className="flex items-start justify-between gap-3"><span className="min-w-0"><strong className="block truncate text-sm font-black">{journal.journalNo}</strong><span className="mt-1 block truncate text-[10px] font-bold text-[var(--color-text-sub)]">{journal.source.documentType} · {journal.source.documentRevision}</span></span><StatusBadge value={journal.postingState} /></span><span className="mt-3 grid grid-cols-2 gap-2 text-[10px]"><span><b className="block text-[var(--color-text-sub)]">{t.total}</b><strong className="mt-1 block truncate" title={money(journal.totalDebitKrw, locale)}>{money(journal.totalDebitKrw, locale)}</strong></span><span><b className="block text-[var(--color-text-sub)]">{t.balanced}</b><strong className={validation.valid ? 'mt-1 flex items-center gap-1 text-emerald-700' : 'mt-1 flex items-center gap-1 text-red-700'}>{validation.valid ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}{validation.valid ? t.ready : t.blocked}</strong></span></span></button>;
            })}
            {!journals.length && <EmptyPanel icon={ReceiptText} title={t.noJournals} body={runtimeMessage?.body ?? t.noOperationalData} blocked={runtimeBlocked} />}
          </div>
        </section>

        <section className={`${PANEL} min-w-0 p-4 sm:p-5`} aria-labelledby="journal-detail-heading">
          <SectionHeading icon={GitCompareArrows} title={t.journalDetail} description={selectedJournal ? `${selectedJournal.journalNo} · rev ${selectedJournal.revision}` : t.selectJournal} />
          {selectedJournal ? <JournalDetail journal={selectedJournal} accountByCode={accountByCode} locale={locale} t={t} /> : <div className="mt-5"><EmptyPanel icon={FileClock} title={t.selectJournal} body={t.noJournals} /></div>}
        </section>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-2">
        <section className={`${PANEL} p-4 sm:p-5`} aria-labelledby="posting-readiness-heading">
          <SectionHeading icon={ListChecks} title={t.postingReadiness} description={t.postingReadinessDescription} />
          {readiness.length ? <div className="mt-5 space-y-2">{readiness.map((item) => <div key={item.label} className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-white px-3"><span className="flex items-center gap-2 text-xs font-bold">{item.pass ? <Check className="h-4 w-4 shrink-0 text-emerald-700" /> : <X className="h-4 w-4 shrink-0 text-red-700" />}{item.label}</span><span className={`text-[10px] font-black ${item.pass ? 'text-emerald-700' : 'text-red-700'}`}>{item.pass ? t.ready : t.blocked}</span></div>)}</div> : <div className="mt-5"><EmptyPanel icon={ListChecks} title={t.backendRequired} body={runtimeMessage?.body ?? t.noOperationalData} blocked={runtimeBlocked} /></div>}
          <button type="button" disabled title={isSimulation ? t.postingDisabledDemo : t.postingDisabledServer} className="mt-4 inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-slate-200 px-4 text-xs font-black text-slate-500"><Server className="h-4 w-4" />{t.postingAction}</button>
          <p className="mt-2 text-xs font-bold leading-5 text-amber-800"><AlertTriangle className="mr-1 inline h-4 w-4" />{isSimulation ? t.postingDisabledDemo : t.postingDisabledServer}</p>
        </section>

        <section className={`${PANEL} p-4 sm:p-5`} aria-labelledby="immutability-heading">
          <SectionHeading icon={FileLock2} title={t.immutableTitle} description={t.immutableBody} />
          <div className="mt-5 rounded-lg border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-sky-800"><LockKeyhole className="h-4 w-4" /></span><div><h3 id="immutability-heading" className="text-sm font-black text-sky-950">POSTED → IMMUTABLE</h3><p className="mt-1 text-xs font-semibold leading-5 text-sky-900">{t.immutableBody}</p></div></div>
          </div>
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-amber-900"><GitCompareArrows className="h-4 w-4" /></span><div><h3 className="text-sm font-black text-amber-950">{t.reversalTitle}</h3><p className="mt-1 text-xs font-semibold leading-5 text-amber-900">{t.reversalBody}</p></div></div>
          </div>
        </section>
      </div>

      <section className={`${PANEL} p-4 sm:p-5`} aria-labelledby="accounting-period-heading">
        <SectionHeading icon={CalendarClock} title={t.period} description={period ? `${period.startsOn} → ${period.endsOn}` : t.noOperationalData} />
        {period ? <dl className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><SummaryMetric icon={CalendarClock} label={t.fiscalYear} value={String(period.fiscalYear)} /><SummaryMetric icon={FileClock} label={t.periodNumber} value={String(period.periodNo).padStart(2, '0')} /><SummaryMetric icon={ShieldCheck} label={t.status} value={period.state} tone="bg-emerald-50 text-emerald-800" /><SummaryMetric icon={Waypoints} label={t.range} value={`${period.startsOn} → ${period.endsOn}`} /><SummaryMetric icon={ReceiptText} label={t.revision} value={String(period.revision)} /></dl> : <div className="mt-5"><EmptyPanel icon={CalendarClock} title={t.noOperationalData} body={runtimeMessage?.body ?? t.noOperationalData} blocked={runtimeBlocked} /></div>}
      </section>
    </section>
  );
}

function JournalDetail({ journal, accountByCode, locale, t }: { journal: Readonly<JournalHeader>; accountByCode: Map<string, AccountCode>; locale: Locale; t: Copy }) {
  const validation = validateJournal(journal);
  return (
    <div className="mt-5 min-w-0 space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric icon={ShieldCheck} label={t.approval} value={journal.approvalState} tone="bg-emerald-50 text-emerald-800" />
        <SummaryMetric icon={FileLock2} label={t.posting} value={journal.postingState} tone="bg-sky-50 text-sky-800" />
        <SummaryMetric icon={Scale} label={t.balanced} value={validation.valid ? t.ready : t.blocked} tone={validation.valid ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'} />
        <SummaryMetric icon={Network} label={t.project} value={journal.dimensions.projectNo ?? t.notApplicable} />
      </dl>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg border border-sky-200 bg-sky-50 p-3"><span className="text-[10px] font-black text-sky-800">{t.source}</span><p className="mt-1 break-all text-xs font-bold text-sky-950">{journal.source.documentType}<br />{journal.source.documentId} · rev {journal.source.documentRevision}</p></div>
        <div className="min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3"><span className="text-[10px] font-black text-[var(--color-text-sub)]">IDEMPOTENCY</span><p className="mt-1 break-all text-xs font-bold">{journal.idempotencyKey}</p></div>
      </div>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-[var(--cc-surface-2)] text-[10px] font-black text-[var(--color-text-sub)]"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">{t.accountCode}</th><th className="px-4 py-3">{t.accountName}</th><th className="px-4 py-3">{t.descriptionLabel}</th><th className="px-4 py-3 text-right">{t.debit}</th><th className="px-4 py-3 text-right">{t.credit}</th></tr></thead>
            <tbody>{journal.lines.map((line) => <tr key={line.id} className="border-t border-[var(--color-border)] hover:bg-orange-50/50"><td className="px-4 py-3 font-black text-[var(--color-text-sub)]">{line.lineNo}</td><td className="px-4 py-3 font-black">{line.accountCode}</td><td className="px-4 py-3 font-bold">{accountByCode.get(line.accountCode)?.name ?? '-'}</td><td className="px-4 py-3 font-semibold">{line.description}</td><td className="px-4 py-3 text-right font-black text-sky-800">{line.debitKrw ? money(line.debitKrw, locale) : '-'}</td><td className="px-4 py-3 text-right font-black text-rose-800">{line.creditKrw ? money(line.creditKrw, locale) : '-'}</td></tr>)}</tbody>
            <tfoot className="border-t-2 border-slate-300 bg-slate-50"><tr><th colSpan={4} className="px-4 py-3 text-right text-xs font-black">{t.total}</th><td className="px-4 py-3 text-right text-xs font-black text-sky-800">{money(journal.totalDebitKrw, locale)}</td><td className="px-4 py-3 text-right text-xs font-black text-rose-800">{money(journal.totalCreditKrw, locale)}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FinanceAccountingWorkbench;
