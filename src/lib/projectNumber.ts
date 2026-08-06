import type { Project } from '@/types/models';

export const allocateAnnualProjectNo = (
  projects: Array<Pick<Project, 'projectNo'>>,
  year: number,
) => {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new Error('INVALID_PROJECT_NUMBER_YEAR');
  const prefix = String(year);
  const used = projects
    .map((project) => project.projectNo || '')
    .filter((value) => new RegExp(`^${prefix}\\d{3}$`).test(value))
    .map((value) => Number(value.slice(4)));
  const next = Math.max(0, ...used) + 1;
  if (next > 999) throw new Error('PROJECT_NUMBER_SEQUENCE_EXHAUSTED');
  return `${prefix}${String(next).padStart(3, '0')}`;
};

export const isOfficialProjectNo = (value?: string | null) => /^\d{7}$/.test(value || '');
