import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { prisma } from '../lib/db';
import projectIntakeRoutes from './projectIntakes';

const db = prisma as unknown as Record<string, any>;
const originalDelegates: Record<string, unknown> = {};
let listWhere: Record<string, unknown> | null = null;
let server: ReturnType<ReturnType<typeof express>['listen']>;
let baseUrl = '';
let activeRole = 'SUPER_ADMIN';
let activeCompanyId = 'CON_COST';

const request = (path: string, companyId?: 'CON_COST' | 'VIET_QS') =>
  fetch(`${baseUrl}${path}`, {
    headers: {
      Cookie: 'sid=f03-session',
      ...(companyId ? { 'X-Company-Id': companyId } : {}),
    },
  });

before(async () => {
  for (const key of ['session', 'accountUser', 'projectIntake']) {
    originalDelegates[key] = db[key];
  }

  db.session = {
    findUnique: async () => ({
      id: 'session-f03',
      sid: 'f03-session',
      data: JSON.stringify({
        accountId: 'account-f03',
        sessionVersion: 1,
        selectedCompanyId: 'CON_COST',
      }),
      expiresAt: new Date(Date.now() + 60_000),
    }),
    delete: async () => undefined,
  };
  db.accountUser = {
    findUnique: async () => ({
      id: 'account-f03',
      email: 'masked@example.invalid',
      personnelId: 'person-f03',
      status: 'ACTIVE',
      sessionVersion: 1,
      personnel: {
        id: 'person-f03',
        role: activeRole,
        departmentId: 'department-f03',
        companyId: activeCompanyId,
      },
    }),
  };
  db.projectIntake = {
    findMany: async ({ where }: { where: Record<string, unknown> }) => {
      listWhere = where;
      return [];
    },
    findUnique: async ({ where }: { where: { id: string } }) => ({
      id: where.id,
      estimateRequest: {
        ownerId: 'person-f03',
        departmentId: 'department-f03',
      },
      project: {
        companyId: 'VIET_QS',
      },
    }),
  };

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/project-intakes', projectIntakeRoutes);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  for (const [key, value] of Object.entries(originalDelegates)) db[key] = value;
});

beforeEach(() => {
  activeRole = 'SUPER_ADMIN';
  activeCompanyId = 'CON_COST';
});

describe('project intake route company isolation', () => {
  it('rejects missing and unauthorized selected companies before loading data', async () => {
    assert.equal((await request('/api/project-intakes')).status, 400);
    activeRole = 'PM';
    assert.equal((await request('/api/project-intakes', 'VIET_QS')).status, 403);
  });

  it('limits list queries to the selected company project relation', async () => {
    const response = await request('/api/project-intakes', 'CON_COST');
    assert.equal(response.status, 200);
    assert.deepEqual(listWhere, {
      project: { companyId: 'CON_COST' },
    });
  });

  it('returns 403 for an intake linked to another company', async () => {
    const response = await request('/api/project-intakes/foreign-intake', 'CON_COST');
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), {
      error: 'Forbidden: project intake is outside the selected company',
    });
  });
});
