import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canTransitionProfilePhoto,
  createProfilePhotoDraft,
  isAcceptedProfilePhotoFile,
} from './profilePhoto';

test('profile photo draft preserves the original and forbids identity changes', () => {
  const draft = createProfilePhotoDraft(
    'user-1',
    'data:image/png;base64,preview',
    new Date('2026-07-29T00:00:00.000Z'),
  );

  assert.equal(draft.originalDataUrl, draft.previewDataUrl);
  assert.equal(draft.originalPreserved, true);
  assert.equal(draft.identityChangeAllowed, false);
  assert.equal(draft.state, 'UPLOADED');
});

test('AI output requires review before approval', () => {
  assert.equal(canTransitionProfilePhoto('EDITING', 'AI_PENDING'), true);
  assert.equal(canTransitionProfilePhoto('AI_PENDING', 'APPROVED'), false);
  assert.equal(canTransitionProfilePhoto('AI_PENDING', 'AI_REVIEW_REQUIRED'), true);
  assert.equal(canTransitionProfilePhoto('AI_REVIEW_REQUIRED', 'APPROVED'), true);
});

test('profile photo files are image-only and limited to ten megabytes', () => {
  assert.equal(isAcceptedProfilePhotoFile({ type: 'image/jpeg', size: 1024 }), true);
  assert.equal(isAcceptedProfilePhotoFile({ type: 'application/pdf', size: 1024 }), false);
  assert.equal(
    isAcceptedProfilePhotoFile({ type: 'image/png', size: 11 * 1024 * 1024 }),
    false,
  );
});
