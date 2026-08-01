import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canTransitionBusinessCardInbox,
  createBusinessCardInboxItem,
  createOneTimeUploadSession,
  isUploadSessionUsable,
} from './mobileBusinessCard';

test('mobile upload session is company scoped, one-time and short lived', () => {
  const now = Date.parse('2026-07-29T00:00:00.000Z');
  const session = createOneTimeUploadSession('CON_COST', now);
  assert.equal(session.singleUse, true);
  assert.equal(isUploadSessionUsable(session, 'CON_COST', now + 9 * 60 * 1000), true);
  assert.equal(isUploadSessionUsable(session, 'VIET_QS', now), false);
  assert.equal(isUploadSessionUsable(session, 'CON_COST', now + 11 * 60 * 1000), false);
});

test('inbox item stores metadata only and preserves company scope', () => {
  const now = Date.parse('2026-07-29T00:00:00.000Z');
  const session = createOneTimeUploadSession('VIET_QS', now);
  const item = createBusinessCardInboxItem(
    session,
    { name: 'card.jpg', size: 2048 } as File,
    now,
  );
  assert.equal(item.companyId, 'VIET_QS');
  assert.equal(item.fileName, 'card.jpg');
  assert.equal('file' in item, false);
  assert.equal('binary' in item, false);
});

test('business-card inbox workflow cannot skip human review', () => {
  assert.equal(canTransitionBusinessCardInbox('RECEIVED', 'OCR_PENDING'), true);
  assert.equal(canTransitionBusinessCardInbox('OCR_PENDING', 'COMPLETED'), false);
  assert.equal(canTransitionBusinessCardInbox('REVIEW_REQUIRED', 'READY_TO_CREATE'), true);
});
