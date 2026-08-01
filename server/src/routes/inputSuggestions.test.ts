import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import cookieParser from 'cookie-parser';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { prisma } from '../lib/db';
import inputSuggestionRoutes from './inputSuggestions';

type StoredSuggestion = {
  id: string;
  companyId: string;
  moduleKey: string;
  fieldKey: string;
  normalizedValue: string;
  displayValue: string;
  isActive: boolean;
  usageCount: number;
  lastUsedAt: Date;
};

const db = prisma as unknown as Record<string, any>;
const originalDelegates: Record<string, unknown> = {};
const suggestions = new Map<string, StoredSuggestion>();
const uses = new Map<string, number>();
const audits: Array<{ action: string; details?: string | null }> = [];
let activeRole = 'SUPER_ADMIN';
let activeCompanyId = 'CON_COST';
let server: ReturnType<ReturnType<typeof express>['listen']>;
let baseUrl = '';

const suggestionKey = (value: {
  companyId: string;
  moduleKey: string;
  fieldKey: string;
  normalizedValue: string;
}) => [value.companyId, value.moduleKey, value.fieldKey, value.normalizedValue].join('\u0000');

const request = (path: string, init: RequestInit = {}) =>
  fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Cookie: 'sid=test-session',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

before(async () => {
  for (const key of ['session', 'accountUser', 'inputSuggestion', 'inputSuggestionUse', 'auditLog', '$transaction']) {
    originalDelegates[key] = db[key];
  }

  db.session = {
    findUnique: async () => ({
      id: 'session-1',
      sid: 'test-session',
      data: JSON.stringify({ accountId: 'account-1', sessionVersion: 1 }),
      expiresAt: new Date(Date.now() + 60_000),
    }),
    delete: async () => undefined,
  };
  db.accountUser = {
    findUnique: async () => ({
      id: 'account-1',
      email: 'masked@example.invalid',
      personnelId: 'person-1',
      status: 'ACTIVE',
      sessionVersion: 1,
      personnel: {
        id: 'person-1',
        role: activeRole,
        departmentId: 'department-1',
        companyId: activeCompanyId,
      },
    }),
  };

  const inputSuggestion = {
    findMany: async ({ where }: any) => [...suggestions.values()]
      .filter((item) => item.companyId === where.companyId)
      .filter((item) => !where.moduleKey || item.moduleKey === where.moduleKey)
      .filter((item) => !where.fieldKey || item.fieldKey === where.fieldKey)
      .filter((item) => where.isActive === undefined || item.isActive === where.isActive)
      .map((item) => ({
        ...item,
        uses: [{ usageCount: uses.get(`${item.id}\u0000person-1`) || 0 }],
      })),
    findFirst: async ({ where }: any) => [...suggestions.values()]
      .find((item) => item.id === where.id && item.companyId === where.companyId) || null,
    upsert: async ({ where, create, update }: any) => {
      const identity = where.companyId_moduleKey_fieldKey_normalizedValue;
      const key = suggestionKey(identity);
      const existing = suggestions.get(key);
      if (existing) {
        existing.displayValue = update.displayValue;
        existing.isActive = update.isActive;
        existing.usageCount += update.usageCount.increment;
        existing.lastUsedAt = update.lastUsedAt;
        return existing;
      }
      const created: StoredSuggestion = {
        id: `suggestion-${suggestions.size + 1}`,
        ...create,
        isActive: true,
        usageCount: 1,
        lastUsedAt: new Date(),
      };
      suggestions.set(key, created);
      return created;
    },
    update: async ({ where, data }: any) => {
      const item = [...suggestions.values()].find((candidate) => candidate.id === where.id);
      if (!item) throw new Error('NOT_FOUND');
      Object.assign(item, data);
      return item;
    },
    delete: async ({ where }: any) => {
      const entry = [...suggestions.entries()].find(([, item]) => item.id === where.id);
      if (!entry) throw new Error('NOT_FOUND');
      suggestions.delete(entry[0]);
      return entry[1];
    },
  };
  const inputSuggestionUse = {
    upsert: async ({ where, create, update }: any) => {
      const identity = where.suggestionId_userId;
      const key = `${identity.suggestionId}\u0000${identity.userId}`;
      uses.set(key, (uses.get(key) || 0) + (update?.usageCount?.increment || create?.usageCount || 1));
      return { id: key };
    },
  };
  const auditLog = {
    create: async ({ data }: any) => {
      audits.push(data);
      return { id: `audit-${audits.length}`, ...data };
    },
  };
  db.inputSuggestion = inputSuggestion;
  db.inputSuggestionUse = inputSuggestionUse;
  db.auditLog = auditLog;
  db.$transaction = async (callback: (tx: any) => unknown) => callback({
    inputSuggestion,
    inputSuggestionUse,
    auditLog,
  });

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/input-suggestions', inputSuggestionRoutes);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  for (const [key, value] of Object.entries(originalDelegates)) db[key] = value;
});

describe('input suggestion route company isolation', () => {
  it('rejects missing and unauthorized company scopes', async () => {
    activeRole = 'WORKER';
    activeCompanyId = 'CON_COST';

    const missing = await request('/api/input-suggestions?module=project-intake&field=projectName');
    assert.equal(missing.status, 400);

    const forbidden = await request('/api/input-suggestions?module=project-intake&field=projectName', {
      headers: { 'X-Company-Id': 'VIET_QS' },
    });
    assert.equal(forbidden.status, 403);
  });

  it('stores, ranks and reads equal values independently by selected company', async () => {
    activeRole = 'SUPER_ADMIN';
    const body = JSON.stringify({
      module: 'project-intake',
      field: 'projectName',
      value: 'Structure Review',
    });

    for (const companyId of ['CON_COST', 'CON_COST', 'VIET_QS']) {
      const response = await request('/api/input-suggestions', {
        method: 'POST',
        headers: { 'X-Company-Id': companyId },
        body,
      });
      assert.equal(response.status, 201);
    }

    const conCost = await request('/api/input-suggestions?module=project-intake&field=projectName', {
      headers: { 'X-Company-Id': 'CON_COST' },
    });
    const vietQs = await request('/api/input-suggestions?module=project-intake&field=projectName', {
      headers: { 'X-Company-Id': 'VIET_QS' },
    });
    const conCostItems = await conCost.json() as Array<{ id: string; usageCount: number }>;
    const vietQsItems = await vietQs.json() as Array<{ id: string; usageCount: number }>;

    assert.equal(conCostItems.length, 1);
    assert.equal(vietQsItems.length, 1);
    assert.notEqual(conCostItems[0].id, vietQsItems[0].id);
    assert.equal(conCostItems[0].usageCount, 2);
    assert.equal(vietQsItems[0].usageCount, 1);
  });

  it('scopes administrator reads and deletes to the selected company', async () => {
    const conCostAdmin = await request('/api/input-suggestions/admin', {
      headers: { 'X-Company-Id': 'CON_COST' },
    });
    const conCostItems = await conCostAdmin.json() as StoredSuggestion[];
    assert.equal(conCostItems.length, 1);

    const wrongCompanyDelete = await request(`/api/input-suggestions/admin/${conCostItems[0].id}`, {
      method: 'DELETE',
      headers: { 'X-Company-Id': 'VIET_QS' },
    });
    assert.equal(wrongCompanyDelete.status, 404);

    const deleteResponse = await request(`/api/input-suggestions/admin/${conCostItems[0].id}`, {
      method: 'DELETE',
      headers: { 'X-Company-Id': 'CON_COST' },
    });
    assert.equal(deleteResponse.status, 204);
  });

  it('records the selected company in every write audit', () => {
    assert.ok(audits.length >= 4);
    const auditedCompanies = audits.map((audit) => JSON.parse(audit.details || '{}').companyId);
    assert.ok(auditedCompanies.every((companyId) => companyId === 'CON_COST' || companyId === 'VIET_QS'));
    assert.ok(auditedCompanies.includes('CON_COST'));
    assert.ok(auditedCompanies.includes('VIET_QS'));
  });
});
