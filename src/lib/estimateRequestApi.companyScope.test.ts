import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { estimateRequestApi } from './estimateRequestApi';
import { useUiStore } from '@/store/uiStore';

const originalFetch = globalThis.fetch;
const capturedCompanies: string[] = [];

beforeEach(() => {
  capturedCompanies.length = 0;
  globalThis.fetch = async (_input, init) => {
    capturedCompanies.push(new Headers(init?.headers).get('X-Company-Id') || '');
    return new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
});

after(() => {
  globalThis.fetch = originalFetch;
});

test('estimate request create and decision requests follow KR -> VI -> KR workspace changes', async () => {
  useUiStore.setState({ brandWorkspace: 'CON_COST' });
  await estimateRequestApi.create({ projectName: 'CON request', departmentId: 'department-con' });

  useUiStore.setState({ brandWorkspace: 'VIET_QS' });
  await estimateRequestApi.decide('estimate-viet', 1, { decision: 'WON' });

  useUiStore.setState({ brandWorkspace: 'CON_COST' });
  await estimateRequestApi.list();

  assert.deepEqual(capturedCompanies, ['CON_COST', 'VIET_QS', 'CON_COST']);
});
