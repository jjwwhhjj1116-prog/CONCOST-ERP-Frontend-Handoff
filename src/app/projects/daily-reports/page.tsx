'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, BookOpenCheck, CheckCircle2, FolderKanban } from 'lucide-react';
import { ProjectDeliveryPanel } from '@/components/projects/ProjectDeliveryPanel';
import { canViewProject } from '@/lib/permissions';
import { useAuthStore } from '@/store/authStore';
import { useProjectDeliveryStore } from '@/store/projectDeliveryStore';
import { useProjectStore } from '@/store/projectStore';

const selectClass = 'mt-1 block min-h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:w-96';

export default function ProjectDailyReportsPage() {
  const { currentUser } = useAuthStore();
  const { projects } = useProjectStore();
  const { workspaces } = useProjectDeliveryStore();
  const [projectId, setProjectId] = useState('');
  const visibleProjects = useMemo(() => currentUser ? projects.filter((project) => !project.isDeleted && canViewProject(currentUser, project)) : [], [currentUser, projects]);
  const selectedProjectId = projectId || visibleProjects[0]?.id || '';
  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects]);
  const reports = workspaces.filter((workspace) => visibleProjectIds.has(workspace.projectId)).flatMap((workspace) => workspace.dailyReports);
  const pending = reports.filter((report) => [report.pmStatus, report.managerStatus, report.executiveStatus].includes('PENDING')).length;
  const completed = reports.filter((report) => ![report.pmStatus, report.managerStatus, report.executiveStatus].includes('PENDING')).length;

  if (!currentUser) return null;

  return <div className="w-full space-y-5 p-4 md:p-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
      <div><p className="text-xs font-bold uppercase text-[var(--color-primary)]">Project Work Log</p><h1 className="mt-1 text-2xl font-black text-[var(--color-text-main)]">업무일지</h1><p className="mt-1 text-sm text-[var(--color-text-sub)]">계획, 작업 결과, 진행률, 지연·야근 사유와 단계별 승인 상태를 기록합니다.</p></div>
      <label className="text-xs font-bold text-[var(--color-text-sub)]">대상 프로젝트<select className={selectClass} value={selectedProjectId} onChange={(event) => setProjectId(event.target.value)}>{visibleProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
    </header>
    <section className="grid gap-px overflow-hidden border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3" aria-label="업무일지 현황">
      <Metric icon={<BookOpenCheck className="h-5 w-5 text-blue-600" />} label="전체 일지" value={reports.length} />
      <Metric icon={<AlertCircle className="h-5 w-5 text-amber-600" />} label="승인 대기" value={pending} />
      <Metric icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="승인 처리" value={completed} />
    </section>
    {selectedProjectId ? <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5"><ProjectDeliveryPanel projectId={selectedProjectId} mode="DAILY" /></section> : <EmptyProject />}
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-3 bg-[var(--color-surface)] px-4 py-4">{icon}<div><p className="text-xs font-bold text-[var(--color-text-sub)]">{label}</p><p className="mt-0.5 text-2xl font-black text-[var(--color-text-main)]">{value}</p></div></div>;
}

function EmptyProject() {
  return <section className="flex min-h-72 flex-col items-center justify-center border border-dashed border-[var(--color-border)] text-center"><FolderKanban className="h-10 w-10 text-[var(--color-text-sub)]" /><h2 className="mt-3 font-black text-[var(--color-text-main)]">표시할 프로젝트가 없습니다.</h2><p className="mt-1 text-sm text-[var(--color-text-sub)]">프로젝트 접근 권한과 배정 상태를 확인해 주세요.</p></section>;
}
