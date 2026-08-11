import assert from 'node:assert/strict';
import test from 'node:test';
import { shouldNavigateBackFromUndoShortcut } from './historyShortcut';

const shortcut = (overrides: Partial<Parameters<typeof shouldNavigateBackFromUndoShortcut>[0]> = {}) => ({
  key: 'z',
  ctrlKey: true,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  defaultPrevented: false,
  editableTarget: false,
  ...overrides,
});

test('Ctrl/Cmd+Z navigates back outside editable controls', () => {
  assert.equal(shouldNavigateBackFromUndoShortcut(shortcut()), true);
  assert.equal(shouldNavigateBackFromUndoShortcut(shortcut({ ctrlKey: false, metaKey: true })), true);
});

test('native undo and feature-owned shortcuts are preserved', () => {
  assert.equal(shouldNavigateBackFromUndoShortcut(shortcut({ editableTarget: true })), false);
  assert.equal(shouldNavigateBackFromUndoShortcut(shortcut({ defaultPrevented: true })), false);
  assert.equal(shouldNavigateBackFromUndoShortcut(shortcut({ shiftKey: true })), false);
  assert.equal(shouldNavigateBackFromUndoShortcut(shortcut({ altKey: true })), false);
  assert.equal(shouldNavigateBackFromUndoShortcut(shortcut({ key: 'y' })), false);
});
