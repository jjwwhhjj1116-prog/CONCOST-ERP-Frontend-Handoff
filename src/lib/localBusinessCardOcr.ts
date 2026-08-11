'use client';

import {
  parseBusinessCardTextDetailed,
  mergeBusinessCardPanelResults,
  type BusinessCardLanguageProfile,
  type BusinessCardOcrBox,
  type BusinessCardCaptureQuality,
  type BusinessCardOcrLine,
  type BusinessCardOcrPassSummary,
  type BusinessCardOcrResult,
  type BusinessCardRoiEvidence,
  type BusinessCardPanel,
  type BusinessCardPanelSelection,
} from '@/lib/businessCardOcr';
import { detectBusinessCardPanels } from '@/lib/businessCardPanels';
import { detectBusinessCardRois, roiUpscaleFactor, shouldAcceptBusinessCardRoiField } from '@/lib/businessCardRoi';
import type { CompanyId } from '@/types/models';

export type LocalBusinessCardOcrPhase =
  | 'PREPARING_IMAGE'
  | 'LOADING_ENGINE'
  | 'LOADING_LANGUAGE'
  | 'INITIALIZING_ENGINE'
  | 'RECOGNIZING_TEXT'
  | 'PARSING_FIELDS'
  | 'COMPLETE';

export type LocalBusinessCardOcrErrorCode =
  | 'OCR_CANCELLED'
  | 'OCR_ENGINE_LOAD_FAILED'
  | 'LANGUAGE_DATA_FAILED'
  | 'NO_TEXT_DETECTED'
  | 'PARSER_NO_CANDIDATE'
  | 'OCR_IMAGE_DECODE_FAILED'
  | 'OCR_RECOGNITION_FAILED';

export interface LocalBusinessCardOcrProgress {
  phase: LocalBusinessCardOcrPhase;
  percent: number;
  detail: string;
}

export interface LocalBusinessCardOcrOptions {
  companyId: CompanyId;
  languageProfile: BusinessCardLanguageProfile;
  rotation: 0 | 90 | 180 | 270;
  panelSelection?: BusinessCardPanelSelection;
  signal?: AbortSignal;
  onProgress?: (progress: LocalBusinessCardOcrProgress) => void;
}

export type BusinessCardImageMode = 'STANDARD' | 'CONTRAST' | 'THRESHOLD';

const TESSERACT_VERSION = '7.0.0';

export function defaultBusinessCardLanguageProfile(companyId: CompanyId): BusinessCardLanguageProfile {
  return companyId === 'VIET_QS' ? 'VI_EN' : 'KO_EN';
}

export function resolveBusinessCardLanguages(
  profile: BusinessCardLanguageProfile,
  companyId: CompanyId,
): string[] {
  const resolved = profile === 'AUTO' ? defaultBusinessCardLanguageProfile(companyId) : profile;
  if (resolved === 'KO_EN') return ['kor', 'eng'];
  if (resolved === 'VI_EN') return ['vie', 'eng'];
  return ['eng'];
}

export function canUseLocalBusinessCardOcr(runtimeMode: string) {
  return runtimeMode === 'DEMO_LOCAL';
}

function abortError() {
  return new DOMException('OCR job cancelled.', 'AbortError');
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
}

function progressRange(status: string, progress: number): LocalBusinessCardOcrProgress {
  const normalized = Math.max(0, Math.min(1, progress || 0));
  if (/language|traineddata/i.test(status)) {
    return { phase: 'LOADING_LANGUAGE', percent: Math.round(24 + normalized * 26), detail: status };
  }
  if (/initializ/i.test(status)) {
    return { phase: 'INITIALIZING_ENGINE', percent: Math.round(50 + normalized * 12), detail: status };
  }
  if (/recogniz/i.test(status)) {
    return { phase: 'RECOGNIZING_TEXT', percent: Math.round(62 + normalized * 30), detail: status };
  }
  return { phase: 'LOADING_ENGINE', percent: Math.round(12 + normalized * 12), detail: status || 'Loading OCR engine' };
}

async function decodeImage(file: File) {
  if ('createImageBitmap' in globalThis) {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function dimensions(image: ImageBitmap | HTMLImageElement) {
  return 'naturalWidth' in image
    ? { width: image.naturalWidth, height: image.naturalHeight }
    : { width: image.width, height: image.height };
}

export async function preprocessBusinessCardImage(
  file: File,
  rotation: 0 | 90 | 180 | 270,
  signal?: AbortSignal,
  mode: BusinessCardImageMode = 'CONTRAST',
): Promise<HTMLCanvasElement> {
  assertNotAborted(signal);
  const image = await decodeImage(file);
  try {
    assertNotAborted(signal);
    const source = dimensions(image);
    if (!source.width || !source.height) throw new Error('OCR_IMAGE_DECODE_FAILED');

    const minimumLongEdge = 1800;
    const maximumLongEdge = 2800;
    const sourceLongEdge = Math.max(source.width, source.height);
    const scale = sourceLongEdge < minimumLongEdge
      ? minimumLongEdge / sourceLongEdge
      : sourceLongEdge > maximumLongEdge
        ? maximumLongEdge / sourceLongEdge
        : 1;
    const scaledWidth = Math.max(1, Math.round(source.width * scale));
    const scaledHeight = Math.max(1, Math.round(source.height * scale));
    const sideways = rotation === 90 || rotation === 270;
    const canvas = document.createElement('canvas');
    canvas.width = sideways ? scaledHeight : scaledWidth;
    canvas.height = sideways ? scaledWidth : scaledHeight;
    const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!context) throw new Error('OCR_CANVAS_UNAVAILABLE');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((rotation * Math.PI) / 180);
    context.filter = mode === 'STANDARD'
      ? 'grayscale(1) contrast(1.04)'
      : mode === 'CONTRAST'
        ? 'grayscale(1) contrast(1.24)'
        : 'grayscale(1) contrast(1.12)';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    context.restore();

    // Keep a natural grayscale pass, a contrast pass, and one conservative threshold pass.
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      const luminance = pixels.data[offset];
      const cleaned = mode === 'THRESHOLD'
        ? (luminance >= 174 ? 255 : 0)
        : luminance > 246
          ? 255
          : luminance < 20
            ? 0
            : luminance;
      pixels.data[offset] = cleaned;
      pixels.data[offset + 1] = cleaned;
      pixels.data[offset + 2] = cleaned;
      pixels.data[offset + 3] = 255;
    }
    context.putImageData(pixels, 0, 0);
    return canvas;
  } finally {
    if ('close' in image && typeof image.close === 'function') image.close();
  }
}

type TesseractBBox = { x0: number; y0: number; x1: number; y1: number };
type TesseractWord = { text: string; confidence: number; bbox: TesseractBBox };
type TesseractLine = { text: string; confidence: number; bbox: TesseractBBox; words?: TesseractWord[] };
type TesseractBlocks = Array<{
  paragraphs: Array<{
    lines: TesseractLine[];
  }>;
}> | null;

function normalizeBox(bbox: TesseractBBox, width: number, height: number) {
  const x0 = Math.max(0, Math.min(1, bbox.x0 / width));
  const y0 = Math.max(0, Math.min(1, bbox.y0 / height));
  const x1 = Math.max(x0, Math.min(1, bbox.x1 / width));
  const y1 = Math.max(y0, Math.min(1, bbox.y1 / height));
  return { x0, y0, x1, y1, width: x1 - x0, height: y1 - y0 };
}

function extractStructuredEvidence(blocks: TesseractBlocks, width: number, height: number) {
  const lines: BusinessCardOcrLine[] = [];
  const boxes: BusinessCardOcrBox[] = [];
  if (!blocks) return { lines, boxes };
  let lineIndex = 0;
  blocks.forEach((block, blockIndex) => {
    block.paragraphs.forEach((paragraph) => {
      paragraph.lines.forEach((line) => {
        const lineText = line.text.trim();
        if (!lineText) return;
        const confidence = Math.max(0, Math.min(1, line.confidence / 100));
        lines.push({ text: lineText, confidence });
        boxes.push({
          id: `line-${lineIndex}`,
          kind: 'LINE',
          text: lineText,
          confidence,
          ...normalizeBox(line.bbox, width, height),
          lineIndex,
          blockIndex,
        });
        (line.words ?? []).forEach((word, wordIndex) => {
          const wordText = word.text.trim();
          if (!wordText) return;
          boxes.push({
            id: `line-${lineIndex}-word-${wordIndex}`,
            kind: 'WORD',
            text: wordText,
            confidence: Math.max(0, Math.min(1, word.confidence / 100)),
            ...normalizeBox(word.bbox, width, height),
            lineIndex,
            blockIndex,
            wordIndex,
          });
        });
        lineIndex += 1;
      });
    });
  });
  return { lines, boxes };
}

export function assessBusinessCardCaptureQuality(canvas: HTMLCanvasElement): BusinessCardCaptureQuality {
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!context) return { score: 0, width: canvas.width, height: canvas.height, contrast: 0, sharpness: 0, warnings: ['CAPTURE_ANALYSIS_UNAVAILABLE'] };
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const sampleStride = Math.max(4, Math.floor((canvas.width * canvas.height) / 120_000) * 4);
  let count = 0;
  let sum = 0;
  let sumSquares = 0;
  let edge = 0;
  let previous = pixels[0] ?? 0;
  for (let offset = 0; offset < pixels.length; offset += sampleStride) {
    const luminance = pixels[offset] ?? 0;
    count += 1;
    sum += luminance;
    sumSquares += luminance * luminance;
    edge += Math.abs(luminance - previous);
    previous = luminance;
  }
  const mean = count ? sum / count : 0;
  const deviation = count ? Math.sqrt(Math.max(0, sumSquares / count - mean * mean)) : 0;
  const contrast = Math.max(0, Math.min(1, deviation / 64));
  const sharpness = Math.max(0, Math.min(1, (count ? edge / count : 0) / 42));
  const resolution = Math.max(0, Math.min(1, Math.max(canvas.width, canvas.height) / 1800));
  const score = Math.round((resolution * 0.35 + contrast * 0.35 + sharpness * 0.3) * 1000) / 1000;
  const warnings: string[] = [];
  if (resolution < 0.7) warnings.push('CAPTURE_LOW_RESOLUTION');
  if (contrast < 0.32) warnings.push('CAPTURE_LOW_CONTRAST');
  if (sharpness < 0.2) warnings.push('CAPTURE_BLUR_RISK');
  return { score, width: canvas.width, height: canvas.height, contrast, sharpness, warnings };
}

export function scoreBusinessCardOcrPass(result: BusinessCardOcrResult) {
  const identityCoverage = Number(Boolean(result.contact.name)) + Number(Boolean(result.contact.company));
  const contactCoverage = Number(Boolean(result.contact.email || result.contact.mobile || result.contact.telephone));
  const requiredFieldCoverage = (identityCoverage + contactCoverage) / 3;
  const selectedScores = Object.values(result.fieldConfidence).filter((value): value is number => typeof value === 'number');
  const candidateScore = selectedScores.length ? selectedScores.reduce((sum, value) => sum + value, 0) / selectedScores.length : 0;
  const score = Math.round((requiredFieldCoverage * 0.5 + candidateScore * 0.35 + (result.overallConfidence ?? 0) * 0.15) * 1000) / 1000;
  return { score, requiredFieldCoverage };
}

export function shouldRetryBusinessCardRotation(score: number) {
  return score < 0.72;
}

export function detectVerticalPanelSeparator(canvas: HTMLCanvasElement) {
  const aspectRatio = canvas.width / canvas.height;
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!context) return { aspectRatio, separatorX: null, separatorConfidence: 0 };
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const averageColumn = (x: number) => {
    let total = 0;
    let count = 0;
    const stride = Math.max(1, Math.floor(canvas.height / 320));
    for (let y = 0; y < canvas.height; y += stride) {
      total += pixels[(y * canvas.width + x) * 4] ?? 255;
      count += 1;
    }
    return count ? total / count : 255;
  };
  let best = { x: Math.round(canvas.width / 2), score: 0 };
  const start = Math.round(canvas.width * 0.3);
  const end = Math.round(canvas.width * 0.7);
  const offset = Math.max(6, Math.round(canvas.width * 0.008));
  for (let x = start; x <= end; x += Math.max(1, Math.floor(canvas.width / 700))) {
    const current = averageColumn(x);
    const left = averageColumn(Math.max(0, x - offset));
    const right = averageColumn(Math.min(canvas.width - 1, x + offset));
    const neighbors = (left + right) / 2;
    const lineScore = current + 24 < neighbors ? (neighbors - current) / 80 : 0;
    const gutterScore = current > 244 && Math.min(left, right) < 236 ? (current - Math.min(left, right)) / 45 : 0;
    const score = Math.max(lineScore, gutterScore);
    if (score > best.score) best = { x, score };
  }
  const requiredScore = aspectRatio >= 1.35 ? 0.28 : aspectRatio >= 0.82 ? 0.5 : 0.72;
  return {
    aspectRatio,
    separatorX: best.score >= requiredScore ? best.x / canvas.width : null,
    separatorConfidence: Math.max(0, Math.min(1, best.score)),
  };
}

export function resolveBusinessCardPanelCrop(sourceWidth: number, sourceHeight: number, panel: BusinessCardPanel) {
  const x0 = Math.max(0, Math.floor(sourceWidth * panel.x0));
  const x1 = Math.min(sourceWidth, Math.max(x0 + 1, Math.ceil(sourceWidth * panel.x1)));
  return { x0, x1, width: x1 - x0, height: sourceHeight };
}

function cropPanelCanvas(source: HTMLCanvasElement, panel: BusinessCardPanel) {
  const crop = resolveBusinessCardPanelCrop(source.width, source.height, panel);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('OCR_CANVAS_UNAVAILABLE');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, crop.x0, 0, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return canvas;
}
function cropRoiCanvas(
  source: HTMLCanvasElement,
  bounds: { x0: number; y0: number; x1: number; y1: number },
  scale: number,
) {
  const x = Math.max(0, Math.floor(source.width * bounds.x0));
  const y = Math.max(0, Math.floor(source.height * bounds.y0));
  const width = Math.max(1, Math.min(source.width - x, Math.ceil(source.width * (bounds.x1 - bounds.x0))));
  const height = Math.max(1, Math.min(source.height - y, Math.ceil(source.height * (bounds.y1 - bounds.y0))));
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const context = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
  if (!context) throw new Error('OCR_CANVAS_UNAVAILABLE');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, x, y, width, height, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let index = 0; index < image.data.length; index += 4) {
    const gray = image.data[index] * 0.299 + image.data[index + 1] * 0.587 + image.data[index + 2] * 0.114;
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.16 + 128));
    image.data[index] = contrasted;
    image.data[index + 1] = contrasted;
    image.data[index + 2] = contrasted;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
function remapPanelBoxes(boxes: BusinessCardOcrBox[], panel: BusinessCardPanel) {
  const width = panel.x1 - panel.x0;
  return boxes.map((box) => ({
    ...box,
    id: panel.id.toLocaleLowerCase() + '-' + box.id,
    panelId: panel.id,
    x0: panel.x0 + box.x0 * width,
    x1: panel.x0 + box.x1 * width,
    width: box.width * width,
  }));
}
export async function runLocalBusinessCardOcr(
  file: File,
  options: LocalBusinessCardOcrOptions,
): Promise<BusinessCardOcrResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') throw new Error('LOCAL_OCR_BROWSER_REQUIRED');
  assertNotAborted(options.signal);
  options.onProgress?.({ phase: 'PREPARING_IMAGE', percent: 4, detail: 'Preparing image' });
  options.onProgress?.({ phase: 'LOADING_ENGINE', percent: 12, detail: 'Loading tesseract.js' });

  const languages = resolveBusinessCardLanguages(options.languageProfile, options.companyId);
  const { createWorker, PSM } = await import('tesseract.js');
  assertNotAborted(options.signal);

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let workerError: unknown;
  const canvases: HTMLCanvasElement[] = [];
  const abortWorker = () => {
    if (worker) void worker.terminate().catch(() => undefined);
  };
  options.signal?.addEventListener('abort', abortWorker, { once: true });

  try {
    worker = await createWorker(languages, undefined, {
      logger: (event) => options.onProgress?.(progressRange(event.status, event.progress)),
      errorHandler: (error) => { workerError = error; },
    });
    assertNotAborted(options.signal);
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    });
    const activeWorker = worker;
    const summaries: BusinessCardOcrPassSummary[] = [];
    const passResults: Array<{ summary: BusinessCardOcrPassSummary; result: BusinessCardOcrResult }> = [];
    let captureQuality: BusinessCardCaptureQuality | undefined;

    const recognizePass = async (
      mode: BusinessCardImageMode,
      rotation: 0 | 90 | 180 | 270,
      id: string,
      panel?: BusinessCardPanel,
    ) => {
      assertNotAborted(options.signal);
      options.onProgress?.({ phase: 'PREPARING_IMAGE', percent: 58, detail: `${mode} · ${rotation}°` });
      const fullCanvas = await preprocessBusinessCardImage(file, rotation, options.signal, mode);
      canvases.push(fullCanvas);
      const crop = panel ? resolveBusinessCardPanelCrop(fullCanvas.width, fullCanvas.height, panel) : undefined;
      const canvas = panel ? cropPanelCanvas(fullCanvas, panel) : fullCanvas;
      if (panel) canvases.push(canvas);
      if (!captureQuality && mode === 'STANDARD' && rotation === options.rotation) {
        captureQuality = assessBusinessCardCaptureQuality(fullCanvas);
      }
      options.onProgress?.({ phase: 'RECOGNIZING_TEXT', percent: 64, detail: `${mode} OCR · ${rotation}°` });
      workerError = undefined;
      const recognition = await activeWorker.recognize(canvas, { rotateAuto: false }, { text: true, blocks: true });
      assertNotAborted(options.signal);
      if (workerError) throw workerError;
      const rawText = recognition.data.text.trim();
      if (!rawText) return;
      const evidence = extractStructuredEvidence(
        recognition.data.blocks as unknown as TesseractBlocks,
        canvas.width,
        canvas.height,
      );
      const result = parseBusinessCardTextDetailed(rawText, {
        overallConfidence: recognition.data.confidence / 100,
        lines: evidence.lines,
        boxes: panel ? remapPanelBoxes(evidence.boxes, panel) : evidence.boxes,
        languageProfile: options.languageProfile,
        languages,
        engine: 'LOCAL_TESSERACT',
        engineVersion: `tesseract.js@${TESSERACT_VERSION}`,
      });
      const scored = scoreBusinessCardOcrPass(result);
      const summary: BusinessCardOcrPassSummary = {
        id,
        imageMode: mode,
        rotation,
        score: scored.score,
        overallConfidence: result.overallConfidence ?? 0,
        requiredFieldCoverage: scored.requiredFieldCoverage,
        sourcePanelId: panel?.id,
        crop,
      };
      summaries.push(summary);
      passResults.push({ summary, result });
    };

    await recognizePass('STANDARD', options.rotation, 'discovery-standard');
    const discovery = passResults[0];
    if (!discovery) throw new Error('OCR_NO_TEXT_DETECTED');
    const signalCanvas = await preprocessBusinessCardImage(file, options.rotation, options.signal, 'STANDARD');
    canvases.push(signalCanvas);
    const imageSignal = detectVerticalPanelSeparator(signalCanvas);
    const panelAnalysis = detectBusinessCardPanels(
      discovery.result.evidence?.boxes ?? [],
      imageSignal,
      options.panelSelection ?? 'AUTO',
    );

    const modes: BusinessCardImageMode[] = ['STANDARD', 'CONTRAST', 'THRESHOLD'];
    let best: (typeof passResults)[number] | undefined;
    let promoResult: BusinessCardOcrResult | undefined;

    if (panelAnalysis.layout === 'DUAL_PANEL') {
      const contactPanel = panelAnalysis.panels.find((item) => item.id === panelAnalysis.contactPanelId);
      const promoPanel = panelAnalysis.panels.find((item) => item.id === panelAnalysis.promoPanelId);
      if (!contactPanel || !promoPanel) throw new Error('OCR_PANEL_SELECTION_FAILED');
      for (const mode of modes) {
        await recognizePass(mode, options.rotation, 'contact-' + mode.toLocaleLowerCase(), contactPanel);
      }
      const contactResults = passResults.filter((item) => item.summary.id.startsWith('contact-'));
      best = [...contactResults].sort((a, b) => b.summary.score - a.summary.score)[0];
      await recognizePass('STANDARD', options.rotation, 'promo-standard', promoPanel);
      promoResult = passResults.find((item) => item.summary.id === 'promo-standard')?.result;
      if (promoResult && !promoResult.contact.company && !promoResult.contact.homepage) {
        await recognizePass('CONTRAST', options.rotation, 'promo-contrast', promoPanel);
        promoResult = passResults.find((item) => item.summary.id === 'promo-contrast')?.result ?? promoResult;
      }
    } else {
      for (const mode of ['CONTRAST', 'THRESHOLD'] as const) {
        await recognizePass(mode, options.rotation, 'base-' + mode.toLocaleLowerCase());
      }
      best = [...passResults].sort((a, b) => b.summary.score - a.summary.score)[0];
      if (best && shouldRetryBusinessCardRotation(best.summary.score)) {
        const rotations = ([0, 90, 180, 270] as const).filter((rotation) => rotation !== options.rotation);
        for (const rotation of rotations) {
          await recognizePass('CONTRAST', rotation, 'rotation-' + rotation);
        }
        best = [...passResults].sort((a, b) => b.summary.score - a.summary.score)[0];
      }
    }
    if (!best) throw new Error('OCR_NO_TEXT_DETECTED');

    options.onProgress?.({ phase: 'PARSING_FIELDS', percent: 96, detail: 'Comparing structured OCR evidence' });
    const merged = mergeBusinessCardPanelResults(best.result, promoResult);
    const roiEvidence: BusinessCardRoiEvidence[] = [];
    const roiCandidates = detectBusinessCardRois(best.result.evidence?.boxes ?? []);
    if (roiCandidates.length) {
      const roiSource = await preprocessBusinessCardImage(file, best.summary.rotation, options.signal, 'STANDARD');
      canvases.push(roiSource);
      for (const roi of roiCandidates) {
        const scale = roiUpscaleFactor(roi.bounds);
        const roiCanvas = cropRoiCanvas(roiSource, roi.bounds, scale);
        canvases.push(roiCanvas);
        const languageProfiles = roi.kind === 'NAME_KO' && languages.includes('kor')
          ? [languages, ['kor']]
          : [languages];
        let bestRecognition: { text: string; confidence: number; profile: string[] } | null = null;
        for (const profile of languageProfiles) {
          await activeWorker.reinitialize(profile.join('+'));
          const psm = roi.kind === 'ADDRESS' || roi.kind === 'CONTACT' ? PSM.SPARSE_TEXT : PSM.SINGLE_LINE;
          await activeWorker.setParameters({
            tessedit_pageseg_mode: psm,
            preserve_interword_spaces: '1',
            user_defined_dpi: '300',
          });
          const recognition = await activeWorker.recognize(roiCanvas, { rotateAuto: false }, { text: true });
          const textValue = recognition.data.text.trim();
          const confidence = recognition.data.confidence / 100;
          if (textValue && (!bestRecognition || confidence > bestRecognition.confidence)) {
            bestRecognition = { text: textValue, confidence, profile };
          }
        }
        const psmLabel = roi.kind === 'ADDRESS' || roi.kind === 'CONTACT' ? 'SPARSE_TEXT' : 'SINGLE_LINE';
        const acceptedFields: Array<keyof typeof merged.contact> = [];
        let rejectedReason: string | undefined;
        if (bestRecognition) {
          const parsed = parseBusinessCardTextDetailed(bestRecognition.text, {
            overallConfidence: bestRecognition.confidence,
            languageProfile: options.languageProfile,
            languages: bestRecognition.profile,
            engine: 'LOCAL_TESSERACT',
            engineVersion: `tesseract.js@${TESSERACT_VERSION}`,
          });
          const fields = roi.kind === 'NAME_KO'
            ? (['name'] as const)
            : roi.kind === 'DEPARTMENT_POSITION'
              ? (['department', 'position'] as const)
              : roi.kind === 'ADDRESS'
                ? (['address'] as const)
                : (['mobile', 'telephone', 'fax', 'email'] as const);
          fields.forEach((field) => {
            const value = parsed.contact[field];
            const confidence = parsed.fieldConfidence[field] ?? bestRecognition?.confidence ?? 0;
            if (shouldAcceptBusinessCardRoiField(field, merged.contact[field], merged.fieldConfidence[field], value, confidence)) {
              merged.contact[field] = value;
              merged.fieldConfidence[field] = confidence;
              merged.fieldSources[field] = {
                field,
                panelId: best.summary.sourcePanelId ?? 'FULL',
                boxIds: roi.sourceBoxIds,
                confidence,
              };
              acceptedFields.push(field);
            }
          });
          if (!acceptedFields.length) rejectedReason = 'ROI_NOT_BETTER_THAN_STRUCTURED_PASS';
        } else {
          rejectedReason = 'ROI_NO_TEXT';
        }
        roiEvidence.push({
          id: roi.id,
          kind: roi.kind,
          bounds: roi.bounds,
          scale,
          psm: psmLabel,
          languageProfile: bestRecognition?.profile ?? languages,
          text: bestRecognition?.text ?? '',
          confidence: bestRecognition?.confidence ?? 0,
          acceptedFields,
          sourceBoxIds: roi.sourceBoxIds,
          rejectedReason,
        });
      }
      await activeWorker.reinitialize(languages.join('+'));
      await activeWorker.setParameters({
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
      });
    }
    const identityNeedsReview = (['name', 'company', 'department', 'position'] as const)
      .some((field) => !merged.contact[field] || (merged.fieldConfidence[field] ?? 0) < 0.58);
    const result: BusinessCardOcrResult = {
      ...best.result,
      contact: merged.contact,
      fieldConfidence: merged.fieldConfidence,
      rawText: promoResult ? best.result.rawText + '\n--- BRAND PROMO FACE ---\n' + promoResult.rawText : best.result.rawText,
      warnings: Array.from(new Set([
        ...best.result.warnings,
        ...(captureQuality?.warnings ?? []),
        ...(identityNeedsReview ? ['REVIEW_REQUIRED_KEY_IDENTITY'] : []),
      ])),
      evidence: {
        boxes: [
          ...(best.result.evidence?.boxes ?? []),
          ...(promoResult?.evidence?.boxes ?? []),
        ],
        candidates: [
          ...(best.result.evidence?.candidates ?? []),
          ...(promoResult?.evidence?.candidates ?? []),
        ],
        selectedCandidateIds: merged.selectedCandidateIds,
        fieldSources: merged.fieldSources,
        passes: summaries,
        selectedPassId: best.summary.id,
        captureQuality,
        panelAnalysis,
        rois: roiEvidence,
      },
    };
    options.onProgress?.({ phase: 'COMPLETE', percent: 100, detail: 'Complete' });
    return result;
  } catch (error) {
    if (options.signal?.aborted) throw abortError();
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', abortWorker);
    if (worker) await worker.terminate().catch(() => undefined);
    canvases.forEach((canvas) => {
      canvas.width = 1;
      canvas.height = 1;
    });
  }
}

export function classifyLocalOcrError(error: unknown): LocalBusinessCardOcrErrorCode {
  if (error instanceof DOMException && error.name === 'AbortError') return 'OCR_CANCELLED';
  const message = error instanceof Error ? error.message : String(error);
  if (/traineddata|language/i.test(message)) return 'LANGUAGE_DATA_FAILED';
  if (/Failed to fetch|NetworkError|importScripts|worker|wasm/i.test(message)) return 'OCR_ENGINE_LOAD_FAILED';
  if (/NO_TEXT/i.test(message)) return 'NO_TEXT_DETECTED';
  if (/PARSER_NO_CANDIDATE/i.test(message)) return 'PARSER_NO_CANDIDATE';
  if (/DECODE|IMAGE/i.test(message)) return 'OCR_IMAGE_DECODE_FAILED';
  return 'OCR_RECOGNITION_FAILED';
}
