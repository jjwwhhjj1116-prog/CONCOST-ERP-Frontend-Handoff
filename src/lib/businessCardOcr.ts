export type BusinessCardFields = {
  name: string;
  company: string;
  department: string;
  position: string;
  mobile: string;
  telephone: string;
  fax: string;
  email: string;
  homepage: string;
  address: string;
};

export const BUSINESS_CARD_FIELD_KEYS = [
  'name',
  'company',
  'department',
  'position',
  'mobile',
  'telephone',
  'fax',
  'email',
  'homepage',
  'address',
] as const satisfies readonly (keyof BusinessCardFields)[];

export type BusinessCardLanguageProfile = 'AUTO' | 'KO_EN' | 'VI_EN' | 'EN';
export type BusinessCardConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
export type BusinessCardFieldConfidence = Partial<Record<keyof BusinessCardFields, number | null>>;
export type BusinessCardOcrEngine = 'LOCAL_TESSERACT' | 'BACKEND_PROVIDER';

export interface BusinessCardOcrLine {
  text: string;
  confidence: number;
}

export type BusinessCardOcrBoxKind = 'LINE' | 'WORD';

export interface BusinessCardOcrBox {
  id: string;
  kind: BusinessCardOcrBoxKind;
  text: string;
  confidence: number;
  /** Normalized coordinates in the 0..1 range. */
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
  lineIndex?: number;
  blockIndex?: number;
  wordIndex?: number;
}

export type BusinessCardFieldCandidate = {
  id: string;
  value: string;
  field: keyof BusinessCardFields;
  ocrConfidence: number;
  patternScore: number;
  labelScore: number;
  layoutScore: number;
  semanticScore: number;
  exclusionPenalty: number;
  finalScore: number;
  sourceBoxIds: string[];
  reason: string[];
  rejectedReason?: string;
};

export type BusinessCardOcrPassSummary = {
  id: string;
  imageMode: 'STANDARD' | 'CONTRAST' | 'THRESHOLD';
  rotation: 0 | 90 | 180 | 270;
  score: number;
  overallConfidence: number;
  requiredFieldCoverage: number;
};

export type BusinessCardCaptureQuality = {
  score: number;
  width: number;
  height: number;
  contrast: number;
  sharpness: number;
  warnings: string[];
};

export type BusinessCardOcrEvidence = {
  boxes: BusinessCardOcrBox[];
  candidates: BusinessCardFieldCandidate[];
  selectedCandidateIds: Partial<Record<keyof BusinessCardFields, string>>;
  passes?: BusinessCardOcrPassSummary[];
  selectedPassId?: string;
  captureQuality?: BusinessCardCaptureQuality;
};

export type BusinessCardOcrResult = {
  contact: BusinessCardFields;
  overallConfidence: number | null;
  /** @deprecated Use overallConfidence. Kept for the existing provider adapter contract. */
  confidence: number;
  fieldConfidence: BusinessCardFieldConfidence;
  language?: string;
  languageProfile: string[];
  selectedLanguageProfile?: BusinessCardLanguageProfile;
  engine?: BusinessCardOcrEngine;
  engineVersion?: string;
  rawText: string;
  warnings: string[];
  evidence?: BusinessCardOcrEvidence;
};

const emptyContact = (): BusinessCardFields => ({ name: '', company: '', department: '', position: '', mobile: '', telephone: '', fax: '', email: '', homepage: '', address: '' });
const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
const list = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const roundConfidence = (value: number) => Math.round(clamp(value) * 100) / 100;
const normalizeConfidence = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return clamp(numeric > 1 ? numeric / 100 : numeric);
};

function firstField(value: unknown) {
  const item = record(list(value)[0]);
  return item ? text(item.text) || text(record(item.formatted)?.value) : '';
}

function firstFieldConfidence(value: unknown) {
  const item = record(list(value)[0]);
  return item ? normalizeConfidence(item.confidenceScore) : 0;
}

function confidenceOf(result: Record<string, unknown>) {
  const values = Object.values(result)
    .flatMap((value) => list(value))
    .map(record)
    .filter((value): value is Record<string, unknown> => Boolean(value))
    .map((value) => normalizeConfidence(value.confidenceScore))
    .filter((value) => value > 0);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function cleanLine(value: string) {
  return value.replace(/[|]+/g, ' ').replace(/\s+/g, ' ').trim();
}

const COMPANY_PATTERN = /(주식회사|\(주\)|㈜|유한회사|건설|건축|엔지니어링|컨설팅|CON.?COST|VIET\s*QS|CO\.?\b|CORP(?:ORATION)?\.?\b|COMPANY|LTD\.?\b|INC\.?\b|LLC\b|JSC\b|ENGINEERING|CONSTRUCTION|CÔNG\s*TY|CONG\s*TY|CTY\b|TNHH|CỔ\s*PHẦN|CO\s*PHAN)/i;
const DEPARTMENT_PATTERN = /(본부|센터|사업부|[가-힣A-Za-zÀ-ỹ]+(?:팀|부|실|파트)|department|dept\.?\b|division|team\b|center\b|section\b|phòng(?:\s+[A-Za-zÀ-ỹ]+){0,3}|phong(?:\s+[A-Za-zÀ-ỹ]+){0,3}|ban(?:\s+[A-Za-zÀ-ỹ]+){0,3})/i;
const POSITION_PATTERN = /(대표이사|대표|부사장|사장|전무|상무|이사|본부장|센터장|실장|팀장|부장|차장|과장|대리|주임|프로|선임|PM\b|general manager|senior manager|project manager|vice president|manager|director|president|engineer|consultant|lead\b|chief|ceo|giám đốc|giam doc|trưởng(?:\s+[A-Za-zÀ-ỹ]+){0,2}|truong(?:\s+[A-Za-zÀ-ỹ]+){0,2}|quản lý|quan ly)/i;
const CODE_TOKEN_PATTERN = /\b(?:NO|BIM|VER|ID|CODE)[.\-_ ]?\d[A-Z0-9._-]*\b|\b[A-Z]{2,}[._-]\d[A-Z0-9._-]*\b|\b[A-Z]{1,4}\d{2,}\b/gi;
const LOGO_TOKEN_PATTERN = /^(?:CON\s*[-·]?\s*COST|CONCOST|CON\s*COR|VIET\s*QS|NO\.?\s*1|SINCE\s*\d{4})$/i;

function roundScore(value: number) {
  return Math.round(clamp(value) * 1000) / 1000;
}

function normalizeComparable(value: string) {
  return cleanLine(value).replace(/[^A-Za-zÀ-ỹ가-힣0-9]/g, '').toLocaleLowerCase();
}

function findSourceBoxes(value: string, boxes: BusinessCardOcrBox[]) {
  const needle = normalizeComparable(value);
  if (!needle) return [];
  const matching = boxes.filter((box) => {
    const haystack = normalizeComparable(box.text);
    return haystack === needle || haystack.includes(needle) || needle.includes(haystack);
  });
  const lineMatches = matching.filter((box) => box.kind === 'LINE');
  return (lineMatches.length ? lineMatches : matching).map((box) => box.id);
}

function boxesForIds(ids: string[], boxes: BusinessCardOcrBox[]) {
  const idSet = new Set(ids);
  return boxes.filter((box) => idSet.has(box.id));
}

function candidateHeightScore(sourceBoxes: BusinessCardOcrBox[], allBoxes: BusinessCardOcrBox[]) {
  const lineBoxes = allBoxes.filter((box) => box.kind === 'LINE' && box.height > 0);
  if (!sourceBoxes.length || !lineBoxes.length) return 0.5;
  const ordered = lineBoxes.map((box) => box.height).sort((a, b) => a - b);
  const median = ordered[Math.floor(ordered.length / 2)] || 1;
  const height = Math.max(...sourceBoxes.map((box) => box.height));
  return clamp(0.45 + ((height / median) - 1) * 0.35);
}

function candidateAdjacencyScore(value: string, field: keyof BusinessCardFields, boxes: BusinessCardOcrBox[]) {
  const ids = findSourceBoxes(value, boxes);
  const source = boxesForIds(ids, boxes).filter((box) => box.kind === 'LINE');
  if (!source.length) return 0.5;
  if (field !== 'name') return 0.55;
  const anchor = source[0];
  const nearby = boxes.filter((box) => box.kind === 'LINE'
    && box.id !== anchor.id
    && Math.abs(box.y0 - anchor.y1) <= Math.max(0.12, anchor.height * 3));
  return nearby.some((box) => looksLikeDepartment(box.text) || looksLikePosition(box.text)) ? 0.95 : candidateHeightScore(source, boxes);
}

function isValidHostname(value: string) {
  const cleaned = value.trim().replace(/[),;]+$/, '');
  const withScheme = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
  try {
    const hostname = new URL(withScheme).hostname.replace(/^www\./i, '');
    const labels = hostname.split('.');
    const tld = labels.at(-1) ?? '';
    return labels.length >= 2
      && /^[A-Za-z]{2,}$/.test(tld)
      && labels.every((label) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/.test(label));
  } catch {
    return false;
  }
}

function isLogoLike(value: string) {
  const cleaned = cleanLine(value);
  return LOGO_TOKEN_PATTERN.test(cleaned)
    || /^(?:CON|COST|VIET|QS)(?:\s+(?:CON|COST|VIET|QS)){0,2}$/i.test(cleaned);
}

function isValidPersonName(value: string) {
  const cleaned = stripLabel(value, 'name|full\\s*name|이름|성명|họ\\s*tên|ho\\s*ten');
  if (!cleaned || cleaned.length > 42 || /\d|@|https?:|www\./i.test(cleaned)) return false;
  if (isLogoLike(cleaned) || COMPANY_PATTERN.test(cleaned) || DEPARTMENT_PATTERN.test(cleaned) || POSITION_PATTERN.test(cleaned)) return false;
  const withoutDemo = cleaned.replace(/^\[DEMO\]\s*/i, '');
  if (/^[가-힣]{2,6}(?:\s+[가-힣]{1,8}){0,2}$/.test(withoutDemo)) return true;
  const words = withoutDemo.split(/\s+/).filter(Boolean);
  return words.length >= 2 && words.length <= 5 && words.every((word) => /^[A-Za-zÀ-ỹ][A-Za-zÀ-ỹ'.-]*$/.test(word));
}

function cleanCodeTokens(value: string) {
  return cleanLine(value.replace(CODE_TOKEN_PATTERN, ''));
}

function extractDepartmentAndPosition(value: string) {
  const fieldLabels = 'department|dept\\.?|division|부서|소속|phòng|phong|ban|position|title|직급|직책|chức\\s*vụ|chuc\\s*vu';
  const withoutLabel = new RegExp(`^(?:${fieldLabels})\\s*[:：]`, 'i').test(value)
    ? stripLabel(value, fieldLabels)
    : value;
  const cleaned = cleanCodeTokens(withoutLabel);
  const positionMatch = cleaned.match(POSITION_PATTERN)?.[0] ?? '';
  const departmentSource = cleanLine(cleaned.replace(POSITION_PATTERN, ''));
  const departmentMatch = looksLikeDepartment(departmentSource)
    ? departmentSource
    : departmentSource.match(DEPARTMENT_PATTERN)?.[0] ?? '';
  return { department: cleanLine(departmentMatch), position: cleanLine(positionMatch) };
}

function createCandidate(
  field: keyof BusinessCardFields,
  value: string,
  scores: { pattern: number; label: number; layout?: number; semantic: number; penalty?: number },
  boxes: BusinessCardOcrBox[],
  evidenceLines: BusinessCardOcrLine[],
  overallConfidence: number,
  reason: string[],
  rejectedReason?: string,
): BusinessCardFieldCandidate {
  const sourceBoxIds = findSourceBoxes(value, boxes);
  const ocrConfidence = lineConfidence(value, evidenceLines, overallConfidence || 0.78);
  const layoutScore = scores.layout ?? candidateAdjacencyScore(value, field, boxes);
  const exclusionPenalty = scores.penalty ?? 0;
  const finalScore = roundScore(
    ocrConfidence * 0.28
    + scores.pattern * 0.25
    + scores.label * 0.17
    + layoutScore * 0.15
    + scores.semantic * 0.15
    - exclusionPenalty,
  );
  return {
    id: `${field}:${normalizeComparable(value) || 'empty'}`,
    value,
    field,
    ocrConfidence: roundScore(ocrConfidence),
    patternScore: roundScore(scores.pattern),
    labelScore: roundScore(scores.label),
    layoutScore: roundScore(layoutScore),
    semanticScore: roundScore(scores.semantic),
    exclusionPenalty: roundScore(exclusionPenalty),
    finalScore,
    sourceBoxIds,
    reason,
    rejectedReason,
  };
}

function chooseCandidate(candidates: BusinessCardFieldCandidate[], minimumScore: number) {
  const ordered = [...candidates].sort((a, b) => b.finalScore - a.finalScore);
  const selected = ordered.find((candidate) => !candidate.rejectedReason && candidate.finalScore >= minimumScore);
  return { selected, ordered };
}

function syntheticBoxes(lines: string[]): BusinessCardOcrBox[] {
  const height = lines.length ? 1 / lines.length : 1;
  return lines.map((line, index) => ({
    id: `line-${index}`,
    kind: 'LINE' as const,
    text: line,
    confidence: 0.78,
    x0: 0,
    y0: index * height,
    x1: 1,
    y1: Math.min(1, (index + 1) * height),
    width: 1,
    height,
    lineIndex: index,
    blockIndex: 0,
  }));
}

function multilineAddress(lines: string[], labeled: { value: string; line: string } | null) {
  if (!labeled) return lines.find(looksLikeAddress) ?? '';
  const start = lines.indexOf(labeled.line);
  const parts = [labeled.value];
  for (let index = start + 1; index < Math.min(lines.length, start + 3); index += 1) {
    const line = lines[index];
    if (looksLikeContactLine(line) || looksLikeCompany(line) || looksLikeDepartment(line) || looksLikePosition(line)) break;
    if (/^(?:name|company|department|position|mobile|tel|fax|email|web|website)\b/i.test(line)) break;
    if (/\d|street|road|district|city|province|구\b|로\b|길\b|동\b|호\b|quận|phường|đường/i.test(line)) parts.push(line);
    else break;
  }
  return cleanLine(parts.join(' '));
}

function stripLabel(line: string, labels: string) {
  return cleanLine(line.replace(new RegExp(`^\\s*(?:${labels})\\s*[:：|.-]?\\s*`, 'i'), ''));
}

function labeledValue(lines: string[], labels: string) {
  const pattern = new RegExp(`^\\s*(?:${labels})\\s*[:：|.-]?\\s*(.+)$`, 'i');
  for (const line of lines) {
    const match = line.match(pattern);
    if (match?.[1]) return { value: cleanLine(match[1]), line, quality: 0.96 };
  }
  return null;
}

function lineConfidence(value: string, lines: BusinessCardOcrLine[], fallback: number) {
  const needle = value.replace(/\s+/g, '').toLocaleLowerCase();
  if (!needle) return 0;
  const matching = lines.filter((line) => {
    const haystack = line.text.replace(/\s+/g, '').toLocaleLowerCase();
    return haystack.includes(needle) || needle.includes(haystack);
  });
  if (!matching.length) return fallback;
  const measured = Math.max(...matching.map((line) => normalizeConfidence(line.confidence)));
  return measured > 0 ? measured : fallback;
}

function looksLikeContactLine(line: string) {
  return /@|https?:\/\/|www\.|\b(?:tel|fax|mobile|email|web|phone|m|t|f)\b|(?:전화|휴대|팩스|이메일|홈페이지)|(?:điện thoại|di động|email|website)/i.test(line)
    || /\d{2,4}[\s().-]+\d{3,4}[\s.-]+\d{4}/.test(line);
}

function looksLikeCompany(line: string) {
  return /(주식회사|\(주\)|㈜|유한회사|건설|건축|기술(?!본부|센터|팀|부|실|파트)|엔지니어링|컨설팅|CON.?COST|VIET\s*QS|CO\.?\b|CORP(?:ORATION)?\.?\b|COMPANY|LTD\.?\b|INC\.?\b|LLC\b|JSC\b|ENGINEERING|CONSTRUCTION|CÔNG\s*TY|CONG\s*TY|CTY\b|TNHH|CỔ\s*PHẦN|CO\s*PHAN)/i.test(line);
}

function looksLikeDepartment(line: string) {
  return /(부서|본부|센터|사업부|영업팀|개발팀|기술팀|\S+[팀부실파트]\b|department|dept\.?\b|division|team\b|center\b|section\b|phòng|phong\b|ban\b)/i.test(line);
}

function looksLikePosition(line: string) {
  return /(대표이사|대표|부사장|사장|전무|상무|이사|본부장|센터장|실장|팀장|부장|차장|과장|대리|주임|프로|선임|PM\b|매니저|general manager|senior manager|project manager|vice president|manager|director|president|engineer|consultant|lead\b|chief|ceo|giám đốc|giam doc|trưởng|truong|quản lý|quan ly)/i.test(line);
}

function looksLikeAddress(line: string) {
  return /(주소|\b\d{5}\b|특별시|광역시|특별자치|\S+도\b|\S+시\b|\S+군\b|\S+구\b|\S+로\b|\S+길\b|street|\bst\.?\b|road|\brd\.?\b|avenue|district|city|province|address|địa chỉ|dia chi|quận|quan\s|phường|phuong\s|đường|duong\s|thành phố|thanh pho)/i.test(line);
}

function looksLikeFixtureHeading(line: string) {
  return /(?:synthetic|fixture|demo\s+business\s+card)/i.test(line);
}

function detectLanguage(rawText: string) {
  if (/[가-힣]/.test(rawText)) return 'ko';
  if (/[ăâđêôơưĂÂĐÊÔƠƯ]|(?:công ty|điện thoại|địa chỉ|giám đốc|trưởng phòng)/i.test(rawText)) return 'vi';
  return 'en';
}

export function getConfidenceLevel(value: number | null | undefined): BusinessCardConfidenceLevel {
  if (value === null || value === undefined || value <= 0) return 'UNKNOWN';
  if (value >= 0.9) return 'HIGH';
  if (value >= 0.7) return 'MEDIUM';
  return 'LOW';
}

export function parseBusinessCardTextDetailed(
  rawText: string,
  options: {
    overallConfidence?: number;
    lines?: BusinessCardOcrLine[];
    boxes?: BusinessCardOcrBox[];
    languageProfile?: BusinessCardLanguageProfile;
    languages?: string[];
    engine?: BusinessCardOcrEngine;
    engineVersion?: string;
  } = {},
): BusinessCardOcrResult {
  const normalizedRawText = rawText.replace(/\u0000/g, '').trim();
  const normalizedForPatterns = normalizedRawText
    .replace(/[＠﹫]/g, '@')
    .replace(/[．。]/g, '.')
    .replace(/\s*@\s*/g, '@')
    .replace(/([A-Z0-9])\s*\.\s*(?=[A-Z0-9])/gi, '$1.');
  const lines = normalizedRawText.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const evidenceLines = options.lines ?? lines.map((line) => ({ text: line, confidence: options.overallConfidence ?? 0 }));
  const overallConfidence = roundConfidence(options.overallConfidence ?? 0);
  const boxes = options.boxes?.length ? options.boxes : syntheticBoxes(lines);
  const candidates: BusinessCardFieldCandidate[] = [];
  const add = (
    field: keyof BusinessCardFields,
    value: string,
    scores: { pattern: number; label: number; layout?: number; semantic: number; penalty?: number },
    reason: string[],
    rejectedReason?: string,
  ) => {
    const cleaned = cleanLine(value);
    if (!cleaned) return;
    candidates.push(createCandidate(field, cleaned, scores, boxes, evidenceLines, overallConfidence, reason, rejectedReason));
  };

  const emailMatches = Array.from(normalizedForPatterns.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi));
  emailMatches.forEach((match) => add('email', match[0], { pattern: 1, label: 0.75, semantic: 1 }, ['EMAIL_PATTERN']));

  const homepageTokens = lines.flatMap((line) => {
    if (line.includes('@')) return [];
    const stripped = stripLabel(line, 'website|web|homepage|홈페이지|trang\\s*web');
    return Array.from(stripped.matchAll(/(?:https?:\/\/|www\.)[^\s,;]+|\b[A-Z0-9-]+(?:\.[A-Z0-9-]+)+\b/gi))
      .map((match) => ({ value: match[0].replace(/[).,;]+$/, ''), labeled: /^(?:website|web|homepage|홈페이지|trang\s*web)/i.test(line) }));
  });
  homepageTokens.forEach(({ value, labeled }) => add(
    'homepage',
    value,
    { pattern: isValidHostname(value) ? 1 : 0.05, label: labeled ? 1 : 0.35, semantic: isValidHostname(value) ? 1 : 0.05, penalty: isValidHostname(value) ? 0 : 0.7 },
    [labeled ? 'HOMEPAGE_LABEL' : 'DOMAIN_PATTERN'],
    isValidHostname(value) ? undefined : 'INVALID_HOSTNAME_OR_NUMERIC_TLD',
  ));

  const phonePattern = /(?:\+?84(?:[\s.-]?\d){9,10}|0[35789]\d(?:[\s.-]?\d){7}|(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{4})/g;
  const phoneCandidates = lines.flatMap((line) => Array.from(line.matchAll(phonePattern)).map((match) => {
    const labelContext = line
      .slice(Math.max(0, (match.index ?? 0) - 24), match.index ?? 0)
      .split(/[|·;,]/)
      .at(-1)
      ?.trim() ?? '';
    return { value: match[0].trim(), line, labelContext };
  }));
  const mobileCandidate = phoneCandidates.find(({ value, labelContext }) => /(?:010|01[1-9]|\+?82[\s.-]?10|\+?84[\s.-]?(?:3|5|7|8|9))/.test(value.replace(/[()]/g, '')) || /\b(?:m|mobile|cell|휴대|di động|di dong|đtdd)\b/i.test(labelContext));
  const faxCandidate = phoneCandidates.find(({ labelContext }) => /\b(?:f|fax)\b|팩스/i.test(labelContext));
  const telephoneCandidate = phoneCandidates.find(({ value, labelContext }) => value !== mobileCandidate?.value && value !== faxCandidate?.value && /\b(?:t|tel|phone)\b|전화|điện thoại|dien thoai/i.test(labelContext))
    ?? phoneCandidates.find(({ value }) => value !== mobileCandidate?.value && value !== faxCandidate?.value);

  if (mobileCandidate) add('mobile', mobileCandidate.value, { pattern: 1, label: /\b(?:m|mobile|휴대|di động|di dong|đtdd)\b/i.test(mobileCandidate.line) ? 1 : 0.55, semantic: 1 }, ['MOBILE_PATTERN']);
  if (telephoneCandidate) add('telephone', telephoneCandidate.value, { pattern: 0.98, label: /\b(?:t|tel|phone)\b|전화|điện thoại|dien thoai/i.test(telephoneCandidate.line) ? 1 : 0.45, semantic: 0.95 }, ['TELEPHONE_PATTERN']);
  if (faxCandidate) add('fax', faxCandidate.value, { pattern: 1, label: 1, semantic: 1 }, ['FAX_LABEL']);

  const labeledName = labeledValue(lines, 'name|full\\s*name|이름|성명|họ\\s*tên|ho\\s*ten');
  const companyLabelCandidate = labeledValue(lines, 'company|organization|회사|업체|công\\s*ty|cong\\s*ty');
  const labeledCompany = companyLabelCandidate
    && /^(?:công\s*ty|cong\s*ty)\b/i.test(companyLabelCandidate.line)
    && !/[:：]/.test(companyLabelCandidate.line)
      ? null
      : companyLabelCandidate;
  const departmentLabelCandidate = labeledValue(lines, 'department|dept\\.?|division|부서|소속|phòng|phong|ban');
  const labeledDepartment = departmentLabelCandidate
    && /^(?:phòng|phong|ban)\b/i.test(departmentLabelCandidate.line)
    && !/[:：]/.test(departmentLabelCandidate.line)
      ? null
      : departmentLabelCandidate;
  const labeledPosition = labeledValue(lines, 'position|title|직급|직책|chức\\s*vụ|chuc\\s*vu');
  const labeledAddress = labeledValue(lines, 'address|주소|địa\\s*chỉ|dia\\s*chi');

  lines.forEach((line) => {
    const labeled = labeledCompany?.line === line;
    const value = labeled ? labeledCompany.value : line;
    if (looksLikeCompany(value)) add('company', value, { pattern: 0.98, label: labeled ? 1 : 0.25, semantic: 0.98 }, [labeled ? 'COMPANY_LABEL' : 'COMPANY_SEMANTIC']);

    const labeledDept = labeledDepartment?.line === line;
    const labeledRole = labeledPosition?.line === line;
    const extracted = looksLikeCompany(line) ? { department: '', position: '' } : extractDepartmentAndPosition(line);
    if (extracted.department && !looksLikeCompany(extracted.department)) {
      add('department', extracted.department, { pattern: 0.92, label: labeledDept ? 1 : 0.25, semantic: 0.94 }, [labeledDept ? 'DEPARTMENT_LABEL' : 'DEPARTMENT_SEMANTIC']);
    }
    if (extracted.position && !looksLikeCompany(extracted.position)) {
      add('position', extracted.position, { pattern: 0.95, label: labeledRole ? 1 : 0.3, semantic: 0.96 }, [labeledRole ? 'POSITION_LABEL' : 'POSITION_SEMANTIC']);
    }

    const nameValue = labeledName?.line === line
      ? labeledName.value
      : stripLabel(line, 'name|full\\s*name|이름|성명|họ\\s*tên|ho\\s*ten');
    const nameRejected = isLogoLike(nameValue)
      ? 'LOGO_OR_BRAND_TEXT'
      : looksLikeCompany(nameValue)
        ? 'COMPANY_TEXT'
        : looksLikeDepartment(nameValue) || looksLikePosition(nameValue)
          ? 'ORGANIZATION_OR_POSITION_TEXT'
          : looksLikeContactLine(nameValue) || looksLikeAddress(nameValue) || looksLikeFixtureHeading(nameValue)
            ? 'NON_PERSON_TEXT'
            : isValidPersonName(nameValue)
              ? undefined
              : 'PERSON_NAME_VALIDATION_FAILED';
    add(
      'name',
      nameValue,
      { pattern: nameRejected ? 0.05 : 0.88, label: labeledName?.line === line ? 1 : 0.18, semantic: nameRejected ? 0.05 : 0.95, penalty: nameRejected ? 0.65 : 0 },
      [labeledName?.line === line ? 'NAME_LABEL' : 'PERSON_NAME_SHAPE'],
      nameRejected,
    );
  });

  if (labeledDepartment && !candidates.some((item) => item.field === 'department' && item.value === labeledDepartment.value)) {
    const cleaned = cleanCodeTokens(labeledDepartment.value);
    add('department', cleaned, { pattern: 0.85, label: 1, semantic: 0.9 }, ['DEPARTMENT_LABEL']);
  }
  if (labeledPosition && !candidates.some((item) => item.field === 'position' && item.value === labeledPosition.value)) {
    const cleaned = cleanCodeTokens(labeledPosition.value);
    add('position', cleaned, { pattern: 0.88, label: 1, semantic: 0.92 }, ['POSITION_LABEL']);
  }

  const address = multilineAddress(lines, labeledAddress);
  if (address) add('address', address, { pattern: 0.88, label: labeledAddress ? 1 : 0.25, semantic: 0.92 }, [labeledAddress ? 'ADDRESS_LABEL' : 'ADDRESS_SEMANTIC']);

  const thresholds: Record<keyof BusinessCardFields, number> = {
    name: 0.58,
    company: 0.58,
    department: 0.56,
    position: 0.56,
    mobile: 0.62,
    telephone: 0.58,
    fax: 0.62,
    email: 0.65,
    homepage: 0.68,
    address: 0.56,
  };
  const contact = emptyContact();
  const fieldConfidence: BusinessCardFieldConfidence = {};
  const selectedCandidateIds: Partial<Record<keyof BusinessCardFields, string>> = {};
  const orderedCandidates: BusinessCardFieldCandidate[] = [];
  BUSINESS_CARD_FIELD_KEYS.forEach((field) => {
    const selection = chooseCandidate(candidates.filter((candidate) => candidate.field === field), thresholds[field]);
    orderedCandidates.push(...selection.ordered);
    if (!selection.selected) {
      fieldConfidence[field] = null;
      return;
    }
    contact[field] = selection.selected.value;
    fieldConfidence[field] = selection.selected.finalScore;
    selectedCandidateIds[field] = selection.selected.id;
  });

  const warnings: string[] = [];
  if (!contact.name && !contact.company) warnings.push('PARSER_NO_CANDIDATE');
  if (!contact.name || !contact.company) warnings.push('REVIEW_REQUIRED_IDENTITY');
  if (overallConfidence > 0 && overallConfidence < 0.7) warnings.push('LOW_OVERALL_CONFIDENCE');
  if (Object.entries(fieldConfidence).some(([key, value]) => Boolean(contact[key as keyof BusinessCardFields]) && ['LOW', 'UNKNOWN'].includes(getConfidenceLevel(value)))) warnings.push('LOW_CONFIDENCE');

  return {
    contact,
    overallConfidence: overallConfidence || null,
    confidence: overallConfidence,
    fieldConfidence,
    language: detectLanguage(normalizedRawText),
    languageProfile: options.languages ?? [],
    selectedLanguageProfile: options.languageProfile,
    engine: options.engine,
    engineVersion: options.engineVersion,
    rawText: normalizedRawText,
    warnings,
    evidence: {
      boxes,
      candidates: orderedCandidates,
      selectedCandidateIds,
    },
  };
}

export function parseBusinessCardText(rawText: string): BusinessCardFields {
  return parseBusinessCardTextDetailed(rawText).contact;
}

export function normalizeBusinessCardOcr(payload: unknown): BusinessCardOcrResult {
  const root = record(payload);
  if (!root) throw new Error('OCR 응답 형식이 올바르지 않습니다.');
  const normalized = record(root.contact);
  if (normalized) {
    const contact = emptyContact();
    for (const key of BUSINESS_CARD_FIELD_KEYS) contact[key] = text(normalized[key]);
    const confidence = normalizeConfidence(root.confidence);
    const suppliedConfidence = record(root.fieldConfidence);
    const suppliedLanguages = list(root.languageProfile).map(text).filter(Boolean);
    const legacyLanguages = list(root.languages).map(text).filter(Boolean);
    const fieldConfidence = Object.fromEntries(BUSINESS_CARD_FIELD_KEYS.map((key) => {
      const supplied = normalizeConfidence(suppliedConfidence?.[key]);
      return [key, supplied > 0 ? supplied : null];
    }));
    return {
      contact,
      overallConfidence: confidence || null,
      confidence,
      fieldConfidence,
      language: text(root.language),
      languageProfile: suppliedLanguages.length ? suppliedLanguages : legacyLanguages,
      selectedLanguageProfile: (text(root.selectedLanguageProfile) || text(root.languageProfile)) as BusinessCardLanguageProfile || undefined,
      engine: 'BACKEND_PROVIDER',
      engineVersion: text(root.engineVersion) || text(root.engine) || undefined,
      rawText: text(root.rawText),
      warnings: list(root.warnings).map(text).filter(Boolean),
    };
  }

  const image = record(list(root.images)[0]);
  const nameCard = record(image?.nameCard);
  const result = record(nameCard?.result);
  if (result) {
    const contact: BusinessCardFields = {
      name: firstField(result.name), company: firstField(result.company), department: firstField(result.department), position: firstField(result.position),
      mobile: firstField(result.mobile), telephone: firstField(result.tel), fax: firstField(result.fax), email: firstField(result.email), homepage: firstField(result.homepage), address: firstField(result.address),
    };
    const fieldConfidence: BusinessCardFieldConfidence = {
      name: firstFieldConfidence(result.name), company: firstFieldConfidence(result.company), department: firstFieldConfidence(result.department), position: firstFieldConfidence(result.position),
      mobile: firstFieldConfidence(result.mobile), telephone: firstFieldConfidence(result.tel), fax: firstFieldConfidence(result.fax), email: firstFieldConfidence(result.email), homepage: firstFieldConfidence(result.homepage), address: firstFieldConfidence(result.address),
    };
    const confidence = confidenceOf(result);
    return {
      contact,
      overallConfidence: confidence || null,
      confidence,
      fieldConfidence,
      language: text(record(nameCard?.meta)?.estimatedLanguage),
      languageProfile: [text(record(nameCard?.meta)?.estimatedLanguage)].filter(Boolean),
      engine: 'BACKEND_PROVIDER',
      engineVersion: 'NAVER_CLOVA_OCR',
      rawText: text(root.rawText),
      warnings: [],
    };
  }

  const response = record(list(root.responses)[0]);
  const rawText = text(root.rawText) || text(record(response?.fullTextAnnotation)?.text) || firstField(response?.textAnnotations);
  if (rawText) return parseBusinessCardTextDetailed(rawText, {
    overallConfidence: normalizeConfidence(root.confidence),
    languages: list(root.languageProfile).map(text).filter(Boolean),
    engine: 'BACKEND_PROVIDER',
    engineVersion: text(root.engine) || undefined,
  });
  throw new Error('명함에서 인식된 연락처 정보가 없습니다.');
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

export async function analyzeBusinessCard(file: File): Promise<BusinessCardOcrResult> {
  if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error('JPG 또는 PNG 명함 이미지만 사용할 수 있습니다.');
  if (file.size > 10 * 1024 * 1024) throw new Error('명함 이미지는 10MB 이하여야 합니다.');
  const endpoint = process.env.NEXT_PUBLIC_BUSINESS_CARD_OCR_ENDPOINT;
  if (!endpoint) throw new Error('OCR 게이트웨이가 설정되지 않았습니다. docs/business-card-ocr-integration.md를 확인해 주세요.');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName: file.name, mimeType: file.type, dataBase64: await fileToBase64(file) }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(text(record(payload)?.message) || `OCR 요청에 실패했습니다. (${response.status})`);
  return normalizeBusinessCardOcr(payload);
}
