export const COMPANY_IDS = ['CON_COST', 'VIET_QS'] as const;

export type CompanyId = (typeof COMPANY_IDS)[number];

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN']);

export const isCompanyId = (value: unknown): value is CompanyId =>
  typeof value === 'string' && COMPANY_IDS.includes(value as CompanyId);

export const getAllowedCompanyIds = (role: string, personnelCompanyId?: string | null): CompanyId[] => {
  if (ADMIN_ROLES.has(role)) return [...COMPANY_IDS];
  if (isCompanyId(personnelCompanyId)) return [personnelCompanyId];
  return [];
};

export const canAccessCompany = (
  allowedCompanyIds: readonly CompanyId[],
  companyId: unknown,
): companyId is CompanyId =>
  isCompanyId(companyId) && allowedCompanyIds.includes(companyId);
