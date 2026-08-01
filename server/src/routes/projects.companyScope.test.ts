import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { prisma } from '../lib/db';
import projectRoutes from './projects';

type ProjectRow = {
  id: string;
  companyId: 'CON_COST' | 'VIET_QS';
  name: string;
  status: string;
  managerId: string;
  pmId: string;
  orderIndex: number;
};

const rows: ProjectRow[] = [
  { id: 'con-1', companyId: 'CON_COST', name: 'CON Project', status: 'IN_PROGRESS', managerId: 'manager-con', pmId: 'pm-con', orderIndex: 1 },
  { id: 'con-2', companyId: 'CON_COST', name: 'CON Done', status: 'DONE', managerId: 'manager-con', pmId: 'pm-con-2', orderIndex: 2 },
  { id: 'viet-1', companyId: 'VIET_QS', name: 'Viet Project', status: 'IN_PROGRESS', managerId: 'manager-viet', pmId: 'pm-viet', orderIndex: 1 },
];

const db = prisma as unknown as Record<string, any>;
const originalDelegates: Record<string, unknown> = {};
let activeRole = 'SUPER_ADMIN';
let activeCompanyId = 'CON_COST';
let capturedFindMany: Record<string, any> | null = null;
let capturedCountWhere: Record<string, any> | null = null;
let server: ReturnType<ReturnType<typeof express>['listen']>;
let baseUrl = '';

const request = (path: string, companyId?: string) =>
  fetch(`${baseUrl}${path}`, {
    headers: {
      Cookie: 'sid=project-company-session',
      ...(companyId ? { 'X-Company-Id': companyId } : {}),
    },
  });

const filterRows = (where: Record<string, any>) => rows.filter((row) => {
  if (where.companyId && row.companyId !== where.companyId) return false;
  if (where.status && row.status !== where.status) return false;
  if (where.managerId && row.managerId !== where.managerId) return false;
  if (where.pmId && row.pmId !== where.pmId) return false;
  return true;
});

before(async () => {
  for (const key of ['session', 'accountUser', 'project']) {
    originalDelegates[key] = db[key];
  }

  db.session = {
    findUnique: async () => ({
      id: 'project-company-session-id',
      sid: 'project-company-session',
      data: JSON.stringify({ accountId: 'project-account', sessionVersion: 1 }),
      expiresAt: new Date(Date.now() + 60_000),
    }),
    delete: async () => undefined,
  };
  db.accountUser = {
    findUnique: async () => ({
      id: 'project-account',
      email: 'masked@example.invalid',
      personnelId: 'project-person',
      status: 'ACTIVE',
      sessionVersion: 1,
      personnel: {
        id: 'project-person',
        role: activeRole,
        departmentId: 'department-con',
        companyId: activeCompanyId,
      },
    }),
  };
  db.project = {
    findMany: async (args: Record<string, any>) => {
      capturedFindMany = args;
      const filtered = filterRows(args.where);
      return args.take === undefined
        ? filtered
        : filtered.slice(args.skip || 0, (args.skip || 0) + args.take);
    },
    count: async ({ where }: { where: Record<string, any> }) => {
      capturedCountWhere = where;
      return filterRows(where).length;
    },
    groupBy: async ({ where }: { where: Record<string, any> }) => {
      const counts = new Map<string, number>();
      filterRows(where).forEach((row) => counts.set(row.status, (counts.get(row.status) || 0) + 1));
      return [...counts].map(([status, count]) => ({ status, _count: { _all: count } }));
    },
    findUnique: async ({ where }: { where: { id: string } }) =>
      rows.find((row) => row.id === where.id) || null,
  };

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/projects', projectRoutes);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(() => {
  activeRole = 'SUPER_ADMIN';
  activeCompanyId = 'CON_COST';
  capturedFindMany = null;
  capturedCountWhere = null;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  for (const [key, value] of Object.entries(originalDelegates)) db[key] = value;
});

describe('project query company isolation', () => {
  it('returns only CON-COST projects for CON-COST', async () => {
    const response = await request('/api/projects', 'CON_COST');
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json() as ProjectRow[]).map((row) => row.id), ['con-1', 'con-2']);
    assert.equal(capturedFindMany?.where.companyId, 'CON_COST');
  });

  it('returns only Viet QS projects for Viet QS', async () => {
    const response = await request('/api/projects', 'VIET_QS');
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json() as ProjectRow[]).map((row) => row.id), ['viet-1']);
    assert.equal(capturedFindMany?.where.companyId, 'VIET_QS');
  });

  it('keeps dual-company administrator selections separate', async () => {
    const conCost = await request('/api/projects', 'CON_COST');
    const vietQs = await request('/api/projects', 'VIET_QS');
    assert.deepEqual((await conCost.json() as ProjectRow[]).map((row) => row.companyId), ['CON_COST', 'CON_COST']);
    assert.deepEqual((await vietQs.json() as ProjectRow[]).map((row) => row.companyId), ['VIET_QS']);
  });

  it('rejects missing and unauthorized company scopes', async () => {
    assert.equal((await request('/api/projects')).status, 400);
    activeRole = 'PM';
    activeCompanyId = 'CON_COST';
    assert.equal((await request('/api/projects', 'VIET_QS')).status, 403);
  });

  it('blocks direct access to another company project', async () => {
    assert.equal((await request('/api/projects/viet-1', 'CON_COST')).status, 403);
  });

  it('keeps company scope in pagination and status filters', async () => {
    const response = await request('/api/projects?status=IN_PROGRESS&page=1&pageSize=1', 'CON_COST');
    assert.equal(response.status, 200);
    const body = await response.json() as {
      items: ProjectRow[];
      pagination: { total: number; page: number; pageSize: number; totalPages: number };
    };
    assert.deepEqual(body.items.map((row) => row.id), ['con-1']);
    assert.deepEqual(body.pagination, { total: 1, page: 1, pageSize: 1, totalPages: 1 });
    assert.equal(capturedFindMany?.where.companyId, 'CON_COST');
    assert.equal(capturedCountWhere?.companyId, 'CON_COST');
  });

  it('keeps company scope in manager, assignee and organization filters', async () => {
    const response = await request(
      '/api/projects?managerId=manager-con&assigneeId=worker-con&organizationId=department-con',
      'CON_COST',
    );
    assert.equal(response.status, 200);
    assert.equal(capturedFindMany?.where.companyId, 'CON_COST');
    assert.equal(capturedFindMany?.where.managerId, 'manager-con');
    assert.deepEqual(capturedFindMany?.where.tasks, { some: { assigneeId: 'worker-con' } });
    assert.ok(Array.isArray(capturedFindMany?.where.AND));
  });

  it('keeps company scope in project statistics', async () => {
    const response = await request('/api/projects/stats', 'VIET_QS');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { total: 1, byStatus: { IN_PROGRESS: 1 } });
    assert.equal(capturedCountWhere?.companyId, 'VIET_QS');
  });
});
