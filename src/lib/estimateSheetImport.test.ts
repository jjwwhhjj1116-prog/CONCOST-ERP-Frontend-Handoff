import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEstimateWorkbook } from '@/lib/estimateSheetExport';
import { previewEstimateWorkbook } from '@/lib/estimateSheetImport';
import { createEstimateSheetState } from '@/lib/estimateSheetTemplates';
import { estimateSemanticState, markEstimateCellManual } from '@/lib/estimateRequestProfile';

test('estimate workbook export and import preserve semantic state', async () => {
  const source = markEstimateCellManual(createEstimateSheetState('개산견적'), '6:2', 'Synthetic project');
  const buffer = await buildEstimateWorkbook(source);
  const preview = await previewEstimateWorkbook(buffer as ArrayBuffer, 'roundtrip.xlsx', createEstimateSheetState('개산견적'));
  assert.equal(preview.errors.length, 0);
  assert.deepEqual(estimateSemanticState(preview.state), estimateSemanticState(source));
});

test('macro workbook extensions are rejected before parsing', async () => {
  const state = createEstimateSheetState('개산견적');
  const preview = await previewEstimateWorkbook(new ArrayBuffer(0), 'unsafe.xlsm', state);
  assert.match(preview.errors[0], /매크로/);
});
