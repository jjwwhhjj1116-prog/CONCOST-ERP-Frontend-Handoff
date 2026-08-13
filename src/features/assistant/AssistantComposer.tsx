'use client';

import React from 'react';
import { ArrowUp, Link2, ShieldAlert } from 'lucide-react';
import type { AssistantLocale, AssistantPageContext } from './assistantModel';
import { assistantCopy } from './assistantCopy';

interface AssistantComposerProps {
  locale: AssistantLocale;
  context: AssistantPageContext | null;
  contextEnabled: boolean;
  busy: boolean;
  onContextChange: (enabled: boolean) => void;
  onSubmit: (question: string) => void;
}

export function AssistantComposer({ locale, context, contextEnabled, busy, onContextChange, onSubmit }: AssistantComposerProps) {
  const [value, setValue] = React.useState('');
  const copy = assistantCopy(locale);
  const submit = () => {
    const question = value.trim();
    if (!question || busy) return;
    setValue('');
    onSubmit(question);
  };

  return (
    <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
      {context && <button type="button" aria-pressed={contextEnabled} onClick={() => onContextChange(!contextEnabled)} className={`mb-2 inline-flex min-h-9 max-w-full items-center gap-2 rounded-full border px-3 text-[11px] font-black transition focus-visible:ring-2 ${contextEnabled ? 'border-blue-300 bg-blue-50 text-blue-900 focus-visible:ring-blue-500' : 'border-slate-300 bg-slate-50 text-slate-600 focus-visible:ring-slate-500'}`}>
        {context.sensitivity === 'NORMAL' ? <Link2 className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
        <span className="truncate">{contextEnabled ? copy.contextOn : copy.contextOff}: {context.label || context.route}</span>
      </button>}
      <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-[0_8px_22px_rgba(15,23,42,.08)] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20">
        <textarea value={value} onChange={(event) => setValue(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} rows={1} placeholder={copy.placeholder} aria-label={copy.placeholder} className="max-h-32 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-3 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400" />
        <button type="button" onClick={submit} disabled={!value.trim() || busy} title={copy.send} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-md transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="h-5 w-5" /></button>
      </div>
      <p className="mt-2 text-[10px] font-semibold text-slate-500">{locale === 'vi' ? 'AI chỉ đề xuất. Mọi thay đổi cần xác nhận của người dùng.' : locale === 'en' ? 'AI proposes only. Every change requires user confirmation.' : 'AI는 후보만 제안하며 업무 변경은 사용자의 확인이 필요합니다.'}</p>
    </div>
  );
}
