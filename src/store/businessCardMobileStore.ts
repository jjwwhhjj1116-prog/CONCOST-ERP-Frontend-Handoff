import { create } from 'zustand';

import {
  canTransitionBusinessCardInbox,
  createBusinessCardInboxItem,
  createOneTimeUploadSession,
  type BusinessCardInboxItem,
  type BusinessCardInboxState,
  type MobileUploadSession,
} from '@/lib/mobileBusinessCard';
import type { CompanyId } from '@/types/models';

type BusinessCardMobileState = {
  sessions: MobileUploadSession[];
  inbox: BusinessCardInboxItem[];
  createSession: (companyId: CompanyId) => MobileUploadSession;
  receiveFile: (
    session: MobileUploadSession,
    file: Pick<File, 'name' | 'size'>,
  ) => BusinessCardInboxItem;
  transitionInbox: (id: string, nextState: BusinessCardInboxState) => void;
};

export const useBusinessCardMobileStore = create<BusinessCardMobileState>((set) => ({
  sessions: [],
  inbox: [],
  createSession: (companyId) => {
    const session = createOneTimeUploadSession(companyId);
    set((state) => ({ sessions: [session, ...state.sessions] }));
    return session;
  },
  receiveFile: (session, file) => {
    const item = createBusinessCardInboxItem(session, file);
    set((state) => ({
      sessions: state.sessions.map((candidate) =>
        candidate.id === session.id ? { ...candidate, state: 'UPLOADED' } : candidate,
      ),
      inbox: [item, ...state.inbox],
    }));
    return item;
  },
  transitionInbox: (id, nextState) => set((state) => ({
    inbox: state.inbox.map((item) => {
      if (item.id !== id) return item;
      if (!canTransitionBusinessCardInbox(item.state, nextState)) return item;
      return { ...item, state: nextState };
    }),
  })),
}));
