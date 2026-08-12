import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const sidebar = readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
const sales = readFileSync('src/components/handoff/SalesOperationsWorkbench.tsx', 'utf8');
const relationships = readFileSync('src/lib/customerProjectRelationship.ts', 'utf8');
const businessStore = readFileSync('src/store/businessOperationsStore.ts', 'utf8');

test('sales navigation exposes only the approved five customer relationship entries', () => {
  const salesBlock = sidebar.slice(sidebar.indexOf("id: 'sales-home'"), sidebar.indexOf("id: 'finance-home'"));
  for (const id of ['sales-home', 'sales-customers', 'sales-business-cards', 'sales-business-card-inbox', 'sales-business-card-capture']) {
    assert.match(salesBlock, new RegExp(`id: '${id}'`));
  }
  for (const id of ['sales-opportunities', 'sales-quotes', 'sales-contracts', 'sales-activities']) {
    assert.doesNotMatch(salesBlock, new RegExp(`id: '${id}'`));
  }
});

test('legacy sales routes retain canonical destinations and do not render a pipeline board', () => {
  assert.match(sales, /legacySalesDestination/);
  assert.match(relationships, /\/projects\/estimate-requests/);
  assert.match(relationships, /\/projects\/intake\/estimates/);
  assert.doesNotMatch(sales, /OpportunityPipeline/);
  assert.doesNotMatch(sales, /Kanban/);
});

test('business card legacy create route redirects to canonical estimate request creation', () => {
  assert.match(sales, /searchParams\.get\('new'\) !== '1'/);
  assert.match(sales, /router\.replace\(`\/projects\/estimate-requests\?\$\{next\.toString\(\)\}`\)/);
});

test('customer relationship store is versioned and export is permission checked and audited', () => {
  assert.match(businessStore, /customerProjectRelationshipSchemaVersion: 1/);
  assert.match(sales, /resolveAccessGrade\(currentUser\)/);
  assert.match(sales, /entityType: 'SALES_CONTACT_DIRECTORY'/);
  assert.match(sales, /projectsIncluded=false/);
});
