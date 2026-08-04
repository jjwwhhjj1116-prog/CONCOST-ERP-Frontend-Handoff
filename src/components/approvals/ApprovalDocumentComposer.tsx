'use client';

import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  Eye,
  FileClock,
  FileWarning,
  Link2,
  Paperclip,
  Printer,
  Save,
  Send,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { ApprovalLineManager } from '@/components/approvals/ApprovalLineManager';
import { ResponsiveDialogShell } from '@/components/ui/ResponsiveDialogShell';
import {
  APPROVAL_FORM_CATALOG,
  assignPolicyCandidates,
  createApprovalSnapshot,
  createLineDefinition,
  getDemoApprovalPolicyPreview,
  validateApprovalLine,
  type ApprovalFormDefinition,
} from '@/lib/approvalWorkflow';
import { executeFrontendMutation, getFrontendModuleBoundary } from '@/lib/frontendDataSource';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useApprovalStore } from '@/store/approvalStore';
import type {
  ApprovalAttachmentReference,
  ApprovalDistributionKind,
  ApprovalDistributionTarget,
  ApprovalLineDefinition,
  ApprovalRequest,
  CompanyId,
  PersonnelCard,
} from '@/types/models';

type Locale = 'ko' | 'vi' | 'en';

const COPY = {
  ko: { title: '결재 문서 작성', description: '양식·정책·결재선·배포를 확인한 뒤 상신합니다.', documentNo: '문서번호', draftNo: '상신 시 발급', form: '양식', author: '기안자', department: '소속', subject: '제목', retention: '보존연한', security: '보안등급', projectClaim: 'Project / Claim', line: '결재선', loadLine: '결재선 불러오기', distribution: '배포·참조·회람', body: '동적 본문', attachment: '첨부', preview: '미리보기', print: '인쇄', saveDraft: '임시저장', submit: '상신', close: '닫기', policy: 'Policy Preview', serverRequired: '공식 상신은 Backend Policy·Approval Adapter가 준비되어야 합니다.', demo: 'DEMO_LOCAL 시뮬레이션입니다. 공식 결재기록이 아닙니다.', readyOnly: 'READY 파일만 상신할 수 있습니다. 현재 파일은 Backend 스캔 대기 상태입니다.', recipientPlaceholder: '대상 ID 또는 Role을 입력', add: '추가', required: '필수', lineMissing: '결재선을 확인하세요.', authorFinal: '작성자는 최종 승인자가 될 수 없습니다.', draftSaved: '로컬 데모 초안으로 저장했습니다.', submitted: '데모 상신을 시뮬레이션했습니다. 서버에는 저장되지 않았습니다.', snapshot: 'Submission Snapshot', delegation: '위임·대결은 승인·사유·유효기간이 있는 Backend Delegation 계약을 사용합니다.' },
  vi: { title: 'Soạn văn bản phê duyệt', description: 'Kiểm tra biểu mẫu, chính sách, tuyến và phân phối trước khi trình.', documentNo: 'Số văn bản', draftNo: 'Cấp khi trình', form: 'Biểu mẫu', author: 'Người lập', department: 'Bộ phận', subject: 'Tiêu đề', retention: 'Thời hạn lưu', security: 'Mức bảo mật', projectClaim: 'Project / Claim', line: 'Tuyến phê duyệt', loadLine: 'Tải tuyến', distribution: 'Phân phối / Tham khảo / Lưu hành', body: 'Nội dung động', attachment: 'Tệp đính kèm', preview: 'Xem trước', print: 'In', saveDraft: 'Lưu nháp', submit: 'Trình duyệt', close: 'Đóng', policy: 'Xem trước chính sách', serverRequired: 'Cần Policy và Approval Adapter để trình chính thức.', demo: 'Đây là mô phỏng DEMO_LOCAL, không phải hồ sơ chính thức.', readyOnly: 'Chỉ tệp READY mới được đính kèm. Tệp hiện chờ quét Backend.', recipientPlaceholder: 'Nhập ID hoặc Role', add: 'Thêm', required: 'Bắt buộc', lineMissing: 'Hãy kiểm tra tuyến phê duyệt.', authorFinal: 'Người lập không thể là người duyệt cuối.', draftSaved: 'Đã lưu bản nháp demo cục bộ.', submitted: 'Đã mô phỏng trình duyệt. Không lưu lên server.', snapshot: 'Snapshot khi trình', delegation: 'Ủy quyền cần phê duyệt, lý do và thời hạn từ Backend.' },
  en: { title: 'Compose approval document', description: 'Review the form, policy, approval line, and distribution before submission.', documentNo: 'Document no.', draftNo: 'Assigned on submit', form: 'Form', author: 'Author', department: 'Department', subject: 'Title', retention: 'Retention', security: 'Security', projectClaim: 'Project / Claim', line: 'Approval line', loadLine: 'Load line', distribution: 'Distribution / Reference / Circulation', body: 'Dynamic body', attachment: 'Attachments', preview: 'Preview', print: 'Print', saveDraft: 'Save draft', submit: 'Submit', close: 'Close', policy: 'Policy preview', serverRequired: 'Backend Policy and Approval Adapters are required for official submission.', demo: 'DEMO_LOCAL simulation only. This is not an official record.', readyOnly: 'Only READY files can be attached. This file is waiting for Backend scanning.', recipientPlaceholder: 'Enter target ID or role', add: 'Add', required: 'Required', lineMissing: 'Review the approval line.', authorFinal: 'The author cannot be the final approver.', draftSaved: 'Saved as a local demo draft.', submitted: 'Submission simulated. Nothing was persisted to a server.', snapshot: 'Submission snapshot', delegation: 'Delegation requires Backend approval, reason, and validity period.' },
} satisfies Record<Locale, Record<string, string>>;

const displayName = (person?: PersonnelCard | null) => person?.displayName || person?.name || person?.id || 'UNASSIGNED';

interface Props {
  locale: Locale;
  companyId: CompanyId;
  currentUser: PersonnelCard;
  users: PersonnelCard[];
  form: ApprovalFormDefinition;
  onClose: () => void;
  onSubmitted: (requestId: string) => void;
}

export function ApprovalDocumentComposer({ locale, companyId, currentUser, users, form, onClose, onSubmitted }: Props) {
  const copy = COPY[locale];
  const savedLines = useApprovalStore((state) => state.savedLines);
  const addRequest = useApprovalStore((state) => state.addRequest);
  const saveDraft = useApprovalStore((state) => state.saveDraft);
  const incrementLineUsage = useApprovalStore((state) => state.incrementLineUsage);
  const runtimeMode = getRuntimeExecutionMode();
  const boundary = getFrontendModuleBoundary('APPROVAL', {
    locale,
    adapterReady: process.env.NEXT_PUBLIC_APPROVAL_ADAPTER_READY === 'true' && process.env.NEXT_PUBLIC_APPROVAL_POLICY_READY === 'true',
  });
  const companyUsers = useMemo(() => users.filter((user) => user.companyId === companyId), [companyId, users]);
  const policy = useMemo(() => getDemoApprovalPolicyPreview({ formType: form.type, organizationId: currentUser.departmentId }), [currentUser.departmentId, form.type]);
  const defaultLine = useMemo(() => savedLines.find((line) => line.companyId === companyId && line.formType === form.type && line.isDefault), [companyId, form.type, savedLines]);
  const [line, setLine] = useState<ApprovalLineDefinition>(() => defaultLine ?? createLineDefinition({
    companyId,
    ownerId: currentUser.id,
    departmentId: currentUser.departmentId,
    name: `${form.name[locale]} · Policy`,
    formType: form.type,
    scope: 'PERSONAL',
    steps: assignPolicyCandidates(policy.steps, companyUsers, currentUser.id, currentUser.departmentId),
  }));
  const [lineManagerOpen, setLineManagerOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [title, setTitle] = useState(form.name[locale]);
  const [retention, setRetention] = useState('5Y');
  const [security, setSecurity] = useState<'GENERAL' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED'>('INTERNAL');
  const [projectId, setProjectId] = useState('');
  const [claimId, setClaimId] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<ApprovalAttachmentReference[]>([]);
  const [distributionKind, setDistributionKind] = useState<ApprovalDistributionKind>('REFERENCE');
  const [distributionValue, setDistributionValue] = useState('');
  const [distribution, setDistribution] = useState<ApprovalDistributionTarget[]>([]);
  const [message, setMessage] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);

  const requestPayload = (): Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'> => ({
    type: form.type,
    companyId,
    departmentId: currentUser.departmentId,
    formId: form.id,
    requestedBy: currentUser.id,
    title: title.trim(),
    reason: values.details || values.leaveReason || values.workCoverage || title.trim(),
    documentData: values,
    retentionPeriod: retention,
    securityLevel: security,
    projectId: projectId.trim() || undefined,
    claimId: claimId.trim() || undefined,
    approvalLine: line.steps.map((step) => ({ ...step, status: 'PENDING' })),
    approvalSnapshot: createApprovalSnapshot(line, policy.version),
    currentApprovalStep: 0,
    distributionTargets: distribution,
    attachments: attachments.filter((attachment) => attachment.state === 'READY'),
    revision: 1,
  });

  const validate = () => {
    const errors = validateApprovalLine(line.steps, currentUser.id);
    if (!title.trim()) errors.push(copy.subject);
    form.fields.filter((field) => field.required && !values[field.id]?.trim()).forEach((field) => errors.push(`${copy.required}: ${field.label[locale]}`));
    if (attachments.some((attachment) => attachment.state !== 'READY')) errors.push(copy.readyOnly);
    return errors;
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = validate();
    if (errors.length) {
      setMessage({ kind: 'error', text: errors.join(' · ') });
      return;
    }
    const payload = requestPayload();
    const result = await executeFrontendMutation(boundary, { simulate: () => payload });
    if (result.kind === 'BLOCKED') {
      setMessage({ kind: 'error', text: copy.serverRequired });
      return;
    }
    const requestId = addRequest(payload);
    if (line.id) incrementLineUsage(line.id);
    setMessage({ kind: 'info', text: copy.submitted });
    onSubmitted(requestId);
    onClose();
  };

  const draft = () => {
    if (runtimeMode !== 'DEMO_LOCAL') {
      setMessage({ kind: 'error', text: copy.serverRequired });
      return;
    }
    saveDraft(requestPayload());
    setMessage({ kind: 'info', text: copy.draftSaved });
  };

  const addAttachments = (event: ChangeEvent<HTMLInputElement>) => setAttachments(Array.from(event.target.files ?? []).map((file) => ({
    id: `local_${Date.now()}_${file.name}`,
    fileName: file.name,
    contentType: file.type || 'application/octet-stream',
    size: file.size,
    state: 'LOCAL_PREVIEW',
  })));

  const addDistribution = () => {
    if (!distributionValue.trim()) return;
    setDistribution((current) => [...current, { id: `dist_${Date.now()}`, kind: distributionKind, targetType: distributionValue.includes(':') ? 'ROLE' : 'ORGANIZATION', targetId: distributionValue.trim(), label: distributionValue.trim() }]);
    setDistributionValue('');
  };

  return (
    <>
      <ResponsiveDialogShell
        title={`${copy.title} · ${form.name[locale]}`}
        description={copy.description}
        onClose={onClose}
        footer={<div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-[var(--color-border)] px-4 text-xs font-black">{copy.close}</button><button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 text-xs font-black"><Eye className="h-4 w-4" />{copy.preview}</button><button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 text-xs font-black"><Printer className="h-4 w-4" />{copy.print}</button><button type="button" onClick={draft} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--color-primary)] px-4 text-xs font-black text-[var(--color-primary)]"><Save className="h-4 w-4" />{copy.saveDraft}</button><button type="submit" form="approval-document-form" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 text-xs font-black text-white"><Send className="h-4 w-4" />{copy.submit}</button></div>}
      >
        <form id="approval-document-form" onSubmit={submit} className="space-y-5">
          <div className={`rounded-xl border p-3 text-xs font-bold ${boundary.state === 'DEMO_SIMULATION' ? 'border-blue-200 bg-blue-50 text-blue-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><ShieldCheck className="mr-2 inline h-4 w-4" />{boundary.state === 'DEMO_SIMULATION' ? copy.demo : copy.serverRequired}</div>
          <section className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4 sm:grid-cols-2 xl:grid-cols-4">
            {[[copy.documentNo, copy.draftNo], [copy.form, form.name[locale]], [copy.author, displayName(currentUser)], [copy.department, currentUser.departmentName ?? currentUser.departmentId]].map(([label, value]) => <div key={label}><span className="text-[9px] font-black uppercase text-[var(--color-text-sub)]">{label}</span><strong className="mt-1 block text-xs">{value}</strong></div>)}
          </section>
          <section className="grid gap-4 rounded-xl border border-[var(--color-border)] p-4 lg:grid-cols-4">
            <label className="text-xs font-black lg:col-span-2">{copy.subject}<input required value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] px-3 text-sm" /></label>
            <label className="text-xs font-black">{copy.retention}<select value={retention} onChange={(event) => setRetention(event.target.value)} className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"><option value="1Y">1Y</option><option value="3Y">3Y</option><option value="5Y">5Y</option><option value="10Y">10Y</option><option value="PERMANENT">PERMANENT</option></select></label>
            <label className="text-xs font-black">{copy.security}<select value={security} onChange={(event) => setSecurity(event.target.value as typeof security)} className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"><option value="GENERAL">GENERAL</option><option value="INTERNAL">INTERNAL</option><option value="CONFIDENTIAL">CONFIDENTIAL</option><option value="RESTRICTED">RESTRICTED</option></select></label>
            <label className="text-xs font-black lg:col-span-2">Project ID<input value={projectId} onChange={(event) => setProjectId(event.target.value)} placeholder="canonical projectId" className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] px-3 text-sm" /></label>
            <label className="text-xs font-black lg:col-span-2">Claim ID<input value={claimId} onChange={(event) => setClaimId(event.target.value)} placeholder="canonical claimId" className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] px-3 text-sm" /></label>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-black"><UsersRound className="h-4 w-4 text-[var(--color-primary)]" />{copy.line}</h3><p className="mt-1 text-[10px] font-semibold text-[var(--color-text-sub)]">{line.name} · v{line.version} · {line.steps.length} STEP</p></div><button type="button" onClick={() => setLineManagerOpen(true)} className="min-h-9 rounded-lg border border-[var(--color-primary)] px-3 text-[10px] font-black text-[var(--color-primary)]">{copy.loadLine}</button></div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{line.steps.map((step, index) => <div key={step.id} className="min-w-[170px] rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3"><span className="font-mono text-[9px] font-black text-[var(--color-primary)]">STEP {String(index + 1).padStart(2, '0')}</span><strong className="mt-1 block truncate text-xs">{step.label}</strong><small className="mt-1 block truncate text-[9px] text-[var(--color-text-sub)]">{step.approverId ? displayName(companyUsers.find((person) => person.id === step.approverId)) : step.approverRole ?? 'UNASSIGNED'} · {step.executionMode}</small>{step.policyLocked && <span className="mt-2 inline-flex items-center gap-1 text-[8px] font-black text-amber-700"><ShieldCheck className="h-3 w-3" />POLICY</span>}</div>)}</div>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-[10px] font-semibold text-blue-900"><strong>{copy.policy}</strong> · {policy.version} · {policy.source}<br />{policy.warnings.join(' ')}</div>
          </section>

          <section className="rounded-xl border border-[var(--color-border)] p-4">
            <h3 className="text-sm font-black">{copy.body}</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">{form.fields.map((field) => <label key={field.id} className={`text-xs font-black ${field.type === 'TEXTAREA' ? 'md:col-span-2' : ''}`}>{field.label[locale]}{field.required && <span className="ml-1 text-red-600">*</span>}{field.type === 'TEXTAREA' ? <textarea rows={4} value={values[field.id] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} className="mt-1.5 w-full border border-[var(--color-border)] p-3 text-sm" /> : field.type === 'SELECT' ? <select value={values[field.id] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"><option value="">-</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input type={field.type === 'DATE' ? 'date' : field.type === 'NUMBER' ? 'number' : field.type === 'TEL' ? 'tel' : 'text'} value={values[field.id] ?? ''} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} className="mt-1.5 min-h-11 w-full border border-[var(--color-border)] px-3 text-sm" />}</label>)}</div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] p-4"><h3 className="flex items-center gap-2 text-sm font-black"><Link2 className="h-4 w-4 text-violet-600" />{copy.distribution}</h3><div className="mt-3 flex gap-2"><select value={distributionKind} onChange={(event) => setDistributionKind(event.target.value as ApprovalDistributionKind)} className="min-h-10 border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"><option value="RECIPIENT">RECIPIENT</option><option value="REFERENCE">REFERENCE</option><option value="CIRCULATION">CIRCULATION</option><option value="DISTRIBUTION">DISTRIBUTION</option></select><input value={distributionValue} onChange={(event) => setDistributionValue(event.target.value)} placeholder={copy.recipientPlaceholder} className="min-w-0 flex-1 border border-[var(--color-border)] px-3 text-xs" /><button type="button" onClick={addDistribution} className="min-h-10 bg-slate-900 px-3 text-xs font-black text-white">{copy.add}</button></div><div className="mt-3 flex flex-wrap gap-2">{distribution.map((target) => <button key={target.id} type="button" onClick={() => setDistribution((current) => current.filter((item) => item.id !== target.id))} className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[9px] font-black text-violet-800">{target.kind} · {target.label} ×</button>)}</div></div>
            <div className="rounded-xl border border-[var(--color-border)] p-4"><h3 className="flex items-center gap-2 text-sm font-black"><Paperclip className="h-4 w-4 text-blue-600" />{copy.attachment}</h3><label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 border border-dashed border-[var(--color-border)] text-xs font-black"><Paperclip className="h-4 w-4" />{copy.attachment}<input type="file" multiple className="sr-only" onChange={addAttachments} /></label>{attachments.map((attachment) => <div key={attachment.id} className="mt-2 flex items-center justify-between gap-2 border border-amber-200 bg-amber-50 p-2 text-[10px] font-bold text-amber-900"><span className="truncate">{attachment.fileName}</span><span>{attachment.state}</span></div>)}{attachments.length > 0 && <p className="mt-2 text-[9px] font-semibold text-amber-700">{copy.readyOnly}</p>}</div>
          </section>
          <section className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4 text-[10px] font-semibold text-[var(--color-text-sub)]"><Archive className="mr-2 inline h-4 w-4" />{copy.snapshot}: {line.id} · v{line.version} · {policy.version}<br /><FileClock className="mr-2 mt-2 inline h-4 w-4" />{copy.delegation}</section>
          {message && <p role="alert" className={`rounded-xl border p-3 text-xs font-bold ${message.kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message.kind === 'error' ? <FileWarning className="mr-2 inline h-4 w-4" /> : <CheckCircle2 className="mr-2 inline h-4 w-4" />}{message.text}</p>}
        </form>
      </ResponsiveDialogShell>

      {lineManagerOpen && <ApprovalLineManager locale={locale} companyId={companyId} currentUser={currentUser} users={companyUsers} formType={form.type} initialSteps={line.steps} onApply={(next) => { setLine({ ...next, steps: next.steps.map((step) => ({ ...step })) }); setLineManagerOpen(false); }} onClose={() => setLineManagerOpen(false)} />}
      {previewOpen && <ResponsiveDialogShell title={copy.preview} onClose={() => setPreviewOpen(false)} widthClassName="sm:max-w-3xl"><article className="mx-auto min-h-[700px] max-w-2xl border border-slate-300 bg-white p-8 text-slate-950 shadow-sm"><header className="border-b-2 border-slate-900 pb-5 text-center"><p className="text-xs font-bold">{form.name[locale]}</p><h2 className="mt-2 text-2xl font-black">{title}</h2></header><dl className="mt-6 grid grid-cols-2 gap-3 text-xs"><div><dt className="font-bold">{copy.author}</dt><dd>{displayName(currentUser)}</dd></div><div><dt className="font-bold">{copy.department}</dt><dd>{currentUser.departmentName ?? currentUser.departmentId}</dd></div><div><dt className="font-bold">{copy.retention}</dt><dd>{retention}</dd></div><div><dt className="font-bold">{copy.security}</dt><dd>{security}</dd></div></dl><div className="mt-8 space-y-4">{form.fields.map((field) => <section key={field.id}><h3 className="text-xs font-bold">{field.label[locale]}</h3><p className="mt-1 min-h-8 whitespace-pre-wrap border-b border-slate-200 py-2 text-sm">{values[field.id] || '-'}</p></section>)}</div></article></ResponsiveDialogShell>}
    </>
  );
}

export const approvalFormCatalog = APPROVAL_FORM_CATALOG;
