import assert from 'node:assert/strict';
import test from 'node:test';

import {
  APPROVAL_FORM_CATALOG,
  assignPolicyCandidates,
  createApprovalSnapshot,
  createLineDefinition,
  getDemoApprovalPolicyPreview,
  moveApprovalStep,
  validateApprovalLine,
} from './approvalWorkflow';
import type { ApprovalDocumentLineStep, PersonnelCard } from '@/types/models';

const person = (id: string, role: PersonnelCard['role'], departmentId = 'dept-tech'): PersonnelCard => ({
  id,
  employeeNumber: `DEMO-${id}`,
  name: `Demo ${id}`,
  displayName: `Demo ${id}`,
  companyId: 'CON_COST',
  departmentId,
  departmentName: 'Demo Department',
  role,
  isActive: true,
} as PersonnelCard);

test('vacation form exposes the required ZioYou parity fields', () => {
  const leave = APPROVAL_FORM_CATALOG.find((form) => form.type === 'LEAVE_REQUEST');
  assert.ok(leave);
  assert.deepEqual(
    leave.fields.map((field) => field.id),
    ['leaveType', 'leaveStart', 'leaveEnd', 'leaveAmount', 'destination', 'emergencyContact', 'workCoverage', 'leaveReason'],
  );
});

test('policy preview is form-driven and does not hard-code a three-person executive chain', () => {
  const leave = getDemoApprovalPolicyPreview({ formType: 'LEAVE_REQUEST', organizationId: 'dept-tech' });
  const expense = getDemoApprovalPolicyPreview({ formType: 'EXPENSE_APPROVAL', organizationId: 'dept-tech', amount: 20_000_000 });
  assert.equal(leave.steps.length, 1);
  assert.equal(expense.steps.length, 3);
  assert.ok(expense.steps.every((step) => step.policyLocked));
});

test('candidate assignment never selects the author as an approver', () => {
  const policy = getDemoApprovalPolicyPreview({ formType: 'GENERAL_APPROVAL', organizationId: 'dept-tech' });
  const assigned = assignPolicyCandidates(policy.steps, [person('author', 'DEPARTMENT_MANAGER'), person('manager', 'DEPARTMENT_MANAGER')], 'author', 'dept-tech');
  assert.equal(assigned[0].approverId, 'manager');
});

test('approval line validation blocks the author as final approver', () => {
  const steps: ApprovalDocumentLineStep[] = [{
    id: 'final', label: 'Final', sequence: 1, kind: 'FINAL_APPROVAL', approverId: 'author', executionMode: 'SEQUENTIAL', status: 'PENDING',
  }];
  assert.match(validateApprovalLine(steps, 'author').join(' '), /작성자/);
});

test('mobile order buttons keep sequence numbers normalized', () => {
  const steps: ApprovalDocumentLineStep[] = [
    { id: 'a', label: 'A', sequence: 1, approverRole: 'PM', status: 'PENDING' },
    { id: 'b', label: 'B', sequence: 2, approverRole: 'DEPARTMENT_MANAGER', status: 'PENDING' },
  ];
  const moved = moveApprovalStep(steps, 'b', -1);
  assert.deepEqual(moved.map((step) => [step.id, step.sequence]), [['b', 1], ['a', 2]]);
});

test('submission snapshot is a copy and preserves the selected line version', () => {
  const line = createLineDefinition({ companyId: 'CON_COST', ownerId: 'author', name: 'Demo', steps: [{ id: 'a', label: 'A', approverRole: 'PM', status: 'PENDING' }] });
  line.version = 4;
  const snapshot = createApprovalSnapshot(line, 'policy-v7');
  line.steps[0].label = 'Changed later';
  assert.equal(snapshot.lineVersion, 4);
  assert.equal(snapshot.policyVersion, 'policy-v7');
  assert.equal(snapshot.steps[0].label, 'A');
});
