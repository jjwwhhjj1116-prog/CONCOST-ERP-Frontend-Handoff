import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { getNavigationVisual, navigationVisualCount } from './navigationVisuals';

test('navigation pictograms distinguish common work states semantically', () => {
  assert.deepEqual(getNavigationVisual('tasks-today'), {
    tone: 'orange',
    pictogram: 'taskToday',
  });
  assert.deepEqual(getNavigationVisual('tasks-done'), {
    tone: 'green',
    pictogram: 'taskDone',
  });
  assert.deepEqual(getNavigationVisual('board-notice-company'), {
    tone: 'orange',
    pictogram: 'boardNotice',
  });
  assert.deepEqual(getNavigationVisual('board-free'), {
    tone: 'amber',
    pictogram: 'boardFree',
  });
});

test('navigation pictograms cover every application module family', () => {
  const ids = [
    'workspace-home',
    'mail-inbox',
    'approval-received',
    'calendar-upcoming',
    'project-intake',
    'drive-technical',
    'tasks-review',
    'board-library',
    'organization-chart',
    'sales-pipeline',
    'finance-closing',
    'ai-assistant-home',
    'admin-drive-integration',
  ];

  for (const id of ids) {
    assert.notEqual(getNavigationVisual(id).pictogram, 'fallback', id);
  }
});

test('project, estimate, and mail actions use unique silhouettes', () => {
  const projectIcons = [
    'estimate-requests',
    'estimate-sheets',
    'estimate-db',
    'project-intake',
    'finish-projects',
    'structure-projects',
    'civil-projects',
    'claim-all-projects',
    'development-all-projects',
  ].map((id) => getNavigationVisual(id).pictogram);
  assert.equal(new Set(projectIcons).size, projectIcons.length);

  const mailIcons = [
    'mail-all',
    'mail-inbox',
    'mail-sent',
    'mail-starred',
    'mail-pending',
    'mail-draft',
    'mail-memo',
    'mail-spam',
    'mail-trash',
    'mail-user',
    'mail-project',
  ].map((id) => getNavigationVisual(id).pictogram);
  assert.equal(new Set(mailIcons).size, mailIcons.length);
});

test('every declared sidebar item resolves to a named pictogram', () => {
  const sidebarSource = readFileSync(
    new URL('../components/layout/Sidebar.tsx', import.meta.url),
    'utf8',
  );
  const ids = Array.from(sidebarSource.matchAll(/\bid:\s*'([^']+)'/g), (match) => match[1]);

  assert.ok(ids.length >= 90);
  assert.ok(navigationVisualCount >= 100);
  for (const id of ids) {
    assert.notEqual(getNavigationVisual(id).pictogram, 'fallback', id);
  }
});

test('secondary navigation uses custom SVG pictograms without the old chip wrapper', () => {
  const source = readFileSync(
    new URL('../components/navigation/SecondaryNavIcon.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /NavigationPictogram/);
  assert.doesNotMatch(source, /lucide-react/);
  assert.doesNotMatch(source, /rounded-lg|ring-1|navigationToneClass/);
});
