'use client';

import Link from 'next/link';
import { BookOpenText, History, MessageCirclePlus, Mic2, Settings2, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import type { AssistantLocale } from './assistantModel';
import { assistantCopy } from './assistantCopy';
import { AssistantConversation } from './AssistantConversation';
import { AssistantMascot } from './AssistantMascot';
import { useAssistantStore } from './useAssistantStore';

export function AssistantWorkspace() {
  const searchParams = useSearchParams();
  const brand = useUiStore((state) => state.brandWorkspace);
  const uiLanguage = useTranslationStore((state) => state.settings.uiLanguage);
  const settings = useAssistantStore((state) => state.settings);
  const updateSettings = useAssistantStore((state) => state.updateSettings);
  const locale: AssistantLocale = settings.answerLanguage === 'AUTO' ? uiLanguage : settings.answerLanguage;
  const copy = assistantCopy(locale);
  const viewParam = searchParams.get('view');
  const view = viewParam === 'HISTORY' ? 'HISTORY' : viewParam === 'HELP' ? 'HELP' : 'CHAT';
  const tabs = [
    { label: copy.newThread, href: '/ai-assistant', icon: MessageCirclePlus, active: view === 'CHAT' },
    { label: copy.history, href: '/ai-assistant?view=HISTORY', icon: History, active: view === 'HISTORY' },
    { label: copy.meeting, href: '/ai-assistant/tools/meeting-notes', icon: Mic2, active: false },
    { label: copy.help, href: '/ai-assistant?view=HELP', icon: BookOpenText, active: view === 'HELP' },
  ];
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-96px)] w-full max-w-[1720px] flex-col gap-4 px-3 py-4 sm:px-5 lg:px-7" data-ai-assistant-workspace>
      <header className={`overflow-hidden rounded-2xl border p-5 shadow-[0_16px_38px_rgba(15,23,42,.08)] sm:p-6 ${brand === 'VIET_QS' ? 'border-blue-200 bg-[#f3f9ff]' : 'border-orange-200 bg-[#fff8f2]'}`}>
        <div className="flex flex-wrap items-start gap-4"><AssistantMascot brand={brand} state="GREETING" size="md" motion={settings.mascotMotion} /><div className="min-w-0 flex-1"><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[var(--color-primary)]"><Sparkles className="h-4 w-4" />AI WORK ASSISTANT</p><h1 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">{copy.title}</h1><p className="mt-2 text-sm font-semibold text-slate-600">{copy.subtitle}</p></div><div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1" aria-label="Answer language">{(['ko', 'vi', 'en'] as AssistantLocale[]).map((item) => <button key={item} type="button" onClick={() => updateSettings({ answerLanguage: item })} aria-pressed={locale === item} className={`min-h-9 min-w-10 rounded-md px-2 text-[10px] font-black uppercase ${locale === item ? 'bg-[#172554] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{item}</button>)}</div></div>
        <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="AI assistant views">{tabs.map(({ label, href, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3 text-xs font-black transition focus-visible:ring-2 ${active ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{label}</Link>)}</nav>
      </header>
      <AssistantConversation variant="FULL" view={view} />
      <details className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600"><summary className="flex cursor-pointer items-center gap-2 font-black text-slate-900"><Settings2 className="h-4 w-4" />{copy.settings}</summary><div className="mt-3 flex flex-wrap gap-4"><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={settings.visible} onChange={(event) => updateSettings({ visible: event.target.checked })} />{locale === 'vi' ? 'Hiển thị mascot toàn cục' : locale === 'en' ? 'Show global mascot' : '전역 Mascot 표시'}</label><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={settings.proactiveHints} onChange={(event) => updateSettings({ proactiveHints: event.target.checked })} />{locale === 'vi' ? 'Gợi ý trợ giúp' : locale === 'en' ? 'Proactive hints' : 'AI 도움말 제안'}</label><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={settings.mascotMotion} onChange={(event) => updateSettings({ mascotMotion: event.target.checked })} />{locale === 'vi' ? 'Chuyển động mascot' : locale === 'en' ? 'Mascot motion' : 'Mascot 모션'}</label></div></details>
    </section>
  );
}
