import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocalWonPipeline } from './projectPipeline';
import type { EstimateRequest } from '@/types/models';

const request = (patch: Partial<EstimateRequest> = {}): EstimateRequest => ({
  id: 'estimate-request-1', requestNo: 'ER-20260803-01', status: 'WAITING', projectName: 'Demo Project',
  company: 'Demo Client', departmentId: 'department-demo', requestDate: '2026-08-03', version: 3,
  createdBy: 'demo-admin', updatedBy: 'demo-admin', createdAt: '2026-08-03T00:00:00.000Z', updatedAt: '2026-08-03T00:00:00.000Z',
  activities: [], attachments: [], histories: [], targetUnitIds: ['FINISH', 'STRUCTURE'], primaryUnitId: 'FINISH',
  ...patch,
});

test('builds one canonical won chain without assigning a PM', () => {
  const result = buildLocalWonPipeline({ request: request(), decisionInput: { decision: 'WON' }, actorId: 'demo-admin', companyId: 'CON_COST', timestamp: '2026-08-03T01:00:00.000Z' });
  assert.equal(result.project.id, 'project-estimate-request-1');
  assert.equal(result.intake.id, 'project-intake-estimate-request-1');
  assert.equal(result.decision.id, 'commercial-decision-estimate-request-1');
  assert.equal(result.project.publicationStatus, 'DRAFT');
  assert.equal(result.project.projectNo, undefined);
  assert.equal(result.intake.projectNo, '');
  assert.equal(result.project.pmId, undefined);
  assert.equal(result.intake.draft?.primaryUnitId, 'FINISH');
  assert.deepEqual(result.project.assignedUnitIds, ['FINISH', 'STRUCTURE']);
  assert.equal(result.request.worklistState, 'TRANSFERRED_TO_INTAKE');
});

test('uses stable IDs for an idempotent retry', () => {
  const input = { request: request(), decisionInput: { decision: 'WON' as const }, actorId: 'demo-admin', companyId: 'CON_COST', timestamp: '2026-08-03T01:00:00.000Z' };
  const first = buildLocalWonPipeline(input);
  const second = buildLocalWonPipeline(input);
  assert.equal(first.project.id, second.project.id);
  assert.equal(first.intake.id, second.intake.id);
  assert.equal(first.decision.idempotencyKey, second.decision.idempotencyKey);
});

test('blocks won confirmation when no execution department is selected', () => {
  assert.throws(() => buildLocalWonPipeline({ request: request({ targetUnitIds: [], primaryUnitId: null }), decisionInput: { decision: 'WON' }, actorId: 'demo-admin', companyId: 'CON_COST', timestamp: '2026-08-03T01:00:00.000Z' }), /담당부서/);
});
