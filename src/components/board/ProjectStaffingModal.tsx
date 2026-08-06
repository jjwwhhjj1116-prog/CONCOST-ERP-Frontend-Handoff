'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronDown, Play, Save, Search, ShieldAlert, UserPlus, UsersRound, X } from 'lucide-react';
import type { Project, ProjectExecutionUnitId, ProjectStaffingPlanStatus, ProjectStaffingRoleAssignment } from '@/types/models';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuditStore } from '@/store/auditStore';
import { useTranslationStore } from '@/store/translationStore';
import { getUserDisplayName, useTranslation } from '@/lib/localization';
import { canEditProject } from '@/lib/permissions';
import { isDemoLocalMode } from '@/lib/runtimeExecutionMode';
import {
  createProjectStaffingPlan,
  getEligibleProjectPersonnel,
  getProjectAssignment,
  getProjectStaffingRoleLabel,
  getProjectStaffingUnitLabel,
  getSupportProjectPersonnel,
  updateExecutionAssignmentStaffing,
  validateProjectStaffingPlan,
} from '@/lib/projectStaffing';

interface ProjectStaffingModalProps {
  project: Project;
  initialUnitId?: ProjectExecutionUnitId | null;
  onClose: () => void;
  onSaved: (unitId: ProjectExecutionUnitId, status: ProjectStaffingPlanStatus) => void;
}

const copy = {
  ko: {
    eyebrow: '부서별 투입계획', title: '공종·투입인원 배정', unit: '담당부서', role: '공종', people: '투입인원',
    start: '투입일', end: '종료일', add: '사람 추가·해제', support: '다른 부서 지원인력', own: '해당 부서 인력',
    search: '이름·직책 검색', empty: '선택 가능한 인력이 없습니다.', draft: '배정 임시저장', confirm: '배정 확정',
    startNow: '배정 확정 및 착수', pmHelp: 'PM은 정확히 1명, 나머지 공종은 여러 명을 선택할 수 있습니다.',
    history: '저장할 때 이전·이후 배정과 사유·담당자·시각·Revision을 기록합니다.', reason: '배정 사유',
  },
  vi: {
    eyebrow: 'Kế hoạch nhân sự', title: 'Phân công hạng mục và nhân sự', unit: 'Đơn vị', role: 'Hạng mục', people: 'Nhân sự',
    start: 'Ngày vào', end: 'Ngày kết thúc', add: 'Thêm / gỡ người', support: 'Nhân sự hỗ trợ đơn vị khác', own: 'Nhân sự trong đơn vị',
    search: 'Tìm tên / chức danh', empty: 'Không có nhân sự phù hợp.', draft: 'Lưu nháp phân công', confirm: 'Xác nhận phân công',
    startNow: 'Xác nhận và bắt đầu', pmHelp: 'PM phải đúng 1 người; các hạng mục khác cho phép chọn nhiều người.',
    history: 'Mỗi lần lưu ghi nhận trước/sau, lý do, người thao tác, thời gian và revision.', reason: 'Lý do phân công',
  },
  en: {
    eyebrow: 'Unit staffing plan', title: 'Assign roles and personnel', unit: 'Execution unit', role: 'Role', people: 'Personnel',
    start: 'Start date', end: 'End date', add: 'Add / remove people', support: 'Support from another unit', own: 'Unit personnel',
    search: 'Search name or title', empty: 'No eligible personnel found.', draft: 'Save staffing draft', confirm: 'Confirm staffing',
    startNow: 'Confirm and start', pmHelp: 'Exactly one PM is required; every other role supports multiple people.',
    history: 'Each save records before/after, reason, actor, timestamp, and revision.', reason: 'Assignment reason',
  },
};

export const ProjectStaffingModal: React.FC<ProjectStaffingModalProps> = ({ project, initialUnitId, onClose, onSaved }) => {
  const { users, currentUser } = useAuthStore();
  const updateProjectField = useProjectStore((state) => state.updateProjectField);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addLog = useAuditStore((state) => state.addLog);
  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);
  const text = copy[settings.uiLanguage];
  const assignments = useMemo(() => project.executionAssignments || [], [project.executionAssignments]);
  const initialAssignment = getProjectAssignment(project, initialUnitId);
  const [unitId, setUnitId] = useState<ProjectExecutionUnitId | null>(initialAssignment?.unitId || null);
  const [plan, setPlan] = useState<ProjectStaffingRoleAssignment[]>(() => initialAssignment
    ? createProjectStaffingPlan(initialAssignment.unitId, initialAssignment.staffingPlan)
    : []);
  const [activeRoleId, setActiveRoleId] = useState('PM');
  const [showSupport, setShowSupport] = useState(false);
  const [search, setSearch] = useState('');
  const [reason, setReason] = useState('프로젝트 착수 전 공종별 투입계획');
  const [feedback, setFeedback] = useState('');
  const assignment = unitId ? assignments.find((candidate) => candidate.unitId === unitId) : undefined;
  const canUseSupport = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'DEPARTMENT_MANAGER' || currentUser?.role === 'SYSTEM_ADMIN';
  const ownCandidates = useMemo(() => unitId ? getEligibleProjectPersonnel(users, project, unitId) : [], [project, unitId, users]);
  const supportCandidates = useMemo(() => unitId ? getSupportProjectPersonnel(users, project, unitId) : [], [project, unitId, users]);
  const candidates = showSupport && canUseSupport ? supportCandidates : ownCandidates;
  const filteredCandidates = candidates.filter((person) => {
    const term = search.trim().toLocaleLowerCase();
    return !term || [getUserDisplayName(person), person.departmentName, person.subDepartmentName, person.teamName, person.jobTitle, person.position]
      .filter(Boolean).some((value) => String(value).toLocaleLowerCase().includes(term));
  });
  const activeRole = plan.find((role) => role.roleId === activeRoleId) || plan[0];
  const selectedMemberIds = Array.from(new Set(plan.flatMap((role) => role.personnelIds)));

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', handleKeyDown); };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const updateRole = (roleId: string, updates: Partial<ProjectStaffingRoleAssignment>) => {
    setPlan((current) => current.map((role) => role.roleId === roleId ? { ...role, ...updates } : role));
    setFeedback('');
  };

  const togglePerson = (personId: string) => {
    if (!activeRole) return;
    const nextIds = activeRole.roleId === 'PM'
      ? [personId]
      : activeRole.personnelIds.includes(personId)
        ? activeRole.personnelIds.filter((id) => id !== personId)
        : [...activeRole.personnelIds, personId];
    updateRole(activeRole.roleId, { personnelIds: nextIds });
  };

  const handleUnitChange = (nextUnitId: ProjectExecutionUnitId) => {
    const next = assignments.find((candidate) => candidate.unitId === nextUnitId);
    setUnitId(nextUnitId);
    setPlan(createProjectStaffingPlan(nextUnitId, next?.staffingPlan));
    setActiveRoleId('PM');
    setShowSupport(false);
    setSearch('');
    setFeedback('');
  };

  const handleSave = (staffingStatus: ProjectStaffingPlanStatus) => {
    if (!currentUser || !canEditProject(currentUser, project)) return setFeedback(t('projects.noEditAuthAlert'));
    if (!isDemoLocalMode()) return setFeedback(t('board.staffing.serverRequired'));
    if (!unitId || !assignment) return setFeedback(t('board.staffing.unitRequired'));
    const validation = validateProjectStaffingPlan(plan, staffingStatus);
    if (validation) {
      setFeedback(validation === 'PM_EXACTLY_ONE_REQUIRED'
        ? text.pmHelp
        : validation === 'INVALID_DATE_RANGE'
          ? '투입일은 종료일보다 늦을 수 없습니다.'
          : '공종 배정 구성을 확인해 주세요.');
      return;
    }
    const updatedAt = new Date().toISOString();
    const updatedAssignments = updateExecutionAssignmentStaffing({
      assignments, unitId, staffingPlan: plan, staffingStatus, actorId: currentUser.id, updatedAt,
      reason: reason.trim() || text.reason,
    });
    const updatedAssignment = updatedAssignments.find((item) => item.unitId === unitId)!;
    updateProjectField(project.id, 'executionAssignments', updatedAssignments);
    if (assignment.role === 'PRIMARY' || project.primaryUnitId === unitId || !project.pmId) updateProjectField(project.id, 'pmId', updatedAssignment.pmId || undefined);
    if (staffingStatus === 'ACTIVE') updateProjectField(project.id, 'status', 'IN_PROGRESS');

    const unitLabel = getProjectStaffingUnitLabel(unitId, settings.uiLanguage);
    updatedAssignment.personnelIds?.filter((userId) => userId !== currentUser.id).forEach((userId) => addNotification({
      userId, type: 'ASSIGNMENT', title: t('board.staffing.notificationTitle'),
      message: t('board.staffing.notificationMessage', { project: project.title, unit: unitLabel }),
      priority: userId === updatedAssignment.pmId ? 'HIGH' : 'NORMAL', relatedProjectId: project.id,
    }));
    addLog({
      entityType: 'PROJECT', entityId: project.id, action: 'UPDATE', actorId: currentUser.id,
      message: `${updatedAssignment.staffingHistories?.[0]?.action}; unit=${unitId}; revision=${updatedAssignment.staffingRevision}; status=${staffingStatus}`,
    });
    onSaved(unitId, staffingStatus);
  };

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-end justify-center overflow-hidden bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="project-staffing-title" onMouseDown={(event) => event.stopPropagation()} className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-[var(--color-surface)] shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-6xl sm:rounded-2xl sm:border sm:border-[var(--color-border)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-border)] bg-[linear-gradient(135deg,#fff8ee,#eff8fb)] px-4 py-4 sm:px-6">
          <div className="min-w-0"><p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-[var(--color-primary)]"><UsersRound className="size-4" />{text.eyebrow}</p><h2 id="project-staffing-title" className="mt-1 truncate text-xl font-black">{text.title}</h2><p className="mt-1 truncate text-sm text-[var(--color-text-sub)]">{project.projectNo ? `${project.projectNo} · ` : ''}{project.title}</p></div>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid size-10 shrink-0 place-items-center rounded-full border bg-white transition hover:border-orange-300 hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><X className="size-5" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
            <aside className="space-y-3">
              <label className="block rounded-xl border bg-[var(--cc-surface-2)] p-4 text-xs font-black">{text.unit}<select value={unitId || ''} onChange={(event) => handleUnitChange(event.target.value as ProjectExecutionUnitId)} className="mt-2 min-h-11 w-full rounded-lg border bg-white px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{assignments.map((item) => <option key={item.id} value={item.unitId}>{getProjectStaffingUnitLabel(item.unitId, settings.uiLanguage)}</option>)}</select></label>
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-950"><strong className="block">{text.pmHelp}</strong><span className="mt-1 block">{text.history}</span></div>
              <label className="block rounded-xl border bg-white p-4 text-xs font-black">{text.reason}<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-2 w-full resize-y rounded-lg border p-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]" /></label>
              <dl className="grid grid-cols-2 gap-2 rounded-xl border bg-white p-4 text-xs"><dt className="text-[var(--color-text-sub)]">상태</dt><dd className="text-right font-black">{assignment?.staffingStatus || 'DRAFT'}</dd><dt className="text-[var(--color-text-sub)]">Revision</dt><dd className="text-right font-black">{assignment?.staffingRevision || 0}</dd><dt className="text-[var(--color-text-sub)]">총 인원</dt><dd className="text-right font-black">{selectedMemberIds.length}</dd></dl>
            </aside>

            <div className="min-w-0 space-y-4">
              <div className="overflow-hidden rounded-xl border bg-white">
                <div className="hidden grid-cols-[150px_minmax(180px,1fr)_145px_145px_120px] gap-2 border-b bg-[var(--cc-surface-2)] px-4 py-2 text-[10px] font-black uppercase text-[var(--color-text-sub)] md:grid"><span>{text.role}</span><span>{text.people}</span><span>{text.start}</span><span>{text.end}</span><span /></div>
                <div className="divide-y">{plan.map((role) => {
                  const selectedPeople = role.personnelIds.map((id) => users.find((user) => user.id === id)).filter(Boolean);
                  return <div key={role.roleId} className={`grid gap-3 p-4 transition md:grid-cols-[150px_minmax(180px,1fr)_145px_145px_120px] md:items-center ${activeRoleId === role.roleId ? 'bg-orange-50/70 shadow-[inset_4px_0_0_var(--color-primary)]' : 'hover:bg-slate-50'}`}>
                    <button type="button" onClick={() => setActiveRoleId(role.roleId)} className="flex min-h-10 items-center justify-between gap-2 rounded-lg text-left font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><span>{getProjectStaffingRoleLabel(unitId!, role.roleLabel, settings.uiLanguage)}</span><ChevronDown className={`size-4 transition ${activeRoleId === role.roleId ? 'rotate-180 text-[var(--color-primary)]' : 'text-slate-400'}`} /></button>
                    <div className="min-w-0"><div className="flex items-center gap-2"><div className="flex -space-x-2">{selectedPeople.slice(0, 4).map((person) => <span key={person!.id} title={getUserDisplayName(person!)} className="grid size-8 place-items-center rounded-full border-2 border-white bg-sky-700 text-[10px] font-black text-white">{getUserDisplayName(person!).slice(0, 1)}</span>)}</div>{selectedPeople.length > 4 && <span className="text-xs font-black text-[var(--color-primary)]">+{selectedPeople.length - 4}</span>}{selectedPeople.length === 0 && <span className="text-xs font-semibold text-amber-700">미배정</span>}</div><p className="mt-1 truncate text-[10px] text-[var(--color-text-sub)]">{selectedPeople.map((person) => getUserDisplayName(person!)).join(', ') || text.add}</p></div>
                    <label className="text-[10px] font-bold text-[var(--color-text-sub)] md:text-transparent">{text.start}<input type="date" value={role.startDate || ''} onChange={(event) => updateRole(role.roleId, { startDate: event.target.value || null })} className="mt-1 min-h-10 w-full rounded-lg border bg-white px-2 text-xs text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:mt-0" /></label>
                    <label className="text-[10px] font-bold text-[var(--color-text-sub)] md:text-transparent">{text.end}<input type="date" value={role.endDate || ''} onChange={(event) => updateRole(role.roleId, { endDate: event.target.value || null })} className="mt-1 min-h-10 w-full rounded-lg border bg-white px-2 text-xs text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:mt-0" /></label>
                    <button type="button" onClick={() => { setActiveRoleId(role.roleId); setShowSupport(false); }} className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border bg-white px-2 text-xs font-black transition hover:border-orange-300 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><UserPlus className="size-4" />{text.add}</button>
                  </div>;
                })}</div>
              </div>

              {activeRole && <section className="rounded-xl border bg-white p-4" aria-label={`${activeRole.roleLabel} ${text.people}`}>
                <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.12em] text-[var(--color-primary)]">{text.people}</p><h3 className="mt-1 font-black">{getProjectStaffingRoleLabel(unitId!, activeRole.roleLabel, settings.uiLanguage)} · {activeRole.roleId === 'PM' ? '1명 단일선택' : '복수선택'}</h3></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setShowSupport(false)} aria-pressed={!showSupport} className={`rounded-lg border px-3 py-2 text-xs font-black ${!showSupport ? 'border-orange-300 bg-orange-50 text-orange-800' : ''}`}>{text.own}</button>{canUseSupport && <button type="button" onClick={() => setShowSupport(true)} aria-pressed={showSupport} className={`rounded-lg border px-3 py-2 text-xs font-black ${showSupport ? 'border-sky-300 bg-sky-50 text-sky-800' : ''}`}>{text.support}</button>}</div></div>
                {showSupport && <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">권한이 있는 관리자만 다른 부서 지원인력을 별도로 추가할 수 있습니다.</p>}
                <label className="mt-3 flex min-h-11 items-center gap-2 rounded-lg border bg-[var(--cc-surface-2)] px-3"><Search className="size-4 text-[var(--color-text-sub)]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text.search} className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label>
                {filteredCandidates.length > 0 ? <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{filteredCandidates.map((person) => {
                  const selected = activeRole.personnelIds.includes(person.id);
                  return <button key={person.id} type="button" aria-pressed={selected} onClick={() => togglePerson(person.id)} className={`flex min-h-[68px] items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${selected ? 'border-orange-300 bg-orange-50 shadow-sm' : 'hover:border-orange-200 hover:bg-orange-50/40'}`}><span className={`grid size-10 shrink-0 place-items-center rounded-full text-xs font-black ${selected ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-600'}`}>{selected ? <Check className="size-5" /> : getUserDisplayName(person).slice(0, 1)}</span><span className="min-w-0"><strong className="block truncate text-sm">{getUserDisplayName(person)}</strong><span className="mt-1 block truncate text-[11px] text-[var(--color-text-sub)]">{person.jobTitle || person.position || person.role} · {person.teamName || person.departmentName}</span></span></button>;
                })}</div> : <div className="mt-4 flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50 p-5 text-center"><ShieldAlert className="size-6 text-amber-700" /><strong className="mt-2 text-sm text-amber-900">{text.empty}</strong></div>}
              </section>}
              {feedback && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{feedback}</div>}
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t bg-[var(--cc-surface-2)] px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border bg-white px-4 text-sm font-bold hover:bg-slate-50">{t('common.cancel')}</button>
          <button type="button" onClick={() => handleSave('DRAFT')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-orange-300 bg-white px-4 text-sm font-black text-orange-800 hover:bg-orange-50"><Save className="size-4" />{text.draft}</button>
          <button type="button" onClick={() => handleSave('CONFIRMED')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 text-sm font-black text-white hover:bg-sky-800"><CalendarDays className="size-4" />{text.confirm}</button>
          <button type="button" onClick={() => handleSave('ACTIVE')} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-black text-white shadow-lg shadow-orange-500/15 hover:brightness-95"><Play className="size-4" />{text.startNow}</button>
        </footer>
      </section>
    </div>
  );
  return createPortal(modal, document.body);
};
