import { evaluateFinanceAccess } from '@/lib/accessControl';
import { summarizeCfoCockpit, scopeFinanceErpData } from '@/lib/financeErp';
import { canViewProject, canViewSchedule, canViewTask } from '@/lib/permissions';
import { canReadBoard } from '@/features/board/boardPermissions';
import { useOperationalBoardStore } from '@/features/board/useOperationalBoardStore';
import { useApprovalStore } from '@/store/approvalStore';
import { useAuthStore } from '@/store/authStore';
import { useBusinessOperationsStore } from '@/store/businessOperationsStore';
import { useClaimOperationsStore } from '@/store/claimOperationsStore';
import { useFinanceErpStore } from '@/store/financeErpStore';
import { useProjectStore } from '@/store/projectStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useTaskStore } from '@/store/taskStore';
import type { PersonnelCard } from '@/types/models';
import type { AssistantCompanyId } from './assistantModel';

export interface AssistantProjectToolRecord {
  id: string;
  projectNo: string;
  title: string;
  status: string;
  pmName: string;
  unitNames: string[];
  dueDate: string | null;
  clientName: string;
  claimId: string | null;
}

export interface AssistantToolSnapshot {
  companyId: AssistantCompanyId;
  generatedAt: string;
  projects: AssistantProjectToolRecord[];
  tasks: Array<{ id: string; projectId: string; title: string; status: string; dueDate: string | null; href: string }>;
  schedules: Array<{ id: string; title: string; startsAt: string; endsAt: string; href: string }>;
  approvals: Array<{ id: string; title: string; status: string; createdAt: string; href: string }>;
  boardPosts: Array<{ id: string; title: string; boardName: string; publishedAt: string; href: string }>;
  customers: Array<{ id: string; name: string; status: string; ownerName: string; projectIds: string[]; href: string }>;
  contacts: Array<{ id: string; name: string; companyName: string; position: string; href: string }>;
  organization: Array<{ id: string; name: string; departmentName: string; jobTitle: string }>;
  finance: null | { revenue: number; receivable: number; payable: number; plannedFunds: number; alerts: number; href: string };
  financeDenied: boolean;
  claims: Array<{ id: string; projectId: string; title: string; meetings: number; issues: number; reportStatus: string; href: string }>;
}

const unitLabels: Record<string, string> = {
  FINISH: '마감팀', STRUCTURE: '구조팀', CIVIL_LANDSCAPE: '토목&조경팀', CLAIM: '클레임센터', DEVELOPMENT: '개발팀',
};

const userCompany = (user: PersonnelCard) => user.companyId === 'VIET_QS' ? 'VIET_QS' : 'CON_COST';

export function readAssistantTools(user: PersonnelCard, companyId: AssistantCompanyId): AssistantToolSnapshot {
  const users = getBusinessSafeUsers(companyId);
  const userById = new Map(users.map((person) => [person.id, person]));
  const projects = useProjectStore.getState().projects
    .filter((project) => project.companyId === companyId)
    .filter((project) => canViewProject(user, project));
  const projectIds = new Set(projects.map((project) => project.id));
  const safeProjects = projects.map((project) => ({
    id: project.id,
    projectNo: project.projectNo || '미발급',
    title: project.title,
    status: project.status,
    pmName: project.pmId ? userById.get(project.pmId)?.displayName || userById.get(project.pmId)?.name || '미지정' : '미지정',
    unitNames: (project.assignedUnitIds || []).map((unit) => unitLabels[unit] || unit),
    dueDate: project.dueDate || project.deliveryDate || null,
    clientName: project.clientName || '',
    claimId: project.claimId || null,
  }));

  const tasks = useTaskStore.getState().tasks
    .filter((task) => projectIds.has(task.projectId) && canViewTask(user, task) && !task.isDeleted)
    .map((task) => ({ id: task.id, projectId: task.projectId, title: task.title, status: task.status, dueDate: task.dueDate || null, href: `/tasks/my?taskId=${encodeURIComponent(task.id)}` }));
  const schedules = useScheduleStore.getState().schedules
    .filter((schedule) => (!schedule.relatedProjectId || projectIds.has(schedule.relatedProjectId)) && canViewSchedule(user, schedule, userById.get(schedule.userId)) && !schedule.isDeleted)
    .map((schedule) => ({ id: schedule.id, title: schedule.title, startsAt: schedule.startDateTime, endsAt: schedule.endDateTime, href: `/calendar?scheduleId=${encodeURIComponent(schedule.id)}` }));
  const approvals = useApprovalStore.getState().requests
    .filter((request) => request.companyId === companyId)
    .filter((request) => user.role === 'SUPER_ADMIN' || request.requestedBy === user.id || request.pmId === user.id || request.managerId === user.id || request.approvalLine?.some((step) => step.approverId === user.id))
    .filter((request) => !request.isDeleted)
    .map((request) => ({ id: request.id, title: request.title, status: request.status, createdAt: request.createdAt, href: `/approvals?requestId=${encodeURIComponent(request.id)}` }));

  const boardActor = {
    id: user.id,
    name: user.displayName || user.name,
    role: user.role,
    companyId,
    organizationIds: [user.departmentId, user.teamId, ...(user.organizationMemberships || []).filter((membership) => membership.status === 'ACTIVE').map((membership) => membership.organizationId)].filter(Boolean) as string[],
  };
  const boardState = useOperationalBoardStore.getState();
  const visibleBoards = boardState.boards.filter((board) => canReadBoard(board, boardActor).allowed);
  const boardMap = new Map(visibleBoards.map((board) => [board.id, board]));
  const boardPosts = boardState.posts
    .filter((post) => post.companyId === companyId && post.status === 'PUBLISHED' && boardMap.has(post.boardId))
    .map((post) => ({ id: post.id, title: post.title, boardName: boardMap.get(post.boardId)?.name.ko || '', publishedAt: post.publishedAt || post.createdAt, href: `/board/post?postId=${encodeURIComponent(post.id)}` }));

  const business = useBusinessOperationsStore.getState();
  const customers = business.customers.filter((customer) => customer.companyId === companyId && !customer.archivedAt).map((customer) => ({
    id: customer.id,
    name: customer.name,
    status: customer.status,
    ownerName: userById.get(customer.ownerId)?.displayName || userById.get(customer.ownerId)?.name || '미지정',
    projectIds: projects.filter((project) => project.clientId === customer.id).map((project) => project.id),
    href: `/sales?view=CUSTOMERS&customerId=${encodeURIComponent(customer.id)}`,
  }));
  const contacts = business.contacts.filter((contact) => contact.companyId === companyId && !contact.archivedAt && contact.status === 'ACTIVE').map((contact) => ({
    id: contact.id, name: contact.name, companyName: contact.companyName, position: contact.position, href: `/sales?view=CONTACTS&contactId=${encodeURIComponent(contact.id)}`,
  }));

  const financeAccess = evaluateFinanceAccess(user);
  let finance: AssistantToolSnapshot['finance'] = null;
  if (financeAccess.allowed) {
    const store = useFinanceErpStore.getState();
    const summary = summarizeCfoCockpit(scopeFinanceErpData(store, companyId));
    finance = { revenue: summary.revenue, receivable: summary.receivable, payable: summary.payable, plannedFunds: summary.plannedFunds, alerts: summary.alerts, href: '/finance' };
  }

  const claims = useClaimOperationsStore.getState().records
    .filter((record) => projectIds.has(record.projectId))
    .map((record) => {
      const project = safeProjects.find((candidate) => candidate.id === record.projectId);
      const latestReport = [...record.reports].sort((a, b) => b.version - a.version)[0];
      return { id: record.claimId, projectId: record.projectId, title: project?.title || '클레임 프로젝트', meetings: record.meetings.length, issues: record.issues.length, reportStatus: latestReport?.status || '없음', href: `/claims?projectId=${encodeURIComponent(record.projectId)}&claimId=${encodeURIComponent(record.claimId)}` };
    });

  return {
    companyId,
    generatedAt: new Date().toISOString(),
    projects: safeProjects,
    tasks,
    schedules,
    approvals,
    boardPosts,
    customers,
    contacts,
    organization: users.map((person) => ({ id: person.id, name: person.displayName || person.name, departmentName: person.departmentName || person.teamName || person.departmentId, jobTitle: person.jobTitle || person.position || person.role })),
    finance,
    financeDenied: !financeAccess.allowed,
    claims,
  };
}

function getBusinessSafeUsers(companyId: AssistantCompanyId) {
  const { users } = useAuthStore.getState();
  return users.filter((person) => userCompany(person) === companyId && person.employmentStatus === 'ACTIVE' && person.isActive !== false);
}
