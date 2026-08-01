'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Archive, ClipboardCheck, FileClock, FolderKanban, Mail, MessageSquareText, PhoneCall, Plus, Trash2 } from 'lucide-react';
import { ProjectDeliveryPanel } from '@/components/projects/ProjectDeliveryPanel';
import { ProjectQcPanel } from '@/components/projects/ProjectQcPanel';
import { getUserDisplayName } from '@/lib/localization';
import { canViewProject } from '@/lib/permissions';
import { getTechnicalDepartmentScope, matchesTechnicalDepartment } from '@/lib/departmentScope';
import type { ProjectOperationActor } from '@/lib/projectOperation';
import { useAuthStore } from '@/store/authStore';
import { useProjectDeliveryStore } from '@/store/projectDeliveryStore';
import { useProjectOperationStore } from '@/store/projectOperationStore';
import { useProjectQcStore } from '@/store/projectQcStore';
import { useProjectStore } from '@/store/projectStore';
import type { ProjectOperationActivity, ProjectOperationActivityKind } from '@/types/models';

type Tab = 'CALL' | 'EMAIL' | 'MEETING' | 'QC' | 'DELIVERY' | 'LOG';
type TimelineRow = { id: string; source: string; title: string; body: string; actorId: string; createdAt: string };

const tabs: Array<{ id: Tab; label: string; icon: typeof PhoneCall }> = [
  { id: 'CALL', label: '상담 이력', icon: PhoneCall },
  { id: 'EMAIL', label: '프로젝트 이메일', icon: Mail },
  { id: 'MEETING', label: '회의록', icon: MessageSquareText },
  { id: 'QC', label: '품질 관리', icon: ClipboardCheck },
  { id: 'DELIVERY', label: '납품·인수인계 및 보관', icon: Archive },
  { id: 'LOG', label: '프로젝트 진행 로그', icon: FileClock },
];
const inputClass = 'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';
const buttonClass = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50';

export default function ProjectDataManagementPage() {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const requestedDepartment = searchParams.get('department');
  const departmentScope = getTechnicalDepartmentScope(requestedDepartment);
  const { currentUser, users } = useAuthStore();
  const { projects } = useProjectStore();
  const { operations, sync: syncOperations, addActivity, deleteActivity } = useProjectOperationStore();
  const { workspaces, sync: syncDelivery } = useProjectDeliveryStore();
  const { checklists, sync: syncQc } = useProjectQcStore();
  const [projectId, setProjectId] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>(requestedView === 'MEETINGS' ? 'MEETING' : 'CALL');
  const [message, setMessage] = useState('');
  const visibleProjects = useMemo(() => currentUser ? projects.filter((project) =>
    !project.isDeleted &&
    canViewProject(currentUser, project) &&
    (requestedDepartment === 'TECHNICAL'
      ? !matchesTechnicalDepartment('CLAIM', project) && !matchesTechnicalDepartment('DEVELOPMENT', project)
      : matchesTechnicalDepartment(departmentScope, project))
  ) : [], [currentUser, departmentScope, projects, requestedDepartment]);
  const selectedProjectId = projectId || visibleProjects[0]?.id || '';
  const actor = useMemo<ProjectOperationActor | null>(() => currentUser ? { id: currentUser.id, role: currentUser.role, departmentId: currentUser.departmentId } : null, [currentUser]);
  const operation = operations.find((item) => item.projectId === selectedProjectId);
  const delivery = workspaces.find((item) => item.projectId === selectedProjectId);
  const checklist = checklists.find((item) => item.projectId === selectedProjectId);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (requestedView === 'MEETINGS') setActiveTab('MEETING');
    }, 0);
    return () => window.clearTimeout(timer);
  }, [requestedView]);

  useEffect(() => {
    if (!actor || !selectedProjectId) return;
    void Promise.all([syncOperations(actor), syncDelivery(selectedProjectId, actor), syncQc(selectedProjectId, actor)]);
  }, [actor, selectedProjectId, syncDelivery, syncOperations, syncQc]);

  if (!currentUser) return null;

  const actorName = (id: string) => {
    const user = users.find((item) => item.id === id);
    return user ? getUserDisplayName(user) : id;
  };
  const timeline: TimelineRow[] = [
    ...(operation?.activities || []).map((item) => ({ id: item.id, source: activityKindLabel(item.kind), title: item.title, body: item.body, actorId: item.createdBy, createdAt: item.occurredAt || item.createdAt })),
    ...(delivery?.histories || []).map((item) => ({ id: item.id, source: '납품·업무일지', title: item.action, body: detailsText(item.details), actorId: item.actorId, createdAt: item.createdAt })),
    ...(checklist?.histories || []).map((item) => ({ id: item.id, source: '품질 관리', title: item.action, body: detailsText(item.details), actorId: item.actorId, createdAt: item.createdAt })),
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const removeActivity = async (activityId: string) => {
    if (!actor || !selectedProjectId) return;
    setMessage('');
    try { await deleteActivity(selectedProjectId, activityId, actor); setMessage('기록을 삭제했습니다.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : '기록을 삭제하지 못했습니다.'); }
  };

  return <div className="w-full space-y-5 p-4 md:p-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
      <div><p className="text-xs font-bold uppercase text-[var(--color-primary)]">Project Delivery &amp; Data</p><h1 className="mt-1 text-2xl font-black text-[var(--color-text-main)]">프로젝트 납품 및 데이터관리</h1><p className="mt-1 max-w-3xl text-sm text-[var(--color-text-sub)]">상담, 이메일, 품질 검토, 납품 파일과 인수인계, 프로젝트 진행 이력을 하나의 프로젝트 기준으로 관리합니다.</p></div>
      <label className="text-xs font-bold text-[var(--color-text-sub)]">대상 프로젝트<select className={`${inputClass} mt-1 md:w-96`} value={selectedProjectId} onChange={(event) => setProjectId(event.target.value)}>{visibleProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
    </header>

    {!selectedProjectId ? <EmptyProject /> : <>
      <nav className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)]" aria-label="프로젝트 데이터 관리 메뉴">
        {tabs.map((tab) => { const Icon = tab.icon; return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${activeTab === tab.id ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-sub)] hover:text-[var(--color-text-main)]'}`}><Icon className="h-4 w-4" />{tab.label}</button>; })}
      </nav>
      {message && <p role="status" className="border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{message}</p>}
      {activeTab === 'CALL' && <ActivityWorkspace title="상담 이력" description="전화·온라인 상담 내용과 후속 조치 일정을 기록합니다." kind="CALL" activities={(operation?.activities || []).filter((item) => item.kind === 'CALL')} canEdit={Boolean(operation?.permissions.canEdit)} actor={actor} projectId={selectedProjectId} actorName={actorName} addActivity={addActivity} deleteActivity={removeActivity} />}
      {activeTab === 'EMAIL' && <ActivityWorkspace title="프로젝트 이메일" description="프로젝트 관련 발신·수신 이메일의 제목, 상대방과 핵심 내용을 기록합니다." kind="EMAIL" activities={(operation?.activities || []).filter((item) => item.kind === 'EMAIL')} canEdit={Boolean(operation?.permissions.canEdit)} actor={actor} projectId={selectedProjectId} actorName={actorName} addActivity={addActivity} deleteActivity={removeActivity} />}
      {activeTab === 'MEETING' && <ActivityWorkspace title="회의록" description="회의 일시, 참석자, 결정사항과 후속 조치를 프로젝트 이력에 연결합니다." kind="MEETING" activities={(operation?.activities || []).filter((item) => item.kind === 'MEETING')} canEdit={Boolean(operation?.permissions.canEdit)} actor={actor} projectId={selectedProjectId} actorName={actorName} addActivity={addActivity} deleteActivity={removeActivity} />}
      {activeTab === 'QC' && <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5"><ProjectQcPanel projectId={selectedProjectId} /></section>}
      {activeTab === 'DELIVERY' && <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5"><ProjectDeliveryPanel projectId={selectedProjectId} mode="DELIVERY" /></section>}
      {activeTab === 'LOG' && <section className="border border-[var(--color-border)] bg-[var(--color-surface)]">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-4"><div><h2 className="font-black text-[var(--color-text-main)]">프로젝트 진행 로그</h2><p className="mt-1 text-xs text-[var(--color-text-sub)]">상담·이메일·품질 관리·납품·업무일지에서 발생한 이력을 시간순으로 통합합니다.</p></div><span className="text-xs font-bold text-[var(--color-text-sub)]">{timeline.length}건</span></header>
        {operation?.permissions.canEdit && <ActivityComposer compact kind="NOTE" actor={actor} projectId={selectedProjectId} addActivity={addActivity} />}
        {timeline.length ? <ul className="divide-y divide-[var(--color-border)]">{timeline.map((item) => <li key={`${item.source}-${item.id}`} className="grid gap-2 px-4 py-4 md:grid-cols-[9rem_1fr_auto]"><div><span className="inline-flex rounded border border-[var(--color-border)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-sub)]">{item.source}</span><p className="mt-2 text-xs text-[var(--color-text-sub)]">{new Date(item.createdAt).toLocaleString('ko-KR')}</p></div><div><h3 className="text-sm font-bold text-[var(--color-text-main)]">{item.title}</h3>{item.body && <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-sub)]">{item.body}</p>}</div><span className="text-xs font-semibold text-[var(--color-text-sub)]">{actorName(item.actorId)}</span></li>)}</ul> : <Empty text="아직 기록된 프로젝트 진행 이력이 없습니다." />}
      </section>}
    </>}
  </div>;
}

function ActivityWorkspace({ title, description, kind, activities, canEdit, actor, projectId, actorName, addActivity, deleteActivity }: {
  title: string; description: string; kind: 'CALL' | 'EMAIL' | 'MEETING'; activities: ProjectOperationActivity[]; canEdit: boolean; actor: ProjectOperationActor | null; projectId: string;
  actorName: (id: string) => string;
  addActivity: ReturnType<typeof useProjectOperationStore.getState>['addActivity'];
  deleteActivity: (id: string) => Promise<void>;
}) {
  return <section className="border border-[var(--color-border)] bg-[var(--color-surface)]">
    <header className="border-b border-[var(--color-border)] px-4 py-4"><h2 className="font-black text-[var(--color-text-main)]">{title}</h2><p className="mt-1 text-xs text-[var(--color-text-sub)]">{description}</p></header>
    {canEdit && <ActivityComposer kind={kind} actor={actor} projectId={projectId} addActivity={addActivity} />}
    {activities.length ? <ul className="divide-y divide-[var(--color-border)]">{activities.map((item) => <li key={item.id} className="grid gap-3 px-4 py-4 md:grid-cols-[10rem_1fr_auto]"><div><p className="text-xs font-bold text-[var(--color-primary)]">{new Date(item.occurredAt).toLocaleString('ko-KR')}</p><p className="mt-1 text-xs text-[var(--color-text-sub)]">{actorName(item.createdBy)}</p></div><div><h3 className="text-sm font-black text-[var(--color-text-main)]">{item.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-sub)]">{item.body}</p>{Object.keys(item.metadata).length > 0 && <p className="mt-2 text-xs text-[var(--color-text-sub)]">{detailsText(item.metadata)}</p>}</div>{canEdit && <button type="button" aria-label={`${item.title} 삭제`} onClick={() => void deleteActivity(item.id)} className="self-start rounded-md p-2 text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Trash2 className="h-4 w-4" /></button>}</li>)}</ul> : <Empty text={`등록된 ${title}이 없습니다.`} />}
  </section>;
}

function ActivityComposer({ kind, actor, projectId, addActivity, compact = false }: { kind: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE'; actor: ProjectOperationActor | null; projectId: string; addActivity: ReturnType<typeof useProjectOperationStore.getState>['addActivity']; compact?: boolean }) {
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [party, setParty] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!actor || !title.trim() || !body.trim()) return;
    setBusy(true); setError('');
    try {
      await addActivity(projectId, { kind, occurredAt: new Date(occurredAt).toISOString(), title: title.trim(), body: body.trim(), metadata: party.trim() ? { [kind === 'EMAIL' ? 'counterparty' : kind === 'CALL' ? 'contact' : 'category']: party.trim() } : {} }, actor);
      setTitle(''); setBody(''); setParty('');
    } catch (caught) { setError(caught instanceof Error ? caught.message : '기록을 저장하지 못했습니다.'); }
    finally { setBusy(false); }
  };
  return <form onSubmit={submit} className={`grid gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]/45 p-4 ${compact ? 'md:grid-cols-[11rem_1fr_2fr_auto]' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
    <label className="text-xs font-bold text-[var(--color-text-sub)]">일시<input type="datetime-local" className={`${inputClass} mt-1`} value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></label>
    {!compact && <label className="text-xs font-bold text-[var(--color-text-sub)]">{kind === 'EMAIL' ? '발신·수신 상대' : kind === 'MEETING' ? '참석자' : '상담 상대'}<input className={`${inputClass} mt-1`} value={party} onChange={(event) => setParty(event.target.value)} placeholder={kind === 'EMAIL' ? '이메일 또는 업체명' : kind === 'MEETING' ? '참석자 이름 또는 부서' : '고객명 또는 연락처'} /></label>}
    <label className="text-xs font-bold text-[var(--color-text-sub)]">제목<input className={`${inputClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
    <label className={`text-xs font-bold text-[var(--color-text-sub)] ${compact ? '' : 'md:col-span-2 lg:col-span-2'}`}>내용<textarea className={`${inputClass} mt-1 min-h-10 resize-y`} value={body} onChange={(event) => setBody(event.target.value)} /></label>
    <button type="submit" disabled={busy || !actor || !title.trim() || !body.trim()} className={`${buttonClass} self-end bg-[var(--color-primary)] text-white`}><Plus className="h-4 w-4" />기록</button>
    {error && <p role="alert" className="text-xs font-semibold text-red-600 md:col-span-full">{error}</p>}
  </form>;
}

function Empty({ text }: { text: string }) { return <div className="px-4 py-12 text-center"><MessageSquareText className="mx-auto h-8 w-8 text-[var(--color-text-sub)]" /><p className="mt-2 text-sm text-[var(--color-text-sub)]">{text}</p></div>; }
function EmptyProject() { return <section className="flex min-h-72 flex-col items-center justify-center border border-dashed border-[var(--color-border)] text-center"><FolderKanban className="h-10 w-10 text-[var(--color-text-sub)]" /><h2 className="mt-3 font-black text-[var(--color-text-main)]">표시할 프로젝트가 없습니다.</h2><p className="mt-1 text-sm text-[var(--color-text-sub)]">프로젝트 접근 권한과 배정 상태를 확인해 주세요.</p></section>; }
function activityKindLabel(kind: ProjectOperationActivityKind) { return ({ MEETING: '회의', CALL: '상담', EMAIL: '이메일', AWARD: '수주', START_APPROVAL: '착수 승인', COMPLETION_CHANGED: '완료일 변경', COMPLETED: '완료', NOTE: '진행 메모' })[kind]; }
function detailsText(details: Record<string, unknown>) { return Object.entries(details).map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`).join(' · '); }
