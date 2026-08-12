import test from 'node:test';
import assert from 'node:assert/strict';

import { customerProjectHistoryProjects } from '@/data/customerProjectHistorySeed';
import { mergeCustomerProjectHistorySeeds } from '@/store/projectStore';
import type { Project } from '@/types/models';

test('project persistence migration preserves existing records and adds missing relationship fixtures', () => {
  const existing = {
    ...customerProjectHistoryProjects[0],
    id: 'user-project-existing',
    title: 'Existing user project',
  } satisfies Project;

  const migrated = mergeCustomerProjectHistorySeeds([existing]);

  assert.equal(migrated[0], existing);
  assert.equal(migrated.filter((project) => project.id === existing.id).length, 1);
  for (const seed of customerProjectHistoryProjects) {
    assert.equal(migrated.filter((project) => project.id === seed.id).length, 1);
  }
});

test('project persistence migration is idempotent', () => {
  const once = mergeCustomerProjectHistorySeeds(customerProjectHistoryProjects);
  const twice = mergeCustomerProjectHistorySeeds(once);

  assert.deepEqual(twice, once);
});

test('project persistence migration refreshes only stale synthetic relationship fixtures', () => {
  const staleSeed = {
    ...customerProjectHistoryProjects[0],
    publicationStatus: 'DRAFT',
    title: 'Stale synthetic project',
  } satisfies Project;
  const userProject = {
    ...customerProjectHistoryProjects[0],
    id: 'user-project-preserved',
    title: 'User project remains untouched',
  } satisfies Project;

  const migrated = mergeCustomerProjectHistorySeeds([staleSeed, userProject]);

  assert.deepEqual(
    migrated.find((project) => project.id === staleSeed.id),
    customerProjectHistoryProjects[0],
  );
  assert.equal(migrated.find((project) => project.id === userProject.id), userProject);
});
