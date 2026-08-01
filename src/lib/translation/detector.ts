import { LanguageCode } from '@/types/models';

export type DetectedLanguage = LanguageCode | 'UNKNOWN';

export const detectLanguage = (text: string): DetectedLanguage => {
  if (!text || text.trim().length === 0) return 'UNKNOWN';
  
  // Hangul Jamo and Syllables
  const koRegex = /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/;
  if (koRegex.test(text)) return 'ko';

  // Vietnamese specific characters (with tones)
  // a e i o u y with diacritics, d with stroke
  const viRegex = /[ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝàáâãèéêìíòóôõùúýĂăĐđĨĩŨũƠơƯưẠ-ỹ]/;
  if (viRegex.test(text)) return 'vi';

  // If no specific characters found, it could be English or plain Vietnamese without diacritics.
  // We return UNKNOWN to prompt user, or default to current UI language if preferred.
  return 'UNKNOWN';
};
