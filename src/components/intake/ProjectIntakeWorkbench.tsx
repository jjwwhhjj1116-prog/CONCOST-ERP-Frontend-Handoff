'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileCheck2,
  FileText,
  History,
  KeyRound,
  Plus,
  Pencil,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import { useTranslation } from '@/lib/localization';
import { buildProjectIntakeDraft, evaluateProjectIntakeCompleteness } from '@/lib/projectIntake';
import { resolveProjectIntakeSelection } from '@/lib/projectIntakeMode';
import { projectBoardHref } from '@/lib/projectExecutionUnits';
import { getProjectIntakeCreateBlockedCopy } from '@/lib/runtimeBoundaryCopy';
import { useProjectIntakeStore } from '@/store/projectIntakeStore';
import { useUiStore } from '@/store/uiStore';
import { ProjectExecutionUnitSelector } from '@/components/intake/ProjectExecutionUnitSelector';
import {
  PersonnelCard,
  ProjectIntakeContact,
  ProjectIntakeDraft,
  ProjectIntakeMaterial,
  ProjectIntakeSecretReference,
  ProjectIntakeStatus,
} from '@/types/models';

type Translate = ReturnType<typeof useTranslation>;
type Props = { currentUser: PersonnelCard; t: Translate; view?: 'CREATE' | 'LIST'; requestedIntakeId?: string };

const STATUSES: ProjectIntakeStatus[] = ['DRAFT', 'REVIEWED', 'ACCEPTED'];
const MATERIAL_STATUSES: ProjectIntakeMaterial['status'][] = ['NOT_RECEIVED', 'PARTIAL', 'RECEIVED', 'CONFIRMED'];
const inputClass = 'w-full min-w-0 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60';
const iconButtonClass = 'inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:bg-[var(--color-bg-sub)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';

const statusClass: Record<ProjectIntakeStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  REVIEWED: 'bg-blue-50 text-blue-700 border-blue-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const makeContact = (): ProjectIntakeContact => ({
  id: `contact-${crypto.randomUUID()}`,
  name: '',
  role: '',
  department: '',
  telephone: '',
  mobile: '',
  email: '',
});

const makeMaterial = (): ProjectIntakeMaterial => ({
  id: `material-${crypto.randomUUID()}`,
  category: 'other',
  label: '',
  memo: '',
  status: 'NOT_RECEIVED',
  comment: '',
  confirmedBy: '',
  originalName: '',
  size: null,
  mimeType: '',
  storageKey: '',
});

const makeSecretReference = (): ProjectIntakeSecretReference => ({
  id: `secret-reference-${crypto.randomUUID()}`,
  label: '',
  provider: '',
  reference: 'vault://',
  note: '',
});

export function ProjectIntakeWorkbench({ currentUser, t, view = 'CREATE', requestedIntakeId }: Props) {
  const {
    intakes,
    persistenceMode,
    loading,
    error: syncError,
    sync,
    createDraft,
    duplicateDraft,
    deleteDraft,
    discardDraft,
    saveDraft,
    review,
    accept,
    finalizeWonIntake,
  } = useProjectIntakeStore();
  const boundaryLocale = useUiStore((state) => state.brandWorkspace === 'VIET_QS' ? 'vi' : 'ko');
  const router = useRouter();
  const actor = useMemo(() => ({ id: currentUser.id, role: currentUser.role, departmentId: currentUser.departmentId }), [currentUser]);
  const [selectedId, setSelectedId] = useState('');
  const [createdDraftId, setCreatedDraftId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectIntakeStatus | 'ALL'>('ALL');
  const [draft, setDraft] = useState<ProjectIntakeDraft | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const activeCreateDraftId = useRef('');
  const finalizingRef = useRef(false);
  const hydratedSelectionId = useRef('');

  useEffect(() => { void sync(actor); }, [actor, sync]);

  const filtered = useMemo(() => intakes.filter((intake) => {
    if (statusFilter !== 'ALL' && intake.status !== statusFilter) return false;
    const search = query.trim().toLowerCase();
    if (!search) return true;
    const candidate = intake.draft || buildProjectIntakeDraft(intake);
    return [candidate.projectName, candidate.projectNo, candidate.company, candidate.client]
      .some((value) => value.toLowerCase().includes(search));
  }), [intakes, query, statusFilter]);

  const selectionMode = requestedIntakeId ? 'EDIT' : view;
  const selection = resolveProjectIntakeSelection({
    mode: selectionMode,
    requestedIntakeId,
    selectedId,
    createdDraftId,
    availableIds: intakes.map((item) => item.id),
    filteredIds: filtered.map((item) => item.id),
  });
  const selected = selection.selectedId
    ? intakes.find((item) => item.id === selection.selectedId) || null
    : null;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (selection.requestedIdMissing && !loading && persistenceMode !== 'CHECKING') {
        setSelectedId('');
        setDraft(null);
        setActionError('요청한 프로젝트 접수 내역을 찾을 수 없습니다.');
        return;
      }
      if (!selected) {
        setDraft(null);
        hydratedSelectionId.current = '';
        return;
      }
      const selectionChanged = hydratedSelectionId.current !== selected.id;
      hydratedSelectionId.current = selected.id;
      if (selected.id !== selectedId) setSelectedId(selected.id);
      setDraft(buildProjectIntakeDraft(selected));
      setReviewNote(selected.reviewNote || '');
      if (selectionChanged) setActiveStep(1);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loading, persistenceMode, selected, selectedId, selection.requestedIdMissing]);

  const missing = draft ? evaluateProjectIntakeCompleteness(draft) : [];
  const readOnly = !selected?.permissions?.canEdit || selected.status === 'ACCEPTED';

  const updateDraft = <K extends keyof ProjectIntakeDraft>(key: K, value: ProjectIntakeDraft[K]) => {
    setDraft((current) => current ? { ...current, [key]: value } : current);
  };

  const run = async (action: 'save' | 'review' | 'accept') => {
    if (busy || !selected || !draft) return;
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      if (action === 'save') await saveDraft(selected.id, draft, actor);
      if (action === 'review') await review(selected.id, draft, reviewNote, actor);
      if (action === 'accept') await accept(selected.id, reviewNote, actor);
      setMessage(t(`projectIntake.message.${action}` as Parameters<Translate>[0]));
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t('projectIntake.error.generic'));
    } finally {
      setBusy(false);
    }
  };

  const completeWonIntake = async () => {
    if (busy || finalizingRef.current || !selected || !draft || selected.status === 'ACCEPTED') return;
    if (missing.length) {
      const firstMissing = missing[0];
      const missingStep = ['materials'].includes(firstMissing) ? 2
        : ['expectedStartDate', 'deliveryDate'].includes(firstMissing) ? 3
          : ['contact'].includes(firstMissing) ? 4
            : 1;
      setActiveStep(missingStep);
      setMessage('');
      setActionError(`수주 완료 전 필수 정보를 입력해 주세요: ${missing.map((key) => t(`projectIntake.missing.${key}` as Parameters<Translate>[0])).join(', ')}`);
      return;
    }

    finalizingRef.current = true;
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      await finalizeWonIntake(selected.id, draft, reviewNote, actor);
      setMessage(t('projectIntake.message.accept'));
      const destinationUnitIds = draft.primaryUnitId
        ? [draft.primaryUnitId, ...draft.targetUnitIds]
        : draft.targetUnitIds;
      router.push(projectBoardHref(destinationUnitIds));
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t('projectIntake.error.generic'));
    } finally {
      finalizingRef.current = false;
      setBusy(false);
    }
  };

  const updateContact = (index: number, patch: Partial<ProjectIntakeContact>) => {
    if (!draft) return;
    updateDraft('contacts', draft.contacts.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const updateMaterial = (index: number, patch: Partial<ProjectIntakeMaterial>) => {
    if (!draft) return;
    updateDraft('materials', draft.materials.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const attachMaterialFile = (index: number, file: File | undefined) => {
    if (!file) return;
    updateMaterial(index, {
      originalName: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      storageKey: `pending://${file.name}`,
      status: 'RECEIVED',
    });
  };

  const attachRequestFile = (file: File | undefined) => {
    if (!draft || !file) return;
    updateDraft('materials', [...draft.materials, {
      ...makeMaterial(),
      category: 'client-request',
      label: '수주시 요청사항',
      memo: draft.request,
      status: 'RECEIVED',
      originalName: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      storageKey: `pending://${file.name}`,
    }]);
  };

  const updateSecret = (index: number, patch: Partial<ProjectIntakeSecretReference>) => {
    if (!draft) return;
    updateDraft('secretReferences', draft.secretReferences.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const startNewDraft = () => {
    if (persistenceMode !== 'LOCAL_DEMO') {
      setMessage('');
      setActionError(getProjectIntakeCreateBlockedCopy(boundaryLocale));
      return;
    }
    if (activeCreateDraftId.current) {
      setSelectedId(activeCreateDraftId.current);
      return;
    }
    try {
      const created = createDraft(actor);
      activeCreateDraftId.current = created.id;
      setCreatedDraftId(created.id);
      setSelectedId(created.id);
      setDraft(buildProjectIntakeDraft(created));
      setActiveStep(1);
      setMessage('새 프로젝트 접수를 시작했습니다.');
      setActionError('');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t('projectIntake.error.generic'));
    }
  };

  const cancelCurrent = () => {
    if (selectionMode === 'CREATE' && createdDraftId) {
      try {
        discardDraft(createdDraftId, actor);
        activeCreateDraftId.current = '';
        setCreatedDraftId('');
        setSelectedId('');
        setDraft(null);
        setReviewNote('');
        setMessage('');
        setActionError('');
      } catch (caught) {
        setActionError(caught instanceof Error ? caught.message : t('projectIntake.error.generic'));
      }
      return;
    }
    if (selected) {
      setDraft(buildProjectIntakeDraft(selected));
      setReviewNote(selected.reviewNote || '');
      setMessage('');
      setActionError('');
    }
  };

  const duplicateCurrent = () => {
    if (!selected) return;
    try {
      const duplicated = duplicateDraft(selected.id, actor);
      activeCreateDraftId.current = duplicated.id;
      setCreatedDraftId(duplicated.id);
      setSelectedId(duplicated.id);
      setDraft(buildProjectIntakeDraft(duplicated));
      setActiveStep(1);
      setMessage('프로젝트 접수를 복제했습니다. 복사본을 수정해 주세요.');
      setActionError('');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t('projectIntake.error.generic'));
    }
  };

  const deleteCurrent = () => {
    if (!selected || !window.confirm(`'${draft?.projectName || t('projectIntake.untitled')}' 프로젝트 접수 초안을 삭제할까요? 수주 계보에 연결된 접수는 삭제되지 않습니다.`)) return;
    try {
      deleteDraft(selected.id, actor);
      activeCreateDraftId.current = '';
      setCreatedDraftId('');
      setSelectedId('');
      setDraft(null);
      setReviewNote('');
      setMessage('프로젝트 접수 초안을 삭제했습니다.');
      setActionError('');
      router.replace('/projects/intake?tab=PROJECT_INTAKE');
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t('projectIntake.error.generic'));
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-main)]">{t('projectIntake.title')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-sub)]">{t('projectIntake.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-sub)]">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 bg-[var(--color-primary)] px-3 font-bold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            onClick={startNewDraft}
          >
            <Plus size={15} />
            새 프로젝트 접수
          </button>
          {(createdDraftId || selected?.id) && (
            <button
              type="button"
              onClick={cancelCurrent}
              className="inline-flex h-9 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 font-bold text-[var(--color-text-main)] hover:bg-[var(--color-bg-sub)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              취소
            </button>
          )}
          <span className="border border-[var(--color-border)] bg-[var(--color-bg-sub)] px-2 py-1">
            {persistenceMode === 'SERVER' ? t('projectIntake.persistence.server') : t('projectIntake.persistence.local')}
          </span>
          <button type="button" title={t('common.refresh')} className={iconButtonClass} onClick={() => void sync(actor)} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 border-b border-[var(--color-border)] pb-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <label className="relative block">
          <span className="sr-only">{t('projectIntake.search')}</span>
          <Search size={16} className="absolute left-3 top-2.5 text-[var(--color-text-sub)]" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} className={`${inputClass} pl-9`} placeholder={t('projectIntake.search')} />
        </label>
        <select aria-label={t('projectIntake.statusFilter')} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProjectIntakeStatus | 'ALL')} className={inputClass}>
          <option value="ALL">{t('projectIntake.status.ALL')}</option>
          {STATUSES.map((status) => <option key={status} value={status}>{t(`projectIntake.status.${status}` as Parameters<Translate>[0])}</option>)}
        </select>
      </div>

      {(syncError || actionError || message) && (
        <div role="status" className={`border px-3 py-2 text-sm ${actionError || syncError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {actionError || syncError || message}
        </div>
      )}

      <div className="grid min-w-0 min-h-[640px] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-[var(--color-border)] bg-[var(--color-bg)] lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <span className="text-sm font-semibold text-[var(--color-text-main)]">{t('projectIntake.list')}</span>
            <span className="text-xs text-[var(--color-text-sub)]">{filtered.length}</span>
          </div>
          <div className="max-h-72 overflow-y-auto lg:max-h-[690px]">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--color-text-sub)]">{t('projectIntake.empty')}</p>
            ) : filtered.map((intake) => {
              const itemDraft = intake.draft || buildProjectIntakeDraft(intake);
              return (
                <button
                  key={intake.id}
                  type="button"
                  onClick={() => {
                    if (intake.id === createdDraftId) {
                      setSelectedId(intake.id);
                    } else {
                      router.push(`/projects/intake?tab=PROJECT_INTAKE&intakeId=${encodeURIComponent(intake.id)}`);
                    }
                    setMessage('');
                    setActionError('');
                  }}
                  className={`w-full border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] ${selected?.id === intake.id ? 'bg-[var(--color-surface)]' : 'hover:bg-[var(--color-bg-sub)]'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-text-main)]">{itemDraft.projectName || t('projectIntake.untitled')}</span>
                    <span className={`shrink-0 border px-2 py-0.5 text-[11px] font-semibold ${statusClass[intake.status]}`}>
                      {t(`projectIntake.status.${intake.status}` as Parameters<Translate>[0])}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[var(--color-text-sub)]">{itemDraft.projectNo} · {itemDraft.client || itemDraft.company || '-'}</p>
                  <p className="mt-2 text-[11px] text-[var(--color-text-sub)]">{t('projectIntake.version', { version: String(intake.version) })}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0">
          {!selected || !draft ? (
            <div className="flex min-h-[420px] items-center justify-center p-8 text-center text-sm text-[var(--color-text-sub)]">{t('projectIntake.selectPrompt')}</div>
          ) : (
            <div>
              <header className="border-b border-[var(--color-border)] px-4 py-4 md:px-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <FileCheck2 size={18} className="text-[var(--color-primary)]" />
                      <h2 className="truncate text-lg font-bold text-[var(--color-text-main)]">{draft.projectName || t('projectIntake.untitled')}</h2>
                      <span className={`border px-2 py-0.5 text-xs font-semibold ${statusClass[selected.status]}`}>{t(`projectIntake.status.${selected.status}` as Parameters<Translate>[0])}</span>
                    </div>
                    <p className="mt-2 break-all text-xs text-[var(--color-text-sub)]">
                      {t('projectIntake.sourceTrace')}: {draft.source.estimateRequestId} → {draft.source.commercialDecisionId} → {draft.source.projectId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.permissions?.canEdit && selected.status !== 'ACCEPTED' && (
                      <button type="button" onClick={() => setActiveStep(1)} disabled={busy} className="inline-flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"><Pencil size={16} />수정</button>
                    )}
                    <button type="button" onClick={duplicateCurrent} disabled={busy} className="inline-flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"><Copy size={16} />복제</button>
                    <button type="button" onClick={deleteCurrent} disabled={busy} className="inline-flex items-center gap-2 border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"><Trash2 size={16} />삭제</button>
                    {selected.permissions?.canEdit && selected.status !== 'ACCEPTED' && (
                      <button type="button" onClick={() => void run('save')} disabled={busy} className="inline-flex items-center gap-2 bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-60">
                        <Save size={16} />{t('projectIntake.action.save')}
                      </button>
                    )}
                  </div>
                </div>
                <div className={`mt-4 border px-3 py-2 text-xs ${missing.length ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                  {missing.length ? `${t('projectIntake.completeness.missing')}: ${missing.map((key) => t(`projectIntake.missing.${key}` as Parameters<Translate>[0])).join(', ')}` : t('projectIntake.completeness.complete')}
                </div>
                <ol className="mt-4 grid gap-2 sm:grid-cols-4" aria-label="프로젝트 접수 단계">
                  {[
                    ['기본정보', '업무 성격·범위'],
                    ['접수자료', '도면·내역서·요청파일'],
                    ['프로젝트 일정', '착수·중간·최종 납품'],
                    ['담당자·요청', '연락처·별도 요청사항'],
                  ].map(([title, detail], index) => {
                    const step = index + 1;
                    return <button key={title} type="button" onClick={() => setActiveStep(step)} className={`min-h-16 border px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${activeStep === step ? 'border-[var(--color-primary)] bg-orange-50 text-orange-900' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-sub)]'}`}><span className="text-[10px] font-black">STEP {String(step).padStart(2, '0')}</span><strong className="mt-1 block text-sm">{title}</strong><span className="mt-0.5 block text-[10px] font-semibold">{detail}</span></button>;
                  })}
                </ol>
              </header>

              <div className="divide-y divide-[var(--color-border)]">
                {activeStep === 1 && (
                <section className="p-4 md:p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><FileText size={16} />{t('projectIntake.section.basic')}</h3>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {([
                      ['projectName', 'projectIntake.field.projectName'], ['projectNo', 'projectIntake.field.projectNo'],
                      ['company', 'projectIntake.field.company'], ['client', 'projectIntake.field.client'],
                      ['usage', 'projectIntake.field.usage'], ['area', 'projectIntake.field.area'],
                      ['buildings', 'projectIntake.field.buildings'], ['floors', 'projectIntake.field.floors'],
                      ['bidDate', 'projectIntake.field.bidDate'], ['unitPrice', 'projectIntake.field.unitPrice'],
                    ] as Array<[keyof ProjectIntakeDraft, string]>).map(([key, label]) => (
                      <label key={key} className="block text-xs font-medium text-[var(--color-text-sub)]">
                        <span className="mb-1 block">{t(label as Parameters<Translate>[0])}</span>
                        <input disabled={readOnly} value={String(draft[key] ?? '')} onChange={(event) => updateDraft(key, event.target.value as never)} className={inputClass} />
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="block text-xs font-medium text-[var(--color-text-sub)]">
                      <span className="mb-1 block">{t('projectIntake.field.businessTypes')}</span>
                      <input disabled={readOnly} value={draft.businessTypes.join(', ')} onChange={(event) => updateDraft('businessTypes', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className={inputClass} />
                    </label>
                    <label className="block text-xs font-medium text-[var(--color-text-sub)]">
                      <span className="mb-1 block">{t('projectIntake.field.scopes')}</span>
                      <input disabled={readOnly} value={draft.scopes.join(', ')} onChange={(event) => updateDraft('scopes', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className={inputClass} />
                    </label>
                  </div>
                  <div className="mt-3">
                    <ProjectExecutionUnitSelector value={draft.targetUnitIds} primaryUnitId={draft.primaryUnitId} disabled={readOnly} onChange={(targetUnitIds, primaryUnitId) => { updateDraft('targetUnitIds', targetUnitIds); updateDraft('primaryUnitId', primaryUnitId); }} />
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {(['workContent', 'notes'] as const).map((key) => (
                      <label key={key} className="block text-xs font-medium text-[var(--color-text-sub)]">
                        <span className="mb-1 block">{t(`projectIntake.field.${key}` as Parameters<Translate>[0])}</span>
                        <textarea disabled={readOnly} value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)} rows={4} className={inputClass} />
                      </label>
                    ))}
                  </div>
                </section>
                )}

                {activeStep === 4 && (
                <section className="p-4 md:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><UserRound size={16} />{t('projectIntake.section.contacts')}</h3>
                    {!readOnly && <button type="button" title={t('projectIntake.action.addContact')} className={iconButtonClass} onClick={() => updateDraft('contacts', [...draft.contacts, makeContact()])}><Plus size={16} /></button>}
                  </div>
                  <div className="space-y-3">
                    {draft.contacts.map((contact, index) => (
                      <div key={contact.id} className="grid gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] p-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]">
                        {(['name', 'role', 'department', 'telephone', 'mobile', 'email'] as const).map((key) => (
                          <label key={key} className="text-[11px] text-[var(--color-text-sub)]">
                            <span className="mb-1 block">{t(`projectIntake.contact.${key}` as Parameters<Translate>[0])}</span>
                            <input type={key === 'email' ? 'email' : 'text'} disabled={readOnly} value={contact[key]} onChange={(event) => updateContact(index, { [key]: event.target.value })} className={inputClass} />
                          </label>
                        ))}
                        {!readOnly && <button type="button" title={t('common.delete')} className={`${iconButtonClass} self-end text-red-600`} onClick={() => updateDraft('contacts', draft.contacts.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}
                      </div>
                    ))}
                  </div>
                </section>
                )}

                {activeStep === 2 && (
                <section className="p-4 md:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><FileCheck2 size={16} />{t('projectIntake.section.materials')}</h3>
                    {!readOnly && <button type="button" title={t('projectIntake.action.addMaterial')} className={iconButtonClass} onClick={() => updateDraft('materials', [...draft.materials, makeMaterial()])}><Plus size={16} /></button>}
                  </div>
                  <div className="max-w-full overflow-x-auto border border-[var(--color-border)] overscroll-x-contain">
                    <table className="w-full min-w-[850px] text-left text-xs">
                      <thead className="bg-[var(--color-bg)] text-[var(--color-text-sub)]"><tr><th className="p-2">{t('projectIntake.material.label')}</th><th className="p-2">{t('projectIntake.material.status')}</th><th className="p-2">{t('projectIntake.material.file')}</th><th className="p-2">{t('projectIntake.material.memo')}</th><th className="p-2">{t('projectIntake.material.comment')}</th><th className="w-12 p-2"></th></tr></thead>
                      <tbody>
                        {draft.materials.map((material, index) => (
                          <tr key={material.id} className="border-t border-[var(--color-border)] align-top">
                            <td className="p-2"><input disabled={readOnly} value={material.label} onChange={(event) => updateMaterial(index, { label: event.target.value })} className={inputClass} /></td>
                            <td className="p-2"><select disabled={readOnly} value={material.status} onChange={(event) => updateMaterial(index, { status: event.target.value as ProjectIntakeMaterial['status'] })} className={inputClass}>{MATERIAL_STATUSES.map((status) => <option key={status} value={status}>{t(`projectIntake.materialStatus.${status}` as Parameters<Translate>[0])}</option>)}</select></td>
                            <td className="max-w-56 p-2 text-[var(--color-text-sub)]"><label className={`inline-flex min-h-9 cursor-pointer items-center gap-2 border border-dashed border-[var(--color-border)] px-2 text-[11px] font-bold ${readOnly ? 'pointer-events-none opacity-60' : 'hover:border-[var(--color-primary)]'}`}><Upload className="h-3.5 w-3.5" /><span className="max-w-36 truncate">{material.originalName || '파일 선택'}</span><input type="file" disabled={readOnly} className="sr-only" accept=".pdf,.dwg,.dxf,.xlsx,.xls,.hwp,.hwpx,.doc,.docx,.zip,.jpg,.jpeg,.png,.txt" onChange={(event) => attachMaterialFile(index, event.target.files?.[0])} /></label>{material.size ? <span className="mt-1 block text-[10px]">{Math.max(1, Math.round(material.size / 1024))} KB</span> : null}</td>
                            <td className="p-2"><input disabled={readOnly} value={material.memo} onChange={(event) => updateMaterial(index, { memo: event.target.value })} className={inputClass} /></td>
                            <td className="p-2"><input disabled={readOnly} value={material.comment} onChange={(event) => updateMaterial(index, { comment: event.target.value })} className={inputClass} /></td>
                            <td className="p-2">{!readOnly && <button type="button" title={t('common.delete')} className={`${iconButtonClass} text-red-600`} onClick={() => updateDraft('materials', draft.materials.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
                )}

                {activeStep === 3 && (
                <section className="p-4 md:p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><History size={16} />프로젝트 일정</h3>
                  <p className="mb-4 text-xs font-semibold text-[var(--color-text-sub)]">착수 예정일과 단계별 납품일을 입력하면 접수 승인 후 프로젝트 일정관리로 승계됩니다.</p>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {([
                      ['expectedStartDate', 'projectIntake.field.expectedStartDate'],
                      ['firstDelivery', 'projectIntake.field.firstDelivery'],
                      ['secondDelivery', 'projectIntake.field.secondDelivery'],
                      ['thirdDelivery', 'projectIntake.field.thirdDelivery'],
                      ['finalDelivery', 'projectIntake.field.finalDelivery'],
                    ] as Array<[keyof ProjectIntakeDraft, string]>).map(([key, label]) => (
                      <label key={key} className="block text-xs font-medium text-[var(--color-text-sub)]"><span className="mb-1 block">{t(label as Parameters<Translate>[0])}</span><input type="date" disabled={readOnly} value={String(draft[key] ?? '')} onChange={(event) => updateDraft(key, event.target.value as never)} className={inputClass} /></label>
                    ))}
                  </div>
                </section>
                )}

                {activeStep === 4 && (
                <section className="p-4 md:p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><FileText size={16} />별도 요청사항</h3>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <label className="block text-xs font-medium text-[var(--color-text-sub)]"><span className="mb-1 block">수주시 요청사항 · 발주처 특이사항</span><textarea disabled={readOnly} value={draft.request} onChange={(event) => updateDraft('request', event.target.value)} rows={7} className={inputClass} placeholder="텍스트를 직접 입력하거나 오른쪽에서 메모·엑셀·한글 파일을 첨부하세요." /></label>
                    <label className={`flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] p-5 text-center ${readOnly ? 'pointer-events-none opacity-60' : 'hover:border-[var(--color-primary)]'}`}><Upload className="h-7 w-7 text-[var(--color-primary)]" /><strong className="mt-3 text-sm text-[var(--color-text-main)]">요청사항 파일 첨부</strong><span className="mt-1 text-[11px] text-[var(--color-text-sub)]">TXT, XLSX, HWP, DOCX, PDF</span><input type="file" disabled={readOnly} className="sr-only" accept=".txt,.xlsx,.xls,.hwp,.hwpx,.doc,.docx,.pdf" onChange={(event) => attachRequestFile(event.target.files?.[0])} /></label>
                  </div>
                </section>
                )}

                {activeStep === 4 && (
                <section className="p-4 md:p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><KeyRound size={16} />{t('projectIntake.section.secrets')}</h3>
                      <p className="mt-1 text-xs text-[var(--color-text-sub)]">{t('projectIntake.secrets.notice')}</p>
                    </div>
                    {!readOnly && <button type="button" title={t('projectIntake.action.addSecret')} className={iconButtonClass} onClick={() => updateDraft('secretReferences', [...draft.secretReferences, makeSecretReference()])}><Plus size={16} /></button>}
                  </div>
                  <div className="space-y-2">
                    {draft.secretReferences.length === 0 && <p className="border border-dashed border-[var(--color-border)] px-3 py-5 text-center text-xs text-[var(--color-text-sub)]">{t('projectIntake.secrets.empty')}</p>}
                    {draft.secretReferences.map((secret, index) => (
                      <div key={secret.id} className="grid gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] p-3 md:grid-cols-[1fr_1fr_2fr_2fr_auto]">
                        {(['label', 'provider', 'reference', 'note'] as const).map((key) => (
                          <label key={key} className="text-[11px] text-[var(--color-text-sub)]"><span className="mb-1 block">{t(`projectIntake.secret.${key}` as Parameters<Translate>[0])}</span><input disabled={readOnly} value={secret[key]} onChange={(event) => updateSecret(index, { [key]: event.target.value })} className={inputClass} placeholder={key === 'reference' ? 'vault://workspace/project' : ''} /></label>
                        ))}
                        {!readOnly && <button type="button" title={t('common.delete')} className={`${iconButtonClass} self-end text-red-600`} onClick={() => updateDraft('secretReferences', draft.secretReferences.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={15} /></button>}
                      </div>
                    ))}
                  </div>
                </section>
                )}

                {activeStep === 4 && (
                <section className="grid gap-4 p-4 md:grid-cols-2 md:p-6">
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><ClipboardCheck size={16} />{t('projectIntake.section.review')}</h3>
                    <textarea disabled={!selected.permissions?.canReview || selected.status === 'ACCEPTED'} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} rows={5} className={inputClass} placeholder={t('projectIntake.review.placeholder')} />
                  </div>
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><History size={16} />{t('projectIntake.section.history')}</h3>
                    <div className="max-h-40 overflow-y-auto border border-[var(--color-border)]">
                      {(selected.histories || []).length === 0 ? <p className="p-3 text-xs text-[var(--color-text-sub)]">{t('projectIntake.history.empty')}</p> : (selected.histories || []).map((history) => (
                        <div key={history.id} className="border-b border-[var(--color-border)] px-3 py-2 text-xs last:border-b-0">
                          <div className="flex items-center justify-between gap-2"><strong className="text-[var(--color-text-main)]">{history.action}</strong><span className="text-[var(--color-text-sub)]">{new Date(history.createdAt).toLocaleString()}</span></div>
                          <p className="mt-1 text-[var(--color-text-sub)]">{history.actorId}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
                )}

                <footer className="flex items-center justify-between gap-3 p-4 md:p-6">
                  <button type="button" onClick={() => setActiveStep((step) => Math.max(1, step - 1))} disabled={activeStep === 1} className="inline-flex min-h-10 items-center gap-2 border border-[var(--color-border)] px-4 text-sm font-black text-[var(--color-text-main)] disabled:opacity-40"><ArrowLeft className="h-4 w-4" />이전 단계</button>
                  <span className="text-xs font-black text-[var(--color-text-sub)]">{activeStep} / 4</span>
                  {activeStep < 4 ? (
                    <button type="button" onClick={() => setActiveStep((step) => Math.min(4, step + 1))} className="inline-flex min-h-10 items-center gap-2 bg-[var(--color-primary)] px-4 text-sm font-black text-white">다음 단계<ArrowRight className="h-4 w-4" /></button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void completeWonIntake()}
                      disabled={busy || selected.status === 'ACCEPTED' || !selected.permissions?.canReview}
                      className="inline-flex min-h-10 items-center gap-2 bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {selected.status === 'ACCEPTED' ? '수주 완료됨' : t('projectIntake.action.accept')}
                    </button>
                  )}
                </footer>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
