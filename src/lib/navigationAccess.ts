import type { PersonnelCard, Role } from '@/types/models';
import { resolveAccessGrade } from '@/lib/accessControl';

export type NavigationAccessRule = {
  roles?: Role[];
  minLevel?: number;
};

export function getNavigationAccessLevel(
  user: Pick<PersonnelCard, 'role' | 'permissionLevel' | 'accessGrade' | 'organizationRank'>,
) {
  const grade = resolveAccessGrade(user);
  if (grade === 'ADMIN') return 5;
  if (grade === 'GRADE_1' || grade === 'GRADE_2') return 4;
  if (grade === 'GRADE_3') return 3;
  if (user.permissionLevel) return user.permissionLevel;
  return 2;
}

export function canAccessNavigation(
  rule: NavigationAccessRule,
  role: Role,
  level: number,
) {
  return (!rule.roles || rule.roles.includes(role)) && level >= (rule.minLevel || 1);
}
