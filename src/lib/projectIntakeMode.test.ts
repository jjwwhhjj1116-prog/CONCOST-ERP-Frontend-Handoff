import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveProjectIntakeSelection } from './projectIntakeMode';

describe('project intake create/edit selection', () => {
  it('starts CREATE empty when there are no records', () => {
    assert.deepEqual(resolveProjectIntakeSelection({
      mode: 'CREATE',
      availableIds: [],
    }), { selectedId: null, requestedIdMissing: false });
  });

  it('does not fall back to the first record in CREATE mode', () => {
    assert.deepEqual(resolveProjectIntakeSelection({
      mode: 'CREATE',
      availableIds: ['first-intake'],
    }), { selectedId: null, requestedIdMissing: false });
  });

  it('does not fall back when CREATE has several records', () => {
    assert.deepEqual(resolveProjectIntakeSelection({
      mode: 'CREATE',
      availableIds: ['first-intake', 'second-intake'],
    }), { selectedId: null, requestedIdMissing: false });
  });

  it('selects only the explicit newly-created draft id in CREATE mode', () => {
    assert.equal(resolveProjectIntakeSelection({
      mode: 'CREATE',
      createdDraftId: 'new-intake',
      selectedId: 'existing-intake',
      availableIds: ['existing-intake', 'new-intake'],
    }).selectedId, 'new-intake');
  });

  it('opens an explicit intake id in EDIT mode', () => {
    assert.equal(resolveProjectIntakeSelection({
      mode: 'EDIT',
      requestedIntakeId: 'second-intake',
      availableIds: ['first-intake', 'second-intake'],
    }).selectedId, 'second-intake');
  });

  it('reports a missing explicit intake id instead of falling back', () => {
    assert.deepEqual(resolveProjectIntakeSelection({
      mode: 'EDIT',
      requestedIntakeId: 'missing-intake',
      availableIds: ['first-intake'],
    }), { selectedId: null, requestedIdMissing: true });
  });

  it('does not select an id outside the current workspace pool', () => {
    assert.deepEqual(resolveProjectIntakeSelection({
      mode: 'EDIT',
      requestedIntakeId: 'viet-qs-intake',
      availableIds: ['con-cost-intake'],
    }), { selectedId: null, requestedIdMissing: true });
  });

  it('keeps CON-COST and Viet QS pools independent', () => {
    const conCost = resolveProjectIntakeSelection({
      mode: 'EDIT',
      requestedIntakeId: 'con-cost-intake',
      availableIds: ['con-cost-intake'],
    });
    const vietQs = resolveProjectIntakeSelection({
      mode: 'EDIT',
      requestedIntakeId: 'viet-qs-intake',
      availableIds: ['viet-qs-intake'],
    });
    assert.equal(conCost.selectedId, 'con-cost-intake');
    assert.equal(vietQs.selectedId, 'viet-qs-intake');
  });

  it('does not reuse the first record after a cancelled CREATE selection', () => {
    assert.equal(resolveProjectIntakeSelection({
      mode: 'CREATE',
      createdDraftId: '',
      selectedId: '',
      availableIds: ['existing-intake'],
    }).selectedId, null);
  });

  it('keeps a newly-created id selected when it appears in the pool', () => {
    assert.equal(resolveProjectIntakeSelection({
      mode: 'CREATE',
      createdDraftId: 'new-intake',
      availableIds: ['new-intake', 'existing-intake'],
    }).selectedId, 'new-intake');
  });

  it('rejects a generated draft id that collides outside the available pool', () => {
    assert.equal(resolveProjectIntakeSelection({
      mode: 'CREATE',
      createdDraftId: 'colliding-intake',
      availableIds: ['existing-intake'],
    }).selectedId, null);
  });

  it('does not treat a stale selected id as a CREATE draft after refresh', () => {
    assert.equal(resolveProjectIntakeSelection({
      mode: 'CREATE',
      selectedId: 'existing-intake',
      availableIds: ['existing-intake'],
    }).selectedId, null);
  });

  it('keeps LIST fallback behavior separate from CREATE', () => {
    assert.equal(resolveProjectIntakeSelection({
      mode: 'LIST',
      availableIds: ['first-intake', 'second-intake'],
      filteredIds: ['second-intake'],
    }).selectedId, 'second-intake');
  });

  it('never mutates or substitutes an existing first id during CREATE', () => {
    const ids = ['existing-first', 'existing-second'];
    const before = [...ids];
    const result = resolveProjectIntakeSelection({ mode: 'CREATE', availableIds: ids });
    assert.deepEqual(ids, before);
    assert.equal(result.selectedId, null);
  });
});
