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
  const occurredAt = context.occurredAt || new Date().toISOString();
  const projectName = draft?.projectName || request.projectName;
  const company = draft?.company || request.company || request.client || '';
  const client = draft?.client || request.client || request.company || '';
  const targetUnitIds = draft?.targetUnitIds || request.targetUnitIds || [];
  const primaryUnitId = draft?.primaryUnitId || request.primaryUnitId || '';
  const officialProjectNo = draft?.projectNo || request.projectNo || '';
  const wonAt = context.decision === 'WON'
    ? occurredAt
    : request.commercialDecisions?.find((item) => item.decision === 'WON')?.decidedAt || '';
  return {
    section: 'PJ',
    projectId,
    sourceRecordId: request.id,
    pjNo: officialProjectNo || request.requestNo,
    year: yearOf(request, context.occurredAt),
    data: {
      '최초생성날짜': request.createdAt.slice(0, 10),
      '접수번호': request.requestNo,
      'PJ NO': officialProjectNo,
      '프로젝트 연결': projectId || '',
      '거래처명': company,
      '프로젝트명': projectName,
      '거래처': client,
      '거래처담당자': request.contact || '',
      '일반전화': request.phone || '',
      'EMAIL': request.email || '',
      '기타': draft?.notes || request.memo || '',
      '작업공종': targetUnitIds.join(','),
      '작업구분': context.stage,
      '업무성격': draft?.businessTypes.join(',') || request.unitWork || '',
      '업무단계2': context.stage,
      '건물용도': draft?.usage || request.usage || '',
      '연면적(평)': draft?.area || request.areaPy || '',
      '층수': draft?.floors || request.floors || '',
      '동수': draft?.buildings || request.buildingCount || '',
      '수주일자': wonAt ? wonAt.slice(0, 10) : '',
      '작업착수일자': draft?.expectedStartDate || request.expectedStartDate || '',
      '1차납품예정일': draft?.firstDelivery || request.firstDelivery || '',
      '2차납품예정일': draft?.secondDelivery || request.secondDelivery || '',
      '3차납품예정일': draft?.thirdDelivery || request.thirdDelivery || '',
      '상담 / 이메일 / 특기사항': draft?.notes || request.memo || '',
      'Request ID': request.id,
      'Request No': request.requestNo,
      'Project ID': projectId || '',
      'Project Name': projectName,
      'Client': company,
      'Contact': request.contact || '',
      'Email': request.email || '',
      'Execution Unit IDs': targetUnitIds.join(','),
      'Primary Unit ID': primaryUnitId,
      'Pipeline Stage': context.stage,
      'Worklist State': request.worklistState || 'ACTIVE',
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
      'Pipeline Updated At': occurredAt,
    },
  };
};
