import type { HolidayRecord } from '@/lib/holidayDataSource';

const publicHoliday = (
  date: string,
  nameKo: string,
  category: HolidayRecord['category'] = 'PUBLIC_HOLIDAY',
  nameEn?: string,
  nameVi?: string,
): HolidayRecord => ({
  date, nameKo, nameEn, nameVi, category, isPublicHoliday: true, source: 'KASI',
});

// 2026 KASI calendar data cache. Company closure days are intentionally excluded.
export const KOREAN_HOLIDAYS_2026: HolidayRecord[] = [
  publicHoliday('2026-01-01', '신정', 'PUBLIC_HOLIDAY', "New Year's Day", 'Tết Dương lịch'),
  publicHoliday('2026-02-16', '설날 연휴', 'PUBLIC_HOLIDAY', 'Seollal Holiday', 'Nghỉ Tết Seollal'),
  publicHoliday('2026-02-17', '설날', 'PUBLIC_HOLIDAY', 'Seollal', 'Tết Seollal'),
  publicHoliday('2026-02-18', '설날 연휴', 'PUBLIC_HOLIDAY', 'Seollal Holiday', 'Nghỉ Tết Seollal'),
  publicHoliday('2026-03-01', '삼일절', 'PUBLIC_HOLIDAY', 'March 1st Movement Day'),
  publicHoliday('2026-03-02', '대체공휴일(삼일절)', 'SUBSTITUTE_HOLIDAY', 'Substitute Holiday (March 1st Movement Day)'),
  publicHoliday('2026-05-05', '어린이날', 'PUBLIC_HOLIDAY', "Children's Day"),
  publicHoliday('2026-05-24', '부처님오신날', 'PUBLIC_HOLIDAY', "Buddha's Birthday"),
  publicHoliday('2026-05-25', '대체공휴일(부처님오신날)', 'SUBSTITUTE_HOLIDAY', "Substitute Holiday (Buddha's Birthday)"),
  publicHoliday('2026-06-03', '전국동시지방선거', 'PUBLIC_HOLIDAY', 'Local Elections'),
  publicHoliday('2026-06-06', '현충일', 'PUBLIC_HOLIDAY', 'Memorial Day'),
  publicHoliday('2026-08-15', '광복절', 'PUBLIC_HOLIDAY', 'Liberation Day'),
  publicHoliday('2026-08-17', '대체공휴일(광복절)', 'SUBSTITUTE_HOLIDAY', 'Substitute Holiday (Liberation Day)'),
  publicHoliday('2026-09-24', '추석 연휴', 'PUBLIC_HOLIDAY', 'Chuseok Holiday'),
  publicHoliday('2026-09-25', '추석', 'PUBLIC_HOLIDAY', 'Chuseok'),
  publicHoliday('2026-09-26', '추석 연휴', 'PUBLIC_HOLIDAY', 'Chuseok Holiday'),
  publicHoliday('2026-10-03', '개천절', 'PUBLIC_HOLIDAY', 'National Foundation Day'),
  publicHoliday('2026-10-05', '대체공휴일(개천절)', 'SUBSTITUTE_HOLIDAY', 'Substitute Holiday (National Foundation Day)'),
  publicHoliday('2026-10-09', '한글날', 'PUBLIC_HOLIDAY', 'Hangeul Day'),
  publicHoliday('2026-12-25', '성탄절', 'PUBLIC_HOLIDAY', 'Christmas Day'),
];
