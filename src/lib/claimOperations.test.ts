import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canTransitionClaimReport,
  CLAIM_FOLDER_CATALOG,
  createClaimChecksum,
  createClaimProjectRecord,
  getCanonicalClaimId,
  isClaimProject,
  nextClaimReportVersion,
  validateClaimEvidence,
} from './claimOperations';
import type { Project } from '@/types/models';

const claimProject: Project = {
  id: 'project-demo-claim-01',
  title: 'Demo Claim Project',
  priority: 'NORMAL',
  status: 'IN_PROGRESS',
  departmentId: 'CLAIM',
  primaryUnitId: 'CLAIM',
  assignedUnitIds: ['CLAIM'],
  companyId: 'CON_COST',
};

test('Claim projects retain one canonical projectId and claimId', () => {
  assert.equal(isClaimProject(claimProject), true);
  assert.equal(getCanonicalClaimId(claimProject), 'claim-project-demo-claim-01');
  const record = createClaimProjectRecord(claimProject, 'demo-user', '2026-08-07T00:00:00.000Z');
  assert.equal(record.projectId, claimProject.id);
  assert.equal(record.claimId, 'claim-project-demo-claim-01');
  assert.equal(record.companyId, 'CON_COST');
  assert.equal(record.kind, 'CONSULTING_PROJECT');
});

test('Claim Drive taxonomy is complete and ordered 00 through 10', () => {
  assert.equal(CLAIM_FOLDER_CATALOG.length, 11);
  assert.deepEqual(CLAIM_FOLDER_CATALOG.map((folder) => folder.code), ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
});

test('Report flow prevents approval and delivery shortcuts', () => {
  assert.equal(canTransitionClaimReport('DRAFT', 'REVIEW'), true);
  assert.equal(canTransitionClaimReport('DRAFT', 'APPROVED'), false);
  assert.equal(canTransitionClaimReport('REVIEW', 'APPROVAL_PENDING'), true);
  assert.equal(canTransitionClaimReport('APPROVAL_PENDING', 'APPROVED'), true);
  assert.equal(canTransitionClaimReport('APPROVED', 'DELIVERED'), true);
});

test('Delivered report revisions preserve the immutable prior version', () => {
  const report = {
    id: 'report-1',
    title: 'Demo report',
    status: 'DELIVERED' as const,
    version: 1,
    reportVersionId: 'report-1-v1',
    fileReferenceId: 'file-report-1-v1',
    fileState: 'READY' as const,
    createdAt: '2026-08-07T00:00:00.000Z',
    updatedAt: '2026-08-07T00:00:00.000Z',
  };
  assert.equal(nextClaimReportVersion([report], report), 2);
  assert.equal(report.version, 1);
  assert.equal(report.status, 'DELIVERED');
});

test('Evidence requires canonical context, version, checksum, and file reference', () => {
  const evidence = {
    id: 'evidence-1',
    projectId: claimProject.id,
    claimId: getCanonicalClaimId(claimProject),
    folderCode: '04' as const,
    fileName: 'demo-evidence.pdf',
    fileReferenceId: 'file-demo-1',
    state: 'READY' as const,
    version: 1,
    checksum: createClaimChecksum('demo-evidence.pdf'),
    classification: 'INTERNAL' as const,
    createdBy: 'demo-user',
    createdAt: '2026-08-07T00:00:00.000Z',
  };
  assert.equal(validateClaimEvidence(evidence), null);
  assert.equal(validateClaimEvidence({ ...evidence, fileReferenceId: '' }), 'FILE_REFERENCE_REQUIRED');
  assert.equal(createClaimChecksum('demo-evidence.pdf'), createClaimChecksum('demo-evidence.pdf'));
});
