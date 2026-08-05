import { apiClient } from '@/lib/apiClient';
import type { CompanyId } from '@/types/models';
import { isDemoLocalMode } from '@/lib/runtimeExecutionMode';

export type InputSuggestion = {
  id: string;
  value: string;
  usageCount: number;
  userUsageCount: number;
  lastUsedAt: string;
  score: number;
};

const approvedSuggestionFields = new Set([
  'building_use',
  'businesstype',
  'clientname',
  'customer_company',
  'estimate_type',
  'estimatetype',
  'market_scope',
  'projectname',
  'unit_price_work',
  'unitwork',
  'usage',
  'vendor',
  'work_category',
  'work_trade',
  'work_type',
  'workcategory',
]);

export function isSuggestionFieldAllowed(fieldKey: string) {
  const normalized = fieldKey.trim().toLocaleLowerCase();
  return approvedSuggestionFields.has(normalized);
}

async function request<T>(endpoint: string, companyId: CompanyId, init?: RequestInit): Promise<T> {
  return apiClient(endpoint, { ...init, companyId }) as Promise<T>;
}

function requireCompanyId(companyId: CompanyId) {
  if (companyId !== 'CON_COST' && companyId !== 'VIET_QS') {
    throw new Error('A valid selected company is required for input suggestions.');
  }
  return companyId;
}

type LocalSuggestion = InputSuggestion & { moduleKey: string; fieldKey: string };

const localKey = (companyId: CompanyId) => `erp-input-memory-v1:${companyId}`;
const canUseLocalDemo = () => typeof window !== 'undefined' && isDemoLocalMode();
const readLocal = (companyId: CompanyId): LocalSuggestion[] => {
  try { return JSON.parse(window.localStorage.getItem(localKey(companyId)) || '[]') as LocalSuggestion[]; }
  catch { return []; }
};
const writeLocal = (companyId: CompanyId, values: LocalSuggestion[]) => window.localStorage.setItem(localKey(companyId), JSON.stringify(values));

export const inputSuggestionApi = {
  search(companyId: CompanyId, moduleKey: string, fieldKey: string, query: string, signal?: AbortSignal) {
    if (!isSuggestionFieldAllowed(fieldKey)) return Promise.resolve([] as InputSuggestion[]);
    requireCompanyId(companyId);
    if (canUseLocalDemo()) {
      const normalized = query.trim().toLocaleLowerCase();
      return Promise.resolve(readLocal(companyId)
        .filter((item) => item.moduleKey === moduleKey && item.fieldKey === fieldKey && (!normalized || item.value.toLocaleLowerCase().includes(normalized)))
        .sort((left, right) => right.userUsageCount - left.userUsageCount || Date.parse(right.lastUsedAt) - Date.parse(left.lastUsedAt))
        .slice(0, 8));
    }
    const params = new URLSearchParams({ module: moduleKey, field: fieldKey, query, limit: '8' });
    return request<InputSuggestion[]>(`/input-suggestions?${params.toString()}`, requireCompanyId(companyId), {
      signal,
    });
  },
  record(companyId: CompanyId, moduleKey: string, fieldKey: string, value: string) {
    if (!isSuggestionFieldAllowed(fieldKey) || value.trim().length < 2) return Promise.resolve();
    requireCompanyId(companyId);
    if (canUseLocalDemo()) {
      const normalized = value.trim().replace(/\s+/g, ' ');
      const values = readLocal(companyId);
      const existing = values.find((item) => item.moduleKey === moduleKey && item.fieldKey === fieldKey && item.value.toLocaleLowerCase() === normalized.toLocaleLowerCase());
      const now = new Date().toISOString();
      if (existing) {
        existing.usageCount += 1;
        existing.userUsageCount += 1;
        existing.score += 1;
        existing.lastUsedAt = now;
      } else {
        values.push({ id: globalThis.crypto?.randomUUID?.() || `memory-${Date.now()}`, value: normalized, usageCount: 1, userUsageCount: 1, lastUsedAt: now, score: 1, moduleKey, fieldKey });
      }
      writeLocal(companyId, values);
      return Promise.resolve();
    }
    return request<{ id: string; value: string }>('/input-suggestions', requireCompanyId(companyId), {
      method: 'POST',
      body: JSON.stringify({ module: moduleKey, field: fieldKey, value }),
    }).then(() => undefined);
  },
  remove(companyId: CompanyId, suggestionId: string) {
    requireCompanyId(companyId);
    if (canUseLocalDemo()) {
      writeLocal(companyId, readLocal(companyId).filter((item) => item.id !== suggestionId));
      return Promise.resolve();
    }
    return request<void>(`/input-suggestions/admin/${encodeURIComponent(suggestionId)}`, companyId, { method: 'DELETE' });
  },
};
