'use client';

import type { ReactNode } from 'react';
import React from 'react';
import { Eye, Pencil, X } from 'lucide-react';

type DetailDrawerProps = {
  open: boolean;
  title: string;
  description?: string;
  canEdit: boolean;
  dirty?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function DetailDrawer({
  open,
  title,
  description,
  canEdit,
  dirty = false,
  children,
  footer,
  onClose,
}: DetailDrawerProps) {
  const [confirmDiscard, setConfirmDiscard] = React.useState(false);

  const requestClose = React.useCallback(() => {
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  }, [dirty, onClose]);

  React.useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, requestClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160]">
      <button
        type="button"
        aria-label="상세 패널 닫기"
        onClick={requestClose}
        className="absolute inset-0 bg-[#0b1220]/45 backdrop-blur-[2px]"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-drawer-title"
        className="absolute inset-0 flex flex-col bg-[var(--color-surface)] shadow-[-24px_0_70px_rgba(9,20,48,.28)] sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(560px,92vw)]"
      >
        <header className="flex items-start gap-4 border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
          <span
            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center ${
              canEdit
                ? 'bg-[#fff0e4] text-[#d65300]'
                : 'bg-[#eef2ff] text-[#405bb0]'
            }`}
          >
            {canEdit ? <Pencil className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </span>
          <span className="min-w-0 flex-1">
            <h2 id="detail-drawer-title" className="text-lg font-black text-[var(--color-text-main)]">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
                {description}
              </p>
            )}
          </span>
          <button
            type="button"
            onClick={requestClose}
            aria-label="닫기"
            className="grid h-10 w-10 shrink-0 place-items-center border border-[var(--color-border)] text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="cc-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>

        {confirmDiscard && (
          <div role="alert" className="border-t border-amber-200 bg-amber-50 p-4 text-amber-950">
            <strong className="text-sm font-black">저장하지 않은 변경이 있습니다.</strong>
            <p className="mt-1 text-xs font-semibold">편집 내용을 버리고 패널을 닫을까요?</p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="min-h-10 border border-amber-300 px-3 text-xs font-black"
              >
                계속 편집
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDiscard(false);
                  onClose();
                }}
                className="min-h-10 bg-amber-700 px-3 text-xs font-black text-white"
              >
                변경 버리기
              </button>
            </div>
          </div>
        )}

        {footer && !confirmDiscard && (
          <footer className="border-t border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4 sm:px-6">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
