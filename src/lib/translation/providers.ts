import { TranslationProvider, TranslationStatus, LanguageCode, TranslationProviderHealth, TranslationCacheItem } from '@/types/models';
import { useTranslationStore } from '@/store/translationStore';

export interface TranslationInput {
  text: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
}

export interface TranslationResult {
  text: string;
  status: TranslationStatus;
  provider: TranslationProvider;
  errorMessage?: string;
}

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
};

// Simple text hash generator for caching
export const generateSourceHash = (text: string, sourceLang: string, targetLang: string) => {
  let hash = 0;
  const str = `${text}_${sourceLang}_${targetLang}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
};

export const translateWithMyMemory = async (input: TranslationInput, email?: string): Promise<TranslationResult> => {
  try {
    const langpair = `${input.sourceLang}|${input.targetLang}`;
    const encodedText = encodeURIComponent(input.text);
    let url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${langpair}`;
    if (email) url += `&de=${encodeURIComponent(email)}`;
    
    const res = await fetchWithTimeout(url, { method: 'GET' }, 5000);
    if (!res.ok) {
      if (res.status === 429) return { text: '', status: 'PROVIDER_LIMIT_EXCEEDED', provider: 'MYMEMORY_PUBLIC_NO_KEY', errorMessage: 'Rate limit exceeded' };
      return { text: '', status: 'TRANSLATION_FAILED', provider: 'MYMEMORY_PUBLIC_NO_KEY', errorMessage: `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data.responseStatus === 200) {
      return { text: data.responseData.translatedText, status: 'AUTO_TRANSLATED', provider: 'MYMEMORY_PUBLIC_NO_KEY' };
    } else if (data.responseStatus === 429) {
      return { text: '', status: 'PROVIDER_LIMIT_EXCEEDED', provider: 'MYMEMORY_PUBLIC_NO_KEY', errorMessage: data.responseDetails };
    }
    return { text: '', status: 'TRANSLATION_FAILED', provider: 'MYMEMORY_PUBLIC_NO_KEY', errorMessage: data.responseDetails };
  } catch (err: unknown) {
    const error = err as Error;
    return { text: '', status: 'TRANSLATION_FAILED', provider: 'MYMEMORY_PUBLIC_NO_KEY', errorMessage: error.message };
  }
};

export const translateWithLibreTranslate = async (input: TranslationInput, endpoint: string): Promise<TranslationResult> => {
  try {
    const res = await fetchWithTimeout(`${endpoint}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: input.text,
        source: input.sourceLang,
        target: input.targetLang,
        format: 'text'
      })
    }, 5000);
    
    if (!res.ok) {
      if (res.status === 429) return { text: '', status: 'PROVIDER_LIMIT_EXCEEDED', provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY', errorMessage: 'Rate limit exceeded' };
      if (res.status === 403) return { text: '', status: 'TRANSLATION_FAILED', provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY', errorMessage: 'API Key Required' };
      return { text: '', status: 'TRANSLATION_FAILED', provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY', errorMessage: `HTTP ${res.status}` };
    }
    const data = await res.json();
    if (data.translatedText) {
      return { text: data.translatedText, status: 'AUTO_TRANSLATED', provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY' };
    }
    return { text: '', status: 'TRANSLATION_FAILED', provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY', errorMessage: 'No translatedText returned' };
  } catch (err: unknown) {
    const error = err as Error;
    return { text: '', status: 'TRANSLATION_FAILED', provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY', errorMessage: error.message };
  }
};

export const checkHealthMyMemory = async (email?: string): Promise<TranslationProviderHealth> => {
  const result = await translateWithMyMemory({ text: '안녕하세요', sourceLang: 'ko', targetLang: 'vi' }, email);
  
  return {
    provider: 'MYMEMORY_PUBLIC_NO_KEY',
    requiresApiKey: false,
    corsOk: true, // Assuming true if fetch didn't fail with network error
    koToViOk: result.status === 'AUTO_TRANSLATED',
    viToKoOk: result.status === 'AUTO_TRANSLATED', // Usually symmetric
    quotaWarning: result.status === 'PROVIDER_LIMIT_EXCEEDED' ? 'Quota exceeded' : undefined,
    lastCheckedAt: new Date().toISOString(),
    status: result.status === 'AUTO_TRANSLATED' ? 'AVAILABLE' : (result.status === 'PROVIDER_LIMIT_EXCEEDED' ? 'LIMITED' : 'UNAVAILABLE')
  };
};

export const checkHealthLibreTranslate = async (endpoint: string): Promise<TranslationProviderHealth> => {
  if (!endpoint) return {
    provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY',
    requiresApiKey: false, corsOk: false, koToViOk: false, viToKoOk: false,
    lastCheckedAt: new Date().toISOString(), status: 'UNAVAILABLE'
  };

  const result = await translateWithLibreTranslate({ text: '안녕하세요', sourceLang: 'ko', targetLang: 'vi' }, endpoint);
  
  return {
    provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY',
    endpoint,
    requiresApiKey: result.errorMessage === 'API Key Required',
    corsOk: true,
    koToViOk: result.status === 'AUTO_TRANSLATED',
    viToKoOk: result.status === 'AUTO_TRANSLATED',
    quotaWarning: result.status === 'PROVIDER_LIMIT_EXCEEDED' ? 'Quota exceeded' : undefined,
    lastCheckedAt: new Date().toISOString(),
    status: result.status === 'AUTO_TRANSLATED' ? 'AVAILABLE' : (result.status === 'PROVIDER_LIMIT_EXCEEDED' ? 'LIMITED' : 'UNAVAILABLE')
  };
};

export const executeTranslation = async (input: TranslationInput): Promise<TranslationResult> => {
  const { settings, translationCache, cacheTranslation } = useTranslationStore.getState();
  
  if (settings.activeProvider === 'DISABLED' || settings.activeProvider === 'MANUAL_ONLY' || !settings.autoTranslateEnabled) {
    return { text: '', status: 'NONE', provider: 'DISABLED' };
  }

  const hash = generateSourceHash(input.text, input.sourceLang, input.targetLang);
  const cached = translationCache.find(c => c.sourceHash === hash);
  
  if (cached && cached.status === 'AUTO_TRANSLATED') {
    return { text: cached.translatedText, status: cached.status, provider: cached.provider };
  }

  let result: TranslationResult;

  if (settings.activeProvider === 'MYMEMORY_PUBLIC_NO_KEY') {
    result = await translateWithMyMemory(input, settings.myMemoryContactEmail);
  } else if (settings.activeProvider === 'LIBRETRANSLATE_PUBLIC_NO_KEY') {
    if (!settings.libreTranslateEndpoint) {
       result = { text: '', status: 'TRANSLATION_FAILED', provider: 'LIBRETRANSLATE_PUBLIC_NO_KEY', errorMessage: 'Endpoint not configured' };
    } else {
       result = await translateWithLibreTranslate(input, settings.libreTranslateEndpoint);
    }
  } else {
    result = { text: '', status: 'TRANSLATION_FAILED', provider: settings.activeProvider, errorMessage: 'Unsupported provider' };
  }

  if (result.status === 'AUTO_TRANSLATED') {
    cacheTranslation({
      sourceHash: hash,
      sourceLanguage: input.sourceLang,
      targetLanguage: input.targetLang,
      sourceText: input.text,
      translatedText: result.text,
      provider: result.provider,
      status: result.status,
      createdAt: new Date().toISOString()
    });
  }

  return result;
};
