import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PersonnelCard, DataSourceMode } from '@/types/models';
import { mockUsers } from '@/data/mockData';
import { verifyStaticCredential } from '@/lib/staticAuth';
import { isDemoLocalMode } from '@/lib/runtimeExecutionMode';
import { setApiCompanyId } from '@/lib/apiClient';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';

interface AuthState {
  currentUser: PersonnelCard | null;
  users: PersonnelCard[];
  hasHydrated: boolean;
  isSessionReady: boolean;
  isSessionChecking: boolean;
  appMode: 'DAILY_WORK' | 'ADMIN_VALIDATION';
  setAppMode: (mode: 'DAILY_WORK' | 'ADMIN_VALIDATION') => void;
  dataSourceMode: DataSourceMode;
  setDataSourceMode: (mode: DataSourceMode) => void;
  lastActivity: number;
  updateLastActivity: () => void;
  loginAs: (userId: string) => void;
  loginWithCredentials: (identifier: string, password: string) => Promise<boolean>;
  loginError: string | null;
  isAuthenticating: boolean;
  rememberLogin: boolean;
  setRememberLogin: (rememberLogin: boolean) => void;
  clearLoginError: () => void;
  logout: () => void;
  addUser: (user: Omit<PersonnelCard, 'id'>) => void;
  updateUser: (userId: string, updates: Partial<PersonnelCard>) => void;
  deactivateUser: (userId: string) => void;
  replaceUsers: (users: PersonnelCard[]) => void;
  resetUsers: () => void;
  
  // Backend Integration (Phase 473+)
  initializeSession: () => Promise<void>;
  setHasHydrated: (hasHydrated: boolean) => void;
  serverUser: unknown | null;
}

const SESSION_USER_ID_KEY = 'auth-session-user-id';
export const AUTH_STORAGE_KEY = 'auth-storage';
export const AUTH_SESSION_TIMEOUT_MS = 8_000;

export const clearInvalidAuthPersistence = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in hardened or private browser contexts.
  }
  try {
    window.sessionStorage.removeItem(SESSION_USER_ID_KEY);
  } catch {
    // Session recovery must still settle when storage access is denied.
  }
};

export const runWithAuthSessionTimeout = async <T>(
  request: (signal: AbortSignal) => Promise<T>,
  timeoutMs = AUTH_SESSION_TIMEOUT_MS,
) => {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort('AUTH_SESSION_TIMEOUT'), timeoutMs);
  try {
    return await request(controller.signal);
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

const setSessionUserId = (userId: string) => {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(SESSION_USER_ID_KEY, userId);
};

const clearSessionUserId = () => {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(SESSION_USER_ID_KEY);
};

const getSessionUserId = () => {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(SESSION_USER_ID_KEY);
};

const synchronizeUserCompanyScope = (user: PersonnelCard | null) => {
  const companyId = user?.companyId === 'CON_COST' || user?.companyId === 'VIET_QS'
    ? user.companyId
    : null;
  setApiCompanyId(companyId);
  if (!companyId) return;

  useUiStore.getState().setBrandWorkspace(companyId);
  useTranslationStore.getState().updateSettings({
    uiLanguage: companyId === 'VIET_QS' ? 'vi' : 'ko',
  });
};

const resolvePersonnel = (candidate: unknown, users: PersonnelCard[]) => {
  if (!candidate || typeof candidate !== 'object') return null;
  const sessionUser = candidate as Partial<PersonnelCard>;
  if (!sessionUser.id) return null;

  const existing = users.find((user) => user.id === sessionUser.id)
    ?? mockUsers.find((user) => user.id === sessionUser.id);
  if (existing) return { ...existing, ...sessionUser } as PersonnelCard;

  if (!sessionUser.name || !sessionUser.role || !sessionUser.departmentId) return null;
  return {
    ...sessionUser,
    id: sessionUser.id,
    name: sessionUser.name,
    role: sessionUser.role,
    departmentId: sessionUser.departmentId,
    employmentStatus: sessionUser.employmentStatus || 'ACTIVE',
  } as PersonnelCard;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      users: mockUsers,
      hasHydrated: false,
      isSessionReady: false,
      isSessionChecking: false,
      appMode: 'DAILY_WORK',
      dataSourceMode: 'JSON_OPERATION_DATA',
      serverUser: null,
      loginError: null,
      isAuthenticating: false,
      rememberLogin: false,
      lastActivity: Date.now(),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setRememberLogin: (rememberLogin) => set({ rememberLogin }),
  setAppMode: (mode) => set((state) => {
    // If switching to DAILY_WORK, ensure DEMO_SEED_DATA is deactivated
    if (mode === 'DAILY_WORK' && state.dataSourceMode === 'DEMO_SEED_DATA') {
      return { appMode: mode, dataSourceMode: 'JSON_OPERATION_DATA' };
    }
    return { appMode: mode };
  }),
  setDataSourceMode: (mode) => set((state) => {
    if (state.appMode === 'DAILY_WORK' && mode === 'DEMO_SEED_DATA') {
      console.warn("DEMO_SEED_DATA cannot be used in DAILY_WORK mode.");
      return state;
    }
    return { dataSourceMode: mode };
  }),
  updateLastActivity: () => set({ lastActivity: Date.now() }),
  loginAs: (userId: string) => {
    if (!isDemoLocalMode()) return;
    const user = useAuthStore.getState().users.find(u => u.id === userId);
    if (user) {
      synchronizeUserCompanyScope(user);
      setSessionUserId(user.id);
      // If switching to a user who is not admin, force DAILY_WORK mode
      if (!['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(user.role)) {
        set({ currentUser: user, appMode: 'DAILY_WORK', lastActivity: Date.now() });
      } else {
        set({ currentUser: user, lastActivity: Date.now() });
      }
    }
  },
  loginWithCredentials: async (identifier, password) => {
    const normalized = identifier.trim().toLowerCase();
    set({ isAuthenticating: true, loginError: null });

    if (!normalized || password.length < 8) {
      set({
        isAuthenticating: false,
        loginError: '사번 또는 업무 이메일과 8자 이상의 비밀번호를 입력해 주세요.',
      });
      return false;
    }

    // Static demo credentials must keep working even when an older persisted
    // personnel snapshot does not yet contain the newly added account.
    const staticUserId = await verifyStaticCredential(normalized, password);
    if (staticUserId) {
      const users = useAuthStore.getState().users;
      const staticUser = users.find((candidate) => candidate.id === staticUserId)
        ?? mockUsers.find((candidate) => candidate.id === staticUserId);
      if (staticUser && staticUser.employmentStatus !== 'INACTIVE') {
        synchronizeUserCompanyScope(staticUser);
        setSessionUserId(staticUser.id);
        set((state) => ({
          currentUser: staticUser,
          users: state.users.some((candidate) => candidate.id === staticUser.id)
            ? state.users
            : [...state.users, staticUser],
          appMode: ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(staticUser.role) ? 'ADMIN_VALIDATION' : state.appMode,
          dataSourceMode: ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(staticUser.role) ? 'DEMO_SEED_DATA' : state.dataSourceMode,
          isAuthenticating: false,
          lastActivity: Date.now(),
        }));
        return true;
      }
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (apiBase) {
      try {
        const response = await runWithAuthSessionTimeout((signal) =>
          fetch(`${apiBase.replace(/\/$/, '')}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: identifier, identifier, password }),
            signal,
          }));
        if (!response.ok) throw new Error('AUTH_FAILED');
        const payload = await response.json() as { user?: unknown };
        const user = resolvePersonnel(payload.user, useAuthStore.getState().users);
        if (!user) throw new Error('INVALID_AUTH_RESPONSE');
        synchronizeUserCompanyScope(user);
        setSessionUserId(user.id);
        set({ currentUser: user, serverUser: payload.user, isAuthenticating: false, lastActivity: Date.now() });
        return true;
      } catch {
        set({ isAuthenticating: false, loginError: '계정 정보가 올바르지 않거나 인증 서버에 연결할 수 없습니다.' });
        return false;
      }
    }

    set({ isAuthenticating: false, loginError: '계정 정보가 올바르지 않습니다.' });
    return false;
  },
  clearLoginError: () => set({ loginError: null }),
  logout: () => {
    clearSessionUserId();
    synchronizeUserCompanyScope(null);
    set({
      currentUser: null,
      serverUser: null,
      appMode: 'DAILY_WORK',
      lastActivity: Date.now(),
    });
    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      void import('@/lib/apiClient')
        .then(({ apiClient }) => apiClient('/auth/logout', { method: 'POST' }))
        .catch(() => undefined);
    }
  },
  addUser: (user) => set((state) => ({
    users: [...state.users, { ...user, id: `user-${Date.now()}` }]
  })),
  updateUser: (userId, updates) => set((state) => ({
    users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u),
    currentUser: state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser
  })),
  deactivateUser: (userId) => set((state) => ({
    users: state.users.map(u => u.id === userId ? { ...u, status: 'INACTIVE' } : u)
  })),
  replaceUsers: (users) => set({ users }),
  resetUsers: () => set({ users: mockUsers }),
  initializeSession: async () => {
    const state = useAuthStore.getState();
    if (state.isSessionReady || state.isSessionChecking) return;
    set({ isSessionChecking: true });

    if (process.env.NEXT_PUBLIC_API_BASE_URL) {
      try {
        const { apiClient } = await import('@/lib/apiClient');
        const data = await runWithAuthSessionTimeout(
          (signal) => apiClient('/auth/session', { signal }),
        ) as { user?: unknown };
        const user = resolvePersonnel(data.user, useAuthStore.getState().users);
        if (!user) throw new Error('INVALID_SESSION_RESPONSE');
        synchronizeUserCompanyScope(user);
        setSessionUserId(user.id);
        set({
          currentUser: user,
          serverUser: data.user,
          isSessionChecking: false,
          isSessionReady: true,
        });
        return;
      } catch {
        clearSessionUserId();
        synchronizeUserCompanyScope(null);
        set({
          currentUser: null,
          serverUser: null,
          isSessionChecking: false,
          isSessionReady: true,
        });
        return;
      }
    }

    const sessionUserId = getSessionUserId();
    const sessionUser = sessionUserId
      ? resolvePersonnel({ id: sessionUserId }, state.users)
      : null;
    synchronizeUserCompanyScope(state.currentUser ?? sessionUser);
    set({
      currentUser: state.currentUser ?? sessionUser,
      isSessionChecking: false,
      isSessionReady: true,
    });
  },
    }),
    {
      name: 'auth-storage',
      version: 2,
      migrate: (persistedState) => {
        const persisted = (persistedState || {}) as Partial<AuthState>;
        const persistedUserId = persisted.currentUser?.id;
        return {
          currentUser: persistedUserId
            ? mockUsers.find((user) => user.id === persistedUserId) || null
            : null,
          rememberLogin: persisted.rememberLogin ?? false,
          users: mockUsers,
          appMode: persisted.appMode ?? 'DAILY_WORK',
          dataSourceMode: persisted.dataSourceMode ?? 'JSON_OPERATION_DATA',
        };
      },
      partialize: (state) => ({
        currentUser: state.rememberLogin ? state.currentUser : null,
        rememberLogin: state.rememberLogin,
        users: state.users,
        appMode: state.appMode,
        dataSourceMode: state.dataSourceMode
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error || !state) {
          clearInvalidAuthPersistence();
          queueMicrotask(() => {
            useAuthStore.setState({
              currentUser: null,
              serverUser: null,
              hasHydrated: true,
              isSessionReady: false,
              isSessionChecking: false,
            });
          });
          return;
        }
        state.setHasHydrated(true);
      },
    }
  )
);
