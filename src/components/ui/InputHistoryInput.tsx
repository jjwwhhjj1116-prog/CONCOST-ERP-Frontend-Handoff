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
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerQuery, setPickerQuery] = React.useState('');
  const [pickerView, setPickerView] = React.useState<'COMPANY' | 'RECENT'>('COMPANY');
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
    setPickerOpen(false);
  };

  const addCurrent = () => {
    recordValue(value);
    setOpen(false);
    setPickerOpen(false);
  };

  const openPicker = () => {
    if (!allowed) return;
    setPickerQuery(value);
    setPickerView('COMPANY');
    setOpen(false);
    setPickerOpen(true);
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
          if ((event.key === 'F4' || (event.altKey && event.key === 'ArrowDown')) && allowed) {
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
          <section role="dialog" aria-modal="true" aria-labelledby={`${listId}-picker-title`} className="flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_26px_80px_rgba(15,23,42,.42)]">
            <header className="flex items-start justify-between gap-4 border-b p-5">
              <div><p className="text-[10px] font-black tracking-[.12em] text-[var(--color-primary)]">INPUT MEMORY</p><h2 id={`${listId}-picker-title`} className="mt-1 text-xl font-black">기억값 선택</h2><p className="mt-1 text-xs text-[var(--color-text-sub)]">{selectedCompanyId === 'CON_COST' ? 'CON-COST' : 'Viet QS'} · {fieldKey}</p></div>
              <button type="button" title="닫기 (Esc)" onClick={() => setPickerOpen(false)} className="grid size-9 place-items-center rounded border transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><X className="size-4" /></button>
            </header>
            <div className="space-y-3 border-b p-4">
              <label className="relative block"><Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-[var(--color-text-sub)]" /><input autoFocus value={pickerQuery} onChange={(event) => setPickerQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setPickerOpen(false); if (event.key === 'ArrowDown' && items.length) { event.preventDefault(); setActiveIndex(0); document.getElementById(`${listId}-picker-0`)?.focus(); } }} placeholder="기억값 검색" className="w-full rounded border bg-white py-2 pl-9 pr-20 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" /><button type="button" onClick={() => setPickerQuery('')} className="absolute right-2 top-1.5 rounded px-2 py-1 text-xs font-semibold text-[var(--color-text-sub)] transition hover:bg-orange-50 hover:text-[var(--color-primary)]">Clear</button></label>
              <div className="flex gap-2" role="tablist" aria-label="기억값 범위"><button type="button" role="tab" aria-selected={pickerView === 'COMPANY'} onClick={() => setPickerView('COMPANY')} className={`rounded px-3 py-2 text-xs font-bold transition ${pickerView === 'COMPANY' ? 'bg-[var(--color-primary)] text-white' : 'border hover:border-orange-300 hover:bg-orange-50'}`}>회사 공용</button><button type="button" role="tab" aria-selected={pickerView === 'RECENT'} onClick={() => setPickerView('RECENT')} className={`rounded px-3 py-2 text-xs font-bold transition ${pickerView === 'RECENT' ? 'bg-[var(--color-primary)] text-white' : 'border hover:border-orange-300 hover:bg-orange-50'}`}>내 최근</button></div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {(pickerView === 'RECENT' ? [...items].sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt)) : items).map((item, index) => (
                <div key={item.id} className={`mb-2 flex items-center gap-3 rounded-md border p-2 transition ${index === activeIndex ? 'border-orange-400 bg-orange-50 shadow-[inset_4px_0_0_var(--color-primary)]' : 'hover:border-orange-300 hover:bg-orange-50/40'}`}>
                  <button id={`${listId}-picker-${index}`} type="button" onClick={() => choose(item.value)} onKeyDown={(event) => { if (event.key === 'ArrowDown') { event.preventDefault(); document.getElementById(`${listId}-picker-${Math.min(items.length - 1, index + 1)}`)?.focus(); } if (event.key === 'ArrowUp') { event.preventDefault(); document.getElementById(`${listId}-picker-${Math.max(0, index - 1)}`)?.focus(); } }} className="min-w-0 flex-1 rounded px-2 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><strong className="block truncate">{item.value}</strong><span className="mt-1 flex gap-3 text-[10px] text-[var(--color-text-sub)]"><span>Usage {item.userUsageCount || item.usageCount}</span><span>Recent {new Date(item.lastUsedAt).toLocaleDateString()}</span></span></button>
                  <button type="button" title="기억값 삭제" onClick={() => void remove(item)} className="grid size-9 shrink-0 place-items-center rounded text-red-500 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><Trash2 className="size-4" /></button>
                </div>
              ))}
              {!items.length && <div className="p-10 text-center"><History className="mx-auto mb-3 size-8 text-orange-300" /><strong className="block">검색된 기억값이 없습니다.</strong><p className="mt-1 text-xs text-[var(--color-text-sub)]">새 값을 입력해 회사 범위에 등록할 수 있습니다.</p></div>}
            </div>
            <footer className="flex flex-wrap items-center justify-between gap-3 border-t p-4">
              <p className="text-xs text-[var(--color-text-sub)]">Enter 선택 · ↑↓ 이동 · Esc 닫기</p>
              <div className="flex gap-2">{pickerQuery.trim().length >= 2 && !items.some((item) => item.value.toLocaleLowerCase() === pickerQuery.trim().toLocaleLowerCase()) && <button type="button" onClick={() => { onChange(pickerQuery); recordValue(pickerQuery); setPickerOpen(false); }} className="inline-flex items-center gap-2 rounded border border-orange-300 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><Plus className="size-4" />추가 후 선택</button>}<button type="button" onClick={() => setPickerOpen(false)} className="rounded border px-4 py-2 text-sm font-semibold transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">닫기</button></div>
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </div>
  );
}
