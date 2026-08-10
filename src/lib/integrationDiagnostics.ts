import { canManageWorkspaceConfiguration } from '@/lib/accessControl';
import type { ApiCompanyId, ApiRequestDiagnostic } from '@/lib/apiClient';
import {
  getRuntimeExecutionMode,
  type RuntimeExecutionMode,
} from '@/lib/runtimeExecutionMode';
import type { PersonnelCard } from '@/types/models';

export type IntegrationCapabilityState =
  | 'DEMO_SIMULATED'
  | 'BACKEND_REQUIRED'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'READY'
  | 'DEGRADED'
  | 'ERROR';

export type IntegrationMilestoneId =
  | 'M0'
  | 'M1'
  | 'M2'
  | 'M3'
  | 'M4'
  | 'M5'
  | 'M6'
  | 'M7';

export type IntegrationMilestoneStatus = 'NOT_TESTED' | 'BLOCKED' | 'FAIL' | 'PASS';

export type IntegrationCapabilityId =
  | 'RUNTIME'
  | 'AUTH_COMPANY'
  | 'PROJECT_CORE'
  | 'FILE_DRIVE'
  | 'APPROVAL'
  | 'MAIL'
  | 'BUSINESS_CARD_CONTACT'
  | 'SALES'
  | 'FINANCE'
  | 'CLAIM'
  | 'AI';

export type IntegrationErrorCode =
  | 'RUNTIME_MODE_INVALID'
  | 'API_BASE_MISSING'
  | 'AUTH_REQUIRED'
  | 'COMPANY_REQUIRED'
  | 'COMPANY_CONTEXT_MISMATCH'
  | 'STALE_COMPANY_RESPONSE'
  | 'PERMISSION_DENIED'
  | 'ADAPTER_UNAVAILABLE'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'REVISION_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT'
  | 'RESPONSE_INVALID'
  | 'UNKNOWN_ERROR';

export const INTEGRATION_ERROR_CODES: readonly IntegrationErrorCode[] = [
  'RUNTIME_MODE_INVALID',
  'API_BASE_MISSING',
  'AUTH_REQUIRED',
  'COMPANY_REQUIRED',
  'COMPANY_CONTEXT_MISMATCH',
  'STALE_COMPANY_RESPONSE',
  'PERMISSION_DENIED',
  'ADAPTER_UNAVAILABLE',
  'PROVIDER_NOT_CONFIGURED',
  'NETWORK_ERROR',
  'TIMEOUT',
  'REVISION_CONFLICT',
  'IDEMPOTENCY_CONFLICT',
  'RESPONSE_INVALID',
  'UNKNOWN_ERROR',
];

type IntegrationHealth = 'HEALTHY' | 'DEGRADED' | 'ERROR';

export interface IntegrationEnvironment {
  mode: RuntimeExecutionMode;
  apiBaseUrl?: string;
  authAdapterReady: boolean;
  projectAdapterReady: boolean;
  driveAdapterReady: boolean;
  driveProviderReady: boolean;
  approvalAdapterReady: boolean;
  approvalProviderReady: boolean;
  mailAdapterReady: boolean;
  mailProviderReady: boolean;
  businessCardAdapterReady: boolean;
  businessCardProviderReady: boolean;
  salesAdapterReady: boolean;
  financeAdapterReady: boolean;
  claimAdapterReady: boolean;
  aiAdapterReady: boolean;
  aiProviderReady: boolean;
  projectHealth: IntegrationHealth;
  collaborationHealth: IntegrationHealth;
  businessHealth: IntegrationHealth;
  claimAiHealth: IntegrationHealth;
}

export interface IntegrationCapability {
  id: IntegrationCapabilityId;
  milestone: IntegrationMilestoneId;
  label: string;
  adapter: string;
  provider: string;
  state: IntegrationCapabilityState;
  detail: string;
}

export interface IntegrationMilestone {
  id: IntegrationMilestoneId;
  label: string;
  capabilityIds: IntegrationCapabilityId[];
  status: IntegrationMilestoneStatus;
  reason: string;
}

export interface IntegrationDiagnosticsSnapshot {
  runtime: RuntimeExecutionMode;
  apiBase: string;
  sessionState: 'AUTHENTICATED' | 'ANONYMOUS' | 'CHECKING' | 'RECOVERY_ERROR';
  companyScope: 'ALIGNED' | 'MISSING' | 'MISMATCH';
  selectedCompanyId: ApiCompanyId | 'NOT_SELECTED';
  apiCompanyId: ApiCompanyId | 'NOT_SELECTED';
  capabilities: IntegrationCapability[];
  milestones: IntegrationMilestone[];
  lastRequest: ApiRequestDiagnostic | null;
}

const envFlag = (value: string | undefined) => value === 'true';

const health = (value: string | undefined): IntegrationHealth => {
  if (value === 'DEGRADED' || value === 'ERROR') return value;
  return 'HEALTHY';
};

export const readIntegrationEnvironment = (): IntegrationEnvironment => ({
  mode: getRuntimeExecutionMode(),
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  authAdapterReady: envFlag(process.env.NEXT_PUBLIC_AUTH_ADAPTER_READY),
  projectAdapterReady: envFlag(process.env.NEXT_PUBLIC_PROJECT_ADAPTER_READY),
  driveAdapterReady: envFlag(process.env.NEXT_PUBLIC_DRIVE_ADAPTER_READY),
  driveProviderReady: envFlag(process.env.NEXT_PUBLIC_DRIVE_PROVIDER_READY),
  approvalAdapterReady:
    envFlag(process.env.NEXT_PUBLIC_APPROVAL_ADAPTER_READY) &&
    envFlag(process.env.NEXT_PUBLIC_APPROVAL_POLICY_READY),
  approvalProviderReady: envFlag(process.env.NEXT_PUBLIC_APPROVAL_SERVER_READY),
  mailAdapterReady: envFlag(process.env.NEXT_PUBLIC_MAIL_ADAPTER_READY),
  mailProviderReady: envFlag(process.env.NEXT_PUBLIC_MAIL_PROVIDER_READY),
  businessCardAdapterReady: envFlag(process.env.NEXT_PUBLIC_BUSINESS_CARD_ADAPTER_READY),
  businessCardProviderReady:
    envFlag(process.env.NEXT_PUBLIC_BUSINESS_CARD_OCR_PROVIDER_READY) ||
    Boolean(process.env.NEXT_PUBLIC_BUSINESS_CARD_OCR_ENDPOINT),
  salesAdapterReady: envFlag(process.env.NEXT_PUBLIC_SALES_ADAPTER_READY),
  financeAdapterReady: envFlag(process.env.NEXT_PUBLIC_FINANCE_ADAPTER_READY),
  claimAdapterReady: envFlag(process.env.NEXT_PUBLIC_CLAIM_ADAPTER_READY),
  aiAdapterReady: envFlag(process.env.NEXT_PUBLIC_AI_ADAPTER_READY),
  aiProviderReady: envFlag(process.env.NEXT_PUBLIC_AI_PROVIDER_READY),
  projectHealth: health(process.env.NEXT_PUBLIC_PROJECT_INTEGRATION_HEALTH),
  collaborationHealth: health(process.env.NEXT_PUBLIC_COLLABORATION_INTEGRATION_HEALTH),
  businessHealth: health(process.env.NEXT_PUBLIC_BUSINESS_INTEGRATION_HEALTH),
  claimAiHealth: health(process.env.NEXT_PUBLIC_CLAIM_AI_INTEGRATION_HEALTH),
});

export const sanitizeApiBase = (value?: string) => {
  if (!value?.trim()) return 'NOT_CONFIGURED';
  const trimmed = value.trim();
  if (trimmed.startsWith('/')) return trimmed.split(/[?#]/, 1)[0] || '/';
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}${url.pathname}`.replace(/\/$/, '');
  } catch {
    return 'INVALID_CONFIGURATION';
  }
};

export const redactDiagnosticRecord = (
  record: Record<string, unknown>,
): Record<string, unknown> => Object.fromEntries(
  Object.entries(record).map(([key, value]) => [
    key,
    /(authorization|cookie|token|secret|password|credential|session(id|key|token|cookie))/i.test(key)
      ? '[REDACTED]'
      : value,
  ]),
);

export const canAccessIntegrationDiagnostics = (
  user: Pick<PersonnelCard, 'accessGrade' | 'role' | 'organizationRank'>,
) => canManageWorkspaceConfiguration(user);

const capabilityState = ({
  mode,
  adapterReady,
  providerRequired = false,
  providerReady = true,
  currentHealth = 'HEALTHY',
}: {
  mode: RuntimeExecutionMode;
  adapterReady: boolean;
  providerRequired?: boolean;
  providerReady?: boolean;
  currentHealth?: IntegrationHealth;
}): IntegrationCapabilityState => {
  if (mode === 'DEMO_LOCAL') return 'DEMO_SIMULATED';
  if (currentHealth === 'ERROR') return 'ERROR';
  if (!adapterReady) return 'BACKEND_REQUIRED';
  if (providerRequired && !providerReady) return 'PROVIDER_NOT_CONFIGURED';
  if (currentHealth === 'DEGRADED') return 'DEGRADED';
  return 'READY';
};

const capabilityDetail: Record<IntegrationCapabilityState, string> = {
  DEMO_SIMULATED: 'Browser simulation only. No server persistence is claimed.',
  BACKEND_REQUIRED: 'The typed frontend adapter exists, but the backend capability is unavailable.',
  PROVIDER_NOT_CONFIGURED: 'The backend provider has not been configured or verified.',
  READY: 'Build-time capability is declared ready. A smoke probe is still required.',
  DEGRADED: 'The declared capability is available with a known degraded condition.',
  ERROR: 'The declared capability reported an integration error.',
};

const capability = (
  id: IntegrationCapabilityId,
  milestone: IntegrationMilestoneId,
  label: string,
  adapter: string,
  provider: string,
  state: IntegrationCapabilityState,
): IntegrationCapability => ({
  id,
  milestone,
  label,
  adapter,
  provider,
  state,
  detail: capabilityDetail[state],
});

export const buildCapabilityRegistry = (
  environment: IntegrationEnvironment = readIntegrationEnvironment(),
): IntegrationCapability[] => {
  const runtimeState: IntegrationCapabilityState =
    environment.mode === 'DEMO_LOCAL' ? 'DEMO_SIMULATED' : 'READY';
  const hasApiBase = sanitizeApiBase(environment.apiBaseUrl) !== 'NOT_CONFIGURED';

  return [
    capability('RUNTIME', 'M0', 'Runtime boundary', 'RuntimeExecutionMode', 'Not required', runtimeState),
    capability(
      'AUTH_COMPANY',
      'M1',
      'Authentication and company scope',
      'Auth/Company adapter',
      'Session provider',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.authAdapterReady && hasApiBase,
      }),
    ),
    capability(
      'PROJECT_CORE',
      'M2',
      'Project core',
      'Project adapter',
      'Not required',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.projectAdapterReady,
        currentHealth: environment.projectHealth,
      }),
    ),
    capability(
      'FILE_DRIVE',
      'M3',
      'File and Drive',
      'Drive adapter',
      'Google Shared Drive',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.driveAdapterReady,
        providerRequired: true,
        providerReady: environment.driveProviderReady,
      }),
    ),
    capability(
      'APPROVAL',
      'M4',
      'Electronic approval',
      'Approval adapter and policy',
      'Approval server',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.approvalAdapterReady,
        providerRequired: true,
        providerReady: environment.approvalProviderReady,
        currentHealth: environment.collaborationHealth,
      }),
    ),
    capability(
      'MAIL',
      'M4',
      'Electronic mail',
      'Mail adapter',
      'Mail provider',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.mailAdapterReady,
        providerRequired: true,
        providerReady: environment.mailProviderReady,
        currentHealth: environment.collaborationHealth,
      }),
    ),
    capability(
      'BUSINESS_CARD_CONTACT',
      'M5',
      'Business card and Contact',
      'Business card adapter',
      'OCR provider',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.businessCardAdapterReady,
        providerRequired: true,
        providerReady: environment.businessCardProviderReady,
        currentHealth: environment.businessHealth,
      }),
    ),
    capability(
      'SALES',
      'M6',
      'Sales CRM',
      'Sales adapter',
      'Not required',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.salesAdapterReady,
        currentHealth: environment.businessHealth,
      }),
    ),
    capability(
      'FINANCE',
      'M6',
      'Finance ERP',
      'Finance adapter',
      'Tax/Bank providers',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.financeAdapterReady,
        currentHealth: environment.businessHealth,
      }),
    ),
    capability(
      'CLAIM',
      'M7',
      'Claim workspace',
      'Claim adapter',
      'Not required',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.claimAdapterReady,
        currentHealth: environment.claimAiHealth,
      }),
    ),
    capability(
      'AI',
      'M7',
      'AI and STT',
      'AI adapter',
      'AI/STT provider',
      capabilityState({
        mode: environment.mode,
        adapterReady: environment.aiAdapterReady,
        providerRequired: true,
        providerReady: environment.aiProviderReady,
        currentHealth: environment.claimAiHealth,
      }),
    ),
  ];
};

const milestoneDefinitions: Array<{
  id: IntegrationMilestoneId;
  label: string;
  capabilityIds: IntegrationCapabilityId[];
}> = [
  { id: 'M0', label: 'Runtime', capabilityIds: ['RUNTIME'] },
  { id: 'M1', label: 'Auth / Company', capabilityIds: ['AUTH_COMPANY'] },
  { id: 'M2', label: 'Project Core', capabilityIds: ['PROJECT_CORE'] },
  { id: 'M3', label: 'File / Drive', capabilityIds: ['FILE_DRIVE'] },
  { id: 'M4', label: 'Approval / Mail', capabilityIds: ['APPROVAL', 'MAIL'] },
  { id: 'M5', label: 'Business Card / Contact', capabilityIds: ['BUSINESS_CARD_CONTACT'] },
  { id: 'M6', label: 'Sales / Finance', capabilityIds: ['SALES', 'FINANCE'] },
  { id: 'M7', label: 'Claim / AI', capabilityIds: ['CLAIM', 'AI'] },
];

export const buildSmokeMilestones = (
  capabilities: IntegrationCapability[],
  mode: RuntimeExecutionMode,
  probeResults: Partial<Record<IntegrationMilestoneId, 'PASS' | 'FAIL'>> = {},
): IntegrationMilestone[] => milestoneDefinitions.map((definition) => {
  const members = capabilities.filter((item) => definition.capabilityIds.includes(item.id));
  const probe = probeResults[definition.id];
  let status: IntegrationMilestoneStatus = 'NOT_TESTED';
  let reason = 'No backend smoke probe has been executed.';

  if (probe === 'FAIL' || members.some((member) => member.state === 'ERROR')) {
    status = 'FAIL';
    reason = 'A backend smoke probe or declared capability returned an error.';
  } else if (mode === 'DEMO_LOCAL') {
    status = 'NOT_TESTED';
    reason = 'DEMO_LOCAL cannot certify an API Sandbox milestone.';
  } else if (members.some((member) =>
    member.state === 'BACKEND_REQUIRED' || member.state === 'PROVIDER_NOT_CONFIGURED'
  )) {
    status = 'BLOCKED';
    reason = 'A required backend adapter or provider is unavailable.';
  } else if (probe === 'PASS' && members.every((member) => member.state === 'READY')) {
    status = 'PASS';
    reason = 'An explicit backend smoke probe passed for every required capability.';
  }

  return { ...definition, status, reason };
});

export const buildIntegrationDiagnosticsSnapshot = ({
  environment = readIntegrationEnvironment(),
  sessionState,
  selectedCompanyId,
  apiCompanyId,
  lastRequest,
}: {
  environment?: IntegrationEnvironment;
  sessionState: IntegrationDiagnosticsSnapshot['sessionState'];
  selectedCompanyId: ApiCompanyId | null;
  apiCompanyId: ApiCompanyId | null;
  lastRequest: ApiRequestDiagnostic | null;
}): IntegrationDiagnosticsSnapshot => {
  const capabilities = buildCapabilityRegistry(environment);
  const companyScope = !selectedCompanyId || !apiCompanyId
    ? 'MISSING'
    : selectedCompanyId === apiCompanyId
      ? 'ALIGNED'
      : 'MISMATCH';

  return {
    runtime: environment.mode,
    apiBase: sanitizeApiBase(environment.apiBaseUrl),
    sessionState,
    companyScope,
    selectedCompanyId: selectedCompanyId ?? 'NOT_SELECTED',
    apiCompanyId: apiCompanyId ?? 'NOT_SELECTED',
    capabilities,
    milestones: buildSmokeMilestones(capabilities, environment.mode),
    lastRequest,
  };
};
