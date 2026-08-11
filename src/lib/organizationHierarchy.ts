import type { CompanyId, PersonnelCard } from '@/types/models';

export type OrganizationNodeKind = 'COMPANY' | 'EXECUTIVE' | 'DIVISION' | 'CENTER' | 'DEPARTMENT' | 'TEAM' | 'PART';
export type ProjectExecutionUnitId = 'FINISH' | 'STRUCTURE' | 'CIVIL_LANDSCAPE' | 'CLAIM' | 'DEVELOPMENT' | 'ORG_ONLY' | 'MANAGEMENT_SUPPORT';

export type OrganizationNode = {
  id: string;
  companyId: CompanyId;
  code: string;
  displayOrderCode: string;
  name: string;
  parentId: string | null;
  kind: OrganizationNodeKind;
  sortOrder: number;
  leaderPersonnelId?: string | null;
  projectExecutionUnitId?: ProjectExecutionUnitId | null;
  accessScope?: string | null;
  active: boolean;
};

export type PersonnelOrganizationMembership = {
  companyId: CompanyId;
  personnelId: string;
  organizationNodeId: string;
  membershipType: 'PRIMARY' | 'SECONDARY';
  isLeader: boolean;
};

export type OrganizationTreeNode = OrganizationNode & { children: OrganizationTreeNode[] };

const node = (
  companyId: CompanyId,
  id: string,
  displayOrderCode: string,
  name: string,
  parentId: string | null,
  kind: OrganizationNodeKind,
  sortOrder: number,
  projectExecutionUnitId: ProjectExecutionUnitId | null = null,
  accessScope: string | null = null,
): OrganizationNode => ({
  id,
  companyId,
  code: id,
  displayOrderCode,
  name,
  parentId,
  kind,
  sortOrder,
  projectExecutionUnitId,
  accessScope,
  active: true,
});

const CON_COST_NODES: OrganizationNode[] = [
  node('CON_COST', 'CC_ROOT', '0', 'CON-COST', null, 'COMPANY', 0),
  node('CON_COST', 'CC_EXEC_CEO', '1', 'CEO', 'CC_ROOT', 'EXECUTIVE', 10),
  node('CON_COST', 'CC_EXEC_VP', '2', '부사장', 'CC_EXEC_CEO', 'EXECUTIVE', 20),
  node('CON_COST', 'CC_TECH_HQ', '3-1', '기술본부', 'CC_EXEC_VP', 'DIVISION', 31),
  node('CON_COST', 'CC_TECH_FINISH', '3-1-1', '마감팀', 'CC_TECH_HQ', 'TEAM', 311, 'FINISH'),
  node('CON_COST', 'CC_TECH_STRUCTURE', '3-1-2', '구조팀', 'CC_TECH_HQ', 'TEAM', 312, 'STRUCTURE'),
  node('CON_COST', 'CC_TECH_CIVIL_LANDSCAPE', '3-1-3', '토목,조경파트', 'CC_TECH_HQ', 'PART', 313, 'CIVIL_LANDSCAPE'),
  node('CON_COST', 'CC_TECH_BIM', '3-1-4', 'BIM파트', 'CC_TECH_HQ', 'PART', 314, 'ORG_ONLY'),
  node('CON_COST', 'CC_CLAIM_CENTER', '3-2', '클레임센터', 'CC_EXEC_VP', 'CENTER', 32, 'CLAIM'),
  node('CON_COST', 'CC_MGMT_SUPPORT_HQ', '3-3', '경영지원본부', 'CC_EXEC_VP', 'DIVISION', 33, 'MANAGEMENT_SUPPORT', 'FINANCE_ACCESS'),
  node('CON_COST', 'CC_DEV_TF', '3-4', '개발TF팀', 'CC_EXEC_VP', 'TEAM', 34, 'DEVELOPMENT'),
];

const VIET_QS_NODES: OrganizationNode[] = [
  node('VIET_QS', 'VQS_ROOT', '0', 'VIET QS', null, 'COMPANY', 0),
  node('VIET_QS', 'VQS_EXEC_CEO', '1', 'CEO', 'VQS_ROOT', 'EXECUTIVE', 10),
  node('VIET_QS', 'VQS_EXEC_VP', '2', 'Phó tổng giám đốc', 'VQS_EXEC_CEO', 'EXECUTIVE', 20),
  node('VIET_QS', 'VQS_FINISH', '3-1', 'FINISH', 'VQS_EXEC_VP', 'DIVISION', 31),
  node('VIET_QS', 'VQS_FINISH_EXTERNAL', '3-1-1', 'External', 'VQS_FINISH', 'TEAM', 311, 'FINISH'),
  node('VIET_QS', 'VQS_FINISH_INTERNAL1', '3-1-2', 'Internal1', 'VQS_FINISH', 'TEAM', 312, 'FINISH'),
  node('VIET_QS', 'VQS_FINISH_INTERNAL2', '3-1-3', 'Internal2', 'VQS_FINISH', 'TEAM', 313, 'FINISH'),
  node('VIET_QS', 'VQS_FINISH_INTERNAL3', '3-1-4', 'Internal3', 'VQS_FINISH', 'TEAM', 314, 'FINISH'),
  node('VIET_QS', 'VQS_FINISH_PNO1', '3-1-5', 'P&O1', 'VQS_FINISH', 'TEAM', 315, 'FINISH'),
  node('VIET_QS', 'VQS_FINISH_PNO2', '3-1-6', 'P&O2', 'VQS_FINISH', 'TEAM', 316, 'FINISH'),
  node('VIET_QS', 'VQS_STRUCTURE', '3-2', 'Structure', 'VQS_EXEC_VP', 'DIVISION', 32),
  node('VIET_QS', 'VQS_STRUCTURE_HORIZON1', '3-2-1', 'Horizon1', 'VQS_STRUCTURE', 'TEAM', 321, 'STRUCTURE'),
  node('VIET_QS', 'VQS_STRUCTURE_HORIZON2', '3-2-2', 'Horizon2', 'VQS_STRUCTURE', 'TEAM', 322, 'STRUCTURE'),
  node('VIET_QS', 'VQS_STRUCTURE_HORIZON3', '3-2-3', 'Horizon3', 'VQS_STRUCTURE', 'TEAM', 323, 'STRUCTURE'),
  node('VIET_QS', 'VQS_STRUCTURE_VERTICAL1', '3-2-4', 'Vertical1', 'VQS_STRUCTURE', 'TEAM', 324, 'STRUCTURE'),
  node('VIET_QS', 'VQS_STRUCTURE_VERTICAL2', '3-2-5', 'Vertical2', 'VQS_STRUCTURE', 'TEAM', 325, 'STRUCTURE'),
  node('VIET_QS', 'VQS_STRUCTURE_VERTICAL3', '3-2-6', 'Vertical3', 'VQS_STRUCTURE', 'TEAM', 326, 'STRUCTURE'),
  node('VIET_QS', 'VQS_CIVIL', '3-3', 'Civil', 'VQS_EXEC_VP', 'DIVISION', 33),
  node('VIET_QS', 'VQS_CIVIL_TEAM', '3-3-1', 'Civil Team', 'VQS_CIVIL', 'TEAM', 331, 'CIVIL_LANDSCAPE'),
  node('VIET_QS', 'VQS_DEV_TF', '3-4', '개발 TF', 'VQS_EXEC_VP', 'TEAM', 34),
  node('VIET_QS', 'VQS_DEVELOPMENT', '3-4-1', 'Development', 'VQS_DEV_TF', 'TEAM', 341, 'DEVELOPMENT'),
  node('VIET_QS', 'VQS_MGMT_SUPPORT', '3-5', 'Management Support', 'VQS_EXEC_VP', 'DIVISION', 35, null, 'FINANCE_ACCESS'),
  node('VIET_QS', 'VQS_ADMIN', '3-5-1', 'Admin', 'VQS_MGMT_SUPPORT', 'TEAM', 351, 'MANAGEMENT_SUPPORT', 'FINANCE_ACCESS'),
];

const normalize = (value?: string) => (value ?? '').normalize('NFKC').replace(/[\s&,_/·-]+/g, '').toUpperCase();

const CON_COST_ALIASES: Record<string, string> = {
  EXECUTIVE: 'CC_EXEC_VP',
  TECHNICALHQ: 'CC_TECH_HQ', 기술본부: 'CC_TECH_HQ',
  FINISH: 'CC_TECH_FINISH', 마감: 'CC_TECH_FINISH', 마감팀: 'CC_TECH_FINISH',
  STRUCTURE: 'CC_TECH_STRUCTURE', 구조: 'CC_TECH_STRUCTURE', 구조팀: 'CC_TECH_STRUCTURE',
  CIVIL: 'CC_TECH_CIVIL_LANDSCAPE', CIVILLANDSCAPE: 'CC_TECH_CIVIL_LANDSCAPE', 토목: 'CC_TECH_CIVIL_LANDSCAPE', 조경: 'CC_TECH_CIVIL_LANDSCAPE', 토목조경: 'CC_TECH_CIVIL_LANDSCAPE',
  BIM: 'CC_TECH_BIM', BIM파트: 'CC_TECH_BIM',
  CLAIM: 'CC_CLAIM_CENTER', 클레임센터: 'CC_CLAIM_CENTER',
  DEVELOPMENT: 'CC_DEV_TF', DEVELOP: 'CC_DEV_TF', 개발팀: 'CC_DEV_TF', 개발TF: 'CC_DEV_TF', 개발TF팀: 'CC_DEV_TF',
  MANAGEMENTSUPPORT: 'CC_MGMT_SUPPORT_HQ', 경영지원: 'CC_MGMT_SUPPORT_HQ', 경영지원본부: 'CC_MGMT_SUPPORT_HQ',
};

const VQS_TEAM_ALIASES: Record<string, string> = {
  EXTERNAL: 'VQS_FINISH_EXTERNAL', INTERNAL1: 'VQS_FINISH_INTERNAL1', INTERNAL2: 'VQS_FINISH_INTERNAL2', INTERNAL3: 'VQS_FINISH_INTERNAL3',
  PO1: 'VQS_FINISH_PNO1', PO2: 'VQS_FINISH_PNO2',
  HORIZON1: 'VQS_STRUCTURE_HORIZON1', HORIZON2: 'VQS_STRUCTURE_HORIZON2', HORIZON3: 'VQS_STRUCTURE_HORIZON3',
  VERTICAL1: 'VQS_STRUCTURE_VERTICAL1', VERTICAL2: 'VQS_STRUCTURE_VERTICAL2', VERTICAL3: 'VQS_STRUCTURE_VERTICAL3',
  CIVIL: 'VQS_CIVIL_TEAM', DEVELOPMENT: 'VQS_DEVELOPMENT', DEVELOP: 'VQS_DEVELOPMENT', ADMIN: 'VQS_ADMIN',
};

export function getOrganizationNodes(companyId: CompanyId) {
  return (companyId === 'VIET_QS' ? VIET_QS_NODES : CON_COST_NODES).map((item) => ({ ...item }));
}

export function resolveOrganizationAlias(companyId: CompanyId, ...values: Array<string | undefined>) {
  const keys = values.map(normalize).filter(Boolean);
  if (companyId === 'VIET_QS') {
    return keys.map((key) => VQS_TEAM_ALIASES[key]).find(Boolean)
      ?? (keys.some((key) => key.includes('FINISH')) ? 'VQS_FINISH' : undefined)
      ?? (keys.some((key) => key.includes('STRUCTURE')) ? 'VQS_STRUCTURE' : undefined)
      ?? (keys.some((key) => key.includes('CIVIL')) ? 'VQS_CIVIL' : undefined)
      ?? (keys.some((key) => key.includes('DEVELOP')) ? 'VQS_DEV_TF' : undefined)
      ?? (keys.some((key) => key.includes('MANAGEMENT') || key.includes('ADMIN')) ? 'VQS_MGMT_SUPPORT' : undefined)
      ?? null;
  }
  return keys.map((key) => CON_COST_ALIASES[key]).find(Boolean) ?? null;
}

export function getOrganizationTree(companyId: CompanyId): OrganizationTreeNode[] {
  const nodes = getOrganizationNodes(companyId);
  const byId = new Map(nodes.map((item) => [item.id, { ...item, children: [] as OrganizationTreeNode[] }]));
  const roots: OrganizationTreeNode[] = [];
  byId.forEach((item) => {
    if (!item.parentId) roots.push(item);
    else byId.get(item.parentId)?.children.push(item);
  });
  const sort = (items: OrganizationTreeNode[]) => items.sort((a, b) => a.sortOrder - b.sortOrder).forEach((item) => sort(item.children));
  sort(roots);
  return roots;
}

export function getOrganizationDescendants(nodeId: string, includeSelf = false) {
  const companyId: CompanyId = nodeId.startsWith('VQS_') ? 'VIET_QS' : 'CON_COST';
  const nodes = getOrganizationNodes(companyId);
  const descendants: string[] = includeSelf ? [nodeId] : [];
  const visit = (parentId: string) => nodes.filter((item) => item.parentId === parentId).forEach((item) => {
    descendants.push(item.id);
    visit(item.id);
  });
  visit(nodeId);
  return descendants;
}

const resolveExplicitMembership = (person: PersonnelCard, nodes: OrganizationNode[]) => {
  const nodeIds = new Set(nodes.map((item) => item.id));
  return person.organizationMemberships?.find((item) => item.status === 'ACTIVE' && item.membershipType !== 'SECONDARY' && nodeIds.has(item.organizationId))?.organizationId;
};

export function resolvePersonnelOrganization(person: PersonnelCard) {
  const companyId: CompanyId = person.companyId === 'VIET_QS' ? 'VIET_QS' : 'CON_COST';
  const nodes = getOrganizationNodes(companyId);
  const explicit = resolveExplicitMembership(person, nodes);
  if (explicit) return { companyId, primaryNodeId: explicit, resolution: 'EXPLICIT' as const };

  if (companyId === 'VIET_QS') {
    const primaryNodeId = resolveOrganizationAlias(companyId, person.teamName, person.teamId, person.subDepartmentName, person.subDepartmentId, person.departmentName, person.departmentId)
      ?? 'VQS_UNASSIGNED';
    return { companyId, primaryNodeId, resolution: primaryNodeId === 'VQS_UNASSIGNED' ? 'UNASSIGNED' as const : 'ALIAS' as const };
  }

  const primaryNodeId = resolveOrganizationAlias(companyId, person.teamName, person.teamId, person.subDepartmentName, person.subDepartmentId, person.departmentName, person.departmentId)
    ?? 'CC_UNASSIGNED';
  return { companyId, primaryNodeId, resolution: primaryNodeId === 'CC_UNASSIGNED' ? 'UNASSIGNED' as const : 'ALIAS' as const };
}

export function projectPersonnelMemberships(personnel: PersonnelCard[], companyId: CompanyId): PersonnelOrganizationMembership[] {
  const nodeIds = new Set(getOrganizationNodes(companyId).map((item) => item.id));
  return personnel
    .filter((person) => person.companyId === companyId && person.isActive !== false && person.employmentStatus !== 'RESIGNED')
    .flatMap((person) => {
      const primary = resolvePersonnelOrganization(person).primaryNodeId;
      const hasExplicitPrimary = person.organizationMemberships?.some((item) => (
        item.status === 'ACTIVE'
        && item.membershipType !== 'SECONDARY'
        && item.organizationId === primary
      )) ?? false;
      const memberships: PersonnelOrganizationMembership[] = [{
        companyId,
        personnelId: person.id,
        organizationNodeId: primary,
        membershipType: 'PRIMARY',
        isLeader: hasExplicitPrimary && ['MANAGER', 'TEAM_LEADER'].includes(person.organizationRank ?? '') && nodeIds.has(primary),
      }];
      person.organizationMemberships
        ?.filter((item) => item.status === 'ACTIVE' && item.membershipType === 'SECONDARY' && nodeIds.has(item.organizationId) && item.organizationId !== primary)
        .forEach((item) => memberships.push({
          companyId,
          personnelId: person.id,
          organizationNodeId: item.organizationId,
          membershipType: 'SECONDARY',
          isLeader: false,
        }));
      return memberships;
    });
}

export function getOrganizationPersonnel(nodeId: string, recursive: boolean, personnel: PersonnelCard[]) {
  const companyId: CompanyId = nodeId.startsWith('VQS_') ? 'VIET_QS' : 'CON_COST';
  const targetIds = new Set(recursive ? getOrganizationDescendants(nodeId, true) : [nodeId]);
  const memberships = projectPersonnelMemberships(personnel, companyId)
    .filter((item) => item.membershipType === 'PRIMARY' && targetIds.has(item.organizationNodeId));
  const personnelById = new Map(personnel.map((item) => [item.id, item]));
  return memberships.map((item) => personnelById.get(item.personnelId)).filter((item): item is PersonnelCard => Boolean(item));
}

export function getProjectExecutionUnitForOrg(nodeId: string) {
  const companyId: CompanyId = nodeId.startsWith('VQS_') ? 'VIET_QS' : 'CON_COST';
  return getOrganizationNodes(companyId).find((item) => item.id === nodeId)?.projectExecutionUnitId ?? null;
}
