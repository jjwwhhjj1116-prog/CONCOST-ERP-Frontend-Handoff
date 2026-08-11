import assert from 'node:assert/strict';
import test from 'node:test';
import { detectBusinessCardPanels } from './businessCardPanels';
import { mergeBusinessCardPanelResults, parseBusinessCardTextDetailed, type BusinessCardOcrBox } from './businessCardOcr';

function box(id: string, text: string, x0: number, y0: number, x1: number, panelId?: 'LEFT' | 'RIGHT'): BusinessCardOcrBox {
  return { id, kind: 'LINE', text, confidence: 0.94, x0, y0, x1, y1: y0 + 0.06, width: x1 - x0, height: 0.06, panelId };
}

const contactLeft = [
  box('l1', '주식회사 데모코스트', 0.04, 0.08, 0.42),
  box('l2', '홍 길 동', 0.06, 0.22, 0.28),
  box('l3', '기술본부 BIM · 구조 | 수석', 0.05, 0.34, 0.44),
  box('l4', 'demo.person@example.invalid', 0.05, 0.62, 0.42),
  box('l5', 'T 02-0000-0000 (1706)', 0.05, 0.72, 0.4),
];
const promoRight = [
  box('r1', 'DEMO COST', 0.58, 0.1, 0.88),
  box('r2', '대한민국 No.1 건설 공사비 컨설팅 기업', 0.55, 0.34, 0.96),
  box('r3', '서비스 A | 서비스 B | 서비스 C', 0.56, 0.5, 0.95),
  box('r4', 'www.demo-cost.example', 0.62, 0.76, 0.92),
];

test('detects exact-center and off-center dual panels without using aspect ratio alone', () => {
  const exact = detectBusinessCardPanels([...contactLeft, ...promoRight], { aspectRatio: 2, separatorX: 0.5, separatorConfidence: 0.92 });
  assert.equal(exact.layout, 'DUAL_PANEL');
  assert.equal(exact.contactPanelId, 'LEFT');
  assert.equal(exact.promoPanelId, 'RIGHT');

  const shiftedRight = promoRight.map((item) => ({ ...item, x0: item.x0 + 0.08, x1: Math.min(0.99, item.x1 + 0.08) }));
  const offCenter = detectBusinessCardPanels([...contactLeft, ...shiftedRight], { aspectRatio: 2.1, separatorX: 0.58, separatorConfidence: 0.8 });
  assert.equal(offCenter.layout, 'DUAL_PANEL');
  assert.equal(offCenter.separatorX, 0.58);
});

test('uses OCR cluster gap, preserves single-face and portrait fallbacks', () => {
  const clustered = detectBusinessCardPanels([...contactLeft, ...promoRight], { aspectRatio: 2 });
  assert.equal(clustered.layout, 'DUAL_PANEL');

  const single = detectBusinessCardPanels(contactLeft, { aspectRatio: 1.75, separatorX: null, separatorConfidence: 0 });
  assert.equal(single.layout, 'SINGLE_FACE');
  assert.equal(single.contactPanelId, 'FULL');

  const portrait = detectBusinessCardPanels([...contactLeft, ...promoRight], { aspectRatio: 0.7, separatorX: 0.5, separatorConfidence: 0.95 });
  assert.equal(portrait.layout, 'SINGLE_FACE');
});

test('supports promo-left contact-right and explicit panel override', () => {
  const movedPromo = promoRight.map((item) => ({ ...item, x0: item.x0 - 0.52, x1: item.x1 - 0.52 }));
  const movedContact = contactLeft.map((item) => ({ ...item, x0: item.x0 + 0.52, x1: item.x1 + 0.52 }));
  const auto = detectBusinessCardPanels([...movedPromo, ...movedContact], { aspectRatio: 2, separatorX: 0.5, separatorConfidence: 0.9 });
  assert.equal(auto.contactPanelId, 'RIGHT');
  const override = detectBusinessCardPanels([...contactLeft, ...promoRight], { aspectRatio: 2, separatorX: 0.5, separatorConfidence: 0.9 }, 'RIGHT');
  assert.equal(override.contactPanelId, 'RIGHT');
  assert.ok(override.reason.includes('USER_PANEL_OVERRIDE'));
});

test('reconstructs spaced Hangul, splits department and position, removes code noise and preserves contact values', () => {
  const raw = [
    '주식회사 데모코스트',
    '기술본부 BIM · 구조 | 수석 BM-TX',
    '홍 길 동',
    'Hong, Gil Dong',
    '01234 서울 테스트구 테스트로 12',
    'DEMO TOWER 4F',
    'T 02-0000-0000 (1706)',
    'F 02-0000-0001',
    'M 010-0000-0002',
    'E demo.person@example.invalid',
  ].join('\n');
  const result = parseBusinessCardTextDetailed(raw, {
    overallConfidence: 0.94,
    boxes: raw.split('\n').map((text, index) => box('contact-' + index, text, 0.05, index * 0.08, 0.47, 'LEFT')),
  });
  assert.equal(result.contact.name, '홍길동');
  assert.equal(result.contact.company, '주식회사 데모코스트');
  assert.equal(result.contact.department, '기술본부 BIM · 구조');
  assert.equal(result.contact.position, '수석');
  assert.equal(result.contact.telephone, '02-0000-0000 (1706)');
  assert.equal(result.contact.fax, '02-0000-0001');
  assert.equal(result.contact.mobile, '010-0000-0002');
  assert.equal(result.contact.email, 'demo.person@example.invalid');
  assert.equal(result.contact.address, '01234 서울 테스트구 테스트로 12 DEMO TOWER 4F');
  assert.equal(result.contact.department.includes('BM-TX'), false);
  assert.equal(result.evidence?.fieldSources?.name?.panelId, 'LEFT');
});

test('rejects promotional company copy and accepts only a valid promo homepage', () => {
  const promo = parseBusinessCardTextDetailed([
    'DEMO COST',
    '대한민국 No.1 건설 공사비 컨설팅 기업',
    '견적 | 수량산출 | 클레임',
    'No.1',
    'BIM.7',
    'Ver.2',
    'www.demo-cost.example',
  ].join('\n'), {
    overallConfidence: 0.92,
    boxes: promoRight.map((item) => ({ ...item, panelId: 'RIGHT' as const })),
  });
  assert.notEqual(promo.contact.company, '대한민국 No.1 건설 공사비 컨설팅 기업');
  assert.equal(promo.contact.homepage, 'www.demo-cost.example');
  assert.equal(promo.evidence?.fieldSources?.homepage?.panelId, 'RIGHT');
  assert.ok(promo.evidence?.candidates.some((candidate) => candidate.rejectedReason === 'MARKETING_STATEMENT'));
  assert.equal(promo.evidence?.candidates.some((candidate) => ['No.1', 'BIM.7', 'Ver.2'].includes(candidate.value) && !candidate.rejectedReason), false);
});
test('accepts a strong whitespace separator and classifies a dark promo panel by semantics', () => {
  const result = detectBusinessCardPanels(
    [...contactLeft, ...promoRight],
    { aspectRatio: 2.45, separatorX: 0.48, separatorConfidence: 0.96 },
  );
  assert.equal(result.layout, 'DUAL_PANEL');
  assert.ok(result.reason.includes('IMAGE_SEPARATOR'));
  assert.equal(result.panels.find((item) => item.id === 'LEFT')?.kind, 'CONTACT_FACE');
  assert.equal(result.panels.find((item) => item.id === 'RIGHT')?.kind, 'BRAND_PROMO_FACE');
});

test('merges only company and homepage from promo evidence and preserves contact-only fields', () => {
  const contactResult = parseBusinessCardTextDetailed([
    '홍 길 동',
    '기술본부 BIM · 구조 | 수석',
    'demo.person@example.invalid',
  ].join('\n'), {
    overallConfidence: 0.92,
    boxes: contactLeft.map((item) => ({ ...item, panelId: 'LEFT' as const })),
  });
  const promoResult = parseBusinessCardTextDetailed([
    '주식회사 데모코스트',
    '대한민국 No.1 건설 공사비 컨설팅 기업',
    'www.demo-cost.example',
  ].join('\n'), {
    overallConfidence: 0.92,
    boxes: promoRight.map((item) => ({ ...item, panelId: 'RIGHT' as const })),
  });
  promoResult.contact.name = 'PROMO PERSON MUST NOT MERGE';
  promoResult.contact.position = 'PROMO ROLE MUST NOT MERGE';

  const merged = mergeBusinessCardPanelResults(contactResult, promoResult);
  assert.equal(merged.contact.name, '홍길동');
  assert.equal(merged.contact.position, '수석');
  assert.equal(merged.contact.company, '주식회사 데모코스트');
  assert.equal(merged.contact.homepage, 'www.demo-cost.example');
  assert.equal(merged.fieldSources.homepage?.panelId, 'RIGHT');
});

test('rejects a demo brand name and accepts comma-form English identity evidence', () => {
  const result = parseBusinessCardTextDetailed([
    'DEMO COST',
    'Demo Cost Company',
    'Development Team BM. RE | Senior Manager',
    'Hong, Gil Dong',
    'demo.person@example.invalid',
  ].join('\n'));
  assert.equal(result.contact.name, 'Hong, Gil Dong');
  assert.equal(result.contact.department, 'Development Team');
  assert.equal(result.contact.position, 'Senior Manager');
  assert.equal(result.contact.department.includes('BM.RE'), false);
  assert.ok(result.evidence?.candidates.some((candidate) => candidate.value === 'DEMO COST' && candidate.rejectedReason === 'LOGO_OR_BRAND_TEXT'));
});