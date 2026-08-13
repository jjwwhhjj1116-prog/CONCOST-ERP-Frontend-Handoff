'use client';

import { ThumbsDown, ThumbsUp } from 'lucide-react';
import type { AssistantLocale, AssistantMessage } from './assistantModel';
import { assistantCopy } from './assistantCopy';
import { AssistantActionCard } from './AssistantActionCard';
import { AssistantCitationList } from './AssistantCitationList';
import { AssistantMascot } from './AssistantMascot';

interface AssistantMessageListProps {
  messages: AssistantMessage[];
  locale: AssistantLocale;
  brand: 'CON_COST' | 'VIET_QS';
  feedback: Record<string, 'HELPFUL' | 'NOT_HELPFUL'>;
  onFeedback: (messageId: string, value: 'HELPFUL' | 'NOT_HELPFUL') => void;
  onAction: (messageId: string, actionId: string, status: 'CONFIRMED' | 'CANCELLED' | 'BLOCKED') => void;
}

export function AssistantMessageList({ messages, locale, brand, feedback, onFeedback, onAction }: AssistantMessageListProps) {
  const copy = assistantCopy(locale);
  if (!messages.length) return null;
  return (
    <div className="space-y-5" aria-live="polite" aria-label="Assistant conversation">
      {messages.map((message) => {
        const user = message.role === 'USER';
        return (
          <article key={message.id} className={`flex items-start gap-2.5 ${user ? 'justify-end' : 'justify-start'}`}>
            {!user && <AssistantMascot brand={brand} state={message.status === 'BLOCKED' ? 'BLOCKED' : message.status === 'ERROR' ? 'ERROR' : 'ANSWER_READY'} size="sm" motion={false} />}
            <div className={`min-w-0 max-w-[88%] ${user ? 'order-first' : ''}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${user ? 'rounded-br-md bg-[#172554] text-white' : message.status === 'BLOCKED' ? 'rounded-bl-md border border-amber-200 bg-amber-50 text-amber-950' : message.status === 'ERROR' ? 'rounded-bl-md border border-red-200 bg-red-50 text-red-950' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'}`}>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
                {!user && <AssistantCitationList citations={message.citations} locale={locale} />}
                {!user && message.actionCandidates.map((action) => <AssistantActionCard key={action.id} action={action} locale={locale} onStatus={(status) => onAction(message.id, action.id, status)} />)}
              </div>
              {!user && <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-500">
                <span>{message.modelLabel || copy.model}</span><span aria-hidden="true">·</span><time>{new Date(message.createdAt).toLocaleTimeString(locale === 'vi' ? 'vi-VN' : locale === 'en' ? 'en-US' : 'ko-KR', { hour: '2-digit', minute: '2-digit' })}</time>
                {message.correlationId && <span title={message.correlationId}>ID {message.correlationId.slice(-8)}</span>}
                <span className="ml-auto inline-flex gap-1">
                  <button type="button" aria-label={copy.helpful} aria-pressed={feedback[message.id] === 'HELPFUL'} onClick={() => onFeedback(message.id, 'HELPFUL')} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-emerald-50 ${feedback[message.id] === 'HELPFUL' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white'}`}><ThumbsUp className="h-3.5 w-3.5" /></button>
                  <button type="button" aria-label={copy.notHelpful} aria-pressed={feedback[message.id] === 'NOT_HELPFUL'} onClick={() => onFeedback(message.id, 'NOT_HELPFUL')} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition hover:bg-red-50 ${feedback[message.id] === 'NOT_HELPFUL' ? 'border-red-400 bg-red-50 text-red-700' : 'border-slate-200 bg-white'}`}><ThumbsDown className="h-3.5 w-3.5" /></button>
                </span>
              </div>}
            </div>
          </article>
        );
      })}
    </div>
  );
}
