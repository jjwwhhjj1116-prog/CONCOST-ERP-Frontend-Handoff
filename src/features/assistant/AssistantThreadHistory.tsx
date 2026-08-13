'use client';

import { Archive, History } from 'lucide-react';
import type { AssistantLocale, AssistantThread } from './assistantModel';

const groupKey = (updatedAt: string): 'TODAY' | 'WEEK' | 'EARLIER' => {
  const days = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 86_400_000);
  return days <= 0 ? 'TODAY' : days <= 7 ? 'WEEK' : 'EARLIER';
};

const labels = {
  ko: { TODAY: '오늘', WEEK: '최근 7일', EARLIER: '이전' },
  vi: { TODAY: 'Hôm nay', WEEK: '7 ngày gần đây', EARLIER: 'Trước đó' },
  en: { TODAY: 'Today', WEEK: 'Last 7 days', EARLIER: 'Earlier' },
} as const;

export function AssistantThreadHistory({ threads, activeThreadId, locale, emptyText, onSelect }: { threads: AssistantThread[]; activeThreadId: string | null; locale: AssistantLocale; emptyText: string; onSelect: (id: string) => void }) {
  if (!threads.length) return <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-xs font-semibold text-slate-500">{emptyText}</p>;
  return <div className="space-y-4">{(['TODAY', 'WEEK', 'EARLIER'] as const).map((key) => {
    const members = threads.filter((thread) => groupKey(thread.updatedAt) === key);
    if (!members.length) return null;
    return <section key={key}><h3 className="mb-2 px-1 text-[10px] font-black uppercase tracking-[.14em] text-slate-500">{labels[locale][key]}</h3><div className="space-y-2">{members.map((thread) => <button key={thread.id} type="button" onClick={() => onSelect(thread.id)} className={`group flex w-full items-center gap-2 rounded-xl border p-3 text-left transition hover:border-sky-300 hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-500 ${thread.id === activeThreadId ? 'border-sky-400 bg-sky-50' : 'border-slate-200 bg-white'}`}><History className="h-4 w-4 shrink-0 text-sky-700" /><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-950">{thread.title}</strong><time className="mt-1 block text-[10px] text-slate-500">{new Date(thread.updatedAt).toLocaleString(locale === 'vi' ? 'vi-VN' : locale === 'en' ? 'en-US' : 'ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></span>{thread.status === 'ARCHIVED' ? <Archive className="h-3.5 w-3.5 text-slate-400" /> : <span className="h-2 w-2 rounded-full bg-emerald-500" />}</button>)}</div></section>;
  })}</div>;
}
