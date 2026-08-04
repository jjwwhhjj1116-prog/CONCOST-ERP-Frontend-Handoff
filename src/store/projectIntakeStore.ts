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
import { useUiStore } from '@/store/uiStore';
import {
  ProjectIntake,
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
  discardDraft: (id: string, actor: IntakeActor) => void;
  saveDraft: (id: string, draft: ProjectIntakeDraft, actor: IntakeActor) => Promise<ProjectIntake>;
  review: (id: string, draft: ProjectIntakeDraft, note: string, actor: IntakeActor) => Promise<ProjectIntake>;
  accept: (id: string, note: string, actor: IntakeActor) => Promise<ProjectIntake>;
  finalizeWonIntake: (id: string, draft: ProjectIntakeDraft, note: string, actor: IntakeActor) => Promise<ProjectIntake>;
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
  return {
    canEdit: intake.status !== 'ACCEPTED' && (isAdmin || isManager),
    canReview: intake.status !== 'ACCEPTED' && (isAdmin || isManager),
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
    validateSecretReferences(draft.secretReferences);
    const missing = evaluateProjectIntakeCompleteness(draft);
    if (missing.length) throw new Error(`Project intake is incomplete: ${missing.join(', ')}`);
    assertReview(current, actor);

    if (get().persistenceMode === 'SERVER') {
      const companyId = selectedCompanyId();
      const reviewed = current.status === 'REVIEWED'
        ? current
        : await projectIntakeApi.review(companyId, id, current.version, draft, note);
      const updated = await projectIntakeApi.accept(companyId, id, reviewed.version, note);
      if (selectedCompanyId() !== companyId || get().scopeCompanyId !== companyId) {
        throw new ProjectIntakeApiError('Company workspace changed while completing project intake', 409);
      }
      set((state) => ({ intakes: replace(state.intakes, updated) }));
      return updated;
    }

    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('Project intake persistence is still being initialized. Please retry.');
    }

    const timestamp = now();
    await useProjectPmScheduleStore.getState().sync(actor);
    const projectStore = useProjectStore.getState();
    projectStore.replaceProjects(projectStore.projects.map((project) => {
      if (project.id !== current.projectId) return project;
      const executionAssignments = completeExecutionAssignments({
        projectId: project.id,
        targetUnitIds: draft.targetUnitIds,
        primaryUnitId: draft.primaryUnitId,
        actorId: actor.id,
        assignedAt: timestamp,
        existingAssignments: project.executionAssignments,
      });
      return {
        ...project,
        status: 'MANAGER_REVIEW',
        primaryUnitId: draft.primaryUnitId,
        assignedUnitIds: draft.targetUnitIds,
        executionAssignments,
        updatedAt: timestamp,
      };
    }));

    const reviewHistory = current.status === 'REVIEWED'
      ? []
      : [localHistory(current, 'REVIEWED', actor.id, current.status, 'REVIEWED', { note })];
    const acceptedBase = {
      ...current,
      status: 'REVIEWED' as const,
      projectNo: draft.projectNo,
      draft,
      draftJson: JSON.stringify(draft),
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
        localHistory(acceptedBase, 'ACCEPTED', actor.id, 'REVIEWED', 'ACCEPTED', { note, projectStatus: 'MANAGER_REVIEW' }),
        ...reviewHistory,
        ...(current.histories || []),
      ],
    };
    set((state) => ({ intakes: replace(state.intakes, updated) }));
    await upsertLocalPipelineRecord(updated, draft, updated.status, actor.id, timestamp);
    return updated;
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
