import assert from 'node:assert/strict';
import test from 'node:test';

import {
  findBusinessCardDuplicateCandidates,
  initialSalesActivities,
  initialSalesContacts,
  initialSalesCustomers,
  mergeBusinessCardContact,
  type BusinessCardRegistrationInput,
} from '@/lib/businessOperations';
import { getFrontendModuleBoundary } from '@/lib/frontendDataSource';
import { useBusinessOperationsStore } from '@/store/businessOperationsStore';
import { LEGACY_CONTACT_STORAGE_KEY, legacyContactsRequireExplicitCompanyReview, readLegacyUnscopedContacts } from '@/store/contactStore';

const fields = {
  name: 'Demo New Contact', company: 'DEMO New Partner', department: 'Sales', position: 'Manager',
  mobile: '010-0000-3001', telephone: '', fax: '', email: 'new.card@example.invalid', homepage: '', address: '',
};

const input = (overrides: Partial<BusinessCardRegistrationInput> = {}): BusinessCardRegistrationInput => ({
  fields, captureSource: 'MANUAL', fileName: null, fileSize: null, fileReferenceId: null,
  ocrMode: 'MANUAL', fieldConfidence: {}, decision: 'NEW_CONTACT', duplicateContactId: null,
  selectedMergeFields: [], customerId: null, ownerId: 'demo-concost-admin-001', tags: ['DEMO'], memo: 'Reviewed', googleContactsOptIn: false,
  ...overrides,
});

const resetStore = () => useBusinessOperationsStore.setState({
  customers: initialSalesCustomers,
  contacts: initialSalesContacts,
  activities: initialSalesActivities,
  businessCards: [],
});

test('business-card duplicate candidates never cross company scope', () => {
  const candidate = initialSalesContacts[0];
  const concost = findBusinessCardDuplicateCandidates(initialSalesContacts, { companyId: 'CON_COST', email: candidate.email, mobile: candidate.mobile, name: candidate.name, companyName: candidate.companyName });
  const vietqs = findBusinessCardDuplicateCandidates(initialSalesContacts, { companyId: 'VIET_QS', email: candidate.email, mobile: candidate.mobile, name: candidate.name, companyName: candidate.companyName });
  assert.deepEqual(concost.map((item) => item.id), [candidate.id]);
  assert.equal(vietqs.length, 0);
});

test('DEMO registration creates one canonical contact, card record, customer and timeline activity', () => {
  resetStore();
  const before = useBusinessOperationsStore.getState();
  const result = before.registerBusinessCard('CON_COST', input(), 'demo-concost-admin-001');
  const after = useBusinessOperationsStore.getState();
  const contact = after.contacts.find((item) => item.id === result.contactId);
  assert.ok(contact);
  assert.equal(contact.companyId, 'CON_COST');
  assert.equal(contact.source, 'MANUAL');
  assert.equal(contact.sourceBusinessCardId, result.businessCardId);
  assert.equal(after.businessCards.filter((item) => item.id === result.businessCardId).length, 1);
  assert.equal(after.customers.filter((item) => item.id === result.customerId).length, 1);
  assert.equal(after.activities.filter((item) => item.contactId === result.contactId && item.title === 'Business card registered').length, 1);
});

test('reviewed Google opt-in remains pending and Contact deletion archives instead of hard deleting', () => {
  resetStore();
  const result = useBusinessOperationsStore.getState().registerBusinessCard('CON_COST', input({ googleContactsOptIn: true }), 'demo-concost-admin-001');
  let contact = useBusinessOperationsStore.getState().contacts.find((item) => item.id === result.contactId);
  assert.equal(contact?.googleSyncState, 'OPT_IN_PENDING');
  useBusinessOperationsStore.getState().archiveContact(result.contactId, 'demo-concost-admin-001');
  contact = useBusinessOperationsStore.getState().contacts.find((item) => item.id === result.contactId);
  assert.equal(contact?.status, 'INACTIVE');
  assert.ok(contact?.archivedAt);
  assert.equal(useBusinessOperationsStore.getState().contacts.filter((item) => item.id === result.contactId).length, 1);
});

test('field-level merge preserves contactId and never erases with blank incoming values', () => {
  resetStore();
  const target = initialSalesContacts[0];
  const result = useBusinessOperationsStore.getState().registerBusinessCard('CON_COST', input({
    fields: { ...fields, name: '', company: target.companyName, email: target.email, mobile: target.mobile, position: 'Director' },
    decision: 'MERGE_CONTACT', duplicateContactId: target.id, selectedMergeFields: ['name', 'position'], customerId: target.customerId,
  }), 'demo-concost-admin-001');
  const merged = useBusinessOperationsStore.getState().contacts.find((item) => item.id === target.id);
  assert.equal(result.contactId, target.id);
  assert.equal(result.merged, true);
  assert.equal(merged?.name, target.name);
  assert.equal(merged?.position, 'Director');
  assert.equal(merged?.revision, target.revision + 1);
});

test('pure merge helper leaves unselected and blank values intact', () => {
  const target = initialSalesContacts[0];
  const merged = mergeBusinessCardContact(target, { ...fields, name: '', position: 'Lead' }, ['name', 'position']);
  assert.equal(merged.name, target.name);
  assert.equal(merged.position, 'Lead');
  assert.equal(merged.email, target.email);
});

test('legacy unscoped storage is quarantined for explicit company review', () => {
  const storage = { getItem: (key: string) => key === LEGACY_CONTACT_STORAGE_KEY ? JSON.stringify({ state: { contacts: [{ id: 'legacy-1', name: 'Demo Legacy', company: 'Demo Legacy Co' }] } }) : null };
  const contacts = readLegacyUnscopedContacts(storage);
  assert.equal(contacts.length, 1);
  assert.deepEqual(legacyContactsRequireExplicitCompanyReview(contacts), [{ legacyId: 'legacy-1', status: 'COMPANY_REVIEW_REQUIRED' }]);
  assert.equal('companyId' in contacts[0], false);
});

test('server mode without adapter is BACKEND_REQUIRED and cannot mutate', () => {
  const boundary = getFrontendModuleBoundary('BUSINESS_CARD', { mode: 'PRODUCTION_SERVER', adapterReady: false });
  assert.equal(boundary.state, 'BACKEND_REQUIRED');
  assert.equal(boundary.canMutate, false);
  assert.equal(boundary.isSimulation, false);
});

test.after(resetStore);
