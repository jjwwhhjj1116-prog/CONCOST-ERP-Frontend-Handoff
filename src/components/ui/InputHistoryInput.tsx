'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Clock3, History, Plus, Search, Trash2, X } from 'lucide-react';
import {
  inputSuggestionApi,
  isSuggestionFieldAllowed,
  type InputSuggestion,
} from '@/lib/inputSuggestionApi';
import { useUiStore } from '@/store/uiStore';

type InputHistoryInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  moduleKey: string;
  fieldKey: string;
  label?: string;
  enterOpensPicker?: boolean;
  pickerRequest?: number;
  value: string;
  onChange: (value: string) => void;
};

export function InputHistoryInput({
  moduleKey,
  fieldKey,
  label,
  enterOpensPicker = false,
  pickerRequest,
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
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerQuery, setPickerQuery] = React.useState('');
  const [pickerView, setPickerView] = React.useState<'ALL' | 'COMPANY' | 'RECENT'>('ALL');
  const [result, setResult] = React.useState<{
    companyId: 'CON_COST' | 'VIET_QS';
    items: InputSuggestion[];
  }>({ companyId: 'CON_COST', items: [] });
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [error, setError] = React.useState('');
  const lastRecorded = React.useRef('');
  const lastPickerRequest = React.useRef(pickerRequest);
  const pickerDialogRef = React.useRef<HTMLElement>(null);
  const allowed = isSuggestionFieldAllowed(fieldKey);
  const selectedCompanyId = useUiStore((state) => state.brandWorkspace);
  const items = React.useMemo(
    () => result.companyId === selectedCompanyId ? result.items : [],
    [result, selectedCompanyId],
  );
  const pickerItems = React.useMemo(() => {
    if (pickerView !== 'RECENT') return items;
    return [...items]
      .filter((item) => item.userUsageCount > 0)
      .sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  }, [items, pickerView]);

  React.useEffect(() => {
    if (!allowed || (!open && !pickerOpen)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      inputSuggestionApi.search(selectedCompanyId, moduleKey, fieldKey, pickerOpen ? pickerQuery : value, controller.signal)
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
  }, [allowed, fieldKey, moduleKey, open, pickerOpen, pickerQuery, selectedCompanyId, value]);

  const recordValue = React.useCallback(async (candidate: string) => {
    const normalized = candidate.trim().replace(/\s+/g, ' ');
    if (!allowed || normalized.length < 2 || normalized === lastRecorded.current) return;
    lastRecorded.current = normalized;
    try {
      await inputSuggestionApi.record(selectedCompanyId, moduleKey, fieldKey, normalized);
      setError('');
    } catch {
      lastRecorded.current = '';
      setError('기억값을 서버에 저장하지 못했습니다.');
      throw new Error('기억값을 서버에 저장하지 못했습니다.');
    }
  }, [allowed, fieldKey, moduleKey, selectedCompanyId]);

  const applyValue = (candidate: string) => {
    onChange(candidate);
    setOpen(false);
    setPickerOpen(false);
  };

  const choose = (candidate: string) => {
    applyValue(candidate);
    void recordValue(candidate).catch(() => undefined);
  };

  const addCurrent = () => {
    void recordValue(value).catch(() => undefined);
    setOpen(false);
    setPickerOpen(false);
  };

  const openPicker = () => {
    if (!allowed) return;
    setPickerQuery(value);
    setPickerView('ALL');
    setOpen(false);
    setPickerOpen(true);
  };

  React.useEffect(() => {
    if (pickerRequest === undefined || pickerRequest === lastPickerRequest.current) return;
    lastPickerRequest.current = pickerRequest;
    openPicker();
  }, [pickerRequest]); // eslint-disable-line react-hooks/exhaustive-deps

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
          void recordValue(value).catch(() => undefined);
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          if ((event.key === 'F4' || (event.altKey && event.key === 'ArrowDown')) && allowed) {
            event.preventDefault();
            openPicker();
          } else if (event.key === 'Enter' && enterOpensPicker) {
            event.preventDefault();
            openPicker();
          } else if (event.key === 'Enter' && !open) {
            event.preventDefault();
            openPicker();
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
            setPickerOpen(false);
          }
          onKeyDown?.(event);
        }}
        role={allowed ? 'combobox' : undefined}
        aria-autocomplete={allowed ? 'list' : undefined}
        aria-expanded={allowed ? open : undefined}
        aria-controls={allowed ? listId : undefined}
        aria-activedescendant={allowed && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        aria-keyshortcuts={allowed ? 'Enter F4 Alt+ArrowDown' : undefined}
        className={`${className || ''} ${allowed ? 'pr-10' : ''}`}
      />
      {allowed && <button type="button" title="기억값 전체 보기 (Enter/F4)" aria-label="기억값 전체 보기" onMouseDown={(event) => event.preventDefault()} onClick={openPicker} className="absolute right-1 top-1 grid size-8 place-items-center rounded text-[var(--color-primary)] transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><History className="size-4" /></button>}
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
      {allowed && pickerOpen && typeof document !== 'undefined' && createPortal(
        <div role="presentation" className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setPickerOpen(false); }}>
          <section
            ref={pickerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${listId}-picker-title`}
            className="flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_26px_80px_rgba(15,23,42,.42)]"
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Escape') {
                event.preventDefault();
                setPickerOpen(false);
                return;
              }
              if (event.ctrlKey && event.key === 'Enter' && pickerQuery.trim().length >= 2) {
                event.preventDefault();
                const candidate = pickerQuery.trim();
                applyValue(candidate);
                void recordValue(candidate).catch(() => undefined);
                return;
              }
              if (event.key !== 'Tab') return;
              const focusable = Array.from(pickerDialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])') || []);
              if (!focusable.length) return;
              const first = focusable[0];
              const last = focusable[focusable.length - 1];
              if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
              if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
            }}
          >
            <header className="flex items-start justify-between gap-4 border-b p-5">
              <div><p className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">INPUT MEMORY</p><h2 id={`${listId}-picker-title`} className="mt-1 text-xl font-black">{label || fieldKey} 입력·선택</h2><p className="mt-1 text-xs text-[var(--color-text-sub)]">{selectedCompanyId === 'CON_COST' ? 'CON-COST' : 'Viet QS'} · 회사별 기억값</p></div>
              <button type="button" title="닫기 (Esc)" onClick={() => setPickerOpen(false)} className="grid size-9 place-items-center rounded border transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><X className="size-4" /></button>
            </header>
            <div className="space-y-3 border-b p-4">
              <label className="relative block"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[var(--color-text-sub)]" /><input autoFocus value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} onKeyDown={(event) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); const candidate = pickerQuery.trim(); if (candidate.length >= 2) { applyValue(candidate); void recordValue(candidate).catch(() => undefined); } return; } if (event.key === 'ArrowDown' && pickerItems.length) { event.preventDefault(); setActiveIndex(0); document.getElementById(`${listId}-picker-0`)?.focus(); } else if (event.key === 'Enter' && pickerQuery.trim()) { event.preventDefault(); if (activeIndex >= 0 && pickerItems[activeIndex]) choose(pickerItems[activeIndex].value); else applyValue(pickerQuery.trim()); } }} placeholder="새 값을 직접 입력하거나 기억값 검색" className="w-full rounded border bg-white py-2 pl-9 pr-20 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" /><button type="button" onClick={() => setPickerQuery('')} className="absolute right-2 top-1.5 rounded px-2 py-1 text-xs font-semibold text-[var(--color-text-sub)] transition hover:bg-orange-50 hover:text-[var(--color-primary)]">Clear</button></label>
              <div className="flex gap-2" role="tablist" aria-label="기억값 범위">{(['ALL', 'COMPANY', 'RECENT'] as const).map((scope) => <button key={scope} type="button" role="tab" aria-selected={pickerView === scope} onClick={() => setPickerView(scope)} className={`rounded px-3 py-2 text-xs font-bold transition ${pickerView === scope ? 'bg-[var(--color-primary)] text-white' : 'border hover:border-orange-300 hover:bg-orange-50'}`}>{scope === 'ALL' ? '전체' : scope === 'COMPANY' ? '회사 공용' : '내 최근'}</button>)}</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              <div className="mb-2 grid grid-cols-[minmax(0,1fr)_80px_110px_40px] gap-2 px-3 text-[10px] font-black uppercase text-[var(--color-text-sub)]"><span>값</span><span>사용횟수</span><span>최근사용</span><span></span></div>
              {pickerItems.map((item, index) => (
                <div key={item.id} onMouseEnter={() => setActiveIndex(index)} className={`mb-2 flex items-center gap-3 rounded-md border p-2 transition ${index === activeIndex ? 'border-orange-400 bg-orange-50 shadow-[inset_4px_0_0_var(--color-primary)]' : 'hover:border-orange-300 hover:bg-orange-50/40'}`}>
                  <button id={`${listId}-picker-${index}`} type="button" onClick={() => choose(item.value)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); const next = Math.min(pickerItems.length - 1, index + 1); setActiveIndex(next); document.getElementById(`${listId}-picker-${next}`)?.focus(); } if (event.key === 'ArrowUp') { event.preventDefault(); const previous = Math.max(0, index - 1); setActiveIndex(previous); document.getElementById(`${listId}-picker-${previous}`)?.focus(); } if (event.key === 'Delete') { event.preventDefault(); void remove(item); } }} className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_80px_110px] items-center gap-2 rounded px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><strong className="truncate">{item.value}</strong><span className="text-[10px] text-[var(--color-text-sub)]">{item.userUsageCount || item.usageCount}회</span><span className="text-[10px] text-[var(--color-text-sub)]">{new Date(item.lastUsedAt).toLocaleDateString()}</span></button>
                  <button type="button" title="기억값 삭제" onClick={() => void remove(item)} className="grid size-9 shrink-0 place-items-center rounded text-red-500 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><Trash2 className="size-4" /></button>
                </div>
              ))}
              {!pickerItems.length && <div className="p-10 text-center"><History className="mx-auto mb-3 size-8 text-orange-300" /><strong className="block">검색된 기억값이 없습니다.</strong><p className="mt-1 text-xs text-[var(--color-text-sub)]">위 입력칸에 새 값을 직접 입력해 셀에 적용할 수 있습니다.</p></div>}
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
              <p className="text-xs text-[var(--color-text-sub)]">↑↓ 이동 · Enter 적용 · Ctrl+Enter 기억+적용 · Delete 삭제 · Esc 닫기</p>
              <div className="flex flex-wrap gap-2"><button type="button" disabled={!pickerQuery.trim()} onClick={() => applyValue(pickerQuery.trim())} className="rounded border border-orange-300 px-3 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-40">Cell에 적용</button><button type="button" disabled={pickerQuery.trim().length < 2} onClick={() => { const candidate = pickerQuery.trim(); applyValue(candidate); void recordValue(candidate).catch(() => undefined); }} className="inline-flex items-center gap-2 rounded bg-[var(--color-primary)] px-3 py-2 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:opacity-40"><Plus className="size-4" />현재 입력값 기억하기</button><button type="button" onClick={() => setPickerOpen(false)} className="rounded border px-4 py-2 text-sm font-semibold transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">취소</button></div>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
