import type { EstimateRequest, EstimateRequestWorklistState, EstimateSheet, ProjectIntakeDraft } from '@/types/models';

export type EstimateRequestEditMode = 'VIEW' | 'EDIT' | 'CORRECTION' | 'SAVING';

export type EstimateRequestEditPolicy = {
  mode: Exclude<EstimateRequestEditMode, 'SAVING'>;
  actionLabel: string;
  editable: boolean;
  reason: string;
};

export type EstimateRequestDeletePolicy = {
  kind: 'ARCHIVE_REQUEST';
  title: string;
  description: string;
  targets: string[];
};

const TERMINAL_STATUSES = new Set(['LOST', 'CANCELLED']);

export const getEstimateRequestWorklistState = (request: Pick<EstimateRequest, 'worklistState'>): EstimateRequestWorklistState => (
  request.worklistState || 'ACTIVE'
);

export const isEstimateRequestInActiveWorklist = (request: Pick<EstimateRequest, 'worklistState'>) => (
  getEstimateRequestWorklistState(request) === 'ACTIVE'
);

export const filterActiveEstimateRequestWorklist = <T extends Pick<EstimateRequest, 'worklistState'>>(requests: T[]) => (
  requests.filter(isEstimateRequestInActiveWorklist)
);

export type EstimateDbWorklistFilter = 'ALL' | 'ACTIVE' | 'TRANSFERRED_TO_INTAKE' | 'ARCHIVED' | 'WON_COMPLETED' | 'CLOSED';

export const matchesEstimateDbWorklistFilter = (
  request: EstimateRequest | undefined,
  filter: EstimateDbWorklistFilter,
) => {
  if (filter === 'ALL') return true;
  if (!request) return false;
  if (filter === 'WON_COMPLETED') return request.projectIntake?.status === 'ACCEPTED';
  if (filter === 'CLOSED') return request.status === 'LOST' || request.status === 'CANCELLED';
  return getEstimateRequestWorklistState(request) === filter;
};

export function resolveEstimateRequestEditPolicy(request: EstimateRequest): EstimateRequestEditPolicy {
  if (!request.projectId && !TERMINAL_STATUSES.has(request.status)) {
    return {
      mode: 'EDIT',
      actionLabel: '수정',
      editable: true,
      reason: '견적 의뢰 기본정보와 연결된 DRAFT 데이터를 함께 갱신합니다.',
    };
  }

  if (request.status === 'WON' && request.projectIntake?.status === 'DRAFT') {
    return {
      mode: 'CORRECTION',
      actionLabel: '접수 전 정보 정정',
      editable: true,
      reason: '접수 승인 전 정정이며 견적서 DRAFT, 접수 Draft, DB 연결값에 동기화됩니다.',
    };
  }

  return {
    mode: 'CORRECTION',
    actionLabel: '정정 요청 시작',
    editable: false,
    reason: '완료된 수주·프로젝트 정보는 직접 수정할 수 없습니다. 서버 정정 Workflow가 필요합니다.',
  };
}

export function resolveEstimateRequestDeletePolicy(
  request: EstimateRequest,
  sheet?: Pick<EstimateSheet, 'status' | 'submissions'> | null,
): EstimateRequestDeletePolicy {
  const baseTarget = `${request.requestNo} · ${request.projectName}`;
  return {
    kind: 'ARCHIVE_REQUEST',
    title: '견적 의뢰를 보관합니다',
    description: '의뢰관리 목록에서 제거하고 DB에 보관합니다.',
    targets: [
      baseTarget,
      '견적 DB 원본 행 유지',
      sheet ? `견적서 ${sheet.status}` : '',
      request.projectIntakeId ? '프로젝트 접수' : '',
      request.projectId ? 'Canonical Project' : '',
    ].filter(Boolean),
  };
}

const present = (value: string | null | undefined, fallback: string) => value?.trim() || fallback;

export function mergeEstimateRequestIntoIntakeDraft(
  request: EstimateRequest,
  draft: ProjectIntakeDraft,
): ProjectIntakeDraft {
  const targetUnitIds = request.targetUnitIds?.length ? [...request.targetUnitIds] : [...draft.targetUnitIds];
  const primaryUnitId = request.primaryUnitId && targetUnitIds.includes(request.primaryUnitId)
    ? request.primaryUnitId
    : (draft.primaryUnitId && targetUnitIds.includes(draft.primaryUnitId) ? draft.primaryUnitId : (targetUnitIds[0] || null));
  const scope = request.scope?.trim();
  const firstContact = draft.contacts[0];
  const contactName = request.contact?.trim() || firstContact?.name || '';
  const hasContact = Boolean(contactName || request.contactDepartment || request.phone || request.email || firstContact);

  return {
    ...structuredClone(draft),
    projectName: present(request.projectName, draft.projectName),
    projectNo: present(request.projectNo, draft.projectNo),
    company: present(request.company, draft.company),
    client: present(request.client, draft.client),
    usage: present(request.usage, draft.usage),
    area: present(request.areaPy, draft.area),
    buildings: present(request.buildingCount, draft.buildings),
    floors: present(request.floors, draft.floors),
    basementFloors: present(request.basementFloors, draft.basementFloors),
    groundFloors: present(request.groundFloors, draft.groundFloors),
    bidDate: present(request.bidDate, draft.bidDate),
    unitPrice: present(request.unitWork, draft.unitPrice),
    businessTypes: request.estimateType?.trim() ? [request.estimateType.trim()] : [...draft.businessTypes],
    scopes: scope ? scope.split(/[,/\n]/).map((item) => item.trim()).filter(Boolean) : [...draft.scopes],
    targetUnitIds,
    primaryUnitId,
    unitScopes: targetUnitIds.map((unitId) => ({
      unitId,
      scope: draft.unitScopes.find((item) => item.unitId === unitId)?.scope || '',
    })),
    contacts: hasContact ? [{
      id: firstContact?.id || 'contact-1',
      name: contactName,
      role: firstContact?.role || '',
      department: present(request.contactDepartment, firstContact?.department || ''),
      telephone: present(request.phone, firstContact?.telephone || ''),
      mobile: firstContact?.mobile || '',
      email: present(request.email, firstContact?.email || ''),
    }, ...draft.contacts.slice(1)] : [],
    expectedStartDate: present(request.expectedStartDate, draft.expectedStartDate),
    firstDelivery: present(request.firstDelivery, draft.firstDelivery),
    secondDelivery: present(request.secondDelivery, draft.secondDelivery),
    thirdDelivery: present(request.thirdDelivery, draft.thirdDelivery),
    finalDelivery: present(request.finalDelivery, draft.finalDelivery),
    workContent: scope || draft.workContent,
    notes: present(request.memo, draft.notes),
    request: present(request.rawMemo, draft.request),
  };
}
