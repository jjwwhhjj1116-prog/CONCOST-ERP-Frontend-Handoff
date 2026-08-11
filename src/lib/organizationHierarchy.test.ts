import assert from 'node:assert/strict';
import test from 'node:test';
import type { PersonnelCard } from '@/types/models';
import {
  getOrganizationDescendants,
  getOrganizationNodes,
  getOrganizationTree,
  getProjectExecutionUnitForOrg,
  projectPersonnelMemberships,
  resolveOrganizationAlias,
  resolvePersonnelOrganization,
} from './organizationHierarchy';

const person = (overrides: Partial<PersonnelCard>): PersonnelCard => ({
  id: overrides.id ?? 'demo-person',
  name: overrides.name ?? 'Demo Person',
  role: overrides.role ?? 'WORKER',
  departmentId: overrides.departmentId ?? 'FINISH',
  employmentStatus: overrides.employmentStatus ?? 'ACTIVE',
  ...overrides,
});

test('CON-COST hierarchy preserves the frozen executive and project-unit tree', () => {
  const tree = getOrganizationTree('CON_COST');
  assert.equal(tree.length, 1);
  assert.equal(tree[0].id, 'CC_ROOT');
  assert.equal(tree[0].children[0].id, 'CC_EXEC_CEO');
  const vicePresident = tree[0].children[0].children[0];
  assert.equal(vicePresident.id, 'CC_EXEC_VP');
  assert.deepEqual(vicePresident.children.map((node) => node.id), [
    'CC_TECH_HQ', 'CC_CLAIM_CENTER', 'CC_MGMT_SUPPORT_HQ', 'CC_DEV_TF',
  ]);
  assert.deepEqual(vicePresident.children[0].children.map((node) => node.id), [
    'CC_TECH_FINISH', 'CC_TECH_STRUCTURE', 'CC_TECH_CIVIL_LANDSCAPE', 'CC_TECH_BIM',
  ]);
});

test('Viet QS hierarchy preserves all approved branches and teams', () => {
  const vicePresident = getOrganizationTree('VIET_QS')[0].children[0].children[0];
  assert.deepEqual(vicePresident.children.map((node) => node.id), [
    'VQS_FINISH', 'VQS_STRUCTURE', 'VQS_CIVIL', 'VQS_DEV_TF', 'VQS_MGMT_SUPPORT',
  ]);
  assert.equal(vicePresident.children[0].children.length, 6);
  assert.equal(vicePresident.children[1].children.length, 6);
  assert.deepEqual(vicePresident.children.slice(2).map((node) => node.children.length), [1, 1, 1]);
});

test('organization nodes map to canonical execution units without cross-company leakage', () => {
  assert.equal(getProjectExecutionUnitForOrg('CC_TECH_FINISH'), 'FINISH');
  assert.equal(getProjectExecutionUnitForOrg('CC_TECH_STRUCTURE'), 'STRUCTURE');
  assert.equal(getProjectExecutionUnitForOrg('CC_TECH_CIVIL_LANDSCAPE'), 'CIVIL_LANDSCAPE');
  assert.equal(getProjectExecutionUnitForOrg('CC_CLAIM_CENTER'), 'CLAIM');
  assert.equal(getProjectExecutionUnitForOrg('CC_DEV_TF'), 'DEVELOPMENT');
  assert.equal(getProjectExecutionUnitForOrg('CC_MGMT_SUPPORT_HQ'), 'MANAGEMENT_SUPPORT');
  assert.equal(getProjectExecutionUnitForOrg('VQS_FINISH_EXTERNAL'), 'FINISH');
  assert.equal(getProjectExecutionUnitForOrg('VQS_STRUCTURE_HORIZON1'), 'STRUCTURE');
  assert.equal(getProjectExecutionUnitForOrg('VQS_CIVIL_TEAM'), 'CIVIL_LANDSCAPE');
  assert.equal(getProjectExecutionUnitForOrg('VQS_DEVELOPMENT'), 'DEVELOPMENT');
  assert.equal(getProjectExecutionUnitForOrg('VQS_ADMIN'), 'MANAGEMENT_SUPPORT');
  assert.ok(getOrganizationNodes('CON_COST').every((node) => node.companyId === 'CON_COST'));
  assert.ok(getOrganizationNodes('VIET_QS').every((node) => node.companyId === 'VIET_QS'));
});

test('personnel projection produces one primary membership and no duplicate secondary membership', () => {
  const personnel = person({
    companyId: 'CON_COST',
    departmentId: 'TECHNICAL_HQ',
    teamId: 'FINISH',
    organizationRank: 'TEAM_LEADER',
    organizationMemberships: [
      { organizationId: 'CC_TECH_FINISH', status: 'ACTIVE', membershipType: 'PRIMARY' },
      { organizationId: 'CC_TECH_STRUCTURE', status: 'ACTIVE', membershipType: 'SECONDARY' },
      { organizationId: 'CC_TECH_FINISH', status: 'ACTIVE', membershipType: 'SECONDARY' },
    ],
  });
  assert.equal(resolvePersonnelOrganization(personnel).primaryNodeId, 'CC_TECH_FINISH');
  const memberships = projectPersonnelMemberships([personnel], 'CON_COST');
  assert.equal(memberships.filter((item) => item.membershipType === 'PRIMARY').length, 1);
  assert.deepEqual(memberships.map((item) => item.organizationNodeId), ['CC_TECH_FINISH', 'CC_TECH_STRUCTURE']);
  assert.equal(memberships[0].isLeader, true);

  const rankOnlyLeader = projectPersonnelMemberships([person({
    id: 'rank-only',
    companyId: 'CON_COST',
    departmentId: 'FINISH',
    organizationRank: 'TEAM_LEADER',
  })], 'CON_COST');
  assert.equal(rankOnlyLeader[0].isLeader, false);
});

test('unmapped personnel stay visible in the company-specific unassigned node', () => {
  assert.equal(resolvePersonnelOrganization(person({ companyId: 'CON_COST', departmentId: 'UNKNOWN' })).primaryNodeId, 'CC_UNASSIGNED');
  assert.equal(resolvePersonnelOrganization(person({ companyId: 'VIET_QS', departmentId: 'UNKNOWN' })).primaryNodeId, 'VQS_UNASSIGNED');
  assert.ok(getOrganizationDescendants('CC_ROOT', true).includes('CC_TECH_FINISH'));
  assert.ok(!getOrganizationDescendants('CC_ROOT', true).some((id) => id.startsWith('VQS_')));
});

test('executive titles do not assign CEO or vice president without explicit membership', () => {
  const inferredCeo = resolvePersonnelOrganization(person({
    companyId: 'CON_COST',
    departmentId: 'UNKNOWN',
    organizationRank: 'CEO',
  }));
  assert.equal(inferredCeo.primaryNodeId, 'CC_UNASSIGNED');

  const explicitCeo = resolvePersonnelOrganization(person({
    companyId: 'CON_COST',
    departmentId: 'UNKNOWN',
    organizationRank: 'CEO',
    organizationMemberships: [
      { organizationId: 'CC_EXEC_CEO', status: 'ACTIVE', membershipType: 'PRIMARY' },
    ],
  }));
  assert.equal(explicitCeo.primaryNodeId, 'CC_EXEC_CEO');
  assert.equal(explicitCeo.resolution, 'EXPLICIT');
});

test('organization labels and legacy aliases match the frozen hierarchy contract', () => {
  const concostVicePresident = getOrganizationTree('CON_COST')[0].children[0].children[0];
  assert.deepEqual(concostVicePresident.children[0].children.map((node) => node.name), [
    '마감팀', '구조팀', '토목,조경파트', 'BIM파트',
  ]);
  const vietQsVicePresident = getOrganizationTree('VIET_QS')[0].children[0].children[0];
  assert.equal(vietQsVicePresident.children[3].name, '개발 TF');
  assert.equal(resolveOrganizationAlias('CON_COST', 'FINISH'), 'CC_TECH_FINISH');
  assert.equal(resolveOrganizationAlias('CON_COST', '토목&조경'), 'CC_TECH_CIVIL_LANDSCAPE');
  assert.equal(resolveOrganizationAlias('VIET_QS', 'Structure', 'Horizon1'), 'VQS_STRUCTURE_HORIZON1');
});
