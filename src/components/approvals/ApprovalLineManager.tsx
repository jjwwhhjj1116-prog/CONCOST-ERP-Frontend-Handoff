'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  LockKeyhole,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  UsersRound,
} from 'lucide-react';

import { ResponsiveDialogShell } from '@/components/ui/ResponsiveDialogShell';
import { ActionButtonGroup, DangerActionSection, SemanticActionButton } from '@/components/ui/SemanticActionButton';
import { getOrganizationDescendants, getOrganizationNodes, resolveOrganizationAlias, resolvePersonnelOrganization } from '@/lib/organizationHierarchy';
import {
  createLineDefinition,
  moveApprovalStep,
  normalizeApprovalSteps,
  validateApprovalLine,
} from '@/lib/approvalWorkflow';
import { useApprovalStore } from '@/store/approvalStore';
import type {
  ApprovalDocumentLineStep,
  ApprovalLineDefinition,
  ApprovalRequestType,
  CompanyId,
  PersonnelCard,
  Role,
} from '@/types/models';

type Locale = 'ko' | 'vi' | 'en';

const COPY = {
  ko: { title: '결재선 관리', description: '개인·부서·회사 결재선을 버전으로 관리하고 문서에 불러옵니다.', newLine: '신규', search: '이름·양식 검색', saved: '등록 결재선', empty: '등록된 결재선이 없습니다.', scope: '범위', name: '결재선 이름', form: '양식', steps: '단계', author: '작성자', usage: '사용', version: '버전', default: '기본', copy: '복사', remove: '삭제', setDefault: '기본설정', addStep: '결재자 추가', apply: '이 결재선 사용', save: '저장', cancel: '닫기', kind: '구분', department: '부서', personRole: '사람 / Role', position: '직위', displayTitle: '표시직책', mode: '실행모드', group: 'Group', immediate: '바로도착', required: '필수', locked: '정책 Lock', actions: '순서·삭제', noCandidate: 'Role로 지정', warning: '정책 필수 단계는 삭제할 수 없습니다.' },
  vi: { title: 'Quản lý tuyến phê duyệt', description: 'Quản lý tuyến cá nhân, phòng ban và công ty theo phiên bản.', newLine: 'Mới', search: 'Tìm tên / biểu mẫu', saved: 'Tuyến đã lưu', empty: 'Không có tuyến đã lưu.', scope: 'Phạm vi', name: 'Tên tuyến', form: 'Biểu mẫu', steps: 'Bước', author: 'Người tạo', usage: 'Lượt dùng', version: 'Phiên bản', default: 'Mặc định', copy: 'Sao chép', remove: 'Xóa', setDefault: 'Đặt mặc định', addStep: 'Thêm người duyệt', apply: 'Dùng tuyến này', save: 'Lưu', cancel: 'Đóng', kind: 'Loại', department: 'Bộ phận', personRole: 'Người / Role', position: 'Chức vụ', displayTitle: 'Chức danh hiển thị', mode: 'Chế độ', group: 'Nhóm', immediate: 'Đến ngay', required: 'Bắt buộc', locked: 'Khóa chính sách', actions: 'Sắp xếp / Xóa', noCandidate: 'Chỉ định Role', warning: 'Không thể xóa bước bắt buộc theo chính sách.' },
  en: { title: 'Approval line manager', description: 'Version personal, department, and company approval lines.', newLine: 'New', search: 'Search name / form', saved: 'Saved lines', empty: 'No saved approval lines.', scope: 'Scope', name: 'Line name', form: 'Form', steps: 'Steps', author: 'Author', usage: 'Usage', version: 'Version', default: 'Default', copy: 'Copy', remove: 'Delete', setDefault: 'Set default', addStep: 'Add approver', apply: 'Use this line', save: 'Save', cancel: 'Close', kind: 'Type', department: 'Department', personRole: 'Person / Role', position: 'Position', displayTitle: 'Display title', mode: 'Execution', group: 'Group', immediate: 'Immediate', required: 'Required', locked: 'Policy lock', actions: 'Order / Delete', noCandidate: 'Assign Role', warning: 'Mandatory policy steps cannot be deleted.' },
} satisfies Record<Locale, Record<string, string>>;

const ROLES: Role[] = ['SUPER_ADMIN', 'DEPARTMENT_MANAGER', 'PM', 'WORKER', 'EVALUATION_ADMIN', 'SYSTEM_ADMIN'];

interface Props {
  locale: Locale;
  companyId: CompanyId;
  currentUser: PersonnelCard;
  users: PersonnelCard[];
  formType?: ApprovalRequestType;
  initialSteps: ApprovalDocumentLineStep[];
  onApply: (line: ApprovalLineDefinition) => void;
  onClose: () => void;
}

export function ApprovalLineManager({ locale, companyId, currentUser, users, formType, initialSteps, onApply, onClose }: Props) {
  const copy = COPY[locale];
  const organizationNodes = useMemo(() => getOrganizationNodes(companyId), [companyId]);
  const normalizeDepartmentId = useCallback((departmentId?: string) => departmentId
    ? organizationNodes.some((node) => node.id === departmentId)
      ? departmentId
      : resolveOrganizationAlias(companyId, departmentId) ?? departmentId
    : undefined, [companyId, organizationNodes]);
  const normalizeLineSteps = (steps: ApprovalDocumentLineStep[]) => steps.map((step) => ({
    ...step,
    departmentId: normalizeDepartmentId(step.departmentId),
  }));
  const currentOrganizationId = useMemo(() => resolvePersonnelOrganization(currentUser).primaryNodeId, [currentUser]);
  const selectableOrganizations = useMemo(() => organizationNodes.filter((node) => !['COMPANY', 'EXECUTIVE'].includes(node.kind)), [organizationNodes]);
  const companyUsers = useMemo(() => users.filter((user) => user.companyId === companyId && user.id !== currentUser.id && user.isActive !== false && user.employmentStatus !== 'RESIGNED'), [companyId, currentUser.id, users]);
  const eligibleUsersForStep = (step: ApprovalDocumentLineStep) => {
    if (!step.departmentId) return companyUsers;
    const organizationIds = new Set(getOrganizationDescendants(normalizeDepartmentId(step.departmentId) ?? step.departmentId, true));
    return companyUsers.filter((user) => organizationIds.has(resolvePersonnelOrganization(user).primaryNodeId));
  };
  const savedLines = useApprovalStore((state) => state.savedLines);
  const saveLine = useApprovalStore((state) => state.saveLine);
  const deleteLine = useApprovalStore((state) => state.deleteLine);
  const copyLine = useApprovalStore((state) => state.copyLine);
  const setDefaultLine = useApprovalStore((state) => state.setDefaultLine);
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState<ApprovalLineDefinition>(() => createLineDefinition({
    companyId,
    ownerId: currentUser.id,
    departmentId: currentOrganizationId,
    name: formType ? `${formType} 기본 결재선` : '새 결재선',
    formType,
    steps: normalizeLineSteps(initialSteps),
  }));

  const visibleLines = useMemo(() => savedLines
    .filter((line) => line.companyId === companyId)
    .filter((line) => line.scope === 'COMPANY' || line.scope === 'DEPARTMENT' && normalizeDepartmentId(line.departmentId) === currentOrganizationId || line.ownerId === currentUser.id)
    .filter((line) => `${line.name} ${line.formType ?? ''}`.toLowerCase().includes(query.toLowerCase())), [companyId, currentOrganizationId, currentUser.id, normalizeDepartmentId, query, savedLines]);

  const updateStep = (stepId: string, updates: Partial<ApprovalDocumentLineStep>) => setDraft((current) => ({
    ...current,
    steps: current.steps.map((step) => step.id === stepId ? { ...step, ...updates } : step),
  }));

  const addStep = () => setDraft((current) => ({
    ...current,
    steps: normalizeApprovalSteps([...current.steps, {
      id: `step_${Date.now()}`,
      label: '결재',
      sequence: current.steps.length + 1,
      kind: 'APPROVAL',
      executionMode: 'SEQUENTIAL',
      immediateArrival: false,
      required: false,
      policyLocked: false,
      status: 'PENDING',
    }]),
  }));

  const removeStep = (step: ApprovalDocumentLineStep) => {
    if (step.policyLocked) {
      setMessage(copy.warning);
      return;
    }
    setDraft((current) => ({ ...current, steps: normalizeApprovalSteps(current.steps.filter((item) => item.id !== step.id)) }));
  };

  const save = () => {
    const errors = validateApprovalLine(draft.steps, currentUser.id);
    if (!draft.name.trim() || errors.length) {
      setMessage(!draft.name.trim() ? copy.name : errors.join(' '));
      return;
    }
    saveLine(draft);
    setMessage(`${copy.save}: ${draft.name}`);
  };

  const selectLine = (line: ApprovalLineDefinition) => setDraft({ ...line, steps: normalizeLineSteps(line.steps) });

  return (
    <ResponsiveDialogShell
      title={copy.title}
      description={copy.description}
      onClose={onClose}
      footer={<ActionButtonGroup label="결재선 저장 작업" className="justify-end"><SemanticActionButton variant="neutral" tooltip={copy.cancel} onClick={onClose}>{copy.cancel}</SemanticActionButton><SemanticActionButton variant="save" icon={<Save className="h-4 w-4" />} tooltip={copy.save} onClick={save}>{copy.save}</SemanticActionButton><SemanticActionButton variant="primary" icon={<Check className="h-4 w-4" />} tooltip={copy.apply} onClick={() => onApply(draft)}>{copy.apply}</SemanticActionButton></ActionButtonGroup>}
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3">
          <div className="flex items-center justify-between gap-2"><h3 className="text-xs font-black">{copy.saved}</h3><SemanticActionButton size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} tooltip={copy.newLine} onClick={() => setDraft(createLineDefinition({ companyId, ownerId: currentUser.id, departmentId: currentOrganizationId, name: '새 결재선', formType, steps: normalizeLineSteps(initialSteps) }))}>{copy.newLine}</SemanticActionButton></div>
          <label className="mt-3 flex min-h-10 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-3"><Search className="h-4 w-4 text-[var(--color-text-sub)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></label>
          <div className="mt-3 max-h-[58vh] space-y-2 overflow-y-auto">
            {visibleLines.length === 0 ? <p className="p-4 text-center text-xs font-semibold text-[var(--color-text-sub)]">{copy.empty}</p> : visibleLines.map((line) => <button key={line.id} type="button" onClick={() => selectLine(line)} className={`w-full border p-3 text-left ${draft.id === line.id ? 'border-[var(--color-primary)] bg-orange-50 dark:bg-orange-950/20' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-orange-300'}`}><span className="flex items-center justify-between gap-2"><strong className="truncate text-xs">{line.name}</strong>{line.isDefault && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />}</span><small className="mt-1 block text-[9px] text-[var(--color-text-sub)]">{line.scope} · {line.steps.length} STEP · v{line.version} · {line.usageCount}</small></button>)}
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="text-[10px] font-black">{copy.scope}<select value={draft.scope} onChange={(event) => setDraft((current) => ({ ...current, scope: event.target.value as ApprovalLineDefinition['scope'] }))} className="mt-1 min-h-10 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"><option value="PERSONAL">PERSONAL</option><option value="DEPARTMENT">DEPARTMENT</option><option value="COMPANY">COMPANY</option></select></label>
            <label className="text-[10px] font-black sm:col-span-2">{copy.name}<input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-1 min-h-10 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs" /></label>
            <label className="text-[10px] font-black">{copy.form}<select value={draft.formType ?? ''} onChange={(event) => setDraft((current) => ({ ...current, formType: event.target.value as ApprovalRequestType || undefined }))} className="mt-1 min-h-10 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"><option value="">ALL</option><option value="LEAVE_REQUEST">LEAVE_REQUEST</option><option value="EXPENSE_APPROVAL">EXPENSE_APPROVAL</option><option value="PURCHASE_APPROVAL">PURCHASE_APPROVAL</option><option value="BUSINESS_TRIP">BUSINESS_TRIP</option><option value="GENERAL_APPROVAL">GENERAL_APPROVAL</option></select></label>
            <div className="sm:col-span-2 xl:col-span-4 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[var(--color-text-sub)]"><span>{copy.steps} {draft.steps.length}</span><span>{copy.author} {draft.ownerId}</span><span>{copy.usage} {draft.usageCount}</span><span>{copy.version} {draft.version}</span><ActionButtonGroup label="저장 결재선 관리" className="ml-auto"><SemanticActionButton size="sm" variant="duplicate" icon={<Copy className="h-3 w-3" />} tooltip={copy.copy} onClick={() => { const id = copyLine(draft.id, currentUser.id); if (id) setMessage(copy.copy); }} disabled={!savedLines.some((line) => line.id === draft.id)} disabledReason="저장된 결재선만 복사할 수 있습니다.">{copy.copy}</SemanticActionButton><SemanticActionButton size="sm" variant="view" icon={<Star className="h-3 w-3" />} tooltip={copy.setDefault} onClick={() => setDefaultLine(draft.id, currentUser.id)} disabled={!savedLines.some((line) => line.id === draft.id)} disabledReason="결재선을 먼저 저장해 주세요.">{copy.setDefault}</SemanticActionButton><DangerActionSection><SemanticActionButton size="sm" variant="danger" icon={<Trash2 className="h-3 w-3" />} tooltip={copy.remove} onClick={() => { if (deleteLine(draft.id, currentUser.id)) setDraft(createLineDefinition({ companyId, ownerId: currentUser.id, name: '새 결재선', formType, steps: normalizeLineSteps(initialSteps) })); else setMessage(copy.warning); }} disabled={!savedLines.some((line) => line.id === draft.id)} disabledReason="저장된 결재선만 삭제할 수 있습니다.">{copy.remove}</SemanticActionButton></DangerActionSection></ActionButtonGroup></div>
          </div>

          <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-black"><UsersRound className="h-4 w-4 text-[var(--color-primary)]" />{copy.steps}</h3><SemanticActionButton size="sm" variant="add-resource" icon={<Plus className="h-3.5 w-3.5" />} tooltip={copy.addStep} onClick={addStep}>{copy.addStep}</SemanticActionButton></div>
          <div className="space-y-3">
            {draft.steps.map((step, index) => <article key={step.id} className="min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm">
              <div className="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-[52px_130px_minmax(130px,1fr)_minmax(160px,1.3fr)_110px_120px_90px]">
                <div className="flex h-10 items-center justify-center rounded-lg bg-slate-100 font-mono text-xs font-black text-slate-700">{String(index + 1).padStart(2, '0')}</div>
                <select aria-label={copy.kind} value={step.kind ?? 'APPROVAL'} onChange={(event) => updateStep(step.id, { kind: event.target.value as ApprovalDocumentLineStep['kind'], label: event.target.selectedOptions[0]?.text ?? step.label })} className="min-h-10 min-w-0 border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"><option value="APPROVAL">결재</option><option value="FINAL_APPROVAL">전결</option><option value="AGREEMENT">합의</option><option value="COOPERATION">협조</option><option value="REFERENCE">참조</option></select>
                <select aria-label={copy.department} value={step.departmentId ?? ''} onChange={(event) => updateStep(step.id, { departmentId: event.target.value, approverId: undefined })} className="min-h-10 min-w-0 border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"><option value="">{copy.department}</option>{selectableOrganizations.map((node) => <option key={node.id} value={node.id}>{node.displayOrderCode} · {node.name}</option>)}</select>
                <select aria-label={copy.personRole} value={step.approverId ? `USER:${step.approverId}` : step.approverRole ? `ROLE:${step.approverRole}` : ''} onChange={(event) => { const [kind, value] = event.target.value.split(':'); updateStep(step.id, kind === 'USER' ? { approverId: value, approverRole: undefined } : { approverId: undefined, approverRole: value as Role }); }} className="min-h-10 min-w-0 border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"><option value="">{copy.personRole}</option><optgroup label="Role">{ROLES.map((role) => <option key={role} value={`ROLE:${role}`}>{role}</option>)}</optgroup><optgroup label="Person">{eligibleUsersForStep(step).map((user) => <option key={user.id} value={`USER:${user.id}`}>{user.displayName || user.name || user.id}</option>)}</optgroup></select>
                <input aria-label={copy.position} value={step.positionTitle ?? ''} onChange={(event) => updateStep(step.id, { positionTitle: event.target.value })} placeholder={copy.position} className="min-h-10 min-w-0 border border-[var(--color-border)] px-2 text-xs" />
                <select aria-label={copy.mode} value={step.executionMode ?? 'SEQUENTIAL'} onChange={(event) => updateStep(step.id, { executionMode: event.target.value as ApprovalDocumentLineStep['executionMode'] })} className="min-h-10 min-w-0 border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-xs"><option value="SEQUENTIAL">SEQUENTIAL</option><option value="PARALLEL_ALL">PARALLEL_ALL</option><option value="REFERENCE_ONLY">REFERENCE_ONLY</option></select>
                <input aria-label={copy.group} value={step.groupId ?? ''} onChange={(event) => updateStep(step.id, { groupId: event.target.value })} placeholder={copy.group} className="min-h-10 min-w-0 border border-[var(--color-border)] px-2 text-xs" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--color-border)] pt-3 text-[10px] font-bold">
                <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(step.immediateArrival)} onChange={(event) => updateStep(step.id, { immediateArrival: event.target.checked })} />{copy.immediate}</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(step.canEditLine)} onChange={(event) => updateStep(step.id, { canEditLine: event.target.checked })} />A · Line</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(step.canEditContent)} onChange={(event) => updateStep(step.id, { canEditContent: event.target.checked })} />B · Content</label>
                <label className="flex items-center gap-1"><input type="checkbox" checked={Boolean(step.required)} disabled={step.policyLocked} onChange={(event) => updateStep(step.id, { required: event.target.checked })} />{copy.required}</label>
                {step.policyLocked && <span className="inline-flex items-center gap-1 text-amber-700"><LockKeyhole className="h-3 w-3" />{copy.locked}</span>}
                <div className="ml-auto flex gap-1"><button type="button" onClick={() => setDraft((current) => ({ ...current, steps: moveApprovalStep(current.steps, step.id, -1) }))} disabled={index === 0} aria-label="Move up" className="flex h-8 w-8 items-center justify-center border border-[var(--color-border)] disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setDraft((current) => ({ ...current, steps: moveApprovalStep(current.steps, step.id, 1) }))} disabled={index === draft.steps.length - 1} aria-label="Move down" className="flex h-8 w-8 items-center justify-center border border-[var(--color-border)] disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button><button type="button" onClick={() => removeStep(step)} aria-label="Delete step" className="flex h-8 w-8 items-center justify-center border border-red-200 text-red-700"><Trash2 className="h-3.5 w-3.5" /></button></div>
              </div>
            </article>)}
          </div>
          {message && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">{message}</p>}
        </section>
      </div>
    </ResponsiveDialogShell>
  );
}
