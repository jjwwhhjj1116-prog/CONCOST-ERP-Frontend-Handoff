'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, ClipboardPenLine, X } from 'lucide-react';
import type { AssistantActionCandidate, AssistantLocale } from './assistantModel';
import { assistantCopy } from './assistantCopy';

interface AssistantActionCardProps {
  action: AssistantActionCandidate;
  locale: AssistantLocale;
  onStatus: (status: Exclude<AssistantActionCandidate['status'], 'PROPOSED'>) => void;
}

export function AssistantActionCard({ action, locale, onStatus }: AssistantActionCardProps) {
  const router = useRouter();
  const copy = assistantCopy(locale);
  const [reviewing, setReviewing] = React.useState(false);
  const href = typeof action.payload.href === 'string' ? action.payload.href : null;
  const safeDetails = Object.entries(action.payload).filter(([key, value]) => key !== 'href' && value !== '' && value !== null);
  if (action.status === 'CANCELLED') return null;

  const execute = () => {
    if (!href) {
      onStatus('BLOCKED');
      return;
    }
    onStatus('CONFIRMED');
    router.push(href);
  };

  return (
    <article className="mt-3 rounded-xl border border-teal-200 bg-teal-50/80 p-3" data-action-status={action.status}>
      <div className="flex items-start gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800"><ClipboardPenLine className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.12em] text-teal-700">Action candidate</p><p className="mt-1 text-xs font-black text-slate-950">{action.label}</p></div>
      </div>
      {reviewing && <div className="mt-3 rounded-lg border border-teal-200 bg-white p-3 text-[11px] text-slate-600"><p className="font-bold text-slate-900">{locale === 'vi' ? 'Xác nhận trước khi mở bản nháp.' : locale === 'en' ? 'Confirm before opening the draft.' : '기존 업무화면에서 저장하기 전에 내용을 다시 확인합니다.'}</p>{safeDetails.map(([key, value]) => <p key={key} className="mt-1"><strong>{key}</strong>: {String(value)}</p>)}</div>}
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => onStatus('CANCELLED')} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-black text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500"><X className="h-4 w-4" />{copy.cancel}</button>
        {!reviewing ? <button type="button" onClick={() => setReviewing(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-teal-700 px-3 text-xs font-black text-white hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500"><Check className="h-4 w-4" />{copy.confirm}</button> : <button type="button" onClick={execute} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500">{copy.execute}<ArrowRight className="h-4 w-4" /></button>}
      </div>
    </article>
  );
}
