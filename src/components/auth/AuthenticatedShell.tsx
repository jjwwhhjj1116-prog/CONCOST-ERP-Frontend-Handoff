'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Landmark, LockKeyhole } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { LoginExperience } from './LoginExperience';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SessionManager } from './SessionManager';
import { DataLoader } from '@/components/layout/DataLoader';
import { evaluateFinanceAccess } from '@/lib/accessControl';

export function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isSessionReady = useAuthStore((state) => state.isSessionReady);
  const initializeSession = useAuthStore((state) => state.initializeSession);

  React.useEffect(() => {
    if (hasHydrated && !isSessionReady) void initializeSession();
  }, [hasHydrated, initializeSession, isSessionReady]);

  if (!hasHydrated || !isSessionReady) {
    return <main className="min-h-screen bg-[#e9edf2]" aria-busy="true" aria-label="Checking authentication status." />;
  }

  if (!currentUser) return <LoginExperience />;
  const financeAccess = evaluateFinanceAccess(currentUser);
  const financeDenied = pathname.startsWith('/finance') && !financeAccess.allowed;

  return (
    <>
      <SessionManager />
      <DataLoader />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col pt-[64px]">
          <Header />
          <main className="cc-scrollbar flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-bg)]">
            <div className="page-shell">
              {financeDenied ? (
                <section className="grid min-h-[65vh] place-items-center" data-finance-access="denied">
                  <div className="w-full max-w-2xl border border-red-200 bg-[var(--color-surface)] p-7 text-center shadow-[var(--cc-shadow-2)]">
                    <span className="mx-auto flex h-14 w-14 items-center justify-center bg-red-50 text-red-700">
                      <LockKeyhole className="h-7 w-7" />
                    </span>
                    <p className="mt-5 text-[10px] font-black tracking-[.18em] text-red-700">
                      FINANCE ACCESS REQUIRED
                    </p>
                    <h1 className="mt-2 text-2xl font-black text-[var(--color-text-main)]">
                      재무 화면 접근이 제한되었습니다.
                    </h1>
                    <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[var(--color-text-sub)]">
                      ADMIN, GRADE 1 또는 경영지원본부 Active Membership 자격과 Backend
                      FINANCE_ACCESS Capability가 모두 필요합니다.
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-4 py-3 text-xs font-black text-[var(--color-text-sub)]">
                      <Landmark className="h-4 w-4" />
                      판정: {financeAccess.reason}
                    </div>
                  </div>
                </section>
              ) : (
                children
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
