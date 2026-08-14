import type { FinanceLedgerWorkbookRow } from '@/lib/financeErpWorkbook';
import type { CompanyId, Project } from '@/types/models';

export type FinanceVatMode = 'AUTO_10' | 'EXEMPT' | 'MANUAL';

export type FinanceProjectResolutionStatus =
  | 'MATCHED_ID'
  | 'MATCHED_NO'
  | 'CREATE_CANDIDATE'
  | 'BLOCKED';

export interface FinanceProjectResolution {
  key: string;
  row: FinanceLedgerWorkbookRow;
  status: FinanceProjectResolutionStatus;
  project: Project | null;
  candidateKey: string | null;
  reason: string | null;
}

const clean = (value: string | null | undefined) => value?.trim() ?? '';
const projectNoKey = (value: string) => clean(value).toLocaleUpperCase('en-US');

export const buildFinanceImportProjectId = (companyId: CompanyId, projectNo: string) => {
  const source = `${companyId}:${projectNoKey(projectNo)}`;
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `finance-import-${companyId.toLowerCase()}-${(hash >>> 0).toString(36)}`;
};

export const buildFinanceImportProject = (
  companyId: CompanyId,
  row: FinanceLedgerWorkbookRow,
  now = new Date().toISOString(),
): Project => ({
  id: buildFinanceImportProjectId(companyId, row.projectNo),
  projectNo: row.projectNo,
  publicationStatus: 'DRAFT',
  projectSourceType: 'CLIENT_ORDER',
  clientName: row.counterparty,
  title: row.projectName,
  description: 'Finance Excel import project candidate',
  priority: 'NORMAL',
  departmentId: 'MANAGEMENT_SUPPORT',
  companyId,
  primaryUnitId: null,
  assignedUnitIds: [],
  executionAssignments: [],
  startDateStatus: 'TBD',
  archiveStatus: 'ACTIVE',
  source: 'FINANCE_EXCEL_IMPORT',
  status: 'INTAKE_RECEIVED',
  progress: 0,
  createdAt: now,
  updatedAt: now,
});

export const calculateVatAmount = (supplyAmount: number, rate = 0.1) =>
  Math.round(Math.max(0, Number.isFinite(supplyAmount) ? supplyAmount : 0) * rate);

export const vatAmountForMode = (
  supplyAmount: number,
  mode: FinanceVatMode,
  manualVatAmount: number,
) => {
  if (mode === 'AUTO_10') return calculateVatAmount(supplyAmount);
  if (mode === 'EXEMPT') return 0;
  return Math.max(0, Number.isFinite(manualVatAmount) ? manualVatAmount : 0);
};

export const inferVatMode = (supplyAmount: number, vatAmount: number): FinanceVatMode => {
  if (vatAmount === 0) return 'EXEMPT';
  if (vatAmount === calculateVatAmount(supplyAmount)) return 'AUTO_10';
  return 'MANUAL';
};

export function reconcileFinanceLedgerRows(
  rows: FinanceLedgerWorkbookRow[],
  projects: Project[],
  companyId: CompanyId,
): FinanceProjectResolution[] {
  const scopedProjects = projects.filter((project) => project.companyId === companyId);
  const byId = new Map(scopedProjects.map((project) => [project.id, project]));
  const byProjectNo = new Map<string, Project[]>();

  scopedProjects.forEach((project) => {
    const key = projectNoKey(project.projectNo ?? '');
    if (!key) return;
    byProjectNo.set(key, [...(byProjectNo.get(key) ?? []), project]);
  });

  const resolutions = rows.map<FinanceProjectResolution>((row, index) => {
    const rowKey = `${row.kind}-${index + 1}`;
    const rowProjectId = clean(row.projectId);
    const rowProjectNo = projectNoKey(row.projectNo);

    if (rowProjectId) {
      const project = byId.get(rowProjectId);
      if (!project) {
        return { key: rowKey, row, status: 'BLOCKED', project: null, candidateKey: null, reason: 'PROJECT_ID_NOT_FOUND_IN_SELECTED_COMPANY' };
      }
      if (rowProjectNo && rowProjectNo !== projectNoKey(project.projectNo ?? '')) {
        return { key: rowKey, row, status: 'BLOCKED', project: null, candidateKey: null, reason: 'PROJECT_ID_NO_MISMATCH' };
      }
      return { key: rowKey, row, status: 'MATCHED_ID', project, candidateKey: null, reason: null };
    }

    if (!rowProjectNo) {
      return { key: rowKey, row, status: 'BLOCKED', project: null, candidateKey: null, reason: 'PROJECT_ID_OR_PROJECT_NO_REQUIRED' };
    }

    const matches = byProjectNo.get(rowProjectNo) ?? [];
    if (matches.length === 1) {
      return { key: rowKey, row, status: 'MATCHED_NO', project: matches[0], candidateKey: null, reason: null };
    }
    if (matches.length > 1) {
      return { key: rowKey, row, status: 'BLOCKED', project: null, candidateKey: null, reason: 'AMBIGUOUS_PROJECT_NO' };
    }
    if (row.kind !== 'REVENUE') {
      return { key: rowKey, row, status: 'BLOCKED', project: null, candidateKey: null, reason: 'PURCHASE_REQUIRES_EXISTING_PROJECT' };
    }
    if (!clean(row.projectName)) {
      return { key: rowKey, row, status: 'BLOCKED', project: null, candidateKey: null, reason: 'PROJECT_NAME_REQUIRED_FOR_NEW_PROJECT' };
    }
    return { key: rowKey, row, status: 'CREATE_CANDIDATE', project: null, candidateKey: rowProjectNo, reason: null };
  });

  const namesByCandidate = new Map<string, Set<string>>();
  resolutions.forEach((resolution) => {
    if (resolution.status !== 'CREATE_CANDIDATE' || !resolution.candidateKey) return;
    const names = namesByCandidate.get(resolution.candidateKey) ?? new Set<string>();
    names.add(clean(resolution.row.projectName).toLocaleUpperCase('en-US'));
    namesByCandidate.set(resolution.candidateKey, names);
  });

  return resolutions.map((resolution) => {
    if (
      resolution.status === 'CREATE_CANDIDATE'
      && resolution.candidateKey
      && (namesByCandidate.get(resolution.candidateKey)?.size ?? 0) > 1
    ) {
      return { ...resolution, status: 'BLOCKED', candidateKey: null, reason: 'CONFLICTING_PROJECT_NAMES_FOR_PROJECT_NO' };
    }
    return resolution;
  });
}

export const bindLedgerRowToProject = (
  row: FinanceLedgerWorkbookRow,
  project: Pick<Project, 'id' | 'projectNo' | 'title'>,
) => ({
  ...row,
  projectId: project.id,
  projectNo: project.projectNo ?? row.projectNo,
  projectName: project.title,
  vatAmount: row.vatProvided ? row.vatAmount : calculateVatAmount(row.supplyAmount),
});
