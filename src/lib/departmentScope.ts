export type TechnicalDepartmentScope = 'FINISH' | 'STRUCTURE' | 'CIVIL_LANDSCAPE' | 'CLAIM' | 'DEVELOPMENT';

type DepartmentScopedRecord = {
  departmentId?: string;
  departmentName?: string;
  teamName?: string;
  subDepartmentName?: string;
};

export function getTechnicalDepartmentScope(value: string | null): TechnicalDepartmentScope | null {
  return value === 'FINISH' || value === 'STRUCTURE' || value === 'CIVIL_LANDSCAPE' || value === 'CLAIM' || value === 'DEVELOPMENT' ? value : null;
}

export function getTechnicalDepartmentLabel(scope: TechnicalDepartmentScope | null) {
  if (scope === 'FINISH') return '마감';
  if (scope === 'STRUCTURE') return '구조';
  if (scope === 'CIVIL_LANDSCAPE') return '토목&조경';
  if (scope === 'CLAIM') return '클레임센터';
  if (scope === 'DEVELOPMENT') return '개발팀';
  return '기술본부 전체';
}

export function matchesTechnicalDepartment(scope: TechnicalDepartmentScope | null, record: DepartmentScopedRecord) {
  if (!scope) return true;
  const haystack = [record.departmentId, record.departmentName, record.teamName, record.subDepartmentName]
    .filter(Boolean)
    .join(' ')
    .toUpperCase();

  if (scope === 'FINISH') return ['FINISH', '마감', 'INTERIOR'].some((token) => haystack.includes(token));
  if (scope === 'STRUCTURE') return ['STRUCTURE', '구조', 'BIM'].some((token) => haystack.includes(token));
  if (scope === 'CIVIL_LANDSCAPE') return ['CIVIL', 'LANDSCAPE', '토목', '조경'].some((token) => haystack.includes(token));
  if (scope === 'CLAIM') return ['CLAIM', '클레임'].some((token) => haystack.includes(token));
  return ['DEVELOPMENT', '개발', 'DEV'].some((token) => haystack.includes(token));
}
