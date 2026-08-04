import assert from 'node:assert/strict';
import test from 'node:test';
import {
  completeExecutionAssignments,
  createExecutionAssignments,
  getProjectBoardScope,
  matchesProjectBoardScope,
  normalizeExecutionUnitIds,
} from './projectExecutionUnits';

test('completes only final intake departments and preserves staffing for retained units', () => {
  const existing = createExecutionAssignments({
    projectId: 'project-request-final',
    targetUnitIds: ['FINISH', 'STRUCTURE'],
    primaryUnitId: 'FINISH',
    actorId: 'demo-admin',
    assignedAt: '2026-08-03T00:00:00.000Z',
  }).map((assignment) => assignment.unitId === 'STRUCTURE'
    ? { ...assignment, pmId: 'structure-pm', personnelIds: ['structure-pm', 'structure-worker'] }
    : assignment);
  const completed = completeExecutionAssignments({
    projectId: 'project-request-final',
    targetUnitIds: ['STRUCTURE', 'CLAIM'],
    primaryUnitId: 'STRUCTURE',
    actorId: 'demo-manager',
    assignedAt: '2026-08-04T00:00:00.000Z',
    existingAssignments: existing,
  });

  assert.deepEqual(completed.map((assignment) => assignment.unitId), ['STRUCTURE', 'CLAIM']);
  assert.ok(completed.every((assignment) => assignment.status === 'START_PLANNED'));
  assert.equal(completed.find((assignment) => assignment.unitId === 'STRUCTURE')?.role, 'PRIMARY');
  assert.equal(completed.find((assignment) => assignment.unitId === 'STRUCTURE')?.pmId, 'structure-pm');
  assert.deepEqual(completed.find((assignment) => assignment.unitId === 'STRUCTURE')?.personnelIds, ['structure-pm', 'structure-worker']);
});

test('creates deterministic canonical assignments with one primary unit', () => {
  const assignments = createExecutionAssignments({
    projectId: 'project-request-1',
    targetUnitIds: ['FINISH', 'STRUCTURE', 'FINISH'],
    primaryUnitId: 'STRUCTURE',
    actorId: 'demo-admin',
    assignedAt: '2026-08-03T00:00:00.000Z',
  });
  assert.deepEqual(assignments.map((item) => item.id), [
    'project-request-1:FINISH',
    'project-request-1:STRUCTURE',
  ]);
  assert.equal(assignments.filter((item) => item.role === 'PRIMARY').length, 1);
  assert.equal(assignments.find((item) => item.unitId === 'STRUCTURE')?.role, 'PRIMARY');
});

test('rejects a won conversion without a selected execution unit', () => {
  assert.throws(() => createExecutionAssignments({
    projectId: 'project-request-2',
    targetUnitIds: [],
    actorId: 'demo-admin',
    assignedAt: '2026-08-03T00:00:00.000Z',
  }), /담당부서/);
});

test('filters technical, claim, and development boards by canonical IDs only', () => {
  const technical = { assignedUnitIds: ['FINISH'] as Array<'FINISH'>, executionAssignments: [] };
  const claim = { assignedUnitIds: ['CLAIM'] as Array<'CLAIM'>, executionAssignments: [] };
  const development = { assignedUnitIds: ['DEVELOPMENT'] as Array<'DEVELOPMENT'>, executionAssignments: [] };
  assert.equal(matchesProjectBoardScope(technical, getProjectBoardScope('TECHNICAL', null)), true);
  assert.equal(matchesProjectBoardScope(claim, getProjectBoardScope('TECHNICAL', null)), false);
  assert.equal(matchesProjectBoardScope(claim, getProjectBoardScope('CLAIM', null)), true);
  assert.equal(matchesProjectBoardScope(development, getProjectBoardScope('DEVELOPMENT', null)), true);
});

test('shows a won project on department boards only after project intake completion', () => {
  const assignments = createExecutionAssignments({
    projectId: 'project-request-3',
    targetUnitIds: ['FINISH', 'CLAIM'],
    primaryUnitId: 'FINISH',
    actorId: 'demo-admin',
    assignedAt: '2026-08-03T00:00:00.000Z',
  });
  const beforeIntakeCompletion = { assignedUnitIds: ['FINISH', 'CLAIM'] as Array<'FINISH' | 'CLAIM'>, executionAssignments: assignments };
  assert.equal(matchesProjectBoardScope(beforeIntakeCompletion, getProjectBoardScope('TECHNICAL', null)), false);
  assert.equal(matchesProjectBoardScope(beforeIntakeCompletion, getProjectBoardScope('CLAIM', null)), false);

  const afterIntakeCompletion = {
    ...beforeIntakeCompletion,
    executionAssignments: assignments.map((assignment) => ({ ...assignment, status: 'START_PLANNED' as const })),
  };
  assert.equal(matchesProjectBoardScope(afterIntakeCompletion, getProjectBoardScope('TECHNICAL', null)), true);
  assert.equal(matchesProjectBoardScope(afterIntakeCompletion, getProjectBoardScope('CLAIM', null)), true);
});

test('does not infer assignment from project or department names', () => {
  const project = { assignedUnitIds: [], executionAssignments: [] };
  assert.equal(matchesProjectBoardScope(project, getProjectBoardScope('TECHNICAL', null)), false);
  assert.equal(getProjectBoardScope(null, null, '마감팀'), null);
});

test('normalizes duplicate and invalid unit values', () => {
  assert.deepEqual(normalizeExecutionUnitIds(['FINISH', 'UNKNOWN', 'FINISH', 'CLAIM']), ['FINISH', 'CLAIM']);
});
