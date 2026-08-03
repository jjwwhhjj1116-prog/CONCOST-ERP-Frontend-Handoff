import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEstimatePipelineDbInput } from './estimatePipelineDatabase';
import type { EstimateRequest } from '../types/models';

const request = {
  id: 'request-demo-001',
  requestNo: 'ER-DEMO-001',
  status: 'REQUEST_MEMO',
  projectName: 'Demo Project',
  company: 'Demo Client Company',
  client: 'Demo Customer',
  contact: 'Demo Contact',
  phone: '000-0000-0000',
  email: 'pipeline@example.invalid',
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

test('projects canonical pipeline values into the legacy PJ display columns', () => {
  const row = buildEstimatePipelineDbInput(request, {
    stage: 'DECISION',
    projectId: 'project-demo-001',
    decision: 'WON',
    occurredAt: '2026-08-03T01:00:00.000Z',
  });
  assert.equal(row.data['접수번호'], request.requestNo);
  assert.equal(row.data['프로젝트 연결'], 'project-demo-001');
  assert.equal(row.data['프로젝트명'], request.projectName);
  assert.equal(row.data['거래처명'], request.company);
  assert.equal(row.data['작업공종'], 'FINISH,STRUCTURE');
  assert.equal(row.data['업무단계2'], 'DECISION');
  assert.equal(row.data['수주일자'], '2026-08-03');
  assert.equal(row.data['Project ID'], row.data['프로젝트 연결']);
});
