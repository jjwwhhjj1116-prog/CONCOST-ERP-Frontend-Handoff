import { create } from 'zustand';
import { BulkEditSession } from '@/types/models';

interface BulkEditState {
  sessions: BulkEditSession[];
  createSession: (session: Omit<BulkEditSession, 'id' | 'createdAt' | 'status'>) => void;
  updateSessionStatus: (sessionId: string, status: BulkEditSession['status'], appliedAt?: string) => void;
}

const mockSessions: BulkEditSession[] = [
  {
    id: 'bulk-001',
    targetEntityType: 'Project',
    totalItems: 45,
    changedItems: 12,
    status: 'APPLIED',
    createdBy: 'system',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    appliedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export const useBulkEditStore = create<BulkEditState>((set) => ({
  sessions: mockSessions,
  createSession: (data) => set((state) => ({
    sessions: [
      {
        ...data,
        id: `bulk-${Date.now()}`,
        status: 'PREVIEW',
        createdAt: new Date().toISOString()
      },
      ...state.sessions
    ]
  })),
  updateSessionStatus: (sessionId, status, appliedAt) => set((state) => ({
    sessions: state.sessions.map(s => 
      s.id === sessionId ? { ...s, status, appliedAt } : s
    )
  })),
}));
