'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import { assistantCopy, assistantProactiveHint } from './assistantCopy';
import { AssistantDrawer } from './AssistantDrawer';
import { AssistantMascot } from './AssistantMascot';
import { useAssistantStore } from './useAssistantStore';

const isEditable = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])'));

export function GlobalAiAssistant() {
  const pathname = usePathname();
  const currentUser = useAuthStore((state) => state.currentUser);
  const brand = useUiStore((state) => state.brandWorkspace);
  const language = useTranslationStore((state) => state.settings.uiLanguage);
  const openDrawer = useAssistantStore((state) => state.openDrawer);
  const open = useAssistantStore((state) => state.drawerOpen);
  const mascotState = useAssistantStore((state) => state.mascotState);
  const settings = useAssistantStore((state) => state.settings);
  const [bubble, setBubble] = React.useState(false);
  const locale = settings.answerLanguage === 'AUTO' ? language : settings.answerLanguage;
  const copy = assistantCopy(locale);

  React.useEffect(() => {
    if (!currentUser || !settings.visible || !settings.proactiveHints || pathname.startsWith('/ai-assistant')) return;
    const routeKey = pathname.startsWith('/projects/intake') ? 'project-intake' : pathname.startsWith('/projects') ? 'projects' : pathname.startsWith('/finance') ? 'finance' : pathname.startsWith('/board') ? 'board' : 'general';
    const key = `assistant-hint-${brand}-${currentUser.id}-${routeKey}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, 'shown');
      const timer = window.setTimeout(() => setBubble(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, [brand, currentUser, pathname, settings.proactiveHints, settings.visible]);
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '/' && !isEditable(event.target)) {
        event.preventDefault();
        openDrawer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openDrawer]);

  if (!currentUser || !settings.visible || pathname.startsWith('/ai-assistant')) return null;
  return (
    <>
      {!open && <div className="fixed bottom-[92px] right-4 z-[var(--z-modal)] flex flex-col items-end gap-2 xl:bottom-7 xl:right-6" data-global-ai-assistant="launcher">
        {bubble && <div className={`relative max-w-[280px] rounded-2xl border bg-white px-4 py-3 pr-9 text-xs font-black text-slate-800 shadow-[0_14px_34px_rgba(15,23,42,.18)] ${brand === 'VIET_QS' ? 'border-blue-200' : 'border-orange-200'}`} role="status"><button type="button" onClick={() => setBubble(false)} aria-label={copy.close} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"><X className="h-3.5 w-3.5" /></button>{assistantProactiveHint(locale, pathname)}</div>}
        <button type="button" onClick={() => { setBubble(false); openDrawer(); }} aria-label={copy.assistantOpen} title={`${copy.assistantOpen} (Ctrl/Cmd + /)`} className={`group relative flex h-16 w-16 items-center justify-center rounded-full border-2 bg-white shadow-[0_16px_34px_rgba(15,23,42,.24)] transition hover:-translate-y-1 hover:shadow-[0_20px_38px_rgba(15,23,42,.28)] focus-visible:outline-none focus-visible:ring-4 ${brand === 'VIET_QS' ? 'border-blue-400 focus-visible:ring-blue-200' : 'border-orange-400 focus-visible:ring-orange-200'}`}><AssistantMascot brand={brand} state={mascotState} size="md" motion={settings.mascotMotion} /><span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-950 px-3 py-2 text-[11px] font-black text-white shadow-lg group-hover:block group-focus-visible:block">{copy.assistantOpen}</span></button>
      </div>}
      <AssistantDrawer />
    </>
  );
}
