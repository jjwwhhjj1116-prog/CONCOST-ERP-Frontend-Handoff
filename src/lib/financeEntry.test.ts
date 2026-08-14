import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bindLedgerRowToProject,
  buildFinanceImportProject,
  buildFinanceImportProjectId,
  calculateVatAmount,
  inferVatMode,
  reconcileFinanceLedgerRows,
  vatAmountForMode,
} from '@/lib/financeEntry';
import type { FinanceLedgerWorkbookRow } from '@/lib/financeErpWorkbook';
import type { Project } from '@/types/models';

const row = (overrides: Partial<FinanceLedgerWorkbookRow> = {}): FinanceLedgerWorkbookRow => ({
  kind: 'REVENUE',
  projectId: '',
  projectNo: '2026001',
  projectName: 'Synthetic Tower',
  counterparty: 'Example Client',
  title: 'First progress billing',
  billingRound: 1,
  documentDate: '2026-08-14',
  dueDate: '2026-09-14',
  supplyAmount: 1_000_000,
  vatAmount: 0,
  vatProvided: false,
  settledAmount: 0,
  note: '',
  ...overrides,
});

const project = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-kr-1',
  projectNo: '2026001',
  publicationStatus: 'PUBLISHED',
  title: 'Synthetic Tower',
  priority: 'NORMAL',
  status: 'IN_PROGRESS',
  departmentId: 'MANAGEMENT_SUPPORT',
  companyId: 'CON_COST',
  ...overrides,
});

test('VAT modes calculate ten percent, exempt, and manual amounts', () => {
  assert.equal(calculateVatAmount(1_000_005), 100_001);
  assert.equal(vatAmountForMode(1_000_000, 'AUTO_10', 1), 100_000);
  assert.equal(vatAmountForMode(1_000_000, 'EXEMPT', 100_000), 0);
  assert.equal(vatAmountForMode(1_000_000, 'MANUAL', 80_000), 80_000);
  assert.equal(inferVatMode(1_000_000, 100_000), 'AUTO_10');
  assert.equal(inferVatMode(1_000_000, 0), 'EXEMPT');
});

test('finance import resolves only selected-company project identity', () => {
  const projects = [
    project(),
    project({ id: 'project-vi-1', companyId: 'VIET_QS' }),
  ];
  const byId = reconcileFinanceLedgerRows([row({ projectId: 'project-kr-1' })], projects, 'CON_COST');
  const byNo = reconcileFinanceLedgerRows([row()], projects, 'CON_COST');
  const denied = reconcileFinanceLedgerRows([row({ projectId: 'project-vi-1' })], projects, 'CON_COST');

  assert.equal(byId[0].status, 'MATCHED_ID');
  assert.equal(byNo[0].status, 'MATCHED_NO');
  assert.equal(denied[0].status, 'BLOCKED');
  assert.equal(denied[0].reason, 'PROJECT_ID_NOT_FOUND_IN_SELECTED_COMPANY');
});

test('unmatched revenue becomes one reviewed project candidate while purchase is blocked', () => {
  const rows = [
    row({ projectNo: '2026099' }),
    row({ projectNo: '2026099', title: 'Second progress billing' }),
    row({ kind: 'PURCHASE', projectNo: '2026100', projectName: 'New Purchase Project' }),
  ];
  const resolutions = reconcileFinanceLedgerRows(rows, [], 'CON_COST');

  assert.equal(resolutions[0].status, 'CREATE_CANDIDATE');
  assert.equal(resolutions[0].candidateKey, resolutions[1].candidateKey);
  assert.equal(resolutions[2].status, 'BLOCKED');
  assert.equal(resolutions[2].reason, 'PURCHASE_REQUIRES_EXISTING_PROJECT');
  assert.equal(buildFinanceImportProjectId('CON_COST', '2026099'), buildFinanceImportProjectId('CON_COST', '2026099'));
  assert.notEqual(buildFinanceImportProjectId('CON_COST', '2026099'), buildFinanceImportProjectId('VIET_QS', '2026099'));
  const candidate = buildFinanceImportProject('CON_COST', rows[0], '2026-08-14T00:00:00.000Z');
  assert.equal(candidate.companyId, 'CON_COST');
  assert.equal(candidate.publicationStatus, 'DRAFT');
  assert.equal(candidate.projectNo, '2026099');
});

test('conflicting project names and identity mismatches are blocked before import', () => {
  const conflicts = reconcileFinanceLedgerRows([
    row({ projectNo: '2026099', projectName: 'Project Alpha' }),
    row({ projectNo: '2026099', projectName: 'Project Beta' }),
  ], [], 'CON_COST');
  const mismatch = reconcileFinanceLedgerRows([
    row({ projectId: 'project-kr-1', projectNo: '2026999' }),
  ], [project()], 'CON_COST');

  assert.ok(conflicts.every((item) => item.status === 'BLOCKED'));
  assert.equal(mismatch[0].reason, 'PROJECT_ID_NO_MISMATCH');
});

test('blank imported VAT is calculated when binding the canonical project', () => {
  const bound = bindLedgerRowToProject(row(), project());
  const explicit = bindLedgerRowToProject(row({ vatAmount: 0, vatProvided: true }), project());

  assert.equal(bound.projectId, 'project-kr-1');
  assert.equal(bound.vatAmount, 100_000);
  assert.equal(explicit.vatAmount, 0);
});
