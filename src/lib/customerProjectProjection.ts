import type {
  BusinessCardRecord,
  SalesActivity,
  SalesContact,
  SalesCustomer,
} from '@/lib/businessOperations';
import type {
  CustomerProjectLinkCandidate,
  CustomerProjectRelationship,
} from '@/lib/customerProjectRelationship';
import { PROJECT_EXECUTION_UNITS } from '@/lib/projectExecutionUnits';
import type { PersonnelCard, Project } from '@/types/models';

export type CustomerProjectFilter =
  | 'ALL'
  | 'ACTIVE_PROJECTS'
  | 'NEW_THIS_YEAR'
  | 'RECENTLY_COMPLETED'
  | 'LINK_REVIEW'
  | 'BUSINESS_CARD_REVIEW'
  | 'STALE_CUSTOMERS';

export interface CustomerProjectHistoryRow {
  relationship: CustomerProjectRelationship;
  relationships: CustomerProjectRelationship[];
  project: Project;
  contact: SalesContact | null;
  contacts: SalesContact[];
  pmName: string;
  unitLabels: string[];
}

export interface CustomerDirectoryRow {
  customer: SalesCustomer;
  contacts: SalesContact[];
  projects: CustomerProjectHistoryRow[];
  relationshipHistory: CustomerProjectRelationship[];
  activities: SalesActivity[];
  businessCards: BusinessCardRecord[];
  lastActivityAt: string | null;
  stale: boolean;
}

export interface CustomerProjectProjection {
  rows: CustomerDirectoryRow[];
  counts: Record<CustomerProjectFilter, number>;
  linkReviewCount: number;
  businessCardReviewCount: number;
}

const isActiveProject = (project: Project) => ![
  'COMPLETED', 'DELIVERED', 'CANCELLED', 'LOST',
].includes(project.status);

const isRecentlyCompletedProject = (project: Project, now: Date) => {
  if (project.status !== 'COMPLETED') return false;
  const completedAt = project.deliveryDate ?? project.updatedAt;
  if (!completedAt) return false;
  const age = now.getTime() - new Date(completedAt).getTime();
  return age >= 0 && age <= 90 * 24 * 60 * 60 * 1000;
};

const searchable = (...values: Array<string | undefined | null>) => (
  values.filter(Boolean).join(' ').toLocaleLowerCase()
);

const latestIso = (values: Array<string | undefined | null>) => {
  const valid = values.filter((value): value is string => Boolean(value)).sort().reverse();
  return valid[0] ?? null;
};

export function buildCustomerProjectProjection({
  customers,
  contacts,
  projects,
  relationships,
  candidates,
  activities,
  businessCards,
  personnel,
  companyId,
  query = '',
  filter = 'ALL',
  locale = 'ko',
  now = new Date(),
}: {
  customers: SalesCustomer[];
  contacts: SalesContact[];
  projects: Project[];
  relationships: CustomerProjectRelationship[];
  candidates: CustomerProjectLinkCandidate[];
  activities: SalesActivity[];
  businessCards: BusinessCardRecord[];
  personnel: PersonnelCard[];
  companyId: string;
  query?: string;
  filter?: CustomerProjectFilter;
  locale?: 'ko' | 'vi' | 'en';
  now?: Date;
}): CustomerProjectProjection {
  const scopedCustomers = customers.filter((item) => item.companyId === companyId && !item.archivedAt);
  const scopedContacts = contacts.filter((item) => item.companyId === companyId && !item.archivedAt);
  const scopedActivities = activities.filter((item) => item.companyId === companyId && !item.archivedAt);
  const scopedCards = businessCards.filter((item) => item.companyId === companyId && !item.archivedAt);
  const projectById = new Map(projects
    .filter((project) => project.companyId === companyId && project.publicationStatus === 'PUBLISHED')
    .map((project) => [project.id, project]));
  const personnelById = new Map(personnel.map((person) => [person.id, person]));
  const unitById = new Map(PROJECT_EXECUTION_UNITS.map((unit) => [unit.id, unit]));
  const currentYear = String(now.getFullYear());
  const staleBefore = new Date(now);
  staleBefore.setDate(staleBefore.getDate() - 90);

  const rows = scopedCustomers.map((customer): CustomerDirectoryRow => {
    const customerContacts = scopedContacts.filter((contact) => contact.customerId === customer.id);
    const relationshipsByProject = new Map<string, CustomerProjectRelationship[]>();
    relationships.forEach((relationship) => {
      if (!relationship.active || relationship.companyId !== companyId || relationship.counterpartyId !== customer.id) return;
      if (!projectById.has(relationship.projectId)) return;
      relationshipsByProject.set(
        relationship.projectId,
        [...(relationshipsByProject.get(relationship.projectId) ?? []), relationship],
      );
    });
    const customerProjects = Array.from(relationshipsByProject.entries()).flatMap(([projectId, projectRelationships]): CustomerProjectHistoryRow[] => {
      const project = projectById.get(projectId);
      if (!project) return [];
      const relationship = projectRelationships[0];
      const relatedContacts = projectRelationships.flatMap((item) => {
        const contact = customerContacts.find((candidate) => candidate.id === item.contactId);
        return contact ? [contact] : [];
      }).filter((contact, index, entries) => entries.findIndex((item) => item.id === contact.id) === index);
      const unitIds = project.assignedUnitIds?.length
        ? project.assignedUnitIds
        : (project.executionAssignments ?? []).map((assignment) => assignment.unitId);
      return [{
        relationship,
        relationships: projectRelationships,
        project,
        contact: relatedContacts[0] ?? null,
        contacts: relatedContacts,
        pmName: personnelById.get(project.pmId ?? project.managerId ?? '')?.name
          ?? project.pmId
          ?? project.managerId
          ?? '',
        unitLabels: unitIds.map((unitId) => {
          const unit = unitById.get(unitId);
          if (!unit) return unitId;
          return locale === 'vi' ? unit.labelVi : unit.labelKo;
        }),
      }];
    }).sort((left, right) => (right.project.updatedAt ?? '').localeCompare(left.project.updatedAt ?? ''));
    const customerActivities = scopedActivities
      .filter((activity) => activity.customerId === customer.id)
      .sort((left, right) => right.happenedAt.localeCompare(left.happenedAt));
    const customerCards = scopedCards.filter((card) => (
      card.customerId === customer.id || customerContacts.some((contact) => contact.id === card.contactId)
    ));
    const lastActivityAt = latestIso([
      ...customerActivities.map((activity) => activity.happenedAt),
      ...customerProjects.map((row) => row.project.updatedAt),
      ...customerContacts.map((contact) => contact.lastContactAt),
    ]);
    return {
      customer,
      contacts: customerContacts,
      projects: customerProjects,
      relationshipHistory: relationships.filter((relationship) => (
        relationship.companyId === companyId
        && relationship.counterpartyId === customer.id
        && projectById.has(relationship.projectId)
      )),
      activities: customerActivities,
      businessCards: customerCards,
      lastActivityAt,
      stale: !lastActivityAt || new Date(lastActivityAt).getTime() < staleBefore.getTime(),
    };
  });

  const scopedCandidates = candidates.filter((candidate) => (
    candidate.companyId === companyId && candidate.status === 'REVIEW_REQUIRED'
  ));
  const reviewCustomerIds = new Set(scopedCandidates.flatMap((candidate) => candidate.suggestedCustomerIds));
  const cardReviewCustomerIds = new Set(scopedCards
    .filter((card) => !['REGISTERED', 'MERGED'].includes(card.reviewStatus))
    .map((card) => card.customerId)
    .filter((id): id is string => Boolean(id)));
  const term = query.trim().toLocaleLowerCase();
  const filtered = rows.filter((row) => {
    const queryMatched = !term || searchable(
      row.customer.name,
      row.customer.customerNo,
      ...row.contacts.flatMap((contact) => [
        contact.name,
        contact.department,
        contact.position,
        contact.telephone,
        contact.phone,
        contact.mobile,
        contact.email,
      ]),
      ...row.projects.flatMap((item) => [
        item.project.projectNo,
        item.project.title,
        item.pmName,
        ...item.unitLabels,
      ]),
    ).includes(term);
    if (!queryMatched) return false;
    if (filter === 'ACTIVE_PROJECTS') return row.projects.some((item) => isActiveProject(item.project));
    if (filter === 'NEW_THIS_YEAR') return row.projects.some((item) => (
      item.project.projectNo?.startsWith(currentYear) || item.project.createdAt?.startsWith(currentYear)
    ));
    if (filter === 'RECENTLY_COMPLETED') return row.projects.some((item) => isRecentlyCompletedProject(item.project, now));
    if (filter === 'LINK_REVIEW') return reviewCustomerIds.has(row.customer.id);
    if (filter === 'BUSINESS_CARD_REVIEW') return cardReviewCustomerIds.has(row.customer.id);
    if (filter === 'STALE_CUSTOMERS') return row.stale;
    return true;
  });

  return {
    rows: filtered,
    counts: {
      ALL: rows.length,
      ACTIVE_PROJECTS: rows.filter((row) => row.projects.some((item) => isActiveProject(item.project))).length,
      NEW_THIS_YEAR: rows.filter((row) => row.projects.some((item) => (
        item.project.projectNo?.startsWith(currentYear) || item.project.createdAt?.startsWith(currentYear)
      ))).length,
      RECENTLY_COMPLETED: rows.flatMap((row) => row.projects).filter((item) => isRecentlyCompletedProject(item.project, now)).length,
      LINK_REVIEW: scopedCandidates.length,
      BUSINESS_CARD_REVIEW: scopedCards.filter((card) => !['REGISTERED', 'MERGED'].includes(card.reviewStatus)).length,
      STALE_CUSTOMERS: rows.filter((row) => row.stale).length,
    },
    linkReviewCount: scopedCandidates.length,
    businessCardReviewCount: scopedCards.filter((card) => !['REGISTERED', 'MERGED'].includes(card.reviewStatus)).length,
  };
}
