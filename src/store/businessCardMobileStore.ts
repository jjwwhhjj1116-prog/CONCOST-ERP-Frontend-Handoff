import { create } from 'zustand';

import {
  createBusinessCardInboxItem,
  createOneTimeUploadSession,
  type BusinessCardInboxItem,
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
}));
