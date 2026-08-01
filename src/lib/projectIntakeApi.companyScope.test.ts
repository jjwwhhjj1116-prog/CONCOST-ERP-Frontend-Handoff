import assert from 'node:assert/strict';
import { after, beforeEach, test } from 'node:test';
import { projectIntakeApi } from './projectIntakeApi';
import { useProjectIntakeStore } from '@/store/projectIntakeStore';
import { useUiStore } from '@/store/uiStore';
import type { ProjectIntake } from '@/types/models';

const originalFetch = globalThis.fetch;
const originalRuntimeMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;

const response = (body: unknown) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});

beforeEach(() => {
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'API_SANDBOX';
  useUiStore.setState({ brandWorkspace: 'CON_COST' });
  useProjectIntakeStore.setState({
    intakes: [],
    scopeCompanyId: 'CON_COST',
    persistenceMode: 'CHECKING',
    loading: false,
    error: null,
  });
});

after(() => {
  globalThis.fetch = originalFetch;
  if (originalRuntimeMode === undefined) delete process.env.NEXT_PUBLIC_RUNTIME_MODE;
  else process.env.NEXT_PUBLIC_RUNTIME_MODE = originalRuntimeMode;
});

test('project intake read and mutation requests always include the selected company', async () => {
  const requests: Array<{ companyId: string; method: string }> = [];
  globalThis.fetch = async (_input, init) => {
    requests.push({
      companyId: new Headers(init?.headers).get('X-Company-Id') || '',
      method: init?.method || 'GET',
    });
    return response({});
  };

  await projectIntakeApi.list('CON_COST');
  await projectIntakeApi.get('VIET_QS', 'intake-1');
  await projectIntakeApi.save('CON_COST', 'intake-1', 1, {} as never);
  await projectIntakeApi.review('VIET_QS', 'intake-1', 1, {} as never, 'review');
  await projectIntakeApi.accept('CON_COST', 'intake-1', 1, 'accept');

  assert.deepEqual(requests, [
    { companyId: 'CON_COST', method: 'GET' },
    { companyId: 'VIET_QS', method: 'GET' },
    { companyId: 'CON_COST', method: 'PATCH' },
    { companyId: 'VIET_QS', method: 'POST' },
    { companyId: 'CON_COST', method: 'POST' },
  ]);
});

test('a late response from the previous company cannot replace the active intake scope', async () => {
  let resolveConCost: ((value: Response) => void) | undefined;
  const conCostRequest = new Promise<Response>((resolve) => {
    resolveConCost = resolve;
  });
  const conCostIntake = { id: 'intake-con-cost', updatedAt: '2026-07-24T00:00:00.000Z' } as ProjectIntake;
  const vietQsIntake = { id: 'intake-viet-qs', updatedAt: '2026-07-24T00:00:00.000Z' } as ProjectIntake;

  globalThis.fetch = async (_input, init) => {
    const companyId = new Headers(init?.headers).get('X-Company-Id');
    return companyId === 'CON_COST' ? conCostRequest : response([vietQsIntake]);
  };

  const actor = {
    id: 'person-company-scope',
    role: 'SUPER_ADMIN' as const,
    departmentId: 'department-company-scope',
  };
  const pendingConCostSync = useProjectIntakeStore.getState().sync(actor);

  useUiStore.setState({ brandWorkspace: 'VIET_QS' });
  await useProjectIntakeStore.getState().sync(actor);
  resolveConCost?.(response([conCostIntake]));
  await pendingConCostSync;

  assert.equal(useProjectIntakeStore.getState().scopeCompanyId, 'VIET_QS');
  assert.deepEqual(
    useProjectIntakeStore.getState().intakes.map((intake) => intake.id),
    ['intake-viet-qs'],
  );
});
