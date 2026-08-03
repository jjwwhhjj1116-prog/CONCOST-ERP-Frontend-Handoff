import type { EstimateDbRecordInput } from '@/lib/estimateDatabaseApi';
import type { EstimateRequest, ProjectIntakeDraft } from '@/types/models';

export type EstimatePipelineStage = 'REQUEST' | 'SHEET' | 'DECISION' | 'INTAKE';

type PipelineDbContext = {
  stage: EstimatePipelineStage;
  projectId?: string | null;
  estimateSheetId?: string | null;
  estimateSheetStatus?: string | null;
  estimateSheetVersion?: number | null;
  decision?: string | null;
  intakeId?: string | null;
  intakeStatus?: string | null;
  intakeDraft?: ProjectIntakeDraft | null;
  occurredAt?: string;
};

const yearOf = (request: EstimateRequest, occurredAt?: string) => {
  const value = request.requestDate || occurredAt || request.createdAt;
  const year = Number(String(value).slice(0, 4));
  return Number.isInteger(year) && year > 1900 ? year : new Date().getFullYear();
};

export const buildEstimatePipelineDbInput = (
  request: EstimateRequest,
  context: PipelineDbContext,
): EstimateDbRecordInput => {
  const draft = context.intakeDraft;
  const projectId = context.projectId ?? request.projectId ?? null;
  return {
    section: 'PJ',
    projectId,
    sourceRecordId: request.id,
    pjNo: request.requestNo,
    year: yearOf(request, context.occurredAt),
    data: {
      'Request ID': request.id,
      'Request No': request.requestNo,
      'PJ NO': request.requestNo,
      'Project ID': projectId || '',
      'Project Name': draft?.projectName || request.projectName,
      'Client': draft?.company || request.company || request.client || '',
      'Contact': request.contact || '',
      'Email': request.email || '',
      'Execution Unit IDs': (draft?.targetUnitIds || request.targetUnitIds || []).join(','),
      'Primary Unit ID': draft?.primaryUnitId || request.primaryUnitId || '',
      'Pipeline Stage': context.stage,
      'Estimate Sheet ID': context.estimateSheetId || request.estimateId || '',
      'Estimate Sheet Status': context.estimateSheetStatus || '',
      'Estimate Sheet Version': context.estimateSheetVersion ?? '',
      'Commercial Decision': context.decision || '',
      'Project Intake ID': context.intakeId || request.projectIntakeId || '',
      'Project Intake Status': context.intakeStatus || request.projectIntake?.status || '',
      'Expected Start Date': draft?.expectedStartDate || request.expectedStartDate || '',
      'First Delivery': draft?.firstDelivery || request.firstDelivery || '',
      'Final Delivery': draft?.finalDelivery || request.finalDelivery || '',
      'Notes': draft?.notes || request.memo || '',
      'Pipeline Updated At': context.occurredAt || new Date().toISOString(),
    },
  };
};
