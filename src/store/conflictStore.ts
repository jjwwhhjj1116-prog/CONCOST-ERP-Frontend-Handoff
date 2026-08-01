import { create } from 'zustand';
import { ScheduleConflict, ConflictResolutionStatus } from '@/types/models';
import { useNotificationStore } from '@/store/notificationStore';

interface ConflictState {
  conflicts: ScheduleConflict[];
  addConflicts: (newConflicts: ScheduleConflict[]) => void;
  resolveConflict: (id: string, status: ConflictResolutionStatus, resolvedBy: string, comment?: string) => void;
}

export const useConflictStore = create<ConflictState>((set) => ({
  conflicts: [],
  addConflicts: (newConflicts) => set((state) => {
    const existingIds = state.conflicts.map(c => c.id);
    const uniqueNew = newConflicts.filter(c => !existingIds.includes(c.id));
    
    uniqueNew.forEach(c => {
      useNotificationStore.getState().addNotification({
        userId: c.userId,
        type: 'SYSTEM',
        title: '일정 충돌 감지',
        message: c.description,
        priority: 'CRITICAL'
      });
    });

    return { conflicts: [...state.conflicts, ...uniqueNew] };
  }),
  resolveConflict: (id, status, resolvedBy, comment) => set((state) => ({
    conflicts: state.conflicts.map(c => 
      c.id === id 
        ? { ...c, status, resolvedBy, resolutionComment: comment, updatedAt: new Date().toISOString() } 
        : c
    )
  }))
}));
