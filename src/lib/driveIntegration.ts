import type { CompanyId } from '@/types/models';

export type DriveProviderState =
  | 'NOT_CONFIGURED'
  | 'CONNECTING'
  | 'READY'
  | 'DEGRADED'
  | 'FAILED'
  | 'DISABLED';

export type DriveFolderTemplate = {
  id: string;
  label: string;
  relativePath: string;
  enabled: boolean;
};

export type DriveIntegrationDraft = {
  companyId: CompanyId;
  accountLabel: string;
  sharedDriveId: string;
  sharedDriveName: string;
  rootFolderUrl: string;
  rootFolderId: string;
  folderTemplates: DriveFolderTemplate[];
};

const GOOGLE_DRIVE_HOSTS = new Set(['drive.google.com', 'docs.google.com']);
const forbiddenParameterNames = [
  'access_token',
  'refresh_token',
  'client_secret',
  'api_key',
  'token',
  'secret',
];

export const defaultDriveTemplates = (): DriveFolderTemplate[] => [
  { id: 'project', label: 'Project', relativePath: 'Projects/{projectNo}', enabled: true },
  { id: 'claim', label: 'Claim', relativePath: 'Claims/{claimNo}', enabled: true },
  { id: 'approval', label: 'Approval', relativePath: 'Approvals/{yyyy}', enabled: true },
  { id: 'meeting', label: 'Meeting', relativePath: 'Meetings/{yyyy}/{mm}', enabled: true },
];

export function validateDriveRootFolderUrl(value: string) {
  if (!value.trim()) return { valid: true as const, normalized: '' };
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || !GOOGLE_DRIVE_HOSTS.has(url.hostname)) {
      return { valid: false as const, reason: 'Google Drive HTTPS URL만 사용할 수 있습니다.' };
    }
    if (
      forbiddenParameterNames.some(
        (name) => url.searchParams.has(name) || url.hash.toLowerCase().includes(name),
      )
    ) {
      return { valid: false as const, reason: 'URL에 Token 또는 Secret을 포함할 수 없습니다.' };
    }
    return { valid: true as const, normalized: url.toString() };
  } catch {
    return { valid: false as const, reason: '올바른 Folder URL을 입력하세요.' };
  }
}

export function createDriveIntegrationDraft(companyId: CompanyId): DriveIntegrationDraft {
  return {
    companyId,
    accountLabel: '',
    sharedDriveId: '',
    sharedDriveName: '',
    rootFolderUrl: '',
    rootFolderId: '',
    folderTemplates: defaultDriveTemplates(),
  };
}

export function deriveDriveProviderState(options: {
  enabled: boolean;
  adapterReady: boolean;
  providerReady: boolean;
  permissionTestPassed?: boolean;
}): DriveProviderState {
  if (!options.enabled) return 'DISABLED';
  if (!options.providerReady) return 'NOT_CONFIGURED';
  if (!options.adapterReady) return 'DEGRADED';
  if (options.permissionTestPassed === false) return 'FAILED';
  return 'READY';
}

export function toDriveIntegrationRequest(draft: DriveIntegrationDraft) {
  const folderUrl = validateDriveRootFolderUrl(draft.rootFolderUrl);
  if (!folderUrl.valid) throw new Error(folderUrl.reason);
  return {
    companyId: draft.companyId,
    accountLabel: draft.accountLabel.trim(),
    sharedDriveId: draft.sharedDriveId.trim(),
    sharedDriveName: draft.sharedDriveName.trim(),
    rootFolderUrl: folderUrl.normalized,
    rootFolderId: draft.rootFolderId.trim(),
    folderTemplates: draft.folderTemplates.map((template) => ({
      id: template.id,
      label: template.label.trim(),
      relativePath: template.relativePath.trim(),
      enabled: template.enabled,
    })),
  };
}
