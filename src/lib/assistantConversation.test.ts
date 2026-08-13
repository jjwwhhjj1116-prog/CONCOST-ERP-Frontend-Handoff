import assert from 'node:assert/strict';
import test from 'node:test';
import { answerDemoQuestion } from '@/features/assistant/assistantDemoEngine';
import { createAssistantPageContext } from '@/features/assistant/assistantContext';
import { getAssistantRuntimeBoundary } from '@/features/assistant/assistantRuntime';
import type { AssistantMessage } from '@/features/assistant/assistantModel';
import type { AssistantToolSnapshot } from '@/features/assistant/assistantTools';
import { buildCapabilityRegistry } from './integrationDiagnostics';

const snapshot = (values: Partial<AssistantToolSnapshot> = {}): AssistantToolSnapshot => ({
  companyId: 'CON_COST',
  generatedAt: '2026-08-13T09:00:00.000Z',
  projects: [{ id: 'project-demo-001', projectNo: '2026001', title: 'DEMO 복합시설', status: 'PUBLISHED', pmName: 'DEMO PM', unitNames: ['마감팀'], dueDate: '2026-08-31', clientName: 'DEMO 고객사', claimId: null }],
  tasks: [{ id: 'task-demo-001', projectId: 'project-demo-001', title: 'DEMO 도면 검토', status: 'TODO', dueDate: '2026-08-13', href: '/tasks/my?taskId=task-demo-001' }],
  schedules: [{ id: 'schedule-demo-001', title: 'DEMO 착수 회의', startsAt: '2026-08-13T10:00:00.000Z', endsAt: '2026-08-13T11:00:00.000Z', href: '/calendar?scheduleId=schedule-demo-001' }],
  approvals: [{ id: 'approval-demo-001', title: 'DEMO 지출결의', status: 'PENDING', createdAt: '2026-08-12T09:00:00.000Z', href: '/approvals?requestId=approval-demo-001' }],
  boardPosts: [{ id: 'post-demo-001', title: 'DEMO 전사공지', boardName: '전사공지', publishedAt: '2026-08-13T08:00:00.000Z', href: '/board/post?postId=post-demo-001' }],
  customers: [{ id: 'customer-demo-001', name: 'DEMO 고객사', status: 'ACTIVE', ownerName: 'DEMO Owner', projectIds: ['project-demo-001'], href: '/sales?view=CUSTOMERS&customerId=customer-demo-001' }],
  contacts: [],
  organization: [{ id: 'person-demo-001', name: 'DEMO PM', departmentName: '마감팀', jobTitle: 'PM' }],
  finance: { revenue: 100, receivable: 20, payable: 10, plannedFunds: 90, alerts: 1, href: '/finance' },
  financeDenied: false,
  claims: [{ id: 'claim-demo-001', projectId: 'project-demo-001', title: 'DEMO 클레임', meetings: 2, issues: 1, reportStatus: 'REVIEW', href: '/claims?projectId=project-demo-001&claimId=claim-demo-001' }],
  ...values,
});

test('demo task, schedule, approval and board answers cite only supplied records', () => {
  const cases = [
    ['오늘 할 일 알려줘', 'TASK', 'task-demo-001'],
    ['오늘 일정이 뭐야?', 'SCHEDULE', 'schedule-demo-001'],
    ['내 결재 대기 보여줘', 'APPROVAL', 'approval-demo-001'],
    ['최근 전사공지 알려줘', 'BOARD_POST', 'post-demo-001'],
  ] as const;
  for (const [question, sourceType, sourceId] of cases) {
    const result = answerDemoQuestion({ question, locale: 'ko', snapshot: snapshot() });
    assert.equal(result.status, 'COMPLETE');
    assert.equal(result.citations[0]?.sourceType, sourceType);
    assert.equal(result.citations[0]?.sourceId, sourceId);
  }
});

test('project lookup and follow-up use the same canonical project citation', () => {
  const first = answerDemoQuestion({ question: '프로젝트 2026001 상태 알려줘', locale: 'ko', snapshot: snapshot() });
  const previous: AssistantMessage[] = [{ id: 'message-demo-001', companyId: 'CON_COST', threadId: 'thread-demo-001', role: 'ASSISTANT', content: first.content, status: 'COMPLETE', citations: first.citations, actionCandidates: [], createdAt: '2026-08-13T09:00:00.000Z', runtimeMode: 'DEMO_LOCAL', answerKind: first.answerKind }];
  const followUp = answerDemoQuestion({ question: '담당자는?', locale: 'ko', snapshot: snapshot(), previousMessages: previous });
  assert.equal(first.citations[0]?.sourceId, 'project-demo-001');
  assert.equal(followUp.citations[0]?.sourceId, 'project-demo-001');
});

test('customer, organization and claim queries use scoped synthetic records', () => {
  const customer = answerDemoQuestion({ question: 'DEMO 고객사 프로젝트 이력 보여줘', locale: 'ko', snapshot: snapshot() });
  const organization = answerDemoQuestion({ question: '조직도에서 마감팀 찾아줘', locale: 'ko', snapshot: snapshot() });
  const claim = answerDemoQuestion({ question: '최근 클레임 회의 알려줘', locale: 'ko', snapshot: snapshot() });
  assert.deepEqual(customer.citations.map((item) => item.sourceType), ['CUSTOMER', 'PROJECT']);
  assert.equal(organization.citations[0]?.sourceType, 'ORGANIZATION');
  assert.equal(claim.citations[0]?.sourceId, 'claim-demo-001');
});

test('finance permission is enforced before any amount or citation is projected', () => {
  const result = answerDemoQuestion({ question: '이번 달 미수 현황 알려줘', locale: 'ko', snapshot: snapshot({ finance: null, financeDenied: true }) });
  assert.equal(result.status, 'BLOCKED');
  assert.equal(result.errorCode, 'FORBIDDEN');
  assert.equal(result.citations.length, 0);
  assert.equal(/100|20|10|90/.test(result.content), false);
});

test('authorized finance answer exposes only the scoped finance summary', () => {
  const result = answerDemoQuestion({ question: '이번 달 미수 현황 알려줘', locale: 'ko', snapshot: snapshot() });
  assert.equal(result.status, 'COMPLETE');
  assert.equal(result.citations[0]?.sourceType, 'FINANCE');
  assert.match(result.content, /미수 20/);
});

test('navigation help is labeled as system help and links to an existing route', () => {
  const result = answerDemoQuestion({ question: '명함 자동등록은 어디 있어?', locale: 'ko', snapshot: snapshot() });
  assert.equal(result.citations[0]?.sourceType, 'SYSTEM_HELP');
  assert.equal(result.citations[0]?.href, '/sales/business-cards');
});

test('action candidates remain proposed and never mutate a store automatically', () => {
  const result = answerDemoQuestion({ question: '할 일 만들어', locale: 'ko', snapshot: snapshot() });
  assert.equal(result.actionCandidates[0]?.kind, 'CREATE_TASK_DRAFT');
  assert.equal(result.actionCandidates[0]?.status, 'PROPOSED');
  assert.match(String(result.actionCandidates[0]?.payload.href), /create=1/);
});

test('unknown demo questions are honest and have no fake citations', () => {
  const result = answerDemoQuestion({ question: '우주의 모든 비밀을 알려줘', locale: 'ko', snapshot: snapshot() });
  assert.match(result.content, /지원하지 않습니다/);
  assert.equal(result.citations.length, 0);
  assert.equal(result.actionCandidates.length, 0);
});

test('sandbox and production return typed blockers without demo fallback', () => {
  const sandbox = getAssistantRuntimeBoundary('ko', null, 'API_SANDBOX');
  const production = getAssistantRuntimeBoundary('ko', null, 'PRODUCTION_SERVER');
  assert.equal(sandbox.kind, 'BLOCKED');
  assert.equal(production.kind, 'BLOCKED');
  assert.notEqual(sandbox.kind, 'DEMO_RULE_ENGINE');
  assert.notEqual(production.kind, 'DEMO_RULE_ENGINE');
});

test('sensitive page context is identified without reading page content', () => {
  const finance = createAssistantPageContext('/finance', new URLSearchParams('view=LEDGER'), 'CON_COST');
  const claim = createAssistantPageContext('/claims', new URLSearchParams('projectId=project-demo-001&claimId=claim-demo-001'), 'CON_COST');
  const board = createAssistantPageContext('/board/post', new URLSearchParams('postId=post-demo-001'), 'CON_COST');
  assert.equal(finance.sensitivity, 'FINANCE');
  assert.equal(claim.sensitivity, 'RESTRICTED_LEGAL');
  assert.deepEqual({ type: board.entityType, id: board.entityId }, { type: 'BOARD_POST', id: 'post-demo-001' });
});

test('integration registry contains all five assistant capability IDs', () => {
  const ids = new Set(buildCapabilityRegistry().map((item) => item.id));
  for (const id of ['AI_ASSISTANT_CHAT', 'AI_ASSISTANT_RAG', 'AI_ASSISTANT_ACTIONS', 'AI_MEETING_NOTES', 'AI_STT']) assert.equal(ids.has(id as never), true);
});
