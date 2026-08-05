import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  projectIntakeApi,
  ProjectIntakeApiError,
  ProjectIntakeCompanyId,
} from '@/lib/projectIntakeApi';
import {
  buildProjectIntakeDraft,
  createBlankProjectIntakeDraft,
  evaluateProjectIntakeCompleteness,
  validateSecretReferences,
} from '@/lib/projectIntake';
import { getProjectIntakePersistenceMode } from '@/lib/runtimeExecutionMode';
import { buildEstimatePipelineDbInput } from '@/lib/estimatePipelineDatabase';
import { completeExecutionAssignments } from '@/lib/projectExecutionUnits';
import { useEstimateDatabaseStore } from '@/store/estimateDatabaseStore';
import { useEstimateRequestStore } from '@/store/estimateRequestStore';
import { useProjectStore } from '@/store/projectStore';
import { useProjectPmScheduleStore } from '@/store/projectPmScheduleStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuditStore } from '@/store/auditStore';
import { useUiStore } from '@/store/uiStore';
import {
  Project,
  ProjectIntake,
  ProjectIntakeCompletionResult,
  ProjectIntakeDraft,
  ProjectIntakeHistory,
  ProjectIntakeStatus,
  Role,
} from '@/types/models';

type PersistenceMode = 'CHECKING' | 'SERVER' | 'LOCAL_DEMO';
type IntakeActor = { id: string; role: Role; departmentId: string };

interface ProjectIntakeState {
  intakes: ProjectIntake[];
  scopeCompanyId: ProjectIntakeCompanyId | null;
  persistenceMode: PersistenceMode;
  loading: boolean;
  error: string | null;
  sync: (actor: IntakeActor) => Promise<void>;
  createDraft: (actor: IntakeActor) => ProjectIntake;
  duplicateDraft: (id: string, actor: IntakeActor) => ProjectIntake;
  deleteDraft: (id: string, actor: IntakeActor) => void;
  discardDraft: (id: string, actor: IntakeActor) => void;
  saveDraft: (id: string, draft: ProjectIntakeDraft, actor: IntakeActor) => Promise<ProjectIntake>;
  review: (id: string, draft: ProjectIntakeDraft, note: string, actor: IntakeActor) => Promise<ProjectIntake>;
  accept: (id: string, note: string, actor: IntakeActor) => Promise<ProjectIntake>;
  finalizeWonIntake: (id: string, draft: ProjectIntakeDraft, note: string, actor: IntakeActor) => Promise<ProjectIntakeCompletionResult>;
}

const now = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
const selectedCompanyId = (): ProjectIntakeCompanyId => useUiStore.getState().brandWorkspace;
let syncSequence = 0;
const replace = (items: ProjectIntake[], intake: ProjectIntake) =>
  items.map((item) => item.id === intake.id ? intake : item);

const findSourceRequest = (intake: ProjectIntake) =>
  useEstimateRequestStore.getState().requests.find((request) => request.id === intake.estimateRequestId);

const upsertLocalPipelineRecord = async (
  intake: ProjectIntake,
  draft: ProjectIntakeDraft,
  status: ProjectIntakeStatus,
  actorId: string,
  occurredAt: string,
) => {
  const request = findSourceRequest(intake);
  if (!request) return;
  await useEstimateDatabaseStore.getState().upsertPipelineRecord(
    buildEstimatePipelineDbInput(request, {
      stage: 'INTAKE',
      projectId: intake.projectId,
      intakeId: intake.id,
      intakeStatus: status,
      intakeDraft: draft,
      occurredAt,
    }),
    actorId,
  );
};

const localPermissions = (intake: ProjectIntake, actor: IntakeActor) => {
  const source = findSourceRequest(intake);
  const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(actor.role);
  const isManager = actor.role === 'DEPARTMENT_MANAGER' && source?.departmentId === actor.departmentId;
  const isOwnedStandaloneDraft = !intake.estimateRequestId
    && !intake.commercialDecisionId
    && intake.createdBy === actor.id
    && ['PM', 'DEPARTMENT_MANAGER'].includes(actor.role);
  return {
    canEdit: intake.status !== 'ACCEPTED' && (isAdmin || isManager || isOwnedStandaloneDraft),
    canReview: intake.status !== 'ACCEPTED' && (isAdmin || isManager || (isOwnedStandaloneDraft && actor.role === 'DEPARTMENT_MANAGER')),
  };
};

const hydrateLocal = (intake: ProjectIntake, actor: IntakeActor): ProjectIntake => {
  const draft = buildProjectIntakeDraft(intake);
  return {
    ...intake,
    draft,
    draftJson: JSON.stringify(draft),
    completeness: { missing: evaluateProjectIntakeCompleteness(draft) },
    permissions: localPermissions(intake, actor),
    histories: intake.histories || [],
  };
};

const localHistory = (
  intake: ProjectIntake,
  action: string,
  actorId: string,
  fromStatus: ProjectIntakeStatus,
  toStatus: ProjectIntakeStatus,
  changes: Record<string, unknown>,
): ProjectIntakeHistory => ({
  id: newId('project-intake-history'),
  projectIntakeId: intake.id,
  action,
  fromStatus,
  toStatus,
  changesJson: JSON.stringify(changes),
  actorId,
  createdAt: now(),
});

const mergeIntakesFromRequests = (existing: ProjectIntake[], actor: IntakeActor) => {
  const retained = existing.filter((item) => {
    if (item.status !== 'DRAFT' || item.estimateRequestId || item.commercialDecisionId || !item.projectId.startsWith('pending-project-')) return true;
    const draft = item.draft || buildProjectIntakeDraft(item);
    return Boolean(draft.projectName.trim() || draft.projectNo.trim() || (item.histories?.length || 0));
  });
  const byId = new Map(retained.map((item) => [item.id, item]));
  useEstimateRequestStore.getState().requests.forEach((request) => {
    if (!request.projectIntake) return;
    if (!byId.has(request.projectIntake.id)) byId.set(request.projectIntake.id, request.projectIntake);
  });
  return Array.from(byId.values()).map((item) => hydrateLocal(item, actor))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

const assertEdit = (intake: ProjectIntake, actor: IntakeActor) => {
  if (!localPermissions(intake, actor).canEdit) throw new Error('You do not have permission to edit this project intake');
  if (intake.status === 'ACCEPTED') throw new Error('An accepted project intake is immutable');
};

const assertReview = (intake: ProjectIntake, actor: IntakeActor) => {
  if (!localPermissions(intake, actor).canReview) throw new Error('You do not have permission to review this project intake');
  if (intake.status === 'ACCEPTED') throw new Error('An accepted project intake is immutable');
};

const completionStartDateStatus = (draft: ProjectIntakeDraft): 'SCHEDULED' | 'TBD' => (
  draft.startDateStatus === 'TBD' || !draft.expectedStartDate.trim() ? 'TBD' : 'SCHEDULED'
);

const assertCompletionPostconditions = (result: ProjectIntakeCompletionResult) => {
  const assignedUnitIds = Array.from(new Set(result.project.assignedUnitIds || []));
  const assignmentUnitIds = Array.from(new Set(result.assignments.map((item) => item.unitId)));
  if (result.intake.status !== 'ACCEPTED') throw new Error('수주 완료 검증 실패: 접수 상태가 ACCEPTED가 아닙니다.');
  if (result.project.publicationStatus !== 'PUBLISHED') throw new Error('수주 완료 검증 실패: 프로젝트가 게시되지 않았습니다.');
  if (result.project.status !== 'MANAGER_REVIEW') throw new Error('수주 완료 검증 실패: 프로젝트가 착수 전 상태가 아닙니다.');
  if (!result.projectNo.trim() || result.project.projectNo !== result.projectNo) throw new Error('수주 완료 검증 실패: 프로젝트 번호가 일치하지 않습니다.');
  if (!result.project.primaryUnitId || result.assignments.filter((item) => item.role === 'PRIMARY').length !== 1) {
    throw new Error('수주 완료 검증 실패: 주관부서는 정확히 한 곳이어야 합니다.');
  }
  if (result.assignments.some((item) => item.status !== 'START_PLANNED')) {
    throw new Error('수주 완료 검증 실패: 담당부서 배정 상태가 착수 예정이 아닙니다.');
  }
  if (assignedUnitIds.length !== assignmentUnitIds.length || assignedUnitIds.some((unitId) => !assignmentUnitIds.includes(unitId))) {
    throw new Error('수주 완료 검증 실패: 담당부서와 실행 배정이 일치하지 않습니다.');
  }
};

const completionFromProject = (
  intake: ProjectIntake,
  project: Project,
  idempotent: boolean,
): ProjectIntakeCompletionResult => {
  const result: ProjectIntakeCompletionResult = {
    intake,
    project,
    assignments: project.executionAssignments || [],
    projectNo: intake.projectNo || project.projectNo || '',
    startDateStatus: project.startDateStatus || (project.startDate ? 'SCHEDULED' : 'TBD'),
    idempotent,
  };
  assertCompletionPostconditions(result);
  return result;
};

export const useProjectIntakeStore = create<ProjectIntakeState>()(persist((set, get) => ({
  intakes: [],
  scopeCompanyId: null,
  persistenceMode: getProjectIntakePersistenceMode(),
  loading: false,
  error: null,

  sync: async (actor) => {
    const companyId = selectedCompanyId();
    const runtimePersistence = getProjectIntakePersistenceMode();
    const sequence = ++syncSequence;
    set((state) => ({
      intakes: state.scopeCompanyId === companyId ? state.intakes : [],
      scopeCompanyId: companyId,
      loading: true,
      error: null,
    }));
    if (runtimePersistence === 'LOCAL_DEMO') {
      set((state) => ({
        intakes: mergeIntakesFromRequests(state.intakes, actor),
        persistenceMode: 'LOCAL_DEMO',
        loading: false,
      }));
      return;
    }
    try {
      const intakes = await projectIntakeApi.list(companyId);
      if (sequence !== syncSequence || selectedCompanyId() !== companyId) return;
      set({ intakes, persistenceMode: 'SERVER', loading: false });
    } catch (caught) {
      if (sequence !== syncSequence || selectedCompanyId() !== companyId) return;
      set({
        persistenceMode: 'SERVER',
        loading: false,
        error: caught instanceof Error ? caught.message : 'Project intake synchronization failed',
      });
    }
  },

  createDraft: (actor) => {
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('서버 CREATE API가 준비되지 않아 접수를 생성하지 않았습니다.');
    }
    const timestamp = now();
    const id = newId('project-intake');
    const projectId = newId('pending-project');
    const draft = createBlankProjectIntakeDraft(id, projectId);
    const intake = hydrateLocal({
      id,
      estimateRequestId: '',
      commercialDecisionId: '',
      projectId,
      status: 'DRAFT',
      projectNo: '',
      sourceSnapshotJson: JSON.stringify({ source: {}, project: {}, decision: {}, attachments: [] }),
      draft,
      draftJson: JSON.stringify(draft),
      version: 1,
      createdBy: actor.id,
      updatedBy: actor.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      histories: [],
    }, actor);
    set((state) => ({
      intakes: [intake, ...state.intakes],
      scopeCompanyId: selectedCompanyId(),
    }));
    return intake;
  },

  duplicateDraft: (id, actor) => {
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('프로젝트 접수 복제 API가 준비되지 않았습니다. 서버 데이터는 변경하지 않았습니다.');
    }
    const sourceIntake = get().intakes.find((item) => item.id === id);
    if (!sourceIntake) throw new Error('Project intake not found');
    const timestamp = now();
    const intakeId = newId('project-intake');
    const projectId = newId('pending-project');
    const sourceDraft = buildProjectIntakeDraft(sourceIntake);
    const draft: ProjectIntakeDraft = {
      ...structuredClone(sourceDraft),
      projectName: `${sourceDraft.projectName || '새 프로젝트'} (복사본)`,
      projectNo: '',
      contacts: sourceDraft.contacts.map((contact) => ({ ...contact, id: newId('contact') })),
      materials: sourceDraft.materials.map((material) => ({ ...material, id: newId('material') })),
      secretReferences: sourceDraft.secretReferences.map((secret) => ({ ...secret, id: newId('secret-reference') })),
      source: {
        estimateRequestId: '',
        requestNo: intakeId,
        estimateId: null,
        estimateSheetId: null,
        estimateSubmissionId: null,
        estimateDocumentHash: null,
        commercialDecisionId: '',
        projectId,
      },
    };
    const intake = hydrateLocal({
      id: intakeId,
      estimateRequestId: '',
      commercialDecisionId: '',
      projectId,
      status: 'DRAFT',
      projectNo: '',
      sourceSnapshotJson: JSON.stringify({ duplicatedFrom: id }),
      draft,
      draftJson: JSON.stringify(draft),
      version: 1,
      createdBy: actor.id,
      updatedBy: actor.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      histories: [],
    }, actor);
    set((state) => ({ intakes: [intake, ...state.intakes] }));
    return intake;
  },

  deleteDraft: (id, actor) => {
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('프로젝트 접수 삭제 API가 준비되지 않았습니다. 서버 데이터는 삭제하지 않았습니다.');
    }
    const intake = get().intakes.find((item) => item.id === id);
    if (!intake) throw new Error('Project intake not found');
    assertEdit(intake, actor);
    if (intake.status !== 'DRAFT' || intake.estimateRequestId || intake.commercialDecisionId) {
      throw new Error('수주 계보와 연결된 접수는 삭제할 수 없습니다. 접수 내용을 수정하거나 수주 정정 절차를 사용해 주세요.');
    }
    set((state) => ({ intakes: state.intakes.filter((item) => item.id !== id) }));
  },

  discardDraft: (id, actor) => {
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('Server project intakes cannot be discarded locally');
    }
    const intake = get().intakes.find((item) => item.id === id);
    if (!intake) return;
    const isTemporaryDraft = intake.status === 'DRAFT'
      && intake.createdBy === actor.id
      && (intake.histories?.length || 0) === 0
      && !intake.estimateRequestId
      && !intake.commercialDecisionId;
    if (!isTemporaryDraft) {
      throw new Error('Only an unsaved project intake draft can be discarded');
    }
    set((state) => ({ intakes: state.intakes.filter((item) => item.id !== id) }));
  },

  saveDraft: async (id, draft, actor) => {
    const current = get().intakes.find((item) => item.id === id);
    if (!current) throw new Error('Project intake not found');
    validateSecretReferences(draft.secretReferences);
    if (get().persistenceMode === 'SERVER') {
      const companyId = selectedCompanyId();
      const updated = await projectIntakeApi.save(companyId, id, current.version, draft);
      if (selectedCompanyId() !== companyId || get().scopeCompanyId !== companyId) {
        throw new ProjectIntakeApiError('Company workspace changed while saving project intake', 409);
      }
      set((state) => ({ intakes: replace(state.intakes, updated) }));
      return updated;
    }
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('Project intake persistence is still being initialized. Please retry.');
    }
    assertEdit(current, actor);
    const timestamp = now();
    const changes = {
      version: current.version + 1,
      contactCount: draft.contacts.length,
      materialCount: draft.materials.length,
      secretReferenceCount: draft.secretReferences.length,
    };
    const updated = hydrateLocal({
      ...current,
      projectNo: draft.projectNo,
      draft,
      draftJson: JSON.stringify(draft),
      version: current.version + 1,
      updatedBy: actor.id,
      updatedAt: timestamp,
      histories: [localHistory(current, 'DRAFT_SAVED', actor.id, current.status, current.status, changes), ...(current.histories || [])],
    }, actor);
    set((state) => ({ intakes: replace(state.intakes, updated) }));
    await upsertLocalPipelineRecord(updated, draft, updated.status, actor.id, timestamp);
    return updated;
  },

  review: async (id, draft, note, actor) => {
    const current = get().intakes.find((item) => item.id === id);
    if (!current) throw new Error('Project intake not found');
    validateSecretReferences(draft.secretReferences);
    const missing = evaluateProjectIntakeCompleteness(draft);
    if (missing.length) throw new Error(`Project intake is incomplete: ${missing.join(', ')}`);
    if (get().persistenceMode === 'SERVER') {
      const companyId = selectedCompanyId();
      const updated = await projectIntakeApi.review(companyId, id, current.version, draft, note);
      if (selectedCompanyId() !== companyId || get().scopeCompanyId !== companyId) {
        throw new ProjectIntakeApiError('Company workspace changed while reviewing project intake', 409);
      }
      set((state) => ({ intakes: replace(state.intakes, updated) }));
      return updated;
    }
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('Project intake persistence is still being initialized. Please retry.');
    }
    assertReview(current, actor);
    const timestamp = now();
    const updated = hydrateLocal({
      ...current,
      status: 'REVIEWED',
      projectNo: draft.projectNo,
      draft,
      draftJson: JSON.stringify(draft),
      reviewNote: note,
      reviewedBy: actor.id,
      reviewedAt: timestamp,
      version: current.version + 1,
      updatedBy: actor.id,
      updatedAt: timestamp,
      histories: [localHistory(current, 'REVIEWED', actor.id, current.status, 'REVIEWED', { note }), ...(current.histories || [])],
    }, actor);
    set((state) => ({ intakes: replace(state.intakes, updated) }));
    await upsertLocalPipelineRecord(updated, draft, updated.status, actor.id, timestamp);
    return updated;
  },

  accept: async (id, note, actor) => {
    const current = get().intakes.find((item) => item.id === id);
    if (!current) throw new Error('Project intake not found');
    if (get().persistenceMode === 'SERVER') {
      const companyId = selectedCompanyId();
      const updated = await projectIntakeApi.accept(companyId, id, current.version, note);
      if (selectedCompanyId() !== companyId || get().scopeCompanyId !== companyId) {
        throw new ProjectIntakeApiError('Company workspace changed while accepting project intake', 409);
      }
      set((state) => ({ intakes: replace(state.intakes, updated) }));
      return updated;
    }
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('Project intake persistence is still being initialized. Please retry.');
    }
    assertReview(current, actor);
    if (current.status !== 'REVIEWED') throw new Error('A project intake must be reviewed before acceptance');
    const draft = buildProjectIntakeDraft(current);
    const missing = evaluateProjectIntakeCompleteness(draft);
    if (missing.length) throw new Error(`Project intake is incomplete: ${missing.join(', ')}`);
    const timestamp = now();
    const projectStore = useProjectStore.getState();
    projectStore.replaceProjects(projectStore.projects.map((project) => project.id === current.projectId ? {
      ...project,
      status: 'MANAGER_REVIEW',
      executionAssignments: (project.executionAssignments || []).map((assignment) => ({ ...assignment, status: 'START_PLANNED' as const })),
      updatedAt: timestamp,
    } : project));
    await useProjectPmScheduleStore.getState().sync(actor);
    const updated = {
      ...current,
      status: 'ACCEPTED' as const,
      reviewNote: note || current.reviewNote,
      acceptedBy: actor.id,
      acceptedAt: timestamp,
      version: current.version + 1,
      updatedBy: actor.id,
      updatedAt: timestamp,
      permissions: { canEdit: false, canReview: false },
      histories: [localHistory(current, 'ACCEPTED', actor.id, current.status, 'ACCEPTED', { note, projectStatus: 'MANAGER_REVIEW' }), ...(current.histories || [])],
    };
    set((state) => ({ intakes: replace(state.intakes, updated) }));
    await upsertLocalPipelineRecord(updated, draft, updated.status, actor.id, timestamp);
    return updated;
  },

  finalizeWonIntake: async (id, draft, note, actor) => {
    const current = get().intakes.find((item) => item.id === id);
    if (!current) throw new Error('Project intake not found');
    const existingProject = useProjectStore.getState().projects.find((project) => project.id === current.projectId);
    if (current.status === 'ACCEPTED') {
      if (!existingProject) throw new Error('수주 완료된 접수의 canonical Project를 찾을 수 없습니다.');
      return completionFromProject(current, { ...existingProject, projectNo: existingProject.projectNo || current.projectNo }, true);
    }
    validateSecretReferences(draft.secretReferences);
    const missing = evaluateProjectIntakeCompleteness(draft);
    if (missing.length) throw new Error(`Project intake is incomplete: ${missing.join(', ')}`);
    assertReview(current, actor);
    const startDateStatus = completionStartDateStatus(draft);
    const completionDraft: ProjectIntakeDraft = {
      ...draft,
      startDateStatus,
      expectedStartDate: startDateStatus === 'SCHEDULED' ? draft.expectedStartDate : '',
    };

    if (get().persistenceMode === 'SERVER') {
      const companyId = selectedCompanyId();
      const result = await projectIntakeApi.completeWon(
        companyId,
        id,
        current.version,
        completionDraft,
        note,
        `project-intake-complete-won:${companyId}:${id}:${current.version}`,
      );
      if (selectedCompanyId() !== companyId || get().scopeCompanyId !== companyId) {
        throw new ProjectIntakeApiError('Company workspace changed while completing project intake', 409);
      }
      assertCompletionPostconditions(result);
      const projectStore = useProjectStore.getState();
      const projectExists = projectStore.projects.some((project) => project.id === result.project.id);
      projectStore.replaceProjects(projectExists
        ? projectStore.projects.map((project) => project.id === result.project.id ? result.project : project)
        : [result.project, ...projectStore.projects]);
      set((state) => ({ intakes: replace(state.intakes, result.intake) }));
      return result;
    }

    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('Project intake persistence is still being initialized. Please retry.');
    }

    const timestamp = now();
    const projectStore = useProjectStore.getState();
    const sourceProject = projectStore.projects.find((project) => project.id === current.projectId);
    if (!sourceProject) throw new Error('수주 접수와 연결된 canonical Project를 찾을 수 없습니다.');
    const executionAssignments = completeExecutionAssignments({
      projectId: sourceProject.id,
      targetUnitIds: draft.targetUnitIds,
      primaryUnitId: draft.primaryUnitId,
      actorId: actor.id,
      assignedAt: timestamp,
      existingAssignments: sourceProject.executionAssignments,
    });
    const completedProject: Project = {
      ...sourceProject,
      projectNo: draft.projectNo,
      publicationStatus: 'PUBLISHED',
      status: 'MANAGER_REVIEW',
      primaryUnitId: draft.primaryUnitId,
      assignedUnitIds: draft.targetUnitIds,
      executionAssignments,
      startDateStatus,
      startDate: startDateStatus === 'SCHEDULED' ? completionDraft.expectedStartDate : undefined,
      updatedAt: timestamp,
    };

    const reviewHistory = current.status === 'REVIEWED'
      ? []
      : [localHistory(current, 'REVIEWED', actor.id, current.status, 'REVIEWED', { note })];
    const acceptedBase = {
      ...current,
      status: 'REVIEWED' as const,
      projectNo: draft.projectNo,
      draft: completionDraft,
      draftJson: JSON.stringify(completionDraft),
      reviewNote: note,
      reviewedBy: current.reviewedBy || actor.id,
      reviewedAt: current.reviewedAt || timestamp,
    };
    const updated: ProjectIntake = {
      ...acceptedBase,
      status: 'ACCEPTED',
      acceptedBy: actor.id,
      acceptedAt: timestamp,
      version: current.version + (current.status === 'REVIEWED' ? 1 : 2),
      updatedBy: actor.id,
      updatedAt: timestamp,
      permissions: { canEdit: false, canReview: false },
      histories: [
        localHistory(acceptedBase, 'ACCEPTED', actor.id, 'REVIEWED', 'ACCEPTED', {
          note,
          projectStatus: 'MANAGER_REVIEW',
          projectNo: draft.projectNo,
          assignedUnitIds: draft.targetUnitIds,
          primaryUnitId: draft.primaryUnitId,
          startDateStatus,
        }),
        ...reviewHistory,
        ...(current.histories || []),
      ],
    };
    const result: ProjectIntakeCompletionResult = {
      intake: updated,
      project: completedProject,
      assignments: executionAssignments,
      projectNo: draft.projectNo,
      startDateStatus,
      idempotent: false,
    };
    assertCompletionPostconditions(result);

    await upsertLocalPipelineRecord(updated, completionDraft, updated.status, actor.id, timestamp);
    projectStore.replaceProjects(projectStore.projects.map((project) => project.id === completedProject.id ? completedProject : project));
    set((state) => ({ intakes: replace(state.intakes, updated) }));
    await useProjectPmScheduleStore.getState().sync(actor);
    useNotificationStore.getState().addNotification({
      userId: actor.id,
      type: 'PROJECT_ASSIGNED',
      title: '수주 프로젝트 착수 예정 배정',
      message: `[${completedProject.title}] 프로젝트가 ${executionAssignments.length}개 담당부서에 착수 예정으로 배정되었습니다.`,
      priority: 'HIGH',
      relatedProjectId: completedProject.id,
      groupId: `project-intake-completed:${completedProject.id}`,
    });
    useAuditStore.getState().addLog({
      actorId: actor.id,
      action: 'UPDATE',
      entityType: 'PROJECT_INTAKE',
      entityId: updated.id,
      message: `Project intake completed for canonical project ${completedProject.id}; units=${executionAssignments.map((item) => item.unitId).join(',')}; startDateStatus=${startDateStatus}.`,
    });
    return result;
  },
}), {
  name: 'project-intake-storage-v1',
  partialize: (state) => ({
    intakes: state.intakes,
    scopeCompanyId: state.scopeCompanyId,
  }),
  merge: (persisted, current) => {
    const saved = persisted as Partial<ProjectIntakeState>;
    const companyId = selectedCompanyId();
    const runtimePersistence = getProjectIntakePersistenceMode();
    return {
      ...current,
      ...saved,
      scopeCompanyId: companyId,
      persistenceMode: runtimePersistence,
      intakes: runtimePersistence === 'LOCAL_DEMO' && saved.scopeCompanyId === companyId
        ? (saved.intakes || [])
        : [],
    };
  },
}));

let observedCompanyId = selectedCompanyId();
useUiStore.subscribe((state) => {
  if (state.brandWorkspace === observedCompanyId) return;
  observedCompanyId = state.brandWorkspace;
  syncSequence += 1;
  useProjectIntakeStore.setState({
    intakes: [],
    scopeCompanyId: observedCompanyId,
    persistenceMode: getProjectIntakePersistenceMode(),
    loading: false,
    error: null,
  });
});
