import assert from 'node:assert/strict';
import test from 'node:test';
import type { EstimateRequest, EstimateSheet } from '@/types/models';
import {
  mergeEstimateRequestIntoIntakeDraft,
  resolveEstimateRequestDeletePolicy,
  resolveEstimateRequestEditPolicy,
} from '@/lib/estimateRequestUx';
import { createBlankProjectIntakeDraft } from '@/lib/projectIntake';

const request = (overrides: Partial<EstimateRequest> = {}): EstimateRequest => ({
  id: 'estimate-request-demo', requestNo: 'ER-DEMO-001', status: 'REQUEST_MEMO',
  projectName: 'Demo Project', departmentId: 'dept-demo', requestDate: '2026-08-05',
  version: 1, createdBy: 'demo-user', updatedBy: 'demo-user',
  createdAt: '2026-08-05T00:00:00.000Z', updatedAt: '2026-08-05T00:00:00.000Z',
  activities: [], attachments: [], histories: [], ...overrides,
});

const sheet = (overrides: Partial<EstimateSheet> = {}): EstimateSheet => ({
  id: 'sheet-demo', estimateRequestId: 'estimate-request-demo', templateId: 'template-demo',
  templateType: '개산견적', status: 'DRAFT', currentVersion: 1,
  createdBy: 'demo-user', updatedBy: 'demo-user', createdAt: '2026-08-05T00:00:00.000Z',
  updatedAt: '2026-08-05T00:00:00.000Z', template: { id: 'template-demo', type: '개산견적', sheetName: 'Demo', version: 1, sourceHash: 'demo', active: true, createdAt: '2026-08-05T00:00:00.000Z', updatedAt: '2026-08-05T00:00:00.000Z' },
  versions: [], submissions: [], exports: [], ...overrides,
});

test('unlinked estimate request is directly editable and deletable', () => {
  assert.equal(resolveEstimateRequestEditPolicy(request()).mode, 'EDIT');
  assert.equal(resolveEstimateRequestDeletePolicy(request()).kind, 'DELETE_REQUEST');
});

test('draft estimate sheet is included in cascade preview', () => {
  assert.equal(resolveEstimateRequestDeletePolicy(request({ estimateId: 'sheet-demo' }), sheet()).kind, 'DELETE_DRAFT_SHEET_AND_REQUEST');
});

test('won project is correction-only and protected from hard delete', () => {
  const won = request({ status: 'WON', projectId: 'project-demo', projectIntakeId: 'intake-demo' });
  assert.equal(resolveEstimateRequestEditPolicy(won).editable, false);
  assert.equal(resolveEstimateRequestDeletePolicy(won).kind, 'RESTRICTED');
});

test('won project with intake draft permits pre-intake correction', () => {
  const won = request({
    status: 'WON', projectId: 'project-demo', projectIntakeId: 'intake-demo',
    projectIntake: { id: 'intake-demo', estimateRequestId: 'estimate-request-demo', commercialDecisionId: 'decision-demo', projectId: 'project-demo', status: 'DRAFT', projectNo: '', sourceSnapshotJson: '{}', draft: {} as never, draftJson: '{}', version: 1, createdBy: 'demo-user', updatedBy: 'demo-user', createdAt: '2026-08-05T00:00:00.000Z', updatedAt: '2026-08-05T00:00:00.000Z', histories: [] },
  });
  assert.equal(resolveEstimateRequestEditPolicy(won).mode, 'CORRECTION');
  assert.equal(resolveEstimateRequestEditPolicy(won).editable, true);
});

test('request correction updates intake draft fields and preserves immutable lineage', () => {
  const draft = createBlankProjectIntakeDraft('intake-demo', 'project-demo');
  draft.source.estimateRequestId = 'estimate-request-demo';
  draft.source.commercialDecisionId = 'decision-demo';
  draft.materials[0].comment = '사용자 확인 메모';
  const corrected = mergeEstimateRequestIntoIntakeDraft(request({
    status: 'WON',
    projectName: '정정 프로젝트',
    projectId: 'project-demo',
    projectIntakeId: 'intake-demo',
    commercialDecisionId: 'decision-demo',
    scope: '마감, 구조',
    contact: 'Demo Contact',
    targetUnitIds: ['FINISH', 'STRUCTURE'],
    primaryUnitId: 'FINISH',
  }), draft);

  assert.equal(corrected.projectName, '정정 프로젝트');
  assert.deepEqual(corrected.scopes, ['마감', '구조']);
  assert.equal(corrected.contacts[0].name, 'Demo Contact');
  assert.equal(corrected.materials[0].comment, '사용자 확인 메모');
  assert.deepEqual(corrected.source, draft.source);
  assert.deepEqual(corrected.commercial, draft.commercial);
});
