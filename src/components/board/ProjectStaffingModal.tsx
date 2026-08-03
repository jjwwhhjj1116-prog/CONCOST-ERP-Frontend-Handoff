'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BriefcaseBusiness, Check, Search, ShieldAlert, UserRoundCheck, UsersRound, X } from 'lucide-react';
import type { Project, ProjectExecutionUnitId } from '@/types/models';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuditStore } from '@/store/auditStore';
import { useTranslationStore } from '@/store/translationStore';
import { getUserDisplayName, useTranslation } from '@/lib/localization';
import { canEditProject } from '@/lib/permissions';
import { isDemoLocalMode } from '@/lib/runtimeExecutionMode';
import {
  getEligibleProjectPersonnel,
  getProjectAssignment,
  getProjectStaffingUnitLabel,
  updateExecutionAssignmentStaffing,
  validateProjectStaffing,
} from '@/lib/projectStaffing';

interface ProjectStaffingModalProps {
  project: Project;
  initialUnitId?: ProjectExecutionUnitId | null;
  onClose: () => void;
  onSaved: (unitId: ProjectExecutionUnitId) => void;
}

export const ProjectStaffingModal: React.FC<ProjectStaffingModalProps> = ({
  project,
  initialUnitId,
  onClose,
  onSaved,
}) => {
  const { users, currentUser } = useAuthStore();
  const updateProjectField = useProjectStore((state) => state.updateProjectField);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const addLog = useAuditStore((state) => state.addLog);
  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);
  const assignments = useMemo(() => project.executionAssignments || [], [project.executionAssignments]);
  const initialAssignment = getProjectAssignment(project, initialUnitId);
  const [unitId, setUnitId] = useState<ProjectExecutionUnitId | null>(initialAssignment?.unitId || null);
  const [pmId, setPmId] = useState(initialAssignment?.pmId || '');
  const [personnelIds, setPersonnelIds] = useState<string[]>(initialAssignment?.personnelIds || []);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  const assignment = unitId ? assignments.find((candidate) => candidate.unitId === unitId) : undefined;
  const candidates = useMemo(
    () => unitId ? getEligibleProjectPersonnel(users, project, unitId) : [],
    [project, unitId, users],
  );
  const filteredCandidates = candidates.filter((person) => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return true;
    return [getUserDisplayName(person), person.departmentName, person.subDepartmentName, person.teamName, person.jobTitle, person.position]
      .filter(Boolean)
      .some((value) => String(value).toLocaleLowerCase().includes(term));
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  const togglePerson = (personId: string) => {
    if (personId === pmId) return;
    setPersonnelIds((current) => current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId]);
  };

  const handlePmChange = (nextPmId: string) => {
    setPmId(nextPmId);
    if (nextPmId) setPersonnelIds((current) => Array.from(new Set([nextPmId, ...current])));
  };

  const handleUnitChange = (nextUnitId: ProjectExecutionUnitId) => {
    const nextAssignment = assignments.find((candidate) => candidate.unitId === nextUnitId);
    setUnitId(nextUnitId);
    setPmId(nextAssignment?.pmId || '');
    setPersonnelIds(nextAssignment?.personnelIds || []);
    setSearch('');
    setFeedback('');
  };

  const handleSave = () => {
    if (!currentUser || !canEditProject(currentUser, project)) {
      setFeedback(t('projects.noEditAuthAlert'));
      return;
    }
    if (!isDemoLocalMode()) {
      setFeedback(t('board.staffing.serverRequired'));
      return;
    }
    if (!unitId || !assignment) {
      setFeedback(t('board.staffing.unitRequired'));
      return;
    }
    const validation = validateProjectStaffing(pmId, personnelIds);
    if (validation) {
      setFeedback(validation === 'PM_REQUIRED'
        ? t('board.staffing.pmRequired')
        : validation === 'PM_MUST_BE_INCLUDED'
          ? t('board.staffing.pmIncluded')
          : t('board.staffing.personnelRequired'));
      return;
    }

    const updatedAt = new Date().toISOString();
    const updatedAssignments = updateExecutionAssignmentStaffing({
      assignments,
      unitId,
      pmId,
      personnelIds,
      actorId: currentUser.id,
      updatedAt,
    });
    updateProjectField(project.id, 'executionAssignments', updatedAssignments);
    if (assignment.role === 'PRIMARY' || project.primaryUnitId === unitId || !project.pmId) {
      updateProjectField(project.id, 'pmId', pmId);
    }

    const unitLabel = getProjectStaffingUnitLabel(unitId, settings.uiLanguage);
    Array.from(new Set([pmId, ...personnelIds]))
      .filter((userId) => userId !== currentUser.id)
      .forEach((userId) => addNotification({
        userId,
        type: 'ASSIGNMENT',
        title: t('board.staffing.notificationTitle'),
        message: t('board.staffing.notificationMessage', { project: project.title, unit: unitLabel }),
        priority: userId === pmId ? 'HIGH' : 'NORMAL',
        relatedProjectId: project.id,
      }));
    addLog({
      entityType: 'PROJECT',
      entityId: project.id,
      action: 'UPDATE',
      actorId: currentUser.id,
      message: `${unitLabel} staffing updated: PM=${pmId}, personnel=${Array.from(new Set([pmId, ...personnelIds])).join(',')}`,
    });
    onSaved(unitId);
  };

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-slate-950/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-staffing-title"
        className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden bg-[var(--color-surface)] shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-5xl sm:rounded-2xl sm:border sm:border-[var(--color-border)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-border)] bg-[linear-gradient(135deg,#fff8ee,#f3f8fb)] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-[var(--color-primary)]"><UsersRound className="h-4 w-4" /> Project staffing</div>
            <h2 id="project-staffing-title" className="truncate text-xl font-black text-[var(--color-text-main)]">{t('board.staffing.title')}</h2>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-sub)]">{project.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common.close')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-white text-slate-600 transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><X className="h-5 w-5" /></button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(260px,.72fr)_minmax(0,1.6fr)]">
            <aside className="space-y-4">
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4">
                <label className="mb-2 block text-xs font-black text-[var(--color-text-main)]">{t('board.staffing.unit')}</label>
                <select value={unitId || ''} onChange={(event) => handleUnitChange(event.target.value as ProjectExecutionUnitId)} className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                  {assignments.map((item) => <option key={item.id} value={item.unitId}>{getProjectStaffingUnitLabel(item.unitId, settings.uiLanguage)}</option>)}
                </select>
              </div>

              <div className="rounded-xl border border-[var(--color-border)] bg-white p-4">
                <label className="mb-2 flex items-center gap-2 text-xs font-black text-[var(--color-text-main)]"><UserRoundCheck className="h-4 w-4 text-[var(--color-primary)]" />{t('board.staffing.pm')}</label>
                <select value={pmId} onChange={(event) => handlePmChange(event.target.value)} className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                  <option value="">{t('board.staffing.pmPlaceholder')}</option>
                  {candidates.map((person) => <option key={person.id} value={person.id}>{getUserDisplayName(person)} · {person.jobTitle || person.position || person.role}</option>)}
                </select>
                <p className="mt-2 text-xs leading-5 text-[var(--color-text-sub)]">{t('board.staffing.pmHelp')}</p>
              </div>

              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-xs leading-5 text-sky-900">
                <div className="mb-1 flex items-center gap-2 font-black"><BriefcaseBusiness className="h-4 w-4" />{t('board.staffing.nextTitle')}</div>
                {t('board.staffing.nextHelp')}
              </div>
            </aside>

            <div className="min-w-0 rounded-xl border border-[var(--color-border)] bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-base font-black text-[var(--color-text-main)]">{t('board.staffing.people')}</h3>
                  <p className="mt-1 text-xs text-[var(--color-text-sub)]">{t('board.staffing.selectedCount', { count: String(personnelIds.length) })}</p>
                </div>
                <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 sm:w-72">
                  <Search className="h-4 w-4 shrink-0 text-[var(--color-text-sub)]" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('board.staffing.search')} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </label>
              </div>

              {filteredCandidates.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredCandidates.map((person) => {
                    const selected = personnelIds.includes(person.id);
                    const isPm = pmId === person.id;
                    return (
                      <label key={person.id} className={`group flex min-h-[72px] cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${selected ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-[var(--color-border)] bg-white hover:border-orange-200 hover:bg-orange-50/40'}`}>
                        <input type="checkbox" checked={selected} onChange={() => togglePerson(person.id)} className="sr-only" />
                        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-xs font-black ${selected ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-600'}`}>{selected ? <Check className="h-5 w-5" /> : getUserDisplayName(person).slice(0, 1)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-1.5"><strong className="truncate text-sm text-[var(--color-text-main)]">{getUserDisplayName(person)}</strong>{isPm && <span className="shrink-0 rounded bg-orange-100 px-1.5 py-0.5 text-[9px] font-black text-orange-700">PM</span>}</span>
                          <span className="mt-1 block truncate text-[11px] font-medium text-[var(--color-text-sub)]">{person.jobTitle || person.position || person.role} · {person.departmentName || person.teamName}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center">
                  <ShieldAlert className="h-7 w-7 text-amber-600" />
                  <strong className="mt-2 text-sm text-amber-900">{t('board.staffing.noCandidates')}</strong>
                  <p className="mt-1 text-xs text-amber-800">{t('board.staffing.noCandidatesHelp')}</p>
                </div>
              )}
            </div>
          </div>

          {feedback && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{feedback}</div>}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-[var(--color-border)] bg-[var(--cc-surface-2)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-[var(--color-border)] bg-white px-5 text-sm font-bold text-[var(--color-text-main)] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{t('common.cancel')}</button>
          <button type="button" onClick={handleSave} className="min-h-11 rounded-lg bg-[var(--color-primary)] px-5 text-sm font-black text-white shadow-lg shadow-orange-500/15 transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300">{t('board.staffing.saveAndOpen')}</button>
        </footer>
      </section>
    </div>
  );

  return createPortal(modal, document.body);
};
