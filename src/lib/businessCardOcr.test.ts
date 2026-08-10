import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  getConfidenceLevel,
  normalizeBusinessCardOcr,
  parseBusinessCardText,
  parseBusinessCardTextDetailed,
} from './businessCardOcr';
import {
  canUseLocalBusinessCardOcr,
  defaultBusinessCardLanguageProfile,
  resolveBusinessCardLanguages,
} from './localBusinessCardOcr';

test('normalizes CLOVA name-card fields into the ERP contact schema', () => {
  const result = normalizeBusinessCardOcr({ images: [{ nameCard: { meta: { estimatedLanguage: 'ko' }, result: { name: [{ text: '[DEMO] 영업 담당자', confidenceScore: 0.98 }], company: [{ text: 'CON-COST', confidenceScore: 0.96 }], department: [{ text: '영업팀', confidenceScore: 0.95 }], position: [{ text: '팀장', confidenceScore: 0.94 }], mobile: [{ text: '010-0000-0000', confidenceScore: 0.99 }], email: [{ text: 'demo-card@example.invalid', confidenceScore: 0.99 }] } } }] });
  assert.equal(result.contact.name, '[DEMO] 영업 담당자');
  assert.equal(result.contact.company, 'CON-COST');
  assert.equal(result.contact.mobile, '010-0000-0000');
  assert.equal(result.language, 'ko');
  assert.ok(result.confidence > 0.9);
  assert.equal(result.engine, 'BACKEND_PROVIDER');
  assert.equal(result.fieldConfidence.name, 0.98);
});

test('does not duplicate an overall provider confidence across individual fields', () => {
  const result = normalizeBusinessCardOcr({
    contact: { name: 'DEMO USER', company: 'DEMO COMPANY' },
    confidence: 0.88,
    fieldConfidence: { name: 0.94 },
  });

  assert.equal(result.overallConfidence, 0.88);
  assert.equal(result.fieldConfidence.name, 0.94);
  assert.equal(result.fieldConfidence.company, null);
});

test('extracts common contact fields from unstructured OCR text', () => {
  const result = parseBusinessCardText('[DEMO] 명함 사용자\n(주)컨코스트\n데모시 예시구 테스트로 1\nM 010-0000-0000\ndemo-card@example.invalid\nwww.example.invalid');
  assert.equal(result.name, '[DEMO] 명함 사용자');
  assert.equal(result.company, '(주)컨코스트');
  assert.equal(result.email, 'demo-card@example.invalid');
  assert.equal(result.mobile, '010-0000-0000');
});

test('parses a Korean synthetic card with labeled office, mobile, fax, department and position', () => {
  const result = parseBusinessCardTextDetailed([
    '홍길동',
    'DEMO 건설 주식회사',
    '기술본부',
    '부장',
    'M 010-1234-5678',
    'T 02-1234-5678 · F 02-1234-5679',
    'hong . gildong ＠ example . invalid',
    'www.demo-construction.example',
    '서울특별시 중구 테스트로 10',
  ].join('\n'), { overallConfidence: 0.94, languageProfile: 'KO_EN', languages: ['kor', 'eng'], engine: 'LOCAL_TESSERACT' });

  assert.equal(result.contact.name, '홍길동');
  assert.equal(result.contact.company, 'DEMO 건설 주식회사');
  assert.equal(result.contact.department, '기술본부');
  assert.equal(result.contact.position, '부장');
  assert.equal(result.contact.mobile, '010-1234-5678');
  assert.equal(result.contact.telephone, '02-1234-5678');
  assert.equal(result.contact.fax, '02-1234-5679');
  assert.equal(result.contact.email, 'hong.gildong@example.invalid');
  assert.equal(result.contact.homepage, 'www.demo-construction.example');
  assert.equal(result.contact.address, '서울특별시 중구 테스트로 10');
  assert.equal(result.overallConfidence, 0.94);
  assert.deepEqual(result.languageProfile, ['kor', 'eng']);
  assert.notEqual(result.fieldConfidence.name, result.fieldConfidence.department);
});

test('parses an English synthetic card conservatively', () => {
  const result = parseBusinessCardText([
    'ALEX DEMO',
    'DEMO ENGINEERING CO., LTD.',
    'Project Controls Department',
    'Senior Manager',
    'Mobile: +1 202-555-0142',
    'Tel: +1 202-555-0143',
    'Fax: +1 202-555-0144',
    'alex.demo@example.invalid',
    'Website: www.demo-engineering.example',
    '100 Example Road, Demo City',
  ].join('\n'));

  assert.equal(result.name, 'ALEX DEMO');
  assert.equal(result.company, 'DEMO ENGINEERING CO., LTD.');
  assert.equal(result.department, 'Project Controls Department');
  assert.equal(result.position, 'Senior Manager');
  assert.equal(result.mobile, '+1 202-555-0142');
  assert.equal(result.telephone, '+1 202-555-0143');
  assert.equal(result.fax, '+1 202-555-0144');
  assert.equal(result.homepage, 'www.demo-engineering.example');
});

test('parses a Vietnamese synthetic card without rejecting a long Vietnamese name', () => {
  const result = parseBusinessCardText([
    'NGUYEN VAN DEMO',
    'CÔNG TY DEMO VIETNAM JSC',
    'Phòng Dự án',
    'Project Manager',
    'Di động: +84 912 345 678',
    'Điện thoại: +84 24 1234 5678',
    'demo.vn@example.invalid',
    'www.demo-vietnam.example',
    'Địa chỉ: 10 Đường Mẫu, Quận 1, Thành phố Demo',
  ].join('\n'));

  assert.equal(result.name, 'NGUYEN VAN DEMO');
  assert.equal(result.company, 'CÔNG TY DEMO VIETNAM JSC');
  assert.equal(result.department, 'Phòng Dự án');
  assert.equal(result.position, 'Project Manager');
  assert.equal(result.mobile, '+84 912 345 678');
  assert.equal(result.telephone, '+84 24 1234 5678');
  assert.equal(result.address, '10 Đường Mẫu, Quận 1, Thành phố Demo');
});

test('handles mixed language text, blank OCR and noisy punctuation', () => {
  const mixed = parseBusinessCardTextDetailed('Name: DEMO USER\n회사: DEMO 엔지니어링 (주)\nDepartment: 개발팀\nPosition: Manager\nM | 010.2345.6789\nmail.user@example.invalid', { overallConfidence: 0.68 });
  assert.equal(mixed.contact.name, 'DEMO USER');
  assert.equal(mixed.contact.company, 'DEMO 엔지니어링 (주)');
  assert.equal(mixed.contact.department, '개발팀');
  assert.equal(mixed.contact.position, 'Manager');
  assert.equal(mixed.contact.mobile, '010.2345.6789');
  assert.ok(mixed.warnings.includes('LOW_OVERALL_CONFIDENCE'));
  assert.deepEqual(parseBusinessCardText('   \n\u0000  '), {
    name: '', company: '', department: '', position: '', mobile: '', telephone: '', fax: '', email: '', homepage: '', address: '',
  });
  assert.equal(getConfidenceLevel(undefined), 'UNKNOWN');
  assert.equal(getConfidenceLevel(null), 'UNKNOWN');
  assert.equal(getConfidenceLevel(0.69), 'LOW');
  assert.equal(getConfidenceLevel(0.7), 'MEDIUM');
  assert.equal(getConfidenceLevel(0.9), 'HIGH');
});

test('keeps the browser OCR boundary free of fixed contacts, fixed confidence and image persistence', () => {
  const workspaceSource = readFileSync(new URL('../components/handoff/BusinessCardWorkspace.tsx', import.meta.url), 'utf8');
  const localOcrSource = readFileSync(new URL('./localBusinessCardOcr.ts', import.meta.url), 'utf8');
  const forbidden = [
    ['데모 명함', ' 담당자'].join(''),
    ['DEMO 신규', ' 파트너'].join(''),
    ['Demo Card', ' Contact VN'].join(''),
    ['DEMO Vietnam', ' Partner'].join(''),
    ['business.card.kr', '@example.invalid'].join(''),
    ['business.card.vn', '@example.invalid'].join(''),
  ];
  forbidden.forEach((value) => assert.equal(workspaceSource.includes(value), false));
  assert.equal(workspaceSource.includes('setConfidence(Object.fromEntries'), false);
  assert.match(localOcrSource, /await import\('tesseract\.js'\)/);
  assert.equal(/localStorage|sessionStorage|fetch\s*\(/.test(localOcrSource), false);
  assert.match(workspaceSource, /canUseLocalBusinessCardOcr\(contactBoundary\.mode\)/);
});

test('selects company-scoped local languages and never enables local OCR in server modes', () => {
  assert.equal(defaultBusinessCardLanguageProfile('CON_COST'), 'KO_EN');
  assert.equal(defaultBusinessCardLanguageProfile('VIET_QS'), 'VI_EN');
  assert.deepEqual(resolveBusinessCardLanguages('AUTO', 'CON_COST'), ['kor', 'eng']);
  assert.deepEqual(resolveBusinessCardLanguages('AUTO', 'VIET_QS'), ['vie', 'eng']);
  assert.deepEqual(resolveBusinessCardLanguages('EN', 'VIET_QS'), ['eng']);
  assert.equal(canUseLocalBusinessCardOcr('DEMO_LOCAL'), true);
  assert.equal(canUseLocalBusinessCardOcr('API_SANDBOX'), false);
  assert.equal(canUseLocalBusinessCardOcr('PRODUCTION_SERVER'), false);
});
