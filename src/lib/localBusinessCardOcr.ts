'use client';

import {
  parseBusinessCardTextDetailed,
  type BusinessCardLanguageProfile,
  type BusinessCardOcrLine,
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
    context.filter = 'grayscale(1) contrast(1.18)';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
    context.restore();

    // A light luminance cleanup removes isolated compression noise without binarizing thin glyphs.
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let offset = 0; offset < pixels.data.length; offset += 4) {
      const luminance = pixels.data[offset];
      const cleaned = luminance > 242 ? 255 : luminance < 24 ? 0 : luminance;
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

type TesseractBlocks = Array<{
  paragraphs: Array<{
    lines: Array<{ text: string; confidence: number }>;
  }>;
}> | null;

function extractLines(blocks: TesseractBlocks): BusinessCardOcrLine[] {
  if (!blocks) return [];
  return blocks.flatMap((block) => block.paragraphs)
    .flatMap((paragraph) => paragraph.lines)
    .map((line) => ({ text: line.text.trim(), confidence: Math.max(0, Math.min(1, line.confidence / 100)) }))
    .filter((line) => Boolean(line.text));
}

export async function runLocalBusinessCardOcr(
  file: File,
  options: LocalBusinessCardOcrOptions,
): Promise<BusinessCardOcrResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') throw new Error('LOCAL_OCR_BROWSER_REQUIRED');
  assertNotAborted(options.signal);
  options.onProgress?.({ phase: 'PREPARING_IMAGE', percent: 4, detail: 'Preparing image' });
  const canvas = await preprocessBusinessCardImage(file, options.rotation, options.signal);
  assertNotAborted(options.signal);
  options.onProgress?.({ phase: 'LOADING_ENGINE', percent: 12, detail: 'Loading tesseract.js' });

  const languages = resolveBusinessCardLanguages(options.languageProfile, options.companyId);
  const { createWorker, PSM } = await import('tesseract.js');
  assertNotAborted(options.signal);

  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  let workerError: unknown;
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
    options.onProgress?.({ phase: 'RECOGNIZING_TEXT', percent: 64, detail: 'Recognizing text' });
    const recognition = await worker.recognize(canvas, { rotateAuto: false }, { text: true, blocks: true });
    assertNotAborted(options.signal);
    if (workerError) throw workerError;
    const rawText = recognition.data.text.trim();
    if (!rawText) throw new Error('OCR_NO_TEXT_DETECTED');
    options.onProgress?.({ phase: 'PARSING_FIELDS', percent: 94, detail: 'Parsing contact fields' });
    const result = parseBusinessCardTextDetailed(rawText, {
      overallConfidence: recognition.data.confidence / 100,
      lines: extractLines(recognition.data.blocks),
      languageProfile: options.languageProfile,
      languages,
      engine: 'LOCAL_TESSERACT',
      engineVersion: `tesseract.js@${TESSERACT_VERSION}`,
    });
    options.onProgress?.({ phase: 'COMPLETE', percent: 100, detail: 'Complete' });
    return result;
  } catch (error) {
    if (options.signal?.aborted) throw abortError();
    throw error;
  } finally {
    options.signal?.removeEventListener('abort', abortWorker);
    if (worker) await worker.terminate().catch(() => undefined);
    canvas.width = 1;
    canvas.height = 1;
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
