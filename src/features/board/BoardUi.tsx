'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, ServerOff, ShieldCheck } from 'lucide-react';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import { boardActorFromPersonnel, type BoardLocale, type BoardMutationResult, type BoardPostStatus } from './boardOperationalModel';
import { getBoardCopy } from './boardCopy';

export function useBoardContext() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const companyId = useUiStore((state) => state.brandWorkspace);
  const language = useTranslationStore((state) => state.settings.uiLanguage) as BoardLocale;
  return {
    currentUser,
    companyId,
    language,
    copy: getBoardCopy(language),
    actor: currentUser ? boardActorFromPersonnel(currentUser, companyId) : null,
    runtimeMode: getRuntimeExecutionMode(),
  };
}

export function BoardRuntimeBanner({ compact = false }: { compact?: boolean }) {
  const { runtimeMode, copy } = useBoardContext();
  const demo = runtimeMode === 'DEMO_LOCAL';
  return <div role="status" className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${demo ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900'} ${compact ? 'w-fit' : 'w-full'}`}><ServerOff className="h-4 w-4 shrink-0" /><span>{demo ? copy.demoNotice : `${runtimeMode} · ${copy.backendRequired}`}</span></div>;
}

export function BoardFeedback({ result, onDismiss }: { result: BoardMutationResult<unknown> | null; onDismiss?: () => void }) {
  const { copy, language } = useBoardContext();
  if (!result) return null;
  const translated = language === 'ko'
    ? result.message
    : result.code === 'BACKEND_REQUIRED'
      ? copy.backendRequired
      : result.code === 'REVISION_CONFLICT'
        ? copy.revisionConflict
        : result.code === 'FORBIDDEN'
          ? copy.forbidden
          : result.code === 'NOT_FOUND'
            ? copy.missing
            : result.code === 'VALIDATION_ERROR'
              ? copy.validationTitle
              : result.ok
                ? copy.save
                : copy.notConfigured;
  return <div role={result.ok ? 'status' : 'alert'} className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-bold ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}><span>{translated}</span>{onDismiss && <button type="button" onClick={onDismiss} className="min-h-8 shrink-0 rounded-lg px-2 text-xs hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">{copy.cancel}</button>}</div>;
}

export function BoardAccessState({ title, description, href = '/board' }: { title: string; description: string; href?: string }) {
  const { copy } = useBoardContext();
  return <main className="mx-auto grid min-h-[420px] w-full max-w-3xl place-items-center px-4"><section className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--cc-shadow-1)]"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><AlertTriangle className="h-7 w-7" /></span><h1 className="mt-5 text-2xl font-black text-[var(--color-text-main)]">{title}</h1><p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-[var(--color-text-sub)]">{description}</p><Link href={href} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 text-sm font-black hover:bg-[var(--cc-surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><ArrowLeft className="h-4 w-4" />{copy.backHome}</Link></section></main>;
}

export function BoardStatusBadge({ status }: { status: BoardPostStatus }) {
  const classes: Record<BoardPostStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SCHEDULED: 'bg-violet-100 text-violet-800',
    PUBLISHED: 'bg-emerald-100 text-emerald-800',
    ARCHIVED: 'bg-amber-100 text-amber-800',
    DELETED: 'bg-red-100 text-red-800',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ${classes[status]}`}>{status}</span>;
}

export function BoardMetricCard({ label, value, active, onClick, tone = 'orange' }: { label: string; value: number; active?: boolean; onClick: () => void; tone?: 'orange' | 'indigo' | 'emerald' | 'amber' }) {
  const tones = { orange: 'text-orange-700 bg-orange-50', indigo: 'text-indigo-800 bg-indigo-50', emerald: 'text-emerald-800 bg-emerald-50', amber: 'text-amber-800 bg-amber-50' };
  return <button type="button" onClick={onClick} aria-pressed={active} className={`group min-h-28 rounded-2xl border bg-[var(--color-surface)] p-4 text-left shadow-[var(--cc-shadow-1)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${active ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/15' : 'border-[var(--color-border)]'}`}><span className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-black ${tones[tone]}`}>{label}</span><strong className="mt-3 block text-3xl font-black text-[var(--color-text-main)]">{value}</strong></button>;
}

export function BoardSectionHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="flex flex-col gap-4 border-l-4 border-[var(--color-primary)] pl-4 md:flex-row md:items-end md:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[var(--color-primary-strong)]">{eyebrow}</p><h1 className="mt-1 text-2xl font-black text-[var(--color-text-main)] md:text-[30px]">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--color-text-sub)]">{description}</p>}</div>{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}</header>;
}

export function BoardEmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return <section className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center"><div><h2 className="text-lg font-black text-[var(--color-text-main)]">{title}</h2><p className="mt-2 text-sm font-semibold text-[var(--color-text-sub)]">{description}</p>{action && <div className="mt-5 flex justify-center">{action}</div>}</div></section>;
}

export function BoardPermissionHint({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold leading-5 text-sky-900"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />{children}</div>;
}

export const boardDate = (value?: string | null, locale: BoardLocale = 'ko') => value ? new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : locale === 'en' ? 'en-US' : 'ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '-';
export const boardFileSize = (value: number) => value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
