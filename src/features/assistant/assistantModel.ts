import type { RuntimeExecutionMode } from '@/lib/runtimeExecutionMode';

export type AssistantCompanyId = 'CON_COST' | 'VIET_QS';
export type AssistantLocale = 'ko' | 'vi' | 'en';
export type AssistantMascotState =
  | 'IDLE'
  | 'GREETING'
  | 'LISTENING'
  | 'THINKING'
  | 'ANSWER_READY'
  | 'BLOCKED'
  | 'ERROR';

export type AssistantErrorCode =
  | 'AUTH_REQUIRED'
  | 'COMPANY_SCOPE_REQUIRED'
  | 'FORBIDDEN'
  | 'RESOURCE_NOT_FOUND'
  | 'BACKEND_REQUIRED'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PRIVATE_PROVIDER_REQUIRED'
  | 'RETRYABLE_ERROR'
  | 'UNKNOWN_ERROR';

export type AssistantSourceType =
  | 'PROJECT'
  | 'PROJECT_INTAKE'
  | 'TASK'
  | 'SCHEDULE'
  | 'APPROVAL'
  | 'BOARD_POST'
  | 'CUSTOMER'
  | 'CONTACT'
  | 'FINANCE'
  | 'CLAIM'
  | 'MEETING'
  | 'DRIVE_FILE'
  | 'ORGANIZATION'
  | 'SYSTEM_HELP';

export type AssistantActionKind =
  | 'OPEN_RECORD'
  | 'CREATE_TASK_DRAFT'
  | 'CREATE_CALENDAR_DRAFT'
  | 'CREATE_MAIL_DRAFT'
  | 'CREATE_APPROVAL_DRAFT'
  | 'START_MEETING_NOTE_TOOL';

export interface AssistantThread {
  id: string;
  companyId: AssistantCompanyId;
  ownerPersonnelId: string;
  title: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  lastRoute?: string | null;
  lastEntityType?: string | null;
  lastEntityId?: string | null;
}

export interface AssistantCitation {
  id: string;
  sourceType: AssistantSourceType;
  sourceId: string;
  label: string;
  href: string;
  excerpt?: string | null;
}

export interface AssistantActionCandidate {
  id: string;
  kind: AssistantActionKind;
  label: string;
  payload: Record<string, string | number | boolean | null>;
  status: 'PROPOSED' | 'CONFIRMED' | 'CANCELLED' | 'BLOCKED';
}

export interface AssistantMessage {
  id: string;
  companyId: AssistantCompanyId;
  threadId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM_NOTICE';
  content: string;
  status: 'SENDING' | 'STREAMING' | 'COMPLETE' | 'BLOCKED' | 'ERROR';
  citations: AssistantCitation[];
  actionCandidates: AssistantActionCandidate[];
  createdAt: string;
  runtimeMode: RuntimeExecutionMode;
  modelLabel?: string | null;
  answerKind?: 'DEMO_RULE_ENGINE' | 'SYSTEM_HELP' | 'PROVIDER' | 'BOUNDARY_NOTICE';
  errorCode?: AssistantErrorCode | null;
  correlationId?: string | null;
}

export interface AssistantPageContext {
  companyId: AssistantCompanyId;
  route: string;
  entityType?: string | null;
  entityId?: string | null;
  label?: string | null;
  sensitivity: 'NORMAL' | 'FINANCE' | 'HR' | 'RESTRICTED_LEGAL';
}

export interface AssistantSettings {
  visible: boolean;
  proactiveHints: boolean;
  answerLanguage: 'AUTO' | AssistantLocale;
  answerLength: 'SHORT' | 'STANDARD';
  mascotMotion: boolean;
}

export interface AssistantAnswer {
  content: string;
  citations: AssistantCitation[];
  actionCandidates: AssistantActionCandidate[];
  answerKind: NonNullable<AssistantMessage['answerKind']>;
  modelLabel: string;
  status: Extract<AssistantMessage['status'], 'COMPLETE' | 'BLOCKED' | 'ERROR'>;
  errorCode?: AssistantErrorCode;
  correlationId?: string;
  resolvedEntity?: { type: string; id: string } | null;
}

export const assistantId = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`}`;
