import { buildProjectIntakeDraft } from '@/lib/projectIntake';
import { createExecutionAssignments, normalizeExecutionUnitIds } from '@/lib/projectExecutionUnits';
import type {
  CommercialDecision,
  CommercialDecisionInput,
  CommercialDecisionProject,
  EstimateRequest,
  Project,
  ProjectIntake,
} from '@/types/models';

type WonPipelineInput = {
  request: EstimateRequest;
  decisionInput: CommercialDecisionInput;
  actorId: string;
  companyId: string;
  timestamp: string;
  estimateSheetId?: string | null;
  estimateSubmissionId?: string | null;
  estimateDocumentHash?: string | null;
};

export type LocalWonPipeline = {
  request: EstimateRequest;
  decision: CommercialDecision;
  intake: ProjectIntake;
  project: Project;
  decisionProject: CommercialDecisionProject;
};

export const buildLocalWonPipeline = ({
  request,
  decisionInput,
  actorId,
  companyId,
  timestamp,
  estimateSheetId = null,
  estimateSubmissionId = null,
  estimateDocumentHash = null,
}: WonPipelineInput): LocalWonPipeline => {
  if (decisionInput.decision !== 'WON') throw new Error('Won pipeline requires a WON decision');
  const targetUnitIds = normalizeExecutionUnitIds(request.targetUnitIds || []);
  if (targetUnitIds.length === 0) throw new Error('수주 확정 전에 담당부서를 한 개 이상 선택해 주세요.');
  const primaryUnitId = targetUnitIds.includes(request.primaryUnitId!) ? request.primaryUnitId! : targetUnitIds[0];
  const projectId = request.projectId || `project-${request.id}`;
  const decisionId = request.commercialDecisionId || `commercial-decision-${request.id}`;
  const intakeId = request.projectIntakeId || request.projectIntake?.id || `project-intake-${request.id}`;
  const executionAssignments = createExecutionAssignments({
    projectId,
    targetUnitIds,
    primaryUnitId,
    actorId,
    assignedAt: timestamp,
  });
  const decision: CommercialDecision = {
    id: decisionId,
    estimateRequestId: request.id,
    estimateSheetId,
    estimateSubmissionId,
    projectId,
    idempotencyKey: `estimate-decision:${request.id}:WON`,
    decision: 'WON',
    reason: decisionInput.reason || null,
    agreedAmount: decisionInput.agreedAmount || null,
    agreedScope: decisionInput.agreedScope || null,
    agreedSchedule: decisionInput.agreedSchedule || null,
    startCondition: decisionInput.startCondition || null,
    decidedAt: timestamp,
    decidedBy: actorId,
    createdAt: timestamp,
  };
  const project: Project = {
    id: projectId,
    companyId,
    projectSourceType: 'CLIENT_ORDER',
    source: 'ESTIMATE_REQUEST',
    title: request.projectName,
    description: request.memo || undefined,
    priority: 'NORMAL',
    publicationStatus: 'DRAFT',
    status: 'INTAKE_RECEIVED',
    departmentId: request.departmentId,
    primaryUnitId,
    assignedUnitIds: targetUnitIds,
    executionAssignments,
    estimateRequestId: request.id,
    projectIntakeId: intakeId,
    commercialDecisionId: decisionId,
    startDateStatus: request.expectedStartDate ? 'SCHEDULED' : 'TBD',
    startDate: request.expectedStartDate || undefined,
    deliveryDate: request.finalDelivery || request.firstDelivery || undefined,
    progress: 0,
    createdAt: request.createdAt || timestamp,
    updatedAt: timestamp,
  };
  const sourceSnapshotJson = JSON.stringify({
    schemaVersion: 2,
    source: {
      estimateRequestId: request.id,
      requestNo: request.requestNo,
      estimateId: request.estimateId || null,
      estimateSheetId,
      estimateSubmissionId,
      estimateDocumentHash,
      commercialDecisionId: decisionId,
      projectId,
    },
    project: {
      ...request,
      targetUnitIds,
      primaryUnitId,
      activities: undefined,
      attachments: undefined,
      histories: undefined,
      commercialDecisions: undefined,
      projectIntake: undefined,
    },
    decision: decisionInput,
    assignments: executionAssignments,
    attachments: request.attachments,
    activities: request.activities,
  });
  const intakeBase: ProjectIntake = {
    id: intakeId,
    estimateRequestId: request.id,
    commercialDecisionId: decisionId,
    projectId,
    status: 'DRAFT',
    projectNo: request.requestNo,
    sourceSnapshotJson,
    version: 1,
    createdBy: actorId,
    updatedBy: actorId,
    createdAt: timestamp,
    updatedAt: timestamp,
    histories: [],
  };
  const draft = buildProjectIntakeDraft(intakeBase);
  const intake: ProjectIntake = { ...intakeBase, draft, draftJson: JSON.stringify(draft) };
  const updatedRequest: EstimateRequest = {
    ...request,
    status: 'WON',
    projectId,
    projectIntakeId: intakeId,
    commercialDecisionId: decisionId,
    targetUnitIds,
    primaryUnitId,
    executionAssignments,
    version: request.version + 1,
    updatedBy: actorId,
    updatedAt: timestamp,
    commercialDecisions: [decision, ...(request.commercialDecisions || []).filter((item) => item.id !== decisionId)],
    projectIntake: intake,
    histories: [{
      id: `history-${decisionId}`,
      estimateRequestId: request.id,
      action: 'COMMERCIAL_DECISION_RECORDED',
      fromStatus: request.status,
      toStatus: 'WON',
      changes: JSON.stringify({ decisionId, projectId, projectIntakeId: intakeId, targetUnitIds, primaryUnitId, estimateSubmissionId }),
      actorId,
      createdAt: timestamp,
    }, ...request.histories.filter((item) => item.id !== `history-${decisionId}`)],
  };
  const decisionProject: CommercialDecisionProject = {
    id: projectId,
    companyId,
    name: request.projectName,
    status: 'INTAKE_RECEIVED',
    managerId: null,
    pmId: null,
    primaryUnitId,
    assignedUnitIds: targetUnitIds,
    executionAssignments,
    orderIndex: 0,
    createdAt: project.createdAt || timestamp,
    updatedAt: project.updatedAt || timestamp,
  };
  return { request: updatedRequest, decision, intake, project, decisionProject };
};
