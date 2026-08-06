import type {
  PersonnelCard,
  Project,
  ProjectExecutionUnitAssignment,
  ProjectExecutionUnitAssignmentStatus,
  ProjectExecutionUnitId,
  ProjectStaffingPlanStatus,
  ProjectStaffingRoleAssignment,
  TaskCard,
  UserId,
} from '@/types/models';
import { PROJECT_EXECUTION_UNITS } from '@/lib/projectExecutionUnits';

export const PROJECT_STAFFING_ROLE_CATALOG: Record<ProjectExecutionUnitId, readonly string[]> = {
  FINISH: ['PM', '가설', '세대', '내부', '외부', '창호', '조적'],
  STRUCTURE: ['PM', '기초', '기둥', '보', '슬라브', '옹벽'],
  CIVIL_LANDSCAPE: ['PM', '토공', '부대토목', '조경'],
  CLAIM: ['PM', '제안서 작성', '자료 및 현장조사', '보고서 작성'],
  DEVELOPMENT: ['PM', '기획', 'FRONTEND', 'BACKEND'],
};

const ROLE_LABELS_VI: Record<ProjectExecutionUnitId, readonly string[]> = {
  FINISH: ['PM', 'Tạm', 'Căn hộ', 'Nội thất', 'Ngoại thất', 'Cửa', 'Xây'],
  STRUCTURE: ['PM', 'Móng', 'Cột', 'Dầm', 'Sàn', 'Tường chắn'],
  CIVIL_LANDSCAPE: ['PM', 'Đào đắp', 'Hạ tầng phụ trợ', 'Cảnh quan'],
  CLAIM: ['PM', 'Lập đề xuất', 'Tài liệu & khảo sát', 'Lập báo cáo'],
  DEVELOPMENT: ['PM', 'Kế hoạch', 'FRONTEND', 'BACKEND'],
};

const ROLE_LABELS_EN: Record<ProjectExecutionUnitId, readonly string[]> = {
  FINISH: ['PM', 'Temporary works', 'Units', 'Interior', 'Exterior', 'Windows', 'Masonry'],
  STRUCTURE: ['PM', 'Foundation', 'Columns', 'Beams', 'Slabs', 'Retaining walls'],
  CIVIL_LANDSCAPE: ['PM', 'Earthworks', 'Site civil', 'Landscape'],
  CLAIM: ['PM', 'Proposal', 'Research & site survey', 'Report'],
  DEVELOPMENT: ['PM', 'Planning', 'FRONTEND', 'BACKEND'],
};

const UNIT_ID_ALIASES: Record<ProjectExecutionUnitId, readonly string[]> = {
  FINISH: ['FINISH'],
  STRUCTURE: ['STRUCTURE'],
  CIVIL_LANDSCAPE: ['CIVIL_LANDSCAPE', 'CIVIL'],
  CLAIM: ['CLAIM'],
  DEVELOPMENT: ['DEVELOPMENT', 'DEVELOP'],
};

const UNIT_NAME_ALIASES: Record<ProjectExecutionUnitId, readonly string[]> = {
  FINISH: ['마감', '마감팀', 'FINISH', 'FINISH TEAM'],
  STRUCTURE: ['구조', '구조팀', 'STRUCTURE', 'STRUCTURE TEAM'],
  CIVIL_LANDSCAPE: ['토목&조경', '토목&조경팀', '토목조경', 'CIVIL & LANDSCAPE'],
  CLAIM: ['클레임센터', 'CLAIM CENTER'],
  DEVELOPMENT: ['개발팀', 'DEVELOPMENT TEAM'],
};

const normalized = (value?: string | null) => (value || '').trim().toLocaleUpperCase();

const isActivePersonnel = (user: PersonnelCard) => user.employmentStatus === 'ACTIVE' && user.isActive !== false;

const isExactUnitMember = (user: PersonnelCard, unitId: ProjectExecutionUnitId) => {
  const ids = UNIT_ID_ALIASES[unitId].map(normalized);
  if (user.organizationMemberships?.some((membership) => (
    membership.status === 'ACTIVE' && ids.includes(normalized(membership.organizationId))
  ))) return true;

  const legacyIds = [user.departmentId, user.subDepartmentId, user.teamId].map(normalized);
  if (legacyIds.some((id) => ids.includes(id))) return true;

  const names = UNIT_NAME_ALIASES[unitId].map(normalized);
  return [user.departmentName, user.subDepartmentName, user.teamName]
    .map(normalized)
    .some((name) => names.includes(name));
};

export const getProjectAssignment = (
  project: Pick<Project, 'executionAssignments' | 'primaryUnitId'>,
  preferredUnitId?: ProjectExecutionUnitId | null,
) => {
  const assignments = project.executionAssignments || [];
  if (preferredUnitId) {
    return assignments.find((assignment) => assignment.unitId === preferredUnitId);
  }
  if (project.primaryUnitId) {
    const primary = assignments.find((assignment) => assignment.unitId === project.primaryUnitId);
    if (primary) return primary;
  }
  return assignments.find((assignment) => assignment.role === 'PRIMARY');
};

export const getProjectAssignmentForContext = (
  project: Pick<Project, 'executionAssignments' | 'primaryUnitId'>,
  contextUnitId?: ProjectExecutionUnitId | null,
) => {
  const assignments = project.executionAssignments || [];
  if (contextUnitId) {
    return assignments.find((assignment) => assignment.unitId === contextUnitId);
  }
  if (project.primaryUnitId) {
    const primary = assignments.find((assignment) => assignment.unitId === project.primaryUnitId);
    if (primary) return primary;
  }
  return assignments.find((assignment) => assignment.role === 'PRIMARY');
};

export const getProjectStaffingUnitLabel = (unitId: ProjectExecutionUnitId, language: 'ko' | 'vi' | 'en' = 'ko') => {
  const unit = PROJECT_EXECUTION_UNITS.find((candidate) => candidate.id === unitId);
  if (!unit) return unitId;
  if (language === 'vi') return unit.labelVi;
  if (language === 'en') return unit.id.replaceAll('_', ' ');
  return unit.labelKo;
};

export const getProjectStaffingRoleLabel = (
  unitId: ProjectExecutionUnitId,
  roleLabel: string,
  language: 'ko' | 'vi' | 'en' = 'ko',
) => {
  const index = PROJECT_STAFFING_ROLE_CATALOG[unitId].indexOf(roleLabel);
  if (index < 0 || language === 'ko') return roleLabel;
  return (language === 'vi' ? ROLE_LABELS_VI : ROLE_LABELS_EN)[unitId][index] || roleLabel;
};

export const getEligibleProjectPersonnel = (
  users: PersonnelCard[],
  project: Pick<Project, 'companyId'>,
  unitId: ProjectExecutionUnitId,
) => users.filter((user) => (
  isActivePersonnel(user)
  && Boolean(project.companyId)
  && user.companyId === project.companyId
  && isExactUnitMember(user, unitId)
));

export const getSupportProjectPersonnel = (
  users: PersonnelCard[],
  project: Pick<Project, 'companyId'>,
  unitId: ProjectExecutionUnitId,
) => users.filter((user) => (
  isActivePersonnel(user)
  && Boolean(project.companyId)
  && user.companyId === project.companyId
  && !isExactUnitMember(user, unitId)
));

export const createProjectStaffingPlan = (
  unitId: ProjectExecutionUnitId,
  existing: ProjectStaffingRoleAssignment[] = [],
) => PROJECT_STAFFING_ROLE_CATALOG[unitId].map((roleLabel, index) => {
  const roleId = index === 0 ? 'PM' : `${unitId}:${index}`;
  const previous = existing.find((role) => role.roleId === roleId || role.roleLabel === roleLabel);
  return previous
    ? { ...previous, roleId, roleLabel, personnelIds: Array.from(new Set(previous.personnelIds)) }
    : { roleId, roleLabel, personnelIds: [], startDate: null, endDate: null };
});

export const getProjectStaffingMemberIds = (
  project: Pick<Project, 'id' | 'executionAssignments' | 'primaryUnitId'>,
  tasks: TaskCard[],
  unitId?: ProjectExecutionUnitId | null,
) => {
  const assignment = getProjectAssignment(project, unitId);
  const ids = new Set<UserId>(assignment?.staffingPlan?.flatMap((role) => role.personnelIds) || assignment?.personnelIds || []);
  tasks.forEach((task) => {
    if (task.projectId === project.id && task.assigneeId && !task.isDeleted) ids.add(task.assigneeId);
  });
  if (assignment?.pmId) ids.add(assignment.pmId);
  return Array.from(ids);
};

export const validateProjectStaffingPlan = (
  plan: ProjectStaffingRoleAssignment[],
  status: ProjectStaffingPlanStatus,
) => {
  const expectedRoles = plan.map((role) => role.roleLabel);
  const duplicateRole = expectedRoles.find((label, index) => expectedRoles.indexOf(label) !== index);
  if (duplicateRole) return 'DUPLICATE_ROLE' as const;
  const pm = plan.find((role) => role.roleId === 'PM' || role.roleLabel === 'PM');
  if (status !== 'DRAFT' && (!pm || pm.personnelIds.length !== 1)) return 'PM_EXACTLY_ONE_REQUIRED' as const;
  if (plan.some((role) => role.startDate && role.endDate && role.startDate > role.endDate)) return 'INVALID_DATE_RANGE' as const;
  return null;
};

export const validateProjectStaffing = (pmId: string, personnelIds: string[]) => {
  if (!pmId) return 'PM_REQUIRED' as const;
  if (!personnelIds.includes(pmId)) return 'PM_MUST_BE_INCLUDED' as const;
  return null;
};

export const isProjectStaffingReady = (assignment?: ProjectExecutionUnitAssignment) => (
  Boolean(assignment)
  && (assignment?.staffingStatus === 'CONFIRMED' || assignment?.staffingStatus === 'ACTIVE')
  && validateProjectStaffingPlan(assignment?.staffingPlan || [], assignment?.staffingStatus || 'DRAFT') === null
);

export const updateExecutionAssignmentStaffing = ({
  assignments,
  unitId,
  staffingPlan,
  staffingStatus,
  actorId,
  updatedAt,
  reason,
}: {
  assignments: ProjectExecutionUnitAssignment[];
  unitId: ProjectExecutionUnitId;
  staffingPlan: ProjectStaffingRoleAssignment[];
  staffingStatus: ProjectStaffingPlanStatus;
  actorId: UserId;
  updatedAt: string;
  reason: string;
}): ProjectExecutionUnitAssignment[] => assignments.map((assignment) => {
  if (assignment.unitId !== unitId) return assignment;
  const validation = validateProjectStaffingPlan(staffingPlan, staffingStatus);
  if (validation) throw new Error(validation);
  const pmId = staffingPlan.find((role) => role.roleId === 'PM' || role.roleLabel === 'PM')?.personnelIds[0] || null;
  const personnelIds = Array.from(new Set(staffingPlan.flatMap((role) => role.personnelIds)));
  const revision = (assignment.staffingRevision || 0) + 1;
  const previousStatus = assignment.staffingStatus || 'DRAFT';
  const action = staffingStatus === 'ACTIVE'
    ? 'PROJECT_STAFFING_STARTED'
    : staffingStatus === 'CONFIRMED'
      ? 'PROJECT_STAFFING_CONFIRMED'
      : previousStatus === 'DRAFT'
        ? 'PROJECT_STAFFING_DRAFT_SAVED'
        : 'PROJECT_STAFFING_CHANGED';
  const beforeJson = JSON.stringify({
    staffingStatus: previousStatus,
    staffingPlan: assignment.staffingPlan || [],
    pmId: assignment.pmId || null,
    personnelIds: assignment.personnelIds || [],
  });
  const afterJson = JSON.stringify({ staffingStatus, staffingPlan, pmId, personnelIds });
  return {
    ...assignment,
    status: (staffingStatus === 'ACTIVE' ? 'ACTIVE' : 'START_PLANNED') as ProjectExecutionUnitAssignmentStatus,
    pmId,
    personnelIds,
    staffingPlan,
    staffingStatus,
    staffingRevision: revision,
    staffingHistories: [{
      id: `staffing-history-${assignment.id}-${revision}`,
      action,
      beforeJson,
      afterJson,
      actorId,
      reason,
      revision,
      createdAt: updatedAt,
    }, ...(assignment.staffingHistories || [])],
    staffingUpdatedAt: updatedAt,
    staffingUpdatedBy: actorId,
  };
});
