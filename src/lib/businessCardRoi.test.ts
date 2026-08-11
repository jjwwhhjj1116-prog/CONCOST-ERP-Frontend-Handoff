import assert from 'node:assert/strict';
import test from 'node:test';
import { detectBusinessCardRois, roiUpscaleFactor, shouldAcceptBusinessCardRoiField } from './businessCardRoi';
import { resolveBusinessCardPanelCrop } from './localBusinessCardOcr';
import type { BusinessCardOcrBox } from './businessCardOcr';

function line(id: string, text: string, x0: number, y0: number, x1: number, height = 0.06): BusinessCardOcrBox {
  return { id, kind: 'LINE', text, confidence: 0.92, x0, y0, x1, y1: y0 + height, width: x1 - x0, height };
}

test('detects field-specific regions without treating company marks as a person', () => {
  const boxes = [
    line('logo', 'CON-COST', 0.04, 0.05, 0.24, 0.08),
    line('name', '홍 길 동', 0.08, 0.24, 0.27, 0.1),
    line('role', '기술본부 구조팀 | 선임 프로', 0.08, 0.37, 0.42),
    line('tel', 'T 02-0000-0000', 0.08, 0.58, 0.34),
    line('email', 'E demo.person@example.invalid', 0.08, 0.67, 0.46),
    line('address', '주소 서울시 예시구 예시로 12', 0.08, 0.78, 0.55),
    line('address-2', 'DEMO TOWER 4F', 0.08, 0.85, 0.38),
  ];
  const rois = detectBusinessCardRois(boxes);
  assert.deepEqual(rois.map((roi) => roi.kind).sort(), ['ADDRESS', 'CONTACT', 'DEPARTMENT_POSITION', 'NAME_KO']);
  assert.deepEqual(rois.find((roi) => roi.kind === 'NAME_KO')?.sourceBoxIds, ['name']);
  assert.ok((rois.find((roi) => roi.kind === 'ADDRESS')?.sourceBoxIds.length ?? 0) >= 2);
  assert.equal(rois.some((roi) => roi.sourceBoxIds.includes('logo') && roi.kind === 'NAME_KO'), false);
});

test('accepts only validated ROI values that improve confidence', () => {
  assert.equal(shouldAcceptBusinessCardRoiField('name', '', null, '홍길동', 0.74), true);
  assert.equal(shouldAcceptBusinessCardRoiField('name', '홍길동', 0.82, 'CON-COST', 0.99), false);
  assert.equal(shouldAcceptBusinessCardRoiField('email', 'demo.person@example.invalid', 0.9, 'not-an-email', 0.98), false);
  assert.equal(shouldAcceptBusinessCardRoiField('telephone', '02-0000-0000', 0.91, 'No.1', 0.99), false);
  assert.equal(shouldAcceptBusinessCardRoiField('address', '', null, '서울시 예시구 예시로 12', 0.7), true);
});

test('uses stronger upscaling for compact text regions', () => {
  assert.equal(roiUpscaleFactor({ x0: 0.1, y0: 0.1, x1: 0.35, y1: 0.2 }), 4);
  assert.equal(roiUpscaleFactor({ x0: 0.1, y0: 0.1, x1: 0.7, y1: 0.4 }), 3);
});

test('manual LEFT, RIGHT, and FULL selections resolve to actual source pixel crops', () => {
  assert.deepEqual(resolveBusinessCardPanelCrop(1200, 800, { id: 'LEFT', kind: 'CONTACT_FACE', x0: 0, y0: 0, x1: 0.48, y1: 1, score: 1, contactScore: 1, promoScore: 0 }), {
    x0: 0, x1: 576, width: 576, height: 800,
  });
  assert.deepEqual(resolveBusinessCardPanelCrop(1200, 800, { id: 'RIGHT', kind: 'BRAND_PROMO_FACE', x0: 0.52, y0: 0, x1: 1, y1: 1, score: 1, contactScore: 0, promoScore: 1 }), {
    x0: 624, x1: 1200, width: 576, height: 800,
  });
  assert.deepEqual(resolveBusinessCardPanelCrop(1200, 800, { id: 'FULL', kind: 'CONTACT_FACE', x0: 0, y0: 0, x1: 1, y1: 1, score: 1, contactScore: 1, promoScore: 0 }), {
    x0: 0, x1: 1200, width: 1200, height: 800,
  });
});
