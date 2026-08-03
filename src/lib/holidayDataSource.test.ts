import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bundledKoreanHolidayDataSource,
  getCalendarDayPresentation,
  holidayDisplayName,
  loadKoreanHolidayCalendar,
} from './holidayDataSource';

test('contains the KASI 2026 Liberation Day and substitute holiday records', async () => {
  const records = await bundledKoreanHolidayDataSource.list(2026, 'KR');
  assert.equal(records.find((item) => item.date === '2026-08-15')?.nameKo, '광복절');
  assert.equal(records.find((item) => item.date === '2026-08-17')?.category, 'SUBSTITUTE_HOLIDAY');
  assert.equal(records.find((item) => item.date === '2026-10-05')?.nameKo, '대체공휴일(개천절)');
});

test('keeps public holidays, Sundays, Saturdays, and company closure days distinct', () => {
  const companyClosure = {
    date: '2026-08-18', nameKo: '회사 휴무일', category: 'COMPANY_CLOSED_DAY' as const,
    isPublicHoliday: false, source: 'COMPANY_POLICY' as const,
  };
  assert.equal(getCalendarDayPresentation(new Date(2026, 7, 15), []).isSaturday, true);
  assert.equal(getCalendarDayPresentation(new Date(2026, 7, 16), []).isSunday, true);
  const closure = getCalendarDayPresentation(new Date(2026, 7, 18), [companyClosure]);
  assert.equal(closure.isCompanyClosedDay, true);
  assert.equal(closure.isPublicHoliday, false);
});

test('uses the bundled cache only in explicit demo mode', async () => {
  const result = await loadKoreanHolidayCalendar(2026, 'DEMO_LOCAL');
  assert.equal(result.source, 'KASI_BUNDLED_CACHE');
  assert.equal(result.warning, null);
  assert.ok(result.records.length > 0);
});

test('falls back through translated holiday labels without losing the Korean source name', async () => {
  const records = await bundledKoreanHolidayDataSource.list(2026, 'KR');
  const liberation = records.find((item) => item.date === '2026-08-15');
  assert.ok(liberation);
  assert.equal(holidayDisplayName(liberation, 'ko'), '광복절');
  assert.equal(holidayDisplayName(liberation, 'vi'), 'Liberation Day');
});
