import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyEstimateProfileToState,
  buildEstimateRequestProfile,
  estimateSemanticState,
  missingEstimateProfileFields,
} from './estimateRequestProfile';
import { createEstimateSheetState } from './estimateSheetTemplates';
import type { EstimateRequest } from '@/types/models';

const request = (overrides: Partial<EstimateRequest> = {}): EstimateRequest => ({
  id: 'estimate-request-demo', requestNo: 'ER-DEMO-001', status: 'REQUEST_MEMO', projectName: 'Demo Project',
  company: 'Demo Vendor', client: 'Demo Client', departmentId: 'TECHNICAL_HQ', requestDate: '2026-08-04',
  workCategory: 'Quantity take-off', usage: 'Office', scope: 'Finish', firstDelivery: '2026-08-31',
  targetUnitIds: ['FINISH'], primaryUnitId: 'FINISH', version: 1, createdBy: 'demo-admin', updatedBy: 'demo-admin',
  createdAt: '2026-08-04T00:00:00.000Z', updatedAt: '2026-08-04T00:00:00.000Z', activities: [], attachments: [], histories: [],
  ...overrides,
});

test('canonical estimate profile reports required gaps', () => {
  assert.deepEqual(missingEstimateProfileFields(buildEstimateRequestProfile(request())), []);
  assert.ok(missingEstimateProfileFields(buildEstimateRequestProfile(request({ scope: '' }))).includes('scope'));
});

test('profile sync prefills source cells and preserves manual overrides', () => {
  const profile = buildEstimateRequestProfile(request());
  const initial = applyEstimateProfileToState(createEstimateSheetState('개산견적'), profile);
  assert.equal(initial.cells['6:2'].value, 'Demo Project');
  initial.cells['6:2'] = { value: 'Manual Project', manualOverride: true };
  const synced = applyEstimateProfileToState(initial, { ...profile, projectName: 'Changed Source' });
  assert.equal(synced.cells['6:2'].value, 'Manual Project');
  assert.deepEqual(estimateSemanticState(synced).cells['6:2'], { value: 'Manual Project', formula: '', userFormula: false });
});
