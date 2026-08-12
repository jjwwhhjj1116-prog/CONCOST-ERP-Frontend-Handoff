import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  projectIntakeApi,
  ProjectIntakeApiError,
  ProjectIntakeCompanyId,
} from '@/lib/projectIntakeApi';
import {
  buildProjectIntakeDraft,
  evaluateProjectIntakeCompleteness,
  validateSecretReferences,
} from '@/lib/projectIntake';
import { getProjectIntakePersistenceMode } from '@/lib/runtimeExecutionMode';
import { buildEstimatePipelineDbInput } from '@/lib/estimatePipelineDatabase';
import { completeExecutionAssignments } from '@/lib/projectExecutionUnits';
import { buildAcceptedIntakeRevision } from '@/lib/projectIntakeRevision';
import { buildCustomerProjectRelationshipPlan } from '@/lib/customerProjectRelationship';
import { getEligibleProjectPersonnel } from '@/lib/projectStaffing';
import { allocateAnnualProjectNo } from '@/lib/projectNumber';
import { useEstimateDatabaseStore } from '@/store/estimateDatabaseStore';
import { useEstimateRequestStore } from '@/store/estimateRequestStore';
import { useProjectStore } from '@/store/projectStore';
import { useProjectPmScheduleStore } from '@/store/projectPmScheduleStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuditStore } from '@/store/auditStore';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useBusinessOperationsStore } from '@/store/businessOperationsStore';
import {
  Project,
  ProjectIntake,
  ProjectIntakeCompletionResult,
  ProjectIntakeDraft,
  ProjectIntakeHistory,
  ProjectIntakeRevisionResult,
  ProjectIntakeRevisionEventType,
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
  saveDraft: (id: string, draft: ProjectIntakeDraft, actor: IntakeActor) => Promise<ProjectIntake>;
  review: (id: string, draft: ProjectIntakeDraft, note: string, actor: IntakeActor) => Promise<ProjectIntake>;
  accept: (id: string, note: string, actor: IntakeActor) => Promise<ProjectIntake>;
  finalizeWonIntake: (id: string, draft: ProjectIntakeDraft, note: string, actor: IntakeActor) => Promise<ProjectIntakeCompletionResult>;
  reviseAcceptedIntake: (id: string, draft: ProjectIntakeDraft, reason: string, actor: IntakeActor) => Promise<ProjectIntakeRevisionResult>;
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

const buildLocalCustomerProjectRelationshipPlan = (
  intake: ProjectIntake,
  project: Project,
  actorId: string,
  occurredAt: string,
) => {
  const companyId = selectedCompanyId();
  if (project.companyId !== companyId) {
    throw new Error('CUSTOMER_PROJECT_RELATIONSHIP_COMPANY_MISMATCH');
  }
  const operations = useBusinessOperationsStore.getState();
  const plan = buildCustomerProjectRelationshipPlan({
    companyId,
    intake,
    project,
    customers: operations.customers,
    contacts: operations.contacts,
    relationships: operations.customerProjectRelationships,
    candidates: operations.customerProjectLinkCandidates,
    actorId,
    occurredAt,
  });
  return plan;
};

const localPermissions = (intake: ProjectIntake, actor: IntakeActor) => {
  const source = findSourceRequest(intake);
  const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(actor.role);
  const isManager = actor.role === 'DEPARTMENT_MANAGER' && source?.departmentId === actor.departmentId;
  const draft = intake.draft || buildProjectIntakeDraft(intake);
  const isAssignedUnitManager = actor.role === 'DEPARTMENT_MANAGER' && draft.targetUnitIds.some((unitId) => unitId === actor.departmentId);
  const isOwnedStandaloneDraft = !intake.estimateRequestId
    && !intake.commercialDecisionId
    && intake.createdBy === actor.id
    && ['PM', 'DEPARTMENT_MANAGER'].includes(actor.role);
  return {
    canEdit: isAdmin || isManager || isAssignedUnitManager || isOwnedStandaloneDraft,
    canReview: intake.status !== 'ACCEPTED' && (isAdmin || isManager || isAssignedUnitManager || (isOwnedStandaloneDraft && actor.role === 'DEPARTMENT_MANAGER')),
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

const revisionEventTitle: Record<ProjectIntakeRevisionEventType, string> = {
  PROJECT_INTAKE_UPDATED: '프로젝트 접수 수정',
  PROJECT_INTAKE_ADDITIONAL_MATERIAL_ADDED: '프로젝트 접수 추가자료',
  PROJECT_INTAKE_SCOPE_CHANGED: '프로젝트 수행범위 변경',
  PROJECT_INTAKE_SCHEDULE_CHANGED: '프로젝트 일정 변경',
  PROJECT_INTAKE_UNIT_ADDED: '프로젝트 담당부서 추가',
  PROJECT_INTAKE_UNIT_REMOVED: '프로젝트 담당부서 해제',
};

const revisionRecipients = (project: Project, actorId: string) => {
  const users = useAuthStore.getState().users;
  const assignments = project.executionAssignments || [];
  const ids = new Set<string>([actorId]);
  assignments.forEach((assignment) => {
    if (assignment.pmId) ids.add(assignment.pmId);
    assignment.personnelIds?.forEach((userId) => ids.add(userId));
    getEligibleProjectPersonnel(users, project, assignment.unitId)
      .filter((person) => person.role === 'DEPARTMENT_MANAGER' || person.organizationRank === 'TEAM_LEADER' || person.organizationRank === 'MANAGER')
      .forEach((person) => ids.add(person.id));
  });
  if (project.pmId) ids.add(project.pmId);
  return Array.from(ids);
};

const notifyAcceptedRevision = (result: ProjectIntakeRevisionResult, actorId: string, reason: string) => {
  const store = useNotificationStore.getState();
  const recipients = revisionRecipients(result.project, actorId);
  result.eventTypes.forEach((eventType) => {
    recipients.forEach((userId) => {
      const groupId = `project-intake-revision:${result.intake.id}:${result.revision}:${eventType}:${userId}`;
      if (store.notifications.some((notification) => notification.userId === userId && notification.groupId === groupId)) return;
      store.addNotification({
        userId,
        type: eventType,
        title: revisionEventTitle[eventType],
        message: `[${result.project.title}] ${reason.trim()} (Revision ${result.revision})`,
        priority: eventType === 'PROJECT_INTAKE_UPDATED' ? 'NORMAL' : 'HIGH',
        relatedProjectId: result.project.id,
        groupId,
      });
    });
  });
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

  saveDraft: async (id, draft, actor) => {
    const current = get().intakes.find((item) => item.id === id);
    if (!current) throw new Error('Project intake not found');
    if (current.status === 'ACCEPTED') {
      throw new Error('수주 완료된 접수는 수정 사유와 함께 수정본으로 저장해야 합니다.');
    }
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
      if (get().persistenceMode === 'LOCAL_DEMO') {
        const relationshipPlan = buildLocalCustomerProjectRelationshipPlan(current, existingProject, actor.id, now());
        useBusinessOperationsStore.getState().applyCustomerProjectRelationshipPlan(relationshipPlan);
      }
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
    const projectNo = sourceProject.projectNo || allocateAnnualProjectNo(
      projectStore.projects,
      new Date(timestamp).getFullYear(),
    );
    const localCompletionDraft: ProjectIntakeDraft = { ...completionDraft, projectNo };
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
      projectNo,
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
      projectNo,
      draft: localCompletionDraft,
      draftJson: JSON.stringify(localCompletionDraft),
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
          projectNo,
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
      projectNo,
      startDateStatus,
      idempotent: false,
    };
    assertCompletionPostconditions(result);
    const relationshipPlan = buildLocalCustomerProjectRelationshipPlan(updated, completedProject, actor.id, timestamp);

    useEstimateRequestStore.setState((state) => ({
      requests: state.requests.map((request) => request.id === current.estimateRequestId
        ? {
            ...request,
            projectNo,
            updatedAt: timestamp,
            updatedBy: actor.id,
            version: request.version + 1,
            histories: [{
              id: `history-project-number-${request.id}-${projectNo}`,
              estimateRequestId: request.id,
              action: 'PROJECT_NUMBER_ASSIGNED',
              changes: JSON.stringify({
                before: { projectNo: request.projectNo || null },
                after: { projectNo, projectId: completedProject.id },
              }),
              actorId: actor.id,
              createdAt: timestamp,
            }, ...request.histories],
          }
        : request),
    }));
    await upsertLocalPipelineRecord(updated, localCompletionDraft, updated.status, actor.id, timestamp);
    projectStore.replaceProjects(projectStore.projects.map((project) => project.id === completedProject.id ? completedProject : project));
    set((state) => ({ intakes: replace(state.intakes, updated) }));
    await useProjectPmScheduleStore.getState().sync(actor);
    useBusinessOperationsStore.getState().applyCustomerProjectRelationshipPlan(relationshipPlan);
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
      message: `Project intake completed for canonical project ${completedProject.id}; units=${executionAssignments.map((item) => item.unitId).join(',')}; startDateStatus=${startDateStatus}; customerRelationshipsCreated=${relationshipPlan.createdRelationshipIds.length}; customerRelationshipReviews=${relationshipPlan.candidates.filter((candidate) => candidate.status === 'REVIEW_REQUIRED').length}.`,
    });
    return result;
  },

  reviseAcceptedIntake: async (id, draft, reason, actor) => {
    const current = get().intakes.find((item) => item.id === id);
    if (!current) throw new Error('Project intake not found');
    if (current.status !== 'ACCEPTED') throw new Error('수주 완료된 접수만 수정본을 저장할 수 있습니다.');
    if (!reason.trim()) throw new Error('수정 사유를 입력해 주세요.');
    validateSecretReferences(draft.secretReferences);
    assertEdit(current, actor);
    if (get().persistenceMode === 'SERVER') {
      throw new ProjectIntakeApiError('BACKEND_REQUIRED: accepted intake revision adapter is not configured', 501);
    }
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('Project intake persistence is still being initialized. Please retry.');
    }
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.projects.find((project) => project.id === current.projectId);
    if (!currentProject) throw new Error('수주 접수와 연결된 canonical Project를 찾을 수 없습니다.');
    const timestamp = now();
    const result = buildAcceptedIntakeRevision({
      intake: current,
      project: currentProject,
      draft: {
        ...draft,
        projectNo: current.projectNo,
        source: { ...draft.source, projectId: current.projectId },
      },
      reason,
      actorId: actor.id,
      revisedAt: timestamp,
      historyId: newId('project-intake-history'),
    });
    const relationshipPlan = buildLocalCustomerProjectRelationshipPlan(result.intake, result.project, actor.id, timestamp);

    await upsertLocalPipelineRecord(result.intake, result.intake.draft!, result.intake.status, actor.id, timestamp);
    projectStore.replaceProjects(projectStore.projects.map((project) => project.id === result.project.id ? result.project : project));
    set((state) => ({ intakes: replace(state.intakes, hydrateLocal(result.intake, actor)) }));
    await useProjectPmScheduleStore.getState().sync(actor);
    useBusinessOperationsStore.getState().applyCustomerProjectRelationshipPlan(relationshipPlan);
    notifyAcceptedRevision(result, actor.id, reason);
    useAuditStore.getState().addLog({
      actorId: actor.id,
      action: 'UPDATE',
      entityType: 'PROJECT_INTAKE',
      entityId: result.intake.id,
      beforeValue: JSON.stringify({
        revision: current.version,
        assignedUnitIds: currentProject.assignedUnitIds || [],
        primaryUnitId: currentProject.primaryUnitId || null,
      }),
      afterValue: JSON.stringify({
        revision: result.revision,
        assignedUnitIds: result.project.assignedUnitIds || [],
        primaryUnitId: result.project.primaryUnitId || null,
      }),
      message: `Accepted project intake revision ${result.revision}; reason=${reason.trim()}; actor=${actor.id}; timestamp=${timestamp}; changed=${result.changedFields.join(',')}; customerRelationshipsUpdated=${relationshipPlan.updatedRelationshipIds.length}; customerRelationshipsDeactivated=${relationshipPlan.deactivatedRelationshipIds.length}.`,
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
