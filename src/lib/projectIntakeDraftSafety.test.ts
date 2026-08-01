import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { useProjectIntakeStore } from '@/store/projectIntakeStore';

const actor = {
  id: 'admin-f03',
  role: 'SUPER_ADMIN' as const,
  departmentId: 'department-f03',
};

beforeEach(() => {
  useProjectIntakeStore.setState({
    intakes: [],
    persistenceMode: 'LOCAL_DEMO',
    loading: false,
    error: null,
  });
});

describe('project intake temporary draft safety', () => {
  it('creates a unique temporary id without changing existing records', () => {
    const first = useProjectIntakeStore.getState().createDraft(actor);
    const second = useProjectIntakeStore.getState().createDraft(actor);
    assert.notEqual(first.id, second.id);
    assert.equal(useProjectIntakeStore.getState().intakes.length, 2);
  });

  it('discards only the current user temporary draft', () => {
    const created = useProjectIntakeStore.getState().createDraft(actor);
    useProjectIntakeStore.getState().discardDraft(created.id, actor);
    assert.equal(useProjectIntakeStore.getState().intakes.length, 0);
  });

  it('does not fake a successful create in SERVER mode', () => {
    useProjectIntakeStore.setState({ persistenceMode: 'SERVER' });
    assert.throws(
      () => useProjectIntakeStore.getState().createDraft(actor),
      /CREATE API/,
    );
  });
});
