import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProcessTemplate, ProcessStage, ProcessTask, ProcessTemplateAssignment, ProcessSchedule } from '@/types/models';
import { useAuditStore } from '@/store/auditStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

interface ProcessTemplateState {
  templates: ProcessTemplate[];
  stages: ProcessStage[];
  tasks: ProcessTask[];
  assignments: ProcessTemplateAssignment[];
  schedules: ProcessSchedule[];
  
  // Initialize with some dummy data if needed
  loadInitialData: (templates: ProcessTemplate[], stages: ProcessStage[], tasks: ProcessTask[]) => void;
  
  // Assignment actions
  addAssignment: (assignment: Omit<ProcessTemplateAssignment, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAssignmentStatus: (id: string, status: ProcessTemplateAssignment['status']) => void;
  submitAssignment: (id: string, reviewerId: string) => void;
  rejectAssignment: (id: string, reason: string) => void;
  approveAssignment: (id: string) => void;
  resubmitAssignment: (id: string) => void;
  
  // Schedule actions
  addSchedule: (schedule: Omit<ProcessSchedule, 'id'>) => string;
  updateSchedule: (id: string, updates: Partial<ProcessSchedule>) => void;
  batchUpdateSchedules: (updates: { id: string; updates: Partial<ProcessSchedule> }[]) => void;
  
  replaceAssignments: (assignments: ProcessTemplateAssignment[]) => void;
  replaceSchedules: (schedules: ProcessSchedule[]) => void;
  reset: () => void;
}

export const useProcessTemplateStore = create<ProcessTemplateState>()(persist((set) => ({
  templates: [],
  stages: [],
  tasks: [],
  assignments: [],
  schedules: [],

  loadInitialData: (templates, stages, tasks) => set({ templates, stages, tasks }),

  addAssignment: (assignmentData) => {
    const newId = `pta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      assignments: [...state.assignments, {
        ...assignmentData,
        id: newId,
        revisionNo: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]
    }));
    return newId;
  },

  updateAssignmentStatus: (id, status) => set((state) => ({
    assignments: state.assignments.map(a => 
      a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a
    )
  })),

  submitAssignment: (id, reviewerId) => set((state) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return state;

    const assignment = state.assignments.find(a => a.id === id);
    if (!assignment) return state;
    if (assignment.status !== 'DRAFT' && assignment.status !== 'REJECTED') return state;

    // Guard: Only PM or Admin can submit
    if (assignment.pmId !== currentUser.id && currentUser.role !== 'SYSTEM_ADMIN') return state;

    useAuditStore.getState().addLog({
      action: 'PROCESS_TEMPLATE_SUBMIT',
      entityType: 'PROCESS',
      message: `공정 템플릿 상신 (Assignment ID: ${id})`,
      actorId: currentUser.id,
      entityId: id
    });
    
    useNotificationStore.getState().addNotification({
      type: 'APPROVAL_REQUEST',
      title: '공정 일정 결재 요청',
      message: `새로운 공정 일정이 상신되었습니다.`,
      userId: reviewerId,
      priority: 'NORMAL'
    });

    return {
      assignments: state.assignments.map(a => 
        a.id === id ? { ...a, status: 'PENDING_APPROVAL', managerId: reviewerId, updatedAt: new Date().toISOString() } : a
      )
    };
  }),

  rejectAssignment: (id, reason) => set((state) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return state;

    const assignment = state.assignments.find(a => a.id === id);
    if (!assignment) return state;
    if (assignment.status !== 'PENDING_APPROVAL') return state;

    // Guard: Only Manager or Admin can reject
    if (assignment.managerId !== currentUser.id && currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DEPARTMENT_MANAGER') return state;

    useAuditStore.getState().addLog({
      action: 'PROCESS_TEMPLATE_REJECT',
      entityType: 'PROCESS',
      message: `공정 템플릿 반려. 사유: ${reason}`,
      actorId: currentUser.id,
      entityId: id
    });

    useNotificationStore.getState().addNotification({
      type: 'APPROVAL_REJECTED',
      title: '공정 일정 반려',
      message: `공정 일정이 반려되었습니다. 사유: ${reason}`,
      userId: assignment.pmId,
      priority: 'HIGH',
      relatedTaskId: assignment.taskId
    });

    return {
      assignments: state.assignments.map(a => 
        a.id === id ? { 
          ...a, 
          status: 'REJECTED', 
          rejectionReason: reason, 
          reviewedBy: currentUser.id,
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString() 
        } : a
      )
    };
  }),

  approveAssignment: (id) => set((state) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return state;

    const assignment = state.assignments.find(a => a.id === id);
    if (!assignment) return state;
    if (assignment.status !== 'PENDING_APPROVAL') return state;

    // Guard: Only Manager or Admin can approve
    if (assignment.managerId !== currentUser.id && currentUser.role !== 'SYSTEM_ADMIN' && currentUser.role !== 'DEPARTMENT_MANAGER') return state;

    useAuditStore.getState().addLog({
      action: 'PROCESS_TEMPLATE_APPROVE',
      entityType: 'PROCESS',
      message: `공정 템플릿 승인 (Assignment ID: ${id})`,
      actorId: currentUser.id,
      entityId: id
    });

    useNotificationStore.getState().addNotification({
      type: 'APPROVAL_APPROVED',
      title: '공정 일정 승인',
      message: `공정 일정이 최종 승인되었습니다.`,
      userId: assignment.pmId,
      priority: 'NORMAL',
      relatedTaskId: assignment.taskId
    });

    return {
      assignments: state.assignments.map(a => 
        a.id === id ? { 
          ...a, 
          status: 'APPROVED', 
          reviewedBy: currentUser.id,
          reviewedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString() 
        } : a
      ),
      schedules: state.schedules.map(s => 
        s.assignmentId === id ? { ...s, isOfficial: true } : s
      )
    };
  }),

  resubmitAssignment: (id) => set((state) => {
    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) return state;

    const assignment = state.assignments.find(a => a.id === id);
    if (!assignment) return state;
    if (assignment.status !== 'REJECTED') return state;

    // Guard: Only PM or Admin can resubmit
    if (assignment.pmId !== currentUser.id && currentUser.role !== 'SYSTEM_ADMIN') return state;

    const revisionNo = (assignment.revisionNo || 1) + 1;
    const currentSchedules = state.schedules.filter(s => s.assignmentId === id);
    const historySnapshot = [...(assignment.historySnapshot || []), {
      revisionNo: assignment.revisionNo || 1,
      rejectionReason: assignment.rejectionReason,
      reviewedBy: assignment.reviewedBy,
      reviewedAt: assignment.reviewedAt,
      schedules: currentSchedules,
      snapshottedAt: new Date().toISOString()
    }];

    useAuditStore.getState().addLog({
      action: 'PROCESS_TEMPLATE_RESUBMIT',
      entityType: 'PROCESS',
      message: `공정 템플릿 재상신 준비 (Revision: ${revisionNo})`,
      actorId: currentUser.id,
      entityId: id
    });

    return {
      assignments: state.assignments.map(a => 
        a.id === id ? { 
          ...a, 
          status: 'DRAFT', 
          revisionNo, 
          historySnapshot,
          rejectionReason: undefined,
          updatedAt: new Date().toISOString() 
        } : a
      )
    };
  }),

  addSchedule: (scheduleData) => {
    const newId = `ps_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    set((state) => ({
      schedules: [...state.schedules, {
        ...scheduleData,
        id: newId
      }]
    }));
    return newId;
  },

  updateSchedule: (id, updates) => set((state) => {
    // Cannot update schedule if the assignment is already pending or approved
    const schedule = state.schedules.find(s => s.id === id);
    if (schedule) {
       const assignment = state.assignments.find(a => a.id === schedule.assignmentId);
       if (assignment && (assignment.status === 'PENDING_APPROVAL' || assignment.status === 'APPROVED')) {
          // Cannot mutate protected schedules
          return state;
       }
       
       const currentUser = useAuthStore.getState().currentUser;
       if (currentUser && currentUser.role !== 'SYSTEM_ADMIN' && assignment?.pmId !== currentUser.id) {
          // Guard: Only PM or Admin can edit schedules
          return state;
       }
    }
    return {
      schedules: state.schedules.map(s => 
        s.id === id ? { ...s, ...updates } : s
      )
    };
  }),

  batchUpdateSchedules: (updates) => set((state) => {
    const updatesMap = new Map(updates.map(u => [u.id, u.updates]));
    return {
      schedules: state.schedules.map(s => {
        const u = updatesMap.get(s.id);
        if (u) {
          const assignment = state.assignments.find(a => a.id === s.assignmentId);
          if (assignment && (assignment.status === 'PENDING_APPROVAL' || assignment.status === 'APPROVED')) {
            return s; // Guard against modifying protected schedules
          }
          
          const currentUser = useAuthStore.getState().currentUser;
          if (currentUser && currentUser.role !== 'SYSTEM_ADMIN' && assignment?.pmId !== currentUser.id) {
             // Guard: Only PM or Admin can edit schedules
             return s;
          }
          return { ...s, ...u };
        }
        return s;
      })
    };
  }),

  replaceAssignments: (assignments) => set({ assignments }),
  replaceSchedules: (schedules) => set({ schedules }),
  
  reset: () => set({
    templates: [],
    stages: [],
    tasks: [],
    assignments: [],
    schedules: []
  })
}), { name: 'process-template-storage' }));
