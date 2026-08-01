import assert from 'node:assert/strict';
import test from 'node:test';
import personnelPayload from '@/data/dummyPersonnel.json';
import { evaluateFinanceAccess, resolveAccessGrade } from '@/lib/accessControl';
import type { PersonnelCard } from '@/types/models';

const personnel = personnelPayload.personnel as PersonnelCard[];

test('synthetic personnel fixture is PII-safe and referentially valid', () => {
  assert.equal(personnelPayload.synthetic, true);
  assert.match(personnelPayload.source, /^synthetic:\/\//);
  assert.ok(personnel.length >= 10);

  const ids = new Set<string>();
  for (const person of personnel) {
    assert.match(person.id, /^demo-/);
    assert.match(person.employeeNumber ?? '', /^DEMO-/);
    assert.match(person.name, /^\[DEMO\]/);
    assert.match(person.email ?? '', /@example\.invalid$/);
    assert.equal(person.phone, undefined);
    assert.equal('avatar' in person, false);
    assert.equal(ids.has(person.id), false);
    ids.add(person.id);

    for (const membership of person.organizationMemberships ?? []) {
      assert.equal(membership.status, 'ACTIVE');
      assert.ok(membership.organizationId);
    }
  }
});

test('synthetic personas preserve company, grade, and finance coverage', () => {
  assert.deepEqual(new Set(personnel.map((person) => person.companyId)), new Set(['CON_COST', 'VIET_QS']));
  assert.deepEqual(
    new Set(personnel.map((person) => resolveAccessGrade(person))),
    new Set(['ADMIN', 'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4']),
  );
  assert.ok(personnel.some((person) => person.capabilities?.includes('FINANCE_ACCESS')));
  assert.ok(personnel.some((person) => evaluateFinanceAccess(person, 'DEMO_LOCAL').allowed));
  assert.ok(personnel.some((person) => !evaluateFinanceAccess(person, 'DEMO_LOCAL').allowed));
});
