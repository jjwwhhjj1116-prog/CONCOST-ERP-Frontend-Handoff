'use client';

import type { ElementType, ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';

export type ConfigurableCardState =
  | 'DEFAULT'
  | 'SELECTED'
  | 'DISABLED'
  | 'WARNING'
  | 'ERROR';

type ConfigurableCardProps = {
  title: string;
  description: string;
  icon: ElementType;
  status?: ReactNode;
  meta?: ReactNode;
  state?: ConfigurableCardState;
  readOnly?: boolean;
  onOpen?: () => void;
};

const stateClass: Record<ConfigurableCardState, string> = {
  DEFAULT: 'border-[var(--color-border)]',
  SELECTED:
    'border-[#4e6fd8] bg-[#f5f7ff] shadow-[0_10px_28px_rgba(78,111,216,.16)] dark:bg-[#18243c]',
  DISABLED:
    'cursor-not-allowed border-[var(--color-border)] bg-[var(--cc-surface-2)] opacity-55',
  WARNING: 'border-amber-300 bg-amber-50/70 dark:bg-amber-950/15',
  ERROR: 'border-red-300 bg-red-50/70 dark:bg-red-950/15',
};

export function ConfigurableCard({
  title,
  description,
  icon: Icon,
  status,
  meta,
  state = 'DEFAULT',
  readOnly = false,
  onOpen,
}: ConfigurableCardProps) {
  const disabled = state === 'DISABLED';
  const interactive = Boolean(onOpen) && !disabled;
  const cardClass = `group flex min-h-40 w-full flex-col border bg-[var(--color-surface)] p-5 text-left transition ${
    stateClass[state]
  } ${
    interactive
      ? 'cursor-pointer hover:-translate-y-1 hover:border-[#91a5e5] hover:shadow-[var(--cc-shadow-3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4e6fd8]/25'
      : ''
  }`;
  const content = (
    <>
      <span className="flex w-full items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center bg-[#eef2ff] text-[#3f5db8] dark:bg-[#223254] dark:text-[#aebeff]">
          <Icon className="h-5 w-5" strokeWidth={1.85} />
        </span>
        <span className="flex items-center gap-2">
          {status}
          {interactive && (
            <ChevronRight
              className="h-4 w-4 text-[var(--color-text-sub)] transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          )}
        </span>
      </span>
      <strong className="mt-5 text-[15px] font-black text-[var(--color-text-main)]">
        {title}
      </strong>
      <span className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
        {description}
      </span>
      {meta && (
        <span className="mt-auto border-t border-[var(--color-border)] pt-3 text-[10px] font-bold text-[var(--color-text-sub)]">
          {meta}
        </span>
      )}
    </>
  );

  if (!onOpen) {
    return (
      <article className={cardClass} data-interactive="false">
        {content}
      </article>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onOpen}
      aria-label={`${title} ${readOnly ? '상세 보기' : '상세 및 설정 열기'}`}
      className={cardClass}
      data-interactive={interactive ? 'true' : 'false'}
    >
      {content}
    </button>
  );
}
