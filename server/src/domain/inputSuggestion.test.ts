import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isSuggestionFieldAllowed,
  normalizeSuggestionValue,
  rankSuggestion,
  resolveSuggestionCompanyScope,
  suggestionScopeIdentity,
} from './inputSuggestion';

describe('input suggestion domain', () => {
  it('normalizes whitespace and case', () => {
    assert.equal(normalizeSuggestionValue('  CON COST   Project  '), 'con cost project');
  });

  it('blocks sensitive fields', () => {
    for (const field of ['password', 'contactEmail', 'mobilePhone', 'requestMemo', 'apiToken']) {
      assert.equal(isSuggestionFieldAllowed(field), false, field);
    }
    assert.equal(isSuggestionFieldAllowed('projectName'), true);
    assert.equal(isSuggestionFieldAllowed('businessType'), true);
  });

  it('boosts personal frequency and recency', () => {
    const now = new Date('2026-07-23T00:00:00.000Z');
    const personal = rankSuggestion({ value: 'A', usageCount: 2, userUsageCount: 3, lastUsedAt: now }, now);
    const global = rankSuggestion({ value: 'B', usageCount: 8, userUsageCount: 0, lastUsedAt: new Date('2026-06-01T00:00:00.000Z') }, now);
    assert.ok(personal > global);
  });

  it('uses the selected CON-COST workspace', () => {
    assert.deepEqual(
      resolveSuggestionCompanyScope({ selectedCompanyId: 'CON_COST', allowedCompanyIds: ['CON_COST'] }),
      { ok: true, companyId: 'CON_COST' },
    );
  });

  it('uses the selected Viet QS workspace', () => {
    assert.deepEqual(
      resolveSuggestionCompanyScope({ selectedCompanyId: 'VIET_QS', allowedCompanyIds: ['VIET_QS'] }),
      { ok: true, companyId: 'VIET_QS' },
    );
  });

  it('keeps dual-company selections explicit', () => {
    const allowedCompanyIds = ['CON_COST', 'VIET_QS'] as const;
    assert.equal(resolveSuggestionCompanyScope({ selectedCompanyId: 'CON_COST', allowedCompanyIds }).ok, true);
    assert.equal(resolveSuggestionCompanyScope({ selectedCompanyId: 'VIET_QS', allowedCompanyIds }).ok, true);
  });

  it('rejects a company outside the allowed scope', () => {
    assert.deepEqual(
      resolveSuggestionCompanyScope({ selectedCompanyId: 'VIET_QS', allowedCompanyIds: ['CON_COST'] }),
      { ok: false, status: 403, error: 'Forbidden: Company workspace access denied.' },
    );
  });

  it('requires an explicit selected company', () => {
    assert.deepEqual(
      resolveSuggestionCompanyScope({ allowedCompanyIds: ['CON_COST'] }),
      { ok: false, status: 400, error: 'Selected company scope is required.' },
    );
  });

  it('separates equal values by company', () => {
    const normalized = normalizeSuggestionValue('Structure Review');
    const conCost = suggestionScopeIdentity('CON_COST', 'project-intake', 'projectName', normalized);
    const vietQs = suggestionScopeIdentity('VIET_QS', 'project-intake', 'projectName', normalized);
    assert.notEqual(conCost, vietQs);
  });

  it('deduplicates only within the same company identity', () => {
    const normalized = normalizeSuggestionValue('Structure Review');
    const first = suggestionScopeIdentity('CON_COST', 'project-intake', 'projectName', normalized);
    const duplicate = suggestionScopeIdentity('CON_COST', 'project-intake', 'projectName', normalized);
    const otherCompany = suggestionScopeIdentity('VIET_QS', 'project-intake', 'projectName', normalized);
    assert.equal(first, duplicate);
    assert.notEqual(first, otherCompany);
  });
});
