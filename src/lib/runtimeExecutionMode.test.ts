import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getApprovalBoundary,
  getMailSendBoundary,
  getProjectIntakePersistenceMode,
  getRuntimeExecutionMode,
} from './runtimeExecutionMode';

const withEnv = async (
  values: Record<string, string | undefined>,
  run: () => void | Promise<void>,
) => {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
  try {
    await run();
  } finally {
    Object.entries(previous).forEach(([key, value]) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    });
  }
};

test('runtime mode ignores URL and browser storage and uses the build-time mode', async () => {
  await withEnv({ NEXT_PUBLIC_RUNTIME_MODE: 'API_SANDBOX' }, () => {
    assert.equal(getRuntimeExecutionMode(), 'API_SANDBOX');
  });
});

test('mail never reports a real send without a backend response', () => {
  assert.equal(getMailSendBoundary('DEMO_LOCAL').kind, 'DEMO_SIMULATION');
  assert.equal(getMailSendBoundary('API_SANDBOX', false).kind, 'BLOCKED');
  assert.equal(getMailSendBoundary('PRODUCTION_SERVER', true).kind, 'BLOCKED');
});

test('approval never mutates official state from the local UI boundary', () => {
  assert.equal(getApprovalBoundary('DEMO_LOCAL').kind, 'DEMO_SIMULATION');
  assert.equal(getApprovalBoundary('API_SANDBOX', false, false).kind, 'BLOCKED');
  assert.equal(getApprovalBoundary('PRODUCTION_SERVER', true, true).kind, 'BLOCKED');
});

test('project intake uses local persistence only in explicit demo mode', () => {
  assert.equal(getProjectIntakePersistenceMode('DEMO_LOCAL'), 'LOCAL_DEMO');
  assert.equal(getProjectIntakePersistenceMode('API_SANDBOX'), 'SERVER');
  assert.equal(getProjectIntakePersistenceMode('PRODUCTION_SERVER'), 'SERVER');
});
