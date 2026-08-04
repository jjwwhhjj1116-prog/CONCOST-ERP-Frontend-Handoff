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

test('project intake create checks the persistence mode before creating a local draft', () => {
  const intake = source('src/components/intake/ProjectIntakeWorkbench.tsx');
  const handler = intake.match(/const startNewDraft = [\s\S]*?\n  };/)?.[0] || '';

  const guard = handler.indexOf("persistenceMode !== 'LOCAL_DEMO'");
  const create = handler.indexOf('createDraft(actor)');
  assert.ok(guard >= 0);
  assert.ok(create > guard);
  assert.match(handler, /getProjectIntakeCreateBlockedCopy/);
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
  const business = source('src/components/handoff/BusinessModuleWorkbench.tsx');
  const submit = business.match(/const submit = async[\s\S]*?\n  };/)?.[0] || '';

  assert.match(submit, /executeFrontendMutation\(boundary/);
  assert.match(submit, /simulate:\s*\(\)\s*=>\s*\{/);
  assert.doesNotMatch(business, /localStorage|sessionStorage/);
  assert.match(business, /not saved to a server ledger/);
});
