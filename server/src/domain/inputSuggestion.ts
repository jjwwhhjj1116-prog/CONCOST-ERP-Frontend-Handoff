import { canAccessCompany, CompanyId, isCompanyId } from './companyAccess';

const sensitiveFieldFragments = [
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

export type SuggestionRankInput = {
  value: string;
  usageCount: number;
  userUsageCount: number;
  lastUsedAt: Date;
};

export type SuggestionCompanyScopeResult =
  | { ok: true; companyId: CompanyId }
  | { ok: false; status: 400 | 403; error: string };

export function resolveSuggestionCompanyScope(input: {
  selectedCompanyId?: unknown;
  allowedCompanyIds?: readonly CompanyId[];
}): SuggestionCompanyScopeResult {
  if (input.selectedCompanyId === undefined || input.selectedCompanyId === null || input.selectedCompanyId === '') {
    return { ok: false, status: 400, error: 'Selected company scope is required.' };
  }
  if (
    !isCompanyId(input.selectedCompanyId)
    || !canAccessCompany(input.allowedCompanyIds || [], input.selectedCompanyId)
  ) {
    return { ok: false, status: 403, error: 'Forbidden: Company workspace access denied.' };
  }
  return { ok: true, companyId: input.selectedCompanyId };
}

export function suggestionScopeIdentity(
  companyId: CompanyId,
  moduleKey: string,
  fieldKey: string,
  normalizedValue: string,
) {
  return `${companyId}\u0000${moduleKey}\u0000${fieldKey}\u0000${normalizedValue}`;
}

export function normalizeSuggestionValue(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

export function isSuggestionFieldAllowed(fieldKey: string) {
  const normalized = fieldKey.trim().toLocaleLowerCase();
  return /^[a-z0-9_.-]{1,64}$/.test(normalized)
    && !sensitiveFieldFragments.some((fragment) => normalized.includes(fragment));
}

export function rankSuggestion(input: SuggestionRankInput, now = new Date()) {
  const ageDays = Math.max(0, (now.getTime() - input.lastUsedAt.getTime()) / 86_400_000);
  const recency = Math.max(0, 30 - Math.min(30, ageDays));
  return input.userUsageCount * 8 + input.usageCount * 2 + recency;
}
