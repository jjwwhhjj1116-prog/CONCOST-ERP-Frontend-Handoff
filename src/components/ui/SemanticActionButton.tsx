'use client';

import React, { forwardRef } from 'react';
import { LoaderCircle, MoreHorizontal } from 'lucide-react';

export type SemanticActionVariant =
  | 'primary'
  | 'edit'
  | 'save'
  | 'duplicate'
  | 'danger'
  | 'archive'
  | 'success'
  | 'reject'
  | 'warning'
  | 'document'
  | 'view'
  | 'add-resource'
  | 'neutral';

export const semanticActionClasses: Record<SemanticActionVariant, string> = {
  primary: 'border-[var(--cc-orange-600)] bg-[var(--cc-orange-600)] text-white hover:border-[var(--cc-orange-700)] hover:bg-[var(--cc-orange-700)]',
  edit: 'border-[var(--cc-info-700)] bg-[var(--cc-info-700)] text-white hover:border-blue-800 hover:bg-blue-800',
  save: 'border-[var(--cc-teal-700)] bg-[var(--cc-teal-700)] text-white hover:border-teal-800 hover:bg-teal-800',
  duplicate: 'border-[var(--cc-violet-600)] bg-[var(--cc-violet-50)] text-[var(--cc-violet-700)] hover:bg-[var(--cc-violet-100)]',
  danger: 'border-[var(--cc-danger-600,var(--cc-danger-500))] bg-[var(--cc-danger-700)] text-white hover:bg-red-800',
  archive: 'border-[var(--cc-rose-600)] bg-[var(--cc-rose-50)] text-[var(--cc-rose-700)] hover:bg-[var(--cc-rose-100)]',
  success: 'border-[var(--cc-success-700)] bg-[var(--cc-success-700)] text-white hover:bg-green-800',
  reject: 'border-[var(--cc-danger-700)] bg-[var(--cc-danger-50)] text-[var(--cc-danger-700)] hover:bg-red-100',
  warning: 'border-[var(--cc-warning-500)] bg-[var(--cc-warning-50)] text-[var(--cc-warning-700)] hover:bg-amber-100',
  document: 'border-[var(--cc-teal-600)] bg-[var(--cc-teal-50)] text-[var(--cc-teal-700)] hover:bg-[var(--cc-teal-100)]',
  view: 'border-[var(--cc-indigo-800)] bg-[var(--cc-cobalt-100)] text-[var(--cc-indigo-800)] hover:bg-indigo-100',
  'add-resource': 'border-[var(--cc-sky-600)] bg-[var(--cc-sky-50)] text-[var(--cc-sky-700)] hover:bg-[var(--cc-sky-100)]',
  neutral: 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-main)] hover:bg-[var(--cc-surface-3)]',
};

const sizeClasses = {
  icon: 'size-11 p-0',
  sm: 'min-h-10 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-5 text-sm',
} as const;

export interface SemanticActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant: SemanticActionVariant;
  icon?: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  disabledReason?: string;
  tooltip?: string;
  size?: keyof typeof sizeClasses;
}

export const SemanticActionButton = forwardRef<HTMLButtonElement, SemanticActionButtonProps>(function SemanticActionButton({
  variant,
  icon,
  loading = false,
  loadingLabel = '처리 중',
  disabledReason,
  tooltip,
  size = 'md',
  className = '',
  disabled,
  children,
  type = 'button',
  ...props
}, ref) {
  const isDisabled = disabled || loading;
  const title = isDisabled && disabledReason ? disabledReason : tooltip;
  const button = (
    <button
      ref={ref}
      type={type}
      data-action-variant={variant}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      title={title}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border font-black shadow-sm transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:-translate-y-px hover:shadow-md active:translate-y-0 active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none ${sizeClasses[size]} ${semanticActionClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : icon}
      {size !== 'icon' && <span>{loading ? loadingLabel : children}</span>}
      {loading && <span className="sr-only" aria-live="polite">{loadingLabel}</span>}
    </button>
  );

  return isDisabled && disabledReason ? <span className="inline-flex" title={disabledReason}>{button}</span> : button;
});

export function ActionButtonGroup({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <div role="group" aria-label={label} className={`flex flex-wrap items-center gap-2 ${className}`}>{children}</div>;
}

export function DangerActionSection({ children, label = '위험 작업', className = '' }: { children: React.ReactNode; label?: string; className?: string }) {
  return <section aria-label={label} className={`border-t border-red-200 pt-3 ${className}`}>{children}</section>;
}

export function PrimaryActionBar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 ${className}`}>{children}</div>;
}

export function StickyEditActionBar({ children, label = '수정 작업', className = '' }: { children: React.ReactNode; label?: string; className?: string }) {
  return <div role="region" aria-label={label} className={`sticky bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 border border-teal-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,118,110,.12)] backdrop-blur dark:bg-[var(--color-surface)] ${className}`}>{children}</div>;
}

export function RowActionMenu({ label = '더보기', children, className = '' }: { label?: string; children: React.ReactNode; className?: string }) {
  return <details className={`group relative ${className}`}><summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-black hover:bg-[var(--cc-surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><MoreHorizontal className="h-4 w-4" />{label}</summary><div className="absolute right-0 top-full z-40 mt-1 min-w-48 space-y-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-xl">{children}</div></details>;
}
