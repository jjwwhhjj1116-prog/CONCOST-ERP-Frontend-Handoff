import { create } from 'zustand';
import { QcIssue, ProjectEvaluationContext, EvaluationAppeal } from '@/lib/evaluation/types';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

interface EvaluationState {
  qcIssues: QcIssue[];
  projectContexts: ProjectEvaluationContext[];
  appeals: EvaluationAppeal[];
  
  addQcIssue: (issue: Omit<QcIssue, 'id' | 'createdAt' | 'updatedAt' | 'weightedErrorCount' | 'status'>) => void;
  updateQcIssueWeight: (issueId: string, weightPercent: number) => void;
  updateQcIssueStatus: (issueId: string, status: QcIssue['status']) => void;
  
  saveProjectContext: (context: Omit<ProjectEvaluationContext, 'id' | 'createdAt' | 'updatedAt'>) => void;
  
  addAppeal: (appeal: Omit<EvaluationAppeal, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
  updateAppealStatus: (appealId: string, status: EvaluationAppeal['status'], reviewedBy: string, comment: string) => void;
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  qcIssues: [],
  projectContexts: [],
  appeals: [],
  
  addQcIssue: (issueData) => set((state) => {
    // Validate weight percent
    const weightPercent = Math.max(10, Math.min(100, issueData.weightPercent));
    const weightedErrorCount = weightPercent / 100;
    
    const newIssue: QcIssue = {
      ...issueData,
      id: `qc${Date.now()}`,
      weightPercent,
      weightedErrorCount,
      status: 'REVIEWED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return { qcIssues: [...state.qcIssues, newIssue] };
  }),
  
  updateQcIssueWeight: (issueId, weightPercent) => set((state) => {
    const validWeight = Math.max(10, Math.min(100, weightPercent));
    
    return {
      qcIssues: state.qcIssues.map(issue => 
        issue.id === issueId 
          ? { 
              ...issue, 
              weightPercent: validWeight, 
              weightedErrorCount: validWeight / 100,
              updatedAt: new Date().toISOString() 
            } 
          : issue
      )
    };
  }),

  updateQcIssueStatus: (issueId, status) => set((state) => ({
    qcIssues: state.qcIssues.map(issue => 
      issue.id === issueId 
        ? { ...issue, status, updatedAt: new Date().toISOString() } 
        : issue
    )
  })),
  
  saveProjectContext: (contextData) => set((state) => {
    const existingIndex = state.projectContexts.findIndex(c => c.projectId === contextData.projectId && c.evaluationPeriodId === contextData.evaluationPeriodId);
    
    if (existingIndex >= 0) {
      const updatedContexts = [...state.projectContexts];
      updatedContexts[existingIndex] = {
        ...updatedContexts[existingIndex],
        ...contextData,
        updatedAt: new Date().toISOString()
      };
      return { projectContexts: updatedContexts };
    }
    
    const newContext: ProjectEvaluationContext = {
      ...contextData,
      id: `ctx${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return { projectContexts: [...state.projectContexts, newContext] };
  }),
  
  addAppeal: (appealData) => set((state) => {
    const { users } = useAuthStore.getState();
    const admins = users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'DEPARTMENT_MANAGER');
    
    admins.forEach(admin => {
      useNotificationStore.getState().addNotification({
        userId: admin.id,
        type: 'SYSTEM',
        title: '신규 성과평가 이의신청',
        message: `사용자 ${appealData.requestedBy}가 이의신청을 제기했습니다.`,
        priority: 'NORMAL'
      });
    });

    return {
      appeals: [...state.appeals, {
        ...appealData,
        id: `apl_${Date.now()}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }]
    };
  }),
  
  updateAppealStatus: (appealId, status, reviewedBy, comment) => set((state) => {
    const appeal = state.appeals.find(a => a.id === appealId);
    
    if (appeal && (status === 'ACCEPTED' || status === 'REJECTED')) {
      useNotificationStore.getState().addNotification({
        userId: appeal.requestedBy,
        type: 'SYSTEM',
        title: `이의신청 ${status === 'ACCEPTED' ? '수용' : '기각'} 알림`,
        message: `제출하신 성과평가 이의신청이 ${status === 'ACCEPTED' ? '수용' : '기각'} 처리되었습니다.\n검토자 의견: ${comment || '없음'}`,
        priority: status === 'REJECTED' ? 'HIGH' : 'NORMAL'
      });
    }

    return {
      appeals: state.appeals.map(a => 
        a.id === appealId ? {
          ...a,
          status,
          reviewedBy,
          reviewComment: comment,
          updatedAt: new Date().toISOString()
        } : a
      )
    };
  })
}));
