'use client';

import React from 'react';
import Link from 'next/link';
import { Expand, Plus, X } from 'lucide-react';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import { assistantCopy } from './assistantCopy';
import { AssistantConversation } from './AssistantConversation';
import { AssistantMascot } from './AssistantMascot';
import { assistantThreadScopeKey, useAssistantStore } from './useAssistantStore';

export function AssistantDrawer() {
  const panelRef = React.useRef<HTMLElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const openerRef = React.useRef<HTMLElement | null>(null);
  const open = useAssistantStore((state) => state.drawerOpen);
  const closeDrawer = useAssistantStore((state) => state.closeDrawer);
  const createThread = useAssistantStore((state) => state.createThread);
  const activeThreadId = useAssistantStore((state) => state.activeThreadId);
  const activeThreadIdsByScope = useAssistantStore((state) => state.activeThreadIdsByScope);
  const threads = useAssistantStore((state) => state.threads);
  const currentUser = useAuthStore((state) => state.currentUser);
  const brand = useUiStore((state) => state.brandWorkspace);
  const language = useTranslationStore((state) => state.settings.uiLanguage);
  const settings = useAssistantStore((state) => state.settings);
  const locale = settings.answerLanguage === 'AUTO' ? language : settings.answerLanguage;
  const copy = assistantCopy(locale);

  React.useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openerRef.current?.focus();
    };
  }, [closeDrawer, open]);

  if (!open || !currentUser) return null;
  const fallbackThreadId = threads.some((thread) => thread.id === activeThreadId && thread.companyId === brand && thread.ownerPersonnelId === currentUser.id && thread.status !== 'DELETED') ? activeThreadId : null;
  const scopedThreadId = activeThreadIdsByScope[assistantThreadScopeKey(brand, currentUser.id)] || fallbackThreadId;
  const fullHref = `/ai-assistant${scopedThreadId ? `?threadId=${encodeURIComponent(scopedThreadId)}` : ''}`;

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/35 backdrop-blur-[1px] xl:bg-transparent xl:backdrop-blur-none" onMouseDown={(event) => event.target === event.currentTarget && closeDrawer()}>
      <aside ref={panelRef} role="dialog" aria-modal="true" aria-label={copy.title} className="absolute inset-y-0 right-0 flex w-full flex-col overflow-hidden bg-white shadow-[-18px_0_48px_rgba(15,23,42,.25)] sm:max-w-[460px] xl:border-l xl:border-slate-200">
        <header className={`flex min-h-[76px] items-center gap-3 border-b px-4 ${brand === 'VIET_QS' ? 'border-blue-200 bg-[#f3f9ff]' : 'border-orange-200 bg-[#fff8f2]'}`}>
          <AssistantMascot brand={brand} state="LISTENING" size="sm" motion={settings.mascotMotion} />
          <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-black text-slate-950">{copy.title}</h2><p className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-slate-500"><span>{brand === 'VIET_QS' ? 'VIET QS' : 'CON-COST'}</span><span>·</span><span>{getRuntimeExecutionMode()}</span></p></div>
          <button type="button" onClick={() => createThread(brand, currentUser.id, window.location.pathname)} title={copy.newThread} className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 focus-visible:ring-2 focus-visible:ring-sky-500"><Plus className="h-4 w-4" /></button>
          <Link href={fullHref} onClick={closeDrawer} title={copy.full} className="flex h-10 w-10 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 focus-visible:ring-2 focus-visible:ring-indigo-500"><Expand className="h-4 w-4" /></Link>
          <button ref={closeButtonRef} type="button" onClick={closeDrawer} title={copy.close} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"><X className="h-4 w-4" /></button>
        </header>
        <AssistantConversation variant="DRAWER" />
      </aside>
    </div>
  );
}
