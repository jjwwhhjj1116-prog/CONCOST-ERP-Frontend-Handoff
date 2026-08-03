'use client';

import { Building2, CheckCircle2 } from 'lucide-react';
import { PROJECT_EXECUTION_UNITS } from '@/lib/projectExecutionUnits';
import type { ProjectExecutionUnitId } from '@/types/models';

type Props = {
  value: ProjectExecutionUnitId[];
  primaryUnitId: ProjectExecutionUnitId | null;
  disabled?: boolean;
  onChange: (value: ProjectExecutionUnitId[], primaryUnitId: ProjectExecutionUnitId | null) => void;
};

export function ProjectExecutionUnitSelector({ value, primaryUnitId, disabled = false, onChange }: Props) {
  const toggle = (unitId: ProjectExecutionUnitId) => {
    const selected = value.includes(unitId);
    const next = selected ? value.filter((id) => id !== unitId) : [...value, unitId];
    const nextPrimary = selected && primaryUnitId === unitId ? (next[0] || null) : (primaryUnitId || unitId);
    onChange(next, nextPrimary);
  };

  return (
    <fieldset disabled={disabled} className="min-w-0 border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      <legend className="px-1 text-xs font-black text-[var(--color-text-main)]">담당부서 복수선택</legend>
      <p className="mb-3 text-[11px] font-semibold text-[var(--color-text-sub)]">견적 단계에서는 PM을 지정하지 않습니다. 수주 시 선택부서에 같은 프로젝트가 배정됩니다.</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        {PROJECT_EXECUTION_UNITS.map((unit) => {
          const selected = value.includes(unit.id);
          return (
            <button
              key={unit.id}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => toggle(unit.id)}
              className={`flex min-h-12 items-center gap-2 border px-3 text-left text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${selected ? 'border-[var(--color-primary)] bg-orange-50 text-orange-900' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-orange-200'} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {selected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-primary)]" /> : <Building2 className="h-4 w-4 shrink-0 text-[var(--color-text-sub)]" />}
              <span>{unit.labelKo}</span>
            </button>
          );
        })}
      </div>
      <label className="mt-3 block max-w-sm text-xs font-bold text-[var(--color-text-sub)]">
        <span className="mb-1 block">주관부서</span>
        <select
          value={primaryUnitId || ''}
          disabled={disabled || value.length === 0}
          onChange={(event) => onChange(value, (event.target.value || null) as ProjectExecutionUnitId | null)}
          className="w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-60"
        >
          <option value="">선택</option>
          {PROJECT_EXECUTION_UNITS.filter((unit) => value.includes(unit.id)).map((unit) => <option key={unit.id} value={unit.id}>{unit.labelKo}</option>)}
        </select>
      </label>
    </fieldset>
  );
}
