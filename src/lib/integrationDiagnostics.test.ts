import assert from 'node:assert/strict';
import test from 'node:test';

import {
  apiClient,
  getLastApiRequestDiagnostic,
  setApiCompanyId,
} from './apiClient';
import {
  buildCapabilityRegistry,
  buildIntegrationDiagnosticsSnapshot,
  buildSmokeMilestones,
  canAccessIntegrationDiagnostics,
  redactDiagnosticRecord,
  sanitizeApiBase,
  type IntegrationEnvironment,
} from './integrationDiagnostics';

const environment = (
  values: Partial<IntegrationEnvironment> = {},
): IntegrationEnvironment => ({
  mode: 'API_SANDBOX',
  apiBaseUrl: 'https://api.example.invalid/api',
  authAdapterReady: false,
  projectAdapterReady: false,
  driveAdapterReady: false,
  driveProviderReady: false,
  approvalAdapterReady: false,
  approvalProviderReady: false,
  mailAdapterReady: false,
  mailProviderReady: false,
  businessCardAdapterReady: false,
  businessCardProviderReady: false,
  salesAdapterReady: false,
  financeAdapterReady: false,
  claimAdapterReady: false,
  aiAdapterReady: false,
  aiProviderReady: false,
  projectHealth: 'HEALTHY',
  collaborationHealth: 'HEALTHY',
  businessHealth: 'HEALTHY',
  claimAiHealth: 'HEALTHY',
  ...values,
});

test('capability registry uses only the frozen six integration states', () => {
  const allowed = new Set([
    'DEMO_SIMULATED',
    'BACKEND_REQUIRED',
    'PROVIDER_NOT_CONFIGURED',
    'READY',
    'DEGRADED',
    'ERROR',
  ]);
  const states = [
    ...buildCapabilityRegistry(environment({ mode: 'DEMO_LOCAL' })),
    ...buildCapabilityRegistry(environment()),
    ...buildCapabilityRegistry(environment({ projectAdapterReady: true, projectHealth: 'DEGRADED' })),
    ...buildCapabilityRegistry(environment({ projectHealth: 'ERROR' })),
  ].map((item) => item.state);

  assert.equal(states.every((state) => allowed.has(state)), true);
});

test('demo mode is simulated and never passes an API Sandbox milestone', () => {
  const capabilities = buildCapabilityRegistry(environment({
    mode: 'DEMO_LOCAL',
    authAdapterReady: true,
    projectAdapterReady: true,
    driveAdapterReady: true,
    driveProviderReady: true,
  }));
  assert.equal(capabilities.every((item) => item.state === 'DEMO_SIMULATED'), true);
  assert.equal(
    buildSmokeMilestones(capabilities, 'DEMO_LOCAL', { M0: 'PASS', M1: 'PASS' })
      .some((item) => item.status === 'PASS'),
    false,
  );
});

test('sandbox reports backend and provider blockers without demo fallback', () => {
  const capabilities = buildCapabilityRegistry(environment({
    driveAdapterReady: true,
    driveProviderReady: false,
  }));
  assert.equal(capabilities.find((item) => item.id === 'PROJECT_CORE')?.state, 'BACKEND_REQUIRED');
  assert.equal(capabilities.find((item) => item.id === 'FILE_DRIVE')?.state, 'PROVIDER_NOT_CONFIGURED');
  assert.equal(capabilities.some((item) => item.state === 'DEMO_SIMULATED'), false);
});

test('production never falls back to demo when adapters are missing', () => {
  const capabilities = buildCapabilityRegistry(environment({ mode: 'PRODUCTION_SERVER' }));
  assert.equal(capabilities.some((item) => item.state === 'DEMO_SIMULATED'), false);
  assert.equal(capabilities.find((item) => item.id === 'AUTH_COMPANY')?.state, 'BACKEND_REQUIRED');
});

test('a milestone passes only with ready capabilities and explicit probe evidence', () => {
  const capabilities = buildCapabilityRegistry(environment({
    projectAdapterReady: true,
  }));
  const withoutProbe = buildSmokeMilestones(capabilities, 'API_SANDBOX');
  const withProbe = buildSmokeMilestones(capabilities, 'API_SANDBOX', { M2: 'PASS' });
  assert.equal(withoutProbe.find((item) => item.id === 'M2')?.status, 'NOT_TESTED');
  assert.equal(withProbe.find((item) => item.id === 'M2')?.status, 'PASS');
});

test('API base diagnostics remove credentials, query and fragment', () => {
  assert.equal(
    sanitizeApiBase('https://demo:unsafe@api.example.invalid/v1?token=unsafe#fragment'),
    'https://api.example.invalid/v1',
  );
  assert.equal(sanitizeApiBase(undefined), 'NOT_CONFIGURED');
  assert.equal(sanitizeApiBase('not a url'), 'INVALID_CONFIGURATION');
});

test('diagnostic records redact secret-bearing keys', () => {
  assert.deepEqual(
    redactDiagnosticRecord({
      runtime: 'API_SANDBOX',
      token: 'unsafe',
      Cookie: 'unsafe',
      sessionState: 'AUTHENTICATED',
      passwordHint: 'unsafe',
    }),
    {
      runtime: 'API_SANDBOX',
      token: '[REDACTED]',
      Cookie: '[REDACTED]',
      sessionState: 'AUTHENTICATED',
      passwordHint: '[REDACTED]',
    },
  );
});

test('company diagnostics distinguish aligned, missing and mismatched scope', () => {
  const base = {
    environment: environment(),
    sessionState: 'AUTHENTICATED' as const,
    lastRequest: null,
  };
  assert.equal(buildIntegrationDiagnosticsSnapshot({ ...base, selectedCompanyId: 'CON_COST', apiCompanyId: 'CON_COST' }).companyScope, 'ALIGNED');
  assert.equal(buildIntegrationDiagnosticsSnapshot({ ...base, selectedCompanyId: null, apiCompanyId: 'CON_COST' }).companyScope, 'MISSING');
  assert.equal(buildIntegrationDiagnosticsSnapshot({ ...base, selectedCompanyId: 'CON_COST', apiCompanyId: 'VIET_QS' }).companyScope, 'MISMATCH');
});

test('integration diagnostics are restricted to workspace administrators', () => {
  assert.equal(canAccessIntegrationDiagnostics({ role: 'SYSTEM_ADMIN', accessGrade: 'ADMIN' }), true);
  assert.equal(canAccessIntegrationDiagnostics({ role: 'WORKER', accessGrade: 'GRADE_4' }), false);
});

test('apiClient publishes only safe request metadata for diagnostics', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  setApiCompanyId('CON_COST');
  try {
    await apiClient('/projects?search=sensitive', { companyScope: 'required' });
    const diagnostic = getLastApiRequestDiagnostic();
    assert.equal(diagnostic?.endpoint, '/projects');
    assert.equal(diagnostic?.companyId, 'CON_COST');
    assert.equal(diagnostic?.state, 'SUCCESS');
    assert.equal(diagnostic?.status, 200);
    assert.equal(JSON.stringify(diagnostic).includes('sensitive'), false);
  } finally {
    setApiCompanyId(null);
    globalThis.fetch = originalFetch;
  }
});
