'use client';

import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FolderKanban,
  LayoutGrid,
  Mail,
  Settings2,
  Target,
} from 'lucide-react';
import { useApprovalStore } from '@/store/approvalStore';
import { useAuthStore } from '@/store/authStore';
import { useEstimateRequestStore } from '@/store/estimateRequestStore';
import { useProjectStore } from '@/store/projectStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useTaskStore } from '@/store/taskStore';
import { useTranslationStore } from '@/store/translationStore';
import { evaluateEstimateAccess } from '@/lib/accessControl';
import { getWorkspaceHomeCopy, localizeGeneratedTaskTitle } from '@/lib/workspaceShellLocalization';

type WidgetId = 'projects' | 'kpi' | 'approvals' | 'sales' | 'tasks' | 'schedule';

const widgetOptions: Array<{ id: WidgetId; icon: React.ElementType }> = [
  { id: 'projects', icon: FolderKanban },
  { id: 'kpi', icon: Target },
  { id: 'approvals', icon: FileCheck2 },
  { id: 'sales', icon: CircleDollarSign },
  { id: 'tasks', icon: CheckCircle2 },
  { id: 'schedule', icon: CalendarDays },
];

const defaultWidgets: WidgetId[] = ['projects', 'kpi', 'approvals', 'sales', 'tasks', 'schedule'];

function Donut({ segments, center, label }: { segments: number[]; center: string; label: string }) {
  const segmentTotal = segments.reduce((sum, value) => sum + value, 0);
  const total = Math.max(1, segmentTotal);
  const first = segments[0] / total * 360;
  const second = first + segments[1] / total * 360;
  const background = segmentTotal === 0
    ? 'conic-gradient(#d8dee8 0deg 360deg)'
    : `conic-gradient(#17965b 0deg ${first}deg, #ff8a1f ${first}deg ${second}deg, #e43c4b ${second}deg 360deg)`;
  return (
    <div className="relative mx-auto h-32 w-32 rounded-full" style={{ background }}>
      <div className="absolute inset-[15px] flex flex-col items-center justify-center rounded-full bg-[var(--color-surface)] shadow-inner">
        <strong className="font-mono text-2xl font-black tabular-nums text-[var(--color-text-main)]">{center}</strong>
        <span className="text-[9px] font-bold text-[var(--color-text-sub)]">{label}</span>
      </div>
    </div>
  );
}

export function WorkspaceWidgetPortal() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const projects = useProjectStore((state) => state.projects);
  const tasks = useTaskStore((state) => state.tasks);
  const approvals = useApprovalStore((state) => state.requests);
  const estimateRequests = useEstimateRequestStore((state) => state.requests);
  const schedules = useScheduleStore((state) => state.schedules);
  const language = useTranslationStore((state) => state.settings.uiLanguage);
  const copy = getWorkspaceHomeCopy(language);
  const [visibleWidgets, setVisibleWidgets] = React.useState<WidgetId[]>(() => {
    if (typeof window === 'undefined' || !currentUser) return defaultWidgets;
    try {
      const stored = window.localStorage.getItem(`concost.workspace.widgets.v1:${currentUser.id}`);
      if (!stored) return defaultWidgets;
      const parsed = JSON.parse(stored) as WidgetId[];
      return parsed.filter((id) => widgetOptions.some((option) => option.id === id));
    } catch {
      return defaultWidgets;
    }
  });
  const [customizing, setCustomizing] = React.useState(false);

  const storageKey = currentUser ? `concost.workspace.widgets.v1:${currentUser.id}` : '';
  if (!currentUser) return null;
  const estimateAccess = evaluateEstimateAccess(currentUser).allowed;
  const availableWidgetOptions = estimateAccess
    ? widgetOptions
    : widgetOptions.filter((option) => option.id !== 'sales');

  const myProjects = projects.filter((project) => !project.isDeleted && project.archiveStatus !== 'ARCHIVED' && (
    currentUser.role === 'SUPER_ADMIN' || project.pmId === currentUser.id || project.managerId === currentUser.id || project.departmentId === currentUser.departmentId
  ));
  const myProjectIds = new Set(myProjects.map((project) => project.id));
  const myTasks = tasks.filter((task) => !task.isDeleted && (currentUser.role === 'SUPER_ADMIN' || task.assigneeId === currentUser.id || myProjectIds.has(task.projectId)));
  const completedTasks = myTasks.filter((task) => task.status === 'DONE').length;
  const reviewTasks = myTasks.filter((task) => task.status === 'REVIEW').length;
  const delayedTasks = myTasks.filter((task) => task.status !== 'DONE' && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10)).length;
  const kpiRate = myTasks.length ? Math.round(completedTasks / myTasks.length * 100) : 0;

  const visibleApprovals = approvals.filter((request) => currentUser.role === 'SUPER_ADMIN' || request.requestedBy === currentUser.id || request.approvalLine?.some((step) => step.approverId === currentUser.id));
  const approved = visibleApprovals.filter((request) => request.status === 'APPROVED').length;
  const rejected = visibleApprovals.filter((request) => request.status === 'REJECTED' || request.status === 'CANCELLED').length;
  const pending = Math.max(0, visibleApprovals.length - approved - rejected);

  const scopedEstimateRequests = estimateAccess ? estimateRequests : [];
  const won = scopedEstimateRequests.filter((request) => request.status === 'WON');
  const sent = scopedEstimateRequests.filter((request) => ['ESTIMATE_DRAFTING', 'WAITING'].includes(request.status));
  const lost = scopedEstimateRequests.filter((request) => request.status === 'LOST');
  const salesMax = Math.max(1, won.length, sent.length, lost.length);
  const today = new Date().toISOString().slice(0, 10);
  const todaySchedules = schedules.filter((schedule) => schedule.userId === currentUser.id && schedule.startDateTime.startsWith(today));

  const toggleWidget = (id: WidgetId) => {
    const next = visibleWidgets.includes(id) ? visibleWidgets.filter((item) => item !== id) : [...visibleWidgets, id];
    setVisibleWidgets(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const visible = (id: WidgetId) => visibleWidgets.includes(id);

  return (
    <section className="space-y-4" aria-label={copy.dashboardAria}>
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#172554] text-white"><LayoutGrid className="h-5 w-5" /></span>
          <div><h2 className="text-sm font-black text-[var(--color-text-main)]">{copy.myWorkspace}</h2><p className="text-[11px] font-semibold text-[var(--color-text-sub)]">{copy.myWorkspaceDescription}</p></div>
        </div>
        <button type="button" onClick={() => setCustomizing((value) => !value)} aria-expanded={customizing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-xs font-black text-[var(--color-text-main)] hover:border-[#ff6b00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00]"><Settings2 className="h-4 w-4 text-[#eb6300]" />{copy.widgetSettings}</button>
      </div>

      {customizing && <div className="flex flex-wrap gap-2 rounded-xl border border-dashed border-[#f1b17f] bg-[#fff8f1] p-3 dark:bg-orange-950/15">
        {availableWidgetOptions.map((option) => {
          const Icon = option.icon;
          const checked = visibleWidgets.includes(option.id);
          return <label key={option.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-black ${checked ? 'border-[#ff6b00] bg-white text-[#a94100]' : 'border-[#ead8c9] bg-transparent text-[#7e6756]'}`}><input type="checkbox" className="accent-[#ff6b00]" checked={checked} onChange={() => toggleWidget(option.id)} /><Icon className="h-4 w-4" />{copy.widgetLabels[option.id]}</label>;
        })}
      </div>}

      <div className="grid gap-4 xl:grid-cols-12">
        {visible('projects') && <Link href="/projects" className="cc-tactile-card group min-h-[238px] p-5 xl:col-span-5" data-interactive="true">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="text-sm font-black text-[var(--color-text-main)]">{copy.participatingProjects}</h3><p className="mt-1 text-[10px] font-semibold text-[var(--color-text-sub)]">{copy.participatingProjectsDescription}</p></div><ChevronRight className="h-5 w-5 text-[#eb6300] transition-transform group-hover:translate-x-1" /></div>
          <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
            <div className="grid grid-cols-[128px_repeat(5,1fr)] bg-[var(--cc-surface-2)] text-[9px] font-black text-[var(--color-text-sub)]"><span className="px-3 py-2">{copy.project}</span>{copy.projectSteps.map((step) => <span key={step} className="border-l border-[var(--color-border)] px-1 py-2 text-center">{step}</span>)}</div>
            {myProjects.slice(0, 4).map((project) => {
              const width = Math.max(12, Math.min(100, project.progress || 12));
              return <div key={project.id} className="grid grid-cols-[128px_1fr] border-t border-[var(--color-border)]"><span className="truncate px-3 py-3 text-[10px] font-bold text-[var(--color-text-main)]">{project.title}</span><span className="relative m-2 h-6 rounded bg-slate-100 dark:bg-white/5"><i className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-[#ff8a1f] to-[#f1b438]" style={{ width: `${width}%` }} /><em className="absolute inset-0 flex items-center justify-center text-[9px] font-black not-italic text-[#172554]">{width}%</em></span></div>;
            })}
            {myProjects.length === 0 && <div className="px-4 py-10 text-center text-xs font-semibold text-[var(--color-text-sub)]">{copy.noParticipatingProjects}</div>}
          </div>
        </Link>}

        {visible('kpi') && <Link href="/tasks/my" className="cc-tactile-card group min-h-[238px] p-5 xl:col-span-3" data-interactive="true">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black text-[var(--color-text-main)]">{copy.kpiPerformance}</h3><Target className="h-4 w-4 text-[#eb6300]" /></div>
          <Donut segments={[completedTasks, reviewTasks, Math.max(0, myTasks.length - completedTasks - reviewTasks)]} center={`${kpiRate}%`} label={copy.taskAchievement} />
          <div className="mt-3 grid grid-cols-3 text-center text-[9px] font-bold text-[var(--color-text-sub)]"><span><b className="block text-sm text-emerald-600">{completedTasks}</b>{copy.completed}</span><span><b className="block text-sm text-orange-500">{reviewTasks}</b>{copy.review}</span><span><b className="block text-sm text-red-500">{delayedTasks}</b>{copy.delayed}</span></div>
        </Link>}

        {visible('approvals') && <Link href="/approvals" className="cc-tactile-card group min-h-[238px] p-5 xl:col-span-4" data-interactive="true">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black text-[var(--color-text-main)]">{copy.approvalStatus}</h3><FileCheck2 className="h-4 w-4 text-[#eb6300]" /></div>
          <Donut segments={[approved, pending, rejected]} center={`${approved}/${visibleApprovals.length}`} label={copy.approvedDocuments} />
          <div className="mt-3 grid grid-cols-3 text-center text-[9px] font-bold text-[var(--color-text-sub)]"><span><b className="block text-sm text-emerald-600">{approved}</b>{copy.approved}</span><span><b className="block text-sm text-orange-500">{pending}</b>{copy.pending}</span><span><b className="block text-sm text-red-500">{rejected}</b>{copy.rejected}</span></div>
        </Link>}

        {estimateAccess && visible('sales') && <Link href="/sales?view=CONTRACTS" className="cc-tactile-card group min-h-[196px] p-5 xl:col-span-4" data-interactive="true">
          <div className="mb-5 flex items-center justify-between"><div><h3 className="text-sm font-black text-[var(--color-text-main)]">{copy.orderStatus}</h3><p className="mt-1 text-[10px] font-semibold text-[var(--color-text-sub)]">{copy.orderStatusDescription}</p></div><BarChart3 className="h-5 w-5 text-[#eb6300]" /></div>
          <div className="flex h-24 items-end justify-around gap-4 border-b border-[var(--color-border)] px-5">
            {[[copy.won, won.length, '#17965b'], [copy.submitted, sent.length, '#ff8a1f'], [copy.lost, lost.length, '#e43c4b']].map(([label, value, color]) => <div key={String(label)} className="flex h-full flex-1 flex-col items-center justify-end"><b className="mb-1 font-mono text-xs tabular-nums">{value}</b><i className="w-full max-w-14 rounded-t" style={{ height: `${Math.max(8, Number(value) / salesMax * 64)}px`, background: String(color) }} /><span className="mt-2 text-[9px] font-bold text-[var(--color-text-sub)]">{label}</span></div>)}
          </div>
        </Link>}

        {visible('tasks') && <Link href="/tasks/my" className="cc-tactile-card group min-h-[196px] p-5 xl:col-span-5" data-interactive="true">
          <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-black text-[var(--color-text-main)]">{copy.priorityTasks}</h3><ChevronRight className="h-4 w-4 text-[#eb6300]" /></div>
          <div className="divide-y divide-[var(--color-border)]">{myTasks.filter((task) => task.status !== 'DONE').slice(0, 4).map((task) => <div key={task.id} className="flex items-center gap-3 py-2.5"><span className={`h-2 w-2 rounded-full ${task.priority === 'URGENT' ? 'bg-red-500' : 'bg-[#ff8a1f]'}`} /><span className="min-w-0 flex-1 truncate text-[11px] font-bold text-[var(--color-text-main)]">{localizeGeneratedTaskTitle(task.title, language)}</span><span className="text-[9px] font-semibold text-[var(--color-text-sub)]">{task.dueDate || copy.noDeadline}</span></div>)}{myTasks.filter((task) => task.status !== 'DONE').length === 0 && <p className="py-10 text-center text-xs text-[var(--color-text-sub)]">{copy.noPriorityTasks}</p>}</div>
        </Link>}

        {visible('schedule') && <Link href="/calendar" className="cc-tactile-card group min-h-[196px] p-5 xl:col-span-3" data-interactive="true">
          <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-black text-[var(--color-text-main)]">{copy.todaySchedule}</h3><CalendarDays className="h-5 w-5 text-[#eb6300]" /></div>
          <strong className="font-mono text-4xl font-black text-[var(--color-text-main)]">{todaySchedules.length}</strong><span className="ml-1 text-xs font-bold text-[var(--color-text-sub)]">{copy.itemUnit}</span>
          <p className="mt-3 text-[11px] font-semibold leading-5 text-[var(--color-text-sub)]">{copy.scheduleDescription}</p>
          <div className="mt-4 flex gap-2"><span className="rounded-md bg-[#eef2ff] px-2 py-1 text-[9px] font-black text-[#405bb0]"><Mail className="mr-1 inline h-3 w-3" />{copy.workConnection}</span><span className="rounded-md bg-orange-50 px-2 py-1 text-[9px] font-black text-orange-700">{copy.viewSchedule}</span></div>
        </Link>}
      </div>
    </section>
  );
}
