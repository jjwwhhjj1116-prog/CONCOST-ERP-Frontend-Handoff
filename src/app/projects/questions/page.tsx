'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CircleHelp, CheckCircle2, Clock3, FolderKanban } from 'lucide-react';
import { ProjectQcPanel } from '@/components/projects/ProjectQcPanel';
import { canViewProject } from '@/lib/permissions';
import { getTechnicalDepartmentLabel, getTechnicalDepartmentScope, matchesTechnicalDepartment } from '@/lib/departmentScope';
import { useAuthStore } from '@/store/authStore';
import { useProjectQcStore } from '@/store/projectQcStore';
import { useProjectStore } from '@/store/projectStore';

const questionGroups = new Set(['QUESTION_1', 'QUESTION_2', 'QUESTION_3', 'QUESTION_4', 'QUESTION_5', 'QUESTION_6']);
const selectClass = 'min-h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:w-96';

export default function ProjectQuestionsPage() {
  const searchParams = useSearchParams();
  const departmentScope = getTechnicalDepartmentScope(searchParams.get('department'));
  const departmentLabel = getTechnicalDepartmentLabel(departmentScope);
  const { currentUser } = useAuthStore();
  const { projects } = useProjectStore();
  const { checklists } = useProjectQcStore();
  const [projectId, setProjectId] = useState('');
  const visibleProjects = useMemo(() => currentUser ? projects.filter((project) =>
    !project.isDeleted &&
    canViewProject(currentUser, project) &&
    matchesTechnicalDepartment(departmentScope, project)
  ) : [], [currentUser, departmentScope, projects]);
  const selectedProjectId = projectId || visibleProjects[0]?.id || '';
  const visibleProjectIds = useMemo(() => new Set(visibleProjects.map((project) => project.id)), [visibleProjects]);
  const questionItems = checklists
    .filter((checklist) => visibleProjectIds.has(checklist.projectId))
    .flatMap((checklist) => checklist.items)
    .filter((item) => questionGroups.has(item.group));
  const pendingCount = questionItems.filter((item) => item.status === 'PENDING' || item.status === 'PARTIAL').length;
  const completedCount = questionItems.filter((item) => item.status === 'CONFIRMED' || item.status === 'SENT').length;

  if (!currentUser) return null;

  return <div className="w-full space-y-5 p-4 md:p-6">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
      <div><p className="text-xs font-bold uppercase text-[var(--color-primary)]">Project Q&amp;A</p><h1 className="mt-1 text-2xl font-black text-[var(--color-text-main)]">프로젝트 질의사항 관리 · {departmentLabel}</h1><p className="mt-1 text-sm text-[var(--color-text-sub)]">OFFDAY2의 단계별 질의 그룹, 회신 대상, 첨부, 처리 이력과 엑셀 내보내기 흐름을 팀별로 관리합니다.</p></div>
      <label className="text-xs font-bold text-[var(--color-text-sub)]">대상 프로젝트<select className={`${selectClass} mt-1 block`} value={selectedProjectId} onChange={(event) => setProjectId(event.target.value)}>{visibleProjects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label>
    </header>
    <section className="grid gap-px overflow-hidden border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-3" aria-label="질의 현황">
      <Metric icon={<CircleHelp className="h-5 w-5 text-blue-600" />} label="전체 질의" value={questionItems.length} />
      <Metric icon={<Clock3 className="h-5 w-5 text-amber-600" />} label="회신·확인 대기" value={pendingCount} />
      <Metric icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="처리 완료" value={completedCount} />
    </section>
    {selectedProjectId ? <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:p-5"><ProjectQcPanel projectId={selectedProjectId} mode="QUESTIONS" /></section> : <section className="flex min-h-72 flex-col items-center justify-center border border-dashed border-[var(--color-border)] text-center"><FolderKanban className="h-10 w-10 text-[var(--color-text-sub)]" /><h2 className="mt-3 font-black text-[var(--color-text-main)]">표시할 프로젝트가 없습니다.</h2><p className="mt-1 text-sm text-[var(--color-text-sub)]">프로젝트를 접수하거나 현재 계정의 프로젝트 접근 권한을 확인해 주세요.</p></section>}
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="flex items-center gap-3 bg-[var(--color-surface)] px-4 py-4">{icon}<div><p className="text-xs font-bold text-[var(--color-text-sub)]">{label}</p><p className="mt-0.5 text-2xl font-black text-[var(--color-text-main)]">{value}</p></div></div>;
}
