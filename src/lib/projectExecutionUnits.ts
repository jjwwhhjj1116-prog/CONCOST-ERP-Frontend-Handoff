import type {
  Project,
  ProjectExecutionUnitAssignment,
  ProjectExecutionUnitId,
} from '@/types/models';

export type ProjectBoardGroup = 'TECHNICAL' | 'CLAIM' | 'DEVELOPMENT';
export type ProjectBoardScope =
  | { kind: 'GROUP'; group: ProjectBoardGroup }
  | { kind: 'UNIT'; unitId: ProjectExecutionUnitId };

export const PROJECT_EXECUTION_UNITS: Array<{
  id: ProjectExecutionUnitId;
  labelKo: string;
  labelVi: string;
  group: ProjectBoardGroup;
}> = [
  { id: 'FINISH', labelKo: '마감팀', labelVi: 'Nhóm hoàn thiện', group: 'TECHNICAL' },
  { id: 'STRUCTURE', labelKo: '구조팀', labelVi: 'Nhóm kết cấu', group: 'TECHNICAL' },
  { id: 'CIVIL_LANDSCAPE', labelKo: '토목&조경팀', labelVi: 'Nhóm hạ tầng & cảnh quan', group: 'TECHNICAL' },
  { id: 'CLAIM', labelKo: '클레임센터', labelVi: 'Trung tâm Claim', group: 'CLAIM' },
  { id: 'DEVELOPMENT', labelKo: '개발팀', labelVi: 'Nhóm phát triển', group: 'DEVELOPMENT' },
];

export const isProjectExecutionUnitId = (value: unknown): value is ProjectExecutionUnitId =>
  PROJECT_EXECUTION_UNITS.some((unit) => unit.id === value);

export const normalizeExecutionUnitIds = (values: readonly unknown[] | undefined) =>
  Array.from(new Set((values || []).filter(isProjectExecutionUnitId)));

export const createExecutionAssignments = ({
  projectId,
  targetUnitIds,
  primaryUnitId,
  actorId,
  assignedAt,
}: {
  projectId: string;
  targetUnitIds: readonly ProjectExecutionUnitId[];
  primaryUnitId?: ProjectExecutionUnitId | null;
  actorId: string;
  assignedAt: string;
}): ProjectExecutionUnitAssignment[] => {
  const units = normalizeExecutionUnitIds(targetUnitIds);
  if (!units.length) throw new Error('수주 확정 전에 담당부서를 한 곳 이상 선택해 주세요.');
  const primary = primaryUnitId && units.includes(primaryUnitId) ? primaryUnitId : units[0];
  return units.map((unitId) => ({
    id: `${projectId}:${unitId}`,
    projectId,
    unitId,
    role: unitId === primary ? 'PRIMARY' : 'PARTICIPATING',
    status: 'AWARD_CONFIRMED',
    assignedAt,
    assignedBy: actorId,
  }));
};

export const getProjectBoardScope = (
  groupValue: string | null,
  unitValue: string | null,
  legacyDepartmentValue?: string | null,
): ProjectBoardScope | null => {
  if (isProjectExecutionUnitId(unitValue)) return { kind: 'UNIT', unitId: unitValue };
  if (groupValue === 'TECHNICAL' || groupValue === 'CLAIM' || groupValue === 'DEVELOPMENT') {
    return { kind: 'GROUP', group: groupValue };
  }
  if (isProjectExecutionUnitId(legacyDepartmentValue)) return { kind: 'UNIT', unitId: legacyDepartmentValue };
  return null;
};

const projectUnitIds = (project: Pick<Project, 'assignedUnitIds' | 'executionAssignments'>) =>
  normalizeExecutionUnitIds([
    ...(project.assignedUnitIds || []),
    ...(project.executionAssignments || []).map((assignment) => assignment.unitId),
  ]);

export const matchesProjectBoardScope = (
  project: Pick<Project, 'assignedUnitIds' | 'executionAssignments'>,
  scope: ProjectBoardScope | null,
) => {
  if (!scope) return false;
  const unitIds = projectUnitIds(project);
  if (scope.kind === 'UNIT') return unitIds.includes(scope.unitId);
  const groupUnits = PROJECT_EXECUTION_UNITS
    .filter((unit) => unit.group === scope.group)
    .map((unit) => unit.id);
  return unitIds.some((unitId) => groupUnits.includes(unitId));
};

export const getProjectBoardScopeLabel = (scope: ProjectBoardScope | null) => {
  if (!scope) return '프로젝트 범위를 선택해 주세요';
  if (scope.kind === 'UNIT') return PROJECT_EXECUTION_UNITS.find((unit) => unit.id === scope.unitId)?.labelKo || scope.unitId;
  if (scope.group === 'TECHNICAL') return '기술본부 전체 프로젝트';
  if (scope.group === 'CLAIM') return '클레임센터 전체 프로젝트';
  return '개발팀 전체 프로젝트';
};

export const projectBoardHref = (unitIds: readonly ProjectExecutionUnitId[]) => {
  const primary = normalizeExecutionUnitIds(unitIds)[0];
  if (!primary) return '/projects';
  return `/projects?unit=${primary}`;
};
