import assert from 'node:assert/strict';
import test from 'node:test';

import type { SalesContact, SalesCustomer } from '@/lib/businessOperations';
import {
  buildCustomerProjectRelationshipPlan,
  linkCustomerProjectCandidateToContact,
  legacySalesDestination,
  visibleCustomerProjectRelationships,
} from '@/lib/customerProjectRelationship';
import type { PersonnelCard, Project, ProjectIntake, ProjectIntakeDraft } from '@/types/models';

const timestamp = '2026-08-12T01:00:00.000Z';

const customer = (companyId: 'CON_COST' | 'VIET_QS' = 'CON_COST'): SalesCustomer => ({
  id: `customer-${companyId}`,
  companyId,
  customerNo: companyId === 'CON_COST' ? 'C-2026-001' : 'V-2026-001',
  name: 'DEMO Customer',
  industry: 'Construction',
  ownerId: 'demo-owner',
  status: 'ACTIVE',
  note: '',
  revision: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
  archivedAt: null,
  audit: [],
});

const contact = (companyId: 'CON_COST' | 'VIET_QS' = 'CON_COST'): SalesContact => ({
  id: `contact-${companyId}`,
  companyId,
  customerId: `customer-${companyId}`,
  name: 'Demo Contact',
  companyName: 'DEMO Customer',
  department: 'Project',
  position: 'Manager',
  email: 'project.contact@example.invalid',
  phone: '010-0000-1001',
  mobile: '010-0000-1001',
  telephone: '',
  fax: '',
  homepage: '',
  address: '',
  ownerId: 'demo-owner',
  tags: [],
  memo: '',
  status: 'ACTIVE',
  googleContactsOptIn: false,
  googleSyncState: 'NOT_REQUESTED',
  source: 'MANUAL',
  sourceBusinessCardId: null,
  duplicateStatus: 'CLEAR',
  lastContactAt: null,
  revision: 1,
  createdAt: timestamp,
  updatedAt: timestamp,
  archivedAt: null,
  audit: [],
});

const draft = (email = 'project.contact@example.invalid'): ProjectIntakeDraft => ({
  projectName: 'DEMO Project',
  projectNo: '2026001',
  company: 'DEMO Customer',
  client: 'DEMO Client',
  usage: 'Office',
  area: '1000',
  buildings: '1',
  floors: '10',
  basementFloors: '1',
  groundFloors: '9',
  bidDate: '2026-08-01',
  unitPrice: '',
  businessTypes: ['ESTIMATE'],
  scopes: ['FINISH'],
  targetUnitIds: ['FINISH'],
  primaryUnitId: 'FINISH',
  unitScopes: [{ unitId: 'FINISH', scope: 'Estimate' }],
  contacts: [{
    id: 'source-contact-1',
    name: 'Demo Contact',
    role: '발주처 담당자',
    department: 'Project',
    telephone: '',
    mobile: '010-0000-1001',
    email,
  }],
  materials: [],
  startDateStatus: 'TBD',
  expectedStartDate: '',
  firstDelivery: '',
  secondDelivery: '',
  thirdDelivery: '',
  finalDelivery: '2026-09-01',
  workContent: 'Demo scope',
  notes: '',
  request: '',
  secretReferences: [],
  source: {
    estimateRequestId: 'estimate-request-1',
    requestNo: 'ER-2026-001',
    estimateId: null,
    estimateSheetId: null,
    estimateSubmissionId: null,
    estimateDocumentHash: null,
    commercialDecisionId: 'decision-1',
    projectId: 'project-1',
  },
  commercial: {
    agreedAmount: null,
    agreedScope: null,
    agreedSchedule: null,
    startCondition: null,
  },
});

const intake = (status: ProjectIntake['status'] = 'ACCEPTED', version = 3): ProjectIntake => ({
  id: 'intake-1',
  estimateRequestId: 'estimate-request-1',
  commercialDecisionId: 'decision-1',
  projectId: 'project-1',
  status,
  projectNo: '2026001',
  sourceSnapshotJson: '{}',
  draftJson: JSON.stringify(draft()),
  draft: draft(),
  version,
  createdBy: 'demo-owner',
  updatedBy: 'demo-owner',
  createdAt: timestamp,
  updatedAt: timestamp,
});

const project = (companyId = 'CON_COST'): Project => ({
  id: 'project-1',
  projectNo: '2026001',
  publicationStatus: 'PUBLISHED',
  projectSourceType: 'CLIENT_ORDER',
  title: 'DEMO Project',
  priority: 'NORMAL',
  status: 'MANAGER_REVIEW',
  departmentId: 'FINISH',
  companyId,
  primaryUnitId: 'FINISH',
  assignedUnitIds: ['FINISH'],
});

const build = (overrides: Partial<Parameters<typeof buildCustomerProjectRelationshipPlan>[0]> = {}) =>
  buildCustomerProjectRelationshipPlan({
    companyId: 'CON_COST',
    intake: intake(),
    project: project(),
    customers: [customer()],
    contacts: [contact()],
    relationships: [],
    candidates: [],
    actorId: 'demo-owner',
    occurredAt: timestamp,
    ...overrides,
  });

test('accepted intake creates one company-scoped canonical relationship from exact email', () => {
  const result = build();
  assert.equal(result.relationships.length, 1);
  assert.equal(result.relationships[0].counterpartyId, 'customer-CON_COST');
  assert.equal(result.relationships[0].contactId, 'contact-CON_COST');
  assert.equal(result.relationships[0].projectId, 'project-1');
  assert.equal(result.relationships[0].source, 'PROJECT_INTAKE');
  assert.equal(result.candidates.length, 0);
});

test('same accepted revision is idempotent and does not duplicate relationship or audit', () => {
  const first = build();
  const second = build({
    relationships: first.relationships,
    occurredAt: '2026-08-12T03:00:00.000Z',
  });
  assert.equal(second.relationships.length, 1);
  assert.equal(second.relationships[0].revision, 1);
  assert.equal(second.relationships[0].audit.length, 1);
  assert.deepEqual(second.createdRelationshipIds, []);
  assert.deepEqual(second.updatedRelationshipIds, []);
});

test('exact normalized mobile is used only when email is absent', () => {
  const mobileOnly = intake();
  mobileOnly.draft = draft('');
  const result = build({ intake: mobileOnly });
  assert.equal(result.relationships.length, 1);
  assert.equal(result.relationships[0].contactId, 'contact-CON_COST');
});

test('draft intake and cross-company project are rejected', () => {
  assert.throws(() => build({ intake: intake('DRAFT') }), /REQUIRES_ACCEPTED_INTAKE/);
  assert.throws(() => build({ project: project('VIET_QS') }), /COMPANY_MISMATCH/);
});

test('name-only matching creates a review candidate and never auto-links', () => {
  const unmatched = intake();
  unmatched.draft = draft('');
  unmatched.draft.contacts[0].mobile = '';
  const result = build({ intake: unmatched });
  assert.equal(result.relationships.length, 0);
  assert.equal(result.candidates.length, 1);
  assert.equal(result.candidates[0].reason, 'CONTACT_REVIEW_REQUIRED');
  assert.deepEqual(result.candidates[0].suggestedCustomerIds, ['customer-CON_COST']);
});

test('accepted revision preserves snapshots and deactivates removed contacts', () => {
  const first = build();
  const revised = intake('ACCEPTED', 4);
  revised.draft = draft();
  revised.draft.contacts[0].department = 'Revised Project';
  const second = build({ intake: revised, relationships: first.relationships });
  assert.equal(second.relationships[0].revision, 2);
  assert.equal(second.relationships[0].snapshotHistory.length, 1);

  const removed = intake('ACCEPTED', 5);
  removed.draft = { ...draft(), contacts: [] };
  const third = build({ intake: removed, relationships: second.relationships });
  assert.equal(third.relationships[0].active, false);
  assert.deepEqual(third.deactivatedRelationshipIds, [third.relationships[0].id]);
});

test('accepted revision resolves review candidates removed from the source', () => {
  const unmatched = intake();
  unmatched.draft = draft('unmatched@example.invalid');
  unmatched.draft.contacts[0].mobile = '';
  const first = build({ intake: unmatched });
  assert.equal(first.candidates[0].status, 'REVIEW_REQUIRED');

  const revised = intake('ACCEPTED', 2);
  revised.draft = { ...draft(), contacts: [] };
  const second = build({ intake: revised, candidates: first.candidates });
  assert.equal(second.candidates[0].status, 'RESOLVED_BY_SOURCE');
});

test('link review connects an existing company contact without creating a project copy', () => {
  const unmatched = intake();
  unmatched.draft = draft('review.contact@example.invalid');
  unmatched.draft.contacts[0].mobile = '';
  const planned = build({ intake: unmatched });
  const candidate = planned.candidates[0];
  const result = linkCustomerProjectCandidateToContact({
    candidate,
    contact: contact(),
    customer: customer(),
    relationships: planned.relationships,
    actorId: 'demo-owner',
    occurredAt: '2026-08-12T04:00:00.000Z',
  });

  assert.equal(result.relationships.length, 1);
  assert.equal(result.relationship.projectId, 'project-1');
  assert.equal(result.relationship.contactId, 'contact-CON_COST');
  assert.equal(result.candidate.status, 'LINKED_EXISTING');
});

test('link review rejects contacts and customers from another company', () => {
  const unmatched = intake();
  unmatched.draft = draft('review.contact@example.invalid');
  unmatched.draft.contacts[0].mobile = '';
  const candidate = build({ intake: unmatched }).candidates[0];

  assert.throws(() => linkCustomerProjectCandidateToContact({
    candidate,
    contact: contact('VIET_QS'),
    customer: customer('VIET_QS'),
    relationships: [],
    actorId: 'demo-owner',
    occurredAt: '2026-08-12T04:00:00.000Z',
  }), /COMPANY_MISMATCH/);
});

test('project projection applies company and permission scope before returning metadata', () => {
  const relationship = build().relationships[0];
  const admin: PersonnelCard = {
    id: 'admin',
    name: 'Demo Admin',
    companyId: 'CON_COST',
    departmentId: 'MANAGEMENT_SUPPORT',
    role: 'SUPER_ADMIN',
    employmentStatus: 'ACTIVE',
  };
  const worker: PersonnelCard = { ...admin, id: 'worker', role: 'WORKER', departmentId: 'STRUCTURE' };
  assert.equal(visibleCustomerProjectRelationships([relationship], [project()], 'CON_COST', admin).length, 1);
  assert.equal(visibleCustomerProjectRelationships([relationship], [project()], 'CON_COST', worker).length, 0);
  assert.equal(visibleCustomerProjectRelationships([relationship], [project()], 'VIET_QS', admin).length, 0);
});

test('legacy sales views resolve to canonical destinations without reviving opportunity workflow', () => {
  assert.equal(legacySalesDestination('PIPELINE')?.href, '/projects/estimate-requests');
  assert.equal(legacySalesDestination('QUOTES')?.href, '/projects/intake/estimates');
  assert.equal(legacySalesDestination('CONTRACTS')?.kind, 'COMMERCIAL_DECISION');
  assert.equal(legacySalesDestination('ACTIVITIES')?.kind, 'CUSTOMER_TIMELINE');
  assert.equal(legacySalesDestination('CUSTOMERS'), null);
});
