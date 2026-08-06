import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import { semanticActionClasses } from '@/components/ui/SemanticActionButton';

const source = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

test('semantic action palette contains every frozen business meaning', () => {
  assert.deepEqual(Object.keys(semanticActionClasses).sort(), [
    'add-resource', 'archive', 'danger', 'document', 'duplicate', 'edit', 'neutral',
    'primary', 'reject', 'save', 'success', 'view', 'warning',
  ].sort());
  assert.match(semanticActionClasses.primary, /orange/);
  assert.match(semanticActionClasses.edit, /info|blue/);
  assert.match(semanticActionClasses.save, /teal/);
  assert.match(semanticActionClasses.duplicate, /violet/);
  assert.match(semanticActionClasses.danger, /danger|red/);
  assert.match(semanticActionClasses.success, /success|green/);
  assert.match(semanticActionClasses.warning, /warning|amber/);
  assert.match(semanticActionClasses.document, /teal/);
  assert.match(semanticActionClasses.view, /indigo|cobalt/);
  assert.match(semanticActionClasses['add-resource'], /sky/);
});

test('semantic buttons expose state, tooltip, focus, loading and reduced-motion contracts', () => {
  const component = source('src/components/ui/SemanticActionButton.tsx');
  for (const token of ['data-action-variant', 'aria-busy', 'disabledReason', 'focus-visible:ring-2', 'hover:-translate-y-px', 'active:translate-y-0', 'motion-reduce', 'aria-live="polite"']) {
    assert.ok(component.includes(token), `missing semantic state contract: ${token}`);
  }
});

test('project board card has one contextual staffing action and no duplicate board action', () => {
  const card = source('src/components/board/ProjectSummaryCard.tsx');
  assert.equal(card.includes('프로젝트 보드 열기'), false);
  assert.match(card, /투입인원 배정/);
  assert.match(card, /투입인원 계속 배정/);
  assert.match(card, /투입인원 보기·수정/);
  assert.match(card, /투입인원 변경/);
  assert.equal((card.match(/staffingActionLabel/g) || []).length >= 2, true);
});

test('project intake completes in place with user-facing receipt wording', () => {
  const intake = source('src/components/intake/ProjectIntakeWorkbench.tsx');
  const completionCommand = intake.slice(intake.indexOf('const completeWonIntake'), intake.indexOf('const cancelCurrent'));
  assert.equal(completionCommand.includes('router.push'), false);
  assert.equal(intake.includes('프로젝트 보드'), false);
  assert.equal(intake.includes('수주 완료'), false);
  for (const label of ['접수 완료', '담당부서 전달 완료', '주관부서', '참여부서', '전달시각']) {
    assert.ok(intake.includes(label), `missing completion summary label: ${label}`);
  }
});

test('staffing receives route context and never falls back to assignments[0]', () => {
  const page = source('src/app/projects/page.tsx');
  const modal = source('src/components/board/ProjectStaffingModal.tsx');
  assert.match(page, /workspaceContext=\{\{/);
  assert.match(page, /sourceRoute:/);
  assert.match(modal, /workspaceContext:/);
  assert.equal(page.includes('assignments[0]'), false);
  assert.equal(modal.includes('assignments[0]'), false);
});

test('high-risk visible commands use semantic variants in priority workspaces', () => {
  const contracts: Array<[string, string[]]> = [
    ['src/components/intake/EstimateRequestWorkbench.tsx', ['variant="edit"', 'variant="duplicate"', 'variant="danger"', "WON: 'success'", "ON_HOLD: 'warning'", "LOST: 'reject'", "semanticLinkClass('document')"]],
    ['src/components/intake/EstimateDatabaseWorkbench.tsx', ['variant="add-resource"', 'variant="save"', 'variant="duplicate"', 'variant="danger"', 'variant="document"']],
    ['src/components/approvals/ApprovalWorkspace.tsx', ['variant="success"', 'variant="reject"', 'variant="warning"', 'variant="archive"']],
    ['src/components/mail/MailWorkspace.tsx', ['variant="primary"', 'variant="edit"', 'variant="view"', 'variant="duplicate"', 'variant="danger"', 'variant="warning"']],
    ['src/components/drive/DriveWorkspace.tsx', ['variant="add-resource"', 'variant="danger"']],
  ];
  for (const [path, tokens] of contracts) {
    const contents = source(path);
    for (const token of tokens) assert.ok(contents.includes(token), `${path} missing ${token}`);
  }
});
