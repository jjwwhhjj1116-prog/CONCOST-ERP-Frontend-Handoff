import type {
  BusinessCardOcrBox,
  BusinessCardPanel,
  BusinessCardPanelAnalysis,
  BusinessCardPanelImageSignal,
  BusinessCardPanelSelection,
} from './businessCardOcr';

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const lineBoxes = (boxes: BusinessCardOcrBox[]) => boxes.filter((box) => box.kind === 'LINE' && box.text.trim());

function scoreText(text: string) {
  const contactSignals = [
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)\d{3,4}[\s.-]?\d{4}/,
    /\b(?:tel|phone|mobile|fax|email|address|department|position)\b|(?:전화|휴대|팩스|이메일|주소|부서|직급|본부|팀)|(?:điện thoại|di động|địa chỉ|phòng)/i,
    /\b\d{5}\b|(?:로|길|street|road|tower|floor|building|district)\b/i,
  ];
  const promoSignals = [
    /\b(?:since\s*\d{4}|no\.?\s*1|service|solution|consulting)\b|(?:대한민국\s*no\.?\s*1|서비스|컨설팅\s*기업|공사비)/i,
    /(?:https?:\/\/|www\.)[^\s]+/i,
    /\|.*\|/,
  ];
  const contactScore = contactSignals.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
  const promoScore = promoSignals.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
  return { contactScore, promoScore };
}

function panel(id: 'LEFT' | 'RIGHT', x0: number, x1: number, boxes: BusinessCardOcrBox[]): BusinessCardPanel {
  const contained = lineBoxes(boxes).filter((box) => (box.x0 + box.x1) / 2 >= x0 && (box.x0 + box.x1) / 2 <= x1);
  const text = contained.map((box) => box.text).join('\n');
  const scores = scoreText(text);
  const density = Math.min(1, contained.length / 7);
  const contactScore = clamp((scores.contactScore + density) / 5);
  const promoScore = clamp((scores.promoScore + density * 0.45) / 4);
  return {
    id,
    kind: 'UNKNOWN',
    x0,
    y0: 0,
    x1,
    y1: 1,
    score: Math.max(contactScore, promoScore),
    contactScore,
    promoScore,
  };
}

function bboxGapSeparator(boxes: BusinessCardOcrBox[]) {
  const centers = lineBoxes(boxes)
    .map((box) => (box.x0 + box.x1) / 2)
    .filter((value) => value >= 0.2 && value <= 0.8)
    .sort((a, b) => a - b);
  let best = { x: 0.5, gap: 0 };
  for (let index = 1; index < centers.length; index += 1) {
    const gap = centers[index] - centers[index - 1];
    const x = (centers[index] + centers[index - 1]) / 2;
    if (gap > best.gap && x >= 0.3 && x <= 0.7) best = { x, gap };
  }
  return best;
}

export function detectBusinessCardPanels(
  boxes: BusinessCardOcrBox[],
  imageSignal: BusinessCardPanelImageSignal = {},
  selection: BusinessCardPanelSelection = 'AUTO',
): BusinessCardPanelAnalysis {
  const reasons: string[] = [];
  if (selection === 'FULL') {
    return {
      layout: 'SINGLE_FACE',
      selection,
      separatorX: null,
      separatorConfidence: 0,
      contactPanelId: 'FULL',
      promoPanelId: null,
      panels: [{ id: 'FULL', kind: 'CONTACT_FACE', x0: 0, y0: 0, x1: 1, y1: 1, score: 1, contactScore: 1, promoScore: 0 }],
      reason: ['USER_SELECTED_FULL'],
    };
  }

  const gap = bboxGapSeparator(boxes);
  const imageSeparator = imageSignal.separatorX;
  const imageConfidence = clamp(imageSignal.separatorConfidence ?? 0);
  const separatorX = imageSeparator != null && imageSeparator >= 0.3 && imageSeparator <= 0.7
    ? imageSeparator
    : gap.x;
  const separatorConfidence = imageSeparator != null ? imageConfidence : clamp(gap.gap / 0.2);
  if (imageSeparator != null) reasons.push('IMAGE_SEPARATOR');
  if (gap.gap >= 0.08) reasons.push('OCR_CLUSTER_GAP');

  const left = panel('LEFT', 0, separatorX, boxes);
  const right = panel('RIGHT', separatorX, 1, boxes);
  const leftCount = lineBoxes(boxes).filter((box) => (box.x0 + box.x1) / 2 < separatorX).length;
  const rightCount = lineBoxes(boxes).filter((box) => (box.x0 + box.x1) / 2 >= separatorX).length;
  const manualPanel = selection === 'LEFT' || selection === 'RIGHT';
  const semanticSplit = Math.max(left.contactScore - left.promoScore, right.contactScore - right.promoScore) > 0.08
    || Math.max(left.promoScore, right.promoScore) > 0.2;
  const landscapeEvidence = imageSignal.aspectRatio == null || imageSignal.aspectRatio >= 1.35;
  const dual = manualPanel || (landscapeEvidence && leftCount >= 2 && rightCount >= 2 && separatorConfidence >= 0.35 && semanticSplit);

  if (!dual) {
    return {
      layout: 'SINGLE_FACE',
      selection,
      separatorX: null,
      separatorConfidence,
      contactPanelId: 'FULL',
      promoPanelId: null,
      panels: [{ id: 'FULL', kind: 'CONTACT_FACE', x0: 0, y0: 0, x1: 1, y1: 1, score: 1, contactScore: Math.max(left.contactScore, right.contactScore), promoScore: Math.max(left.promoScore, right.promoScore) }],
      reason: [...reasons, 'DUAL_EVIDENCE_INSUFFICIENT'],
    };
  }

  let contactId: 'LEFT' | 'RIGHT';
  if (selection === 'LEFT' || selection === 'RIGHT') {
    contactId = selection;
    reasons.push('USER_PANEL_OVERRIDE');
  } else {
    const leftNet = left.contactScore - left.promoScore * 0.65;
    const rightNet = right.contactScore - right.promoScore * 0.65;
    contactId = leftNet >= rightNet ? 'LEFT' : 'RIGHT';
    reasons.push('CONTACT_SIGNAL_SCORE');
  }
  const promoId = contactId === 'LEFT' ? 'RIGHT' : 'LEFT';
  const panels = [left, right].map((item) => ({
    ...item,
    kind: item.id === contactId ? 'CONTACT_FACE' as const : 'BRAND_PROMO_FACE' as const,
  }));

  return {
    layout: 'DUAL_PANEL',
    selection,
    separatorX,
    separatorConfidence,
    contactPanelId: contactId,
    promoPanelId: promoId,
    panels,
    reason: reasons,
  };
}