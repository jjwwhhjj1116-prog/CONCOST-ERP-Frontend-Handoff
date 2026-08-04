'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ResponsiveDialogShellProps {
  title: string;
  eyebrow?: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}

export function ResponsiveDialogShell({
  title,
  eyebrow = 'Electronic approval',
  description,
  onClose,
  children,
  footer,
  widthClassName = 'sm:max-w-6xl',
}: ResponsiveDialogShellProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="responsive-dialog-title"
        className={`flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-[var(--color-surface)] shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:border sm:border-[var(--color-border)] ${widthClassName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase text-[var(--color-primary)]">{eyebrow}</p>
            <h2 id="responsive-dialog-title" className="mt-1 truncate text-lg font-black sm:text-xl">{title}</h2>
            {description && <p className="mt-1 text-[11px] font-semibold text-[var(--color-text-sub)]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] hover:bg-[var(--cc-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="cc-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
        {footer && <footer className="shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:px-6">{footer}</footer>}
      </section>
    </div>
  );
}
