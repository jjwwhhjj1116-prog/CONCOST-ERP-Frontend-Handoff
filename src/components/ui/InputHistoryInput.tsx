'use client';

import React from 'react';
import { Clock3 } from 'lucide-react';
import {
  inputSuggestionApi,
  isSuggestionFieldAllowed,
  type InputSuggestion,
} from '@/lib/inputSuggestionApi';
import { useUiStore } from '@/store/uiStore';

type InputHistoryInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  moduleKey: string;
  fieldKey: string;
  value: string;
  onChange: (value: string) => void;
};

export function InputHistoryInput({
  moduleKey,
  fieldKey,
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  className,
  ...inputProps
}: InputHistoryInputProps) {
  const listId = React.useId();
  const [open, setOpen] = React.useState(false);
  const [result, setResult] = React.useState<{
    companyId: 'CON_COST' | 'VIET_QS';
    items: InputSuggestion[];
  }>({ companyId: 'CON_COST', items: [] });
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const lastRecorded = React.useRef('');
  const allowed = isSuggestionFieldAllowed(fieldKey);
  const selectedCompanyId = useUiStore((state) => state.brandWorkspace);
  const items = result.companyId === selectedCompanyId ? result.items : [];

  React.useEffect(() => {
    if (!allowed || !open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      inputSuggestionApi.search(selectedCompanyId, moduleKey, fieldKey, value, controller.signal)
        .then((suggestions) => {
          setResult({ companyId: selectedCompanyId, items: suggestions });
          setActiveIndex(suggestions.length ? 0 : -1);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setResult({ companyId: selectedCompanyId, items: [] });
            setActiveIndex(-1);
          }
        });
    }, 180);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [allowed, fieldKey, moduleKey, open, selectedCompanyId, value]);

  const recordValue = React.useCallback((candidate: string) => {
    const normalized = candidate.trim().replace(/\s+/g, ' ');
    if (!allowed || normalized.length < 2 || normalized === lastRecorded.current) return;
    lastRecorded.current = normalized;
    void inputSuggestionApi.record(selectedCompanyId, moduleKey, fieldKey, normalized).catch(() => undefined);
  }, [allowed, fieldKey, moduleKey, selectedCompanyId]);

  const choose = (candidate: string) => {
    onChange(candidate);
    recordValue(candidate);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        {...inputProps}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onFocus={(event) => {
          setOpen(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          window.setTimeout(() => setOpen(false), 100);
          recordValue(value);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && items.length) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => (current + 1) % items.length);
          } else if (event.key === 'ArrowUp' && items.length) {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((current) => (current <= 0 ? items.length - 1 : current - 1));
          } else if (event.key === 'Enter' && open && activeIndex >= 0) {
            event.preventDefault();
            choose(items[activeIndex].value);
          } else if (event.key === 'Escape') {
            setOpen(false);
          }
          onKeyDown?.(event);
        }}
        role={allowed ? 'combobox' : undefined}
        aria-autocomplete={allowed ? 'list' : undefined}
        aria-expanded={allowed ? open : undefined}
        aria-controls={allowed ? listId : undefined}
        aria-activedescendant={allowed && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        className={className}
      />
      {allowed && open && items.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-56 overflow-auto border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[0_12px_30px_rgba(15,23,42,.16)]"
        >
          {items.map((item, index) => (
            <li
              id={`${listId}-${index}`}
              key={item.id}
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(item.value);
              }}
              className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 px-3 text-sm ${
                index === activeIndex
                  ? 'bg-orange-50 font-bold text-orange-900'
                  : 'text-[var(--color-text-main)] hover:bg-[var(--color-bg)]'
              }`}
            >
              <span className="truncate">{item.value}</span>
              <span className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--color-text-sub)]">
                <Clock3 className="h-3 w-3" />
                {item.userUsageCount || item.usageCount}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
