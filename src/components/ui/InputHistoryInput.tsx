'use client';

import React from 'react';
import { Clock3, Plus, Trash2 } from 'lucide-react';
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
  const [error, setError] = React.useState('');
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
    }, 280);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [allowed, fieldKey, moduleKey, open, selectedCompanyId, value]);

  const recordValue = React.useCallback((candidate: string) => {
    const normalized = candidate.trim().replace(/\s+/g, ' ');
    if (!allowed || normalized.length < 2 || normalized === lastRecorded.current) return;
    lastRecorded.current = normalized;
    void inputSuggestionApi.record(selectedCompanyId, moduleKey, fieldKey, normalized)
      .then(() => setError(''))
      .catch(() => setError('기억값을 서버에 저장하지 못했습니다.'));
  }, [allowed, fieldKey, moduleKey, selectedCompanyId]);

  const choose = (candidate: string) => {
    onChange(candidate);
    recordValue(candidate);
    setOpen(false);
  };

  const addCurrent = () => {
    recordValue(value);
    setOpen(false);
  };

  const remove = async (item: InputSuggestion) => {
    try {
      await inputSuggestionApi.remove(selectedCompanyId, item.id);
      setResult((current) => ({ ...current, items: current.items.filter((candidate) => candidate.id !== item.id) }));
      setError('');
    } catch {
      setError('이 기억값을 삭제할 권한이 없거나 서버가 응답하지 않았습니다.');
    }
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
          if (event.key === 'Enter' && !open) {
            event.preventDefault();
            setOpen(true);
          } else if (event.key === 'ArrowDown' && items.length) {
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
      {error && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{error}</p>}
      {allowed && open && (
        <div
          id={listId}
          className="absolute inset-x-0 top-full z-50 mt-1 max-h-56 overflow-auto border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-[0_12px_30px_rgba(15,23,42,.16)]"
        >
          <div role="listbox">
            {items.map((item, index) => (
              <div id={`${listId}-${index}`} key={item.id} role="option" aria-selected={index === activeIndex} className={`flex min-h-10 items-center gap-2 px-2 text-sm ${index === activeIndex ? 'bg-orange-50 font-bold text-orange-900' : 'text-[var(--color-text-main)] hover:bg-[var(--color-bg)]'}`}>
                <button type="button" onMouseDown={(event) => { event.preventDefault(); choose(item.value); }} className="min-w-0 flex-1 truncate px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{item.value}</button>
                <span title={`최근 ${new Date(item.lastUsedAt).toLocaleDateString()} · 사용 ${item.userUsageCount || item.usageCount}회`} className="flex shrink-0 items-center gap-1 text-[10px] text-[var(--color-text-sub)]"><Clock3 className="h-3 w-3" />{item.userUsageCount || item.usageCount}</span>
                <button type="button" title="기억값 삭제" onMouseDown={(event) => event.preventDefault()} onClick={() => void remove(item)} className="grid size-7 place-items-center text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>
          {value.trim().length >= 2 && !items.some((item) => item.value.toLocaleLowerCase() === value.trim().toLocaleLowerCase()) && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={addCurrent} className="flex min-h-9 w-full items-center gap-2 border-t px-3 text-left text-xs font-bold text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)]"><Plus className="size-3.5" />현재 값 기억하기</button>}
          {!items.length && value.trim().length < 2 && <p className="px-3 py-2 text-xs text-[var(--color-text-sub)]">두 글자 이상 입력하거나 Enter를 눌러 기억값을 검색하세요.</p>}
        </div>
      )}
    </div>
  );
}
