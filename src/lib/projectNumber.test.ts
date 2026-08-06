import assert from 'node:assert/strict';
import test from 'node:test';
import type { Project } from '@/types/models';
import { allocateAnnualProjectNo, isOfficialProjectNo } from './projectNumber';

const project = (projectNo?: string): Project => ({ id: `project-${projectNo || 'pending'}`, title: 'Demo Project', status: 'INTAKE_RECEIVED', companyId: 'CON_COST', projectNo } as Project);

test('allocates the next official annual project number only from conforming numbers', () => {
  assert.equal(allocateAnnualProjectNo([project('2026001'), project('2026007'), project('ER-20260803-01')], 2026), '2026008');
});

test('starts a new annual sequence at 001', () => {
  assert.equal(allocateAnnualProjectNo([project('2026009')], 2027), '2027001');
});

test('recognizes only YYYY plus a three digit sequence', () => {
  assert.equal(isOfficialProjectNo('2026001'), true);
  assert.equal(isOfficialProjectNo('ER-20260803-01'), false);
  assert.equal(isOfficialProjectNo('project-estimate-request-1'), false);
});
