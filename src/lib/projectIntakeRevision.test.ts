import assert from 'node:assert/strict';
import test from 'node:test';
import type { Project, ProjectIntake, ProjectIntakeDraft } from '@/types/models';
import { buildAcceptedIntakeRevision, getAcceptedIntakeRevisionDiff } from './projectIntakeRevision';

const draft = (overrides: Partial<ProjectIntakeDraft> = {}): ProjectIntakeDraft => ({
  projectName: 'Demo Project', projectNo: '2026001', company: 'Demo Company', client: 'Demo Client', usage: 'Office', area: '100', buildings: '1', floors: '10', basementFloors: '1', groundFloors: '9', bidDate: '', unitPrice: '',
  businessTypes: ['Estimate'], scopes: ['Base'], targetUnitIds: ['FINISH'], primaryUnitId: 'FINISH', unitScopes: [], contacts: [], materials: [], startDateStatus: 'TBD', expectedStartDate: '', firstDelivery: '', secondDelivery: '', thirdDelivery: '', finalDelivery: '', workContent: 'Base scope', notes: '', request: '', secretReferences: [],
  source: { estimateRequestId: 'request-1', requestNo: 'ER-1', estimateId: null, estimateSheetId: null, estimateSubmissionId: null, estimateDocumentHash: null, commercialDecisionId: 'decision-1', projectId: 'project-1' },
  commercial: { agreedAmount: null, agreedScope: null, agreedSchedule: null, startCondition: null },
  ...overrides,
});

const project: Project = {
  id: 'project-1', projectNo: '2026001', title: 'Demo Project', priority: 'NORMAL', status: 'MANAGER_REVIEW', publicationStatus: 'PUBLISHED', departmentId: 'FINISH', primaryUnitId: 'FINISH', assignedUnitIds: ['FINISH'],
  executionAssignments: [{ id: 'project-1:FINISH', projectId: 'project-1', unitId: 'FINISH', role: 'PRIMARY', status: 'START_PLANNED', assignedAt: '2026-08-01T00:00:00.000Z', assignedBy: 'admin' }],
};

const intake: ProjectIntake = {
  id: 'intake-1', estimateRequestId: 'request-1', commercialDecisionId: 'decision-1', projectId: 'project-1', status: 'ACCEPTED', projectNo: '2026001', sourceSnapshotJson: '{}', draft: draft(), draftJson: JSON.stringify(draft()), version: 3, createdBy: 'admin', updatedBy: 'admin', createdAt: '2026-08-01T00:00:00.000Z', updatedAt: '2026-08-01T00:00:00.000Z', histories: [],
};

test('keeps canonical ids and accepted status while adding and removing unit assignments', () => {
  const revisedDraft = draft({ targetUnitIds: ['STRUCTURE', 'CLAIM'], primaryUnitId: 'STRUCTURE' });
  const result = buildAcceptedIntakeRevision({ intake, project, draft: revisedDraft, reason: '부서 변경', actorId: 'admin', revisedAt: '2026-08-02T00:00:00.000Z', historyId: 'history-1' });
  assert.equal(result.intake.id, 'intake-1');
  assert.equal(result.intake.projectId, 'project-1');
  assert.equal(result.intake.projectNo, '2026001');
  assert.equal(result.intake.status, 'ACCEPTED');
  assert.equal(result.project.id, 'project-1');
  assert.equal(result.assignments.filter((item) => item.role === 'PRIMARY' && item.status !== 'REMOVED').length, 1);
  assert.equal(result.assignments.find((item) => item.unitId === 'FINISH')?.status, 'REMOVED');
  assert.equal(result.assignments.find((item) => item.unitId === 'STRUCTURE')?.status, 'START_PLANNED');
  assert.ok(result.eventTypes.includes('PROJECT_INTAKE_UNIT_ADDED'));
  assert.ok(result.eventTypes.includes('PROJECT_INTAKE_UNIT_REMOVED'));
});

test('detects versioned READY material and schedule changes without exposing file contents', () => {
  const revised = draft({
    startDateStatus: 'SCHEDULED', expectedStartDate: '2026-09-01',
    materials: [{ id: 'material-1', category: 'drawing', label: 'Drawing', memo: '', status: 'CONFIRMED', comment: '', confirmedBy: 'admin', originalName: 'demo.pdf', size: 10, mimeType: 'application/pdf', storageKey: 'demo-ready://material-1', fileStatus: 'READY', fileVersion: 1 }],
  });
  const diff = getAcceptedIntakeRevisionDiff(draft(), revised);
  assert.ok(diff.eventTypes.includes('PROJECT_INTAKE_ADDITIONAL_MATERIAL_ADDED'));
  assert.ok(diff.eventTypes.includes('PROJECT_INTAKE_SCHEDULE_CHANGED'));
});

test('requires a reason and rejects a second primary assignment', () => {
  assert.throws(() => buildAcceptedIntakeRevision({ intake, project, draft: draft({ workContent: 'Changed' }), reason: '', actorId: 'admin', revisedAt: '2026-08-02T00:00:00.000Z', historyId: 'history-1' }), /수정 사유/);
});

test('rejects newly added material until its immutable file version is READY', () => {
  const revisedDraft = draft();
  revisedDraft.materials = [{
    id: 'material-new', category: 'other', label: '추가 도면', memo: '', status: 'RECEIVED', comment: '',
    confirmedBy: '', originalName: 'drawing.pdf', size: 100, mimeType: 'application/pdf',
    storageKey: 'pending://drawing.pdf', fileStatus: 'PENDING', fileVersion: 1, fileId: 'material-new:v1',
  }];
  assert.throws(() => buildAcceptedIntakeRevision({
    intake,
    project,
    draft: revisedDraft,
    reason: '추가자료 등록',
    actorId: 'actor-1',
    revisedAt: '2026-08-06T00:00:00.000Z',
    historyId: 'history-2',
  }), /READY/);
});
