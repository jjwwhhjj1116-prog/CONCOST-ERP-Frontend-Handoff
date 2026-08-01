import type { CompanyId } from '@/types/models';

export type MobileUploadSessionState =
  | 'OPEN'
  | 'UPLOADED'
  | 'CLAIMED'
  | 'EXPIRED'
  | 'CANCELLED';

export type BusinessCardInboxState =
  | 'RECEIVED'
  | 'OCR_PENDING'
  | 'REVIEW_REQUIRED'
  | 'DUPLICATE_REVIEW'
  | 'READY_TO_CREATE'
  | 'COMPLETED'
  | 'FAILED';

export type MobileUploadSession = {
  id: string;
  companyId: CompanyId;
  state: MobileUploadSessionState;
  createdAt: string;
  expiresAt: string;
  singleUse: true;
};

export type BusinessCardInboxItem = {
  id: string;
  companyId: CompanyId;
  sessionId: string;
  fileName: string;
  fileSize: number;
  state: BusinessCardInboxState;
  receivedAt: string;
};

const TEN_MINUTES = 10 * 60 * 1000;

export function createOneTimeUploadSession(
  companyId: CompanyId,
  now = Date.now(),
): MobileUploadSession {
  return {
    id: `bc-session-${globalThis.crypto?.randomUUID?.() || now}`,
    companyId,
    state: 'OPEN',
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + TEN_MINUTES).toISOString(),
    singleUse: true,
  };
}

export function isUploadSessionUsable(
  session: MobileUploadSession,
  companyId: CompanyId,
  now = Date.now(),
) {
  return (
    session.companyId === companyId &&
    session.state === 'OPEN' &&
    Date.parse(session.expiresAt) > now
  );
}

const inboxTransitions: Record<
  BusinessCardInboxState,
  readonly BusinessCardInboxState[]
> = {
  RECEIVED: ['OCR_PENDING', 'FAILED'],
  OCR_PENDING: ['REVIEW_REQUIRED', 'FAILED'],
  REVIEW_REQUIRED: ['DUPLICATE_REVIEW', 'READY_TO_CREATE', 'FAILED'],
  DUPLICATE_REVIEW: ['READY_TO_CREATE', 'FAILED'],
  READY_TO_CREATE: ['COMPLETED', 'FAILED'],
  COMPLETED: [],
  FAILED: ['OCR_PENDING'],
};

export function canTransitionBusinessCardInbox(
  from: BusinessCardInboxState,
  to: BusinessCardInboxState,
) {
  return inboxTransitions[from].includes(to);
}

export function createBusinessCardInboxItem(
  session: MobileUploadSession,
  file: Pick<File, 'name' | 'size'>,
  now = Date.now(),
): BusinessCardInboxItem {
  if (!isUploadSessionUsable(session, session.companyId, now)) {
    throw new Error('UPLOAD_SESSION_NOT_AVAILABLE');
  }
  return {
    id: `bc-inbox-${globalThis.crypto?.randomUUID?.() || now}`,
    companyId: session.companyId,
    sessionId: session.id,
    fileName: file.name,
    fileSize: file.size,
    state: 'RECEIVED',
    receivedAt: new Date(now).toISOString(),
  };
}
