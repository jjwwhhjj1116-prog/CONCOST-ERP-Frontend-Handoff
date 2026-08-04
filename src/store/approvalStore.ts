import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { ApprovalLineDefinition, ApprovalRequest, ApprovalWorkflowTemplate, ApprovalRequestType } from '@/types/models';
import { mockApprovalRequests } from '@/data/mockData';
import { useNotificationStore } from '@/store/notificationStore';
import { useTaskStore } from '@/store/taskStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useConflictStore } from '@/store/conflictStore';
import { useProcessTemplateStore } from '@/store/processTemplateStore';
import { useAuditStore } from '@/store/auditStore';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { canApproveRequest } from '@/lib/permissions';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { normalizeApprovalSteps } from '@/lib/approvalWorkflow';

interface ApprovalState {
  requests: ApprovalRequest[];
  templates: ApprovalWorkflowTemplate[];
  savedLines: ApprovalLineDefinition[];
  addRequest: (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }) => string;
  updateApprovalStatus: (id: string, status: 'APPROVED' | 'REJECTED' | 'PM_APPROVED' | 'MANAGER_REVIEWING', reviewerId: string, comment?: string, alternativeType?: ApprovalRequestType) => void;
  reviewDocument: (id: string, reviewerId: string, action: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES', comment?: string, stepId?: string) => boolean;
  cancelRequest: (id: string, requesterId: string, reason?: string) => boolean;
  saveDraft: (request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { id?: string }) => string;
  saveLine: (line: ApprovalLineDefinition) => void;
  deleteLine: (lineId: string, actorId: string) => boolean;
  copyLine: (lineId: string, actorId: string) => string | null;
  setDefaultLine: (lineId: string, actorId: string) => boolean;
  incrementLineUsage: (lineId: string) => void;
  updateTemplate: (templateId: string, updates: Partial<ApprovalWorkflowTemplate>) => void;
  replaceRequests: (requests: ApprovalRequest[]) => void;
  resetRequests: () => void;
  replaceTemplates: (templates: ApprovalWorkflowTemplate[]) => void;
  resetTemplates: () => void;
}

const initialRequests: ApprovalRequest[] = [
  ...mockApprovalRequests
];

const initialTemplates: ApprovalWorkflowTemplate[] = [
  {
    id: 'tmpl_1',
    requestType: 'OVERTIME_REQUEST',
    isActive: true,
    steps: [
      { stepIndex: 1, role: 'PM', required: true },
      { stepIndex: 2, role: 'DEPARTMENT_MANAGER', required: true }
    ]
  },
  {
    id: 'tmpl_2',
    requestType: 'SCHEDULE_APPROVAL',
    isActive: true,
    steps: [
      { stepIndex: 1, role: 'DEPARTMENT_MANAGER', required: true }
    ]
  }
];

const initialSavedLines: ApprovalLineDefinition[] = [];

const approvalStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined' || getRuntimeExecutionMode() !== 'DEMO_LOCAL') return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined' || getRuntimeExecutionMode() !== 'DEMO_LOCAL') return;
    window.localStorage.setItem(name, value);
  },
  removeItem: (name) => {
    if (typeof window === 'undefined' || getRuntimeExecutionMode() !== 'DEMO_LOCAL') return;
    window.localStorage.removeItem(name);
  },
};

export const useApprovalStore = create<ApprovalState>()(persist((set, get) => ({
  requests: initialRequests,
  templates: initialTemplates,
  savedLines: initialSavedLines,
  addRequest: (requestData) => {
    const newId = requestData.id || `apr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      requests: [...state.requests, {
        ...requestData,
        id: newId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]
    }));

    useAuditStore.getState().addLog({
      actorId: requestData.requestedBy,
      action: 'CREATE',
      entityType: 'APPROVAL',
      entityId: newId,
      message: `Approval Request [${requestData.title}] created.`
    });

    const firstApproverId = requestData.approvalLine?.[0]?.approverId || requestData.managerId;
    if (firstApproverId) {
      useNotificationStore.getState().addNotification({
        userId: firstApproverId,
        type: 'SYSTEM',
        title: '새 결재 요청 알림',
        message: `[${requestData.title}] 결재가 요청되었습니다.`,
        priority: 'NORMAL',
        relatedApprovalId: newId
      });
    }

    return newId;
  },
  saveDraft: (requestData) => {
    if (getRuntimeExecutionMode() !== 'DEMO_LOCAL') return '';
    const id = requestData.id || `apr_draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    set((state) => ({
      requests: [
        ...state.requests.filter((request) => request.id !== id),
        { ...requestData, id, status: 'DRAFT', createdAt: now, updatedAt: now },
      ],
    }));
    return id;
  },
  saveLine: (line) => {
    if (getRuntimeExecutionMode() !== 'DEMO_LOCAL') return;
    const now = new Date().toISOString();
    set((state) => {
      const existing = state.savedLines.find((item) => item.id === line.id);
      const saved = {
        ...line,
        steps: normalizeApprovalSteps(line.steps),
        version: existing ? existing.version + 1 : Math.max(1, line.version),
        createdAt: existing?.createdAt ?? line.createdAt ?? now,
        updatedAt: now,
      };
      return {
        savedLines: existing
          ? state.savedLines.map((item) => item.id === line.id ? saved : item)
          : [...state.savedLines, saved],
      };
    });
  },
  deleteLine: (lineId, actorId) => {
    if (getRuntimeExecutionMode() !== 'DEMO_LOCAL') return false;
    const line = get().savedLines.find((item) => item.id === lineId);
    if (!line || line.ownerId !== actorId || line.steps.some((step) => step.policyLocked)) return false;
    set((state) => ({ savedLines: state.savedLines.filter((item) => item.id !== lineId) }));
    return true;
  },
  copyLine: (lineId, actorId) => {
    if (getRuntimeExecutionMode() !== 'DEMO_LOCAL') return null;
    const line = get().savedLines.find((item) => item.id === lineId);
    if (!line) return null;
    const now = new Date().toISOString();
    const copyId = `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({
      savedLines: [...state.savedLines, {
        ...line,
        id: copyId,
        ownerId: actorId,
        scope: 'PERSONAL',
        name: `${line.name} (복사본)`,
        isDefault: false,
        usageCount: 0,
        version: 1,
        steps: line.steps.map((step) => ({ ...step, id: `${step.id}_copy_${Math.random().toString(36).slice(2, 6)}`, status: 'PENDING' })),
        createdAt: now,
        updatedAt: now,
      }],
    }));
    return copyId;
  },
  setDefaultLine: (lineId, actorId) => {
    if (getRuntimeExecutionMode() !== 'DEMO_LOCAL') return false;
    const line = get().savedLines.find((item) => item.id === lineId);
    if (!line || (line.scope === 'PERSONAL' && line.ownerId !== actorId)) return false;
    set((state) => ({
      savedLines: state.savedLines.map((item) => ({
        ...item,
        isDefault: item.id === lineId
          ? true
          : item.companyId === line.companyId && item.formType === line.formType
            ? false
            : item.isDefault,
      })),
    }));
    return true;
  },
  incrementLineUsage: (lineId) => set((state) => ({
    savedLines: state.savedLines.map((line) => line.id === lineId ? { ...line, usageCount: line.usageCount + 1 } : line),
  })),
  updateApprovalStatus: (id, status, reviewerId, comment, alternativeType) => set((state) => {
    const request = state.requests.find(r => r.id === id);
    if (!request) return state;

    const terminalStatuses = new Set(['APPROVED', 'REJECTED', 'CANCELLED']);
    if (terminalStatuses.has(request.status)) return state;

    const reviewer = useAuthStore.getState().currentUser;
    const project = request.projectId
      ? useProjectStore.getState().projects.find((item) => item.id === request.projectId)
      : undefined;
    const canReviewProjectSchedule = request.type === 'SCHEDULE_APPROVAL' &&
      (status === 'APPROVED' || status === 'REJECTED') &&
      (reviewer?.role === 'SUPER_ADMIN' || (
        reviewer?.role === 'DEPARTMENT_MANAGER' &&
        reviewer.departmentId === project?.departmentId &&
        (!request.managerId || request.managerId === reviewer.id)
      ));
    const approvalLineStep = request.approvalLine?.[request.currentApprovalStep ?? 0];
    const canReviewApprovalLine = Boolean(
      reviewer &&
      approvalLineStep &&
      (reviewer.role === 'SUPER_ADMIN' || approvalLineStep.approverId === reviewer.id)
    );
    const hasReviewPermission = request.type === 'SCHEDULE_APPROVAL' &&
      (status === 'APPROVED' || status === 'REJECTED')
      ? canReviewProjectSchedule
      : approvalLineStep
        ? canReviewApprovalLine
        : reviewer ? canApproveRequest(reviewer, request) : false;

    if (!reviewer || reviewer.id !== reviewerId || !hasReviewPermission) {
      console.warn('Permission denied: cannot review approval request');
      return state;
    }
    
    // Audit Log
    useAuditStore.getState().addLog({
      actorId: reviewerId,
      action: 'UPDATE',
      entityType: 'APPROVAL',
      entityId: id,
      message: `Approval Request ${id} status changed to ${status} by User ${reviewerId}. Comment: ${comment || 'N/A'}`
    });

    if (status === 'APPROVED' || status === 'REJECTED') {
      // Send Notification to requester
      useNotificationStore.getState().addNotification({
        userId: request.requestedBy,
        type: 'SYSTEM',
        title: `결재 ${status === 'APPROVED' ? '승인' : '반려'} 알림`,
        message: `요청하신 [${request.title}] 결재가 ${status === 'APPROVED' ? '승인' : '반려'} 처리되었습니다.\n검토자 의견: ${comment || '없음'}`,
        priority: status === 'REJECTED' ? 'HIGH' : 'NORMAL',
        relatedApprovalId: request.id
      });

      if (request.type === 'SCHEDULE_APPROVAL' && request.projectId) {
        const taskStore = useTaskStore.getState();
        const scheduleStore = useScheduleStore.getState();
        const scheduleTasks = taskStore.tasks.filter((task) =>
          task.projectId === request.projectId && task.approvalRequestId === request.id
        );

        if (status === 'APPROVED') {
          scheduleTasks.forEach((task) => {
            const approvedTask = { ...task, approvalStatus: 'APPROVED' as const };
            taskStore.updateTask(task.id, { approvalStatus: 'APPROVED' });
            scheduleStore.upsertTaskSchedule(approvedTask, reviewerId);
          });
          useProjectStore.getState().updateProjectStatus(request.projectId, 'IN_PROGRESS');
        } else {
          scheduleTasks.forEach((task) => taskStore.updateTask(task.id, { approvalStatus: 'REJECTED' }));
          scheduleStore.removeTaskSchedules(scheduleTasks.map((task) => task.id));
          useProjectStore.getState().updateProjectStatus(request.projectId, 'SCHEDULE_REJECTED');
        }
      }

      if (status === 'APPROVED' && request.taskId) {
        const taskStore = useTaskStore.getState();
        const task = taskStore.tasks.find(t => t.id === request.taskId);
        if (task) {
          if (request.type === 'DEADLINE_EXTENSION') {
            taskStore.updateTask(task.id, { dueDate: request.requestedDueDate || task.dueDate });
          } else if (request.type === 'OVERTIME_REQUEST') {
            const start = request.requestedStartDate || new Date().toISOString().split('T')[0];
            const end = request.requestedDueDate || new Date().toISOString().split('T')[0];
            taskStore.addWorkSegment({
              taskId: task.id,
              workerId: request.requestedBy,
              description: `[야근/초과근무 승인] ${request.title}`,
              startDate: start,
              endDate: end,
              progress: 0,
              status: 'APPROVED',
              isOvertime: true
            });
            
            // Check conflicts
            const overlapping = useScheduleStore.getState().schedules.filter(s => 
              s.userId === request.requestedBy && s.scheduleType === 'OFF' &&
              s.startDateTime.split('T')[0] <= end && s.endDateTime.split('T')[0] >= start
            );
            if (overlapping.length > 0) {
              useConflictStore.getState().addConflicts(overlapping.map(s => ({
                id: `c_${Date.now()}_${Math.random()}`,
                userId: request.requestedBy,
                startDate: s.startDateTime,
                endDate: s.endDateTime,
                conflictType: 'LEAVE_OVERLAP',
                relatedTaskIds: [task.id],
                relatedScheduleIds: [s.id],
                description: `휴가 일정과 야근/초과근무 일정이 겹칩니다.`,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })));
            }
          } else if (request.type === 'SCHEDULE_REPLAN') {
            const start = request.requestedStartDate || new Date().toISOString().split('T')[0];
            const end = request.requestedDueDate || new Date().toISOString().split('T')[0];
            taskStore.addWorkSegment({
              taskId: task.id,
              workerId: request.requestedBy,
              description: `[세부일정 변경 승인] ${request.title}`,
              startDate: start,
              endDate: end,
              progress: 0,
              status: 'APPROVED',
              isOvertime: false
            });
            // If the replan exceeds original bounds, adjust them
            const newStart = request.requestedStartDate || task.startDate;
            const newEnd = request.requestedDueDate || task.dueDate;
            taskStore.updateTask(task.id, { startDate: newStart, dueDate: newEnd });
            
            // Check conflicts
            const overlapping = useScheduleStore.getState().schedules.filter(s => 
              s.userId === request.requestedBy && s.scheduleType === 'OFF' &&
              s.startDateTime.split('T')[0] <= end && s.endDateTime.split('T')[0] >= start
            );
            if (overlapping.length > 0) {
              useConflictStore.getState().addConflicts(overlapping.map(s => ({
                id: `c_${Date.now()}_${Math.random()}`,
                userId: request.requestedBy,
                startDate: s.startDateTime,
                endDate: s.endDateTime,
                conflictType: 'LEAVE_OVERLAP',
                relatedTaskIds: [task.id],
                relatedScheduleIds: [s.id],
                description: `휴가 일정과 세부 조정된 업무 일정이 겹칩니다.`,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              })));
            }
          } else if (request.type === 'MANPOWER_SUPPORT') {
            taskStore.addTask({
              projectId: task.projectId,
              title: `[지원] ${task.title}`,
              description: `[인력 지원 요청 승인] ${request.reason}`,
              status: 'TODO',
              priority: task.priority,
              departmentId: task.departmentId,
              assigneeId: '', // Unassigned, PM to assign later
              startDate: request.requestedStartDate || task.startDate,
              dueDate: request.requestedDueDate || task.dueDate,
              orderIndex: task.orderIndex + 1,
              approvalStatus: 'APPROVED'
            });
          } else if (request.type === 'PROCESS_SCHEDULE_APPROVAL') {
            const processTemplateStore = useProcessTemplateStore.getState();
            const assignment = processTemplateStore.assignments.find(a => a.taskId === task.id && a.status === 'PENDING_APPROVAL');
            if (assignment) {
              processTemplateStore.approveAssignment(assignment.id);
              
              const schedules = processTemplateStore.schedules.filter(s => s.assignmentId === assignment.id);
              const scheduleStore = useScheduleStore.getState();

              schedules.forEach(s => {
                if (s.startDate && s.endDate && s.assigneeId) {
                  const pTask = processTemplateStore.tasks.find(pt => pt.id === s.processTaskId);
                  const stage = processTemplateStore.stages.find(st => st.id === s.processStageId);
                  const description = `[공정: ${stage?.name || '미지정'}] ${pTask?.name || '미지정'}${s.description ? ` - ${s.description}` : ''}`;
                  
                  // 1. TaskStore에 WorkSegment 추가
                  taskStore.addWorkSegment({
                    taskId: task.id,
                    workerId: s.assigneeId,
                    description,
                    startDate: s.startDate,
                    endDate: s.endDate,
                    progress: s.progress,
                    status: 'APPROVED',
                    isOvertime: false
                  });

                  // 2. ScheduleStore에 PersonalSchedule (Official) 추가 (Handoff)
                  scheduleStore.addSchedule({
                    userId: s.assigneeId,
                    ownerRole: 'WORKER',
                    departmentId: task.departmentId,
                    title: `[공정일정] ${task.title}`,
                    description,
                    scheduleType: 'PERSONAL_WORK',
                    startDateTime: `${s.startDate}T09:00:00Z`,
                    endDateTime: `${s.endDate}T18:00:00Z`,
                    isAllDay: true,
                    visibility: 'DEPARTMENT',
                    createdBy: reviewerId,
                    updatedBy: reviewerId,
                    requiresApproval: false
                  });
                }
              });
            }
          }
        }
      } else if (status === 'REJECTED' && request.taskId) {
        if (request.type === 'PROCESS_SCHEDULE_APPROVAL') {
          const processTemplateStore = useProcessTemplateStore.getState();
          const assignment = processTemplateStore.assignments.find(a => a.taskId === request.taskId && (a.status === 'PENDING_APPROVAL' || a.status === 'DRAFT'));
          if (assignment) {
            processTemplateStore.rejectAssignment(assignment.id, comment || '반려되었습니다.');
          }
        }
      }
    }

    return {
      requests: state.requests.map(r => 
        r.id === id 
          ? { ...r, status, reviewedBy: reviewerId, reviewComment: comment, alternativeType, updatedAt: new Date().toISOString() }
          : r
      )
    };
  }),
  reviewDocument: (id, reviewerId, action, comment, stepId) => {
    const request = get().requests.find((item) => item.id === id);
    const reviewer = useAuthStore.getState().currentUser;
    if (!request || !reviewer || reviewer.id !== reviewerId || ['APPROVED', 'REJECTED', 'RECALLED', 'CANCELLED'].includes(request.status)) return false;

    const line = request.approvalLine || [];
    if (line.length === 0) {
      if (!canApproveRequest(reviewer, request) || action === 'REQUEST_CHANGES') return false;
      get().updateApprovalStatus(
        id,
        action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reviewerId,
        comment,
      );
      return true;
    }
    const unresolved = line.filter((step) => step.kind !== 'REFERENCE' && step.status === 'PENDING');
    const firstSequence = Math.min(...unresolved.map((step) => step.sequence ?? Number.MAX_SAFE_INTEGER));
    const actionable = unresolved.filter((step) => {
      if ((step.sequence ?? Number.MAX_SAFE_INTEGER) === firstSequence) return true;
      return step.executionMode === 'PARALLEL_ALL' && step.groupId && unresolved.some((candidate) => candidate.groupId === step.groupId && (candidate.sequence ?? 0) === firstSequence);
    });
    const currentStep = stepId
      ? actionable.find((step) => step.id === stepId)
      : actionable.find((step) =>
          step.approverId === reviewer.id ||
          (!step.approverId && step.approverRole === reviewer.role) ||
          reviewer.role === 'SUPER_ADMIN',
        );
    if (!currentStep) return false;
    if (reviewer.role !== 'SUPER_ADMIN' && currentStep.approverId !== reviewer.id && currentStep.approverRole !== reviewer.role) return false;

    const timestamp = new Date().toISOString();
    const nextLine = line.map((step) => step.id === currentStep.id ? {
      ...step,
      status: action === 'APPROVE'
        ? 'APPROVED' as const
        : action === 'REQUEST_CHANGES'
          ? 'CHANGES_REQUESTED' as const
          : 'REJECTED' as const,
      actedAt: timestamp,
      comment,
    } : step);

    if (action === 'REJECT' || action === 'REQUEST_CHANGES') {
      const nextStatus = action === 'REJECT' ? 'REJECTED' : 'CHANGES_REQUESTED';
      set((state) => ({ requests: state.requests.map((item) => item.id === id ? {
        ...item,
        approvalLine: nextLine,
        status: nextStatus,
        reviewedBy: reviewerId,
        reviewComment: comment,
        updatedAt: timestamp,
      } : item) }));
      useAuditStore.getState().addLog({ actorId: reviewerId, action: 'UPDATE', entityType: 'APPROVAL', entityId: id, message: `Approval document ${id} ${action === 'REJECT' ? 'rejected' : 'requested changes'} at ${currentStep.label}.` });
      useNotificationStore.getState().addNotification({ userId: request.requestedBy, type: 'SYSTEM', title: action === 'REJECT' ? '결재 반려 알림' : '결재 수정 요청', message: `[${request.title}] 문서가 ${currentStep.label} 단계에서 ${action === 'REJECT' ? '반려' : '수정 요청'}되었습니다.`, priority: 'HIGH', relatedApprovalId: id });
      return true;
    }

    const remaining = nextLine.filter((step) => step.kind !== 'REFERENCE' && step.status === 'PENDING');
    if (remaining.length > 0) {
      const nextSequence = Math.min(...remaining.map((step) => step.sequence ?? Number.MAX_SAFE_INTEGER));
      const nextTargets = remaining.filter((step) => (step.sequence ?? Number.MAX_SAFE_INTEGER) === nextSequence || (step.executionMode === 'PARALLEL_ALL' && step.groupId === remaining.find((candidate) => (candidate.sequence ?? Number.MAX_SAFE_INTEGER) === nextSequence)?.groupId));
      set((state) => ({ requests: state.requests.map((item) => item.id === id ? {
        ...item,
        approvalLine: nextLine,
        currentApprovalStep: nextLine.findIndex((step) => step.id === nextTargets[0]?.id),
        status: 'MANAGER_REVIEWING',
        reviewedBy: reviewerId,
        reviewComment: comment,
        updatedAt: timestamp,
      } : item) }));
      useAuditStore.getState().addLog({ actorId: reviewerId, action: 'UPDATE', entityType: 'APPROVAL', entityId: id, message: `Approval document ${id} advanced from ${currentStep.label}.` });
      nextTargets.forEach((target) => {
        if (!target.approverId) return;
        useNotificationStore.getState().addNotification({ userId: target.approverId, type: 'SYSTEM', title: '결재 요청 알림', message: `[${request.title}] 문서의 결재 차례입니다.`, priority: 'NORMAL', relatedApprovalId: id });
      });
      return true;
    }

    set((state) => ({ requests: state.requests.map((item) => item.id === id ? { ...item, approvalLine: nextLine } : item) }));
    get().updateApprovalStatus(id, 'APPROVED', reviewerId, comment || '최종 승인');
    return true;
  },
  cancelRequest: (id, requesterId, reason) => {
    const request = get().requests.find((item) => item.id === id);
    const actor = useAuthStore.getState().currentUser;
    if (!request || !actor || actor.id !== requesterId || ['APPROVED', 'REJECTED', 'CANCELLED'].includes(request.status)) return false;
    if (request.requestedBy !== requesterId && actor.role !== 'SUPER_ADMIN') return false;
    const timestamp = new Date().toISOString();
    set((state) => ({ requests: state.requests.map((item) => item.id === id ? { ...item, status: 'CANCELLED', reviewComment: reason, updatedAt: timestamp } : item) }));
    useAuditStore.getState().addLog({ actorId: requesterId, action: 'UPDATE', entityType: 'APPROVAL', entityId: id, message: `Approval document ${id} cancelled. Reason: ${reason || 'N/A'}` });
    return true;
  },
  updateTemplate: (templateId, updates) => set((state) => ({
    templates: state.templates.map(t => 
      t.id === templateId ? { ...t, ...updates } : t
    )
  })),
  replaceRequests: (requests) => set({ requests }),
  resetRequests: () => set({ requests: [] }),
  replaceTemplates: (templates) => set({ templates }),
  resetTemplates: () => set({ templates: [] })
}), {
  name: 'approval-storage',
  storage: createJSONStorage(() => approvalStorage),
  partialize: (state) => getRuntimeExecutionMode() === 'DEMO_LOCAL'
    ? { requests: state.requests, templates: state.templates, savedLines: state.savedLines }
    : { requests: [], templates: [], savedLines: [] },
}));
