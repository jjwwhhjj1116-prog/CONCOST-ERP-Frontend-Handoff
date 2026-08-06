'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Ban,
  CircleOff,
  Database,
  FileSpreadsheet,
  FileCheck2,
  FileText,
  History,
  Mail,
  MessageSquareText,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  Copy,
  RefreshCw,
  Save,
  Search,
  PauseCircle,
  Trash2,
  X,
} from 'lucide-react';
import { useTranslation } from '@/lib/localization';
import { projectBoardHref } from '@/lib/projectExecutionUnits';
import { useEstimateRequestStore } from '@/store/estimateRequestStore';
import { useEstimateSheetStore } from '@/store/estimateSheetStore';
import { ProjectExecutionUnitSelector } from '@/components/intake/ProjectExecutionUnitSelector';
import { EstimateRequestProfileEditor } from '@/components/intake/EstimateRequestProfileEditor';
import { ActionButtonGroup, SemanticActionButton, semanticActionClasses, type SemanticActionVariant } from '@/components/ui/SemanticActionButton';
import { evaluateEstimateAccess } from '@/lib/accessControl';
import {
  filterActiveEstimateRequestWorklist,
  mergeEstimateRequestIntoIntakeDraft,
  resolveEstimateRequestDeletePolicy,
  resolveEstimateRequestEditPolicy,
  type EstimateRequestEditMode,
} from '@/lib/estimateRequestUx';
import { buildProjectIntakeDraft } from '@/lib/projectIntake';
import { useProjectIntakeStore } from '@/store/projectIntakeStore';
import {
  CommercialDecisionInput,
  CommercialDecisionType,
  EstimateRequest,
  EstimateRequestActivityKind,
  EstimateRequestStatus,
  PersonnelCard,
  ProjectExecutionUnitId,
} from '@/types/models';

type Translate = ReturnType<typeof useTranslation>;

const STATUSES: EstimateRequestStatus[] = [
  'REQUEST_MEMO',
  'ESTIMATE_DRAFTING',
  'WAITING',
  'WON',
  'LOST',
  'CANCELLED',
  'ON_HOLD',
  'OTHER',
];

const OPERATIONAL_STATUSES: EstimateRequestStatus[] = [
  'REQUEST_MEMO',
  'ESTIMATE_DRAFTING',
  'WAITING',
  'OTHER',
];

const DECISIONS: Array<{ value: CommercialDecisionType; icon: typeof BadgeCheck }> = [
  { value: 'WON', icon: BadgeCheck },
  { value: 'LOST', icon: CircleOff },
  { value: 'CANCELLED', icon: Ban },
  { value: 'ON_HOLD', icon: PauseCircle },
];

const decisionVariants: Record<CommercialDecisionType, SemanticActionVariant> = {
  WON: 'success',
  LOST: 'reject',
  CANCELLED: 'archive',
  ON_HOLD: 'warning',
};

const semanticLinkClass = (variant: SemanticActionVariant) => `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black shadow-sm transition hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${semanticActionClasses[variant]}`;

const ACTIVITY_ICONS = {
  CONSULTATION: MessageSquareText,
  CALL: Phone,
  EMAIL: Mail,
  NOTE: FileText,
};

const statusText = (t: Translate, status: EstimateRequestStatus) => t(`estimateRequest.status.${status}` as Parameters<Translate>[0]);
const activityText = (t: Translate, kind: EstimateRequestActivityKind) => t(`estimateRequest.activity.${kind}` as Parameters<Translate>[0]);

type Props = {
  currentUser: PersonnelCard;
  t: Translate;
};

const emptyDraft = {
  projectName: '',
  projectNo: '',
  company: '',
  client: '',
  contact: '',
  contactDepartment: '',
  phone: '',
  email: '',
  targetUnitIds: [] as ProjectExecutionUnitId[],
  primaryUnitId: null as ProjectExecutionUnitId | null,
  memo: '',
  scope: '',
  usage: '',
  areaPy: '',
  areaM2: '',
  floors: '',
  basementFloors: '',
  groundFloors: '',
  buildingCount: '',
  workCategory: '',
  executionType: '',
  unitWork: '',
  estimateType: '',
  bidDate: '',
  firstDelivery: '',
};

export function EstimateRequestWorkbench({ currentUser, t }: Props) {
  const router = useRouter();
  const {
    requests,
    persistenceMode,
    loading,
    error,
    sync,
    createRequest,
    duplicateRequest,
    archiveRequest,
    updateRequest,
    changeStatus,
    recordDecision,
    addActivity,
    addAttachments,
    removeAttachment,
  } = useEstimateRequestStore();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EstimateRequestStatus | 'ALL'>('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(() => typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('requestId'));
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [activityKind, setActivityKind] = useState<EstimateRequestActivityKind>('CONSULTATION');
  const [activityContent, setActivityContent] = useState('');
  const [decisionDraft, setDecisionDraft] = useState<CommercialDecisionInput>({
    decision: 'WON',
    reason: '',
    agreedAmount: '',
    agreedScope: '',
    agreedSchedule: '',
    startCondition: '',
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EstimateRequestEditMode>('VIEW');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const sheets = useEstimateSheetStore((state) => state.sheets);

  useEffect(() => { void sync(); }, [sync]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return filterActiveEstimateRequestWorklist(requests).filter((request) => {
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      const haystack = [request.requestNo, request.projectName, request.company, request.client, request.contact]
        .filter(Boolean).join(' ').toLowerCase();
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [query, requests, statusFilter]);
  const selected = filtered.find((request) => request.id === selectedId) || filtered[0] || null;
  const editPolicy = selected ? resolveEstimateRequestEditPolicy(selected) : null;
  const deletePolicy = selected ? resolveEstimateRequestDeletePolicy(selected, sheets[selected.id]) : null;

  const selectRequest = useCallback((id: string | null, historyMode: 'push' | 'replace' = 'push') => {
    setSelectedId(id);
    setEditorMode('VIEW');
    setDeleteOpen(false);
    setDeleteConfirmed(false);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (id) url.searchParams.set('requestId', id);
    else url.searchParams.delete('requestId');
    window.history[historyMode === 'push' ? 'pushState' : 'replaceState']({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  useEffect(() => {
    const restore = () => {
      setSelectedId(new URLSearchParams(window.location.search).get('requestId'));
      setEditorMode('VIEW');
    };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);

  useEffect(() => {
    if ((selectedId && requests.some((request) => request.id === selectedId)) || !filtered[0]) return;
    const timer = window.setTimeout(() => selectRequest(filtered[0].id, 'replace'), 0);
    return () => window.clearTimeout(timer);
  }, [filtered, requests, selectRequest, selectedId]);

  const canManage = (request: EstimateRequest) => {
    void request;
    return evaluateEstimateAccess(currentUser).allowed;
  };

  const run = async (operation: () => Promise<void>, success: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await operation();
      setMessage(success);
      return true;
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : t('estimateRequest.errorGeneric'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      const created = await createRequest({
        ...draft,
        departmentId: currentUser.departmentId,
        projectName: draft.projectName.trim(),
      }, currentUser.id);
      selectRequest(created.id);
      setDraft(emptyDraft);
      setShowCreate(false);
    }, t('estimateRequest.created'));
  };

  const handleStatus = async (status: EstimateRequestStatus) => {
    if (!selected) return;
    await run(async () => {
      const updated = await changeStatus(selected.id, status, currentUser.id);
      selectRequest(updated.id, 'replace');
    }, t('estimateRequest.statusChanged'));
  };

  const handleDecision = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    await run(async () => {
      const result = await recordDecision(selected.id, decisionDraft, currentUser.id);
      selectRequest(result.request.id, 'replace');
      setDecisionDraft({ decision: 'WON', reason: '', agreedAmount: '', agreedScope: '', agreedSchedule: '', startCondition: '' });
      if (decisionDraft.decision === 'WON' && result.intake) {
        router.push(`/projects/intake?intakeId=${encodeURIComponent(result.intake.id)}`);
      }
    }, decisionDraft.decision === 'WON' ? t('estimateRequest.decisionWon') : t('estimateRequest.decisionSaved'));
  };

  const handleEdit = async (updates: Partial<EstimateRequest>) => {
    if (!selected) return;
    const previousMode = editorMode;
    setEditorMode('SAVING');
    const saved = await run(async () => {
      const updated = await updateRequest(selected.id, updates, currentUser.id);
      await useEstimateSheetStore.getState().syncProfile(selected.id, currentUser.id);
      if (previousMode === 'CORRECTION' && updated.projectIntakeId) {
        const actor = { id: currentUser.id, role: currentUser.role, departmentId: currentUser.departmentId };
        await useProjectIntakeStore.getState().sync(actor);
        const intake = useProjectIntakeStore.getState().intakes.find((item) => item.id === updated.projectIntakeId);
        if (!intake) throw new Error('연결된 프로젝트 접수를 찾지 못했습니다. 정정 내용을 다시 확인해 주세요.');
        if (intake.status !== 'DRAFT') throw new Error('작성 중인 프로젝트 접수만 견적 의뢰에서 동기화할 수 있습니다.');
        await useProjectIntakeStore.getState().saveDraft(
          intake.id,
          mergeEstimateRequestIntoIntakeDraft(updated, buildProjectIntakeDraft(intake)),
          actor,
        );
      }
    }, t('estimateRequest.saved'));
    setEditorMode(saved ? 'VIEW' : previousMode);
  };

  const handleDuplicate = async () => {
    if (!selected) return;
    await run(async () => {
      const duplicated = await duplicateRequest(selected.id, currentUser.id);
      selectRequest(duplicated.id);
    }, '견적 의뢰를 복제했습니다. 복사본을 확인한 뒤 수정해 주세요.');
  };

  const handleDelete = async () => {
    if (!selected || !deletePolicy || !deleteConfirmed) return;
    const archivedId = selected.id;
    const archived = await run(async () => {
      await archiveRequest(archivedId, currentUser.id);
    }, '의뢰관리 목록에서 제거하고 DB에 보관했습니다.');
    if (archived) {
      selectRequest(filtered.find((item) => item.id !== archivedId)?.id || null, 'replace');
      setDeleteOpen(false);
      setDeleteConfirmed(false);
    }
  };

  const handleActivity = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !activityContent.trim()) return;
    await run(async () => {
      await addActivity(selected.id, activityKind, activityContent.trim(), currentUser.id);
      setActivityContent('');
    }, t('estimateRequest.activityAdded'));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!selected || !files?.length) return;
    await run(async () => { await addAttachments(selected.id, 'REFERENCE', Array.from(files), currentUser.id); }, t('estimateRequest.attachmentAdded'));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_10px_28px_rgba(15,23,42,.07)]">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-main)]">{t('estimateRequest.title')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-sub)]">{t('estimateRequest.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${persistenceMode === 'SERVER' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {persistenceMode === 'SERVER' ? t('estimateRequest.serverMode') : t('estimateRequest.localMode')}
          </span>
          <SemanticActionButton size="icon" variant="neutral" tooltip={t('estimateRequest.refresh')} loading={loading} onClick={() => void sync()}><RefreshCw className="size-4" /></SemanticActionButton>
          <Link href="/projects/intake/estimates" className={semanticLinkClass('document')}><FileCheck2 className="size-4" />{t('estimateSubmission.openManagement')}</Link>
          {evaluateEstimateAccess(currentUser).allowed && <Link href="/projects/intake/database" className={semanticLinkClass('view')}><Database className="size-4" />{t('estimateDb.title')}</Link>}
          <SemanticActionButton variant="primary" icon={<Plus className="size-4" />} tooltip={t('estimateRequest.new')} onClick={() => setShowCreate((value) => !value)}>{t('estimateRequest.new')}</SemanticActionButton>
        </div>
      </header>

      {(message || error) && <div role="status" className="border-l-4 border-[var(--color-primary)] bg-[var(--color-bg-sub)] px-4 py-3 text-sm">{message || error}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_10px_28px_rgba(15,23,42,.07)]">
          <div className="mb-4 flex items-center gap-2"><FileText className="size-5" /><h2 className="font-bold">{t('estimateRequest.createTitle')}</h2></div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Field label={t('estimateRequest.projectName')} required value={draft.projectName} onChange={(value) => setDraft({ ...draft, projectName: value })} />
            <Field label={t('estimateRequest.company')} value={draft.company} onChange={(value) => setDraft({ ...draft, company: value })} />
            <Field label={t('estimateRequest.client')} value={draft.client} onChange={(value) => setDraft({ ...draft, client: value })} />
            <Field label={t('estimateRequest.contact')} value={draft.contact} onChange={(value) => setDraft({ ...draft, contact: value })} />
            <Field label={t('estimateRequest.contactDepartment')} value={draft.contactDepartment} onChange={(value) => setDraft({ ...draft, contactDepartment: value })} />
            <Field label={t('estimateRequest.phone')} value={draft.phone} onChange={(value) => setDraft({ ...draft, phone: value })} />
            <Field label={t('estimateRequest.email')} type="email" value={draft.email} onChange={(value) => setDraft({ ...draft, email: value })} />
            <Field label={t('estimateRequest.firstDelivery')} type="date" value={draft.firstDelivery} onChange={(value) => setDraft({ ...draft, firstDelivery: value })} />
            <Field label={t('estimateRequest.scope')} value={draft.scope} onChange={(value) => setDraft({ ...draft, scope: value })} />
            <Field label={t('estimateRequest.usage')} value={draft.usage} onChange={(value) => setDraft({ ...draft, usage: value })} />
            <Field label={t('estimateRequest.areaPy')} value={draft.areaPy} onChange={(value) => setDraft({ ...draft, areaPy: value })} />
            <Field label={t('estimateRequest.floors')} value={draft.floors} onChange={(value) => setDraft({ ...draft, floors: value })} />
            <div className="md:col-span-2 xl:col-span-4"><ProjectExecutionUnitSelector value={draft.targetUnitIds} primaryUnitId={draft.primaryUnitId} onChange={(targetUnitIds, primaryUnitId) => setDraft({ ...draft, targetUnitIds, primaryUnitId })} /></div>
            <label className="text-sm md:col-span-2 xl:col-span-3"><span className="mb-1 block font-medium">{t('estimateRequest.memo')}</span>
              <textarea rows={2} value={draft.memo} onChange={(event) => setDraft({ ...draft, memo: event.target.value })} className="w-full rounded border bg-[var(--color-surface)] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <SemanticActionButton variant="neutral" tooltip={t('common.cancel')} onClick={() => setShowCreate(false)}>{t('common.cancel')}</SemanticActionButton>
            <SemanticActionButton type="submit" variant="primary" icon={<Save className="size-4" />} loading={busy} disabled={!draft.projectName.trim() || draft.targetUnitIds.length === 0 || !draft.primaryUnitId} disabledReason={!draft.projectName.trim() ? '프로젝트명을 입력해 주세요.' : draft.targetUnitIds.length === 0 || !draft.primaryUnitId ? '담당부서와 주관부서를 선택해 주세요.' : undefined} tooltip={t('common.save')}>{t('common.save')}</SemanticActionButton>
          </div>
        </form>
      )}

      <div className="grid min-h-[560px] gap-5 xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
        <section aria-label={t('estimateRequest.listTitle')} className="min-w-0 self-start rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_10px_28px_rgba(15,23,42,.07)] xl:sticky xl:top-4">
          <div className="mb-3"><p className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">REQUEST NAVIGATOR</p><h2 className="text-base font-black">{t('estimateRequest.listTitle')}</h2></div>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_170px]">
            <label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[var(--color-text-sub)]" />
              <input aria-label={t('estimateRequest.search')} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('estimateRequest.search')} className="w-full rounded border bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" />
            </label>
            <select aria-label={t('estimateRequest.statusFilter')} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as EstimateRequestStatus | 'ALL')} className="rounded border bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              <option value="ALL">{t('common.all')}</option>
              {STATUSES.map((status) => <option key={status} value={status}>{statusText(t, status)}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            {filtered.length === 0 ? <p className="p-8 text-center text-sm text-[var(--color-text-sub)]">{t('estimateRequest.empty')}</p> : filtered.map((request) => (
              <button key={request.id} type="button" aria-current={selected?.id === request.id ? 'true' : undefined} onClick={() => selectRequest(request.id)} className={`relative grid w-full grid-cols-[1fr_auto] gap-3 rounded-md border p-4 pl-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${selected?.id === request.id ? 'border-orange-400 bg-orange-50 shadow-[0_8px_20px_rgba(234,88,12,.15)] before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-r before:bg-[var(--color-primary)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50/40 hover:shadow-sm'}`}>
                <span className="min-w-0"><span className="block truncate font-semibold">{request.projectName}</span><span className="mt-1 block truncate text-xs text-[var(--color-text-sub)]">{request.projectNo || '프로젝트번호 발급 대기'} · {request.company || request.client || '-'}</span></span>
                <span className="flex flex-col items-end gap-1 self-center text-xs font-semibold text-[var(--color-primary)]">{selected?.id === request.id && <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] text-white">선택됨</span>}<span>{statusText(t, request.status)}</span></span>
              </button>
            ))}
          </div>
        </section>

        <section aria-label={t('estimateRequest.detailTitle')} className="min-w-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 shadow-[0_10px_28px_rgba(15,23,42,.07)] sm:p-5">
          {!selected ? <p className="p-8 text-center text-sm text-[var(--color-text-sub)]">{t('estimateRequest.selectPrompt')}</p> : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-orange-300 bg-gradient-to-r from-orange-50 via-white to-white p-4 shadow-sm">
                <div><p className="text-xs font-semibold text-[var(--color-primary)]">{selected.projectNo || '수주 완료 시 프로젝트번호 발급'}</p><h2 className="mt-1 text-xl font-bold">{selected.projectName}</h2><p className="mt-1 text-sm text-[var(--color-text-sub)]">{selected.company || selected.client || '-'}</p></div>
                <ActionButtonGroup label="견적 의뢰 작업">
                  <SemanticActionButton variant="edit" icon={<Pencil className="size-4" />} tooltip={editPolicy?.reason || editPolicy?.actionLabel || '수정'} onClick={() => {
                    if (!editPolicy) return;
                    if (!editPolicy.editable) {
                      setMessage(editPolicy.reason);
                      return;
                    }
                    setEditorMode(editPolicy.mode);
                    window.setTimeout(() => document.querySelector<HTMLElement>('[data-estimate-field="projectName"]')?.focus(), 0);
                  }} disabled={!canManage(selected) || busy || editorMode === 'SAVING'} disabledReason={!canManage(selected) ? '견적 의뢰 수정 권한이 필요합니다.' : editorMode === 'SAVING' ? '저장 중입니다.' : undefined}>{editPolicy?.actionLabel || '수정'}</SemanticActionButton>
                  <SemanticActionButton variant="duplicate" icon={<Copy className="size-4" />} tooltip="견적 의뢰 복제" onClick={() => void handleDuplicate()} disabled={!canManage(selected) || busy} disabledReason={!canManage(selected) ? '견적 의뢰 복제 권한이 필요합니다.' : undefined}>복제</SemanticActionButton>
                  <Link href={`/projects/intake/estimate?requestId=${encodeURIComponent(selected.id)}`} className={semanticLinkClass('document')}><FileSpreadsheet className="size-4" />{t('estimateSheet.open')}</Link>
                  <SemanticActionButton variant="danger" icon={<Trash2 className="size-4" />} tooltip="삭제 가능 여부와 연결 대상을 확인합니다." onClick={() => { setDeleteConfirmed(false); setDeleteOpen(true); }} disabled={!canManage(selected) || busy} disabledReason={!canManage(selected) ? '견적 의뢰 삭제 권한이 필요합니다.' : undefined}>삭제</SemanticActionButton>
                  {OPERATIONAL_STATUSES.includes(selected.status) ? (
                    <select aria-label={t('estimateRequest.changeStatus')} value={selected.status} disabled={!canManage(selected) || busy} onChange={(event) => void handleStatus(event.target.value as EstimateRequestStatus)} className="rounded border bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50">
                      {OPERATIONAL_STATUSES.map((status) => <option key={status} value={status}>{statusText(t, status)}</option>)}
                    </select>
                  ) : <span className="border px-3 py-2 text-sm font-semibold text-[var(--color-primary)]">{statusText(t, selected.status)}</span>}
                </ActionButtonGroup>
              </div>

              <EstimateRequestProfileEditor key={`${selected.id}:${selected.version}`} request={selected} mode={editorMode} disabled={!canManage(selected)} busy={busy} onSave={handleEdit} onCancel={() => setEditorMode('VIEW')} />

              <section id="estimate-step-04" aria-labelledby="commercial-decision-title" className="scroll-mt-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.06)] sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">STEP 04</div><h3 id="commercial-decision-title" className="font-bold">{t('estimateRequest.decisionTitle')}</h3>
                    <p className="mt-1 text-xs text-[var(--color-text-sub)]">{t('estimateRequest.decisionDescription')}</p>
                  </div>
                  {selected.projectId && (
                    <Link href={projectBoardHref(selected.targetUnitIds || [])} className={semanticLinkClass('view')}>
                      <BadgeCheck className="size-4" />{t('estimateRequest.openProject')}
                    </Link>
                  )}
                </div>
                {(selected.projectId || ['WON', 'LOST', 'CANCELLED'].includes(selected.status)) ? (
                  <p className="mt-4 text-sm font-semibold text-[var(--color-primary)]">{t('estimateRequest.decisionLocked')}</p>
                ) : (
                  <form onSubmit={handleDecision} className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {DECISIONS.map(({ value, icon: Icon }) => (
                        <SemanticActionButton key={value} variant={decisionVariants[value]} icon={<Icon className="size-4" />} tooltip={`${statusText(t, value)} 판정 선택`} aria-pressed={decisionDraft.decision === value} className={decisionDraft.decision === value ? 'ring-2 ring-offset-2 ring-current' : ''} onClick={() => setDecisionDraft({ ...decisionDraft, decision: value })}>{statusText(t, value)}{decisionDraft.decision === value ? ' · 선택됨' : ''}</SemanticActionButton>
                      ))}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm sm:col-span-2"><span className="mb-1 block font-medium">{t('estimateRequest.decisionReason')}</span><textarea required={['LOST', 'CANCELLED'].includes(decisionDraft.decision)} rows={2} value={decisionDraft.reason || ''} onChange={(event) => setDecisionDraft({ ...decisionDraft, reason: event.target.value })} className="w-full rounded border bg-[var(--color-surface)] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" /></label>
                      <Field label={t('estimateRequest.agreedAmount')} value={decisionDraft.agreedAmount || ''} onChange={(value) => setDecisionDraft({ ...decisionDraft, agreedAmount: value })} />
                      <Field label={t('estimateRequest.agreedSchedule')} value={decisionDraft.agreedSchedule || ''} onChange={(value) => setDecisionDraft({ ...decisionDraft, agreedSchedule: value })} />
                      <label className="text-sm"><span className="mb-1 block font-medium">{t('estimateRequest.agreedScope')}</span><textarea rows={2} value={decisionDraft.agreedScope || ''} onChange={(event) => setDecisionDraft({ ...decisionDraft, agreedScope: event.target.value })} className="w-full rounded border bg-[var(--color-surface)] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" /></label>
                      <label className="text-sm"><span className="mb-1 block font-medium">{t('estimateRequest.startCondition')}</span><textarea rows={2} value={decisionDraft.startCondition || ''} onChange={(event) => setDecisionDraft({ ...decisionDraft, startCondition: event.target.value })} className="w-full rounded border bg-[var(--color-surface)] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" /></label>
                    </div>
                    <div className="flex justify-end"><SemanticActionButton type="submit" variant="save" icon={<BadgeCheck className="size-4" />} loading={busy} disabled={!canManage(selected)} disabledReason={!canManage(selected) ? '견적 판정 저장 권한이 필요합니다.' : undefined} tooltip={t('estimateRequest.confirmDecision')}>{t('estimateRequest.confirmDecision')}</SemanticActionButton></div>
                  </form>
                )}
              </section>

              <section id="estimate-step-05" className="scroll-mt-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.06)] sm:p-5">
                <div className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">STEP 05</div>
                <h3 className="mb-3 flex items-center gap-2 font-bold"><MessageSquareText className="size-4" />{t('estimateRequest.activityTitle')}</h3>
                <form onSubmit={handleActivity} className="grid gap-2 sm:grid-cols-[150px_1fr_auto]">
                  <select value={activityKind} onChange={(event) => setActivityKind(event.target.value as EstimateRequestActivityKind)} disabled={!canManage(selected)} className="rounded border bg-[var(--color-surface)] px-2 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                    {(Object.keys(ACTIVITY_ICONS) as EstimateRequestActivityKind[]).map((kind) => <option key={kind} value={kind}>{activityText(t, kind)}</option>)}
                  </select>
                  <input value={activityContent} onChange={(event) => setActivityContent(event.target.value)} disabled={!canManage(selected)} placeholder={t('estimateRequest.activityPlaceholder')} className="rounded border bg-[var(--color-surface)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" />
                  <SemanticActionButton type="submit" variant="add-resource" icon={<Plus className="size-4" />} loading={busy} disabled={!canManage(selected) || !activityContent.trim()} disabledReason={!canManage(selected) ? '상담 기록 추가 권한이 필요합니다.' : !activityContent.trim() ? '상담 내용을 입력해 주세요.' : undefined} tooltip={t('common.add')}>{t('common.add')}</SemanticActionButton>
                </form>
                <div className="mt-3 space-y-2">{selected.activities.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.kind];
                  return <div key={activity.id} className="flex gap-3 border-b py-2 text-sm"><Icon className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" /><div><strong>{activityText(t, activity.kind)}</strong><p className="mt-0.5 whitespace-pre-wrap text-[var(--color-text-sub)]">{activity.content}</p><time className="text-xs text-[var(--color-text-sub)]">{new Date(activity.occurredAt).toLocaleString()}</time></div></div>;
                })}</div>
              </section>

              <section id="estimate-step-06" className="scroll-mt-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.06)] sm:p-5">
                <div className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">STEP 06</div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 font-bold"><Paperclip className="size-4" />{t('estimateRequest.attachmentTitle')}</h3>
                  <label className={`cursor-pointer rounded border px-3 py-2 text-sm font-semibold focus-within:ring-2 focus-within:ring-[var(--color-primary)] ${canManage(selected) ? '' : 'pointer-events-none opacity-50'}`}>{t('estimateRequest.addFiles')}<input type="file" multiple disabled={!canManage(selected) || busy} className="sr-only" onChange={(event) => { void handleFiles(event.target.files); event.target.value = ''; }} /></label>
                </div>
                <p className="mb-2 text-xs text-[var(--color-text-sub)]">{t('estimateRequest.metadataOnly')}</p>
                <div className="space-y-2">{selected.attachments.map((attachment) => <div key={attachment.id} className="flex items-center justify-between gap-3 border-b py-2 text-sm"><span className="min-w-0"><strong className="block truncate">{attachment.originalName}</strong><span className="text-xs text-[var(--color-text-sub)]">{attachment.category} · {(attachment.size / 1024).toFixed(1)} KB</span></span><button type="button" title={t('common.delete')} disabled={!canManage(selected)} onClick={() => void run(() => removeAttachment(selected.id, attachment.id, currentUser.id), t('estimateRequest.attachmentRemoved'))} className="grid size-8 place-items-center text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50"><Trash2 className="size-4" /></button></div>)}</div>
              </section>

              <details id="estimate-step-07" open className="scroll-mt-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_8px_22px_rgba(15,23,42,.06)] sm:p-5"><summary className="cursor-pointer font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><span className="block text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">STEP 07</span><span className="flex items-center gap-2"><History className="size-4" />{t('estimateRequest.historyTitle')} ({selected.histories.length})</span></summary><div className="mt-3 space-y-2">{selected.histories.map((history) => <div key={history.id} className="border-l-2 pl-3 text-sm"><strong>{history.action}</strong><p className="text-xs text-[var(--color-text-sub)]">{[history.fromStatus, history.toStatus].filter(Boolean).join(' → ')}</p><time className="text-xs text-[var(--color-text-sub)]">{new Date(history.createdAt).toLocaleString()}</time></div>)}</div></details>
            </div>
          )}
        </section>
      </div>

      {deleteOpen && selected && deletePolicy && (
        <div role="presentation" className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/55 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setDeleteOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="estimate-delete-title" className="w-full max-w-xl rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_70px_rgba(15,23,42,.35)]">
            <header className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <p className="text-[10px] font-black tracking-[.12em] text-red-600">WORKLIST ARCHIVE PREVIEW</p>
                <h2 id="estimate-delete-title" className="mt-1 text-lg font-black">{deletePolicy.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-sub)]">{deletePolicy.description}</p>
              </div>
              <button type="button" title="닫기" onClick={() => setDeleteOpen(false)} className="grid size-9 shrink-0 place-items-center rounded border transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><X className="size-4" /></button>
            </header>

            <div className="space-y-4 p-5">
              <div className="rounded-md border bg-[var(--color-bg-sub)] p-4">
                <p className="mb-2 text-xs font-bold text-[var(--color-text-sub)]">영향 대상</p>
                <ul className="space-y-2 text-sm">
                  {deletePolicy.targets.map((target) => <li key={target} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-[var(--color-primary)]" />{target}</li>)}
                </ul>
              </div>

              <>
                  <label className="flex cursor-pointer items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm">
                    <input type="checkbox" checked={deleteConfirmed} onChange={(event) => setDeleteConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-red-600" />
                    <span><strong className="block text-red-800">목록 제거 대상을 확인했습니다</strong><span className="mt-1 block text-xs leading-5 text-red-700">업무 데이터와 연결 계보는 삭제하지 않으며 DB관리에서 같은 의뢰 ID로 복구할 수 있습니다.</span></span>
                  </label>
                  <div className="flex justify-end gap-2">
                    <SemanticActionButton variant="neutral" tooltip="취소" onClick={() => setDeleteOpen(false)}>취소</SemanticActionButton>
                    <SemanticActionButton variant="archive" icon={<Trash2 className="size-4" />} disabled={!deleteConfirmed || busy} disabledReason={!deleteConfirmed ? '보관 대상 확인에 체크해 주세요.' : undefined} loading={busy} tooltip="의뢰관리에서 제거하고 DB에 보관합니다." onClick={() => void handleDelete()}>DB에 보관</SemanticActionButton>
                  </div>
              </>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="text-sm"><span className="mb-1 block font-medium">{label}</span><input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border bg-[var(--color-surface)] p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" /></label>;
}
