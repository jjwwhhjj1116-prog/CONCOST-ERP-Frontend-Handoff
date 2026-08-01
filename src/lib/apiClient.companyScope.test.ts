import assert from 'node:assert/strict';
import test from 'node:test';
import {
  apiClient,
  ApiClientError,
  getApiCompanyId,
  setApiCompanyId,
} from './apiClient';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' },
});

test('protected company, locale and request headers cannot be overridden', async () => {
  const originalFetch = globalThis.fetch;
  let captured = new Headers();
  globalThis.fetch = async (_input, init) => {
    captured = new Headers(init?.headers);
    return jsonResponse({ ok: true });
  };
  setApiCompanyId('CON_COST');
  try {
    await apiClient('/protected', {
      companyScope: 'required',
      headers: {
        'X-Company-Id': 'VIET_QS',
        'Accept-Language': 'vi',
        'X-Request-Id': 'caller-controlled',
      },
    });
    assert.equal(captured.get('X-Company-Id'), 'CON_COST');
    assert.equal(captured.get('Accept-Language'), 'ko');
    assert.notEqual(captured.get('X-Request-Id'), 'caller-controlled');
  } finally {
    setApiCompanyId(null);
    globalThis.fetch = originalFetch;
  }
});

test('required company requests fail before network access when no company is selected', async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return jsonResponse({});
  };
  setApiCompanyId(null);
  try {
    await assert.rejects(
      apiClient('/protected', { companyScope: 'required' }),
      (error: unknown) => error instanceof ApiClientError && error.code === 'COMPANY_REQUIRED',
    );
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('response from the previous company is rejected after workspace switching', async () => {
  const originalFetch = globalThis.fetch;
  let resolveFetch!: (response: Response) => void;
  globalThis.fetch = () => new Promise<Response>((resolve) => {
    resolveFetch = resolve;
  });
  setApiCompanyId('CON_COST');
  try {
    const request = apiClient('/projects', { companyScope: 'required' });
    setApiCompanyId('VIET_QS');
    resolveFetch(jsonResponse({ projects: ['old-company'] }));
    await assert.rejects(
      request,
      (error: unknown) => error instanceof ApiClientError && error.code === 'STALE_COMPANY_RESPONSE',
    );
    assert.equal(getApiCompanyId(), 'VIET_QS');
  } finally {
    setApiCompanyId(null);
    globalThis.fetch = originalFetch;
  }
});
