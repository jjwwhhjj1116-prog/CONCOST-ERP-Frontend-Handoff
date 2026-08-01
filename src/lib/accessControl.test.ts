import assert from 'node:assert/strict';
import test from 'node:test';

import {
  evaluateFinanceAccess,
  hasActiveManagementSupportMembership,
  resolveAccessGrade,
} from './accessControl';
import type { PersonnelCard } from '@/types/models';

const person = (overrides: Partial<PersonnelCard> = {}): PersonnelCard => ({
  id: 'person-1',
  name: 'Test User',
  departmentId: 'TECHNICAL_HQ',
  employmentStatus: 'ACTIVE',
  role: 'WORKER',
  ...overrides,
});

test('access grade derives from system responsibility without treating every manager as admin', () => {
  assert.equal(resolveAccessGrade(person({ role: 'SUPER_ADMIN' })), 'ADMIN');
  assert.equal(
    resolveAccessGrade(person({ organizationRank: 'VICE_PRESIDENT' })),
    'GRADE_1',
  );
  assert.equal(
    resolveAccessGrade(person({ role: 'DEPARTMENT_MANAGER' })),
    'GRADE_2',
  );
  assert.equal(resolveAccessGrade(person({ role: 'PM' })), 'GRADE_3');
  assert.equal(resolveAccessGrade(person()), 'GRADE_4');
});

test('explicit access grade wins over legacy role derivation', () => {
  assert.equal(
    resolveAccessGrade(person({ role: 'WORKER', accessGrade: 'GRADE_2' })),
    'GRADE_2',
  );
});

test('active management support membership is finance eligible', () => {
  assert.equal(
    hasActiveManagementSupportMembership(
      person({
        organizationMemberships: [
          { organizationId: 'MANAGEMENT_SUPPORT', status: 'ACTIVE' },
        ],
      }),
    ),
    true,
  );
  assert.equal(
    hasActiveManagementSupportMembership(
      person({
        organizationMemberships: [
          { organizationId: 'MANAGEMENT_SUPPORT', status: 'INACTIVE' },
        ],
      }),
    ),
    false,
  );
});

test('demo finance access permits only approved frontend eligibility', () => {
  assert.equal(
    evaluateFinanceAccess(person({ role: 'SUPER_ADMIN' }), 'DEMO_LOCAL').allowed,
    true,
  );
  assert.equal(
    evaluateFinanceAccess(
      person({ organizationRank: 'VICE_PRESIDENT' }),
      'DEMO_LOCAL',
    ).allowed,
    true,
  );
  assert.equal(evaluateFinanceAccess(person(), 'DEMO_LOCAL').allowed, false);
});

test('server modes require the authenticated backend capability', () => {
  const executive = person({ organizationRank: 'VICE_PRESIDENT' });
  assert.equal(evaluateFinanceAccess(executive, 'API_SANDBOX').allowed, false);
  assert.equal(
    evaluateFinanceAccess(
      { ...executive, capabilities: ['FINANCE_ACCESS'] },
      'API_SANDBOX',
    ).allowed,
    true,
  );
});

test('a finance capability never makes an ineligible employee eligible by itself', () => {
  assert.equal(
    evaluateFinanceAccess(
      person({ capabilities: ['FINANCE_ACCESS'] }),
      'PRODUCTION_SERVER',
    ).allowed,
    false,
  );
});
