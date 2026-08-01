import { apiClient } from '@/lib/apiClient';
import type { CompanyId } from '@/types/models';

export type InputSuggestion = {
  id: string;
  value: string;
  usageCount: number;
  userUsageCount: number;
  lastUsedAt: string;
  score: number;
};

const sensitiveFragments = [
  'password',
  'passwd',
  'secret',
  'token',
  'credential',
  'email',
  'phone',
  'mobile',
  'telephone',
  'fax',
  'memo',
  'note',
  'content',
  'address',
];

export function isSuggestionFieldAllowed(fieldKey: string) {
  const normalized = fieldKey.trim().toLocaleLowerCase();
  return /^[a-z0-9_.-]{1,64}$/.test(normalized)
    && !sensitiveFragments.some((fragment) => normalized.includes(fragment));
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

export const inputSuggestionApi = {
  search(companyId: CompanyId, moduleKey: string, fieldKey: string, query: string, signal?: AbortSignal) {
    if (!isSuggestionFieldAllowed(fieldKey)) return Promise.resolve([] as InputSuggestion[]);
    const params = new URLSearchParams({ module: moduleKey, field: fieldKey, query, limit: '8' });
    return request<InputSuggestion[]>(`/input-suggestions?${params.toString()}`, requireCompanyId(companyId), {
      signal,
    });
  },
  record(companyId: CompanyId, moduleKey: string, fieldKey: string, value: string) {
    if (!isSuggestionFieldAllowed(fieldKey) || value.trim().length < 2) return Promise.resolve();
    return request<{ id: string; value: string }>('/input-suggestions', requireCompanyId(companyId), {
      method: 'POST',
      body: JSON.stringify({ module: moduleKey, field: fieldKey, value }),
    }).then(() => undefined);
  },
};
