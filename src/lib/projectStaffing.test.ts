import assert from 'node:assert/strict';
import test from 'node:test';
import type { PersonnelCard, ProjectExecutionUnitAssignment, TaskCard } from '@/types/models';
import {
  getEligibleProjectPersonnel,
  getProjectAssignment,
  getProjectStaffingMemberIds,
  updateExecutionAssignmentStaffing,
  validateProjectStaffing,
} from './projectStaffing';

const people: PersonnelCard[] = [
  { id: 'finish-pm', name: 'Demo Finish PM', companyId: 'CON_COST', departmentId: 'FINISH', departmentName: '마감', role: 'PM', employmentStatus: 'ACTIVE' },
  { id: 'finish-worker', name: 'Demo Finish Worker', companyId: 'CON_COST', departmentId: 'FINISH', departmentName: '마감', role: 'WORKER', employmentStatus: 'ACTIVE' },
  { id: 'viet-finish', name: 'Demo Viet Finish', companyId: 'VIET_QS', departmentId: 'FINISH', departmentName: 'Finish', role: 'WORKER', employmentStatus: 'ACTIVE' },
  { id: 'structure-worker', name: 'Demo Structure Worker', companyId: 'CON_COST', departmentId: 'STRUCTURE', departmentName: '구조', role: 'WORKER', employmentStatus: 'ACTIVE' },
];

const assignments: ProjectExecutionUnitAssignment[] = [
  { id: 'project-1:FINISH', projectId: 'project-1', unitId: 'FINISH', role: 'PRIMARY', status: 'START_PLANNED', assignedAt: '2026-08-03T00:00:00.000Z', assignedBy: 'admin' },
  { id: 'project-1:STRUCTURE', projectId: 'project-1', unitId: 'STRUCTURE', role: 'PARTICIPATING', status: 'START_PLANNED', assignedAt: '2026-08-03T00:00:00.000Z', assignedBy: 'admin' },
];

test('limits staffing candidates to the selected company and execution unit', () => {
  assert.deepEqual(
    getEligibleProjectPersonnel(people, { companyId: 'CON_COST' }, 'FINISH').map((person) => person.id),
    ['finish-pm', 'finish-worker'],
  );
});

test('updates only the selected department assignment and always includes the PM', () => {
  const updated = updateExecutionAssignmentStaffing({
    assignments,
    unitId: 'FINISH',
    pmId: 'finish-pm',
    personnelIds: ['finish-worker'],
    actorId: 'admin',
    updatedAt: '2026-08-03T01:00:00.000Z',
  });
  assert.deepEqual(updated[0].personnelIds, ['finish-pm', 'finish-worker']);
  assert.equal(updated[0].pmId, 'finish-pm');
  assert.equal(updated[1].pmId, undefined);
});

test('resolves the board department assignment before the project primary assignment', () => {
  assert.equal(getProjectAssignment({ executionAssignments: assignments, primaryUnitId: 'FINISH' }, 'STRUCTURE')?.unitId, 'STRUCTURE');
});

test('combines pre-work staffing with later task assignees without duplicates', () => {
  const staffed = updateExecutionAssignmentStaffing({
    assignments,
    unitId: 'FINISH',
    pmId: 'finish-pm',
    personnelIds: ['finish-worker'],
    actorId: 'admin',
    updatedAt: '2026-08-03T01:00:00.000Z',
  });
  const tasks = [{ id: 'task-1', projectId: 'project-1', assigneeId: 'finish-worker' }] as TaskCard[];
  assert.deepEqual(getProjectStaffingMemberIds({ id: 'project-1', executionAssignments: staffed, primaryUnitId: 'FINISH' }, tasks, 'FINISH'), ['finish-pm', 'finish-worker']);
});

test('requires a PM to be part of the selected personnel', () => {
  assert.equal(validateProjectStaffing('', []), 'PM_REQUIRED');
  assert.equal(validateProjectStaffing('finish-pm', ['finish-worker']), 'PM_MUST_BE_INCLUDED');
  assert.equal(validateProjectStaffing('finish-pm', ['finish-pm']), null);
});
