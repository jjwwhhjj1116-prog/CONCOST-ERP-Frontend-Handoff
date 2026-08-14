import assert from 'node:assert/strict';
import test from 'node:test';
import { isSalesWorkspacePath } from './workspaceRouteContext';

test('mobile business card routes keep the sales workspace navigation context', () => {
  assert.equal(isSalesWorkspacePath('/mobile/business-cards/capture'), true);
  assert.equal(isSalesWorkspacePath('/mobile/business-cards/capture/'), true);
  assert.equal(isSalesWorkspacePath('/mobile/business-cards'), true);
  assert.equal(isSalesWorkspacePath('/sales/business-cards'), true);
  assert.equal(isSalesWorkspacePath('/'), false);
  assert.equal(isSalesWorkspacePath('/mobile/profile/capture'), false);
});
