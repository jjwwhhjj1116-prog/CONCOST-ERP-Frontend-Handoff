'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArchiveRestore, ArrowLeft, Copy, Database, Download, FileJson, FolderOpen, Info, LockKeyhole, Pencil, Plus, RefreshCw, Save, Search, Trash2, Undo2, X } from 'lucide-react';
import { ESTIMATE_DB_COLUMNS, ESTIMATE_DB_VENDOR_COLUMNS, exportEstimateDbJson, exportEstimateDbXlsx } from '@/lib/estimateDatabase';
import { useTranslation } from '@/lib/localization';
import { useAuthStore } from '@/store/authStore';
import { useEstimateDatabaseStore } from '@/store/estimateDatabaseStore';
import { useEstimateRequestStore } from '@/store/estimateRequestStore';
import { useTranslationStore } from '@/store/translationStore';
import { evaluateEstimateAccess } from '@/lib/accessControl';
import { InputHistoryInput } from '@/components/ui/InputHistoryInput';
import { getEstimateRequestWorklistState, matchesEstimateDbWorklistFilter, type EstimateDbWorklistFilter } from '@/lib/estimateRequestUx';
import type { EstimateDbPayload, EstimateDbRecord, EstimateDbSection, EstimateDbTargetType, EstimateDbVendor } from '@/types/models';

type Tab = EstimateDbSection | 'REPORTS';
const TABS: Tab[] = ['PJ', 'PROGRESS', 'MEP_CONTRACT', 'REPORTS'];
const PAGE_SIZE = 50;
const targetTypes: EstimateDbTargetType[] = ['ORDER', 'SALES', 'DEPOSIT'];
const WORKLIST_FILTERS: Array<{ value: EstimateDbWorklistFilter; label: string }> = [
  { value: 'ALL', label: '전체' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'TRANSFERRED_TO_INTAKE', label: '접수 이관' },
  { value: 'ARCHIVED', label: '보관' },
  { value: 'WON_COMPLETED', label: '수주완료' },
  { value: 'CLOSED', label: '취소·실주' },
];
const fieldClass = 'w-full min-w-[110px] rounded border bg-[var(--color-surface)] px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';
const buttonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded border bg-[var(--color-surface)] px-3 text-sm font-semibold transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50';
const autoLinkedColumns = new Set(['접수번호', 'PJ NO', '프로젝트 연결', '최초생성날짜']);
const requiredManualColumns = new Set(['거래처명', '프로젝트명', '작업공종', '업무성격', '건물용도']);
const memoryFieldKeys: Record<string, string> = {
  '국내/해외': 'market_scope',
  '거래처명': 'customer_company',
  '작업공종': 'work_trade',
  '작업구분': 'work_category',
  '업무성격': 'work_type',
  '단가작업여부': 'unit_price_work',
  '건물용도': 'building_use',
  '견적종류': 'estimate_type',
};

const display = (value: unknown) => value === null || value === undefined || value === '' ? '-' : String(value);
const currency = (value: string) => Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

export function EstimateDatabaseWorkbench() {
  const { currentUser } = useAuthStore();
  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);
  const store = useEstimateDatabaseStore();
  const requestStore = useEstimateRequestStore();
  const [tab, setTab] = useState<Tab>('PJ');
  const [query, setQuery] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [worklistFilter, setWorklistFilter] = useState<EstimateDbWorklistFilter>('ALL');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ rowId: string; column: string } | null>(null);
  const [memoryPickerTarget, setMemoryPickerTarget] = useState<{ rowId: string; column: string; request: number } | null>(null);
  const [draft, setDraft] = useState<EstimateDbPayload>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [sourceCell, setSourceCell] = useState<{ row: EstimateDbRecord; column: string; readonly: boolean } | null>(null);

  useEffect(() => { const timer = window.setTimeout(() => void store.sync(year), 0); return () => window.clearTimeout(timer); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestById = useMemo(() => new Map(requestStore.requests.map((request) => [request.id, request])), [requestStore.requests]);
  const rows = useMemo(() => tab === 'REPORTS' ? [] : store.records
    .filter((row) => row.section === tab && (!row.year || row.year === year))
    .filter((row) => tab !== 'PJ' || matchesEstimateDbWorklistFilter(requestById.get(row.sourceRecordId || ''), worklistFilter))
    .filter((row) => !query || `${row.pjNo || ''} ${JSON.stringify(row.data)}`.toLowerCase().includes(query.toLowerCase())), [query, requestById, store.records, tab, worklistFilter, year]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const report = store.report(year);
  const selectedRecord = store.records.find((item) => item.id === selectedId);
  const selectedRequest = selectedRecord?.sourceRecordId ? requestById.get(selectedRecord.sourceRecordId) : undefined;

  const beginEdit = (row: EstimateDbRecord) => { setSelectedId(row.id); setEditingId(row.id); setDraft({ ...row.data }); setMessage(''); };
  const openMemoryPicker = (row: EstimateDbRecord, column: string) => {
    beginEdit(row);
    setSelectedCell({ rowId: row.id, column });
    setMemoryPickerTarget({ rowId: row.id, column, request: 0 });
    window.setTimeout(() => setMemoryPickerTarget({ rowId: row.id, column, request: Date.now() }), 0);
  };
  const save = async () => {
    const row = store.records.find((item) => item.id === editingId);
    if (!row || !currentUser) return;
    setBusy(true);
    try { await store.updateRecord(row, draft, currentUser.id); setEditingId(null); setMessage(t('estimateDb.saved')); }
    catch (error) { setMessage(error instanceof Error ? error.message : t('estimateDb.error')); }
    finally { setBusy(false); }
  };
  const add = async () => {
    if (!currentUser || tab === 'REPORTS') return;
    setBusy(true);
    try {
      const pjNo = tab === 'PJ' ? `PJ-${year}-${String(rows.length + 1).padStart(4, '0')}` : null;
      const row = await store.createRecord({ section: tab, pjNo, year, sortOrder: rows.length, data: { ...(pjNo ? { 'PJ NO': pjNo } : {}), '최초생성날짜': new Date().toISOString().slice(0, 10) } }, currentUser.id);
      beginEdit(row);
    } finally { setBusy(false); }
  };
  const duplicate = async () => {
    const row = store.records.find((item) => item.id === selectedId);
    if (!row || !currentUser) return;
    const copied = await store.duplicateRecord(row, currentUser.id); beginEdit(copied);
  };
  const remove = async () => {
    const row = store.records.find((item) => item.id === selectedId);
    if (selectedRequest) {
      setMessage('견적 의뢰와 연결된 DB 행은 삭제할 수 없습니다. 의뢰관리에서 보관하거나 정정 절차를 사용하세요.');
      return;
    }
    if (!row || !window.confirm(t('estimateDb.deleteConfirm'))) return;
    await store.deleteRecord(row); setSelectedId(null); setEditingId(null); setSelectedCell(null); setDraft({});
  };
  const refresh = async () => { setBusy(true); try { await store.sync(year); setMessage(t('estimateDb.refreshed')); } finally { setBusy(false); } };
  const restoreRequest = async () => {
    if (!selectedRequest || !currentUser) return;
    const linkedMessage = selectedRequest.projectIntakeId
      ? '\n기존 프로젝트 접수는 그대로 유지되며 새 접수나 Project를 만들지 않습니다.'
      : '\n동일 estimateRequestId로 활성 Worklist에만 복구합니다.';
    if (!window.confirm(`'${selectedRequest.projectName}' 의뢰를 복구할까요?${linkedMessage}`)) return;
    setBusy(true);
    try {
      const restored = await requestStore.restoreRequest(selectedRequest.id, currentUser.id);
      setMessage(`${restored.projectName} 의뢰를 같은 ID로 의뢰관리 목록에 복구했습니다.`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : '의뢰 복구에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (!currentUser) return <p className="p-8 text-center">{t('header.loginRequired')}</p>;
  if (!evaluateEstimateAccess(currentUser).allowed) return <p className="p-8 text-center font-semibold text-[var(--color-danger)]">{t('estimateDb.permissionDenied')}</p>;

  return (
    <main style={{ contain: 'inline-size' }} className="w-full min-w-0 max-w-full space-y-4 overflow-x-hidden px-3 py-5 md:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_10px_28px_rgba(15,23,42,.07)]">
        <div>
          <Link href="/projects/intake" className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><ArrowLeft className="size-4" />{t('estimateSheet.back')}</Link>
          <div className="flex items-center gap-2"><Database className="size-6 text-[var(--color-primary)]" /><h1 className="text-2xl font-bold">{t('estimateDb.title')}</h1></div>
          <p className="mt-1 text-sm text-[var(--color-text-sub)]">{t('estimateDb.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/projects/intake/estimates" className={buttonClass}>{t('estimateDb.submissions')}</Link>
          <button type="button" onClick={() => void refresh()} disabled={busy} title={t('estimateRequest.refresh')} className={`${buttonClass} px-2.5`}><RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} /></button>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 shadow-[0_8px_20px_rgba(15,23,42,.06)]">
        <div role="tablist" aria-label={t('estimateDb.tabs')} className="flex overflow-x-auto">
          {TABS.map((value) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => { setTab(value); setPage(1); setSelectedId(null); setEditingId(null); setSelectedCell(null); setDraft({}); }} className={`min-h-12 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${tab === value ? 'border-[var(--color-primary)] bg-orange-50 text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-sub)]'}`}>{t(`estimateDb.tab.${value}` as Parameters<typeof t>[0])}</button>)}
        </div>
        <span className="pb-2 text-xs font-semibold text-[var(--color-text-sub)]">{store.persistenceMode === 'SERVER' ? t('estimateDb.serverMode') : t('estimateDb.demoMode')}</span>
      </div>

      {message && <p role="status" className="border-l-4 border-[var(--color-primary)] bg-[var(--color-bg-sub)] px-4 py-2 text-sm">{message}</p>}
      {store.error && <p role="alert" className="border-l-4 border-[var(--color-danger)] px-4 py-2 text-sm">{store.error}</p>}

      {tab !== 'REPORTS' ? <>
        <section aria-label={t('estimateDb.tools')} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[0_8px_20px_rgba(15,23,42,.06)]">
          <div className="mb-3 flex flex-wrap items-center gap-2 border-b pb-3">
          <div className="flex flex-wrap items-center gap-1 border-l pl-2" aria-label="Record tools">
            <span className="mr-1 text-[10px] font-black uppercase text-[var(--color-text-sub)]">Record</span>
            <button type="button" onClick={() => void add()} disabled={busy} className={buttonClass}><Plus className="size-4" />{t('estimateDb.add')}</button>
            <button type="button" onClick={() => void duplicate()} disabled={!selectedId || busy} title={!selectedId ? '먼저 행을 선택하세요.' : '선택한 행을 복제합니다.'} className={buttonClass}><Copy className="size-4" />{t('estimateDb.duplicate')}</button>
            <button type="button" onClick={() => void remove()} disabled={!selectedId || busy || Boolean(selectedRequest)} title={!selectedId ? '먼저 행을 선택하세요.' : selectedRequest ? '견적 의뢰 연결 행은 삭제 대신 의뢰관리 보관·복구를 사용하세요.' : '연결되지 않은 수동 DB 행을 삭제합니다.'} className={`${buttonClass} text-[var(--color-danger)]`}><Trash2 className="size-4" />{t('estimateDb.delete')}</button>
            {selectedRequest && getEstimateRequestWorklistState(selectedRequest) !== 'ACTIVE' && <button type="button" onClick={() => void restoreRequest()} disabled={busy} className={`${buttonClass} border-orange-300 text-orange-700`}><ArchiveRestore className="size-4" />의뢰관리로 복구</button>}
            {selectedRequest?.projectIntakeId && <Link href={`/projects/intake?tab=PROJECT_INTAKE&intakeId=${encodeURIComponent(selectedRequest.projectIntakeId)}`} className={buttonClass}><FolderOpen className="size-4" />기존 프로젝트 접수 열기</Link>}
          </div>
          <div className="flex flex-wrap items-center gap-1 border-l pl-2" aria-label="Edit tools">
            <span className="mr-1 text-[10px] font-black uppercase text-[var(--color-text-sub)]">Edit</span>
            <button type="button" onClick={() => { const row = store.records.find((item) => item.id === selectedId); if (row) beginEdit(row); }} disabled={!selectedId || Boolean(editingId) || busy} title={!selectedId ? '먼저 행을 선택하세요.' : '선택한 행을 편집합니다.'} className={buttonClass}><Pencil className="size-4" />수정</button>
            <button type="button" onClick={() => void save()} disabled={!editingId || busy} title={!editingId ? '더블클릭, Enter 또는 수정 버튼으로 편집을 시작하세요.' : t('common.save')} className={`${buttonClass} border-[var(--color-primary)] bg-[var(--color-primary)] text-white`}><Save className="size-4" />{t('common.save')}</button>
            <button type="button" onClick={() => { setEditingId(null); setDraft({}); }} disabled={!editingId || busy} title={t('common.cancel')} className={`${buttonClass} px-2.5`}><Undo2 className="size-4" /></button>
          </div>
          <div className="flex flex-wrap items-center gap-1 border-l pl-2" aria-label="Import and export tools">
            <span className="mr-1 text-[10px] font-black uppercase text-[var(--color-text-sub)]">Export</span>
            <button type="button" onClick={() => void exportEstimateDbXlsx(store.records, store.vendors, report)} className={buttonClass}><Download className="size-4" />XLSX</button>
            <button type="button" onClick={() => void exportEstimateDbJson(store.records, store.vendors, store.targets)} className={buttonClass}><FileJson className="size-4" />JSON</button>
          </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_160px_120px]" aria-label="Search tools">
            <label className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[var(--color-text-sub)]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); setSelectedId(null); setEditingId(null); setSelectedCell(null); setDraft({}); }} aria-label={t('estimateDb.search')} placeholder={t('estimateDb.search')} className={`${fieldClass} rounded pl-9`} /></label>
            <select value={worklistFilter} onChange={(event) => { setWorklistFilter(event.target.value as EstimateDbWorklistFilter); setPage(1); setSelectedId(null); }} aria-label="의뢰관리 상태 필터" className={fieldClass}>{WORKLIST_FILTERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
            <input type="number" min="2000" max="2200" value={year} onChange={(event) => { setYear(Number(event.target.value)); setPage(1); setSelectedId(null); setEditingId(null); setSelectedCell(null); setDraft({}); }} aria-label={t('estimateDb.year')} className={`${fieldClass} rounded`} />
          </div>
        </section>

        <section aria-label="견적 데이터 그리드" className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_28px_rgba(15,23,42,.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b p-3"><div><p className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">SPREADSHEET GRID</p><h2 className="font-black">{t(`estimateDb.tab.${tab}` as Parameters<typeof t>[0])}</h2></div><div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-[var(--color-text-sub)]"><span className="flex items-center gap-1.5"><i className="h-4 w-1 rounded bg-orange-500" />수동 입력 · Enter 입력창</span><span className="flex items-center gap-1.5"><i className="h-4 w-1 rounded bg-orange-500" /><i className="size-3 rounded bg-amber-100" />필수 입력</span><span className="flex items-center gap-1.5"><i className="h-4 w-1 rounded bg-sky-500" /><LockKeyhole className="size-3" />자동 연결 · Source</span><span>행 클릭: 선택 · 셀 Enter: 입력/출처</span></div></div>
        <div className="overflow-x-auto" aria-busy={store.loading}>
          <table className="border-collapse text-left text-xs" style={{ minWidth: `${Math.max(1200, (ESTIMATE_DB_COLUMNS[tab].length + 1) * 130)}px` }}>
            <thead className="sticky top-0 z-10"><tr className="border-b bg-[var(--color-bg-sub)]"><th className="sticky left-0 z-20 w-12 border-r bg-[var(--color-bg-sub)] px-2 py-2">#</th>{ESTIMATE_DB_COLUMNS[tab].map((column) => <th key={column.key} className="border-r px-2 py-2 font-semibold" style={{ width: column.width }}>{column.label}</th>)}</tr></thead>
            <tbody>{visibleRows.length ? visibleRows.map((row, rowIndex) => {
              const editing = editingId === row.id;
              const selected = selectedId === row.id;
              return <tr key={row.id} tabIndex={0} aria-selected={selected} onClick={() => { setSelectedId(row.id); setSelectedCell(null); }} onDoubleClick={() => beginEdit(row)} onKeyDown={(event) => { if (event.target === event.currentTarget && event.key === 'Enter') beginEdit(row); }} className={`cursor-pointer border-b align-top transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] ${selected ? 'bg-orange-50 shadow-[inset_4px_0_0_var(--color-primary)]' : 'hover:bg-[var(--color-bg-sub)]'}`}>
                <th className="sticky left-0 z-[5] border-r bg-[var(--color-surface)] p-1 text-center font-medium">
                  <button type="button" title="행 선택" onClick={(event) => { event.stopPropagation(); setSelectedId(row.id); setSelectedCell(null); }} className="min-h-8 w-full px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{(page - 1) * PAGE_SIZE + rowIndex + 1}</button>
                </th>
                {ESTIMATE_DB_COLUMNS[tab].map((column) => {
                  const linked = autoLinkedColumns.has(column.key);
                  const locked = Boolean(column.readonly || linked);
                  const required = requiredManualColumns.has(column.key);
                  const cellSelected = selectedCell?.rowId === row.id && selectedCell.column === column.key;
                  const memoryFieldKey = memoryFieldKeys[column.key];
                  return <td key={column.key} tabIndex={0} aria-label={`${column.label}${locked ? ' 자동연동 셀' : memoryFieldKey ? ' 수동 기억값 셀, Enter로 입력창 열기' : ' 수동 입력 셀'}`} onClick={(event) => { event.stopPropagation(); setSelectedId(row.id); setSelectedCell({ rowId: row.id, column: column.key }); }} onDoubleClick={(event) => { event.stopPropagation(); if (!locked) beginEdit(row); }} onKeyDown={(event) => { event.stopPropagation(); if (event.key !== 'Enter') return; event.preventDefault(); if (locked) setSourceCell({ row, column: column.key, readonly: true }); else if (memoryFieldKey) openMemoryPicker(row, column.key); else beginEdit(row); }} className={`border-r border-l-[3px] p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] ${linked ? 'border-l-sky-500 bg-sky-50/90' : column.readonly ? 'border-l-emerald-500 bg-emerald-50/90' : required ? 'border-l-orange-500 bg-amber-50/90' : 'border-l-orange-400 bg-white'} ${cellSelected ? 'relative z-[2] bg-yellow-50 ring-2 ring-inset ring-orange-400' : ''}`}>
                    <div className="flex min-w-0 items-start gap-1">
                      <div className="min-w-0 flex-1">{editing && !locked ? memoryFieldKey ? <InputHistoryInput moduleKey={`estimate-db.${tab.toLowerCase()}`} fieldKey={memoryFieldKey} label={column.label} enterOpensPicker pickerRequest={memoryPickerTarget?.rowId === row.id && memoryPickerTarget.column === column.key ? memoryPickerTarget.request : undefined} value={String(draft[column.key] ?? '')} onChange={(value) => setDraft((current) => ({ ...current, [column.key]: value }))} aria-label={column.label} className={`${fieldClass} border-amber-300 bg-amber-50`} /> : <input type={column.kind === 'date' ? 'date' : 'text'} inputMode={column.kind === 'money' || column.kind === 'number' ? 'decimal' : undefined} value={String(draft[column.key] ?? '')} onChange={(event) => setDraft((value) => ({ ...value, [column.key]: event.target.value }))} aria-label={column.label} className={`${fieldClass} border-amber-300 bg-amber-50`} /> : <span className="block max-w-[220px] whitespace-pre-wrap break-words px-1 py-1">{display(editing ? draft[column.key] : row.data[column.key])}</span>}</div>
                      <button type="button" onClick={(event) => { event.stopPropagation(); setSourceCell({ row, column: column.key, readonly: locked }); }} title="Cell source" className="grid size-7 shrink-0 place-items-center text-[var(--color-text-sub)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{locked ? <LockKeyhole className="size-3.5" /> : <Info className="size-3.5" />}</button>
                    </div>
                  </td>;
                })}
              </tr>;
            }) : <tr><td colSpan={ESTIMATE_DB_COLUMNS[tab].length + 1} className="px-4 py-16 text-center text-sm text-[var(--color-text-sub)]">{t('estimateDb.empty')}</td></tr>}</tbody>
          </table>
        </div>
        </section>
        <div className="flex items-center justify-between text-sm"><span>{t('estimateDb.count', { count: String(rows.length) })}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} title={page === 1 ? '첫 페이지입니다.' : '이전 페이지'} className={buttonClass}>{t('estimateDb.prev')}</button><span>{page} / {pageCount}</span><button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page === pageCount} title={page === pageCount ? '마지막 페이지입니다.' : '다음 페이지'} className={buttonClass}>{t('estimateDb.next')}</button></div></div>
        {tab === 'MEP_CONTRACT' && <VendorSection vendors={store.vendors} currentUserId={currentUser.id} t={t} />}
      </> : <ReportSection year={year} setYear={setYear} report={report} records={store.records} vendors={store.vendors} targets={store.targets} currentUserId={currentUser.id} t={t} />}
      {sourceCell && <div className="fixed inset-0 z-[90] bg-black/25" role="presentation" onMouseDown={() => setSourceCell(null)}>
        <aside role="dialog" aria-modal="true" aria-label="Cell source" onMouseDown={(event) => event.stopPropagation()} className="absolute inset-y-0 right-0 w-full max-w-md overflow-y-auto border-l bg-[var(--color-surface)] p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b pb-4"><div><p className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">CELL SOURCE</p><h2 className="mt-1 text-xl font-black">{sourceCell.column}</h2></div><button type="button" onClick={() => setSourceCell(null)} title={t('common.close')} className="grid size-9 place-items-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><X className="size-4" /></button></div>
          <dl className="mt-5 grid grid-cols-[120px_1fr] gap-x-3 gap-y-4 text-sm"><dt className="font-semibold text-[var(--color-text-sub)]">PJ Row</dt><dd>{sourceCell.row.pjNo || sourceCell.row.id}</dd><dt className="font-semibold text-[var(--color-text-sub)]">출처</dt><dd>{autoLinkedColumns.has(sourceCell.column) ? '견적 의뢰·접수·canonical Project 자동 연결' : sourceCell.readonly ? '서버 계산·파생값' : '사용자 수동 입력'}</dd><dt className="font-semibold text-[var(--color-text-sub)]">상태</dt><dd>{sourceCell.readonly ? '자동 연결 / 잠금' : '수정 가능 / 저장 필요'}</dd><dt className="font-semibold text-[var(--color-text-sub)]">현재값</dt><dd className="break-all">{display(sourceCell.row.data[sourceCell.column])}</dd><dt className="font-semibold text-[var(--color-text-sub)]">Record ID</dt><dd className="break-all font-mono text-xs">{sourceCell.row.id}</dd><dt className="font-semibold text-[var(--color-text-sub)]">Version</dt><dd>{sourceCell.row.version}</dd></dl>
          <div className="mt-6 border-l-4 border-sky-400 bg-sky-50 p-3 text-xs text-sky-900">연한 파랑은 자동 연결, 연한 초록은 서버 계산, 연한 노랑은 수동 입력 Cell입니다.</div>
        </aside>
      </div>}
    </main>
  );
}

function VendorSection({ vendors, currentUserId, t }: { vendors: EstimateDbVendor[]; currentUserId: string; t: ReturnType<typeof useTranslation> }) {
  const store = useEstimateDatabaseStore();
  const [selected, setSelected] = useState<EstimateDbVendor | null>(null);
  const [draft, setDraft] = useState<EstimateDbPayload>({});
  const add = async () => { const vendor = await store.createVendor({ NO: String(vendors.length + 1), '업체명': t('estimateDb.newVendor'), '공종': '기계' }, currentUserId); setSelected(vendor); setDraft(vendor.data); };
  return <section className="space-y-3 border-t pt-4" aria-labelledby="vendor-heading">
    <div className="flex items-center justify-between"><div><h2 id="vendor-heading" className="text-lg font-bold">{t('estimateDb.vendors')}</h2><p className="text-sm text-[var(--color-text-sub)]">{t('estimateDb.vendorHelp')}</p></div><div className="flex gap-2"><button type="button" onClick={() => void add()} className={buttonClass}><Plus className="size-4" />{t('estimateDb.addVendor')}</button><button type="button" onClick={() => selected && void store.updateVendor(selected, draft, currentUserId).then((saved) => { setSelected(saved); setDraft(saved.data); })} disabled={!selected} title={!selected ? '먼저 기전업체를 선택하세요.' : t('common.save')} className={buttonClass}><Save className="size-4" />{t('common.save')}</button><button type="button" onClick={() => selected && void store.deleteVendor(selected).then(() => setSelected(null))} disabled={!selected} title={!selected ? '먼저 기전업체를 선택하세요.' : t('estimateDb.delete')} className={`${buttonClass} text-[var(--color-danger)]`}><Trash2 className="size-4" /></button></div></div>
    <div className="overflow-x-auto border-y"><table className="min-w-[2200px] border-collapse text-xs"><thead><tr className="bg-[var(--color-bg-sub)]">{ESTIMATE_DB_VENDOR_COLUMNS.map((column) => <th key={column} className="border-r px-2 py-2">{column}</th>)}</tr></thead><tbody>{vendors.map((vendor) => <tr key={vendor.id} onClick={() => { setSelected(vendor); setDraft({ ...vendor.data }); }} className={`cursor-pointer border-t ${selected?.id === vendor.id ? 'bg-[var(--color-bg-sub)]' : ''}`}>{ESTIMATE_DB_VENDOR_COLUMNS.map((column, columnIndex) => <td key={column} className="border-r p-1.5">{selected?.id === vendor.id ? <input value={String(draft[column] ?? '')} onChange={(event) => setDraft((value) => ({ ...value, [column]: event.target.value }))} aria-label={column} className={fieldClass} /> : columnIndex === 0 ? <button type="button" onClick={(event) => { event.stopPropagation(); setSelected(vendor); setDraft({ ...vendor.data }); }} className="min-h-8 w-full px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{display(vendor.data[column])}</button> : <span className="block px-1 py-1">{display(vendor.data[column])}</span>}</td>)}</tr>)}</tbody></table></div>
  </section>;
}

function ReportSection({ year, setYear, report, records, vendors, targets, currentUserId, t }: { year: number; setYear: (year: number) => void; report: ReturnType<ReturnType<typeof useEstimateDatabaseStore.getState>['report']>; records: EstimateDbRecord[]; vendors: EstimateDbVendor[]; targets: ReturnType<typeof useEstimateDatabaseStore.getState>['targets']; currentUserId: string; t: ReturnType<typeof useTranslation> }) {
  const store = useEstimateDatabaseStore();
  const values = targetTypes.flatMap((type) => report[type === 'ORDER' ? 'order' : type === 'SALES' ? 'sales' : 'deposit'].map((point) => Number(point.amount)));
  const max = Math.max(1, ...values);
  return <div className="space-y-5">
    <section className="flex flex-wrap items-center gap-2 border-b pb-4"><label className="text-sm font-semibold">{t('estimateDb.reportYear')} <input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} className={`${fieldClass} ml-2 max-w-[110px]`} /></label><button type="button" onClick={() => void exportEstimateDbXlsx(records, vendors, report)} className={buttonClass}><Download className="size-4" />XLSX</button><button type="button" onClick={() => void exportEstimateDbJson(records, vendors, targets)} className={buttonClass}><FileJson className="size-4" />JSON</button></section>
    <section aria-labelledby="annual-heading"><h2 id="annual-heading" className="mb-3 text-lg font-bold">{t('estimateDb.annual')}</h2><div className="overflow-x-auto border-y"><table className="min-w-[980px] w-full border-collapse text-sm"><thead><tr className="bg-[var(--color-bg-sub)]"><th className="px-3 py-3">{t('estimateDb.category')}</th>{Array.from({ length: 12 }, (_, index) => <th key={index} className="px-3 py-3 text-right">{index + 1}</th>)}</tr></thead><tbody>{targetTypes.map((type) => { const points = report[type === 'ORDER' ? 'order' : type === 'SALES' ? 'sales' : 'deposit']; return <tr key={type} className="border-t"><th className="px-3 py-3 text-left">{t(`estimateDb.report.${type}` as Parameters<typeof t>[0])}</th>{points.map((point) => { const pointValue = Number(point.amount); return <td key={point.month} className="px-3 py-3 text-right"><strong>{currency(point.amount)}</strong><span className="mt-1 block h-1 bg-[var(--color-bg-sub)]"><span className="block h-full bg-[var(--color-primary)]" style={{ width: `${pointValue > 0 ? Math.max(2, pointValue / max * 100) : 0}%` }} /></span></td>; })}</tr>; })}</tbody></table></div></section>
    <section aria-labelledby="target-heading"><h2 id="target-heading" className="mb-1 text-lg font-bold">{t('estimateDb.targets')}</h2><p className="mb-3 text-sm text-[var(--color-text-sub)]">{t('estimateDb.targetHelp')}</p><div className="overflow-x-auto border-y"><table className="min-w-[980px] w-full border-collapse text-sm"><thead><tr className="bg-[var(--color-bg-sub)]"><th className="px-3 py-3">{t('estimateDb.category')}</th>{Array.from({ length: 12 }, (_, index) => <th key={index} className="px-2 py-3">{index + 1}</th>)}</tr></thead><tbody>{targetTypes.map((type) => <tr key={type} className="border-t"><th className="px-3 py-2 text-left">{t(`estimateDb.report.${type}` as Parameters<typeof t>[0])}</th>{Array.from({ length: 12 }, (_, index) => { const month = index + 1; const target = targets.find((item) => item.type === type && item.year === year && item.month === month); return <td key={month} className="p-1"><input defaultValue={target?.amount || ''} onBlur={(event) => { if (event.target.value !== (target?.amount || '')) void store.putTarget(type, year, month, event.target.value || '0', currentUserId); }} aria-label={`${type} ${month}`} inputMode="decimal" className={`${fieldClass} min-w-[88px] text-right`} /></td>; })}</tr>)}</tbody></table></div></section>
  </div>;
}
