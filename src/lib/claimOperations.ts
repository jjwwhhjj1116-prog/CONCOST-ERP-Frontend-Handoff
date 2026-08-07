import type { Project } from '@/types/models';

export type ClaimProjectKind = 'INTERNAL_CLAIM' | 'CONSULTING_PROJECT';
export type ClaimClassification = 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED_LEGAL';
export type ClaimFileState = 'QUEUED' | 'SCANNING' | 'READY' | 'REJECTED';
export type ClaimMeetingStatus = 'DRAFT' | 'AI_REVIEW' | 'CONFIRMED';
export type ClaimIssueStatus = 'OPEN' | 'ANALYZING' | 'RESOLVED';
export type ClaimReportStatus = 'DRAFT' | 'REVIEW' | 'APPROVAL_PENDING' | 'APPROVED' | 'DELIVERED';

export const CLAIM_FOLDER_CATALOG = [
  { code: '00', key: 'PROJECT_MANAGEMENT', ko: '프로젝트관리', vi: 'Quản lý dự án', en: 'Project management' },
  { code: '01', key: 'CONTRACT_AWARD', ko: '계약·수주', vi: 'Hợp đồng · Trúng thầu', en: 'Contract and award' },
  { code: '02', key: 'INTAKE_SOURCE', ko: '접수원본', vi: 'Hồ sơ tiếp nhận', en: 'Intake source' },
  { code: '03', key: 'SITE_RESEARCH', ko: '현장조사', vi: 'Khảo sát hiện trường', en: 'Site research' },
  { code: '04', key: 'EVIDENCE', ko: '증거자료', vi: 'Chứng cứ', en: 'Evidence' },
  { code: '05', key: 'MEETING_MINUTES', ko: '회의록', vi: 'Biên bản họp', en: 'Meeting minutes' },
  { code: '06', key: 'ISSUE_ANALYSIS', ko: '쟁점·분석', vi: 'Vấn đề · Phân tích', en: 'Issues and analysis' },
  { code: '07', key: 'WORKPAPER', ko: 'Workpaper', vi: 'Hồ sơ làm việc', en: 'Workpapers' },
  { code: '08', key: 'REPORT', ko: '보고서', vi: 'Báo cáo', en: 'Reports' },
  { code: '09', key: 'APPROVED_FINAL', ko: '결재·확정본', vi: 'Phê duyệt · Bản cuối', en: 'Approval and final' },
  { code: '10', key: 'DELIVERY', ko: '납품', vi: 'Bàn giao', en: 'Delivery' },
] as const;

export type ClaimFolderCode = typeof CLAIM_FOLDER_CATALOG[number]['code'];

export interface ClaimEvidence {
  id: string;
  projectId: string;
  claimId: string;
  folderCode: ClaimFolderCode;
  fileName: string;
  fileReferenceId: string;
  state: ClaimFileState;
  version: number;
  checksum: string;
  classification: ClaimClassification;
  issueId?: string;
  createdBy: string;
  createdAt: string;
}

export interface ClaimAiProvenance {
  provider: string;
  model: string;
  modelVersion: string;
  systemInstructionId: string;
  taskInstructionId: string;
  inputSourceIds: string[];
  inputScope: string;
  sourceHash: string;
  outputHash: string;
  requestedBy: string;
  generatedBy: string;
  generatedAt: string;
  reviewStatus: 'PENDING_HUMAN_REVIEW' | 'HUMAN_REVIEWED';
  reviewerId?: string;
  citations: string[];
}

export interface ClaimMeetingResult {
  summary: string;
  decisions: string[];
  issues: string[];
  actions: string[];
  nextSchedule: string;
  citations: string[];
}

export interface ClaimMeeting {
  id: string;
  projectId: string;
  claimId: string;
  title: string;
  heldAt: string;
  location: string;
  participants: string[];
  roughNotes: string;
  audioName?: string;
  audioConsent: boolean;
  legalBasis?: string;
  classification: ClaimClassification;
  evidenceIds: string[];
  issueIds: string[];
  status: ClaimMeetingStatus;
  aiResult?: ClaimMeetingResult;
  provenance?: ClaimAiProvenance;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimIssue {
  id: string;
  title: string;
  description: string;
  status: ClaimIssueStatus;
  evidenceIds: string[];
  meetingIds: string[];
  ownerId?: string;
  dueDate?: string;
  createdAt: string;
}

export interface ClaimWorkpaper {
  id: string;
  title: string;
  description: string;
  issueIds: string[];
  status: 'DRAFT' | 'REVIEWED';
  version: number;
  createdAt: string;
}

export interface ClaimReport {
  id: string;
  parentReportId?: string;
  revisedFromVersionId?: string;
  title: string;
  status: ClaimReportStatus;
  version: number;
  reportVersionId: string;
  fileReferenceId: string;
  fileState: ClaimFileState;
  approvalRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimDelivery {
  id: string;
  reportId: string;
  reportVersionId: string;
  deliveredAt: string;
  deliveredBy: string;
  recipient: string;
  revisionReason?: string;
}

export interface ClaimHistoryEvent {
  id: string;
  type: string;
  actorId: string;
  reason: string;
  before: string;
  after: string;
  createdAt: string;
}

export interface ClaimProjectRecord {
  projectId: string;
  claimId: string;
  companyId: string;
  kind: ClaimProjectKind;
  revision: number;
  evidences: ClaimEvidence[];
  meetings: ClaimMeeting[];
  issues: ClaimIssue[];
  workpapers: ClaimWorkpaper[];
  reports: ClaimReport[];
  deliveries: ClaimDelivery[];
  history: ClaimHistoryEvent[];
  createdAt: string;
  updatedAt: string;
}

export const isClaimProject = (project?: Project | null) => Boolean(project && (
  project.claimId ||
  project.primaryUnitId === 'CLAIM' ||
  project.assignedUnitIds?.includes('CLAIM') ||
  project.executionAssignments?.some((assignment) => assignment.unitId === 'CLAIM')
));

export const getCanonicalClaimId = (project: Project) => project.claimId || `claim-${project.id}`;

export const createClaimProjectRecord = (
  project: Project,
  actorId: string,
  now = new Date().toISOString(),
): ClaimProjectRecord => ({
  projectId: project.id,
  claimId: getCanonicalClaimId(project),
  companyId: project.companyId || 'CON_COST',
  kind: project.claimType || 'CONSULTING_PROJECT',
  revision: 1,
  evidences: [],
  meetings: [],
  issues: [],
  workpapers: [],
  reports: [],
  deliveries: [],
  history: [{
    id: `claim-history-${project.id}-created`,
    type: 'CLAIM_WORKSPACE_CREATED',
    actorId,
    reason: 'Canonical Claim workspace initialized',
    before: '{}',
    after: JSON.stringify({ projectId: project.id, claimId: getCanonicalClaimId(project) }),
    createdAt: now,
  }],
  createdAt: now,
  updatedAt: now,
});

const REPORT_TRANSITIONS: Record<ClaimReportStatus, ClaimReportStatus[]> = {
  DRAFT: ['REVIEW'],
  REVIEW: ['DRAFT', 'APPROVAL_PENDING'],
  APPROVAL_PENDING: ['REVIEW', 'APPROVED'],
  APPROVED: ['DELIVERED'],
  DELIVERED: [],
};

export const canTransitionClaimReport = (from: ClaimReportStatus, to: ClaimReportStatus) =>
  REPORT_TRANSITIONS[from].includes(to);

export const createClaimChecksum = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const validateClaimEvidence = (evidence: ClaimEvidence) => {
  if (!evidence.projectId || !evidence.claimId) return 'CANONICAL_CONTEXT_REQUIRED';
  if (!evidence.fileReferenceId || !evidence.checksum) return 'FILE_REFERENCE_REQUIRED';
  if (evidence.version < 1) return 'INVALID_VERSION';
  return null;
};

export const nextClaimReportVersion = (reports: ClaimReport[], report: ClaimReport) =>
  Math.max(
    report.version,
    ...reports
      .filter((item) => item.id === report.id || item.parentReportId === report.id || item.parentReportId === report.parentReportId)
      .map((item) => item.version),
  ) + 1;
