import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  estimateRequestApi,
  EstimateRequestApiError,
  EstimateRequestDraft,
} from '@/lib/estimateRequestApi';
import { useProjectStore } from '@/store/projectStore';
import { useEstimateDatabaseStore } from '@/store/estimateDatabaseStore';
import { useUiStore } from '@/store/uiStore';
import { buildLocalWonPipeline } from '@/lib/projectPipeline';
import { buildEstimatePipelineDbInput } from '@/lib/estimatePipelineDatabase';
import { demoEstimateRequests } from '@/data/estimateRequestSeed';
import {
  CommercialDecisionInput,
  CommercialDecisionResult,
  EstimateRequest,
  EstimateRequestActivityKind,
  EstimateRequestHistory,
  EstimateRequestStatus,
} from '@/types/models';

type PersistenceMode = 'CHECKING' | 'SERVER' | 'LOCAL_DEMO';

interface EstimateRequestState {
  requests: EstimateRequest[];
  persistenceMode: PersistenceMode;
  loading: boolean;
  error: string | null;
  loadDemoRequests: () => void;
  sync: () => Promise<void>;
  createRequest: (draft: EstimateRequestDraft, actorId: string) => Promise<EstimateRequest>;
  duplicateRequest: (id: string, actorId: string) => Promise<EstimateRequest>;
  archiveRequest: (id: string, actorId: string) => Promise<EstimateRequest>;
  restoreRequest: (id: string, actorId: string) => Promise<EstimateRequest>;
  updateRequest: (id: string, updates: Partial<EstimateRequest>, actorId: string) => Promise<EstimateRequest>;
  changeStatus: (id: string, status: EstimateRequestStatus, actorId: string) => Promise<EstimateRequest>;
  recordDecision: (id: string, input: CommercialDecisionInput, actorId: string) => Promise<CommercialDecisionResult>;
  addActivity: (id: string, kind: EstimateRequestActivityKind, content: string, actorId: string) => Promise<void>;
  addAttachments: (id: string, category: string, files: File[], actorId: string) => Promise<void>;
  removeAttachment: (id: string, attachmentId: string, actorId: string) => Promise<void>;
}

const newId = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
const now = () => new Date().toISOString();
const requestNo = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  return `ER-${date}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
};

const replaceRequest = (requests: EstimateRequest[], request: EstimateRequest) =>
  requests.map((item) => item.id === request.id ? request : item);

export const useEstimateRequestStore = create<EstimateRequestState>()(persist((set, get) => ({
  requests: [],
  persistenceMode: 'CHECKING',
  loading: false,
  error: null,
  loadDemoRequests: () => set((state) => ({
    requests: [
      ...state.requests,
      ...demoEstimateRequests.filter((seed) => !state.requests.some((request) => request.id === seed.id)),
    ],
    persistenceMode: 'LOCAL_DEMO',
  })),

  sync: async () => {
    set({ loading: true, error: null });
    try {
      const requests = await estimateRequestApi.list();
      set({ requests, persistenceMode: 'SERVER', loading: false });
    } catch (caught) {
      if (caught instanceof TypeError || (caught instanceof EstimateRequestApiError && [401, 404].includes(caught.status))) {
        set({ persistenceMode: 'LOCAL_DEMO', loading: false });
        return;
      }
      set({
        loading: false,
        error: caught instanceof Error ? caught.message : 'Estimate request synchronization failed',
      });
    }
  },

  createRequest: async (draft, actorId) => {
    if (get().persistenceMode === 'SERVER') {
      const created = await estimateRequestApi.create(draft);
      set((state) => ({ requests: [created, ...state.requests] }));
      return created;
    }
    const timestamp = now();
    const created: EstimateRequest = {
      ...draft,
      id: newId('estimate-request'),
      requestNo: draft.requestNo || requestNo(),
      status: draft.status || 'REQUEST_MEMO',
      worklistState: 'ACTIVE',
      projectName: draft.projectName,
      departmentId: draft.departmentId,
      requestDate: draft.requestDate || timestamp,
      version: 1,
      createdBy: actorId,
      updatedBy: actorId,
      createdAt: timestamp,
      updatedAt: timestamp,
      activities: [],
      attachments: [],
      histories: [{
        id: newId('history'),
        estimateRequestId: '',
        action: 'CREATED',
        toStatus: draft.status || 'REQUEST_MEMO',
        actorId,
        createdAt: timestamp,
      }],
    };
    created.histories[0].estimateRequestId = created.id;
    set((state) => ({ requests: [created, ...state.requests] }));
    await useEstimateDatabaseStore.getState().upsertPipelineRecord(
      buildEstimatePipelineDbInput(created, { stage: 'REQUEST', occurredAt: timestamp }),
      actorId,
    );
    return created;
  },

  duplicateRequest: async (id, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    if (!current) throw new Error('Estimate request not found');
    if (get().persistenceMode !== 'LOCAL_DEMO') {
      throw new Error('견적 의뢰 복제 API가 준비되지 않았습니다. 서버 연결 후 다시 시도해 주세요.');
    }
    return get().createRequest({
      projectName: `${current.projectName} (복사본)`,
      departmentId: current.departmentId,
      ownerId: current.ownerId,
      company: current.company,
      client: current.client,
      contact: current.contact,
      contactDepartment: current.contactDepartment,
      phone: current.phone,
      email: current.email,
      targetUnitIds: [...(current.targetUnitIds || [])],
      primaryUnitId: current.primaryUnitId,
      requestDate: now(),
      memo: current.memo,
      rawMemo: current.rawMemo,
      firstDelivery: current.firstDelivery,
      secondDelivery: current.secondDelivery,
      thirdDelivery: current.thirdDelivery,
      finalDelivery: current.finalDelivery,
      expectedStartDate: current.expectedStartDate,
      areaPy: current.areaPy,
      floors: current.floors,
      scope: current.scope,
      usage: current.usage,
      buildingCount: current.buildingCount,
      unitWork: current.unitWork,
      bidDate: current.bidDate,
      estimateType: current.estimateType,
      status: 'REQUEST_MEMO',
    }, actorId);
  },

  archiveRequest: async (id, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    if (!current) throw new Error('Estimate request not found');
    if (current.worklistState === 'ARCHIVED') return current;
    const timestamp = now();
    const reason = '의뢰관리 목록 정리';
    const updates: Partial<EstimateRequest> = {
      worklistState: 'ARCHIVED',
      archivedAt: timestamp,
      archivedBy: actorId,
      archiveReason: reason,
    };
    const saved = get().persistenceMode === 'SERVER'
      ? await estimateRequestApi.update(id, current.version, updates)
      : {
          ...current,
          ...updates,
          version: current.version + 1,
          updatedBy: actorId,
          updatedAt: timestamp,
          histories: [{
            id: newId('history'), estimateRequestId: id, action: 'ESTIMATE_REQUEST_ARCHIVED_FROM_WORKLIST',
            changes: JSON.stringify({
              before: { worklistState: current.worklistState || 'ACTIVE', archivedAt: current.archivedAt || null },
              after: { worklistState: 'ARCHIVED', archivedAt: timestamp, archivedBy: actorId, reason },
            }),
            actorId, createdAt: timestamp,
          }, ...current.histories],
        };
    if (saved.worklistState !== 'ARCHIVED') throw new Error('의뢰 보관 결과를 확인할 수 없습니다. 목록은 변경되지 않았습니다.');
    set((state) => ({ requests: replaceRequest(state.requests, saved) }));
    await useEstimateDatabaseStore.getState().upsertPipelineRecord(
      buildEstimatePipelineDbInput(saved, { stage: saved.projectIntakeId ? 'INTAKE' : saved.commercialDecisionId ? 'DECISION' : saved.estimateId ? 'SHEET' : 'REQUEST', occurredAt: timestamp }), actorId,
    );
    return saved;
  },

  restoreRequest: async (id, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    if (!current) throw new Error('Estimate request not found');
    if ((current.worklistState || 'ACTIVE') === 'ACTIVE') return current;
    const timestamp = now();
    const reason = current.projectIntakeId ? '기존 프로젝트 접수와 함께 의뢰관리로 복구' : '의뢰관리 재검토';
    const updates: Partial<EstimateRequest> = {
      worklistState: 'ACTIVE',
      restoredAt: timestamp,
      restoredBy: actorId,
      restoreReason: reason,
    };
    const saved = get().persistenceMode === 'SERVER'
      ? await estimateRequestApi.update(id, current.version, updates)
      : {
          ...current,
          ...updates,
          version: current.version + 1,
          updatedBy: actorId,
          updatedAt: timestamp,
          histories: [{
            id: newId('history'), estimateRequestId: id, action: 'ESTIMATE_REQUEST_RESTORED_TO_WORKLIST',
            changes: JSON.stringify({
              before: { worklistState: current.worklistState || 'ACTIVE', projectIntakeId: current.projectIntakeId || null },
              after: { worklistState: 'ACTIVE', restoredAt: timestamp, restoredBy: actorId, reason },
            }),
            actorId, createdAt: timestamp,
          }, ...current.histories],
        };
    if (saved.worklistState !== 'ACTIVE') throw new Error('의뢰 복구 결과를 확인할 수 없습니다.');
    set((state) => ({ requests: replaceRequest(state.requests, saved) }));
    await useEstimateDatabaseStore.getState().upsertPipelineRecord(
      buildEstimatePipelineDbInput(saved, { stage: saved.projectIntakeId ? 'INTAKE' : saved.commercialDecisionId ? 'DECISION' : saved.estimateId ? 'SHEET' : 'REQUEST', occurredAt: timestamp }), actorId,
    );
    return saved;
  },

  updateRequest: async (id, updates, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    if (!current) throw new Error('Estimate request not found');
    if (get().persistenceMode === 'SERVER') {
      const updated = await estimateRequestApi.update(id, current.version, updates);
      set((state) => ({ requests: replaceRequest(state.requests, updated) }));
      return updated;
    }
    const timestamp = now();
    const updated: EstimateRequest = {
      ...current,
      ...updates,
      version: current.version + 1,
      updatedBy: actorId,
      updatedAt: timestamp,
      histories: [{
        id: newId('history'),
        estimateRequestId: id,
        action: 'UPDATED',
        changes: JSON.stringify(updates),
        actorId,
        createdAt: timestamp,
      }, ...current.histories],
    };
    set((state) => ({ requests: replaceRequest(state.requests, updated) }));
    const stage = updated.projectIntakeId
      ? 'INTAKE'
      : updated.commercialDecisionId
        ? 'DECISION'
        : updated.estimateId
          ? 'SHEET'
          : 'REQUEST';
    await useEstimateDatabaseStore.getState().upsertPipelineRecord(
      buildEstimatePipelineDbInput(updated, { stage, occurredAt: timestamp }),
      actorId,
    );
    return updated;
  },

  changeStatus: async (id, status, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    if (!current) throw new Error('Estimate request not found');
    if (current.projectId || ['WON', 'LOST', 'CANCELLED'].includes(current.status)) {
      throw new Error('A terminal commercial decision cannot be changed through the status action');
    }
    if (['WON', 'LOST', 'CANCELLED', 'ON_HOLD'].includes(status)) {
      throw new Error('Commercial decisions must use the decision action');
    }
    if (get().persistenceMode === 'SERVER') {
      const updated = await estimateRequestApi.changeStatus(id, current.version, status);
      set((state) => ({ requests: replaceRequest(state.requests, updated) }));
      return updated;
    }
    const timestamp = now();
    const updated: EstimateRequest = {
      ...current,
      status,
      projectId: current.projectId,
      version: current.version + 1,
      updatedBy: actorId,
      updatedAt: timestamp,
      histories: [{
        id: newId('history'),
        estimateRequestId: id,
        action: 'STATUS_CHANGED',
        fromStatus: current.status,
        toStatus: status,
        actorId,
        createdAt: timestamp,
      }, ...current.histories],
    };
    set((state) => ({ requests: replaceRequest(state.requests, updated) }));
    return updated;
  },

  recordDecision: async (id, input, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    if (!current) throw new Error('Estimate request not found');
    if (get().persistenceMode === 'SERVER') {
      const result = await estimateRequestApi.decide(id, current.version, input);
      set((state) => ({ requests: replaceRequest(state.requests, result.request) }));
      return result;
    }
    if (current.status === 'WON' && input.decision === 'WON' && current.projectId && current.projectIntake) {
      const decision = current.commercialDecisions?.find((item) => item.id === current.commercialDecisionId)
        || current.commercialDecisions?.find((item) => item.decision === 'WON');
      const project = useProjectStore.getState().projects.find((item) => item.id === current.projectId);
      if (decision && project) {
        return {
          request: current,
          decision,
          intake: current.projectIntake,
          project: {
            id: project.id,
            companyId: project.companyId || useUiStore.getState().brandWorkspace,
            name: project.title,
            status: project.status,
            managerId: project.managerId || null,
            pmId: project.pmId || null,
            primaryUnitId: project.primaryUnitId || null,
            assignedUnitIds: project.assignedUnitIds || [],
            executionAssignments: project.executionAssignments || [],
            orderIndex: 0,
            createdAt: project.createdAt || current.createdAt,
            updatedAt: project.updatedAt || current.updatedAt,
          },
          idempotent: true,
        };
      }
    }
    if (current.projectId || current.status === 'WON') throw new Error('This estimate request has already been converted to a project');
    if (['LOST', 'CANCELLED'].includes(current.status)) throw new Error('A terminal estimate request cannot be decided again');
    if (current.status === 'ON_HOLD' && input.decision === 'ON_HOLD') throw new Error('This estimate request is already on hold');
    if (['LOST', 'CANCELLED'].includes(input.decision) && !input.reason?.trim()) throw new Error('A reason is required for lost or cancelled decisions');
    const { useEstimateSheetStore } = await import('@/store/estimateSheetStore');
    const sheet = useEstimateSheetStore.getState().sheets[id];
    const completedSubmission = sheet?.submissions?.find((item) => ['SUBMITTED', 'SENT'].includes(item.status)) || null;
    if (['WON', 'LOST'].includes(input.decision) && !completedSubmission) {
      throw new Error('A completed estimate submission is required before this decision');
    }
    const timestamp = now();
    if (input.decision === 'WON') {
      const pipeline = buildLocalWonPipeline({
        request: current,
        decisionInput: input,
        actorId,
        companyId: useUiStore.getState().brandWorkspace,
        timestamp,
        estimateSheetId: sheet?.id || null,
        estimateSubmissionId: completedSubmission?.id || null,
        estimateDocumentHash: completedSubmission?.documentHash || null,
      });
      const projectStore = useProjectStore.getState();
      projectStore.replaceProjects([
        ...projectStore.projects.filter((project) => project.id !== pipeline.project.id),
        pipeline.project,
      ]);
      await useEstimateDatabaseStore.getState().upsertPipelineRecord(
        buildEstimatePipelineDbInput(pipeline.request, {
          stage: 'DECISION',
          projectId: pipeline.project.id,
          estimateSheetId: sheet?.id || null,
          estimateSheetStatus: sheet?.status || null,
          estimateSheetVersion: sheet?.currentVersion || null,
          decision: 'WON',
          intakeId: pipeline.intake.id,
          intakeStatus: pipeline.intake.status,
          occurredAt: timestamp,
        }),
        actorId,
      );
      set((state) => ({ requests: replaceRequest(state.requests, pipeline.request) }));
      return {
        request: pipeline.request,
        decision: pipeline.decision,
        intake: pipeline.intake,
        project: pipeline.decisionProject,
        idempotent: false,
      };
    }
    const decisionId = newId('commercial-decision');
    const projectId = current.projectId || null;
    const decision = {
      id: decisionId,
      estimateRequestId: id,
      estimateSheetId: sheet?.id || null,
      estimateSubmissionId: completedSubmission?.id || null,
      projectId,
      idempotencyKey: `estimate-decision:${id}:${current.version}:${input.decision}`,
      decision: input.decision,
      reason: input.reason || null,
      agreedAmount: input.agreedAmount || null,
      agreedScope: input.agreedScope || null,
      agreedSchedule: input.agreedSchedule || null,
      startCondition: input.startCondition || null,
      decidedAt: timestamp,
      decidedBy: actorId,
      createdAt: timestamp,
    };
    const intake = null;
    const updated: EstimateRequest = {
      ...current,
      status: input.decision,
      projectId,
      version: current.version + 1,
      updatedBy: actorId,
      updatedAt: timestamp,
      commercialDecisions: [decision, ...(current.commercialDecisions || [])],
      projectIntake: intake,
      histories: [{
        id: newId('history'),
        estimateRequestId: id,
        action: 'COMMERCIAL_DECISION_RECORDED',
        fromStatus: current.status,
        toStatus: input.decision,
        changes: JSON.stringify({ decisionId, projectId, projectIntakeId: null, estimateSubmissionId: completedSubmission?.id || null }),
        actorId,
        createdAt: timestamp,
      }, ...current.histories],
    };
    set((state) => ({ requests: replaceRequest(state.requests, updated) }));
    return { request: updated, decision, intake, project: null, idempotent: false };
  },

  addActivity: async (id, kind, content, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    if (!current) throw new Error('Estimate request not found');
    if (get().persistenceMode === 'SERVER') {
      await estimateRequestApi.addActivity(id, kind, content);
      const refreshed = await estimateRequestApi.get(id);
      set((state) => ({ requests: replaceRequest(state.requests, refreshed) }));
      return;
    }
    const timestamp = now();
    const created = {
      id: newId('activity'),
      estimateRequestId: id,
      kind,
      content,
      occurredAt: timestamp,
      createdBy: actorId,
      createdAt: timestamp,
    };
    set((state) => ({
      requests: state.requests.map((item) => item.id === id
        ? {
            ...item,
            activities: [created, ...item.activities],
            histories: [{
              id: newId('history'),
              estimateRequestId: id,
              action: `ACTIVITY_${kind}`,
              changes: content,
              actorId,
              createdAt: timestamp,
            }, ...item.histories],
          }
        : item),
    }));
  },

  addAttachments: async (id, category, files, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    if (!current) throw new Error('Estimate request not found');
    const created = await Promise.all(files.map(async (file) => {
      const metadata = {
        category,
        label: category,
        originalName: file.name,
        size: file.size,
        mimeType: file.type || null,
        memo: null,
      };
      if (get().persistenceMode === 'SERVER') return estimateRequestApi.addAttachment(id, metadata);
      const timestamp = now();
      return {
        ...metadata,
        id: newId('attachment'),
        estimateRequestId: id,
        status: 'REGISTERED' as const,
        createdBy: actorId,
        createdAt: timestamp,
      };
    }));
    if (get().persistenceMode === 'SERVER') {
      const refreshed = await estimateRequestApi.get(id);
      set((state) => ({ requests: replaceRequest(state.requests, refreshed) }));
      return;
    }
    const timestamp = now();
    set((state) => ({
      requests: state.requests.map((item) => item.id === id
        ? {
            ...item,
            attachments: [...created, ...item.attachments],
            histories: created.map<EstimateRequestHistory>((attachment) => ({
              id: newId('history'),
              estimateRequestId: id,
              action: 'ATTACHMENT_ADDED',
              changes: attachment.originalName,
              actorId,
              createdAt: timestamp,
            })).concat(item.histories),
          }
        : item),
    }));
  },

  removeAttachment: async (id, attachmentId, actorId) => {
    const current = get().requests.find((item) => item.id === id);
    const attachment = current?.attachments.find((item) => item.id === attachmentId);
    if (!current || !attachment) throw new Error('Attachment not found');
    if (get().persistenceMode === 'SERVER') {
      await estimateRequestApi.removeAttachment(id, attachmentId);
      const refreshed = await estimateRequestApi.get(id);
      set((state) => ({ requests: replaceRequest(state.requests, refreshed) }));
      return;
    }
    const timestamp = now();
    set((state) => ({
      requests: state.requests.map((item) => item.id === id
        ? {
            ...item,
            attachments: item.attachments.filter((entry) => entry.id !== attachmentId),
            histories: [{
              id: newId('history'),
              estimateRequestId: id,
              action: 'ATTACHMENT_REMOVED',
              changes: attachment.originalName,
              actorId,
              createdAt: timestamp,
            }, ...item.histories],
          }
        : item),
    }));
  },
}), {
  name: 'estimate-request-storage-v1',
  partialize: (state) => ({ requests: state.requests }),
}));
