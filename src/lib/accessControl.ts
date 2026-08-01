import { getRuntimeExecutionMode, type RuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import type { AccessGrade, PersonnelCard } from '@/types/models';

export const MANAGEMENT_SUPPORT_ORGANIZATION_ID = 'MANAGEMENT_SUPPORT';
export const FINANCE_CAPABILITY = 'FINANCE_ACCESS';

export type AccessDecision = {
  allowed: boolean;
  frontendEligible: boolean;
  backendCapabilityRequired: boolean;
  grade: AccessGrade;
  reason:
    | 'ADMIN'
    | 'GRADE_1'
    | 'ACTIVE_MANAGEMENT_SUPPORT_MEMBERSHIP'
    | 'BACKEND_CAPABILITY_REQUIRED'
    | 'NOT_ELIGIBLE';
};

export function resolveAccessGrade(
  user: Pick<PersonnelCard, 'accessGrade' | 'role' | 'organizationRank'>,
): AccessGrade {
  if (user.accessGrade) return user.accessGrade;
  if (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') return 'ADMIN';
  if (['CEO', 'COO', 'VICE_PRESIDENT'].includes(user.organizationRank || '')) return 'GRADE_1';
  if (
    user.role === 'DEPARTMENT_MANAGER' ||
    ['MANAGER', 'TEAM_LEADER'].includes(user.organizationRank || '')
  ) {
    return 'GRADE_2';
  }
  if (user.role === 'PM' || user.organizationRank === 'PM') return 'GRADE_3';
  return 'GRADE_4';
}

export function hasActiveManagementSupportMembership(
  user: Pick<
    PersonnelCard,
    'departmentId' | 'employmentStatus' | 'organizationMemberships'
  >,
) {
  if (user.organizationMemberships?.length) {
    return user.organizationMemberships.some(
      (membership) =>
        membership.organizationId === MANAGEMENT_SUPPORT_ORGANIZATION_ID &&
        membership.status === 'ACTIVE',
    );
  }

  return (
    user.departmentId === MANAGEMENT_SUPPORT_ORGANIZATION_ID &&
    user.employmentStatus === 'ACTIVE'
  );
}

export function evaluateFinanceAccess(
  user: Pick<
    PersonnelCard,
    | 'accessGrade'
    | 'role'
    | 'organizationRank'
    | 'departmentId'
    | 'employmentStatus'
    | 'organizationMemberships'
    | 'capabilities'
  >,
  mode: RuntimeExecutionMode = getRuntimeExecutionMode(),
): AccessDecision {
  const grade = resolveAccessGrade(user);
  const activeManagementSupport = hasActiveManagementSupportMembership(user);
  const frontendEligible =
    grade === 'ADMIN' || grade === 'GRADE_1' || activeManagementSupport;
  const serverCapability = user.capabilities?.includes(FINANCE_CAPABILITY) ?? false;
  const backendCapabilityRequired = mode !== 'DEMO_LOCAL';

  if (!frontendEligible) {
    return {
      allowed: false,
      frontendEligible,
      backendCapabilityRequired,
      grade,
      reason: 'NOT_ELIGIBLE',
    };
  }

  if (backendCapabilityRequired && !serverCapability) {
    return {
      allowed: false,
      frontendEligible,
      backendCapabilityRequired,
      grade,
      reason: 'BACKEND_CAPABILITY_REQUIRED',
    };
  }

  return {
    allowed: true,
    frontendEligible,
    backendCapabilityRequired,
    grade,
    reason:
      grade === 'ADMIN'
        ? 'ADMIN'
        : grade === 'GRADE_1'
          ? 'GRADE_1'
          : 'ACTIVE_MANAGEMENT_SUPPORT_MEMBERSHIP',
  };
}

export function canManageWorkspaceConfiguration(
  user: Pick<PersonnelCard, 'accessGrade' | 'role' | 'organizationRank'>,
) {
  return resolveAccessGrade(user) === 'ADMIN';
}
