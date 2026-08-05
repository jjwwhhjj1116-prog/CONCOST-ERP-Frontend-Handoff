import type { EstimateRequest, EstimateSheet, ProjectIntakeDraft } from '@/types/models';

export type EstimateRequestEditMode = 'VIEW' | 'EDIT' | 'CORRECTION' | 'SAVING';

export type EstimateRequestEditPolicy = {
  mode: Exclude<EstimateRequestEditMode, 'SAVING'>;
  actionLabel: string;
  editable: boolean;
  reason: string;
};

export type EstimateRequestDeletePolicy = {
  kind: 'DELETE_REQUEST' | 'DELETE_DRAFT_SHEET_AND_REQUEST' | 'RESTRICTED';
  title: string;
  description: string;
  targets: string[];
};

const TERMINAL_STATUSES = new Set(['LOST', 'CANCELLED']);

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
  const hasTerminalLink = Boolean(
    request.commercialDecisionId || request.projectIntakeId || request.projectId,
  ) || ['WON', 'LOST', 'CANCELLED'].includes(request.status);

  if (hasTerminalLink) {
    return {
      kind: 'RESTRICTED',
      title: '연결된 업무가 있어 삭제할 수 없습니다',
      description: '수주·접수·프로젝트 계보는 감사 이력을 위해 보존합니다. 취소, 보관 또는 정정 요청을 사용하세요.',
      targets: [baseTarget, request.commercialDecisionId ? '수주 판정' : '', request.projectIntakeId ? '프로젝트 접수' : '', request.projectId ? 'Canonical Project' : ''].filter(Boolean),
    };
  }

  if (sheet) {
    if (sheet.status !== 'DRAFT' || sheet.submissions.length > 0) {
      return {
        kind: 'RESTRICTED',
        title: '발행 이력이 있는 견적서는 삭제할 수 없습니다',
        description: '작성완료 또는 발송된 Version은 보존하고 수정본 또는 정정 절차를 사용하세요.',
        targets: [baseTarget, `견적서 ${sheet.status}`],
      };
    }
    return {
      kind: 'DELETE_DRAFT_SHEET_AND_REQUEST',
      title: '견적 의뢰와 DRAFT 견적서를 함께 삭제합니다',
      description: '삭제 후 복구할 수 없습니다. 아래 대상만 제거되며 수주·프로젝트 데이터에는 영향을 주지 않습니다.',
      targets: [baseTarget, 'DRAFT 견적서', '연결된 견적 DB 요청 행'],
    };
  }

  return {
    kind: 'DELETE_REQUEST',
    title: '연결되지 않은 견적 의뢰를 삭제합니다',
    description: '삭제 후 복구할 수 없습니다. 수주·접수·프로젝트와 연결되지 않은 의뢰만 삭제합니다.',
    targets: [baseTarget, '연결된 견적 DB 요청 행'],
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
