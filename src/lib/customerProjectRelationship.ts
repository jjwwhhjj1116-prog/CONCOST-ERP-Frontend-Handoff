import type { SalesContact, SalesCustomer } from '@/lib/businessOperations';
import { canViewProject } from '@/lib/permissions';
import type {
  CompanyId,
  PersonnelCard,
  Project,
  ProjectIntake,
  ProjectIntakeContact,
} from '@/types/models';

export type CustomerProjectRelationshipRole =
  | 'CLIENT_CONTACT'
  | 'BILLING_CONTACT'
  | 'DECISION_MAKER'
  | 'PROJECT_CONTACT'
  | 'REQUESTER'
  | 'SITE_CONTACT'
  | 'OTHER';

export type CustomerProjectRelationshipSource =
  | 'PROJECT_INTAKE'
  | 'ESTIMATE_REQUEST'
  | 'MANUAL_LEGACY_LINK'
  | 'LEGACY_READ_ONLY';

export interface CustomerProjectContactSnapshot {
  sourceRevision: number;
  sourceContactId: string;
  name: string;
  role: string;
  department: string;
  telephone: string;
  mobile: string;
  email: string;
  capturedAt: string;
  sourceHash: string;
}

export interface CustomerProjectRelationshipAudit {
  id: string;
  action: 'CREATED' | 'SOURCE_REVISED' | 'DEACTIVATED' | 'REACTIVATED';
  actorId: string;
  sourceRevision: number;
  beforeHash: string | null;
  afterHash: string | null;
  createdAt: string;
}

export interface CustomerProjectRelationship {
  id: string;
  companyId: CompanyId;
  counterpartyId: string;
  contactId: string | null;
  projectId: string;
  projectIntakeId: string;
  role: CustomerProjectRelationshipRole;
  source: CustomerProjectRelationshipSource;
  sourceRevision: number;
  contactSnapshot: CustomerProjectContactSnapshot;
  snapshotHistory: CustomerProjectContactSnapshot[];
  active: boolean;
  revision: number;
  createdAt: string;
  updatedAt: string;
  audit: CustomerProjectRelationshipAudit[];
}

export type CustomerProjectCandidateStatus =
  | 'REVIEW_REQUIRED'
  | 'LINKED_EXISTING'
  | 'CREATE_CONTACT_REQUESTED'
  | 'DIFFERENT_PERSON'
  | 'ON_HOLD'
  | 'RESOLVED_BY_SOURCE';

export interface CustomerProjectLinkCandidate {
  id: string;
  companyId: CompanyId;
  projectId: string;
  projectIntakeId: string;
  sourceContactId: string;
  sourceRevision: number;
  snapshot: CustomerProjectContactSnapshot;
  suggestedCustomerIds: string[];
  suggestedContactIds: string[];
  reason:
    | 'AMBIGUOUS_EXACT_MATCH'
    | 'CUSTOMER_REVIEW_REQUIRED'
    | 'CONTACT_REVIEW_REQUIRED'
    | 'NO_CANONICAL_MATCH';
  status: CustomerProjectCandidateStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProjectRelationshipPlan {
  relationships: CustomerProjectRelationship[];
  candidates: CustomerProjectLinkCandidate[];
  createdRelationshipIds: string[];
  updatedRelationshipIds: string[];
  deactivatedRelationshipIds: string[];
}

interface BuildRelationshipPlanInput {
  companyId: CompanyId;
  intake: ProjectIntake;
  project: Project;
  customers: SalesCustomer[];
  contacts: SalesContact[];
  relationships: CustomerProjectRelationship[];
  candidates: CustomerProjectLinkCandidate[];
  actorId: string;
  occurredAt: string;
}

const normalizeEmail = (value: string) => value.trim().toLowerCase();
const normalizePhone = (value: string) => value.replace(/\D/g, '');
const normalizeText = (value: string) => value.trim().toLocaleLowerCase();
const stableIdPart = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');

const stableHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

const relationshipId = (companyId: CompanyId, intakeId: string, sourceContactId: string) =>
  `customer-project-${stableIdPart(companyId)}-${stableIdPart(intakeId)}-${stableIdPart(sourceContactId)}`;

const candidateId = (companyId: CompanyId, intakeId: string, sourceContactId: string) =>
  `customer-project-review-${stableIdPart(companyId)}-${stableIdPart(intakeId)}-${stableIdPart(sourceContactId)}`;

const snapshotFor = (
  contact: ProjectIntakeContact,
  sourceRevision: number,
  occurredAt: string,
): CustomerProjectContactSnapshot => {
  const stableSnapshot = {
    sourceRevision,
    sourceContactId: contact.id,
    name: contact.name.trim(),
    role: contact.role.trim(),
    department: contact.department.trim(),
    telephone: contact.telephone.trim(),
    mobile: contact.mobile.trim(),
    email: contact.email.trim(),
  };
  return {
    ...stableSnapshot,
    capturedAt: occurredAt,
    sourceHash: stableHash(JSON.stringify(stableSnapshot)),
  };
};

const relationshipRole = (contact: ProjectIntakeContact): CustomerProjectRelationshipRole => {
  const role = normalizeText(contact.role);
  if (role.includes('결정') || role.includes('decision')) return 'DECISION_MAKER';
  if (role.includes('정산') || role.includes('billing') || role.includes('invoice')) return 'BILLING_CONTACT';
  if (role.includes('발주') || role.includes('client')) return 'CLIENT_CONTACT';
  if (role.includes('요청') || role.includes('request')) return 'REQUESTER';
  if (role.includes('현장') || role.includes('site')) return 'SITE_CONTACT';
  return 'PROJECT_CONTACT';
};

const exactMatches = (contacts: SalesContact[], source: ProjectIntakeContact) => {
  const email = normalizeEmail(source.email);
  if (email) {
    const byEmail = contacts.filter((contact) => normalizeEmail(contact.email) === email);
    if (byEmail.length) return byEmail;
  }
  const mobile = normalizePhone(source.mobile || source.telephone);
  if (mobile.length >= 8) {
    return contacts.filter((contact) => {
      const candidate = normalizePhone(contact.mobile || contact.phone || contact.telephone);
      return candidate.length >= 8 && candidate === mobile;
    });
  }
  return [];
};

const customerNameCandidates = (customers: SalesCustomer[], companyName: string) => {
  const normalized = normalizeText(companyName);
  if (!normalized) return [];
  return customers.filter((customer) => normalizeText(customer.name) === normalized);
};

const auditEntry = (
  relationship: Pick<CustomerProjectRelationship, 'id'>,
  action: CustomerProjectRelationshipAudit['action'],
  actorId: string,
  sourceRevision: number,
  beforeHash: string | null,
  afterHash: string | null,
  occurredAt: string,
): CustomerProjectRelationshipAudit => ({
  id: `${relationship.id}-audit-${sourceRevision}-${action}`,
  action,
  actorId,
  sourceRevision,
  beforeHash,
  afterHash,
  createdAt: occurredAt,
});

export function buildCustomerProjectRelationshipPlan({
  companyId,
  intake,
  project,
  customers,
  contacts,
  relationships,
  candidates,
  actorId,
  occurredAt,
}: BuildRelationshipPlanInput): CustomerProjectRelationshipPlan {
  if (intake.status !== 'ACCEPTED') throw new Error('CUSTOMER_PROJECT_RELATIONSHIP_REQUIRES_ACCEPTED_INTAKE');
  if (project.publicationStatus !== 'PUBLISHED') throw new Error('CUSTOMER_PROJECT_RELATIONSHIP_REQUIRES_PUBLISHED_PROJECT');
  if (intake.projectId !== project.id) throw new Error('CUSTOMER_PROJECT_RELATIONSHIP_PROJECT_MISMATCH');
  if (project.companyId !== companyId) throw new Error('CUSTOMER_PROJECT_RELATIONSHIP_COMPANY_MISMATCH');

  const scopedCustomers = customers.filter((customer) => customer.companyId === companyId && !customer.archivedAt);
  const scopedContacts = contacts.filter((contact) => (
    contact.companyId === companyId && !contact.archivedAt && contact.status === 'ACTIVE'
  ));
  const sourceContacts = intake.draft?.contacts ?? [];
  const sourceIds = new Set(sourceContacts.map((contact) => contact.id));
  const createdRelationshipIds: string[] = [];
  const updatedRelationshipIds: string[] = [];
  const deactivatedRelationshipIds: string[] = [];
  let nextRelationships = [...relationships];
  let nextCandidates = [...candidates];

  sourceContacts.forEach((sourceContact) => {
    const snapshot = snapshotFor(sourceContact, intake.version, occurredAt);
    const matches = exactMatches(scopedContacts, sourceContact);
    const exactContact = matches.length === 1 ? matches[0] : null;
    const exactCustomer = exactContact
      ? scopedCustomers.find((customer) => customer.id === exactContact.customerId)
      : null;
    const relationKey = relationshipId(companyId, intake.id, sourceContact.id);
    const existing = nextRelationships.find((relationship) => relationship.id === relationKey);

    if (exactContact && exactCustomer) {
      if (
        existing
        && existing.active
        && existing.sourceRevision === intake.version
        && existing.contactSnapshot.sourceHash === snapshot.sourceHash
        && existing.contactId === exactContact.id
        && existing.counterpartyId === exactCustomer.id
      ) {
        return;
      }
      const next: CustomerProjectRelationship = existing
        ? {
            ...existing,
            counterpartyId: exactCustomer.id,
            contactId: exactContact.id,
            projectId: project.id,
            projectIntakeId: intake.id,
            role: relationshipRole(sourceContact),
            sourceRevision: intake.version,
            contactSnapshot: snapshot,
            snapshotHistory: existing.contactSnapshot.sourceHash === snapshot.sourceHash
              ? existing.snapshotHistory
              : [existing.contactSnapshot, ...existing.snapshotHistory],
            active: true,
            revision: existing.revision + 1,
            updatedAt: occurredAt,
            audit: [
              auditEntry(
                existing,
                existing.active ? 'SOURCE_REVISED' : 'REACTIVATED',
                actorId,
                intake.version,
                existing.contactSnapshot.sourceHash,
                snapshot.sourceHash,
                occurredAt,
              ),
              ...existing.audit,
            ],
          }
        : {
            id: relationKey,
            companyId,
            counterpartyId: exactCustomer.id,
            contactId: exactContact.id,
            projectId: project.id,
            projectIntakeId: intake.id,
            role: relationshipRole(sourceContact),
            source: 'PROJECT_INTAKE',
            sourceRevision: intake.version,
            contactSnapshot: snapshot,
            snapshotHistory: [],
            active: true,
            revision: 1,
            createdAt: occurredAt,
            updatedAt: occurredAt,
            audit: [auditEntry({ id: relationKey }, 'CREATED', actorId, intake.version, null, snapshot.sourceHash, occurredAt)],
          };
      nextRelationships = existing
        ? nextRelationships.map((relationship) => relationship.id === relationKey ? next : relationship)
        : [next, ...nextRelationships];
      (existing ? updatedRelationshipIds : createdRelationshipIds).push(relationKey);
      nextCandidates = nextCandidates.map((candidate) => candidate.id === candidateId(companyId, intake.id, sourceContact.id)
        ? { ...candidate, status: 'RESOLVED_BY_SOURCE', updatedAt: occurredAt }
        : candidate);
      return;
    }

    const companyCandidates = customerNameCandidates(scopedCustomers, intake.draft?.company ?? '');
    const review: CustomerProjectLinkCandidate = {
      id: candidateId(companyId, intake.id, sourceContact.id),
      companyId,
      projectId: project.id,
      projectIntakeId: intake.id,
      sourceContactId: sourceContact.id,
      sourceRevision: intake.version,
      snapshot,
      suggestedCustomerIds: companyCandidates.map((customer) => customer.id),
      suggestedContactIds: matches.map((contact) => contact.id),
      reason: matches.length > 1
        ? 'AMBIGUOUS_EXACT_MATCH'
        : companyCandidates.length
          ? 'CONTACT_REVIEW_REQUIRED'
          : intake.draft?.company.trim()
            ? 'CUSTOMER_REVIEW_REQUIRED'
            : 'NO_CANONICAL_MATCH',
      status: 'REVIEW_REQUIRED',
      createdAt: nextCandidates.find((candidate) => candidate.id === candidateId(companyId, intake.id, sourceContact.id))?.createdAt ?? occurredAt,
      updatedAt: occurredAt,
    };
    nextCandidates = nextCandidates.some((candidate) => candidate.id === review.id)
      ? nextCandidates.map((candidate) => candidate.id === review.id ? review : candidate)
      : [review, ...nextCandidates];
  });

  nextRelationships = nextRelationships.map((relationship) => {
    if (
      relationship.companyId !== companyId
      || relationship.projectIntakeId !== intake.id
      || !relationship.active
      || sourceIds.has(relationship.contactSnapshot.sourceContactId)
    ) return relationship;
    deactivatedRelationshipIds.push(relationship.id);
    return {
      ...relationship,
      active: false,
      sourceRevision: intake.version,
      revision: relationship.revision + 1,
      updatedAt: occurredAt,
      audit: [
        auditEntry(
          relationship,
          'DEACTIVATED',
          actorId,
          intake.version,
          relationship.contactSnapshot.sourceHash,
          null,
          occurredAt,
        ),
        ...relationship.audit,
      ],
    };
  });

  nextCandidates = nextCandidates.map((candidate) => {
    if (
      candidate.companyId !== companyId
      || candidate.projectIntakeId !== intake.id
      || candidate.status !== 'REVIEW_REQUIRED'
      || sourceIds.has(candidate.sourceContactId)
    ) return candidate;
    return {
      ...candidate,
      sourceRevision: intake.version,
      status: 'RESOLVED_BY_SOURCE',
      updatedAt: occurredAt,
    };
  });

  return {
    relationships: nextRelationships,
    candidates: nextCandidates,
    createdRelationshipIds,
    updatedRelationshipIds,
    deactivatedRelationshipIds,
  };
}

export const visibleCustomerProjectRelationships = (
  relationships: CustomerProjectRelationship[],
  projects: Project[],
  companyId: CompanyId,
  viewer: PersonnelCard,
) => {
  const projectById = new Map(
    projects
      .filter((project) => project.companyId === companyId && project.publicationStatus === 'PUBLISHED')
      .filter((project) => canViewProject(viewer, project))
      .map((project) => [project.id, project]),
  );
  return relationships
    .filter((relationship) => relationship.companyId === companyId && relationship.active)
    .flatMap((relationship) => {
      const project = projectById.get(relationship.projectId);
      return project ? [{ relationship, project }] : [];
    });
};

export function linkCustomerProjectCandidateToContact({
  candidate,
  contact,
  customer,
  relationships,
  actorId,
  occurredAt,
}: {
  candidate: CustomerProjectLinkCandidate;
  contact: SalesContact;
  customer: SalesCustomer;
  relationships: CustomerProjectRelationship[];
  actorId: string;
  occurredAt: string;
}) {
  if (candidate.status !== 'REVIEW_REQUIRED') throw new Error('CUSTOMER_PROJECT_CANDIDATE_ALREADY_RESOLVED');
  if (candidate.companyId !== contact.companyId || candidate.companyId !== customer.companyId) {
    throw new Error('CUSTOMER_PROJECT_CANDIDATE_COMPANY_MISMATCH');
  }
  if (contact.customerId !== customer.id) throw new Error('CUSTOMER_PROJECT_CANDIDATE_CUSTOMER_MISMATCH');
  const id = relationshipId(candidate.companyId, candidate.projectIntakeId, candidate.sourceContactId);
  const existing = relationships.find((relationship) => relationship.id === id);
  const relationship: CustomerProjectRelationship = existing
    ? {
        ...existing,
        counterpartyId: customer.id,
        contactId: contact.id,
        projectId: candidate.projectId,
        projectIntakeId: candidate.projectIntakeId,
        sourceRevision: candidate.sourceRevision,
        contactSnapshot: candidate.snapshot,
        snapshotHistory: existing.contactSnapshot.sourceHash === candidate.snapshot.sourceHash
          ? existing.snapshotHistory
          : [existing.contactSnapshot, ...existing.snapshotHistory],
        active: true,
        revision: existing.revision + 1,
        updatedAt: occurredAt,
        audit: [
          auditEntry(existing, existing.active ? 'SOURCE_REVISED' : 'REACTIVATED', actorId, candidate.sourceRevision, existing.contactSnapshot.sourceHash, candidate.snapshot.sourceHash, occurredAt),
          ...existing.audit,
        ],
      }
    : {
        id,
        companyId: candidate.companyId,
        counterpartyId: customer.id,
        contactId: contact.id,
        projectId: candidate.projectId,
        projectIntakeId: candidate.projectIntakeId,
        role: 'PROJECT_CONTACT',
        source: 'PROJECT_INTAKE',
        sourceRevision: candidate.sourceRevision,
        contactSnapshot: candidate.snapshot,
        snapshotHistory: [],
        active: true,
        revision: 1,
        createdAt: occurredAt,
        updatedAt: occurredAt,
        audit: [auditEntry({ id }, 'CREATED', actorId, candidate.sourceRevision, null, candidate.snapshot.sourceHash, occurredAt)],
      };
  return {
    relationship,
    relationships: existing
      ? relationships.map((item) => item.id === id ? relationship : item)
      : [relationship, ...relationships],
    candidate: { ...candidate, status: 'LINKED_EXISTING' as const, updatedAt: occurredAt },
  };
}

export type LegacySalesView = 'PIPELINE' | 'OPPORTUNITIES' | 'QUOTES' | 'CONTRACTS' | 'ACTIVITIES';

export const legacySalesDestination = (view: string | null) => {
  const normalized = view?.toUpperCase() as LegacySalesView | undefined;
  if (normalized === 'PIPELINE' || normalized === 'OPPORTUNITIES') {
    return { view: normalized, href: '/projects/estimate-requests', kind: 'ESTIMATE_REQUEST' as const };
  }
  if (normalized === 'QUOTES') {
    return { view: normalized, href: '/projects/intake/estimates', kind: 'ESTIMATE_SHEET' as const };
  }
  if (normalized === 'CONTRACTS') {
    return { view: normalized, href: '/projects/estimate-requests', kind: 'COMMERCIAL_DECISION' as const };
  }
  if (normalized === 'ACTIVITIES') {
    return { view: normalized, href: '/sales?view=CUSTOMERS&tab=TIMELINE', kind: 'CUSTOMER_TIMELINE' as const };
  }
  return null;
};
