import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDriveIntegrationDraft,
  deriveDriveProviderState,
  toDriveIntegrationRequest,
  validateDriveRootFolderUrl,
} from './driveIntegration';

test('drive root folder accepts only Google Drive HTTPS URLs', () => {
  assert.equal(validateDriveRootFolderUrl('https://drive.google.com/drive/folders/folder-1').valid, true);
  assert.equal(validateDriveRootFolderUrl('http://drive.google.com/drive/folders/folder-1').valid, false);
  assert.equal(validateDriveRootFolderUrl('https://example.com/folder-1').valid, false);
});

test('drive root folder rejects token-like query data', () => {
  assert.equal(
    validateDriveRootFolderUrl('https://drive.google.com/drive/folders/1?access_token=secret').valid,
    false,
  );
});

test('drive request contains configuration metadata but no secret fields', () => {
  const draft = createDriveIntegrationDraft('CON_COST');
  draft.accountLabel = 'admin@example.invalid';
  draft.sharedDriveId = 'shared-drive-id';
  draft.rootFolderUrl = 'https://drive.google.com/drive/folders/folder-1';
  const request = toDriveIntegrationRequest(draft);
  assert.equal(request.companyId, 'CON_COST');
  assert.equal('accessToken' in request, false);
  assert.equal('clientSecret' in request, false);
});

test('provider state distinguishes missing provider, adapter degradation and ready', () => {
  assert.equal(
    deriveDriveProviderState({ enabled: true, adapterReady: false, providerReady: false }),
    'NOT_CONFIGURED',
  );
  assert.equal(
    deriveDriveProviderState({ enabled: true, adapterReady: false, providerReady: true }),
    'DEGRADED',
  );
  assert.equal(
    deriveDriveProviderState({ enabled: true, adapterReady: true, providerReady: true }),
    'READY',
  );
});
