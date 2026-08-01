import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeBusinessCardOcr, parseBusinessCardText } from './businessCardOcr';

test('normalizes CLOVA name-card fields into the ERP contact schema', () => {
  const result = normalizeBusinessCardOcr({ images: [{ nameCard: { meta: { estimatedLanguage: 'ko' }, result: { name: [{ text: '[DEMO] 영업 담당자', confidenceScore: 0.98 }], company: [{ text: 'CON-COST', confidenceScore: 0.96 }], department: [{ text: '영업팀', confidenceScore: 0.95 }], position: [{ text: '팀장', confidenceScore: 0.94 }], mobile: [{ text: '010-0000-0000', confidenceScore: 0.99 }], email: [{ text: 'demo-card@example.invalid', confidenceScore: 0.99 }] } } }] });
  assert.equal(result.contact.name, '[DEMO] 영업 담당자');
  assert.equal(result.contact.company, 'CON-COST');
  assert.equal(result.contact.mobile, '010-0000-0000');
  assert.equal(result.language, 'ko');
  assert.ok(result.confidence > 0.9);
});

test('extracts common contact fields from unstructured OCR text', () => {
  const result = parseBusinessCardText('[DEMO] 명함 사용자\n(주)컨코스트\n데모시 예시구 테스트로 1\nM 010-0000-0000\ndemo-card@example.invalid\nwww.example.invalid');
  assert.equal(result.name, '[DEMO] 명함 사용자');
  assert.equal(result.company, '(주)컨코스트');
  assert.equal(result.email, 'demo-card@example.invalid');
  assert.equal(result.mobile, '010-0000-0000');
});
