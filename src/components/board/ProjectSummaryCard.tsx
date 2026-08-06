import React from 'react';
import { Project, ProjectExecutionUnitId, TaskCard } from '@/types/models';
import { getProjectOverallProgress, getProjectDeliveryLifecycle, getProjectDeliveryBadge, getProjectBoardColumn } from '@/lib/selectors';
import { Activity, AlertCircle, BarChart3, CalendarClock, CheckCircle, ClipboardCheck, Clock, PackageCheck, PencilLine, User, UsersRound } from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/Badge';
import { getUserDisplayName, useTranslation } from '@/lib/localization';
import { useTranslationStore } from '@/store/translationStore';
import { ProjectWorkflowSummary, ProjectWorkflowTab } from '@/lib/projectWorkflow';
import { ProjectWorkflowProgress } from '@/components/projects/ProjectWorkflowProgress';
import { getProjectAssignment, getProjectStaffingMemberIds, getProjectStaffingRoleLabel, isProjectStaffingReady } from '@/lib/projectStaffing';
import { SemanticActionButton, type SemanticActionVariant } from '@/components/ui/SemanticActionButton';

interface Props {
  project: Project;
  tasks: TaskCard[];
  onClick: (projectId: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLElement>, projectId: string) => void;
  onOperationClick?: (projectId: string, tab?: ProjectWorkflowTab) => void;
  workflow: ProjectWorkflowSummary;
  onProjectAction?: (project: Project, action: 'START' | 'DUE' | 'COMPLETE' | 'REVISION') => void;
  assignmentUnitId?: ProjectExecutionUnitId | null;
}

export const ProjectSummaryCard: React.FC<Props> = ({ project, tasks, onClick, draggable, onDragStart, onOperationClick, onProjectAction, workflow, assignmentUnitId }) => {
  const { users, currentUser } = useAuthStore();
  const { postDeliveryWorkRequests, revisionRequests } = useProjectStore();
  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);

  const progress = getProjectOverallProgress(project, tasks);
  const lifecycle = getProjectDeliveryLifecycle(project);
  const badgeText = getProjectDeliveryBadge(project);
  const assignment = getProjectAssignment(project, assignmentUnitId);
  const pmUser = users.find(u => u.id === (assignment?.pmId || project.pmId));
  const projectMembers = getProjectStaffingMemberIds(project, tasks, assignmentUnitId)
    .map((id) => users.find((user) => user.id === id))
    .filter((user): user is NonNullable<typeof user> => Boolean(user));
  const memberTeams = Array.from(new Set(projectMembers.map((user) => user.teamName || user.subDepartmentName || user.departmentName).filter(Boolean)));
  const staffingRoles = assignment?.staffingPlan || [];
  const assignedStaffingMemberCount = new Set(staffingRoles.flatMap((role) => role.personnelIds)).size;
  const unassignedRoleCount = staffingRoles.filter((role) => role.personnelIds.length === 0).length;
  const staffingReady = isProjectStaffingReady(assignment);
  const staffingStatusLabel = assignment?.staffingStatus === 'ACTIVE'
    ? '착수'
    : assignment?.staffingStatus === 'CONFIRMED'
      ? '확정'
      : '미확정';
  const staffingActionLabel = !assignment || assignedStaffingMemberCount === 0
    ? '투입인원 배정'
    : assignment.staffingStatus === 'ACTIVE'
      ? '투입인원 변경'
      : assignment.staffingStatus === 'CONFIRMED'
        ? '투입인원 보기·수정'
        : '투입인원 계속 배정';
  const activeRevisionsCount = revisionRequests.filter(r => r.projectId === project.id && (r.status === 'PENDING' || r.status === 'ACCEPTED')).length;
  const boardColumn = getProjectBoardColumn(project, new Date(), activeRevisionsCount > 0);
  const cardAccent = boardColumn === 'PRE_WORK' ? 'border-l-slate-400' : boardColumn === 'IN_PROGRESS' ? 'border-l-sky-500' : boardColumn === 'COMPLETED' ? 'border-l-emerald-500' : 'border-l-orange-500';
  
  const pendingTasks = tasks.filter(t => t.projectId === project.id && t.status !== 'DONE').length;
  const pendingRequestsCount = postDeliveryWorkRequests.filter(r => r.projectId === project.id && (r.status === 'PENDING_PM' || r.status === 'PENDING_MANAGER' || r.status === 'PENDING_SUPER_ADMIN')).length;
  
  const getLifecycleBadgeVariant = () => {
    switch (lifecycle) {
      case 'OVERDUE': 
      case 'DUE_TODAY': return 'ERROR';
      case 'DUE_WITHIN_1_WEEK': 
      case 'DUE_WITHIN_2_WEEKS':
      case 'POST_DELIVERY_WORK_REQUESTED': 
      case 'POST_DELIVERY_WORK_IN_PROGRESS': return 'WARNING';
      case 'DUE_WITHIN_1_MONTH':
      case 'REOPENED': return 'INFO';
      case 'DELIVERY_CLOSED_AUTO':
      case 'DELIVERY_CLOSED_MANUAL': return 'SUCCESS';
      default: return 'DEFAULT';
    }
  };

  return (
    <article
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, project.id)}
      className={`cc-tactile-card group space-y-3 border-l-[3px] ${cardAccent} p-4`}
      data-interactive="true"
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge variant={getLifecycleBadgeVariant()}>{badgeText}</Badge>
        </div>
        <div className="flex items-start gap-2">
          <button type="button" onClick={() => onClick(project.id)} className="min-w-0 flex-1 rounded text-left font-bold text-[15px] text-[var(--color-text-main)] line-clamp-2 leading-snug group-hover:text-[var(--color-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{project.title}</button>
          {onOperationClick && <button type="button" title={t('projectWorkflow.openCurrent')} aria-label={t('projectWorkflow.openCurrent')} onClick={() => onOperationClick(project.id, workflow.currentTab)} className="shrink-0 rounded-md border border-[var(--color-border)] p-1.5 text-[var(--color-text-sub)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><Activity className="h-4 w-4" /></button>}
        </div>
      </div>

      <div className="border-y border-[var(--color-border)] py-2">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold text-[var(--color-text-sub)]">
          <span>{t(`projectWorkflow.phase.${workflow.currentPhase}`)}</span>
          <span>{workflow.completion}%</span>
        </div>
        <ProjectWorkflowProgress summary={workflow} compact />
      </div>

      <div className="flex items-center justify-between text-[11px] text-[var(--color-text-sub)]">
        <div className="flex items-center gap-1.5">
          <div className={`grid h-7 w-7 place-items-center rounded-full border text-[10px] font-black ${pmUser ? 'border-indigo-200 bg-indigo-600 text-white' : 'border-amber-200 bg-amber-50 text-amber-700'}`} aria-hidden="true">
            {pmUser ? getUserDisplayName(pmUser).slice(0, 1) : <User className="w-3.5 h-3.5" />}
          </div>
          <span className="font-medium">PM · {pmUser ? getUserDisplayName(pmUser) : t('board.summary.pmUnset')}</span>
        </div>
        <div className="flex items-center gap-1 font-semibold">
          <Clock className="w-3 h-3" aria-hidden="true" />
          <span>{project.deliveryDate || project.dueDate ? t('board.summary.targetDelivery', { date: project.deliveryDate || project.dueDate || '' }) : t('unset')}</span>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-black text-[var(--color-text-sub)]"><UsersRound className="h-3.5 w-3.5" />공종별 투입인원 · {projectMembers.length}명</span>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${staffingReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{staffingStatusLabel}{unassignedRoleCount > 0 ? ` · ${unassignedRoleCount} 미배정` : ''}</span>
        </div>
        {staffingRoles.length > 0 ? <div className="mt-2 space-y-1.5">{staffingRoles.map((role, roleIndex) => {
          const roleMembers = role.personnelIds.map((id) => users.find((user) => user.id === id)).filter((user): user is NonNullable<typeof user> => Boolean(user));
          const roleLabel = assignmentUnitId || assignment?.unitId ? getProjectStaffingRoleLabel((assignmentUnitId || assignment!.unitId)!, role.roleLabel, settings.uiLanguage) : role.roleLabel;
          return <div key={role.roleId} className="group/role relative flex min-h-7 items-center justify-between gap-2 rounded-md px-1.5 hover:bg-white focus-within:bg-white">
            <span className="max-w-[92px] truncate text-[9px] font-bold text-[var(--color-text-sub)]">{roleLabel}</span>
            <button type="button" aria-label={`${roleLabel} ${roleMembers.length}명`} className="flex min-w-0 items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
              {roleMembers.length > 0 ? <><span className="flex -space-x-1.5">{roleMembers.slice(0, 3).map((member, index) => <span key={member.id} className="grid h-6 w-6 place-items-center rounded-full border-2 border-[var(--color-surface)] text-[8px] font-black text-white shadow-sm" style={{ background: ['#2979a8','#d07a28','#18806a','#7a5bb2'][((roleIndex * 2) + index) % 4] }}>{getUserDisplayName(member).slice(0, 1)}</span>)}</span>{roleMembers.length > 3 && <span className="ml-1 text-[9px] font-black text-[var(--color-primary)]">+{roleMembers.length - 3}</span>}</> : <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[8px] font-black text-amber-800">미배정</span>}
            </button>
            {roleMembers.length > 0 && <div role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-20 mb-1 hidden w-52 rounded-lg border border-slate-200 bg-white p-2 text-[9px] leading-4 text-slate-700 shadow-xl group-hover/role:block group-focus-within/role:block">{roleMembers.map((member) => <p key={member.id}><strong>{getUserDisplayName(member)}</strong> · {roleLabel} · {role.startDate || '미정'}~{role.endDate || '미정'}</p>)}</div>}
          </div>;
        })}</div> : <p className="mt-2 text-[10px] font-semibold text-[var(--color-text-sub)]">착수 전 공종과 투입인원을 배정해 주세요.</p>}
        {memberTeams.length > 0 && <p className="mt-2 truncate text-[9px] font-bold text-[var(--color-text-sub)]">{memberTeams.join(' · ')}</p>}
      </div>

      <div className="space-y-1.5 pt-1 border-t border-[var(--color-border)]">
        <div className="flex justify-between text-[11px] font-bold text-[var(--color-text-main)]">
          <span>{t('board.summary.progress')}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-[var(--color-primary)] h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex gap-3 text-[11px] font-semibold text-[var(--color-text-sub)]">
        <div className="flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{t('board.summary.pendingTasks', { count: pendingTasks.toString() })}</span>
        </div>
        {pendingRequestsCount > 0 && (
          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('board.summary.addRequests', { count: pendingRequestsCount.toString() })}</span>
          </div>
        )}
        {activeRevisionsCount > 0 && (
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t('board.summary.revisions', { count: activeRevisionsCount.toString() })}</span>
          </div>
        )}
      </div>

      {project.status === 'MANAGER_REVIEW' && currentUser?.role === 'DEPARTMENT_MANAGER' && (
        <div className="pt-2 border-t border-[var(--color-border)] flex justify-end">
          <button 
            className="text-[11px] px-3 py-1.5 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors shadow-sm"
            onClick={(e) => { 
              e.stopPropagation(); 
              useProjectStore.getState().updateProjectStatus(project.id, 'COMPLETED'); 
            }}
          >
            {t('board.summary.finalApprove')}
          </button>
        </div>
      )}

      {onOperationClick && <div className="grid grid-cols-3 gap-1 border-t border-[var(--color-border)] pt-2">
        <WorkflowAction icon={<ClipboardCheck className="h-3.5 w-3.5" />} label={t('projectWorkflow.phase.QC')} onClick={() => onOperationClick(project.id, 'QC')} />
        <WorkflowAction icon={<PackageCheck className="h-3.5 w-3.5" />} label={t('projectWorkflow.phase.DELIVERY')} onClick={() => onOperationClick(project.id, 'DELIVERY')} />
        <WorkflowAction icon={<BarChart3 className="h-3.5 w-3.5" />} label={t('projectWorkflow.phase.PROFIT')} onClick={() => onOperationClick(project.id, 'PROFIT')} />
      </div>}

      <div className="grid grid-cols-1 gap-1.5 border-t border-[var(--color-border)] pt-2 sm:grid-cols-2">
        {onProjectAction && <ProjectAction icon={<UsersRound className="h-3.5 w-3.5" />} label={staffingActionLabel} variant={!assignment || assignedStaffingMemberCount === 0 ? 'add-resource' : 'edit'} onClick={() => onProjectAction(project, 'START')} />}
        {boardColumn === 'IN_PROGRESS' && onProjectAction && <><ProjectAction icon={<CalendarClock className="h-3.5 w-3.5" />} label="납품 예정" variant="warning" onClick={() => onProjectAction(project, 'DUE')} /><ProjectAction icon={<PackageCheck className="h-3.5 w-3.5" />} label="납품 완료" variant="success" onClick={() => onProjectAction(project, 'COMPLETE')} /></>}
        {boardColumn === 'COMPLETED' && onProjectAction && <ProjectAction icon={<PackageCheck className="h-3.5 w-3.5" />} label="납품 이력" variant="view" onClick={() => onProjectAction(project, 'COMPLETE')} />}
        {boardColumn === 'REVISION' && onProjectAction && <ProjectAction icon={<PencilLine className="h-3.5 w-3.5" />} label="수정 등록" variant="edit" onClick={() => onProjectAction(project, 'REVISION')} />}
      </div>
    </article>
  );
};

function WorkflowAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button type="button" title={label} onClick={onClick} className="inline-flex min-w-0 items-center justify-center gap-1 rounded px-1.5 py-1 text-[10px] font-semibold text-[var(--color-text-sub)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{icon}<span className="truncate">{label}</span></button>;
}

function ProjectAction({ icon, label, variant, onClick }: { icon: React.ReactNode; label: string; variant: SemanticActionVariant; onClick: () => void }) {
  return <SemanticActionButton variant={variant} size="sm" icon={icon} tooltip={label} onClick={onClick} className="w-full text-[10px]">{label}</SemanticActionButton>;
}
