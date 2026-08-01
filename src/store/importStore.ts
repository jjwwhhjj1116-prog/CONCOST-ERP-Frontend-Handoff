import { create } from 'zustand';
import { ImportPreviewSession, ImportValidationIssue } from '@/types/models';

interface ImportState {
  sessions: ImportPreviewSession[];
  issues: ImportValidationIssue[];
  pendingData: unknown | null;
  addSession: (session: ImportPreviewSession) => void;
  updateSessionStatus: (sessionId: string, status: ImportPreviewSession['status']) => void;
  resolveIssue: (issueId: string, resolvedBy: string) => void;
  ignoreIssue: (issueId: string, resolvedBy: string) => void;
  setPendingData: (data: unknown) => void;
}

// Dummy data for Phase 81 preview
const mockSessions: ImportPreviewSession[] = [
  {
    id: 'import-001',
    fileName: '2026_Schedule_Jan-Jul.xlsx',
    targetSheet: '2026_Schedule',
    targetMonths: [1, 2, 3, 4, 5, 6, 7],
    status: 'VALIDATED',
    totalRows: 1250,
    totalAssignments: 1100,
    totalProjects: 45,
    totalPersonnel: 30,
    totalWarnings: 3,
    totalErrors: 1,
    createdBy: 'user-admin-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const mockIssues: ImportValidationIssue[] = [
  {
    id: 'issue-001',
    importSessionId: 'import-001',
    severity: 'BLOCKER',
    issueType: 'MISSING_PERSONNEL',
    title: '직원명 매칭 실패',
    description: 'Excel의 "NGUYEN VAN A" 직원이 시스템에 존재하지 않습니다.',
    sourceSheet: '2026_Schedule',
    sourceMonth: 1,
    sourceRow: 45,
    sourceColumn: 2,
    suggestedFix: '새 직원을 등록하거나, 매핑 테이블에 "NGUYEN VAN A"를 맵핑하세요.',
    status: 'OPEN'
  },
  {
    id: 'issue-002',
    importSessionId: 'import-001',
    severity: 'WARNING',
    issueType: 'UNNORMALIZED_SCOPE',
    title: 'Scope 정규화 필요',
    description: '"Drafting (T1)"은 알려진 Scope 패턴이 아닙니다. 자동으로 "Drafting"으로 매핑할 예정입니다.',
    sourceRow: 112,
    status: 'OPEN'
  },
  {
    id: 'issue-003',
    importSessionId: 'import-001',
    severity: 'WARNING',
    issueType: 'OFF_DAY_CONFLICT',
    title: 'Off/Day와 업무 일정 충돌',
    description: '휴가로 지정된 날짜에 업무 할당이 감지되었습니다. 업무 할당을 무시하고 휴가로 처리합니다.',
    sourceRow: 230,
    status: 'RESOLVED',
    resolvedBy: 'user-admin-1',
    resolvedAt: new Date().toISOString(),
  }
];

export const useImportStore = create<ImportState>((set) => ({
  sessions: mockSessions,
  issues: mockIssues,
  pendingData: null,
  
  addSession: (session) => set((state) => ({
    sessions: [session, ...state.sessions]
  })),
  
  updateSessionStatus: (sessionId, status) => set((state) => ({
    sessions: state.sessions.map(s => 
      s.id === sessionId ? { ...s, status, updatedAt: new Date().toISOString() } : s
    )
  })),

  resolveIssue: (issueId, resolvedBy) => set((state) => ({
    issues: state.issues.map(i => 
      i.id === issueId ? { ...i, status: 'RESOLVED', resolvedBy, resolvedAt: new Date().toISOString() } : i
    )
  })),
  
  ignoreIssue: (issueId, resolvedBy) => set((state) => ({
    issues: state.issues.map(i => 
      i.id === issueId ? { ...i, status: 'IGNORED', resolvedBy, resolvedAt: new Date().toISOString() } : i
    )
  })),
  setPendingData: (data) => set({ pendingData: data }),
}));
