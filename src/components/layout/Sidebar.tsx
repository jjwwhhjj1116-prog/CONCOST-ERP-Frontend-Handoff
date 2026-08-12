'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Activity,
  Bot,
  Camera,
  CalendarCheck2,
  CalendarDays,
  CheckSquare2,
  ChevronDown,
  CircleDot,
  Cloud,
  CircleHelp,
  FileCheck2,
  FolderKanban,
  Handshake,
  Home,
  Landmark,
  LibraryBig,
  LockKeyhole,
  Mail,
  MessageSquareText,
  Megaphone,
  MoonStar,
  Network,
  NotebookPen,
  PackageCheck,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { MailNavigationPanel } from '@/components/mail/MailNavigationPanel';
import { SecondaryNavIcon } from '@/components/navigation/SecondaryNavIcon';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import type { Role } from '@/types/models';
import { canAccessNavigation, getNavigationAccessLevel } from '@/lib/navigationAccess';
import { evaluateEstimateAccess, evaluateFinanceAccess } from '@/lib/accessControl';
import { getWorkspaceShellCopy, localizeShellText } from '@/lib/workspaceShellLocalization';

type NavigationItem = {
  id: string;
  label: string;
  href?: string;
  icon?: React.ElementType;
  roles?: Role[];
  minLevel?: number;
  badge?: string;
  children?: NavigationItem[];
};

type RailItem = NavigationItem & { href: string; section: string; description: string };

const allRoles: Role[] = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPARTMENT_MANAGER', 'PM', 'WORKER', 'EVALUATION_ADMIN'];
const leaders: Role[] = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPARTMENT_MANAGER', 'PM'];

const projectNavigation: NavigationItem[] = [
  {
    id: 'project-management', label: '프로젝트 관리', icon: FolderKanban, roles: allRoles, minLevel: 3,
    children: [
      { id: 'estimate-requests', label: '견적 의뢰관리', href: '/projects/estimate-requests', roles: allRoles },
      { id: 'estimate-sheets', label: '견적서 관리', href: '/projects/intake/estimates', roles: allRoles },
      { id: 'estimate-db', label: 'DB관리', href: '/projects/intake/database', roles: allRoles },
    ],
  },
  { id: 'project-intake', label: '프로젝트 접수', href: '/projects/intake', icon: FileCheck2, roles: leaders, minLevel: 3 },
  {
    id: 'technical-projects', label: '기술본부 프로젝트', icon: FolderKanban, roles: allRoles,
    children: [
      { id: 'technical-all-projects', label: '전체 프로젝트', href: '/projects?group=TECHNICAL', roles: allRoles },
      { id: 'finish-projects', label: '마감팀', href: '/projects?unit=FINISH', roles: allRoles },
      { id: 'structure-projects', label: '구조팀', href: '/projects?unit=STRUCTURE', roles: allRoles },
      { id: 'civil-projects', label: '토목&조경팀', href: '/projects?unit=CIVIL_LANDSCAPE', roles: allRoles },
      { id: 'technical-meetings', label: '회의록', href: '/projects/data-management?view=MEETINGS&department=TECHNICAL', roles: allRoles },
      { id: 'technical-drive', label: '기술본부 자료실', href: '/drive?folder=TECHNICAL', roles: allRoles },
    ],
  },
  {
    id: 'claim-center-projects', label: '클레임센터 프로젝트', icon: FolderKanban, roles: allRoles,
    children: [
      { id: 'claim-all-projects', label: '전체 프로젝트', href: '/projects?group=CLAIM', roles: allRoles },
      { id: 'claim-drive', label: '클레임센터 자료실', href: '/drive?folder=CLAIM', roles: allRoles },
      { id: 'claim-meetings', label: '회의록', href: '/projects/data-management?view=MEETINGS&department=CLAIM', roles: allRoles },
    ],
  },
  {
    id: 'development-team-projects', label: '개발팀 프로젝트', icon: FolderKanban, roles: allRoles,
    children: [
      { id: 'development-all-projects', label: '전체 프로젝트', href: '/projects?group=DEVELOPMENT', roles: allRoles },
      { id: 'development-drive', label: '개발팀 자료실', href: '/drive?folder=DEVELOPMENT', roles: allRoles },
      { id: 'development-meetings', label: '회의록', href: '/projects/data-management?view=MEETINGS&department=DEVELOPMENT', roles: allRoles },
    ],
  },
  {
    id: 'project-schedule-management', label: '프로젝트 일정관리', icon: CalendarDays, roles: allRoles,
    children: [
      { id: 'all-schedule', label: '전체 일정관리', href: '/schedules', roles: allRoles },
      { id: 'finish-schedule', label: '마감팀', href: '/schedules?department=FINISH', roles: allRoles },
      { id: 'structure-schedule', label: '구조팀', href: '/schedules?department=STRUCTURE', roles: allRoles },
      { id: 'civil-schedule', label: '토목&조경팀', href: '/schedules?department=CIVIL_LANDSCAPE', roles: allRoles },
      { id: 'claim-schedule', label: '클레임 센터', href: '/schedules?department=CLAIM', roles: allRoles },
      { id: 'development-schedule', label: '개발팀', href: '/schedules?department=DEVELOPMENT', roles: allRoles },
    ],
  },
  {
    id: 'project-questions', label: '프로젝트 질의사항 관리', icon: CircleHelp, roles: allRoles,
    children: [
      { id: 'finish-questions', label: '마감팀', href: '/projects/questions?department=FINISH', roles: allRoles },
      { id: 'structure-questions', label: '구조팀', href: '/projects/questions?department=STRUCTURE', roles: allRoles },
      { id: 'civil-questions', label: '토목&조경팀', href: '/projects/questions?department=CIVIL_LANDSCAPE', roles: allRoles },
    ],
  },
  { id: 'project-daily-reports', label: '업무일지', href: '/projects/daily-reports', icon: NotebookPen, roles: allRoles },
  { id: 'project-data-management', label: '프로젝트 납품 및 데이터관리', href: '/projects/data-management', icon: PackageCheck, roles: allRoles },
];

const railNavigation: RailItem[] = [
  { id: 'workspace', section: 'HOME', label: 'HOME', href: '/', icon: Home, roles: allRoles, description: '오늘의 업무와 주요 현황' },
  { id: 'mail', section: '전자메일', label: '전자메일', href: '/mail', icon: Mail, roles: allRoles, description: '업무 메일함과 중요 문서' },
  { id: 'approvals', section: '전자결재', label: '전자결재', href: '/approvals', icon: FileCheck2, roles: allRoles, minLevel: 2, badge: '3', description: '받은 결재와 배포 문서' },
  { id: 'calendar', section: '일정 관리', label: '일정 관리', href: '/calendar', icon: CalendarDays, roles: allRoles, description: '캘린더와 오늘·예정 일정' },
  { id: 'projects', section: '프로젝트', label: '프로젝트', href: '/projects', icon: FolderKanban, roles: allRoles, minLevel: 2, description: '접수부터 납품까지' },
  { id: 'drive', section: '드라이브', label: '드라이브', href: '/drive', icon: Cloud, roles: allRoles, description: '회사·프로젝트 자료' },
  { id: 'tasks', section: '할일', label: '할일', href: '/tasks/my', icon: CheckSquare2, roles: allRoles, minLevel: 2, description: '내 업무와 마감 항목' },
  { id: 'board', section: '게시판', label: '게시판', href: '/board', icon: MessageSquareText, roles: allRoles, description: '전사·본부별 소식' },
  { id: 'sales', section: '영업', label: '영업', href: '/sales', icon: Handshake, roles: allRoles, minLevel: 2, description: '고객·담당자·프로젝트 이력 통합 관리' },
  { id: 'finance', section: '재무', label: '재무', href: '/finance', icon: Landmark, roles: allRoles, minLevel: 2, description: '매출·매입·자금·결산 통합 관리' },
];

const utilityNavigation: RailItem[] = [
  { id: 'ai-assistant', section: 'AI챗봇', label: 'AI챗봇', href: '/ai-assistant', icon: Bot, roles: allRoles, description: '업무 검색과 문서 작성 지원' },
  { id: 'settings', section: '설정', label: '설정', href: '/settings', icon: Settings, roles: allRoles, description: '개인 환경과 워크스페이스 설정' },
  { id: 'admin-settings', section: '관리자설정', label: '관리자설정', href: '/settings/permissions', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'], description: '인력·권한·데이터 운영 관리' },
];

const panelMenus: Record<string, NavigationItem[]> = {
  workspace: [
    { id: 'workspace-home', label: '통합 대시보드', href: '/', icon: Home, roles: allRoles },
    { id: 'workspace-approval', label: '결재 대기', href: '/approvals', icon: FileCheck2, roles: allRoles },
    { id: 'workspace-tasks', label: '오늘 할일', href: '/tasks/my', icon: CheckSquare2, roles: allRoles },
    { id: 'workspace-schedule', label: '이번 달 일정', href: '/calendar', icon: CalendarDays, roles: allRoles },
  ],
  mail: [],
  approvals: [
    { id: 'approval-home', label: '결재 홈', href: '/approvals', icon: FileCheck2, roles: allRoles },
    { id: 'approval-received', label: '받은결재함', href: '/approvals?box=RECEIVED', roles: allRoles },
    { id: 'approval-sent', label: '보낸결재함', href: '/approvals?box=SENT', roles: allRoles },
    { id: 'approval-consensus', label: '협의결재함', href: '/approvals?box=CONSENSUS', roles: allRoles },
    { id: 'approval-distributed', label: '배포문서함', href: '/approvals?box=DISTRIBUTED', roles: allRoles },
  ],
  calendar: [
    { id: 'calendar-all', label: '캘린더', href: '/calendar', icon: CalendarDays, roles: allRoles },
    { id: 'calendar-today', label: '오늘 일정', href: '/calendar?view=TODAY', icon: CalendarCheck2, roles: allRoles },
    { id: 'calendar-upcoming', label: '예정된 일정', href: '/calendar?view=UPCOMING', roles: allRoles },
  ],
  projects: projectNavigation,
  drive: [
    { id: 'drive-home', label: '드라이브 홈', href: '/drive', icon: Cloud, roles: allRoles },
    { id: 'drive-technical', label: '기술본부 드라이브', href: '/drive?folder=TECHNICAL', roles: allRoles },
    { id: 'drive-claim', label: '클레임센터 드라이브', href: '/drive?folder=CLAIM', roles: allRoles },
    { id: 'drive-development', label: '개발팀 드라이브', href: '/drive?folder=DEVELOPMENT', roles: allRoles },
  ],
  tasks: [
    { id: 'tasks-mine', label: '내 할일', href: '/tasks/my', icon: CheckSquare2, roles: allRoles },
    { id: 'tasks-today', label: '오늘 마감', href: '/tasks/my?filter=TODAY', roles: allRoles },
    { id: 'tasks-review', label: '검토 대기', href: '/tasks/my?filter=REVIEW', roles: allRoles },
    { id: 'tasks-done', label: '완료한 일', href: '/tasks/my?filter=DONE', roles: allRoles },
  ],
  board: [
    { id: 'board-home', label: '\uAC8C\uC2DC\uD310 \uD648', href: '/board', icon: MessageSquareText, roles: allRoles },
    { id: 'board-ceo', label: 'CEO 인사말', href: '/board?category=CEO', icon: UserRound, roles: allRoles },
    {
      id: 'board-notice', label: '공지사항', icon: Megaphone, roles: allRoles,
      children: [
        { id: 'board-notice-company', label: '전사공지', href: '/board?category=NOTICE_COMPANY', roles: allRoles },
        { id: 'board-notice-hr', label: '인사발령', href: '/board?category=NOTICE_HR', roles: allRoles },
        { id: 'board-notice-event', label: '경조사', href: '/board?category=NOTICE_EVENT', roles: allRoles },
      ],
    },
    {
      id: 'board-community', label: '커뮤니티', icon: UsersRound, roles: allRoles,
      children: [
        { id: 'board-photo', label: '사진첩', href: '/board?category=PHOTO', icon: Camera, roles: allRoles },
        { id: 'board-free', label: '자유게시판', href: '/board?category=FREE', icon: MessageSquareText, roles: allRoles },
      ],
    },
    { id: 'board-library', label: '자료실', href: '/board?category=LIBRARY', icon: LibraryBig, roles: allRoles },
    { id: 'organization-chart', label: '\uC870\uC9C1\uB3C4', href: '/organization', icon: Network, roles: allRoles },
    { id: 'board-manage', label: '\uAC8C\uC2DC\uD310 \uAD00\uB9AC', href: '/board/manage', icon: Settings, roles: ['SUPER_ADMIN'] },
    { id: 'board-trash', label: '\uD734\uC9C0\uD1B5\u00B7\uBCF5\uAD6C', href: '/board/trash', icon: Trash2, roles: ['SUPER_ADMIN'] },
  ],
  sales: [
    { id: 'sales-home', label: '영업 대시보드', href: '/sales', icon: Handshake, roles: allRoles },
    { id: 'sales-customers', label: '고객·주소록', href: '/sales?view=CUSTOMERS', roles: allRoles },
    { id: 'sales-business-cards', label: '명함 자동등록', href: '/sales/business-cards', roles: allRoles },
    { id: 'sales-business-card-inbox', label: '명함 수신함', href: '/sales/business-cards/inbox', icon: LibraryBig, roles: allRoles },
    { id: 'sales-business-card-capture', label: '모바일 명함 촬영', href: '/mobile/business-cards/capture', icon: Camera, roles: allRoles },
  ],
  finance: [
    { id: 'finance-home', label: '재무 대시보드', href: '/finance', icon: Landmark, roles: allRoles },
    { id: 'finance-sales-purchases', label: '매출·매입', href: '/finance?view=SALES_PURCHASES', roles: allRoles },
    { id: 'finance-tax-invoices', label: '세금계산서', href: '/finance?view=TAX_INVOICES', roles: allRoles },
    { id: 'finance-cashflow', label: '수금·지급', href: '/finance?view=CASHFLOW', roles: allRoles },
    { id: 'finance-budget', label: '예산·실적', href: '/finance?view=BUDGET', roles: allRoles },
    { id: 'finance-expenses', label: '경비·법인카드', href: '/finance?view=EXPENSES', roles: allRoles },
    { id: 'finance-treasury', label: '자금현황', href: '/finance?view=TREASURY', roles: allRoles },
    { id: 'finance-closing', label: '결산·보고서', href: '/finance?view=CLOSING', roles: allRoles },
  ],
  'ai-assistant': [
    { id: 'ai-assistant-home', label: 'AI 챗봇', href: '/ai-assistant', icon: Bot, roles: allRoles },
  ],
  settings: [
    { id: 'settings-home', label: '개인 설정', href: '/settings', icon: Settings, roles: allRoles },
    { id: 'settings-profile', label: '프로필 사진', href: '/settings/profile', icon: UserRound, roles: allRoles },
    { id: 'settings-translation', label: '언어·번역 설정', href: '/settings/translation', roles: allRoles },
  ],
  'admin-settings': [
    { id: 'admin-permissions', label: '접근등급·권한 관리', href: '/settings/permissions', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
    { id: 'admin-drive-integration', label: 'Google Drive 연결', href: '/settings/integrations/drive', icon: Cloud, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
    { id: 'admin-integration-diagnostics', label: '통합 진단', href: '/settings/integrations/diagnostics', icon: Activity, roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
    { id: 'admin-personnel', label: '인력현황 관리', href: '/settings/personnel', roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
    { id: 'admin-workspace', label: '워크스페이스 관리', href: '/settings/workspace', roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
    { id: 'admin-data-quality', label: '데이터 품질 관리', href: '/settings/data-quality', roles: ['SUPER_ADMIN', 'SYSTEM_ADMIN'] },
  ],
};

const estimateNavigationIds = new Set(['estimate-requests', 'estimate-sheets', 'estimate-db']);

function filterEstimateNavigation(items: NavigationItem[], estimateAllowed: boolean): NavigationItem[] {
  return items.flatMap((item) => {
    if (estimateNavigationIds.has(item.id) && !estimateAllowed) return [];
    const children = item.children ? filterEstimateNavigation(item.children, estimateAllowed) : undefined;
    if (item.children && !children?.length) return [];
    return [{ ...item, children }];
  });
}

function isHrefActive(href: string, pathname: string, searchString: string): boolean {
  const [path, queryString = ''] = href.split('?');
  if (pathname !== path) return false;
  if (!queryString) return !searchString;
  const current = new URLSearchParams(searchString);
  const expected = new URLSearchParams(queryString);
  return Array.from(expected.entries()).every(([key, value]) => current.get(key) === value);
}

function containsActivePath(item: NavigationItem, pathname: string, searchString: string): boolean {
  if (item.href && isHrefActive(item.href, pathname, searchString)) return true;
  return item.children?.some((child) => containsActivePath(child, pathname, searchString)) ?? false;
}

function getActiveRail(pathname: string) {
  if (pathname.startsWith('/calendar')) return 'calendar';
  if (pathname === '/schedules') return 'projects';
  if (pathname.startsWith('/projects') || pathname === '/conflicts') return 'projects';
  if (pathname.startsWith('/mail')) return 'mail';
  if (pathname.startsWith('/approvals')) return 'approvals';
  if (pathname.startsWith('/drive')) return 'drive';
  if (pathname.startsWith('/tasks')) return 'tasks';
  if (pathname.startsWith('/board')) return 'board';
  if (pathname.startsWith('/organization')) return 'board';
  if (pathname.startsWith('/sales')) return 'sales';
  if (pathname.startsWith('/finance')) return 'finance';
  if (pathname.startsWith('/ai-assistant')) return 'ai-assistant';
  if (['/settings/permissions', '/settings/personnel', '/settings/workspace', '/settings/data-quality', '/settings/integrations', '/settings/bulk-edit', '/settings/import'].some((path) => pathname.startsWith(path))) return 'admin-settings';
  if (pathname.startsWith('/settings')) return 'settings';
  return 'workspace';
}

function PanelNode({ item, depth, role, level, pathname, searchString, language }: { item: NavigationItem; depth: number; role: Role; level: number; pathname: string; searchString: string; language: 'ko' | 'vi' }) {
  const visibleChildren = item.children?.filter((child) => canAccessNavigation(child, role, level));
  const active = containsActivePath(item, pathname, searchString);
  const [open, setOpen] = React.useState(active || depth === 0);
  const label = localizeShellText(item.label, language);
  if (!canAccessNavigation(item, role, level)) return null;

  if (visibleChildren?.length) {
    return (
      <div>
        <button
          type="button"
          title={label}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className={`relative flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2.5 text-left text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a1f]/45 ${
            active
              ? 'bg-[#ffead5] font-black text-[#a94100]'
              : 'font-bold text-[#4c3526] hover:bg-white/75'
          }`}
          data-secondary-nav-item={item.id}
        >
          {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-[#ff6b00]" />}
          <SecondaryNavIcon id={item.id} fallbackIcon={item.icon} active={active} />
          <span className="min-w-0 flex-1 truncate">{label}</span>
          <ChevronDown className={`h-3.5 w-3.5 text-[#a98973] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {open && <div className="ml-3.5 mt-1 space-y-0.5 border-l border-[#f1d7c1] pl-2.5">{visibleChildren.map((child) => <PanelNode key={child.id} item={child} depth={depth + 1} role={role} level={level} pathname={pathname} searchString={searchString} language={language} />)}</div>}
      </div>
    );
  }

  if (!item.href) return null;
  const exactActive = isHrefActive(item.href, pathname, searchString);
  return (
    <Link
      href={item.href}
      title={label}
      aria-current={exactActive ? 'page' : undefined}
      className={`group relative flex min-h-11 items-center gap-2.5 rounded-xl px-2.5 text-[12px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a1f]/45 ${
        exactActive
          ? 'bg-white font-black text-[#bd4b00] shadow-[0_7px_20px_rgba(129,65,18,.12)] ring-1 ring-[#f2d6bf]'
          : 'font-bold text-[#684d3b] hover:bg-white/70 hover:text-[#a94100]'
      }`}
      data-secondary-nav-item={item.id}
    >
      {exactActive && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-[#ff6b00]" />}
      <SecondaryNavIcon id={item.id} fallbackIcon={item.icon} active={exactActive} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {item.badge && <span className="rounded-full bg-[#ff6b00] px-1.5 py-0.5 text-[9px] font-black text-white">{item.badge}</span>}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const searchString = useSearchParams().toString();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { isDarkMode, toggleDarkMode, brandWorkspace, toggleBrandWorkspace } = useUiStore();
  const language = useTranslationStore((state) => state.settings.uiLanguage);
  if (!currentUser) return null;

  const copy = getWorkspaceShellCopy(language);

  const canSwitchCompany = ['SUPER_ADMIN', 'SYSTEM_ADMIN'].includes(currentUser.role);

  const accessLevel = getNavigationAccessLevel(currentUser);
  const activeRailId = getActiveRail(pathname);
  const financeAccess = evaluateFinanceAccess(currentUser);
  const estimateAccess = evaluateEstimateAccess(currentUser);
  const visibleRail = railNavigation.filter(
    (item) =>
      canAccessNavigation(item, currentUser.role, accessLevel) &&
      item.id !== 'organization' &&
      (item.id !== 'finance' || financeAccess.allowed),
  );
  const visibleUtilities = utilityNavigation.filter((item) => canAccessNavigation(item, currentUser.role, accessLevel));
  const activeRail = [...visibleRail, ...visibleUtilities].find((item) => item.id === activeRailId) || visibleRail[0];
  const panelItems = filterEstimateNavigation(panelMenus[activeRail.id] || [], estimateAccess.allowed);
  const mobile = visibleRail.filter((item) =>
    ['workspace', 'mail', 'approvals', 'calendar', 'projects', 'board'].includes(item.id),
  );
  const compactWorkspace = pathname === '/';

  return (
    <>
      <div className={`hidden shrink-0 xl:block ${compactWorkspace ? 'w-[84px]' : 'w-[316px]'}`} aria-hidden="true" />
      <aside className={`fixed inset-y-0 left-0 z-[var(--z-sidebar)] hidden pt-[64px] xl:flex ${compactWorkspace ? 'w-[84px]' : 'w-[316px]'}`}>
        <button type="button" onClick={toggleBrandWorkspace} disabled={!canSwitchCompany} aria-label={canSwitchCompany ? copy.switchWorkspace(brandWorkspace === 'CON_COST' ? 'VIETQS' : 'CON-COST') : `${brandWorkspace} workspace`} className="absolute left-0 top-0 z-10 flex h-[64px] w-[316px] items-center border-b border-[#efd8c4] bg-[#fffaf5] px-5 shadow-[0_8px_22px_rgba(86,52,24,.06)] disabled:cursor-default">
          <BrandLogo brand={brandWorkspace} className="h-[34px] w-[178px] shrink-0" />
          {canSwitchCompany && <ChevronDown className="ml-auto h-4 w-4 text-[#a98973]" />}
        </button>
        <div className={`flex w-[84px] shrink-0 flex-col border-r shadow-[8px_0_24px_rgba(20,44,96,.16)] transition-colors ${brandWorkspace === 'VIET_QS' ? 'border-[#084b86] bg-[#0871bd]' : 'border-[#c74f00]/30 bg-[#ff6b00]'}`}>
          <nav aria-label={copy.globalNavigation} className="cc-scrollbar flex-1 overflow-y-auto px-1.5 py-2.5">
            <div className="space-y-1.5">
              {visibleRail.map((item) => {
                const Icon = item.icon ?? CircleDot;
                const active = item.id === activeRail.id;
                return (
                   <Link key={item.id} href={item.href} title={localizeShellText(item.section, language)} aria-current={active ? 'page' : undefined} className={`relative flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-[14px] border text-[10.5px] font-black leading-none text-white transition-all ${active ? 'border-white/75 bg-white/22 shadow-[0_8px_20px_rgba(24,39,75,.24),inset_0_1px_0_rgba(255,255,255,.38)]' : 'border-transparent hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/18'}`}>
                    <Icon className="h-[30px] w-[30px] drop-shadow-[0_1px_1px_rgba(0,0,0,.22)]" strokeWidth={1.75} />
                    <span>{localizeShellText(item.label, language)}</span>
                    {item.badge && <span className="absolute right-1.5 top-1 rounded-full bg-white px-1.5 py-0.5 text-[8px] font-black text-[#d45300] shadow-sm">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </nav>
          <div className="space-y-1 border-t border-white/15 px-1.5 py-2">
            {visibleUtilities.filter((item) => item.id === 'ai-assistant').map((item) => {
              const Icon = item.icon ?? Bot;
              const active = item.id === activeRail.id;
              return <Link key={item.id} href={item.href} title={localizeShellText(item.section, language)} aria-current={active ? 'page' : undefined} className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[9.5px] font-black text-white transition ${active ? 'bg-white/20 shadow-[0_5px_14px_rgba(20,39,84,.2)]' : 'hover:bg-white/15'}`}><Icon className="h-[26px] w-[26px]" strokeWidth={1.75} /><span>{localizeShellText(item.label, language)}</span></Link>;
            })}
            <button type="button" onClick={toggleDarkMode} title={isDarkMode ? copy.lightMode : copy.darkMode} aria-pressed={isDarkMode} className="flex min-h-[56px] w-full flex-col items-center justify-center gap-1 rounded-xl text-[9.5px] font-black text-white transition hover:bg-white/15">{isDarkMode ? <Sun className="h-[26px] w-[26px]" strokeWidth={1.75} /> : <MoonStar className="h-[26px] w-[26px]" strokeWidth={1.75} />}<span>{copy.modeSettings}</span></button>
            {visibleUtilities.filter((item) => item.id !== 'ai-assistant').map((item) => {
              const Icon = item.icon ?? Settings;
              const active = item.id === activeRail.id;
              return <Link key={item.id} href={item.href} title={localizeShellText(item.section, language)} aria-current={active ? 'page' : undefined} className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl text-[9.5px] font-black text-white transition ${active ? 'bg-white/20 shadow-[0_5px_14px_rgba(20,39,84,.2)]' : 'hover:bg-white/15'}`}><Icon className="h-[26px] w-[26px]" strokeWidth={1.75} /><span>{localizeShellText(item.label, language)}</span></Link>;
            })}
          </div>
        </div>

        {!compactWorkspace && <div className="flex min-w-0 flex-1 flex-col border-r border-[#f0ddcd] bg-[#fff5eb] text-[#2f2118] shadow-[8px_0_30px_rgba(86,52,24,.07)]">
          <div className="border-b border-[#f0ddcd] px-4 py-4">
            <div className="flex items-center gap-3">
              <SecondaryNavIcon id={activeRail.id} fallbackIcon={activeRail.icon} active size="lg" />
              <span className="min-w-0">
                <h2 className="truncate text-[15px] font-black tracking-tight">{localizeShellText(activeRail.section, language)}</h2>
                <p className="mt-1 truncate text-[10px] font-semibold text-[#9a755c]">{localizeShellText(activeRail.description, language)}</p>
              </span>
            </div>
          </div>
          <nav aria-label={`${localizeShellText(activeRail.section, language)} ${copy.channels}`} className="cc-scrollbar flex-1 overflow-y-auto p-3">
            {activeRail.id === 'mail' ? (
              <MailNavigationPanel />
            ) : (
              <>
                <p className="mb-2 px-3 text-[9px] font-black uppercase tracking-[.18em] text-[#b5957e]">{copy.channels}</p>
                <div className="space-y-1">{panelItems.map((item) => <PanelNode key={item.id} item={item} depth={0} role={currentUser.role} level={accessLevel} pathname={pathname} searchString={searchString} language={language} />)}</div>
              </>
            )}
          </nav>
          <div className="border-t border-[#f0ddcd] p-3">
            <div className="flex items-center gap-2.5 rounded-2xl border border-[#efd5c0] bg-white/70 p-2.5 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ffead5] text-xs font-black text-[#bd4b00]">{currentUser.name.slice(0, 1)}</span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-[11px] font-black">{currentUser.displayName || currentUser.name}</strong><span className="block truncate text-[9px] font-semibold text-[#9a755c]">{localizeShellText(currentUser.departmentName || currentUser.teamName || copy.companyWide, language)} · {currentUser.role === 'SUPER_ADMIN' ? copy.topAdministrator : localizeShellText(currentUser.jobTitle || currentUser.role, language)}</span></span>
              <LockKeyhole className="h-3.5 w-3.5 text-[#eb6300]" />
            </div>
          </div>
        </div>}
      </aside>

      <nav aria-label={copy.mobileNavigation} className="fixed inset-x-3 bottom-3 z-[var(--z-mobile-nav)] grid min-h-[66px] grid-cols-6 rounded-[20px] border border-white/10 bg-[#172554]/95 p-1.5 shadow-[0_18px_42px_rgba(6,15,44,.35)] backdrop-blur-xl xl:hidden">
        {mobile.map((item) => {
          const Icon = item.icon ?? CircleDot;
          const active = item.id === activeRail.id;
          return <Link key={item.id} href={item.href} className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[9px] font-black ${active ? 'bg-[#ff6b00] text-white shadow-[0_6px_16px_rgba(235,99,0,.32)]' : 'text-slate-400 hover:bg-white/[.08] hover:text-white'}`}><Icon className="h-5 w-5" strokeWidth={1.75} /><span className="max-w-full truncate">{localizeShellText(item.label, language)}</span></Link>;
        })}
      </nav>
    </>
  );
}
