import assert from 'node:assert/strict';
import test from 'node:test';
import { getWorkspaceHomeCopy, getWorkspaceShellCopy, localizeGeneratedTaskTitle, localizeShellText } from '@/lib/workspaceShellLocalization';

test('Vietnam workspace localizes shell navigation and home widgets', () => {
  assert.equal(localizeShellText('전자메일', 'vi'), 'Thư điện tử');
  assert.equal(localizeShellText('프로젝트 접수', 'vi'), 'Tiếp nhận dự án');
  assert.equal(localizeShellText('알 수 없는 항목', 'vi'), '알 수 없는 항목');
  assert.equal(getWorkspaceShellCopy('vi').searchPlaceholder, 'Tìm dự án, tài liệu hoặc người phụ trách');
  assert.equal(getWorkspaceHomeCopy('vi').priorityTasks, 'Công việc ưu tiên');
  assert.deepEqual(getWorkspaceHomeCopy('vi').projectSteps, ['Tiếp nhận', 'PM', 'Lịch', 'Công việc', 'Bàn giao']);
  assert.equal(localizeGeneratedTaskTitle('[Steel] Ph4 작업', 'vi'), '[Steel] Ph4 công việc');
  assert.equal(localizeGeneratedTaskTitle('Người dùng nhập 작업 중', 'vi'), 'Người dùng nhập 작업 중');
});

test('CON-COST workspace keeps Korean shell copy', () => {
  assert.equal(localizeShellText('전자메일', 'ko'), '전자메일');
  assert.equal(getWorkspaceHomeCopy('ko').widgetSettings, '위젯 설정');
  assert.equal(localizeGeneratedTaskTitle('[Steel] Ph4 작업', 'ko'), '[Steel] Ph4 작업');
});
