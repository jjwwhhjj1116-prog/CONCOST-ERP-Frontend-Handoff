'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
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
import { getAcceptedIntakeRevisionDiff } from '@/lib/projectIntakeRevision';
import { projectBoardHref } from '@/lib/projectExecutionUnits';
import { useProjectIntakeStore } from '@/store/projectIntakeStore';
import { ProjectExecutionUnitSelector } from '@/components/intake/ProjectExecutionUnitSelector';
import { ResponsiveDialogShell } from '@/components/ui/ResponsiveDialogShell';
import {
  PersonnelCard,
  ProjectIntakeContact,
  ProjectIntakeDraft,
  ProjectIntakeMaterial,
  ProjectIntakeSecretReference,
  ProjectIntakeStatus,
} from '@/types/models';

type Translate = ReturnType<typeof useTranslation>;
type Props = { currentUser: PersonnelCard; t: Translate; requestedIntakeId?: string };

const STATUSES: ProjectIntakeStatus[] = ['DRAFT', 'REVIEWED', 'ACCEPTED'];
const MATERIAL_STATUSES: ProjectIntakeMaterial['status'][] = ['NOT_RECEIVED', 'PARTIAL', 'RECEIVED', 'CONFIRMED'];
const inputClass = 'w-full min-w-0 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60';
const iconButtonClass = 'inline-flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:bg-[var(--color-bg-sub)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';

const statusClass: Record<ProjectIntakeStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  REVIEWED: 'bg-blue-50 text-blue-700 border-blue-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

type IntakeHistoryDetails = {
  revision?: number;
  reason?: string;
  changedFields?: string[];
  before?: unknown;
  after?: unknown;
};

const parseHistoryDetails = (changesJson?: string | null): IntakeHistoryDetails | null => {
  if (!changesJson) return null;
  try {
    const parsed = JSON.parse(changesJson) as IntakeHistoryDetails;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const auditSnapshot = (value: unknown) => JSON.stringify(value ?? {}, null, 0);

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

export function ProjectIntakeWorkbench({ currentUser, t, requestedIntakeId }: Props) {
  const {
    intakes,
    persistenceMode,
    loading,
    error: syncError,
    sync,
    saveDraft,
    review,
    accept,
    finalizeWonIntake,
    reviseAcceptedIntake,
  } = useProjectIntakeStore();
  const router = useRouter();
  const actor = useMemo(() => ({ id: currentUser.id, role: currentUser.role, departmentId: currentUser.departmentId }), [currentUser]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectIntakeStatus | 'ALL'>('ALL');
  const [draft, setDraft] = useState<ProjectIntakeDraft | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [activeStep, setActiveStep] = useState(1);
  const [validationMissing, setValidationMissing] = useState<string[]>([]);
  const [acceptedEditMode, setAcceptedEditMode] = useState(false);
  const [revisionReason, setRevisionReason] = useState('');
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

  const selectionMode = requestedIntakeId ? 'EDIT' : 'LIST';
  const selection = resolveProjectIntakeSelection({
    mode: selectionMode,
    requestedIntakeId,
    selectedId,
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
      if (selectionChanged) {
        setActiveStep(1);
        setAcceptedEditMode(false);
        setRevisionReason('');
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [loading, persistenceMode, selected, selectedId, selection.requestedIdMissing]);

  const missing = draft ? evaluateProjectIntakeCompleteness(draft) : [];
  const readOnly = !selected?.permissions?.canEdit || (selected.status === 'ACCEPTED' && !acceptedEditMode);

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
      setMessage('');
      setActionError('');
      setValidationMissing(missing);
      return;
    }

    finalizingRef.current = true;
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      const result = await finalizeWonIntake(selected.id, draft, reviewNote, actor);
      setMessage(t('projectIntake.message.accept'));
      const destinationUnitIds = result.project.primaryUnitId
        ? [result.project.primaryUnitId, ...(result.project.assignedUnitIds || [])]
        : (result.project.assignedUnitIds || []);
      router.push(projectBoardHref(destinationUnitIds, {
        projectId: result.project.id,
        view: 'PART',
      }));
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t('projectIntake.error.generic'));
    } finally {
      finalizingRef.current = false;
      setBusy(false);
    }
  };

  const stepForMissing = (key: string) => (
    key === 'materials' ? 2 : key === 'deliveryDate' ? 3 : key === 'contact' ? 4 : 1
  );

  const goToMissing = (key: string) => {
    const step = stepForMissing(key);
    setValidationMissing([]);
    setActiveStep(step);
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-intake-step="${step}"] input:not([disabled]), [data-intake-step="${step}"] textarea:not([disabled]), [data-intake-step="${step}"] select:not([disabled])`)?.focus();
    }, 0);
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
    const nextVersion = (draft?.materials[index]?.fileVersion || 0) + 1;
    updateMaterial(index, {
      originalName: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      storageKey: persistenceMode === 'LOCAL_DEMO'
        ? `demo-ready://${draft?.materials[index]?.id || 'material'}/v${nextVersion}`
        : `pending://${file.name}`,
      status: persistenceMode === 'LOCAL_DEMO' ? 'CONFIRMED' : 'RECEIVED',
      fileStatus: persistenceMode === 'LOCAL_DEMO' ? 'READY' : 'PENDING',
      fileVersion: nextVersion,
      fileId: `${draft?.materials[index]?.id || 'material'}:v${nextVersion}`,
    });
  };

  const attachRequestFile = (file: File | undefined) => {
    if (!draft || !file) return;
    const material = makeMaterial();
    updateDraft('materials', [...draft.materials, {
      ...material,
      category: 'client-request',
      label: '수주시 요청사항',
      memo: draft.request,
      status: persistenceMode === 'LOCAL_DEMO' ? 'CONFIRMED' : 'RECEIVED',
      originalName: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      storageKey: persistenceMode === 'LOCAL_DEMO' ? `demo-ready://${material.id}/v1` : `pending://${file.name}`,
      fileStatus: persistenceMode === 'LOCAL_DEMO' ? 'READY' : 'PENDING',
      fileVersion: 1,
      fileId: `${material.id}:v1`,
    }]);
  };

  const updateSecret = (index: number, patch: Partial<ProjectIntakeSecretReference>) => {
    if (!draft) return;
    updateDraft('secretReferences', draft.secretReferences.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const cancelCurrent = () => {
    if (selected) {
      setDraft(buildProjectIntakeDraft(selected));
      setReviewNote(selected.reviewNote || '');
      setAcceptedEditMode(false);
      setRevisionReason('');
      setMessage('');
      setActionError('');
    }
  };

  const openProjectBoard = () => {
    if (!selected?.projectId || !draft) return;
    router.push(projectBoardHref(draft.targetUnitIds, {
      projectId: selected.projectId,
      view: 'PART',
    }));
  };

  const beginAcceptedEdit = (step = 1) => {
    setAcceptedEditMode(true);
    setActiveStep(step);
    setMessage('');
    setActionError('');
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-intake-step="${step}"] input:not([disabled]), [data-intake-step="${step}"] textarea:not([disabled]), [data-intake-step="${step}"] select:not([disabled])`)?.focus();
    }, 0);
  };

  const beginAdditionalMaterial = () => {
    if (!draft) return;
    setDraft({ ...draft, materials: [...draft.materials, makeMaterial()] });
    beginAcceptedEdit(2);
  };

  const saveAcceptedRevision = async () => {
    if (busy || !selected || !draft || selected.status !== 'ACCEPTED') return;
    if (!revisionReason.trim()) {
      setActionError('수정 사유를 입력해 주세요.');
      document.querySelector<HTMLInputElement>('[data-revision-reason]')?.focus();
      return;
    }
    const before = buildProjectIntakeDraft(selected);
    const diff = getAcceptedIntakeRevisionDiff(before, draft);
    const important = diff.changedFields.some((field) => ['scope', 'schedule', 'primaryUnitId', 'unitAdded', 'unitRemoved'].includes(field));
    if (important && !window.confirm('업무범위, 담당부서, 주관부서 또는 일정이 변경됩니다. 같은 프로젝트와 접수번호를 유지한 채 수정본을 저장하고 관련 부서에 알릴까요?')) return;
    setBusy(true);
    setMessage('');
    setActionError('');
    try {
      const result = await reviseAcceptedIntake(selected.id, draft, revisionReason, actor);
      setDraft(buildProjectIntakeDraft(result.intake));
      setAcceptedEditMode(false);
      setRevisionReason('');
      setMessage(`수정본 ${result.revision}을 저장하고 관련 부서 알림을 생성했습니다.`);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : t('projectIntake.error.generic'));
    } finally {
      setBusy(false);
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
          {acceptedEditMode && selected?.id && (
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
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-semibold text-[var(--color-text-main)]">견적 의뢰관리에서 수주를 확정하면 자동 등록됩니다.</p>
                <button type="button" onClick={() => router.push('/projects/intake?tab=CLIENT_ORDER')} className="mt-4 inline-flex min-h-10 items-center bg-[var(--color-primary)] px-4 text-sm font-black text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">견적 의뢰관리로 이동</button>
              </div>
            ) : filtered.map((intake) => {
              const itemDraft = intake.draft || buildProjectIntakeDraft(intake);
              return (
                <button
                  key={intake.id}
                  type="button"
                  onClick={() => {
                    router.push(`/projects/intake?tab=PROJECT_INTAKE&intakeId=${encodeURIComponent(intake.id)}`);
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
                  <p className="mt-1 truncate text-xs text-[var(--color-text-sub)]">{itemDraft.projectNo || '프로젝트번호 발급 대기'} · {itemDraft.client || itemDraft.company || '-'}</p>
                  <p className="mt-2 text-[11px] text-[var(--color-text-sub)]">{t('projectIntake.version', { version: String(intake.version) })}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0">
          {!selected || !draft ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-semibold text-[var(--color-text-main)]">견적 의뢰관리에서 수주를 확정하면 자동 등록됩니다.</p>
              <p className="mt-2 text-xs text-[var(--color-text-sub)]">프로젝트 접수는 견적 수주에서 생성된 작업 대기열입니다.</p>
              <button type="button" onClick={() => router.push('/projects/intake?tab=CLIENT_ORDER')} className="mt-5 inline-flex min-h-10 items-center bg-[var(--color-primary)] px-4 text-sm font-black text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">견적 의뢰관리로 이동</button>
            </div>
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
                    <p className="mt-2 text-xs font-semibold text-[var(--color-text-sub)]">
                      {draft.projectNo ? `공식 프로젝트번호 ${draft.projectNo}` : '수주 완료 시 공식 프로젝트번호가 자동 발급됩니다.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.status === 'ACCEPTED' && !acceptedEditMode && selected.permissions?.canEdit && (
                      <>
                        <button type="button" onClick={() => beginAcceptedEdit(1)} disabled={busy} className="inline-flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-main)] hover:bg-[var(--color-bg-sub)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"><Pencil size={16} />접수 내용 수정</button>
                        <button type="button" onClick={beginAdditionalMaterial} disabled={busy} className="inline-flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-main)] hover:bg-[var(--color-bg-sub)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"><Upload size={16} />추가자료 등록</button>
                      </>
                    )}
                    {selected.status === 'ACCEPTED' && (
                      <>
                        <button type="button" onClick={() => { setActiveStep(4); window.setTimeout(() => document.querySelector('[data-intake-history]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); }} className="inline-flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-main)] hover:bg-[var(--color-bg-sub)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><History size={16} />변경이력</button>
                        <button type="button" onClick={openProjectBoard} className="inline-flex items-center gap-2 bg-[var(--color-primary)] px-3 py-2 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"><ArrowRight size={16} />프로젝트 보드</button>
                      </>
                    )}
                    {selected.permissions?.canEdit && selected.status !== 'ACCEPTED' && (
                      <button type="button" onClick={() => setActiveStep(1)} disabled={busy} className="inline-flex items-center gap-2 border border-[var(--color-border)] px-3 py-2 text-sm font-semibold text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"><Pencil size={16} />수정</button>
                    )}
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
                <section data-intake-step="1" className="p-4 md:p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><FileText size={16} />{t('projectIntake.section.basic')}</h3>
                  <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-900">
                    프로젝트번호: {draft.projectNo || '수주 완료 시 YYYY + 연도별 3자리 순번으로 자동 발급'}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {([
                      ['projectName', 'projectIntake.field.projectName'],
                      ['company', 'projectIntake.field.company'], ['client', 'projectIntake.field.client'],
                      ['usage', 'projectIntake.field.usage'], ['area', 'projectIntake.field.area'],
                      ['buildings', 'projectIntake.field.buildings'], ['floors', 'projectIntake.field.floors'],
                      ['bidDate', 'projectIntake.field.bidDate'],
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
                <section data-intake-step="4" className="p-4 md:p-6">
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
                <section data-intake-step="2" className="p-4 md:p-6">
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
                <section data-intake-step="3" className="p-4 md:p-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><History size={16} />프로젝트 일정</h3>
                  <p className="mb-4 text-xs font-semibold text-[var(--color-text-sub)]">착수일은 날짜를 지정하거나 미정으로 둘 수 있습니다. 납품 일정은 접수 승인 후 프로젝트 일정관리로 승계됩니다.</p>
                  <div className="mb-4 grid gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 sm:grid-cols-[auto_auto_minmax(180px,1fr)] sm:items-end">
                    <button type="button" disabled={readOnly} aria-pressed={draft.startDateStatus !== 'TBD'} onClick={() => updateDraft('startDateStatus', 'SCHEDULED')} className={`min-h-10 border px-4 text-sm font-black ${draft.startDateStatus !== 'TBD' ? 'border-[var(--color-primary)] bg-orange-50 text-orange-800' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>날짜 입력</button>
                    <button type="button" disabled={readOnly} aria-pressed={draft.startDateStatus === 'TBD'} onClick={() => { updateDraft('startDateStatus', 'TBD'); updateDraft('expectedStartDate', ''); }} className={`min-h-10 border px-4 text-sm font-black ${draft.startDateStatus === 'TBD' ? 'border-[var(--color-primary)] bg-orange-50 text-orange-800' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}>착수일 미정</button>
                    <label className="block text-xs font-medium text-[var(--color-text-sub)]"><span className="mb-1 block">{t('projectIntake.field.expectedStartDate')}</span><input type="date" disabled={readOnly || draft.startDateStatus === 'TBD'} value={draft.expectedStartDate} onChange={(event) => { updateDraft('expectedStartDate', event.target.value); updateDraft('startDateStatus', event.target.value ? 'SCHEDULED' : 'TBD'); }} className={inputClass} /></label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {([
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
                    {selected.status === 'ACCEPTED' && acceptedEditMode && (
                      <label className="mt-4 block rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs font-bold text-orange-950">
                        <span className="mb-1 flex items-center gap-2"><Pencil size={14} />수정 사유 <strong className="text-red-600">필수</strong></span>
                        <input data-revision-reason value={revisionReason} onChange={(event) => setRevisionReason(event.target.value)} className={`${inputClass} bg-white`} placeholder="수정 사유를 구체적으로 입력해 주세요." />
                        <span className="mt-2 block font-medium text-orange-800">동일한 접수·프로젝트·프로젝트번호를 유지하며 변경이력과 부서 알림이 생성됩니다.</span>
                      </label>
                    )}
                  </div>
                  <div data-intake-history>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)]"><History size={16} />{t('projectIntake.section.history')}</h3>
                    <div className="max-h-72 overflow-y-auto border border-[var(--color-border)]">
                      {(selected.histories || []).length === 0 ? <p className="p-3 text-xs text-[var(--color-text-sub)]">{t('projectIntake.history.empty')}</p> : (selected.histories || []).map((history) => {
                        const details = parseHistoryDetails(history.changesJson);
                        return (
                          <div key={history.id} className="border-b border-[var(--color-border)] px-3 py-2 text-xs last:border-b-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <strong className="text-[var(--color-text-main)]">{history.action}</strong>
                              <span className="text-[var(--color-text-sub)]">{new Date(history.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="mt-1 text-[var(--color-text-sub)]">수정자 {history.actorId}{details?.revision ? ` · Revision ${details.revision}` : ''}</p>
                            {details?.reason && <p data-history-reason className="mt-2 rounded bg-orange-50 px-2 py-1 font-semibold text-orange-900">사유: {details.reason}</p>}
                            {details?.changedFields?.length ? <p className="mt-1 text-[var(--color-text-sub)]">변경 항목: {details.changedFields.join(', ')}</p> : null}
                            {details?.before !== undefined && details?.after !== undefined && (
                              <div data-history-before-after className="mt-2 grid gap-2 sm:grid-cols-2">
                                <div className="rounded bg-[var(--color-bg)] p-2"><strong className="block text-[var(--color-text-main)]">변경 전</strong><span className="mt-1 block break-all text-[10px] text-[var(--color-text-sub)]">{auditSnapshot(details.before)}</span></div>
                                <div className="rounded bg-emerald-50 p-2"><strong className="block text-emerald-900">변경 후</strong><span className="mt-1 block break-all text-[10px] text-emerald-800">{auditSnapshot(details.after)}</span></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
                )}

                <footer className="flex items-center justify-between gap-3 p-4 md:p-6">
                  <button type="button" onClick={() => setActiveStep((step) => Math.max(1, step - 1))} disabled={activeStep === 1} className="inline-flex min-h-10 items-center gap-2 border border-[var(--color-border)] px-4 text-sm font-black text-[var(--color-text-main)] disabled:opacity-40"><ArrowLeft className="h-4 w-4" />이전 단계</button>
                  <span className="text-xs font-black text-[var(--color-text-sub)]">{activeStep} / 4</span>
                  {activeStep < 4 ? (
                    <button type="button" onClick={() => setActiveStep((step) => Math.min(4, step + 1))} className="inline-flex min-h-10 items-center gap-2 bg-[var(--color-primary)] px-4 text-sm font-black text-white">다음 단계<ArrowRight className="h-4 w-4" /></button>
                  ) : selected.status === 'ACCEPTED' && acceptedEditMode ? (
                    <button type="button" onClick={() => void saveAcceptedRevision()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 bg-[var(--color-primary)] px-4 text-sm font-black text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-50"><Save className="h-4 w-4" />수정본 저장 및 부서 알림</button>
                  ) : selected.status === 'ACCEPTED' ? (
                    <button type="button" onClick={openProjectBoard} className="inline-flex min-h-10 items-center gap-2 bg-[var(--color-primary)] px-4 text-sm font-black text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">프로젝트 보드<ArrowRight className="h-4 w-4" /></button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void completeWonIntake()}
                      disabled={busy || !selected.permissions?.canReview}
                      className="inline-flex min-h-10 items-center gap-2 bg-emerald-600 px-4 text-sm font-black text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {t('projectIntake.action.accept')}
                    </button>
                  )}
                </footer>
              </div>
            </div>
          )}
        </main>
      </div>
      {validationMissing.length > 0 && (
        <ResponsiveDialogShell
          eyebrow="PROJECT INTAKE VALIDATION"
          title="수주 완료 전 확인이 필요합니다"
          description="현재 단계에 입력값을 보존했습니다. 이동할 항목을 직접 선택해 주세요."
          widthClassName="sm:max-w-xl"
          onClose={() => setValidationMissing([])}
          footer={(
            <div className="flex justify-end">
              <button type="button" onClick={() => setValidationMissing([])} className="min-h-10 border border-[var(--color-border)] px-4 text-sm font-bold hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">Step 4에 머무르기</button>
            </div>
          )}
        >
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div><strong className="block text-sm">필수 입력 {validationMissing.length}건이 남아 있습니다.</strong><p className="mt-1 text-xs">착수 예정일은 필수 항목이 아니며, Step 3에서 `착수일 미정`을 선택할 수 있습니다.</p></div>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {validationMissing.map((key) => (
              <li key={key} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3">
                <div><strong className="text-sm text-[var(--color-text-main)]">{t(`projectIntake.missing.${key}` as Parameters<Translate>[0])}</strong><p className="mt-0.5 text-xs text-[var(--color-text-sub)]">STEP {stepForMissing(key)}</p></div>
                <button type="button" onClick={() => goToMissing(key)} className="min-h-9 shrink-0 bg-[var(--color-primary)] px-3 text-xs font-black text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">입력하러 가기</button>
              </li>
            ))}
          </ul>
        </ResponsiveDialogShell>
      )}
    </div>
  );
}
