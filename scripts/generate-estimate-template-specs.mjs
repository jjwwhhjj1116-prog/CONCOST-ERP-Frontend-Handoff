import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = resolve(process.argv[2] || '../offday2/work-project-receive-estimate-sheet.js');
const outputPath = resolve('src/data/estimateTemplateSpecs.generated.json');
const source = await readFile(sourcePath, 'utf8');
const declaration = 'const ESTIMATE_EXCEL_SPECS = ';
const start = source.indexOf(declaration);

if (start < 0) throw new Error('ESTIMATE_EXCEL_SPECS declaration was not found');

const valueStart = start + declaration.length;
let depth = 0;
let quote = '';
let escaped = false;
let valueEnd = -1;

for (let index = valueStart; index < source.length; index += 1) {
  const character = source[index];
  if (quote) {
    if (escaped) escaped = false;
    else if (character === '\\') escaped = true;
    else if (character === quote) quote = '';
    continue;
  }
  if (character === '"' || character === "'") quote = character;
  else if (character === '{') depth += 1;
  else if (character === '}' && --depth === 0) {
    valueEnd = index + 1;
    break;
  }
}

if (valueEnd < 0) throw new Error('ESTIMATE_EXCEL_SPECS object is incomplete');

const raw = source.slice(valueStart, valueEnd);
const legacyIdentityReplacements = new Map([
  [["Tel: 02-2203", "-1463 / Fax: 02-2203", "-1464"].join(''), 'Tel/Fax: DEMO ONLY'],
  [["(05665) 서울시 송파구 백제", "고분로 46길 18 CC TOWER 5층"].join(''), '(DEMO) 합성 주소 · 실제 업무 사용 금지'],
  [["㈜컨코스트 대표이사 현", " 동 명 (인)"].join(''), '㈜컨코스트 합성 데모 승인자 (인)'],
]);

const sanitizeLegacyIdentity = (value) => {
  if (typeof value === 'string') {
    let sanitized = value;
    for (const [sourceValue, replacement] of legacyIdentityReplacements) {
      sanitized = sanitized.replaceAll(sourceValue, replacement);
    }
    if (sanitized.includes(['백제', '고분로'].join(''))) {
      return 'Tel/Fax: DEMO ONLY\n(DEMO) 합성 주소 · 실제 업무 사용 금지\n㈜컨코스트 합성 데모 승인자 (인)';
    }
    return sanitized;
  }
  if (Array.isArray(value)) return value.map(sanitizeLegacyIdentity);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sanitizeLegacyIdentity(entry)]));
  }
  return value;
};

const specs = sanitizeLegacyIdentity(JSON.parse(raw));
const templates = Object.fromEntries(Object.entries(specs).map(([type, spec]) => [type, {
  ...spec,
  sourceHash: createHash('sha256').update(JSON.stringify(spec)).digest('hex'),
}]));
const payload = {
  sourceFile: 'work-project-receive-estimate-sheet.js',
  sourceCommit: '4406d2607ace6b64e8a165e4aae8d67e082b992b',
  sourcePayloadHash: createHash('sha256').update(raw).digest('hex'),
  redactionVersion: 'pii-safe-v1',
  generatedAt: '2026-07-20T00:00:00.000Z',
  templates,
};

await writeFile(outputPath, `${JSON.stringify(payload)}\n`, 'utf8');
console.log(`Wrote ${outputPath}`);
