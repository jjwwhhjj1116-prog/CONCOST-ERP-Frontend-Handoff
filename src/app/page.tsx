'use client';
import React, { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { SuperAdminDashboard } from '@/components/dashboard/SuperAdminDashboard';
import { DepartmentManagerDashboard } from '@/components/dashboard/DepartmentManagerDashboard';
import { PMDashboard } from '@/components/dashboard/PMDashboard';
import { WorkerDashboard } from '@/components/dashboard/WorkerDashboard';
import { useProjectStore } from '@/store/projectStore';
import { useTranslationStore } from '@/store/translationStore';
import { useTranslation } from '@/lib/localization';
import { getWorkspaceHomeCopy, localizeShellText } from '@/lib/workspaceShellLocalization';
import { Download, Upload } from 'lucide-react';
import { WorkspaceWidgetPortal } from '@/components/dashboard/WorkspaceWidgetPortal';
import { applyImportData, downloadJson, exportWorkspaceData, validateImportData } from '@/lib/jsonHandoff';

export default function Home() {
  const { currentUser } = useAuthStore();
  const { projects } = useProjectStore();
  const [selectedMonth, setSelectedMonth] = useState<string | 'ALL'>('ALL');
  const [message, setMessage] = useState('');
  const importRef = React.useRef<HTMLInputElement>(null);

  const { settings } = useTranslationStore();
  const t = useTranslation(settings.uiLanguage);
  const homeCopy = getWorkspaceHomeCopy(settings.uiLanguage);

  const getDeptName = () => {
    if (!currentUser) return '';
    if (currentUser.departmentName) return localizeShellText(currentUser.departmentName, settings.uiLanguage);
    if (currentUser.teamName) return localizeShellText(currentUser.teamName, settings.uiLanguage);
    if (currentUser.companyId === 'CON_COST') return t('header.dept.hq');
    if (currentUser.companyId === 'VIET_QS') return 'Viet_QS';
    return t('header.dept.none');
  };

  const getRoleName = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: t('header.role.superAdmin'),
      SYSTEM_ADMIN: t('header.role.systemAdmin'),
      DEPARTMENT_MANAGER: t('header.role.deptManager'),
      PM: t('header.role.pm'),
      WORKER: t('header.role.worker')
    };
    return roleMap[role] || role;
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    projects.forEach(p => {
      const dateStr = p.deliveryDate || p.targetDate;
      if (dateStr && dateStr.length >= 7) {
        months.add(dateStr.substring(0, 7)); // "YYYY-MM"
      }
    });
    return Array.from(months).sort().reverse(); // 최신 월 순서로
  }, [projects]);

  if (!currentUser) return <div className="p-6">{t('dashboard.loading')}</div>;

  const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(currentUser.role);
  const handleExportJson = () => downloadJson(exportWorkspaceData(), `workspace-export-${new Date().toISOString().slice(0, 10)}.json`);
  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload: unknown = JSON.parse(String(reader.result));
        if (!validateImportData(payload)) throw new Error('invalid workspace json');
        applyImportData(payload);
        setMessage(homeCopy.importSuccess);
      } catch {
        setMessage(homeCopy.importInvalid);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="w-full mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="cc-page-heading">
          <h1 className="text-2xl md:text-[30px] font-extrabold text-[var(--color-text-main)] tracking-[-0.025em]">{t('dashboard.title')}</h1>
          <p className="text-[var(--color-text-sub)] text-sm mt-1 font-medium">
            {getDeptName()} · {getRoleName(currentUser.role)} {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="border border-[var(--color-border)] rounded-md px-3 py-1.5 bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-main)] shadow-sm outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] transition-colors"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="ALL">{t('dashboard.filter.allMonths')}</option>
            {availableMonths.map(m => {
              const [year, month] = m.split('-');
              return (
                <option key={m} value={m}>{t('common.yearMonth', { year, month: parseInt(month, 10).toString() })}</option>
              );
            })}
          </select>

          {isAdmin && <>
            <input ref={importRef} type="file" accept="application/json,.json" className="sr-only" onChange={handleImportJson} />
            <button type="button" onClick={() => importRef.current?.click()} className="flex min-h-10 items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-strong)] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00]">
              <Upload className="w-4 h-4 text-[var(--color-text-sub)]" />
              <span>{t('dashboard.actions.importJson')}</span>
            </button>

            <button type="button" onClick={handleExportJson} className="flex min-h-10 items-center gap-1.5 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-sm font-semibold text-[var(--color-text-main)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-strong)] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00]">
              <Download className="w-4 h-4 text-[var(--color-text-sub)]" />
              <span>{t('dashboard.actions.exportJson')}</span>
            </button>
          </>}
        </div>
      </div>

      {message && <div role="status" className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-bold text-orange-800">{message}</div>}
      <WorkspaceWidgetPortal />

      <details className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-black text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff6b00]">{homeCopy.roleDetails} <span className="text-[10px] font-bold text-[var(--color-text-sub)] group-open:hidden">{homeCopy.expand}</span><span className="hidden text-[10px] font-bold text-[var(--color-text-sub)] group-open:inline">{homeCopy.collapse}</span></summary>
        <div className="border-t border-[var(--color-border)] p-4">
          {currentUser.role === 'SUPER_ADMIN' && <SuperAdminDashboard selectedMonth={selectedMonth} />}
          {currentUser.role === 'SYSTEM_ADMIN' && <SuperAdminDashboard selectedMonth={selectedMonth} />}
          {currentUser.role === 'DEPARTMENT_MANAGER' && <DepartmentManagerDashboard selectedMonth={selectedMonth} />}
          {currentUser.role === 'PM' && <PMDashboard selectedMonth={selectedMonth} />}
          {currentUser.role === 'WORKER' && <WorkerDashboard selectedMonth={selectedMonth} />}
        </div>
      </details>
    </div>
  );
}
