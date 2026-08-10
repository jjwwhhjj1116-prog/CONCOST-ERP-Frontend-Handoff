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
  return Math.max(...matching.map((line) => normalizeConfidence(line.confidence)));
}

function fieldScore(value: string, quality: number, lines: BusinessCardOcrLine[], overallConfidence: number): number | null {
  if (!value) return null;
  const evidence = lineConfidence(value, lines, overallConfidence || 0.55);
  return evidence > 0 ? roundConfidence(evidence * quality) : null;
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

  const email = normalizedForPatterns.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? '';
  const labeledHomepage = labeledValue(lines, 'website|web|homepage|홈페이지|trang\\s*web');
  const homepageLine = labeledHomepage?.value
    || normalizedForPatterns.split(/\r?\n/).find((line) => !line.includes('@') && /(?:https?:\/\/|www\.|\b[A-Z0-9-]+(?:\.[A-Z0-9-]+)+\b)/i.test(line))
    || '';
  const homepage = homepageLine.match(/(?:https?:\/\/|www\.)[^\s,;]+|\b[A-Z0-9-]+(?:\.[A-Z0-9-]+)+\b/i)?.[0]?.replace(/[).,;]+$/, '') ?? '';

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

  const companyLine = labeledCompany?.value || lines.find(looksLikeCompany) || '';
  const departmentLine = labeledDepartment?.value || lines.find((line) => looksLikeDepartment(line) && !looksLikeCompany(line)) || '';
  const positionLine = labeledPosition?.value || lines.find((line) => looksLikePosition(line) && !looksLikeCompany(line)) || '';
  const addressLine = labeledAddress?.value || lines.find(looksLikeAddress) || '';

  const excluded = new Set([
    companyLine,
    departmentLine,
    positionLine,
    addressLine,
    mobileCandidate?.line ?? '',
    telephoneCandidate?.line ?? '',
    faxCandidate?.line ?? '',
  ].filter(Boolean));
  const nameLine = (labeledName?.value || lines.find((line) => {
    const value = stripLabel(line, 'name|full\\s*name|이름|성명|họ\\s*tên|ho\\s*ten');
    return !excluded.has(line)
      && !looksLikeContactLine(line)
      && !looksLikeCompany(line)
      && !looksLikeDepartment(line)
      && !looksLikePosition(line)
      && !looksLikeAddress(line)
      && !looksLikeFixtureHeading(line)
      && /[A-Za-zÀ-ỹ가-힣]/.test(value)
      && !/\d/.test(value)
      && value.length >= 2
      && value.length <= 40;
  })) ?? '';

  const contact: BusinessCardFields = {
    name: labeledName?.value || nameLine,
    company: companyLine,
    department: departmentLine,
    position: positionLine,
    mobile: mobileCandidate?.value ?? '',
    telephone: telephoneCandidate?.value ?? '',
    fax: faxCandidate?.value ?? '',
    email,
    homepage,
    address: addressLine,
  };

  const fieldConfidence: BusinessCardFieldConfidence = {
    name: fieldScore(contact.name, labeledName ? 0.98 : 0.76, evidenceLines, overallConfidence),
    company: fieldScore(contact.company, labeledCompany ? 0.98 : 0.88, evidenceLines, overallConfidence),
    department: fieldScore(contact.department, labeledDepartment ? 0.97 : 0.83, evidenceLines, overallConfidence),
    position: fieldScore(contact.position, labeledPosition ? 0.97 : 0.84, evidenceLines, overallConfidence),
    mobile: fieldScore(contact.mobile, mobileCandidate && /\b(?:m|mobile|휴대|di động|di dong|đtdd)\b/i.test(mobileCandidate.line) ? 0.99 : 0.94, evidenceLines, overallConfidence),
    telephone: fieldScore(contact.telephone, telephoneCandidate && /\b(?:t|tel|phone)\b|전화|điện thoại|dien thoai/i.test(telephoneCandidate.line) ? 0.98 : 0.87, evidenceLines, overallConfidence),
    fax: fieldScore(contact.fax, faxCandidate ? 0.99 : 0.8, evidenceLines, overallConfidence),
    email: fieldScore(contact.email, 0.99, evidenceLines, overallConfidence),
    homepage: fieldScore(contact.homepage, 0.96, evidenceLines, overallConfidence),
    address: fieldScore(contact.address, labeledAddress ? 0.97 : 0.84, evidenceLines, overallConfidence),
  };

  const warnings: string[] = [];
  if (!contact.name && !contact.company) warnings.push('PARSER_NO_CANDIDATE');
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
