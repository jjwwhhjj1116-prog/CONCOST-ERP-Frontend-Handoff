import type {
  Project,
  ProjectExecutionUnitAssignment,
  ProjectIntake,
  ProjectIntakeDraft,
  ProjectIntakeRevisionEventType,
  ProjectIntakeRevisionResult,
} from '@/types/models';
import { normalizeExecutionUnitIds } from '@/lib/projectExecutionUnits';

const stable = (value: unknown) => JSON.stringify(value);
const sorted = <T extends string>(values: readonly T[]) => [...values].sort();

const deliverySnapshot = (draft: ProjectIntakeDraft) => ({
  expectedStartDate: draft.expectedStartDate || null,
  startDateStatus: draft.startDateStatus || (draft.expectedStartDate ? 'SCHEDULED' : 'TBD'),
  firstDelivery: draft.firstDelivery || null,
  secondDelivery: draft.secondDelivery || null,
  thirdDelivery: draft.thirdDelivery || null,
  finalDelivery: draft.finalDelivery || null,
});

const scopeSnapshot = (draft: ProjectIntakeDraft) => ({
  workContent: draft.workContent,
  scopes: sorted(draft.scopes),
  startCondition: draft.commercial.startCondition,
});

const materialSnapshot = (draft: ProjectIntakeDraft) => draft.materials.map((material) => ({
  id: material.id,
  status: material.status,
  fileStatus: material.fileStatus || null,
  fileVersion: material.fileVersion || 0,
}));

export const getAcceptedIntakeRevisionDiff = (before: ProjectIntakeDraft, after: ProjectIntakeDraft) => {
  const beforeUnits = normalizeExecutionUnitIds(before.targetUnitIds);
  const afterUnits = normalizeExecutionUnitIds(after.targetUnitIds);
  const addedUnitIds = afterUnits.filter((unitId) => !beforeUnits.includes(unitId));
  const removedUnitIds = beforeUnits.filter((unitId) => !afterUnits.includes(unitId));
  const changedFields: string[] = [];
  const eventTypes = new Set<ProjectIntakeRevisionEventType>(['PROJECT_INTAKE_UPDATED']);

  if (stable(scopeSnapshot(before)) !== stable(scopeSnapshot(after))) {
    changedFields.push('scope');
    eventTypes.add('PROJECT_INTAKE_SCOPE_CHANGED');
  }
  if (stable(deliverySnapshot(before)) !== stable(deliverySnapshot(after))) {
    changedFields.push('schedule');
    eventTypes.add('PROJECT_INTAKE_SCHEDULE_CHANGED');
  }
  if (before.primaryUnitId !== after.primaryUnitId) changedFields.push('primaryUnitId');
  if (addedUnitIds.length) {
    changedFields.push('unitAdded');
    eventTypes.add('PROJECT_INTAKE_UNIT_ADDED');
  }
  if (removedUnitIds.length) {
    changedFields.push('unitRemoved');
    eventTypes.add('PROJECT_INTAKE_UNIT_REMOVED');
  }
  if (stable(materialSnapshot(before)) !== stable(materialSnapshot(after))) {
    changedFields.push('materials');
    eventTypes.add('PROJECT_INTAKE_ADDITIONAL_MATERIAL_ADDED');
  }
  if (before.projectName !== after.projectName) changedFields.push('projectName');
  if (before.request !== after.request || before.notes !== after.notes) changedFields.push('request');
  if (stable(before.contacts) !== stable(after.contacts)) changedFields.push('contacts');

  return { addedUnitIds, removedUnitIds, changedFields, eventTypes: Array.from(eventTypes) };
};

const reviseAssignments = ({
  project,
  draft,
  actorId,
  revisedAt,
}: {
  project: Project;
  draft: ProjectIntakeDraft;
  actorId: string;
  revisedAt: string;
}) => {
  const targetUnitIds = normalizeExecutionUnitIds(draft.targetUnitIds);
  if (!targetUnitIds.length) throw new Error('담당부서를 한 곳 이상 선택해 주세요.');
  if (!draft.primaryUnitId || !targetUnitIds.includes(draft.primaryUnitId)) {
    throw new Error('주관부서를 선택한 담당부서 중에서 지정해 주세요.');
  }
  const previous = project.executionAssignments || [];
  const previousByUnit = new Map(previous.map((assignment) => [assignment.unitId, assignment]));
  const active = targetUnitIds.map((unitId): ProjectExecutionUnitAssignment => {
    const existing = previousByUnit.get(unitId);
    return {
      ...(existing || {
        id: `${project.id}:${unitId}`,
        projectId: project.id,
        unitId,
        assignedAt: revisedAt,
        assignedBy: actorId,
      }),
      role: unitId === draft.primaryUnitId ? 'PRIMARY' : 'PARTICIPATING',
      status: existing?.status === 'ACTIVE' || existing?.status === 'COMPLETED' ? existing.status : 'START_PLANNED',
    };
  });
  const removed = previous
    .filter((assignment) => !targetUnitIds.includes(assignment.unitId) && assignment.status !== 'REMOVED')
    .map((assignment): ProjectExecutionUnitAssignment => ({
      ...assignment,
      role: 'PARTICIPATING',
      status: 'REMOVED',
    }));
  const retainedRemoved = previous.filter((assignment) => assignment.status === 'REMOVED' && !targetUnitIds.includes(assignment.unitId));
  return [...active, ...removed, ...retainedRemoved];
};

export const buildAcceptedIntakeRevision = ({
  intake,
  project,
  draft,
  reason,
  actorId,
  revisedAt,
  historyId,
}: {
  intake: ProjectIntake;
  project: Project;
  draft: ProjectIntakeDraft;
  reason: string;
  actorId: string;
  revisedAt: string;
  historyId: string;
}): ProjectIntakeRevisionResult => {
  if (intake.status !== 'ACCEPTED') throw new Error('수주 완료된 프로젝트 접수만 수정본을 저장할 수 있습니다.');
  if (!reason.trim()) throw new Error('수정 사유를 입력해 주세요.');
  if (intake.projectId !== project.id) throw new Error('Canonical project lineage mismatch');
  const before = intake.draft || JSON.parse(intake.draftJson || '{}') as ProjectIntakeDraft;
  const diff = getAcceptedIntakeRevisionDiff(before, draft);
  if (!diff.changedFields.length) throw new Error('변경된 접수 내용이 없습니다.');
  const previousMaterialIds = new Set(before.materials.map((material) => material.id));
  const unreadyAdditionalMaterial = draft.materials.find((material) => (
    !previousMaterialIds.has(material.id) && material.fileStatus !== 'READY'
  ));
  if (unreadyAdditionalMaterial) {
    throw new Error('추가자료는 업로드가 완료된 READY 파일만 저장할 수 있습니다.');
  }
  const assignments = reviseAssignments({ project, draft, actorId, revisedAt });
  const activeAssignments = assignments.filter((assignment) => assignment.status !== 'REMOVED');
  if (activeAssignments.filter((assignment) => assignment.role === 'PRIMARY').length !== 1) {
    throw new Error('활성 주관부서는 정확히 1개여야 합니다.');
  }
  const revision = intake.version + 1;
  const updatedIntake: ProjectIntake = {
    ...intake,
    status: 'ACCEPTED',
    projectNo: intake.projectNo,
    draft,
    draftJson: JSON.stringify(draft),
    version: revision,
    updatedBy: actorId,
    updatedAt: revisedAt,
    histories: [{
      id: historyId,
      projectIntakeId: intake.id,
      action: 'ACCEPTED_REVISION_SAVED',
      fromStatus: 'ACCEPTED',
      toStatus: 'ACCEPTED',
      changesJson: JSON.stringify({
        revision,
        reason: reason.trim(),
        changedFields: diff.changedFields,
        before: {
          units: before.targetUnitIds,
          primaryUnitId: before.primaryUnitId,
          schedule: deliverySnapshot(before),
          materialCount: before.materials.length,
        },
        after: {
          units: draft.targetUnitIds,
          primaryUnitId: draft.primaryUnitId,
          schedule: deliverySnapshot(draft),
          materialCount: draft.materials.length,
        },
      }),
      actorId,
      createdAt: revisedAt,
    }, ...(intake.histories || [])],
  };
  const updatedProject: Project = {
    ...project,
    projectNo: project.projectNo || intake.projectNo,
    title: draft.projectName || project.title,
    primaryUnitId: draft.primaryUnitId,
    assignedUnitIds: normalizeExecutionUnitIds(draft.targetUnitIds),
    executionAssignments: assignments,
    startDateStatus: draft.startDateStatus || (draft.expectedStartDate ? 'SCHEDULED' : 'TBD'),
    startDate: draft.startDateStatus === 'TBD' ? undefined : draft.expectedStartDate || undefined,
    deliveryDate: draft.finalDelivery || project.deliveryDate,
    updatedAt: revisedAt,
  };
  return {
    intake: updatedIntake,
    project: updatedProject,
    assignments,
    revision,
    changedFields: diff.changedFields,
    eventTypes: diff.eventTypes,
  };
};
