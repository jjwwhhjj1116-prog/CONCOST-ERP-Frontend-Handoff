import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getApproverMissingCopy,
  getProjectIntakeCreateBlockedCopy,
  getRuntimeBoundaryCopy,
} from './runtimeBoundaryCopy';

test('mail and approval boundary messages distinguish demo from blocked server modes', () => {
  assert.match(getRuntimeBoundaryCopy('MAIL', 'DEMO_SIMULATION', 'ko'), /시뮬레이션/);
  assert.match(getRuntimeBoundaryCopy('MAIL', 'BLOCKED', 'vi'), /chưa sẵn sàng/i);
  assert.match(getRuntimeBoundaryCopy('APPROVAL', 'DEMO_SIMULATION', 'vi'), /mô phỏng/i);
  assert.match(getRuntimeBoundaryCopy('APPROVAL', 'BLOCKED', 'ko'), /변경하지 않았습니다/);
});

test('intake and approver failures have Korean and Vietnamese copy', () => {
  assert.match(getProjectIntakeCreateBlockedCopy('ko'), /CREATE API/);
  assert.match(getProjectIntakeCreateBlockedCopy('vi'), /API CREATE/);
  assert.match(getApproverMissingCopy('ko'), /결재자/);
  assert.match(getApproverMissingCopy('vi'), /phê duyệt/i);
});
