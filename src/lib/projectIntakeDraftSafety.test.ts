import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { useProjectIntakeStore } from '@/store/projectIntakeStore';

describe('project intake estimate-origin queue safety', () => {
  it('does not expose standalone create, duplicate, delete, or discard commands', () => {
    const state = useProjectIntakeStore.getState() as unknown as Record<string, unknown>;
    assert.equal(state.createDraft, undefined);
    assert.equal(state.duplicateDraft, undefined);
    assert.equal(state.deleteDraft, undefined);
    assert.equal(state.discardDraft, undefined);
  });
});
