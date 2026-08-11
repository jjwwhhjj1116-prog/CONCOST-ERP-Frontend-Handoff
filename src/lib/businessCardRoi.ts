import type {
  BusinessCardFields,
  BusinessCardOcrBounds,
  BusinessCardOcrBox,
  BusinessCardRoiKind,
} from './businessCardOcr';

export type BusinessCardRoiCandidate = {
  id: string;
  kind: BusinessCardRoiKind;
  bounds: BusinessCardOcrBounds;
  sourceBoxIds: string[];
  reason: string[];
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const lineBoxes = (boxes: BusinessCardOcrBox[]) => boxes
  .filter((box) => box.kind === 'LINE' && box.text.trim())
  .sort((a, b) => a.y0 - b.y0 || a.x0 - b.x0);
const normalized = (value: string) => value.normalize('NFKC').replace(/\s+/g, ' ').trim();
const hangulName = /^[가-힣]{2,5}$/;
const vietName = /^(?:[A-ZÀ-Ỹ][A-Za-zÀ-ỹ'-]+\s+){1,4}[A-ZÀ-Ỹ][A-Za-zÀ-ỹ'-]+$/;
const contactSignal = /(?:^|\b)(?:tel|phone|mobile|fax|e-?mail)\b|@|(?:\+?\d[\d\s().-]{7,}\d)/i;
const addressSignal = /(?:주소|address|addr\.?|địa\s*chỉ|street|st\.?|road|rd\.?|ro\b|길\b|로\b|동\b|층\b|구\b|시\b)/i;
const departmentPositionSignal = /(?:부서|직급|직책|department|position|division|team|manager|director|engineer|팀|본부|센터|실장|팀장|부장|차장|과장|대리|프로|사원|giám\s*đốc|trưởng|phòng|ban)/i;
const exclusionSignal = /(?:con\s*-?\s*cost|viet\s*qs|no\.?\s*\d|www\.|https?:|@|bim\.?\s*\d|ver\.?\s*\d)/i;

function unionBounds(boxes: BusinessCardOcrBox[], padding = 0.025): BusinessCardOcrBounds {
  return {
    x0: clamp(Math.min(...boxes.map((box) => box.x0)) - padding),
    y0: clamp(Math.min(...boxes.map((box) => box.y0)) - padding),
    x1: clamp(Math.max(...boxes.map((box) => box.x1)) + padding),
    y1: clamp(Math.max(...boxes.map((box) => box.y1)) + padding),
  };
}

function candidate(id: string, kind: BusinessCardRoiKind, boxes: BusinessCardOcrBox[], reason: string[]) {
  if (!boxes.length) return null;
  return { id, kind, bounds: unionBounds(boxes), sourceBoxIds: boxes.map((box) => box.id), reason } satisfies BusinessCardRoiCandidate;
}

function near(box: BusinessCardOcrBox, target: BusinessCardOcrBox, maxGap: number) {
  return box.y0 >= target.y0 - maxGap && box.y1 <= target.y1 + maxGap;
}

export function detectBusinessCardRois(boxes: BusinessCardOcrBox[]): BusinessCardRoiCandidate[] {
  const lines = lineBoxes(boxes);
  if (!lines.length) return [];
  const heights = lines.map((box) => box.height).sort((a, b) => a - b);
  const prominentHeight = heights[Math.max(0, Math.floor(heights.length * 0.65))] ?? 0;
  const result: BusinessCardRoiCandidate[] = [];

  const name = lines
    .filter((box) => {
      const text = normalized(box.text);
      return (hangulName.test(text.replace(/\s/g, '')) || vietName.test(text))
        && !exclusionSignal.test(text)
        && !departmentPositionSignal.test(text)
        && !contactSignal.test(text)
        && box.height >= prominentHeight * 0.82;
    })
    .sort((a, b) => b.confidence + b.height * 100 - (a.confidence + a.height * 100))[0];
  const nameCandidate = candidate('roi-name', 'NAME_KO', name ? [name] : [], ['PERSON_NAME_SHAPE', 'PROMINENT_TEXT']);
  if (nameCandidate) result.push(nameCandidate);

  const departmentLines = lines.filter((box) => departmentPositionSignal.test(normalized(box.text)) && !contactSignal.test(box.text));
  const nearbyDepartment = name
    ? lines.filter((box) => box.id !== name.id && near(box, name, 0.18) && !contactSignal.test(box.text) && !addressSignal.test(box.text))
    : [];
  const departmentCandidate = candidate(
    'roi-department-position',
    'DEPARTMENT_POSITION',
    departmentLines.length ? departmentLines : nearbyDepartment.slice(0, 2),
    departmentLines.length ? ['DEPARTMENT_POSITION_LABEL'] : ['NEAR_PERSON_NAME'],
  );
  if (departmentCandidate) result.push(departmentCandidate);

  const addressSeeds = lines.filter((box) => addressSignal.test(normalized(box.text)) && !contactSignal.test(box.text));
  const addressLines = addressSeeds.flatMap((seed) => lines.filter((box) => box.id === seed.id || (box.y0 >= seed.y0 - 0.02 && box.y0 <= seed.y1 + 0.1 && !contactSignal.test(box.text))));
  const uniqueAddress = Array.from(new Map(addressLines.map((box) => [box.id, box])).values()).slice(0, 3);
  const addressCandidate = candidate('roi-address', 'ADDRESS', uniqueAddress, ['ADDRESS_LABEL_OR_SHAPE', 'MULTILINE_NEIGHBOR']);
  if (addressCandidate) result.push(addressCandidate);

  const contacts = lines.filter((box) => contactSignal.test(normalized(box.text)));
  const contactCandidate = candidate('roi-contact', 'CONTACT', contacts, ['CONTACT_PATTERN']);
  if (contactCandidate) result.push(contactCandidate);

  return result;
}

export function shouldAcceptBusinessCardRoiField(
  field: keyof BusinessCardFields,
  currentValue: string,
  currentConfidence: number | null | undefined,
  roiValue: string,
  roiConfidence: number,
) {
  const value = normalized(roiValue);
  if (!value) return false;
  if (field === 'name' && (!hangulName.test(value.replace(/\s/g, '')) && !vietName.test(value))) return false;
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(value)) return false;
  if (['telephone', 'mobile', 'fax'].includes(field) && !/(?:\+?\d[\d\s().-]{7,}\d)/.test(value)) return false;
  if (field === 'homepage' && !/(?:https?:\/\/|www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:\/\S*)?$/i.test(value)) return false;
  const threshold = currentValue ? (currentConfidence ?? 0) + 0.04 : 0.42;
  return roiConfidence >= threshold;
}

export function roiUpscaleFactor(bounds: BusinessCardOcrBounds) {
  const width = Math.max(0.01, bounds.x1 - bounds.x0);
  const height = Math.max(0.01, bounds.y1 - bounds.y0);
  return width < 0.42 || height < 0.16 ? 4 : 3;
}