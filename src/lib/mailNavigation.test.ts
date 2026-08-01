import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getMailFolderHref,
  getMailFolderLabel,
  getProjectMailFolders,
  MAIL_PRIMARY_FOLDERS,
  parseMailFolder,
} from './mailNavigation';

test('mail navigation exposes every approved primary mailbox', () => {
  assert.deepEqual(MAIL_PRIMARY_FOLDERS, [
    'ALL',
    'INBOX',
    'SENT',
    'STARRED',
    'PENDING',
    'DRAFT',
    'MEMO',
    'SPAM',
    'TRASH',
  ]);
  assert.equal(getMailFolderLabel('PENDING', 'ko'), '수신확인');
  assert.equal(getMailFolderLabel('PROJECT', 'vi'), 'Thư theo dự án');
  assert.equal(getMailFolderLabel('MEMO', 'en'), 'Memos');
});

test('mail navigation rejects unknown mailbox query values', () => {
  assert.equal(parseMailFolder('INBOX'), 'INBOX');
  assert.equal(parseMailFolder('NOT_A_MAILBOX'), 'ALL');
  assert.equal(parseMailFolder(null), 'ALL');
});

test('mail links preserve folder intent without duplicating the base path', () => {
  assert.equal(getMailFolderHref('ALL'), '/mail');
  assert.equal(
    getMailFolderHref('USER', { folderId: 'FOLLOW_UP' }),
    '/mail?box=USER&folder=FOLLOW_UP',
  );
  assert.equal(
    getMailFolderHref('PROJECT', { projectId: 'project-songpa-001' }),
    '/mail?box=PROJECT&projectId=project-songpa-001',
  );
});

test('project mailboxes remain isolated by company workspace', () => {
  const concost = getProjectMailFolders('CON_COST');
  const vietQs = getProjectMailFolders('VIET_QS');
  assert.ok(concost.length > 0);
  assert.ok(vietQs.length > 0);
  assert.equal(
    concost.some((folder) => vietQs.some((candidate) => candidate.id === folder.id)),
    false,
  );
});
