import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getProjectConnectedWorkspaceHref,
  PROJECT_WORKFLOW_TABS,
} from './projectWorkflow';

test('connected workspaces stay in the direct-route tab allowlist', () => {
  assert.ok(PROJECT_WORKFLOW_TABS.includes('APPROVAL'));
  assert.ok(PROJECT_WORKFLOW_TABS.includes('DRIVE'));
  assert.ok(PROJECT_WORKFLOW_TABS.includes('AI'));
});

for (const [workspace, expected] of [
  ['APPROVAL', '/approvals?projectId=project%2F101'],
  ['DRIVE', '/drive?projectId=project%2F101'],
  ['AI', '/ai-assistant?projectId=project%2F101'],
] as const) {
  test(`builds the ${workspace} link with the canonical project id`, () => {
    assert.equal(getProjectConnectedWorkspaceHref('project/101', workspace), expected);
  });
}
