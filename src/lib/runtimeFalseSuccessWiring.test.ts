import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path: string) => readFileSync(path, 'utf8');

test('mail send handler delegates to the runtime boundary without creating a SENT record', () => {
  const mail = source('src/components/mail/MailWorkspace.tsx');
  const handler = mail.match(/const sendMessage = [\s\S]*?\n  };/)?.[0] || '';

  assert.match(handler, /getMailSendBoundary\(runtimeMode\)/);
  assert.match(handler, /getRuntimeBoundaryCopy\('MAIL'/);
  assert.doesNotMatch(handler, /setMessages/);
  assert.doesNotMatch(handler, /box:\s*'SENT'/);
});

test('approval mutations are presentation-only until a server adapter responds', () => {
  const approvals = source('src/components/approvals/ApprovalDocumentComposer.tsx');
  const mutationBlock = approvals.match(/const submit = async[\s\S]*?\n  };/)?.[0] || '';
  const draftBlock = approvals.match(/const draft = \(\) => \{[\s\S]*?\n  };/)?.[0] || '';

  assert.match(mutationBlock, /executeFrontendMutation\(boundary/);
  assert.match(mutationBlock, /result\.kind === 'BLOCKED'/);
  assert.ok(mutationBlock.indexOf("result.kind === 'BLOCKED'") < mutationBlock.indexOf('addRequest(payload)'));
  assert.match(draftBlock, /runtimeMode !== 'DEMO_LOCAL'/);
  assert.ok(draftBlock.indexOf("runtimeMode !== 'DEMO_LOCAL'") < draftBlock.indexOf('saveDraft(requestPayload())'));
  assert.doesNotMatch(approvals, /findApprover\([^;]+currentUser\)/);
});

test('project intake is an estimate-origin queue without a direct local create action', () => {
  const intake = source('src/components/intake/ProjectIntakeWorkbench.tsx');
  const mode = source('src/lib/projectIntakeMode.ts');
  const store = source('src/store/projectIntakeStore.ts');
  const reviseBlock = store.match(/reviseAcceptedIntake: async[\s\S]*?return result;\r?\n  },/)?.[0] || '';
  assert.doesNotMatch(intake, /startNewDraft|createDraft\(actor\)|새 프로젝트 접수/);
  assert.match(mode, /DIRECT_INTAKE_ENABLED = false/);
  assert.match(intake, /견적 의뢰관리에서 수주를 확정하면 자동 등록됩니다/);
  assert.match(reviseBlock, /get\(\)\.persistenceMode !== 'LOCAL_DEMO'/);
  assert.match(reviseBlock, /BACKEND_REQUIRED: accepted intake revision adapter is not configured/);
  assert.ok(reviseBlock.indexOf("get().persistenceMode !== 'LOCAL_DEMO'") < reviseBlock.indexOf('buildAcceptedIntakeRevision'));
});

test('calendar writes only through the explicit frontend mutation boundary', () => {
  const calendar = source('src/app/calendar/page.tsx');
  const handler = calendar.match(/const submitSchedule = async \(\) => \{[\s\S]*?\n  };/)?.[0] || '';

  assert.match(handler, /executeFrontendMutation\(calendarBoundary/);
  assert.match(handler, /simulate:\s*\(\)\s*=>\s*\n?\s*addSchedule/);
  assert.match(handler, /result\.kind === 'BLOCKED'/);
});

test('task completion and review writes stay inside demo simulation handlers', () => {
  const tasks = source('src/app/tasks/my/page.tsx');
  const handlers = tasks.match(/const handleRequestCompletion = async[\s\S]*?const getStatusBadgeVariant/)?.[0] || '';

  assert.match(handlers, /executeFrontendMutation\(taskBoundary/g);
  assert.match(handlers, /simulate:\s*\(\)\s*=>\s*requestTaskCompletion/);
  assert.match(handlers, /simulate:\s*\(\)\s*=>\s*reviewTaskCompletion/);
});

test('notification read state cannot mutate outside the runtime boundary', () => {
  const notifications = source('src/app/notifications/page.tsx');
  const handlers = notifications.match(/const handleMarkAsRead = async[\s\S]*?\n  return \(/)?.[0] || '';

  assert.match(handlers, /executeFrontendMutation\(notificationBoundary/g);
  assert.match(handlers, /simulate:\s*\(\)\s*=>\s*markAsRead/);
  assert.match(handlers, /simulate:\s*\(\)\s*=>\s*markAllAsRead/);
});

test('sales and finance demo entries cannot masquerade as server ledger writes', () => {
  const dispatcher = source('src/components/handoff/BusinessModuleWorkbench.tsx');
  const sales = source('src/components/handoff/SalesOperationsWorkbench.tsx');
  const finance = source('src/components/handoff/FinanceOperationsWorkbench.tsx');
  const store = source('src/store/businessOperationsStore.ts');

  assert.match(dispatcher, /SalesOperationsWorkbench/);
  assert.match(dispatcher, /FinanceOperationsWorkbench/);
  assert.match(sales, /executeFrontendMutation\(boundary/);
  assert.match(finance, /executeFrontendMutation\(boundary/);
  assert.match(sales, /RuntimeCapabilityPanel/);
  assert.match(finance, /RuntimeCapabilityPanel/);
  assert.match(finance, /NEXT_PUBLIC_TAX_PROVIDER_READY/);
  assert.match(finance, /disabledReason=\{t\.taxBlocked\}/);
  assert.doesNotMatch(`${sales}\n${finance}\n${store}`, /localStorage|sessionStorage/);
  assert.doesNotMatch(store, /persist\s*\(/);
});
