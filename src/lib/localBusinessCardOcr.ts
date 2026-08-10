'use client';

import {
  parseBusinessCardTextDetailed,
  type BusinessCardLanguageProfile,
  type BusinessCardOcrBox,
  type BusinessCardCaptureQuality,
  type BusinessCardOcrLine,
  type BusinessCardOcrPassSummary,
  type BusinessCardOcrResult,
} from '@/lib/businessCardOcr';
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
    ) => {
      assertNotAborted(options.signal);
      options.onProgress?.({ phase: 'PREPARING_IMAGE', percent: 58, detail: `${mode} · ${rotation}°` });
      const canvas = await preprocessBusinessCardImage(file, rotation, options.signal, mode);
      canvases.push(canvas);
      if (!captureQuality && mode === 'STANDARD' && rotation === options.rotation) {
        captureQuality = assessBusinessCardCaptureQuality(canvas);
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
        boxes: evidence.boxes,
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
      };
      summaries.push(summary);
      passResults.push({ summary, result });
    };

    const modes: BusinessCardImageMode[] = ['STANDARD', 'CONTRAST', 'THRESHOLD'];
    for (const mode of modes) {
      await recognizePass(mode, options.rotation, `base-${mode.toLocaleLowerCase()}`);
    }
    let best = [...passResults].sort((a, b) => b.summary.score - a.summary.score)[0];
    if (best && shouldRetryBusinessCardRotation(best.summary.score)) {
      const rotations = ([0, 90, 180, 270] as const).filter((rotation) => rotation !== options.rotation);
      for (const rotation of rotations) {
        await recognizePass('CONTRAST', rotation, `rotation-${rotation}`);
      }
      best = [...passResults].sort((a, b) => b.summary.score - a.summary.score)[0];
    }
    if (!best) throw new Error('OCR_NO_TEXT_DETECTED');

    options.onProgress?.({ phase: 'PARSING_FIELDS', percent: 96, detail: 'Comparing structured OCR evidence' });
    const result: BusinessCardOcrResult = {
      ...best.result,
      warnings: Array.from(new Set([
        ...best.result.warnings,
        ...(captureQuality?.warnings ?? []),
      ])),
      evidence: {
        boxes: best.result.evidence?.boxes ?? [],
        candidates: best.result.evidence?.candidates ?? [],
        selectedCandidateIds: best.result.evidence?.selectedCandidateIds ?? {},
        passes: summaries,
        selectedPassId: best.summary.id,
        captureQuality,
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
