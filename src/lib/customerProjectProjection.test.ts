import assert from 'node:assert/strict';
import test from 'node:test';

import {
  initialSalesActivities,
  initialSalesContacts,
  initialSalesCustomers,
} from '@/lib/businessOperations';
import { buildCustomerProjectProjection } from '@/lib/customerProjectProjection';
import {
  customerProjectHistoryContacts,
  customerProjectHistoryCustomers,
  customerProjectHistoryProjects,
  customerProjectHistoryRelationships,
} from '@/data/customerProjectHistorySeed';

const projection = (companyId: 'CON_COST' | 'VIET_QS', query = '') => buildCustomerProjectProjection({
  customers: [...initialSalesCustomers, ...customerProjectHistoryCustomers],
  contacts: [...initialSalesContacts, ...customerProjectHistoryContacts],
  projects: customerProjectHistoryProjects,
  relationships: customerProjectHistoryRelationships,
  candidates: [],
  activities: initialSalesActivities,
  businessCards: [],
  personnel: [],
  companyId,
  query,
  now: new Date('2026-08-12T00:00:00.000Z'),
});

test('customer projection keeps CON-COST and Viet QS rows isolated', () => {
  const concost = projection('CON_COST');
  const vietqs = projection('VIET_QS');
  assert.deepEqual(concost.rows.map((row) => row.customer.id), ['customer-concost-001', 'customer-concost-002', 'customer-concost-003']);
  assert.deepEqual(vietqs.rows.map((row) => row.customer.id), ['customer-vietqs-001']);
  assert.deepEqual(concost.rows.flatMap((row) => row.projects.map((item) => item.project.id)).sort(), [
    'demo-project-concost-001',
    'demo-project-concost-002',
    'demo-project-concost-003',
    'demo-project-concost-004',
    'demo-project-concost-005',
  ]);
  assert.deepEqual(vietqs.rows.flatMap((row) => row.projects.map((item) => item.project.id)), [
    'demo-project-vietqs-001',
  ]);
});

test('dashboard KPIs distinguish customer counts from recent project counts', () => {
  const result = projection('CON_COST');
  assert.equal(result.counts.ALL, 3);
  assert.equal(result.counts.ACTIVE_PROJECTS, 2);
  assert.equal(result.counts.NEW_THIS_YEAR, 2);
  assert.equal(result.counts.RECENTLY_COMPLETED, 1);
});

test('multiple project contacts aggregate under one canonical project without copying it', () => {
  const result = projection('CON_COST');
  const project = result.rows[0].projects.find((item) => item.project.id === 'demo-project-concost-001');
  assert.equal(project?.relationships.length, 2);
  assert.deepEqual(project?.contacts.map((contact) => contact.id).sort(), ['contact-concost-001', 'contact-concost-002']);
});

test('directory search finds project number, title, PM id, and unit', () => {
  assert.equal(projection('CON_COST', '2026001').rows.length, 1);
  assert.equal(projection('CON_COST', '도심 복합시설').rows.length, 1);
  assert.equal(projection('CON_COST', 'demo-cc-finish-002').rows.length, 1);
  assert.equal(projection('CON_COST', '구조팀').rows.length, 2);
  assert.equal(projection('CON_COST', 'VQ-2026').rows.length, 0);
});

test('directory search groups contact identity fields under the canonical customer', () => {
  assert.equal(projection('CON_COST', 'contact.kr@example.invalid').rows.length, 1);
  assert.equal(projection('CON_COST', '010-0000-1001').rows.length, 1);
  assert.equal(projection('CON_COST', '견적팀').rows.length, 1);
  assert.deepEqual(
    projection('CON_COST', '매니저').rows.map((row) => row.customer.id),
    ['customer-concost-001', 'customer-concost-002'],
  );
  assert.equal(projection('VIET_QS', 'contact.kr@example.invalid').rows.length, 0);
});

test('draft and unpublished projects are excluded even if a relationship exists', () => {
  const draftProject = { ...customerProjectHistoryProjects[0], publicationStatus: 'DRAFT' as const };
  const result = buildCustomerProjectProjection({
    customers: initialSalesCustomers,
    contacts: initialSalesContacts,
    projects: [draftProject],
    relationships: [customerProjectHistoryRelationships[0]],
    candidates: [],
    activities: initialSalesActivities,
    businessCards: [],
    personnel: [],
    companyId: 'CON_COST',
  });
  assert.equal(result.rows[0].projects.length, 0);
});
