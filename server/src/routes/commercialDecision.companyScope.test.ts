import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { prisma } from '../lib/db';
import estimateRequestRoutes from './estimateRequests';

const db = prisma as unknown as Record<string, any>;
const originalDelegates: Record<string, unknown> = {};
let server: ReturnType<ReturnType<typeof express>['listen']>;
let baseUrl = '';
let requestCompanyId: string | null = 'VIET_QS';
let ownerCompanyId: string | null = 'VIET_QS';
let createdProjectCompanyId: string | null = null;
let existingDecisionCompanyId: string | null = null;
let createdEstimateCompanyId: string | null = null;

const currentRequest = () => ({
  id: 'estimate-1',
  companyId: requestCompanyId,
  requestNo: 'ER-TEST-1',
  status: 'SENT',
  projectName: 'Scoped conversion',
  company: 'Client company',
  client: 'Client',
  ownerId: 'owner-1',
  departmentId: 'department-viet',
  requestDate: new Date('2026-07-24T00:00:00.000Z'),
  projectId: null,
  version: 1,
  owner: null,
  project: null,
  activities: [],
  attachments: [],
  histories: [],
  commercialDecisions: [],
  projectIntake: null,
  estimateSheet: {
    id: 'sheet-1',
    submissions: [{
      id: 'submission-1',
      status: 'SENT',
      sentAt: new Date('2026-07-24T00:00:00.000Z'),
      documentHash: 'document-hash',
    }],
  },
});

const postDecision = (companyId?: string) =>
  fetch(`${baseUrl}/api/estimate-requests/estimate-1/decision`, {
    method: 'POST',
    headers: {
      Cookie: 'sid=commercial-company-session',
      'Content-Type': 'application/json',
      'Idempotency-Key': 'decision-key',
      ...(companyId ? { 'X-Company-Id': companyId } : {}),
    },
    body: JSON.stringify({ decision: 'WON', expectedVersion: 1 }),
  });

before(async () => {
  for (const key of [
    'session',
    'accountUser',
    'estimateRequest',
    'commercialDecision',
    'projectIntake',
    'personnelCard',
    '$transaction',
  ]) {
    originalDelegates[key] = db[key];
  }

  db.session = {
    findUnique: async () => ({
      id: 'session-id',
      sid: 'commercial-company-session',
      data: JSON.stringify({ accountId: 'account-1', sessionVersion: 1 }),
      expiresAt: new Date(Date.now() + 60_000),
    }),
    delete: async () => undefined,
  };
  db.accountUser = {
    findUnique: async () => ({
      id: 'account-1',
      email: 'masked@example.invalid',
      personnelId: 'actor-1',
      status: 'ACTIVE',
      sessionVersion: 1,
      personnel: {
        id: 'actor-1',
        role: 'SUPER_ADMIN',
        departmentId: 'department-viet',
        companyId: 'CON_COST',
      },
    }),
  };

  const tx = {
    estimateRequest: {
      findUnique: async () => currentRequest(),
      create: async ({ data }: { data: Record<string, any> }) => {
        createdEstimateCompanyId = data.companyId;
        return { id: 'created-estimate', ...data, version: 1 };
      },
      findUniqueOrThrow: async () => ({
        ...currentRequest(),
        id: 'created-estimate',
        companyId: createdEstimateCompanyId,
      }),
      updateMany: async () => ({ count: 1 }),
    },
    personnelCard: {
      findUnique: async () => ({ id: 'owner-1', companyId: ownerCompanyId }),
    },
    project: {
      aggregate: async () => ({ _max: { orderIndex: 0 } }),
      create: async ({ data }: { data: Record<string, any> }) => {
        createdProjectCompanyId = data.companyId;
        return { id: 'project-1', ...data };
      },
    },
    commercialDecision: {
      create: async ({ data }: { data: Record<string, any> }) => ({
        ...data,
        agreedAmount: null,
      }),
    },
    projectIntake: {
      create: async ({ data }: { data: Record<string, any> }) => ({ id: 'intake-1', ...data }),
    },
    estimateRequestHistory: { create: async () => ({}) },
    auditLog: { create: async () => ({}) },
  };

  db.estimateRequest = {
    findUnique: async ({ where }: { where: Record<string, unknown> }) =>
      where.idempotencyKey ? null : currentRequest(),
    findUniqueOrThrow: async ({ where }: { where: { id: string } }) =>
      where.id === 'created-estimate'
        ? { ...currentRequest(), id: 'created-estimate', companyId: createdEstimateCompanyId }
        : currentRequest(),
  };
  db.personnelCard = {
    findUnique: async () => ({ id: 'owner-1', role: 'PM', departmentId: 'department-viet', companyId: ownerCompanyId }),
  };
  db.commercialDecision = {
    findUnique: async () => existingDecisionCompanyId
      ? {
        id: 'existing-decision',
        estimateRequestId: 'estimate-1',
        companyId: existingDecisionCompanyId,
      }
      : null,
    findUniqueOrThrow: async () => ({
      id: 'decision-1',
      estimateRequestId: 'estimate-1',
      companyId: requestCompanyId,
      agreedAmount: null,
      project: { id: 'project-1', companyId: requestCompanyId },
    }),
  };
  db.projectIntake = { findUnique: async () => ({ id: 'intake-1' }) };
  db.$transaction = async (operation: (client: typeof tx) => unknown) => operation(tx);

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/estimate-requests', estimateRequestRoutes);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

beforeEach(() => {
  requestCompanyId = 'VIET_QS';
  ownerCompanyId = 'VIET_QS';
  createdProjectCompanyId = null;
  existingDecisionCompanyId = null;
  createdEstimateCompanyId = null;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  for (const [key, value] of Object.entries(originalDelegates)) db[key] = value;
});

describe('commercial decision company scope', () => {
  it('stores the selected company on a new estimate request', async () => {
    const response = await fetch(`${baseUrl}/api/estimate-requests`, {
      method: 'POST',
      headers: {
        Cookie: 'sid=commercial-company-session',
        'Content-Type': 'application/json',
        'Idempotency-Key': 'estimate-key',
        'X-Company-Id': 'VIET_QS',
      },
      body: JSON.stringify({
        projectName: 'Viet estimate',
        departmentId: 'department-viet',
        ownerId: 'owner-1',
      }),
    });
    assert.equal(response.status, 201);
    assert.equal(createdEstimateCompanyId, 'VIET_QS');
  });

  it('requires an explicit selected company', async () => {
    assert.equal((await postDecision()).status, 400);
  });

  it('creates the project with the selected company rather than the owner as source', async () => {
    const response = await postDecision('VIET_QS');
    assert.equal(response.status, 201);
    assert.equal(createdProjectCompanyId, 'VIET_QS');
  });

  it('rejects estimate and selected company mismatches', async () => {
    assert.equal((await postDecision('CON_COST')).status, 409);
    assert.equal(createdProjectCompanyId, null);
  });

  it('rejects owner company mismatches and null fallback candidates', async () => {
    ownerCompanyId = 'CON_COST';
    assert.equal((await postDecision('VIET_QS')).status, 409);
    ownerCompanyId = null;
    assert.equal((await postDecision('VIET_QS')).status, 409);
    assert.equal(createdProjectCompanyId, null);
  });

  it('rejects an idempotent decision from another company', async () => {
    existingDecisionCompanyId = 'CON_COST';
    assert.equal((await postDecision('VIET_QS')).status, 409);
  });
});
