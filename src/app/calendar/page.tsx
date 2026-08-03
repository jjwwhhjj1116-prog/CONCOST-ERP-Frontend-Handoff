'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, Clock3, Landmark, Plus, X } from 'lucide-react';
import { canViewSchedule } from '@/lib/permissions';
import { getUserDisplayName } from '@/lib/localization';
import { holidayDisplayName, loadKoreanHolidayCalendar, type HolidayLoadResult, type HolidayRecord } from '@/lib/holidayDataSource';
import { useAuthStore } from '@/store/authStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useUiStore } from '@/store/uiStore';
import type { PersonalSchedule, ScheduleType } from '@/types/models';
import { ModuleHandoffPanel } from '@/components/handoff/ModuleHandoffPanel';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
} from '@/lib/frontendDataSource';

type ViewMode = 'CALENDAR' | 'TODAY' | 'UPCOMING';

const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
const initialMonth = (value: string | null) => {
  const match = /^(\d{4})-(\d{2})$/.exec(value || '');
  if (!match) return new Date();
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return new Date();
  return new Date(year, month - 1, 1);
};
const typeLabels: Record<ScheduleType, string> = {
  PERSONAL_WORK: '업무', MEETING: '회의', REVIEW: '검토', CLIENT_MEETING: '고객 미팅', INTERNAL_REPORT: '내부 보고',
  PM_PLANNING: 'PM 계획', MANAGER_REVIEW: '관리자 검토', DEPARTMENT_MANAGEMENT: '본부 운영', ETC: '기타', OFF: '휴가',
};
const typeTone: Record<ScheduleType, string> = {
  PERSONAL_WORK: 'border-blue-500 bg-blue-50 text-blue-800', MEETING: 'border-violet-500 bg-violet-50 text-violet-800', REVIEW: 'border-amber-500 bg-amber-50 text-amber-800',
  CLIENT_MEETING: 'border-cyan-500 bg-cyan-50 text-cyan-800', INTERNAL_REPORT: 'border-slate-500 bg-slate-50 text-slate-800', PM_PLANNING: 'border-indigo-500 bg-indigo-50 text-indigo-800',
  MANAGER_REVIEW: 'border-rose-500 bg-rose-50 text-rose-800', DEPARTMENT_MANAGEMENT: 'border-emerald-500 bg-emerald-50 text-emerald-800', ETC: 'border-gray-500 bg-gray-50 text-gray-800', OFF: 'border-orange-500 bg-orange-50 text-orange-800',
};
const typeDot: Record<ScheduleType, string> = {
  PERSONAL_WORK: 'bg-blue-500', MEETING: 'bg-violet-500', REVIEW: 'bg-amber-500', CLIENT_MEETING: 'bg-cyan-500', INTERNAL_REPORT: 'bg-slate-500',
  PM_PLANNING: 'bg-indigo-500', MANAGER_REVIEW: 'bg-rose-500', DEPARTMENT_MANAGEMENT: 'bg-emerald-500', ETC: 'bg-gray-500', OFF: 'bg-orange-500',
};
const inputClass = 'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';

const dateKey = (value: string | Date) => {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (value: string) => new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

export default function CalendarPage() {
  const searchParams = useSearchParams();
  const requestedView = searchParams.get('view');
  const view: ViewMode = requestedView === 'TODAY' || requestedView === 'UPCOMING' ? requestedView : 'CALENDAR';
  const { currentUser, users } = useAuthStore();
  const { schedules, addSchedule } = useScheduleStore();
  const brandWorkspace = useUiStore((state) => state.brandWorkspace);
  const [monthDate, setMonthDate] = useState(() => initialMonth(searchParams.get('month')));
  const [showForm, setShowForm] = useState(false);
  const [holidays, setHolidays] = useState<HolidayRecord[]>([]);
  const [holidayResult, setHolidayResult] = useState<Pick<HolidayLoadResult, 'source' | 'warning'> | null>(null);
  const [holidayError, setHolidayError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('PERSONAL_WORK');
  const [startDateTime, setStartDateTime] = useState(() => `${dateKey(new Date())}T09:00`);
  const [endDateTime, setEndDateTime] = useState(() => `${dateKey(new Date())}T10:00`);
  const [visibility, setVisibility] = useState<PersonalSchedule['visibility']>('PRIVATE');
  const [feedback, setFeedback] = useState<{
    kind: 'SIMULATED' | 'SUCCESS' | 'BLOCKED';
    message: string;
  } | null>(null);
  const calendarBoundary = getFrontendModuleBoundary('CALENDAR', {
    adapterReady: false,
  });

  useEffect(() => {
    let active = true;
    setHolidayError(null);
    loadKoreanHolidayCalendar(monthDate.getFullYear())
      .then((result) => {
        if (!active) return;
        setHolidays(result.records);
        setHolidayResult({ source: result.source, warning: result.warning });
      })
      .catch((error) => {
        if (!active) return;
        setHolidays([]);
        setHolidayResult(null);
        setHolidayError(error instanceof Error ? error.message : '공휴일 정보를 불러오지 못했습니다.');
      });
    return () => { active = false; };
  }, [monthDate]);

  const holidayByDate = useMemo(() => new Map(holidays.map((item) => [item.date, item])), [holidays]);

  const visibleSchedules = useMemo(() => {
    if (!currentUser) return [];
    return schedules
      .filter((schedule) => !schedule.isDeleted && schedule.status !== 'CANCELLED')
      .filter((schedule) => canViewSchedule(currentUser, schedule, users.find((user) => user.id === schedule.userId)))
      .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  }, [currentUser, schedules, users]);

  if (!currentUser) return null;

  const today = dateKey(new Date());
  const todaySchedules = visibleSchedules.filter((schedule) => dateKey(schedule.startDateTime) === today);
  const upcomingSchedules = visibleSchedules.filter((schedule) => dateKey(schedule.startDateTime) > today).slice(0, 30);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const calendarStart = new Date(year, month, 1 - firstDayOffset);
  const cells = Array.from({ length: 42 }, (_, index) => new Date(calendarStart.getFullYear(), calendarStart.getMonth(), calendarStart.getDate() + index));

  const openFormForDate = (date = new Date()) => {
    const key = dateKey(date);
    setStartDateTime(`${key}T09:00`);
    setEndDateTime(`${key}T10:00`);
    setShowForm(true);
  };

  const submitSchedule = async () => {
    if (!title.trim() || !startDateTime || !endDateTime || new Date(endDateTime) < new Date(startDateTime)) return;
    const result = await executeFrontendMutation(calendarBoundary, {
      simulate: () =>
        addSchedule({
          userId: currentUser.id,
          ownerRole: currentUser.role,
          departmentId: currentUser.departmentId,
          title: title.trim(),
          description: description.trim(),
          scheduleType,
          startDateTime: new Date(startDateTime).toISOString(),
          endDateTime: new Date(endDateTime).toISOString(),
          isAllDay: false,
          visibility,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
          requiresApproval: false,
        }),
    });
    setFeedback({ kind: result.kind, message: result.message });
    if (result.kind === 'BLOCKED') return;
    setTitle('');
    setDescription('');
    setShowForm(false);
  };

  return <div className="w-full min-w-0 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
      <div>
        <p className="text-xs font-bold uppercase text-[var(--color-primary)]">Schedule</p>
        <h1 className="mt-1 text-2xl font-black text-[var(--color-text-main)]">{view === 'TODAY' ? '오늘 일정' : view === 'UPCOMING' ? '예정된 일정' : '일정 관리'}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-sub)]">개인 일정과 회의, 프로젝트 연결 일정을 한곳에서 확인합니다.</p>
      </div>
      <button type="button" onClick={() => openFormForDate()} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"><Plus className="h-4 w-4" />일정 추가</button>
    </header>

    <ModuleHandoffPanel
      module="CALENDAR"
      description={{
        ko: '개인·팀·조직·회사·프로젝트 일정은 Backend 연결 전까지 데모 시뮬레이션으로만 동작합니다.',
        vi: 'Lịch cá nhân, nhóm, tổ chức, công ty và dự án chỉ được mô phỏng cho đến khi Backend được kết nối.',
        en: 'Personal, team, organization, company, and project calendars remain simulated until the Backend is connected.',
      }}
    />
    {feedback && (
      <div
        role="status"
        className={`border px-4 py-3 text-xs font-bold ${
          feedback.kind === 'BLOCKED'
            ? 'border-red-200 bg-red-50 text-red-800'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        {feedback.message}
      </div>
    )}

    {view === 'CALENDAR' && <div className="grid min-w-0 gap-5 2xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_12px_30px_rgba(44,54,74,.06)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <button type="button" aria-label="이전 달" onClick={() => setMonthDate(new Date(year, month - 1, 1))} className="rounded-md p-2 hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><ChevronLeft className="h-5 w-5" /></button>
          <h2 className="text-lg font-black text-[var(--color-text-main)]">{year}년 {month + 1}월</h2>
          <button type="button" aria-label="다음 달" onClick={() => setMonthDate(new Date(year, month + 1, 1))} className="rounded-md p-2 hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[10px] font-bold text-[var(--color-text-sub)]">
          <span className="inline-flex items-center gap-1.5"><Landmark className="h-3.5 w-3.5 text-red-600" />대한민국 공휴일</span>
          <span className="text-red-600">일요일·공휴일</span>
          <span className="text-blue-600">토요일</span>
          <span className="text-amber-700">회사 휴무일(별도)</span>
          <span className="ml-auto rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1">
            {holidayResult?.source === 'BACKEND_API' ? 'Backend/KASI' : 'KASI 2026 검증 캐시'}
          </span>
        </div>
        {(holidayResult?.warning || holidayError) && <div role="status" className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900"><AlertTriangle className="h-4 w-4" />{holidayResult?.warning || holidayError}</div>}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-bg)] text-center text-xs font-bold text-[var(--color-text-sub)]">{weekDays.map((day, index) => <div key={day} className={`py-2 ${index === 5 ? 'text-blue-600' : index === 6 ? 'text-red-600' : ''}`}>{day}</div>)}</div>
        <div className="grid grid-cols-7">{cells.map((day) => {
          const key = dateKey(day);
          const inCurrentMonth = day.getMonth() === month;
          const daySchedules = visibleSchedules.filter((schedule) => dateKey(schedule.startDateTime) === key);
          const holiday = holidayByDate.get(key);
          const publicHoliday = Boolean(holiday?.isPublicHoliday);
          const companyClosure = holiday?.category === 'COMPANY_CLOSED_DAY';
          const isSunday = day.getDay() === 0;
          const isSaturday = day.getDay() === 6;
          const dateTone = publicHoliday || isSunday ? 'text-red-600' : isSaturday ? 'text-blue-600' : 'text-[var(--color-text-main)]';
          return <button type="button" onClick={() => openFormForDate(day)} key={key} aria-label={`${key} 일정 추가`} className={`min-h-[116px] border-b border-r border-[var(--color-border)] p-2 text-left align-top hover:bg-orange-50/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary)] xl:min-h-[132px] ${!inCurrentMonth ? 'bg-[var(--color-bg)]/45 text-[var(--color-text-sub)] opacity-55' : ''} ${key === today ? 'bg-orange-50/80 dark:bg-orange-950/10' : ''}`}>
            <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${key === today ? 'bg-[#eb6300] text-white' : dateTone}`}>{day.getDate()}</span>
            {holiday && <span title={holiday.nameKo} className={`mb-1 mt-0.5 block min-h-7 text-[9px] font-black leading-tight ${companyClosure ? 'text-amber-700' : 'text-red-600'}`}>{holidayDisplayName(holiday, brandWorkspace === 'VIET_QS' ? 'vi' : 'ko')}</span>}
            {!holiday && <span className="mb-1 block h-2" />}
            <span className="block space-y-1">{daySchedules.slice(0, 4).map((schedule) => <span key={schedule.id} title={schedule.title} className={`block truncate border-l-2 px-1.5 py-1 text-[10px] font-bold ${typeTone[schedule.scheduleType]}`}><b className="mr-1">{schedule.isAllDay ? '' : formatTime(schedule.startDateTime)}</b>{schedule.title}</span>)}{daySchedules.length > 4 && <span className="block text-[10px] font-bold text-[var(--color-text-sub)]">+{daySchedules.length - 4}건 더보기</span>}</span>
          </button>;
        })}</div>
      </section>
      <aside className="grid content-start gap-5 sm:grid-cols-2 2xl:grid-cols-1"><ScheduleList title="오늘 일정" icon={<Clock3 className="h-5 w-5" />} schedules={todaySchedules} users={users} empty="오늘 등록된 일정이 없습니다." /><ScheduleList title="예정된 일정" icon={<CalendarCheck2 className="h-5 w-5" />} schedules={upcomingSchedules.slice(0, 8)} users={users} empty="예정된 일정이 없습니다." /><section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:col-span-2 2xl:col-span-1"><h2 className="text-sm font-black text-[var(--color-text-main)]">일정 구분</h2><div className="mt-3 grid grid-cols-2 gap-2">{(['PERSONAL_WORK', 'MEETING', 'REVIEW', 'OFF'] as ScheduleType[]).map((type) => <span key={type} className="flex items-center gap-2 text-[11px] font-bold text-[var(--color-text-sub)]"><i className={`h-2.5 w-2.5 rounded-full ${typeDot[type]}`} />{typeLabels[type]}</span>)}</div></section></aside>
    </div>}

    {view === 'TODAY' && <ScheduleList title={`${new Date().toLocaleDateString('ko-KR')} 오늘 일정`} icon={<Clock3 className="h-5 w-5" />} schedules={todaySchedules} users={users} empty="오늘 등록된 일정이 없습니다." />}
    {view === 'UPCOMING' && <ScheduleList title="예정된 일정" icon={<CalendarDays className="h-5 w-5" />} schedules={upcomingSchedules} users={users} empty="예정된 일정이 없습니다." />}

    {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="schedule-form-title" className="w-full max-w-xl rounded-md bg-[var(--color-surface)] shadow-2xl">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4"><div><h2 id="schedule-form-title" className="font-black text-[var(--color-text-main)]">새 일정</h2><p className="mt-1 text-xs text-[var(--color-text-sub)]">{getUserDisplayName(currentUser)}님의 일정으로 저장됩니다.</p></div><button type="button" aria-label="닫기" onClick={() => setShowForm(false)} className="rounded-md p-2 hover:bg-[var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><X className="h-5 w-5" /></button></header>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <label className="md:col-span-2 text-xs font-bold text-[var(--color-text-sub)]">일정 제목<input autoFocus className={`${inputClass} mt-1`} value={title} onChange={(event) => setTitle(event.target.value)} /></label>
          <label className="text-xs font-bold text-[var(--color-text-sub)]">분류<select className={`${inputClass} mt-1`} value={scheduleType} onChange={(event) => setScheduleType(event.target.value as ScheduleType)}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-xs font-bold text-[var(--color-text-sub)]">공개 범위<select className={`${inputClass} mt-1`} value={visibility} onChange={(event) => setVisibility(event.target.value as PersonalSchedule['visibility'])}><option value="PRIVATE">나만 보기</option><option value="DEPARTMENT">부서 공개</option><option value="PROJECT_MEMBERS">프로젝트 구성원</option><option value="MANAGER_ONLY">관리자 공개</option></select></label>
          <label className="text-xs font-bold text-[var(--color-text-sub)]">시작<input type="datetime-local" className={`${inputClass} mt-1`} value={startDateTime} onChange={(event) => setStartDateTime(event.target.value)} /></label>
          <label className="text-xs font-bold text-[var(--color-text-sub)]">종료<input type="datetime-local" className={`${inputClass} mt-1`} value={endDateTime} onChange={(event) => setEndDateTime(event.target.value)} /></label>
          <label className="md:col-span-2 text-xs font-bold text-[var(--color-text-sub)]">메모<textarea className={`${inputClass} mt-1 min-h-24 resize-y`} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-4"><button type="button" onClick={() => setShowForm(false)} className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">취소</button><button type="button" disabled={!title.trim() || new Date(endDateTime) < new Date(startDateTime)} onClick={submitSchedule} className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">저장</button></footer>
      </section>
    </div>}
  </div>;
}

function ScheduleList({ title, icon, schedules, users, empty }: { title: string; icon: React.ReactNode; schedules: PersonalSchedule[]; users: ReturnType<typeof useAuthStore.getState>['users']; empty: string }) {
  return <section className="border border-[var(--color-border)] bg-[var(--color-surface)]"><header className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-main)]">{icon}<h2 className="font-black">{title}</h2><span className="ml-auto text-xs font-bold text-[var(--color-text-sub)]">{schedules.length}건</span></header>{schedules.length ? <ul className="divide-y divide-[var(--color-border)]">{schedules.map((schedule) => { const owner = users.find((user) => user.id === schedule.userId); return <li key={schedule.id} className="flex gap-3 px-4 py-3"><span className={`mt-1 h-3 w-1 shrink-0 ${typeDot[schedule.scheduleType]}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-[var(--color-text-main)]">{schedule.title}</strong><span className="rounded border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-text-sub)]">{typeLabels[schedule.scheduleType]}</span></div><p className="mt-1 text-xs text-[var(--color-text-sub)]">{new Date(schedule.startDateTime).toLocaleDateString('ko-KR')} {formatTime(schedule.startDateTime)} - {formatTime(schedule.endDateTime)} · {owner ? getUserDisplayName(owner) : schedule.userId}</p>{schedule.description && <p className="mt-1 truncate text-xs text-[var(--color-text-sub)]">{schedule.description}</p>}</div></li>; })}</ul> : <p className="px-4 py-10 text-center text-sm text-[var(--color-text-sub)]">{empty}</p>}</section>;
}
