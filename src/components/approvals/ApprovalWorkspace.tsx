'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  Archive,
  BookOpenCheck,
  Check,
  ChevronRight,
  Clock3,
  CopyCheck,
  FileCheck2,
  FilePlus2,
  FileText,
  History,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Stamp,
  UsersRound,
  X,
} from 'lucide-react';

import { ApprovalDocumentComposer, approvalFormCatalog } from '@/components/approvals/ApprovalDocumentComposer';
import { ApprovalLineManager } from '@/components/approvals/ApprovalLineManager';
import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { ResponsiveDialogShell } from '@/components/ui/ResponsiveDialogShell';
import { assignPolicyCandidates, createLineDefinition, getDemoApprovalPolicyPreview } from '@/lib/approvalWorkflow';
import { executeFrontendMutation, getFrontendModuleBoundary, type FrontendLocale } from '@/lib/frontendDataSource';
import { useApprovalStore } from '@/store/approvalStore';
import { useAuthStore } from '@/store/authStore';
import type {
  ApprovalLineDefinition,
  ApprovalRequest,
  CompanyId,
  PersonnelCard,
} from '@/types/models';

type QueueTab = 'DRAFT' | 'ACTION' | 'PROGRESS' | 'DONE' | 'REJECTED';
type ReviewAction = 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES';

interface ApprovalCopy {
  eyebrow: string;
  title: string;
  description: string;
  write: string;
  formCatalog: string;
  lineManager: string;
  delegation: string;
  draft: string;
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
  detail: string;
  blocked: string;
  simulated: string;
  comment: string;
  confirm: string;
  snapshot: string;
  distribution: string;
  attachment: string;
  history: string;
  permission: string;
}

const COPY: Record<FrontendLocale, ApprovalCopy> = {
  ko: {
    eyebrow: 'APPROVAL CENTER', title: '전자결재', description: '양식, 결재선, 정책, 배포와 문서 이력을 하나의 실사용 흐름으로 관리합니다.', write: '문서 작성', formCatalog: '양식 Catalog', lineManager: '결재선 관리', delegation: '위임·대결', draft: '임시보관함', action: '처리할 결재', progress: '진행 문서', done: '승인 완료', rejected: '반려·회수', inbox: '결재 문서함', inboxDescription: '회사와 사용자 권한을 먼저 적용한 뒤 안전한 문서 정보만 표시합니다.', empty: '현재 문서가 없습니다.', emptyDescription: '새 문서가 상신되면 이곳에 표시됩니다.', approve: '승인', reject: '반려', requestChanges: '수정 요청', recall: '상신 회수', view: '상세', close: '닫기', detail: '결재 문서 상세', blocked: 'Approval Backend Adapter와 Policy capability가 준비되지 않아 공식 상태를 변경할 수 없습니다.', simulated: 'DEMO_LOCAL 시뮬레이션입니다. 공식 결재기록은 변경되지 않습니다.', comment: '검토 의견', confirm: '처리', snapshot: '상신 결재선 Snapshot', distribution: '배포·참조·회람', attachment: 'READY 첨부', history: '문서 상태·이력', permission: '위임은 승인·사유·유효기간이 있는 Backend Delegation 정책으로만 적용됩니다.',
  },
  vi: {
    eyebrow: 'TRUNG TÂM PHÊ DUYỆT', title: 'Phê duyệt điện tử', description: 'Quản lý biểu mẫu, tuyến, chính sách, phân phối và lịch sử trong một luồng.', write: 'Tạo văn bản', formCatalog: 'Danh mục biểu mẫu', lineManager: 'Quản lý tuyến', delegation: 'Ủy quyền', draft: 'Bản nháp', action: 'Cần xử lý', progress: 'Đang xử lý', done: 'Đã duyệt', rejected: 'Từ chối / Thu hồi', inbox: 'Hộp phê duyệt', inboxDescription: 'Chỉ chiếu dữ liệu an toàn sau khi áp dụng phạm vi công ty và quyền.', empty: 'Không có văn bản.', emptyDescription: 'Văn bản mới sẽ xuất hiện tại đây.', approve: 'Phê duyệt', reject: 'Từ chối', requestChanges: 'Yêu cầu sửa', recall: 'Thu hồi', view: 'Chi tiết', close: 'Đóng', detail: 'Chi tiết văn bản', blocked: 'Cần Backend Approval và Policy capability để thay đổi trạng thái chính thức.', simulated: 'Mô phỏng DEMO_LOCAL, không thay đổi hồ sơ chính thức.', comment: 'Ý kiến', confirm: 'Xử lý', snapshot: 'Snapshot tuyến khi trình', distribution: 'Phân phối / Tham khảo / Lưu hành', attachment: 'Tệp READY', history: 'Trạng thái / Lịch sử', permission: 'Ủy quyền chỉ áp dụng bằng chính sách Backend có phê duyệt, lý do và thời hạn.',
  },
  en: {
    eyebrow: 'APPROVAL CENTER', title: 'Electronic Approval', description: 'Manage forms, lines, policy, distribution, and document history in one workflow.', write: 'Create document', formCatalog: 'Form catalog', lineManager: 'Line manager', delegation: 'Delegation', draft: 'Drafts', action: 'Needs action', progress: 'In progress', done: 'Approved', rejected: 'Rejected / Recalled', inbox: 'Approval inbox', inboxDescription: 'Safe document data is projected only after company and permission scope.', empty: 'No documents.', emptyDescription: 'New submissions will appear here.', approve: 'Approve', reject: 'Reject', requestChanges: 'Request changes', recall: 'Recall', view: 'Detail', close: 'Close', detail: 'Approval detail', blocked: 'Approval Backend and Policy capabilities are required for official state changes.', simulated: 'DEMO_LOCAL simulation only. No official record changed.', comment: 'Review comment', confirm: 'Confirm', snapshot: 'Submission line snapshot', distribution: 'Distribution / Reference / Circulation', attachment: 'READY attachments', history: 'Document state / History', permission: 'Delegation is applied only through a Backend policy with approval, reason, and validity period.',
  },
};

const TERMINAL = new Set(['APPROVED', 'REJECTED', 'RECALLED', 'CANCELLED']);
const personName = (person?: PersonnelCard | null) => person?.displayName || person?.name || 'UNASSIGNED';

const getActionableSteps = (request: ApprovalRequest) => {
  const unresolved = (request.approvalLine ?? []).filter((step) => step.kind !== 'REFERENCE' && step.status === 'PENDING');
  if (!unresolved.length) return [];
  const sequence = Math.min(...unresolved.map((step) => step.sequence ?? Number.MAX_SAFE_INTEGER));
  const first = unresolved.find((step) => (step.sequence ?? Number.MAX_SAFE_INTEGER) === sequence);
  return unresolved.filter((step) => (step.sequence ?? Number.MAX_SAFE_INTEGER) === sequence || Boolean(step.executionMode === 'PARALLEL_ALL' && step.groupId && step.groupId === first?.groupId));
};

export function ApprovalWorkspace() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const users = useAuthStore((state) => state.users);
  const requests = useApprovalStore((state) => state.requests);
  const reviewDocument = useApprovalStore((state) => state.reviewDocument);
  const cancelRequest = useApprovalStore((state) => state.cancelRequest);
  const { brandWorkspace, locale, setLocale } = useHandoffLocale();
  const companyId: CompanyId = brandWorkspace === 'VIET_QS' ? 'VIET_QS' : 'CON_COST';
  const copy = COPY[locale];
  const boundary = getFrontendModuleBoundary('APPROVAL', { locale, adapterReady: process.env.NEXT_PUBLIC_APPROVAL_ADAPTER_READY === 'true' && process.env.NEXT_PUBLIC_APPROVAL_POLICY_READY === 'true' });
  const [tab, setTab] = useState<QueueTab>('ACTION');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [composerFormId, setComposerFormId] = useState<string | null>(null);
  const [lineManagerOpen, setLineManagerOpen] = useState(false);
  const [detail, setDetail] = useState<ApprovalRequest | null>(null);
  const [decision, setDecision] = useState<{ request: ApprovalRequest; action: ReviewAction } | null>(null);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const companyUsers = useMemo(() => users.filter((user) => user.companyId === companyId), [companyId, users]);
  if (!currentUser) return null;

  const scopedRequests = boundary.state === 'DEMO_SIMULATION'
    ? requests.filter((request) => request.companyId ? request.companyId === companyId : companyUsers.some((user) => user.id === request.requestedBy))
    : [];
  const visibleRequests = scopedRequests.filter((request) => currentUser.role === 'SUPER_ADMIN' || request.requestedBy === currentUser.id || request.approvalLine?.some((step) => step.approverId === currentUser.id || !step.approverId && step.approverRole === currentUser.role) || request.pmId === currentUser.id || request.managerId === currentUser.id);
  const isActionable = (request: ApprovalRequest) => !TERMINAL.has(request.status) && request.status !== 'DRAFT' && getActionableSteps(request).some((step) => currentUser.role === 'SUPER_ADMIN' || step.approverId === currentUser.id || !step.approverId && step.approverRole === currentUser.role);
  const queue = visibleRequests.filter((request) => {
    if (tab === 'DRAFT') return request.status === 'DRAFT' && request.requestedBy === currentUser.id;
    if (tab === 'ACTION') return isActionable(request);
    if (tab === 'PROGRESS') return !TERMINAL.has(request.status) && request.status !== 'DRAFT' && !isActionable(request);
    if (tab === 'DONE') return request.status === 'APPROVED';
    return ['REJECTED', 'RECALLED', 'CANCELLED', 'CHANGES_REQUESTED'].includes(request.status);
  });

  const performReview = async () => {
    if (!decision) return;
    const result = await executeFrontendMutation(boundary, { simulate: () => ({ requestId: decision.request.id, action: decision.action }) });
    if (result.kind === 'BLOCKED') {
      setMessage({ kind: 'error', text: copy.blocked });
      return;
    }
    const changed = reviewDocument(decision.request.id, currentUser.id, decision.action, comment);
    setMessage({ kind: changed ? 'info' : 'error', text: changed ? copy.simulated : copy.blocked });
    setDecision(null);
    setComment('');
  };

  const recall = async (request: ApprovalRequest) => {
    if (request.requestedBy !== currentUser.id || request.status !== 'PENDING' || request.approvalLine?.some((step) => step.status !== 'PENDING')) return;
    const result = await executeFrontendMutation(boundary, { simulate: () => ({ requestId: request.id, action: 'RECALL' }) });
    if (result.kind === 'BLOCKED') {
      setMessage({ kind: 'error', text: copy.blocked });
      return;
    }
    const changed = cancelRequest(request.id, currentUser.id, '작성자 회수');
    setMessage({ kind: changed ? 'info' : 'error', text: changed ? copy.simulated : copy.blocked });
  };

  const summary = [
    { tab: 'DRAFT' as const, label: copy.draft, icon: Archive, value: visibleRequests.filter((request) => request.status === 'DRAFT').length },
    { tab: 'ACTION' as const, label: copy.action, icon: Stamp, value: visibleRequests.filter(isActionable).length },
    { tab: 'PROGRESS' as const, label: copy.progress, icon: Clock3, value: visibleRequests.filter((request) => !TERMINAL.has(request.status) && request.status !== 'DRAFT').length },
    { tab: 'DONE' as const, label: copy.done, icon: Check, value: visibleRequests.filter((request) => request.status === 'APPROVED').length },
    { tab: 'REJECTED' as const, label: copy.rejected, icon: X, value: visibleRequests.filter((request) => ['REJECTED', 'RECALLED', 'CANCELLED', 'CHANGES_REQUESTED'].includes(request.status)).length },
  ];

  const genericPolicy = getDemoApprovalPolicyPreview({ formType: 'GENERAL_APPROVAL', organizationId: currentUser.departmentId });
  const genericLine = createLineDefinition({ companyId, ownerId: currentUser.id, departmentId: currentUser.departmentId, name: '일반결재 Policy', formType: 'GENERAL_APPROVAL', steps: assignPolicyCandidates(genericPolicy.steps, companyUsers, currentUser.id, currentUser.departmentId) });
  const composerForm = approvalFormCatalog.find((form) => form.id === composerFormId) ?? null;

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div className="cc-page-heading">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase text-[#4e6fd8]"><ShieldCheck className="h-4 w-4" />{copy.eyebrow}</p>
          <h1 className="text-[28px] font-black tracking-[0]">{copy.title}</h1>
          <p className="mt-2 text-xs font-semibold text-[var(--color-text-sub)]">{copy.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HandoffLanguageToggle locale={locale} onChange={setLocale} />
          <button type="button" onClick={() => setLineManagerOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-black"><UsersRound className="h-4 w-4 text-violet-600" />{copy.lineManager}</button>
          <button type="button" onClick={() => setMessage({ kind: 'info', text: copy.permission })} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-black"><Settings2 className="h-4 w-4 text-blue-600" />{copy.delegation}</button>
          <button type="button" onClick={() => setCatalogOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 text-xs font-black text-white"><FilePlus2 className="h-4 w-4" />{copy.write}</button>
        </div>
      </header>

      <RuntimeCapabilityPanel boundary={boundary} />
      {message && <div role="status" className={`rounded-xl border p-3 text-xs font-bold ${message.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-900'}`}>{message.text}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {summary.map((item) => { const Icon = item.icon; return <button key={item.tab} type="button" onClick={() => setTab(item.tab)} className={`cc-tactile-card flex min-h-[102px] items-center gap-4 p-4 text-left ${tab === item.tab ? 'ring-2 ring-[var(--color-primary)]' : ''}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef2ff] text-[#405bb0]"><Icon className="h-5 w-5" /></span><span><span className="block text-[11px] font-black text-[var(--color-text-sub)]">{item.label}</span><strong className="mt-1 block font-mono text-3xl font-black">{item.value}</strong></span></button>; })}
      </section>

      <section className="cc-tactile-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] p-5 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="text-base font-black">{copy.inbox}</h2><p className="mt-1 text-[11px] font-semibold text-[var(--color-text-sub)]">{copy.inboxDescription}</p></div><div className="flex max-w-full gap-1 overflow-x-auto bg-[var(--cc-surface-2)] p-1">{summary.map((item) => <button key={item.tab} type="button" onClick={() => setTab(item.tab)} className={`min-h-9 whitespace-nowrap px-3 text-[10px] font-black ${tab === item.tab ? 'bg-[var(--color-surface)] text-[#3453a4] shadow-sm' : 'text-[var(--color-text-sub)]'}`}>{item.label}</button>)}</div></div>
        <div className="divide-y divide-[var(--color-border)]">
          {queue.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center text-center"><FileCheck2 className="mb-3 h-9 w-9 text-[#b6c2df]" /><strong className="text-sm font-black">{copy.empty}</strong><span className="mt-1 text-xs text-[var(--color-text-sub)]">{copy.emptyDescription}</span></div> : queue.map((request) => {
            const requester = companyUsers.find((user) => user.id === request.requestedBy);
            const line = request.approvalSnapshot?.steps ?? request.approvalLine ?? [];
            const canRecall = request.requestedBy === currentUser.id && request.status === 'PENDING' && line.every((step) => step.status === 'PENDING');
            return <article key={request.id} className="grid gap-4 p-5 hover:bg-[#f8faff] dark:hover:bg-white/[.03] lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)_auto] lg:items-center">
              <button type="button" onClick={() => setDetail(request)} className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><span className="text-[9px] font-bold text-[var(--color-text-sub)]">{request.formId ?? request.type} · {request.documentNo ?? request.status}</span><h3 className="mt-2 truncate text-sm font-black">{request.title}</h3><p className="mt-1 truncate text-[11px] font-semibold text-[var(--color-text-sub)]">{personName(requester)} · {request.reason}</p></button>
              <div className="flex items-center gap-1 overflow-x-auto">{line.length ? line.map((step, index) => <Fragment key={step.id}><span className={`flex min-h-9 min-w-[96px] flex-col items-center justify-center rounded-lg px-2 text-[9px] font-black ${step.status === 'APPROVED' ? 'bg-emerald-600 text-white' : step.status === 'REJECTED' || step.status === 'CHANGES_REQUESTED' ? 'bg-red-600 text-white' : getActionableSteps(request).some((candidate) => candidate.id === step.id) ? 'bg-[var(--color-primary)] text-white' : 'border border-[var(--color-border)] bg-[var(--cc-surface-2)] text-[var(--color-text-sub)]'}`}><span>{step.label}</span><small className="mt-0.5 max-w-[88px] truncate text-[8px] opacity-80">{step.approverId ? personName(companyUsers.find((user) => user.id === step.approverId)) : step.approverRole}</small></span>{index < line.length - 1 && <ChevronRight className="h-3 w-3 shrink-0 text-[var(--color-text-sub)]" />}</Fragment>) : <span className="text-[10px] font-bold text-[var(--color-text-sub)]">{copy.snapshot}</span>}</div>
              <div className="flex flex-wrap gap-2 lg:justify-end">{isActionable(request) && <><button type="button" onClick={() => setDecision({ request, action: 'APPROVE' })} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#273e7a] px-3 text-[10px] font-black text-white"><Check className="h-3.5 w-3.5" />{copy.approve}</button><button type="button" onClick={() => setDecision({ request, action: 'REQUEST_CHANGES' })} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 text-[10px] font-black text-amber-800"><RotateCcw className="h-3.5 w-3.5" />{copy.requestChanges}</button><button type="button" onClick={() => setDecision({ request, action: 'REJECT' })} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 text-[10px] font-black text-red-700"><X className="h-3.5 w-3.5" />{copy.reject}</button></>}{canRecall && <button type="button" onClick={() => recall(request)} className="min-h-9 rounded-lg border border-[var(--color-border)] px-3 text-[10px] font-black">{copy.recall}</button>}<button type="button" onClick={() => setDetail(request)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--color-border)] px-3 text-[10px] font-black">{copy.view}<ChevronRight className="h-3.5 w-3.5" /></button></div>
            </article>;
          })}
        </div>
      </section>

      {catalogOpen && <ResponsiveDialogShell title={copy.formCatalog} description={copy.description} onClose={() => setCatalogOpen(false)}><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{approvalFormCatalog.map((form) => <button key={form.id} type="button" onClick={() => { setComposerFormId(form.id); setCatalogOpen(false); }} className="cc-tactile-card flex min-h-[132px] items-start gap-4 p-4 text-left"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><FileText className="h-5 w-5" /></span><span><span className="text-[9px] font-black text-[var(--color-primary)]">{form.category}</span><strong className="mt-1 block text-sm font-black">{form.name[locale]}</strong><small className="mt-1 block text-[10px] font-semibold leading-5 text-[var(--color-text-sub)]">{form.description[locale]}</small></span></button>)}</div></ResponsiveDialogShell>}
      {composerForm && <ApprovalDocumentComposer locale={locale} companyId={companyId} currentUser={currentUser} users={companyUsers} form={composerForm} onClose={() => setComposerFormId(null)} onSubmitted={(requestId) => setMessage({ kind: 'info', text: `${copy.simulated} · ${requestId}` })} />}
      {lineManagerOpen && <ApprovalLineManager locale={locale} companyId={companyId} currentUser={currentUser} users={companyUsers} formType="GENERAL_APPROVAL" initialSteps={genericLine.steps} onApply={(line: ApprovalLineDefinition) => { setMessage({ kind: 'info', text: `${copy.lineManager}: ${line.name}` }); setLineManagerOpen(false); }} onClose={() => setLineManagerOpen(false)} />}
      {decision && <ResponsiveDialogShell title={`${copy.confirm} · ${decision.action}`} onClose={() => setDecision(null)} widthClassName="sm:max-w-lg" footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDecision(null)} className="min-h-10 rounded-lg border border-[var(--color-border)] px-4 text-xs font-black">{copy.close}</button><button type="button" onClick={performReview} className="min-h-10 rounded-lg bg-[var(--color-primary)] px-5 text-xs font-black text-white">{copy.confirm}</button></div>}><p className="text-sm font-black">{decision.request.title}</p><label className="mt-4 block text-xs font-black">{copy.comment}<textarea rows={5} value={comment} onChange={(event) => setComment(event.target.value)} className="mt-1.5 w-full border border-[var(--color-border)] p-3 text-sm" /></label></ResponsiveDialogShell>}
      {detail && <ResponsiveDialogShell title={copy.detail} onClose={() => setDetail(null)} widthClassName="sm:max-w-4xl"><div className="space-y-5"><section><span className="text-[9px] font-black text-[var(--color-primary)]">{detail.formId ?? detail.type} · {detail.status}</span><h3 className="mt-2 text-xl font-black">{detail.title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-sub)]">{detail.reason}</p></section><section className="grid gap-3 sm:grid-cols-3">{[[copy.snapshot, `${detail.approvalSnapshot?.lineDefinitionId ?? 'legacy'} · v${detail.approvalSnapshot?.lineVersion ?? 0}`], [copy.distribution, String(detail.distributionTargets?.length ?? 0)], [copy.attachment, String(detail.attachments?.filter((file) => file.state === 'READY').length ?? 0)]].map(([label, value]) => <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4"><span className="text-[9px] font-black text-[var(--color-text-sub)]">{label}</span><strong className="mt-1 block text-sm">{value}</strong></div>)}</section><section><h4 className="mb-3 flex items-center gap-2 text-sm font-black"><CopyCheck className="h-4 w-4 text-violet-600" />{copy.snapshot}</h4><div className="space-y-2">{(detail.approvalSnapshot?.steps ?? detail.approvalLine ?? []).map((step, index) => <div key={step.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3"><span className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black ${step.status === 'APPROVED' ? 'bg-emerald-600 text-white' : step.status === 'REJECTED' || step.status === 'CHANGES_REQUESTED' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{index + 1}</span><span className="min-w-0"><strong className="block truncate text-xs">{step.label} · {step.kind}</strong><small className="text-[10px] text-[var(--color-text-sub)]">{step.approverId ? personName(companyUsers.find((user) => user.id === step.approverId)) : step.approverRole} · {step.executionMode} · {step.status}</small></span>{step.policyLocked && <ShieldCheck className="ml-auto h-4 w-4 text-amber-600" />}</div>)}</div></section><section className="rounded-xl border border-[var(--color-border)] p-4"><h4 className="flex items-center gap-2 text-sm font-black"><History className="h-4 w-4 text-blue-600" />{copy.history}</h4><p className="mt-2 text-xs text-[var(--color-text-sub)]">{detail.createdAt} · revision {detail.revision ?? 1} · {detail.reviewComment ?? detail.status}</p></section><section className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold text-blue-900"><BookOpenCheck className="mr-2 inline h-4 w-4" />{copy.permission}</section></div></ResponsiveDialogShell>}
    </div>
  );
}
