import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
  OPENAPI_OPERATIONS,
} from './frontendDataSource';

test('DEMO_LOCAL mutations are explicitly simulated and never persisted', async () => {
  const boundary = getFrontendModuleBoundary('MAIL', {
    mode: 'DEMO_LOCAL',
    locale: 'en',
    providerRequired: true,
    providerState: 'NOT_CONFIGURED',
  });

  const result = await executeFrontendMutation(boundary, {
    simulate: () => ({ id: 'demo-mail' }),
  });

  assert.equal(boundary.state, 'DEMO_SIMULATION');
  assert.equal(result.kind, 'SIMULATED');
  assert.equal(result.persisted, false);
});

test('server modes block mutations when a required provider is missing', async () => {
  const boundary = getFrontendModuleBoundary('DRIVE', {
    mode: 'API_SANDBOX',
    adapterReady: true,
    providerRequired: true,
    providerState: 'NOT_CONFIGURED',
  });

  const result = await executeFrontendMutation(boundary, {
    simulate: () => ({ id: 'must-not-run' }),
  });

  assert.equal(boundary.state, 'PROVIDER_REQUIRED');
  assert.equal(result.kind, 'BLOCKED');
  assert.equal(result.persisted, false);
});

test('server modes block mutations when the backend adapter is missing', async () => {
  const boundary = getFrontendModuleBoundary('PROJECT', {
    mode: 'PRODUCTION_SERVER',
    adapterReady: false,
  });

  const result = await executeFrontendMutation(boundary, {
    simulate: () => ({ id: 'must-not-run' }),
  });

  assert.equal(boundary.state, 'BACKEND_REQUIRED');
  assert.equal(result.kind, 'BLOCKED');
});

test('only a real request can produce a persisted server success', async () => {
  const boundary = getFrontendModuleBoundary('APPROVAL', {
    mode: 'API_SANDBOX',
    adapterReady: true,
  });

  const result = await executeFrontendMutation(boundary, {
    simulate: () => ({ id: 'demo' }),
    request: async () => ({ id: 'approval-1' }),
  });

  assert.equal(boundary.state, 'SERVER_READY');
  assert.equal(result.kind, 'SUCCESS');
  assert.equal(result.persisted, true);
  assert.deepEqual(result.data, { id: 'approval-1' });
});

test('core copy is available in Korean, Vietnamese, and English', () => {
  const ko = getFrontendModuleBoundary('AI_ASSISTANT', {
    mode: 'DEMO_LOCAL',
    locale: 'ko',
  });
  const vi = getFrontendModuleBoundary('AI_ASSISTANT', {
    mode: 'DEMO_LOCAL',
    locale: 'vi',
  });
  const en = getFrontendModuleBoundary('AI_ASSISTANT', {
    mode: 'DEMO_LOCAL',
    locale: 'en',
  });

  assert.match(ko.title, /AI/);
  assert.match(vi.message, /demo/);
  assert.match(en.message, /not saved to a server/);
});

test('every frontend handoff operation maps to the frozen OpenAPI contract', () => {
  const openApiRoot = path.join(process.cwd(), 'openapi');
  const files: string[] = [];
  const collect = (directory: string) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) collect(entryPath);
      if (entry.isFile() && /\.ya?ml$/i.test(entry.name)) files.push(entryPath);
    }
  };
  collect(openApiRoot);

  const operationIds = new Set<string>();
  const operationPattern = /"operationId"\s*:\s*"([^"]+)"/g;
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(operationPattern)) {
      operationIds.add(match[1]);
    }
  }

  for (const [module, operations] of Object.entries(OPENAPI_OPERATIONS)) {
    for (const operation of operations) {
      assert.equal(
        operationIds.has(operation),
        true,
        `${module} references an unknown OpenAPI operation: ${operation}`,
      );
    }
  }
});
