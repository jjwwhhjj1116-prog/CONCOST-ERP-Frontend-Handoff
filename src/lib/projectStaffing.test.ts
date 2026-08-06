import assert from 'node:assert/strict';
import test from 'node:test';
import type { PersonnelCard, ProjectExecutionUnitAssignment, TaskCard } from '@/types/models';
import {
  PROJECT_STAFFING_ROLE_CATALOG,
  createProjectStaffingPlan,
  getEligibleProjectPersonnel,
  getProjectAssignment,
  getProjectAssignmentForContext,
  getProjectStaffingMemberIds,
  getSupportProjectPersonnel,
  isProjectStaffingReady,
  updateExecutionAssignmentStaffing,
  validateProjectStaffingPlan,
} from './projectStaffing';

const people: PersonnelCard[] = [
  { id: 'finish-pm', name: 'Demo Finish PM', companyId: 'CON_COST', departmentId: 'FINISH', departmentName: '마감팀', role: 'PM', employmentStatus: 'ACTIVE' },
  { id: 'finish-worker', name: 'Demo Finish Worker', companyId: 'CON_COST', departmentId: 'FINISH', departmentName: '마감팀', role: 'WORKER', employmentStatus: 'ACTIVE' },
  { id: 'viet-finish', name: 'Demo Viet Finish', companyId: 'VIET_QS', departmentId: 'FINISH', departmentName: 'Finish', role: 'WORKER', employmentStatus: 'ACTIVE' },
  { id: 'structure-worker', name: 'Demo Structure Worker', companyId: 'CON_COST', departmentId: 'STRUCTURE', departmentName: '구조팀', role: 'WORKER', employmentStatus: 'ACTIVE' },
];

const assignments: ProjectExecutionUnitAssignment[] = [
  { id: 'project-1:FINISH', projectId: 'project-1', unitId: 'FINISH', role: 'PRIMARY', status: 'START_PLANNED', assignedAt: '2026-08-03T00:00:00.000Z', assignedBy: 'admin' },
  { id: 'project-1:STRUCTURE', projectId: 'project-1', unitId: 'STRUCTURE', role: 'PARTICIPATING', status: 'START_PLANNED', assignedAt: '2026-08-03T00:00:00.000Z', assignedBy: 'admin' },
];

const confirmedFinishPlan = () => createProjectStaffingPlan('FINISH').map((role) => (
  role.roleId === 'PM'
    ? { ...role, personnelIds: ['finish-pm'], startDate: '2026-08-10', endDate: '2026-09-30' }
    : role.roleLabel === '내부'
      ? { ...role, personnelIds: ['finish-worker'], startDate: '2026-08-12', endDate: '2026-09-20' }
      : role
));

test('freezes the exact role catalog for every execution unit', () => {
  assert.deepEqual(PROJECT_STAFFING_ROLE_CATALOG.FINISH, ['PM', '가설', '세대', '내부', '외부', '창호', '조적']);
  assert.deepEqual(PROJECT_STAFFING_ROLE_CATALOG.STRUCTURE, ['PM', '기초', '기둥', '보', '슬라브', '옹벽']);
  assert.deepEqual(PROJECT_STAFFING_ROLE_CATALOG.CIVIL_LANDSCAPE, ['PM', '토공', '부대토목', '조경']);
  assert.deepEqual(PROJECT_STAFFING_ROLE_CATALOG.CLAIM, ['PM', '제안서 작성', '자료 및 현장조사', '보고서 작성']);
  assert.deepEqual(PROJECT_STAFFING_ROLE_CATALOG.DEVELOPMENT, ['PM', '기획', 'FRONTEND', 'BACKEND']);
});

test('limits ordinary candidates to active members of the same company and unit', () => {
  assert.deepEqual(getEligibleProjectPersonnel(people, { companyId: 'CON_COST' }, 'FINISH').map((person) => person.id), ['finish-pm', 'finish-worker']);
  assert.deepEqual(getSupportProjectPersonnel(people, { companyId: 'CON_COST' }, 'FINISH').map((person) => person.id), ['structure-worker']);
});

test('requires exactly one PM on confirm while allowing multiple people in other roles', () => {
  const plan = createProjectStaffingPlan('FINISH');
  assert.equal(validateProjectStaffingPlan(plan, 'DRAFT'), null);
  assert.equal(validateProjectStaffingPlan(plan, 'CONFIRMED'), 'PM_EXACTLY_ONE_REQUIRED');
  assert.equal(validateProjectStaffingPlan(confirmedFinishPlan(), 'CONFIRMED'), null);
});

test('updates only the selected unit and records auditable before and after state', () => {
  const updated = updateExecutionAssignmentStaffing({
    assignments,
    unitId: 'FINISH',
    staffingPlan: confirmedFinishPlan(),
    staffingStatus: 'CONFIRMED',
    actorId: 'admin',
    updatedAt: '2026-08-03T01:00:00.000Z',
    reason: '착수 전 확정',
  });
  assert.equal(updated[0].pmId, 'finish-pm');
  assert.deepEqual(updated[0].personnelIds, ['finish-pm', 'finish-worker']);
  assert.equal(updated[0].staffingRevision, 1);
  assert.equal(updated[0].staffingHistories?.[0].action, 'PROJECT_STAFFING_CONFIRMED');
  assert.match(updated[0].staffingHistories?.[0].beforeJson || '', /DRAFT/);
  assert.match(updated[0].staffingHistories?.[0].afterJson || '', /CONFIRMED/);
  assert.equal(updated[0].staffingHistories?.[0].reason, '착수 전 확정');
  assert.equal(updated[1], assignments[1]);
  assert.equal(isProjectStaffingReady(updated[0]), true);
});

test('keeps one canonical project while combining staffing and task members without duplicates', () => {
  const staffed = updateExecutionAssignmentStaffing({
    assignments,
    unitId: 'FINISH',
    staffingPlan: confirmedFinishPlan(),
    staffingStatus: 'ACTIVE',
    actorId: 'admin',
    updatedAt: '2026-08-03T01:00:00.000Z',
    reason: '착수',
  });
  const tasks = [{ id: 'task-1', projectId: 'project-1', assigneeId: 'finish-worker' }] as TaskCard[];
  assert.deepEqual(getProjectStaffingMemberIds({ id: 'project-1', executionAssignments: staffed, primaryUnitId: 'FINISH' }, tasks, 'FINISH'), ['finish-pm', 'finish-worker']);
  assert.equal(getProjectAssignment({ executionAssignments: staffed, primaryUnitId: 'FINISH' }, 'STRUCTURE')?.projectId, 'project-1');
  assert.equal(getProjectAssignment({ executionAssignments: staffed, primaryUnitId: 'FINISH' }, 'CLAIM'), undefined);
});

test('uses the actual screen unit context without falling back to another assignment', () => {
  const project = { executionAssignments: assignments, primaryUnitId: 'FINISH' as const };
  assert.equal(getProjectAssignmentForContext(project, 'FINISH')?.unitId, 'FINISH');
  assert.equal(getProjectAssignmentForContext(project, 'STRUCTURE')?.unitId, 'STRUCTURE');
  assert.equal(getProjectAssignmentForContext(project, 'CLAIM'), undefined);
  assert.equal(getProjectAssignmentForContext(project, 'DEVELOPMENT'), undefined);
  assert.equal(getProjectAssignmentForContext(project, null)?.unitId, 'FINISH');
});
