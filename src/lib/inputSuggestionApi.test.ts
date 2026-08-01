import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { CompanyId } from '@/types/models';
import { inputSuggestionApi } from './inputSuggestionApi';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('input suggestion API company scope', () => {
  it('sends the selected company explicitly for KR -> VI -> KR requests', async () => {
    const requestedCompanies: string[] = [];
    globalThis.fetch = async (_input, init) => {
      requestedCompanies.push(new Headers(init?.headers).get('x-company-id') || '');
      return new Response('[]', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await inputSuggestionApi.search('CON_COST', 'project-intake', 'projectName', '');
    await inputSuggestionApi.search('VIET_QS', 'project-intake', 'projectName', '');
    await inputSuggestionApi.search('CON_COST', 'project-intake', 'projectName', '');

    assert.deepEqual(requestedCompanies, ['CON_COST', 'VIET_QS', 'CON_COST']);
  });

  it('sends the selected company explicitly when recording a value', async () => {
    let requestedCompany = '';
    globalThis.fetch = async (_input, init) => {
      requestedCompany = new Headers(init?.headers).get('x-company-id') || '';
      return new Response(JSON.stringify({ id: 'suggestion-1', value: 'Structure Review' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    };

    await inputSuggestionApi.record('VIET_QS', 'project-intake', 'projectName', 'Structure Review');

    assert.equal(requestedCompany, 'VIET_QS');
  });

  it('does not silently fall back for an invalid company', () => {
    assert.throws(
      () => inputSuggestionApi.search('UNKNOWN' as CompanyId, 'project-intake', 'projectName', ''),
      /valid selected company/i,
    );
  });
});
