import type {
  PersonnelCard,
  Project,
  ProjectExecutionUnitAssignment,
  ProjectExecutionUnitId,
  TaskCard,
  UserId,
} from '@/types/models';
import { PROJECT_EXECUTION_UNITS } from '@/lib/projectExecutionUnits';

const UNIT_SEARCH_TERMS: Record<ProjectExecutionUnitId, string[]> = {
  FINISH: ['마감', 'finish'],
  STRUCTURE: ['구조', 'structure', 'bim'],
  CIVIL_LANDSCAPE: ['토목', '조경', 'civil', 'landscape'],
  CLAIM: ['클레임', 'claim'],
  DEVELOPMENT: ['개발', 'develop'],
};

const userOrganizationText = (user: PersonnelCard) =>
  [user.departmentId, user.departmentName, user.subDepartmentId, user.subDepartmentName, user.teamId, user.teamName]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase();

export const getProjectAssignment = (
  project: Pick<Project, 'executionAssignments' | 'primaryUnitId'>,
  preferredUnitId?: ProjectExecutionUnitId | null,
) => {
  const assignments = project.executionAssignments || [];
  if (preferredUnitId) {
    const exact = assignments.find((assignment) => assignment.unitId === preferredUnitId);
    if (exact) return exact;
  }
  if (project.primaryUnitId) {
    const primary = assignments.find((assignment) => assignment.unitId === project.primaryUnitId);
    if (primary) return primary;
  }
  return assignments.find((assignment) => assignment.role === 'PRIMARY') || assignments[0];
};

export const getProjectStaffingUnitLabel = (unitId: ProjectExecutionUnitId, language: 'ko' | 'vi' | 'en' = 'ko') => {
  const unit = PROJECT_EXECUTION_UNITS.find((candidate) => candidate.id === unitId);
  if (!unit) return unitId;
  return language === 'vi' ? unit.labelVi : unit.labelKo;
};

export const getEligibleProjectPersonnel = (
  users: PersonnelCard[],
  project: Pick<Project, 'companyId'>,
  unitId: ProjectExecutionUnitId,
) => {
  const terms = UNIT_SEARCH_TERMS[unitId];
  return users.filter((user) => {
    if (user.employmentStatus !== 'ACTIVE' || user.isActive === false) return false;
    if (!project.companyId || user.companyId !== project.companyId) return false;
    const organization = userOrganizationText(user);
    return terms.some((term) => organization.includes(term));
  });
};

export const getProjectStaffingMemberIds = (
  project: Pick<Project, 'id' | 'executionAssignments' | 'primaryUnitId'>,
  tasks: TaskCard[],
  unitId?: ProjectExecutionUnitId | null,
) => {
  const assignment = getProjectAssignment(project, unitId);
  const ids = new Set<UserId>(assignment?.personnelIds || []);
  tasks.forEach((task) => {
    if (task.projectId === project.id && task.assigneeId && !task.isDeleted) ids.add(task.assigneeId);
  });
  if (assignment?.pmId) ids.add(assignment.pmId);
  return Array.from(ids);
};

export const validateProjectStaffing = (pmId: string, personnelIds: string[]) => {
  if (!pmId) return 'PM_REQUIRED' as const;
  if (!personnelIds.includes(pmId)) return 'PM_MUST_BE_INCLUDED' as const;
  if (personnelIds.length === 0) return 'PERSONNEL_REQUIRED' as const;
  return null;
};

export const updateExecutionAssignmentStaffing = ({
  assignments,
  unitId,
  pmId,
  personnelIds,
  actorId,
  updatedAt,
}: {
  assignments: ProjectExecutionUnitAssignment[];
  unitId: ProjectExecutionUnitId;
  pmId: UserId;
  personnelIds: UserId[];
  actorId: UserId;
  updatedAt: string;
}) => assignments.map((assignment) => assignment.unitId === unitId
  ? {
      ...assignment,
      pmId,
      personnelIds: Array.from(new Set([pmId, ...personnelIds])),
      staffingUpdatedAt: updatedAt,
      staffingUpdatedBy: actorId,
    }
  : assignment);
