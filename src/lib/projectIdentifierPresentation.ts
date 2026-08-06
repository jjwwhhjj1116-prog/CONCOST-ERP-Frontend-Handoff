import { isOfficialProjectNo } from '@/lib/projectNumber';

export const projectNoForDisplay = (value?: string | null) =>
  value && isOfficialProjectNo(value) ? value : null;

export const estimateDbValueForDisplay = (
  column: string,
  value: unknown,
  fallbackProjectNo?: string | null,
) => {
  if (column === '접수번호') return value ? '등록됨' : '-';
  if (column === '프로젝트 연결') return value ? '연결됨' : '-';
  if (column === 'PJ NO') {
    return projectNoForDisplay(typeof value === 'string' ? value : fallbackProjectNo)
      || projectNoForDisplay(fallbackProjectNo)
      || '발급 대기';
  }
  return value === null || value === undefined || value === '' ? '-' : String(value);
};
