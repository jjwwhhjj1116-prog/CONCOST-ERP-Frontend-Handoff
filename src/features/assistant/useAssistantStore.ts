'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { isDemoLocalMode } from '@/lib/runtimeExecutionMode';
import type { AssistantActionCandidate, AssistantCompanyId, AssistantMessage, AssistantSettings, AssistantThread } from './assistantModel';
import { assistantId } from './assistantModel';

interface AssistantState {
  drawerOpen: boolean;
  activeThreadId: string | null;
  activeThreadIdsByScope: Record<string, string | null>;
  mascotState: 'IDLE' | 'GREETING' | 'LISTENING' | 'THINKING' | 'ANSWER_READY' | 'BLOCKED' | 'ERROR';
  threads: AssistantThread[];
  messages: AssistantMessage[];
  settings: AssistantSettings;
  feedback: Record<string, 'HELPFUL' | 'NOT_HELPFUL'>;
  openDrawer: () => void;
  closeDrawer: () => void;
  setMascotState: (state: AssistantState['mascotState']) => void;
  createThread: (companyId: AssistantCompanyId, ownerPersonnelId: string, route?: string) => string;
  selectThread: (threadId: string | null) => void;
  addMessage: (message: AssistantMessage) => void;
  setThreadTitle: (threadId: string, title: string) => void;
  archiveThread: (threadId: string) => boolean;
  deleteThread: (threadId: string) => boolean;
  updateAction: (messageId: string, actionId: string, status: AssistantActionCandidate['status']) => void;
  setFeedback: (messageId: string, value: 'HELPFUL' | 'NOT_HELPFUL') => void;
  updateSettings: (settings: Partial<AssistantSettings>) => void;
}

const DEFAULT_SETTINGS: AssistantSettings = {
  visible: true,
  proactiveHints: true,
  answerLanguage: 'AUTO',
  answerLength: 'STANDARD',
  mascotMotion: true,
};

export const assistantThreadScopeKey = (companyId: AssistantCompanyId, ownerPersonnelId: string) => `${companyId}:${ownerPersonnelId}`;

const volatileValues = new Map<string, string>();
const volatileStorage: StateStorage = {
  getItem: (name) => volatileValues.get(name) ?? null,
  setItem: (name, value) => { volatileValues.set(name, value); },
  removeItem: (name) => { volatileValues.delete(name); },
};

export const useAssistantStore = create<AssistantState>()(persist((set) => ({
  drawerOpen: false,
  activeThreadId: null,
  activeThreadIdsByScope: {},
  mascotState: 'IDLE',
  threads: [],
  messages: [],
  settings: DEFAULT_SETTINGS,
  feedback: {},
  openDrawer: () => set({ drawerOpen: true, mascotState: 'LISTENING' }),
  closeDrawer: () => set({ drawerOpen: false, mascotState: 'IDLE' }),
  setMascotState: (mascotState) => set({ mascotState }),
  createThread: (companyId, ownerPersonnelId, route) => {
    const id = assistantId('thread');
    const now = new Date().toISOString();
    set((state) => ({
      activeThreadId: id,
      activeThreadIdsByScope: { ...state.activeThreadIdsByScope, [assistantThreadScopeKey(companyId, ownerPersonnelId)]: id },
      threads: [{ id, companyId, ownerPersonnelId, title: '새 대화', status: 'ACTIVE', createdAt: now, updatedAt: now, lastRoute: route || null }, ...state.threads],
    }));
    return id;
  },
  selectThread: (activeThreadId) => set((state) => {
    const thread = state.threads.find((item) => item.id === activeThreadId);
    if (!thread) return { activeThreadId };
    return { activeThreadId, activeThreadIdsByScope: { ...state.activeThreadIdsByScope, [assistantThreadScopeKey(thread.companyId, thread.ownerPersonnelId)]: activeThreadId } };
  }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
    threads: state.threads.map((thread) => thread.id === message.threadId ? { ...thread, updatedAt: message.createdAt } : thread),
  })),
  setThreadTitle: (threadId, title) => set((state) => ({ threads: state.threads.map((thread) => thread.id === threadId ? { ...thread, title: title.slice(0, 54) } : thread) })),
  archiveThread: (threadId) => {
    if (!isDemoLocalMode()) return false;
    set((state) => { const thread = state.threads.find((item) => item.id === threadId); const key = thread ? assistantThreadScopeKey(thread.companyId, thread.ownerPersonnelId) : null; return { threads: state.threads.map((item) => item.id === threadId ? { ...item, status: 'ARCHIVED' } : item), activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId, activeThreadIdsByScope: key ? { ...state.activeThreadIdsByScope, [key]: null } : state.activeThreadIdsByScope }; });
    return true;
  },
  deleteThread: (threadId) => {
    if (!isDemoLocalMode()) return false;
    set((state) => { const thread = state.threads.find((item) => item.id === threadId); const key = thread ? assistantThreadScopeKey(thread.companyId, thread.ownerPersonnelId) : null; return { threads: state.threads.map((item) => item.id === threadId ? { ...item, status: 'DELETED' } : item), activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId, activeThreadIdsByScope: key ? { ...state.activeThreadIdsByScope, [key]: null } : state.activeThreadIdsByScope }; });
    return true;
  },
  updateAction: (messageId, actionId, status) => set((state) => ({ messages: state.messages.map((message) => message.id !== messageId ? message : { ...message, actionCandidates: message.actionCandidates.map((action) => action.id === actionId ? { ...action, status } : action) }) })),
  setFeedback: (messageId, value) => set((state) => ({ feedback: { ...state.feedback, [messageId]: value } })),
  updateSettings: (settings) => set((state) => ({ settings: { ...state.settings, ...settings } })),
}), {
  name: 'assistant-conversation-v1',
  storage: createJSONStorage(() => isDemoLocalMode() ? localStorage : volatileStorage),
  partialize: (state) => ({ threads: state.threads, messages: state.messages, settings: state.settings, feedback: state.feedback, activeThreadId: state.activeThreadId, activeThreadIdsByScope: state.activeThreadIdsByScope }),
}));
