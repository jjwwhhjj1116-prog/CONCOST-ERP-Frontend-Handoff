import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const operationsSource = readFileSync(
  new URL('../components/handoff/FinanceOperationsWorkbench.tsx', import.meta.url),
  'utf8',
);
const accountingSource = readFileSync(
  new URL('../components/handoff/FinanceAccountingWorkbench.tsx', import.meta.url),
  'utf8',
);

test('finance operations exposes the accounting surface without unrelated toolbar actions', () => {
  assert.match(operationsSource, /FinanceAccountingWorkbench/);
  assert.match(operationsSource, /view === 'ACCOUNTING'/);
  assert.match(operationsSource, /view !== 'ACCOUNTING' && <FinanceToolbar/);
  assert.match(operationsSource, /showMetrics=\{boundary\.isSimulation\}/);
  assert.match(operationsSource, /boundary\.isSimulation && \(/);
});

test('server accounting never falls back to CON-COST synthetic journals', () => {
  assert.match(accountingSource, /isSimulation && companyId === syntheticKoreanDemoChartOfAccounts\.companyId/);
  assert.match(accountingSource, /!isSimulation && !adapterReady/);
  assert.match(accountingSource, /서버 모드에서는 합성 전표로 대체하지 않습니다/);
  assert.match(accountingSource, /disabled title=\{isSimulation \? t\.postingDisabledDemo : t\.postingDisabledServer\}/);
});

test('accounting help is available in Korean, Vietnamese, and English', async () => {
  const { getFinanceGuideContent } = await import('@/lib/financeGuide');
  for (const locale of ['ko', 'vi', 'en'] as const) {
    assert.ok(getFinanceGuideContent(locale).workflows.some((workflow) => workflow.view === 'ACCOUNTING'));
  }
});
