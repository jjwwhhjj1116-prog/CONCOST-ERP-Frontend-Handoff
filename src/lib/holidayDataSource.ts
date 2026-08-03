import { KOREAN_HOLIDAYS_2026 } from '@/data/koreanHolidays2026';
import { apiClient } from '@/lib/apiClient';
import { getRuntimeExecutionMode, type RuntimeExecutionMode } from '@/lib/runtimeExecutionMode';

export type HolidayCategory = 'PUBLIC_HOLIDAY' | 'SUBSTITUTE_HOLIDAY' | 'COMPANY_CLOSED_DAY';
export type HolidaySource = 'KASI' | 'BACKEND' | 'COMPANY_POLICY' | 'BUNDLED_CACHE';

export interface HolidayRecord {
  date: string;
  nameKo: string;
  nameEn?: string;
  nameVi?: string;
  category: HolidayCategory;
  isPublicHoliday: boolean;
  source: HolidaySource;
}

export interface HolidayDataSource {
  list(year: number, country: 'KR'): Promise<HolidayRecord[]>;
}

export interface HolidayLoadResult {
  records: HolidayRecord[];
  source: 'KASI_BUNDLED_CACHE' | 'BACKEND_API';
  warning: string | null;
}

const VALID_CATEGORIES: HolidayCategory[] = [
  'PUBLIC_HOLIDAY', 'SUBSTITUTE_HOLIDAY', 'COMPANY_CLOSED_DAY',
];

const validateHoliday = (value: unknown): HolidayRecord | null => {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<HolidayRecord>;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date || '')) return null;
  if (!item.nameKo?.trim() || !item.category || !VALID_CATEGORIES.includes(item.category)) return null;
  const source: HolidaySource = item.category === 'COMPANY_CLOSED_DAY'
    ? 'COMPANY_POLICY'
    : item.source === 'BACKEND' || item.source === 'KASI' ? item.source : 'BACKEND';
  return {
    date: item.date!,
    nameKo: item.nameKo.trim(),
    nameEn: item.nameEn?.trim() || undefined,
    nameVi: item.nameVi?.trim() || undefined,
    category: item.category,
    isPublicHoliday: item.category !== 'COMPANY_CLOSED_DAY' && item.isPublicHoliday !== false,
    source,
  };
};

export const bundledKoreanHolidayDataSource: HolidayDataSource = {
  list: async (year, country) => {
    if (country !== 'KR' || year !== 2026) return [];
    return KOREAN_HOLIDAYS_2026.map((item) => ({ ...item, source: 'BUNDLED_CACHE' }));
  },
};

export const backendKoreanHolidayDataSource: HolidayDataSource = {
  list: async (year, country) => {
    const response = await apiClient<HolidayRecord[] | { items: HolidayRecord[] }>(
      `/v1/calendar/holidays?year=${year}&country=${country}`,
      { companyScope: 'required' },
    );
    const values = Array.isArray(response) ? response : response.items;
    if (!Array.isArray(values)) throw new Error('Holiday API response does not contain an item list.');
    const records = values.map(validateHoliday);
    if (records.some((item) => item === null)) throw new Error('Holiday API response contains an invalid record.');
    return records as HolidayRecord[];
  },
};

export const loadKoreanHolidayCalendar = async (
  year: number,
  mode: RuntimeExecutionMode = getRuntimeExecutionMode(),
): Promise<HolidayLoadResult> => {
  if (mode === 'DEMO_LOCAL') {
    return {
      records: await bundledKoreanHolidayDataSource.list(year, 'KR'),
      source: 'KASI_BUNDLED_CACHE',
      warning: null,
    };
  }
  try {
    return {
      records: await backendKoreanHolidayDataSource.list(year, 'KR'),
      source: 'BACKEND_API',
      warning: null,
    };
  } catch (error) {
    const cached = await bundledKoreanHolidayDataSource.list(year, 'KR');
    if (!cached.length) throw error;
    return {
      records: cached,
      source: 'KASI_BUNDLED_CACHE',
      warning: '공휴일 API를 불러오지 못해 검증된 KASI 캐시를 표시합니다.',
    };
  }
};

export const holidayDisplayName = (holiday: HolidayRecord, language: 'ko' | 'vi' | 'en') => {
  if (language === 'vi') return holiday.nameVi || holiday.nameEn || holiday.nameKo;
  if (language === 'en') return holiday.nameEn || holiday.nameKo;
  return holiday.nameKo;
};

export const getCalendarDayPresentation = (date: Date, holidays: HolidayRecord[]) => {
  const key = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  const holiday = holidays.find((item) => item.date === key);
  return {
    holiday,
    isSunday: date.getDay() === 0,
    isSaturday: date.getDay() === 6,
    isPublicHoliday: Boolean(holiday?.isPublicHoliday),
    isCompanyClosedDay: holiday?.category === 'COMPANY_CLOSED_DAY',
  };
};
