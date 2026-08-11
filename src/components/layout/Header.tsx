'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, ChevronsRight, LogOut, Menu, MoonStar, Search, Settings2, ShieldCheck, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import { useTranslation } from '@/lib/localization';
import { getWorkspaceShellCopy, localizeShellText } from '@/lib/workspaceShellLocalization';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { useProfilePhotoStore } from '@/store/profilePhotoStore';
import { NotificationPopover } from './NotificationPopover';

const releaseChannel = process.env.NEXT_PUBLIC_RELEASE_CHANNEL?.trim();
const buildShortSha = process.env.NEXT_PUBLIC_BUILD_SHA?.trim().slice(0, 7);

export function Header() {
  const pathname = usePathname();
  const { currentUser, logout, appMode, setAppMode } = useAuthStore();
  const { settings, updateSettings } = useTranslationStore();
  const { isDarkMode, toggleDarkMode, brandWorkspace, setBrandWorkspace } = useUiStore();
  const profilePhoto = useProfilePhotoStore((state) =>
    currentUser ? state.appliedPreviewByUserId[currentUser.id] : undefined,
  );
  const [profileOpen, setProfileOpen] = React.useState(false);
  const t = useTranslation(settings.uiLanguage);
  const copy = getWorkspaceShellCopy(settings.uiLanguage);

  React.useEffect(() => {
    document.documentElement.lang = settings.uiLanguage;
  }, [settings.uiLanguage]);

  if (!currentUser) return null;
  const isAdmin = ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(currentUser.role);
  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: t('header.role.superAdmin'),
    SYSTEM_ADMIN: t('header.role.systemAdmin'),
    DEPARTMENT_MANAGER: t('header.role.deptManager'),
    PM: t('header.role.pm'),
    WORKER: t('header.role.worker'),
    EVALUATION_ADMIN: settings.uiLanguage === 'vi' ? 'Quản trị đánh giá' : '평가관리자',
  };
  const scopeLabel = currentUser.role === 'SUPER_ADMIN'
    ? localizeShellText('전사', settings.uiLanguage)
    : localizeShellText(currentUser.departmentName || currentUser.teamName || t('header.dept.none'), settings.uiLanguage);
  const sectionLabel = localizeShellText(pathname.startsWith('/projects') ? '프로젝트' : pathname.startsWith('/schedules') ? '일정 관리' : pathname.startsWith('/approvals') ? '전자결재' : pathname.startsWith('/mail') ? '전자메일' : pathname.startsWith('/tasks') ? '할일' : pathname.startsWith('/drive') ? '드라이브' : pathname.startsWith('/board') || pathname.startsWith('/organization') ? '게시판' : pathname.startsWith('/settings') ? '설정' : 'HOME', settings.uiLanguage);
  const selectWorkspaceLanguage = (language: 'ko' | 'vi') => {
    if (isAdmin) {
      setBrandWorkspace(language === 'vi' ? 'VIET_QS' : 'CON_COST');
      return;
    }
    updateSettings({ uiLanguage: language });
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-[var(--z-header)] flex h-[64px] min-w-0 items-center border-b border-[var(--color-border)] bg-[color:var(--color-surface)]/95 px-4 shadow-[0_5px_18px_rgba(25,45,91,.06)] backdrop-blur-xl sm:px-6 xl:left-[308px]">
      <button type="button" aria-label={copy.menu} className="mr-3 rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-2.5 text-[var(--color-text-sub)] xl:hidden"><Menu className="h-5 w-5" /></button>
      <div className="mr-4 h-9 w-[132px] shrink-0 xl:hidden"><BrandLogo brand={brandWorkspace} /></div>

      <div className="mr-5 hidden min-w-[132px] items-center gap-2 xl:flex">
        <ChevronsRight className="h-4 w-4 text-[#ff6b00]" />
        <strong className="text-[13px] font-black tracking-tight text-[var(--color-text-main)]">{sectionLabel}</strong>
      </div>

      <label className="hidden min-h-10 w-full max-w-[410px] items-center rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3.5 text-[var(--color-text-sub)] focus-within:border-[#ff8a3d] focus-within:ring-4 focus-within:ring-[#ff8a3d]/10 md:flex">
        <Search className="mr-3 h-4 w-4" />
        <input className="w-full bg-transparent text-sm font-semibold text-[var(--color-text-main)] outline-none" placeholder={copy.searchPlaceholder} aria-label={copy.globalSearch} />
        <kbd className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-[9px] font-black text-[var(--color-text-sub)]">⌘ K</kbd>
      </label>

      <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2.5">
        {releaseChannel && (
          <div
            className="hidden items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-[9px] font-black text-orange-800 shadow-sm lg:flex"
            aria-label={`${releaseChannel}, build ${buildShortSha || 'unknown'}, DEMO_LOCAL`}
            title={`${releaseChannel} · Build ${buildShortSha || 'unknown'} · DEMO_LOCAL`}
          >
            <span>{releaseChannel}</span>
            {buildShortSha && <span className="border-l border-orange-200 pl-2">Build {buildShortSha}</span>}
            <span className="border-l border-orange-200 pl-2">DEMO_LOCAL</span>
          </div>
        )}
        {isAdmin && (
          <div className="hidden rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-1 2xl:flex">
            <button type="button" onClick={() => setAppMode('DAILY_WORK')} className={`rounded-lg px-3 py-2 text-[10px] font-black ${appMode === 'DAILY_WORK' ? 'bg-[var(--color-surface)] text-[#3453a4] shadow-sm' : 'text-[var(--color-text-sub)]'}`}>{copy.workMode}</button>
            <button type="button" onClick={() => setAppMode('ADMIN_VALIDATION')} className={`rounded-lg px-3 py-2 text-[10px] font-black ${appMode === 'ADMIN_VALIDATION' ? 'bg-[var(--color-surface)] text-[#eb6300] shadow-sm' : 'text-[var(--color-text-sub)]'}`}>{copy.adminMode}</button>
          </div>
        )}

        <div className="hidden items-center rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-0.5 sm:flex" aria-label={copy.languageSelection}>
          <button type="button" onClick={() => selectWorkspaceLanguage('ko')} aria-pressed={settings.uiLanguage === 'ko'} className={`min-h-8 rounded-lg px-2.5 text-[10px] font-black ${settings.uiLanguage === 'ko' ? 'bg-[var(--color-surface)] text-[#3453a4] shadow-sm' : 'text-[var(--color-text-sub)]'}`}>KR</button>
          <button type="button" onClick={() => selectWorkspaceLanguage('vi')} aria-pressed={settings.uiLanguage === 'vi'} className={`min-h-8 rounded-lg px-2.5 text-[10px] font-black ${settings.uiLanguage === 'vi' ? 'bg-[var(--color-surface)] text-[#3453a4] shadow-sm' : 'text-[var(--color-text-sub)]'}`}>VI</button>
        </div>

        <button type="button" onClick={toggleDarkMode} aria-label={isDarkMode ? copy.lightMode : copy.darkMode} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] text-[var(--color-text-sub)] hover:-translate-y-0.5 hover:text-[#3453a4] hover:shadow-md">
          {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <MoonStar className="h-4 w-4" />}
        </button>

        <div className="hidden lg:block"><NotificationPopover /></div>
        <button type="button" aria-label={copy.notifications} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] text-[var(--color-text-sub)] lg:hidden"><Bell className="h-4 w-4" /></button>

        <div className="relative">
          <button type="button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} className="flex min-h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 pr-2.5 shadow-[0_7px_18px_rgba(39,62,122,.08)] hover:-translate-y-0.5 hover:shadow-lg">
            <span className="relative flex h-8 w-8 overflow-hidden rounded-xl bg-gradient-to-br from-[#5576dc] to-[#273e7a] text-xs font-black text-white shadow-sm">
              {profilePhoto ? <Image unoptimized fill src={profilePhoto} alt="" className="object-cover" /> : <span className="m-auto">{currentUser.name.slice(0, 1)}</span>}
            </span>
            <span className="hidden min-w-0 text-left sm:block">
              <strong className="block max-w-[112px] truncate text-[11px] font-black text-[var(--color-text-main)]">{currentUser.displayName || currentUser.name}</strong>
              <span className="flex items-center gap-1 text-[9px] font-bold text-[var(--color-text-sub)]"><ShieldCheck className="h-2.5 w-2.5 text-[#eb6300]" /> {roleLabels[currentUser.role]} · {scopeLabel}</span>
            </span>
            <ChevronDown className={`hidden h-3.5 w-3.5 text-[var(--color-text-sub)] transition-transform sm:block ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--cc-shadow-3)]">
              <div className="mb-2 rounded-xl bg-[var(--cc-surface-2)] p-3">
                <p className="text-xs font-black text-[var(--color-text-main)]">{currentUser.name}</p>
                <p className="mt-1 text-[10px] font-semibold text-[var(--color-text-sub)]">{copy.accessGrade} · {roleLabels[currentUser.role]} / {scopeLabel}</p>
              </div>
              <Link href="/settings/profile" onClick={() => setProfileOpen(false)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)] hover:text-[var(--color-text-main)]"><Settings2 className="h-4 w-4" /> {copy.profilePhoto}</Link>
              <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)] hover:text-[var(--color-text-main)]"><Settings2 className="h-4 w-4" /> {copy.personalSettings}</Link>
              {isAdmin && <Link href="/settings/permissions" onClick={() => setProfileOpen(false)} className="flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)] hover:text-[var(--color-text-main)]"><ShieldCheck className="h-4 w-4" /> {copy.permissionManagement}</Link>}
              <button type="button" onClick={logout} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"><LogOut className="h-4 w-4" /> {copy.logout}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
