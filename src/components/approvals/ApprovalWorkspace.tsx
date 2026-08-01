'use client';

import {
  ChangeEvent,
  FormEvent,
  Fragment,
  ReactNode,
  useMemo,
  useState,
  type ElementType,
} from 'react';
import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  FileCheck2,
  FilePlus2,
  FileText,
  Link2,
  Paperclip,
  Plane,
  ReceiptText,
  RotateCcw,
  Send,
  ShieldCheck,
  Stamp,
  X,
} from 'lucide-react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
  type FrontendLocale,
} from '@/lib/frontendDataSource';
import {
  getApproverMissingCopy,
  getRuntimeBoundaryCopy,
} from '@/lib/runtimeBoundaryCopy';
import { getApprovalBoundary } from '@/lib/runtimeExecutionMode';
import { useApprovalStore } from '@/store/approvalStore';
import { useAuthStore } from '@/store/authStore';
import type {
  ApprovalRequest,
  ApprovalRequestType,
  CompanyId,
  PersonnelCard,
} from '@/types/models';

type QueueTab = 'ACTION' | 'PROGRESS' | 'DONE' | 'REJECTED';
type ReviewAction = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';

interface TemplateDefinition {
  id: string;
  type: ApprovalRequestType;
  icon: ElementType;
  tone: string;
}

interface ApprovalCopy {
  eyebrow: string;
  title: string;
  description: string;
  write: string;
  chooseTemplate: string;
  action: string;
  progress: string;
  done: string;
  rejected: string;
  inbox: string;
  inboxDescription: string;
  empty: string;
  emptyDescription: string;
  approve: string;
  reject: string;
  requestChanges: string;
  recall: string;
  view: string;
  close: string;
  draft: string;
  author: string;
  department: string;
  form: string;
  retention: string;
  titleField: string;
  startDate: string;
  endDate: string;
  amount: string;
  contact: string;
  reason: string;
  approvalPolicy: string;
  approvalLine: string;
  projectLink: string;
  claimLink: string;
  noLink: string;
  attachments: string;
  cancel: string;
  submit: string;
  detail: string;
  policyDescription: string;
  blocked: string;
  simulated: string;
}

const COPY: Record<FrontendLocale, ApprovalCopy> = {
  ko: {
    eyebrow: 'APPROVAL CENTER',
    title: '전자결재',
    description: '양식 작성, 결재 정책 검토, 상신과 의사결정을 한 흐름에서 관리합니다.',
    write: '문서 작성',
    chooseTemplate: '문서 양식 선택',
    action: '처리할 결재',
    progress: '진행 문서',
    done: '승인 완료',
    rejected: '반려·취소',
    inbox: '결재 문서함',
    inboxDescription: '현재 회사와 사용자 권한 범위의 결재 문서만 표시합니다.',
    empty: '현재 문서가 없습니다.',
    emptyDescription: '새 문서가 상신되면 이곳에 표시됩니다.',
    approve: '승인',
    reject: '반려',
    requestChanges: '수정 요청',
    recall: '상신 회수',
    view: '보기',
    close: '닫기',
    draft: '결재 초안',
    author: '기안자',
    department: '소속',
    form: '문서 양식',
    retention: '보존 연한',
    titleField: '제목',
    startDate: '시작일',
    endDate: '종료일',
    amount: '금액',
    contact: '거래처 / 방문처',
    reason: '내용 및 사유',
    approvalPolicy: '결재 정책 미리보기',
    approvalLine: '결재선',
    projectLink: 'Project 연결',
    claimLink: 'Claim 연결',
    noLink: '연결 없음',
    attachments: '첨부파일',
    cancel: '취소',
    submit: '결재 상신',
    detail: '결재 문서 상세',
    policyDescription: '순차결재 · 기술본부장 → 부사장 → 대표 · 첫 결재 전 작성자 회수 가능',
    blocked: '결재 Backend Adapter와 Policy capability가 준비되어야 공식 상태를 변경할 수 있습니다.',
    simulated: 'DEMO_LOCAL 시뮬레이션만 완료했습니다. 공식 결재 기록은 변경되지 않았습니다.',
  },
  vi: {
    eyebrow: 'TRUNG TÂM PHÊ DUYỆT',
    title: 'Phê duyệt điện tử',
    description: 'Quản lý biểu mẫu, chính sách, trình duyệt và quyết định trong một luồng.',
    write: 'Tạo văn bản',
    chooseTemplate: 'Chọn biểu mẫu',
    action: 'Cần xử lý',
    progress: 'Đang xử lý',
    done: 'Đã duyệt',
    rejected: 'Từ chối / Thu hồi',
    inbox: 'Hộp phê duyệt',
    inboxDescription: 'Chỉ hiển thị văn bản trong phạm vi công ty và quyền của người dùng.',
    empty: 'Không có văn bản.',
    emptyDescription: 'Văn bản mới sẽ xuất hiện tại đây.',
    approve: 'Phê duyệt',
    reject: 'Từ chối',
    requestChanges: 'Yêu cầu sửa',
    recall: 'Thu hồi',
    view: 'Xem',
    close: 'Đóng',
    draft: 'Bản nháp',
    author: 'Người lập',
    department: 'Bộ phận',
    form: 'Biểu mẫu',
    retention: 'Lưu trữ',
    titleField: 'Tiêu đề',
    startDate: 'Ngày bắt đầu',
    endDate: 'Ngày kết thúc',
    amount: 'Số tiền',
    contact: 'Đối tác / Nơi đến',
    reason: 'Nội dung và lý do',
    approvalPolicy: 'Xem trước chính sách',
    approvalLine: 'Tuyến phê duyệt',
    projectLink: 'Liên kết Project',
    claimLink: 'Liên kết Claim',
    noLink: 'Không liên kết',
    attachments: 'Tệp đính kèm',
    cancel: 'Hủy',
    submit: 'Trình duyệt',
    detail: 'Chi tiết văn bản',
    policyDescription: 'Tuần tự · Trưởng đơn vị → Phó tổng giám đốc → Tổng giám đốc · Có thể thu hồi trước quyết định đầu tiên',
    blocked: 'Cần Backend Adapter và Policy capability trước khi thay đổi trạng thái chính thức.',
    simulated: 'Chỉ hoàn tất mô phỏng DEMO_LOCAL. Hồ sơ phê duyệt chính thức không thay đổi.',
  },
  en: {
    eyebrow: 'APPROVAL CENTER',
    title: 'Electronic Approval',
    description: 'Manage forms, policy review, submission, and decisions in one workflow.',
    write: 'Create document',
    chooseTemplate: 'Choose a form',
    action: 'Needs action',
    progress: 'In progress',
    done: 'Approved',
    rejected: 'Rejected / Recalled',
    inbox: 'Approval inbox',
    inboxDescription: 'Only documents within the current company and permission scope are shown.',
    empty: 'No documents.',
    emptyDescription: 'New submissions will appear here.',
    approve: 'Approve',
    reject: 'Reject',
    requestChanges: 'Request changes',
    recall: 'Recall',
    view: 'View',
    close: 'Close',
    draft: 'Approval draft',
    author: 'Author',
    department: 'Department',
    form: 'Form',
    retention: 'Retention',
    titleField: 'Title',
    startDate: 'Start date',
    endDate: 'End date',
    amount: 'Amount',
    contact: 'Vendor / Destination',
    reason: 'Details and reason',
    approvalPolicy: 'Policy preview',
    approvalLine: 'Approval line',
    projectLink: 'Project link',
    claimLink: 'Claim link',
    noLink: 'No link',
    attachments: 'Attachments',
    cancel: 'Cancel',
    submit: 'Submit',
    detail: 'Approval detail',
    policyDescription: 'Sequential · Department head → Vice president → CEO · Author recall before the first decision',
    blocked: 'The Approval Backend Adapter and Policy capability are required for official state changes.',
    simulated: 'Only the DEMO_LOCAL simulation completed. No official approval record changed.',
  },
};

const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'leave',
    type: 'LEAVE_REQUEST',
    icon: CalendarDays,
    tone: 'bg-emerald-50 text-emerald-700',
  },
  {
    id: 'expense',
    type: 'EXPENSE_APPROVAL',
    icon: ReceiptText,
    tone: 'bg-orange-50 text-orange-700',
  },
  {
    id: 'purchase',
    type: 'PURCHASE_APPROVAL',
    icon: BriefcaseBusiness,
    tone: 'bg-blue-50 text-blue-700',
  },
  {
    id: 'trip',
    type: 'BUSINESS_TRIP',
    icon: Plane,
    tone: 'bg-violet-50 text-violet-700',
  },
  {
    id: 'general',
    type: 'GENERAL_APPROVAL',
    icon: FileText,
    tone: 'bg-slate-100 text-slate-700',
  },
];

const FORM_LABELS: Record<
  FrontendLocale,
  Partial<Record<ApprovalRequestType, [string, string]>>
> = {
  ko: {
    LEAVE_REQUEST: ['휴가신청서', '연차, 반차와 특별휴가 신청'],
    EXPENSE_APPROVAL: ['지출결의서', '경비 및 프로젝트 비용 집행'],
    PURCHASE_APPROVAL: ['구매품의서', '장비, 소프트웨어와 물품 구매'],
    BUSINESS_TRIP: ['출장신청서', '국내외 출장 일정 및 비용'],
    GENERAL_APPROVAL: ['일반품의서', '일반 업무 의사결정 및 승인'],
    SCHEDULE_APPROVAL: ['일정 승인 요청', 'Project 일정 승인'],
  },
  vi: {
    LEAVE_REQUEST: ['Đơn nghỉ phép', 'Nghỉ năm, nửa ngày và nghỉ đặc biệt'],
    EXPENSE_APPROVAL: ['Đề nghị chi phí', 'Chi phí công việc và dự án'],
    PURCHASE_APPROVAL: ['Đề nghị mua hàng', 'Thiết bị, phần mềm và vật tư'],
    BUSINESS_TRIP: ['Đơn công tác', 'Lịch và chi phí công tác'],
    GENERAL_APPROVAL: ['Đề nghị chung', 'Quyết định và phê duyệt chung'],
    SCHEDULE_APPROVAL: ['Duyệt lịch', 'Phê duyệt lịch Project'],
  },
  en: {
    LEAVE_REQUEST: ['Leave request', 'Annual, half-day, and special leave'],
    EXPENSE_APPROVAL: ['Expense approval', 'Business and project expenses'],
    PURCHASE_APPROVAL: ['Purchase request', 'Equipment, software, and supplies'],
    BUSINESS_TRIP: ['Business trip', 'Domestic and overseas business travel'],
    GENERAL_APPROVAL: ['General approval', 'General business decisions'],
    SCHEDULE_APPROVAL: ['Schedule approval', 'Project schedule approval'],
  },
};

const isTerminal = (request: ApprovalRequest) =>
  ['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status);

const personName = (person?: PersonnelCard | null) =>
  person?.displayName || person?.name || 'UNASSIGNED';

const findApprover = (
  users: PersonnelCard[],
  authorId: string,
  predicate: (user: PersonnelCard) => boolean,
) =>
  users.find(
    (user) =>
      user.id !== authorId && user.isActive !== false && predicate(user),
  ) ?? null;

function Modal({
  title,
  onClose,
  children,
  width = 'max-w-3xl',
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0f172a]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`max-h-[92vh] w-full ${width} overflow-hidden border border-white/15 bg-[var(--color-surface)] shadow-2xl`}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <p className="text-[9px] font-black uppercase text-[var(--color-primary)]">
              Electronic approval
            </p>
            <h2 className="mt-1 text-lg font-black">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center border border-[var(--color-border)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="cc-scrollbar max-h-[calc(92vh-76px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ApprovalWorkspace() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const requests = useApprovalStore((state) => state.requests);
  const { brandWorkspace, locale, setLocale } = useHandoffLocale();
  const companyId: CompanyId =
    brandWorkspace === 'VIET_QS' ? 'VIET_QS' : 'CON_COST';
  const copy = COPY[locale];
  const legacyLocale = locale === 'vi' ? 'vi' : 'ko';
  const [tab, setTab] = useState<QueueTab>('ACTION');
  const [templateOpen, setTemplateOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateDefinition | null>(null);
  const [detail, setDetail] = useState<ApprovalRequest | null>(null);
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [amount, setAmount] = useState('');
  const [contact, setContact] = useState('');
  const [projectId, setProjectId] = useState('');
  const [claimId, setClaimId] = useState('');
  const [attachmentNames, setAttachmentNames] = useState<string[]>([]);
  const [message, setMessage] = useState<{
    kind: 'info' | 'error';
    text: string;
  } | null>(null);

  const boundary = getFrontendModuleBoundary('APPROVAL', {
    locale,
    adapterReady:
      process.env.NEXT_PUBLIC_APPROVAL_ADAPTER_READY === 'true' &&
      process.env.NEXT_PUBLIC_APPROVAL_POLICY_READY === 'true',
  });
  const runtimeMode = boundary.mode;
  const approvalBoundary = getApprovalBoundary(runtimeMode);
  const companyUsers = useMemo(
    () => users.filter((user) => user.companyId === companyId),
    [companyId, users],
  );

  if (!currentUser) return null;

  const director = findApprover(
    companyUsers,
    currentUser.id,
    (user) =>
      user.role === 'DEPARTMENT_MANAGER' &&
      user.departmentId === currentUser.departmentId,
  );
  const vicePresident = findApprover(
    companyUsers,
    currentUser.id,
    (user) =>
      user.organizationRank === 'VICE_PRESIDENT' ||
      user.organizationRank === 'COO',
  );
  const ceo = findApprover(
    companyUsers,
    currentUser.id,
    (user) => user.organizationRank === 'CEO',
  );

  const scopedRequests =
    boundary.state === 'DEMO_SIMULATION'
      ? requests.filter((request) => {
          const requester = companyUsers.find(
            (user) => user.id === request.requestedBy,
          );
          return Boolean(requester);
        })
      : [];
  const visibleRequests = scopedRequests.filter(
    (request) =>
      currentUser.role === 'SUPER_ADMIN' ||
      request.requestedBy === currentUser.id ||
      request.approvalLine?.some(
        (step) => step.approverId === currentUser.id,
      ) ||
      request.pmId === currentUser.id ||
      request.managerId === currentUser.id,
  );
  const isActionable = (request: ApprovalRequest) => {
    if (isTerminal(request)) return false;
    if (request.approvalLine?.length) {
      return (
        currentUser.role === 'SUPER_ADMIN' ||
        request.approvalLine[request.currentApprovalStep ?? 0]?.approverId ===
          currentUser.id
      );
    }
    return (
      currentUser.role === 'SUPER_ADMIN' ||
      request.pmId === currentUser.id ||
      request.managerId === currentUser.id
    );
  };
  const queue = visibleRequests.filter((request) => {
    if (tab === 'ACTION') return isActionable(request);
    if (tab === 'PROGRESS') {
      return !isTerminal(request) && !isActionable(request);
    }
    if (tab === 'DONE') return request.status === 'APPROVED';
    return ['REJECTED', 'CANCELLED'].includes(request.status);
  });

  const resetDraft = () => {
    setTitle('');
    setReason('');
    setStartDate('');
    setEndDate('');
    setAmount('');
    setContact('');
    setProjectId('');
    setClaimId('');
    setAttachmentNames([]);
  };

  const openCompose = (template: TemplateDefinition) => {
    const [formTitle] =
      FORM_LABELS[locale][template.type] ??
      FORM_LABELS.en.GENERAL_APPROVAL!;
    setSelectedTemplate(template);
    setTemplateOpen(false);
    resetDraft();
    setTitle(formTitle);
    setMessage(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTemplate || !title.trim() || !reason.trim()) return;
    if (!director || !vicePresident || !ceo) {
      const missing = [
        !director ? 'DEPARTMENT_MANAGER' : '',
        !vicePresident ? 'VICE_PRESIDENT' : '',
        !ceo ? 'CEO' : '',
      ].filter(Boolean);
      setMessage({
        kind: 'error',
        text: `${getApproverMissingCopy(legacyLocale)} ${missing.join(', ')}`,
      });
      return;
    }

    const legacyCopy = getRuntimeBoundaryCopy('APPROVAL',
      approvalBoundary.kind,
      legacyLocale,
    );
    if (approvalBoundary.kind === 'BLOCKED') {
      setMessage({ kind: 'error', text: legacyCopy });
      return;
    }
    const result = await executeFrontendMutation(boundary, {
      simulate: () => ({
        type: selectedTemplate.type,
        title,
        reason,
        projectId: projectId || null,
        claimId: claimId || null,
        attachments: attachmentNames.length,
        approverIds: [director.id, vicePresident.id, ceo.id],
      }),
    });
    if (result.kind === 'BLOCKED') {
      setMessage({ kind: 'error', text: copy.blocked });
      return;
    }
    setMessage({ kind: 'info', text: legacyCopy });
    setSelectedTemplate(null);
  };

  const review = async (request: ApprovalRequest, action: ReviewAction) => {
    const legacyCopy = getRuntimeBoundaryCopy('APPROVAL',
      approvalBoundary.kind,
      legacyLocale,
    );
    const result = await executeFrontendMutation(boundary, {
      simulate: () => ({ requestId: request.id, action }),
    });
    setMessage({
      kind: result.kind === 'BLOCKED' ? 'error' : 'info',
      text: result.kind === 'BLOCKED' ? copy.blocked : legacyCopy,
    });
  };

  const recall = async (request: ApprovalRequest) => {
    if (
      request.requestedBy !== currentUser.id ||
      request.status !== 'PENDING' ||
      (request.currentApprovalStep ?? 0) > 0
    ) {
      return;
    }
    await review(request, 'REQUEST_CHANGES');
  };

  const addAttachments = (event: ChangeEvent<HTMLInputElement>) => {
    setAttachmentNames(
      Array.from(event.target.files ?? [], (file) => file.name),
    );
  };

  const summary = [
    {
      label: copy.action,
      value: visibleRequests.filter(isActionable).length,
      tab: 'ACTION' as const,
      icon: Stamp,
    },
    {
      label: copy.progress,
      value: visibleRequests.filter((request) => !isTerminal(request)).length,
      tab: 'PROGRESS' as const,
      icon: Send,
    },
    {
      label: copy.done,
      value: visibleRequests.filter(
        (request) => request.status === 'APPROVED',
      ).length,
      tab: 'DONE' as const,
      icon: Check,
    },
    {
      label: copy.rejected,
      value: visibleRequests.filter((request) =>
        ['REJECTED', 'CANCELLED'].includes(request.status),
      ).length,
      tab: 'REJECTED' as const,
      icon: X,
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="cc-page-heading">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase text-[#4e6fd8]">
            <ShieldCheck className="h-4 w-4" />
            {copy.eyebrow}
          </p>
          <h1 className="text-[28px] font-black">{copy.title}</h1>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text-sub)]">
            {copy.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HandoffLanguageToggle locale={locale} onChange={setLocale} />
          <button
            type="button"
            onClick={() => setTemplateOpen(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[var(--color-primary)] px-5 text-sm font-black text-white"
          >
            <FilePlus2 className="h-4 w-4" />
            {copy.write}
          </button>
        </div>
      </header>

      <RuntimeCapabilityPanel boundary={boundary} compact />

      {message && (
        <div
          role="status"
          className={`border px-4 py-3 text-xs font-bold ${
            message.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setTab(item.tab)}
              className={`cc-tactile-card flex min-h-[104px] items-center gap-4 p-4 text-left ${
                tab === item.tab ? 'ring-2 ring-[var(--color-primary)]' : ''
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center bg-[#eef2ff] text-[#405bb0]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-[11px] font-black text-[var(--color-text-sub)]">
                  {item.label}
                </span>
                <strong className="mt-1 block font-mono text-3xl font-black">
                  {item.value}
                </strong>
              </span>
            </button>
          );
        })}
      </section>

      <section className="cc-tactile-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black">{copy.inbox}</h2>
            <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-sub)]">
              {copy.inboxDescription}
            </p>
          </div>
          <div className="flex gap-1 bg-[var(--cc-surface-2)] p-1">
            {[
              ['ACTION', copy.action],
              ['PROGRESS', copy.progress],
              ['DONE', copy.done],
              ['REJECTED', copy.rejected],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id as QueueTab)}
                className={`min-h-9 px-3 text-[10px] font-black ${
                  tab === id
                    ? 'bg-[var(--color-surface)] text-[#3453a4] shadow-sm'
                    : 'text-[var(--color-text-sub)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {queue.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center text-center">
              <FileCheck2 className="mb-3 h-9 w-9 text-[#b6c2df]" />
              <strong className="text-sm font-black">{copy.empty}</strong>
              <span className="mt-1 text-xs text-[var(--color-text-sub)]">
                {copy.emptyDescription}
              </span>
            </div>
          ) : (
            queue.map((request) => {
              const requester = companyUsers.find(
                (user) => user.id === request.requestedBy,
              );
              const line = request.approvalLine ?? [];
              const canRecall =
                request.requestedBy === currentUser.id &&
                request.status === 'PENDING' &&
                (request.currentApprovalStep ?? 0) === 0;
              return (
                <article
                  key={request.id}
                  className="grid gap-4 p-5 hover:bg-[#f8faff] dark:hover:bg-white/[.03] lg:grid-cols-[minmax(0,1fr)_340px_auto] lg:items-center"
                >
                  <button
                    type="button"
                    onClick={() => setDetail(request)}
                    className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    <span className="text-[9px] font-bold text-[var(--color-text-sub)]">
                      {FORM_LABELS[locale][request.type]?.[0] ?? request.type}
                    </span>
                    <h3 className="mt-2 truncate text-sm font-black">
                      {request.title}
                    </h3>
                    <p className="mt-1 truncate text-[11px] font-semibold text-[var(--color-text-sub)]">
                      {personName(requester)} · {request.reason}
                    </p>
                  </button>

                  <div className="flex items-center gap-1 overflow-x-auto">
                    {line.length > 0 ? (
                      line.map((step, index) => (
                        <Fragment key={step.id}>
                          <span
                            className={`flex min-h-8 min-w-[82px] flex-col items-center justify-center px-2 text-[9px] font-black ${
                              step.status === 'APPROVED'
                                ? 'bg-emerald-600 text-white'
                                : step.status === 'REJECTED'
                                  ? 'bg-red-600 text-white'
                                  : index ===
                                      (request.currentApprovalStep ?? 0)
                                    ? 'bg-[var(--color-primary)] text-white'
                                    : 'border border-[var(--color-border)] bg-[var(--cc-surface-2)] text-[var(--color-text-sub)]'
                            }`}
                          >
                            <span>{step.label}</span>
                            <small className="mt-0.5 max-w-[74px] truncate text-[8px] opacity-80">
                              {personName(
                                companyUsers.find(
                                  (user) => user.id === step.approverId,
                                ),
                              )}
                            </small>
                          </span>
                          {index < line.length - 1 && (
                            <ChevronRight className="h-3 w-3 shrink-0 text-[var(--color-text-sub)]" />
                          )}
                        </Fragment>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold text-[var(--color-text-sub)]">
                        {copy.approvalPolicy}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    {isActionable(request) && (
                      <>
                        <button
                          type="button"
                          onClick={() => review(request, 'APPROVE')}
                          className="inline-flex min-h-9 items-center gap-1 bg-[#273e7a] px-3 text-[10px] font-black text-white"
                        >
                          <Check className="h-3.5 w-3.5" />
                          {copy.approve}
                        </button>
                        <button
                          type="button"
                          onClick={() => review(request, 'REQUEST_CHANGES')}
                          className="inline-flex min-h-9 items-center gap-1 border border-amber-200 bg-amber-50 px-3 text-[10px] font-black text-amber-800"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          {copy.requestChanges}
                        </button>
                        <button
                          type="button"
                          onClick={() => review(request, 'REJECT')}
                          className="inline-flex min-h-9 items-center gap-1 border border-red-200 bg-red-50 px-3 text-[10px] font-black text-red-700"
                        >
                          <X className="h-3.5 w-3.5" />
                          {copy.reject}
                        </button>
                      </>
                    )}
                    {canRecall && (
                      <button
                        type="button"
                        onClick={() => recall(request)}
                        className="min-h-9 border border-[var(--color-border)] px-3 text-[10px] font-black"
                      >
                        {copy.recall}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setDetail(request)}
                      className="inline-flex min-h-9 items-center gap-1 border border-[var(--color-border)] px-3 text-[10px] font-black"
                    >
                      {copy.view}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {templateOpen && (
        <Modal
          title={copy.chooseTemplate}
          onClose={() => setTemplateOpen(false)}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATES.map((template) => {
              const Icon = template.icon;
              const [formTitle, description] =
                FORM_LABELS[locale][template.type] ??
                FORM_LABELS.en.GENERAL_APPROVAL!;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => openCompose(template)}
                  className="flex min-h-[126px] items-start gap-4 border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4 text-left hover:border-[var(--color-primary)]"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center ${template.tone}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <strong className="block text-sm font-black">
                      {formTitle}
                    </strong>
                    <span className="mt-1 block text-[11px] font-semibold leading-5 text-[var(--color-text-sub)]">
                      {description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {selectedTemplate && (
        <Modal
          title={`${copy.draft} · ${FORM_LABELS[locale][selectedTemplate.type]?.[0] ?? selectedTemplate.type}`}
          onClose={() => setSelectedTemplate(null)}
          width="max-w-4xl"
        >
          <form onSubmit={submit} className="space-y-5">
            <section className="grid gap-4 border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4 sm:grid-cols-4">
              {[
                [copy.author, personName(currentUser)],
                [
                  copy.department,
                  currentUser.departmentName ?? currentUser.departmentId,
                ],
                [
                  copy.form,
                  FORM_LABELS[locale][selectedTemplate.type]?.[0] ??
                    selectedTemplate.type,
                ],
                [copy.retention, '5Y'],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-[9px] font-black text-[var(--color-text-sub)]">
                    {label}
                  </span>
                  <strong className="mt-1 block text-xs">{value}</strong>
                </div>
              ))}
            </section>

            <label className="block text-xs font-black">
              {copy.titleField}
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-black">
                {copy.startDate}
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                />
              </label>
              <label className="text-xs font-black">
                {copy.endDate}
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                />
              </label>
            </div>

            {[
              'EXPENSE_APPROVAL',
              'PURCHASE_APPROVAL',
              'BUSINESS_TRIP',
            ].includes(selectedTemplate.type) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-xs font-black">
                  {copy.amount}
                  <input
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] px-3 text-sm"
                  />
                </label>
                <label className="text-xs font-black">
                  {copy.contact}
                  <input
                    value={contact}
                    onChange={(event) => setContact(event.target.value)}
                    className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] px-3 text-sm"
                  />
                </label>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-black">
                {copy.projectLink}
                <input
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                  placeholder="projectId"
                  className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] px-3 text-sm"
                />
              </label>
              <label className="text-xs font-black">
                {copy.claimLink}
                <input
                  value={claimId}
                  onChange={(event) => setClaimId(event.target.value)}
                  placeholder="claimId"
                  className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] px-3 text-sm"
                />
              </label>
            </div>

            <label className="block text-xs font-black">
              {copy.reason}
              <textarea
                required
                rows={7}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="mt-1.5 w-full resize-y border border-[var(--color-border)] p-3 text-sm"
              />
            </label>

            <label className="flex min-h-11 cursor-pointer items-center gap-2 border border-dashed border-[var(--color-border)] px-3 text-xs font-black">
              <Paperclip className="h-4 w-4" />
              {copy.attachments}
              <input
                type="file"
                multiple
                className="sr-only"
                onChange={addAttachments}
              />
            </label>
            {attachmentNames.length > 0 && (
              <ul className="space-y-1 text-[11px] text-[var(--color-text-sub)]">
                {attachmentNames.map((name) => (
                  <li key={name}>• {name}</li>
                ))}
              </ul>
            )}

            <section className="border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4">
              <h3 className="text-xs font-black">{copy.approvalPolicy}</h3>
              <p className="mt-2 text-[11px] font-semibold text-[var(--color-text-sub)]">
                {copy.policyDescription}
              </p>
            </section>

            <section>
              <h3 className="mb-3 text-xs font-black">
                {copy.approvalLine}
              </h3>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  [director, 'DEPARTMENT_MANAGER'],
                  [vicePresident, 'VICE_PRESIDENT'],
                  [ceo, 'CEO'],
                ].map(([approver, role], index) => (
                  <div
                    key={String(role)}
                    className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#273e7a] text-[10px] font-black text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-[10px] font-black">
                        {String(role)}
                      </strong>
                      <small className="block truncate text-[9px] font-semibold text-[var(--color-text-sub)]">
                        {personName(approver as PersonnelCard | null)}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="min-h-11 border border-[var(--color-border)] px-5 text-xs font-black"
              >
                {copy.cancel}
              </button>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-2 bg-[var(--color-primary)] px-5 text-xs font-black text-white"
              >
                <Send className="h-4 w-4" />
                {copy.submit}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {detail && (
        <Modal title={copy.detail} onClose={() => setDetail(null)}>
          <div className="space-y-5">
            <div>
              <span className="text-[9px] font-black text-[var(--color-primary)]">
                {FORM_LABELS[locale][detail.type]?.[0] ?? detail.type}
              </span>
              <h3 className="mt-3 text-xl font-black">{detail.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-sub)]">
                {detail.reason}
              </p>
              {(detail.projectId || detail.taskId) && (
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black">
                  {detail.projectId && (
                    <span className="inline-flex items-center gap-1 border border-blue-200 bg-blue-50 px-2 py-1 text-blue-800">
                      <Link2 className="h-3 w-3" />
                      {detail.projectId}
                    </span>
                  )}
                  {detail.taskId && (
                    <span className="border border-[var(--color-border)] px-2 py-1">
                      {detail.taskId}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              {detail.approvalLine?.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-3 border border-[var(--color-border)] p-3"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black ${
                      step.status === 'APPROVED'
                        ? 'bg-emerald-600 text-white'
                        : step.status === 'REJECTED'
                          ? 'bg-red-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <strong className="block text-xs">
                      {step.label} ·{' '}
                      {personName(
                        companyUsers.find(
                          (user) => user.id === step.approverId,
                        ),
                      )}
                    </strong>
                    <small className="text-[10px] text-[var(--color-text-sub)]">
                      {step.comment ?? step.status}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
