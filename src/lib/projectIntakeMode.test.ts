import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DIRECT_INTAKE_ENABLED, resolveProjectIntakeSelection } from './projectIntakeMode';

describe('project intake estimate-origin queue selection', () => {
  it('freezes direct intake creation off', () => {
    assert.equal(DIRECT_INTAKE_ENABLED, false);
  });

  it('opens only an explicit intake id in edit mode', () => {
    assert.equal(resolveProjectIntakeSelection({ mode: 'EDIT', requestedIntakeId: 'intake-2', availableIds: ['intake-1', 'intake-2'] }).selectedId, 'intake-2');
  });

  it('does not create or fall back when an explicit id is missing', () => {
    assert.deepEqual(resolveProjectIntakeSelection({ mode: 'EDIT', requestedIntakeId: 'new', availableIds: ['intake-1'] }), { selectedId: null, requestedIdMissing: true });
  });

  it('uses the filtered queue without manufacturing a local draft', () => {
    assert.equal(resolveProjectIntakeSelection({ mode: 'LIST', availableIds: ['intake-1', 'intake-2'], filteredIds: ['intake-2'] }).selectedId, 'intake-2');
    assert.equal(resolveProjectIntakeSelection({ mode: 'LIST', availableIds: [], filteredIds: [] }).selectedId, null);
  });

  it('keeps company-specific pools independent', () => {
    assert.equal(resolveProjectIntakeSelection({ mode: 'EDIT', requestedIntakeId: 'con-intake', availableIds: ['con-intake'] }).selectedId, 'con-intake');
    assert.deepEqual(resolveProjectIntakeSelection({ mode: 'EDIT', requestedIntakeId: 'con-intake', availableIds: ['viet-intake'] }), { selectedId: null, requestedIdMissing: true });
  });
});
