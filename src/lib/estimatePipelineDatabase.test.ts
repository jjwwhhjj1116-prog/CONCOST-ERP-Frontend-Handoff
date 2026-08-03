import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEstimatePipelineDbInput } from './estimatePipelineDatabase';
import type { EstimateRequest } from '../types/models';

const request = {
  id: 'request-demo-001',
  requestNo: 'ER-DEMO-001',
  status: 'REQUEST_MEMO',
  projectName: 'Demo Project',
  departmentId: 'department-demo',
  targetUnitIds: ['FINISH', 'STRUCTURE'],
  primaryUnitId: 'FINISH',
  requestDate: '2026-08-01T00:00:00.000Z',
  version: 1,
  createdBy: 'user-demo',
  updatedBy: 'user-demo',
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  activities: [],
  attachments: [],
  histories: [],
} as EstimateRequest;

test('uses one request source id through every project database stage', () => {
  const rows = (['REQUEST', 'SHEET', 'DECISION', 'INTAKE'] as const).map((stage) =>
    buildEstimatePipelineDbInput(request, { stage, projectId: 'project-demo-001' }));
  assert.deepEqual(new Set(rows.map((row) => row.sourceRecordId)), new Set([request.id]));
  assert.deepEqual(new Set(rows.map((row) => row.projectId)), new Set(['project-demo-001']));
  assert.deepEqual(new Set(rows.map((row) => row.section)), new Set(['PJ']));
});

test('keeps canonical execution unit ids instead of department-name matching', () => {
  const row = buildEstimatePipelineDbInput(request, { stage: 'REQUEST' });
  assert.equal(row.data['Execution Unit IDs'], 'FINISH,STRUCTURE');
  assert.equal(row.data['Primary Unit ID'], 'FINISH');
});
