'use client';

import { useMemo, useState } from 'react';
import { Building2, Crown, Mail, Network, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { OrganizationHierarchyChart } from '@/components/organization/OrganizationHierarchyChart';
import { getOrganizationNodes, projectPersonnelMemberships, resolvePersonnelOrganization } from '@/lib/organizationHierarchy';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import type { CompanyId, PersonnelCard } from '@/types/models';

const roleLabel: Record<string, Record<'ko' | 'vi' | 'en', string>> = {
  SUPER_ADMIN: { ko: '최고관리자', vi: 'Quản trị cao nhất', en: 'Super admin' },
  SYSTEM_ADMIN: { ko: '시스템 관리자', vi: 'Quản trị hệ thống', en: 'System admin' },
  DEPARTMENT_MANAGER: { ko: '부서 관리자', vi: 'Quản lý đơn vị', en: 'Department manager' },
  PM: { ko: '프로젝트 관리자', vi: 'Quản lý dự án', en: 'Project manager' },
  WORKER: { ko: '구성원', vi: 'Thành viên', en: 'Member' },
};

const COPY = {
  ko: { chart: '조직도', directory: '인원 디렉터리', title: '인원 디렉터리', description: '회사·조직별 재직 인원을 검색합니다.', search: '이름, 조직, 직책 검색', all: '전체 회사', people: '명', empty: '조건에 맞는 인원이 없습니다.', leader: '조직 책임자', primary: '주 소속' },
  vi: { chart: 'Sơ đồ tổ chức', directory: 'Danh bạ nhân sự', title: 'Danh bạ nhân sự', description: 'Tìm nhân sự đang làm việc theo công ty và đơn vị.', search: 'Tìm tên, đơn vị, chức danh', all: 'Tất cả công ty', people: 'người', empty: 'Không có nhân sự phù hợp.', leader: 'Phụ trách', primary: 'Đơn vị chính' },
  en: { chart: 'Organization chart', directory: 'People directory', title: 'People directory', description: 'Search active personnel by company and organization.', search: 'Search name, organization, or title', all: 'All companies', people: 'people', empty: 'No matching personnel.', leader: 'Organization leader', primary: 'Primary organization' },
} as const;

const personName = (person: PersonnelCard) => person.displayName || person.name;
const companyLabel = (companyId?: string) => companyId === 'VIET_QS' ? 'VIET QS' : 'CON-COST';

export function OrganizationDirectory() {
  const users = useAuthStore((state) => state.users);
  const workspace = useUiStore((state) => state.brandWorkspace);
  const uiLanguage = useTranslationStore((state) => state.settings.uiLanguage);
  const language = String(uiLanguage);
  const locale = language === 'vi' ? 'vi' : language === 'en' ? 'en' : 'ko';
  const copy = COPY[locale];
  const [view, setView] = useState<'CHART' | 'DIRECTORY'>('CHART');
  const [company, setCompany] = useState<'ALL' | CompanyId>(workspace);
  const [query, setQuery] = useState('');

  const activeUsers = useMemo(() => users.filter((user) => user.isActive !== false && user.employmentStatus !== 'RESIGNED'), [users]);
  const nodeLabels = useMemo(() => new Map((['CON_COST', 'VIET_QS'] as CompanyId[]).flatMap((companyId) => getOrganizationNodes(companyId)).map((node) => [node.id, node.name])), []);
  const leaderPersonnelIds = useMemo(() => new Set((['CON_COST', 'VIET_QS'] as CompanyId[])
    .flatMap((companyId) => projectPersonnelMemberships(activeUsers, companyId))
    .filter((membership) => membership.isLeader)
    .map((membership) => membership.personnelId)), [activeUsers]);
  const filtered = useMemo(() => activeUsers.filter((user) => {
    if (company !== 'ALL' && user.companyId !== company) return false;
    const organization = resolvePersonnelOrganization(user);
    const text = [user.name, user.displayName, user.vietnameseName, user.departmentName, user.teamName, user.jobTitle, user.position, nodeLabels.get(organization.primaryNodeId)]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase();
    return !query.trim() || text.includes(query.trim().toLocaleLowerCase());
  }), [activeUsers, company, query, nodeLabels]);

  const groups = useMemo(() => {
    const result = new Map<string, PersonnelCard[]>();
    filtered.forEach((person) => {
      const organization = resolvePersonnelOrganization(person);
      result.set(organization.primaryNodeId, [...(result.get(organization.primaryNodeId) ?? []), person]);
    });
    return [...result.entries()].sort(([a], [b]) => {
      const aNode = nodeLabels.get(a) ?? a;
      const bNode = nodeLabels.get(b) ?? b;
      return aNode.localeCompare(bNode, locale === 'ko' ? 'ko' : 'en');
    });
  }, [filtered, nodeLabels, locale]);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-white px-4 pt-3">
        <button type="button" onClick={() => setView('CHART')} className={`flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-black transition ${view === 'CHART' ? 'border-orange-500 text-orange-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}><Network className="h-4 w-4" />{copy.chart}</button>
        <button type="button" onClick={() => setView('DIRECTORY')} className={`flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-black transition ${view === 'DIRECTORY' ? 'border-orange-500 text-orange-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}><UsersRound className="h-4 w-4" />{copy.directory}</button>
      </div>

      {view === 'CHART' ? <OrganizationHierarchyChart /> : <>
        <section className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-black tracking-[0.16em] text-orange-600">PEOPLE DIRECTORY</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{copy.title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">{copy.description}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="h-10 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
            </label>
            <select value={company} onChange={(event) => setCompany(event.target.value as 'ALL' | CompanyId)} className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-orange-500"><option value="ALL">{copy.all}</option><option value="CON_COST">CON-COST</option><option value="VIET_QS">VIET QS</option></select>
          </div>
        </section>

        <section className="grid min-w-0 gap-4 px-4 pb-8 xl:grid-cols-2">
          {groups.map(([nodeId, people]) => {
            const companyId = people[0]?.companyId === 'VIET_QS' ? 'VIET_QS' : 'CON_COST';
            const organizationName = nodeLabels.get(nodeId) ?? (locale === 'vi' ? 'Chưa phân loại' : locale === 'en' ? 'Unassigned' : '미분류');
            return <article key={nodeId} className="min-w-0 border border-slate-200 bg-white shadow-sm">
              <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-700"><Building2 className="h-5 w-5" /></span><span className="min-w-0"><span className="block truncate text-sm font-black text-slate-950">{organizationName}</span><span className="block text-[10px] font-bold text-slate-500">{companyLabel(companyId)} · {people.length} {copy.people}</span></span></div>
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
              </header>
              <div className="divide-y divide-slate-100">{people.map((person) => {
                const isLeader = leaderPersonnelIds.has(person.id);
                return <div key={person.id} className="grid min-w-0 gap-3 px-4 py-3 transition hover:bg-orange-50/50 sm:grid-cols-[minmax(0,1fr)_minmax(170px,.8fr)] sm:items-center">
                  <div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-700 ring-1 ring-slate-200">{personName(person).slice(0, 2).toUpperCase()}</span><span className="min-w-0"><span className="flex items-center gap-1 truncate text-sm font-black text-slate-950">{personName(person)}{isLeader && <Crown aria-label={copy.leader} className="h-3.5 w-3.5 fill-amber-300 text-amber-600" />}</span><span className="block truncate text-xs text-slate-500">{person.jobTitle || person.position || roleLabel[person.systemRole || person.role]?.[locale] || copy.primary}</span></span></div>
                  <div className="min-w-0 text-xs text-slate-500">{person.email && <span className="flex min-w-0 items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{person.email}</span></span>}</div>
                </div>;
              })}</div>
            </article>;
          })}
          {groups.length === 0 && <div className="col-span-full border border-dashed border-slate-300 bg-white py-16 text-center text-sm font-bold text-slate-500">{copy.empty}</div>}
        </section>
      </>}
    </div>
  );
}
