import type { CompanyId, EstimateRequest, EstimateSheet } from '@/types/models';

export type EstimateMailDraft = {
  id: string;
  companyId: CompanyId;
  to: string;
  subject: string;
  body: string;
  projectId: string | null;
  attachmentNames: string[];
  estimateRequestId: string;
  sheetId: string;
  version: number;
  createdAt: string;
};

const PREFIX = 'estimate-mail-draft-v1:';

function storage() {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

export function createEstimateMailDraft(
  companyId: CompanyId,
  request: EstimateRequest,
  sheet: EstimateSheet,
): EstimateMailDraft {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
  return {
    id,
    companyId,
    to: request.email || '',
    subject: `[견적서] ${request.projectName}`,
    body: `${request.client || request.company || '담당자'} 귀중\n\n${request.projectName} 견적서 작성완료본을 전달드립니다.\n\n감사합니다.`,
    projectId: request.projectId || null,
    attachmentNames: [
      `CONCOST_${sheet.templateType}_v${sheet.currentVersion}.xlsx`,
      `CONCOST_${sheet.templateType}_v${sheet.currentVersion}.pdf`,
    ],
    estimateRequestId: request.id,
    sheetId: sheet.id,
    version: sheet.currentVersion,
    createdAt: new Date().toISOString(),
  };
}

export function storeEstimateMailDraft(draft: EstimateMailDraft) {
  storage()?.setItem(`${PREFIX}${draft.id}`, JSON.stringify(draft));
  return draft.id;
}

export function readEstimateMailDraft(id: string, companyId: CompanyId): EstimateMailDraft | null {
  const raw = storage()?.getItem(`${PREFIX}${id}`);
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as EstimateMailDraft;
    return draft.companyId === companyId ? draft : null;
  } catch {
    return null;
  }
}
