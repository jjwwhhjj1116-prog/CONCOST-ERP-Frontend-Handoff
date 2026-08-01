import { TaskCard, Project, PersonnelCard, TaskBlocker, ProgressUpdate, PersonalSchedule, ScheduleConflict, ProjectWorkPart, DeliveryLifecycle } from '@/types/models';

export type DetailedLineStage = 'WAITING' | 'QC_PM_START' | 'IN_PROGRESS' | 'PM_REVIEW' | 'QC_REVIEW' | 'DONE';

export const getDetailedLineStage = (task: TaskCard): DetailedLineStage => {
  if (task.status === 'DONE' || task.completionStatus === 'COMPLETED') return 'DONE';
  if (task.status === 'REVIEW') {
    if (task.completionStatus === 'MANAGER_REVIEWING' || task.completionStatus === 'MANAGER_APPROVED') return 'QC_REVIEW';
    return 'PM_REVIEW'; // PM_REVIEWING, WORKER_DONE, etc.
  }
  if (task.status === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (task.status === 'READY') return 'QC_PM_START';
  return 'WAITING'; // TODO, HOLD, REJECTED
};

export const calculateTaskProgress = (task: TaskCard): number => {
  if (task.status === 'DONE' || task.completionStatus === 'COMPLETED') return 100;
  if (task.progress !== undefined) return task.progress;
  
  switch (task.status) {
    case 'TODO': return 0;
    case 'READY': return 10;
    case 'IN_PROGRESS': return 50;
    case 'REVIEW': return 90;
    case 'HOLD': return 0;
    case 'REJECTED': return 0;
    default: return 0;
  }
};

export const calculateScheduleProgress = (task: TaskCard): number => {
  if (!task.startDate || !task.dueDate) return 0;
  
  const start = new Date(task.startDate).getTime();
  const end = new Date(task.dueDate).getTime();
  const now = new Date().getTime();

  if (now < start) return 0;
  if (now >= end) return 100;

  const total = end - start;
  const elapsed = now - start;
  
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};

export const calculateTaskHealthScore = (task: TaskCard, blockers: TaskBlocker[], updates: ProgressUpdate[]): number => {
  if (task.status === 'DONE' || task.completionStatus === 'COMPLETED') return 100;
  
  let score = 100;

  // 1. Unresolved blockers penalty
  const openBlockers = blockers.filter(b => b.taskId === task.id && b.status === 'OPEN');
  if (openBlockers.length > 0) {
    score -= 20;
  }

  // 2. Overdue penalty
  if (task.dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    if (today > dueDate) {
      const diffTime = Math.abs(today.getTime() - dueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      score -= (diffDays * 10);
    }
  }

  // 3. Stale update penalty (if in progress and no updates for 3 days)
  if (task.status === 'IN_PROGRESS' || task.status === 'REVIEW') {
    const taskUpdates = updates.filter(u => u.taskId === task.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const lastUpdateDate = taskUpdates.length > 0 ? new Date(taskUpdates[0].createdAt) : (task.updatedAt ? new Date(task.updatedAt) : new Date(task.createdAt || Date.now()));
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastUpdateDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 3) {
      score -= 15;
    }
  }

  return Math.max(0, Math.min(100, score));
};

export const calculateProjectProgress = (tasks: TaskCard[]): number => {
  if (!tasks.length) return 0;
  const totalProgress = tasks.reduce((sum, task) => sum + calculateTaskProgress(task), 0);
  return Math.round(totalProgress / tasks.length);
};

export const getColumnSummary = (tasks: TaskCard[]) => {
  const avgProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((sum, t) => sum + calculateTaskProgress(t), 0) / tasks.length)
    : 0;

  const delayedCount = tasks.filter(t => {
    if (!t.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return t.dueDate < today && t.status !== 'DONE';
  }).length;

  const urgentCount = tasks.filter(t => t.priority === 'URGENT').length;
  const pendingCount = tasks.filter(t => t.approvalStatus === 'PENDING').length;

  return { avgProgress, delayedCount, urgentCount, pendingCount };
};

export const normalizeProjectName = (rawName: string): string => {
  if (!rawName) return '';
  return rawName.replace(/[\n\r]+/g, ' ').trim();
};

export const normalizeScopeName = (rawName: string): string => {
  if (!rawName) return '';
  return rawName.replace(/[\n\r]+/g, ' ').trim();
};

export type DeliveryPresetBucket = 'OVERDUE' | 'WITHIN_1_WEEK' | 'WITHIN_2_WEEKS' | 'WITHIN_1_MONTH' | 'UNSET';

export const getDeliveryUrgencyBucket = (project: Project, today: Date = new Date()): DeliveryPresetBucket => {
  const dateStr = project.projectSourceType === 'INTERNAL_DEVELOPMENT' ? project.targetDate : project.deliveryDate;
  if (!dateStr) return 'UNSET';
  
  const delivery = new Date(dateStr);
  delivery.setHours(0, 0, 0, 0);
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);
  
  const diffTime = delivery.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 7) return 'WITHIN_1_WEEK';
  if (diffDays <= 14) return 'WITHIN_2_WEEKS';
  if (diffDays <= 30) return 'WITHIN_1_MONTH';
  return 'UNSET';
};

export type ProjectBoardColumn =
  | "PRE_WORK"
  | "IN_PROGRESS"
  | "REVISION"
  | "COMPLETED";

export const getProjectDeliveryLifecycle = (project: Project, today: Date = new Date()): DeliveryLifecycle => {
  if (project.deliveryLifecycle) return project.deliveryLifecycle;
  
  const dateStr = project.projectSourceType === 'INTERNAL_DEVELOPMENT' ? project.targetDate : project.deliveryDate;
  if (!dateStr) return 'UNSCHEDULED';

  const delivery = new Date(dateStr);
  delivery.setHours(0, 0, 0, 0);
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);

  const diffTime = delivery.getTime() - current.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays === 0) return 'DUE_TODAY';
  if (diffDays <= 7) return 'DUE_WITHIN_1_WEEK';
  if (diffDays <= 14) return 'DUE_WITHIN_2_WEEKS';
  if (diffDays <= 30) return 'DUE_WITHIN_1_MONTH';
  return 'UPCOMING';
};

export const getProjectBoardColumn = (project: Project, today: Date = new Date(), hasActiveRevision: boolean = false): ProjectBoardColumn => {
  if (hasActiveRevision) return 'REVISION';
  
  const lifecycle = getProjectDeliveryLifecycle(project, today);
  
  if (
    lifecycle === 'DELIVERY_CLOSED_AUTO' || 
    lifecycle === 'DELIVERY_CLOSED_MANUAL'
  ) {
    return 'COMPLETED';
  }
  
  if (
    project.status === 'COMPLETED' || 
    project.status === 'ARCHIVED'
  ) {
    return 'COMPLETED';
  }
  
  if (
    project.status === 'INTAKE_RECEIVED' ||
    project.status === 'MANAGER_REVIEW' ||
    project.status === 'PM_ASSIGNED' ||
    project.status === 'SCHEDULE_DRAFTING' ||
    project.status === 'SCHEDULE_PENDING_APPROVAL' ||
    project.status === 'SCHEDULE_REJECTED'
  ) {
    return 'PRE_WORK';
  }
  
  return 'IN_PROGRESS';
};

export const getProjectDeliveryBadge = (project: Project, today: Date = new Date()): string => {
  const lifecycle = getProjectDeliveryLifecycle(project, today);
  const isInternal = project.projectSourceType === 'INTERNAL_DEVELOPMENT';
  
  switch (lifecycle) {
    case 'OVERDUE': return isInternal ? '목표일 경과' : '납품일 경과';
    case 'DUE_TODAY': return isInternal ? '오늘 목표' : '오늘 납품';
    case 'DUE_WITHIN_1_WEEK': return isInternal ? '목표 1주일 내' : '납품 1주일 내';
    case 'DUE_WITHIN_2_WEEKS': return isInternal ? '목표 2주일 내' : '납품 2주일 내';
    case 'DUE_WITHIN_1_MONTH': return isInternal ? '목표 1달 내' : '납품 1달 내';
    case 'UPCOMING': return isInternal ? '목표일 여유' : '납품일 여유';
    case 'POST_DELIVERY_WORK_REQUESTED': return '추가업무 요청됨';
    case 'POST_DELIVERY_WORK_IN_PROGRESS': return '추가업무 진행중';
    case 'REOPENED': return '재오픈됨';
    case 'DELIVERY_CLOSED_AUTO': return '자동 마감됨';
    case 'DELIVERY_CLOSED_MANUAL': return '수동 마감됨';
    default: return '미정';
  }
};

export const getProjectOverallProgress = (project: Project, tasks: TaskCard[]): number => {
  if (project.progress !== undefined && project.progress !== null) return project.progress;
  const projectTasks = tasks.filter(t => t.projectId === project.id && !t.isDeleted);
  if (projectTasks.length === 0) return 0;
  const total = projectTasks.reduce((sum, t) => sum + calculateTaskProgress(t), 0);
  return Math.round(total / projectTasks.length);
};

export const getProjectWorkParts = (projectId: string, tasks: TaskCard[], users: PersonnelCard[]): ProjectWorkPart[] => {
  const projectTasks = tasks.filter(t => t.projectId === projectId && !t.isDeleted);
  const partsMap = new Map<string, ProjectWorkPart>();
  
  projectTasks.forEach(t => {
    let teamName = 'Unassigned';
    if (t.assigneeId) {
      const assignee = users.find(u => u.id === t.assigneeId);
      if (assignee?.teamName) {
        teamName = assignee.teamName;
      } else if (assignee?.departmentName) {
        teamName = assignee.departmentName;
      }
    }
    
    let scopeName = t.scopeName;
    if (!scopeName || scopeName === 'General') {
      const match = t.title.match(/^\[(.*?)\]/);
      if (match) {
        scopeName = match[1].trim();
      } else {
        scopeName = 'General';
      }
    }
    
    const partKey = scopeName;
    
    if (!partsMap.has(partKey)) {
      partsMap.set(partKey, {
        id: `part_${projectId}_${partKey.replace(/[^a-zA-Z0-9 ]/g, '_')}`,
        projectId,
        teamName,
        partName: scopeName,
        scopeNames: [scopeName],
        source: 'SYSTEM',
        orderIndex: partsMap.size,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  });
  
  return Array.from(partsMap.values()).sort((a, b) => a.orderIndex - b.orderIndex);
};

export const getPartTaskCards = (partId: string, parts: ProjectWorkPart[], tasks: TaskCard[]): TaskCard[] => {
  const part = parts.find(p => p.id === partId);
  if (!part) return [];
  
  return tasks.filter(t => {
    if (t.projectId !== part.projectId || t.isDeleted) return false;
    
    let scopeName = t.scopeName;
    if (!scopeName || scopeName === 'General') {
      const match = t.title.match(/^\[(.*?)\]/);
      if (match) {
        scopeName = match[1].trim();
      } else {
        scopeName = 'General';
      }
    }
    
    return scopeName === part.scopeNames[0];
  });
};

export const getPartEmployees = (partId: string, parts: ProjectWorkPart[], tasks: TaskCard[], users: PersonnelCard[]): PersonnelCard[] => {
  const partTasks = getPartTaskCards(partId, parts, tasks);
  const assigneeIds = Array.from(new Set(partTasks.map(t => t.assigneeId).filter(Boolean)));
  return assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) as PersonnelCard[];
};

export const getPartProgress = (partId: string, parts: ProjectWorkPart[], tasks: TaskCard[]): number => {
  const partTasks = getPartTaskCards(partId, parts, tasks);
  if (partTasks.length === 0) return 0;
  
  const totalProgress = partTasks.reduce((sum, t) => sum + calculateTaskProgress(t), 0);
  return Math.round(totalProgress / partTasks.length);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const getPartScheduleAssignments = (_partId: string, _parts: ProjectWorkPart[], _assignments: unknown[]): unknown[] => {
  return []; // Placeholder for ScheduleAssignments
};

export const detectConflicts = (tasks: TaskCard[], schedules: PersonalSchedule[]): Omit<ScheduleConflict, 'id' | 'createdAt' | 'updatedAt'>[] => {
  const conflicts: Omit<ScheduleConflict, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  const userTasksMap = new Map<string, TaskCard[]>();
  tasks.filter(t => t.status !== 'DONE' && t.assigneeId && t.startDate && t.dueDate).forEach(t => {
    if (!userTasksMap.has(t.assigneeId!)) userTasksMap.set(t.assigneeId!, []);
    userTasksMap.get(t.assigneeId!)!.push(t);
  });

  const userSchedulesMap = new Map<string, PersonalSchedule[]>();
  schedules.filter(s => s.status === 'SCHEDULED' || s.status === 'CHANGED').forEach(s => {
    if (!userSchedulesMap.has(s.userId)) userSchedulesMap.set(s.userId, []);
    userSchedulesMap.get(s.userId)!.push(s);
  });

  // 1. Task Overlap (WORK_OVERLOAD)
  for (const [userId, userTasks] of userTasksMap.entries()) {
    for (let i = 0; i < userTasks.length; i++) {
      for (let j = i + 1; j < userTasks.length; j++) {
        const t1 = userTasks[i];
        const t2 = userTasks[j];
        if (t1.startDate! <= t2.dueDate! && t1.dueDate! >= t2.startDate!) {
          conflicts.push({
            userId,
            startDate: t1.startDate! > t2.startDate! ? t1.startDate! : t2.startDate!,
            endDate: t1.dueDate! < t2.dueDate! ? t1.dueDate! : t2.dueDate!,
            conflictType: 'WORK_OVERLOAD',
            relatedTaskIds: [t1.id, t2.id],
            relatedScheduleIds: [],
            description: `[${t1.title}] 작업과 [${t2.title}] 작업 일정이 겹칩니다.`,
            status: 'PENDING'
          });
        }
      }
    }
  }

  // 2. Schedule vs Task (LEAVE_OVERLAP)
  for (const [userId, userTasks] of userTasksMap.entries()) {
    const userSchedules = userSchedulesMap.get(userId) || [];
    const outOfOfficeSchedules = userSchedules.filter(s => ['OFF', 'CLIENT_MEETING', 'PERSONAL_WORK'].includes(s.scheduleType));
    
    for (const task of userTasks) {
      for (const schedule of outOfOfficeSchedules) {
        const schedStart = schedule.startDateTime.split('T')[0];
        const schedEnd = schedule.endDateTime.split('T')[0];
        if (task.startDate! <= schedEnd && task.dueDate! >= schedStart) {
          conflicts.push({
            userId,
            startDate: task.startDate! > schedStart ? task.startDate! : schedStart,
            endDate: task.dueDate! < schedEnd ? task.dueDate! : schedEnd,
            conflictType: 'LEAVE_OVERLAP',
            relatedTaskIds: [task.id],
            relatedScheduleIds: [schedule.id],
            description: `[${schedule.title}] 일정과 [${task.title}] 작업 일정이 겹칩니다.`,
            status: 'PENDING'
          });
        }
      }
    }
  }

  return conflicts;
};
