'use client';

import { useMemo, useState } from 'react';
import { Building2, Mail, Network, Search, ShieldCheck, UsersRound } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { PersonnelCard } from '@/types/models';

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: '최고관리자',
  SYSTEM_ADMIN: '시스템관리자',
  DEPARTMENT_MANAGER: '부서관리자',
  PM: 'PM',
  WORKER: '구성원',
};

const companyLabel = (companyId?: string) => companyId === 'VIET_QS' ? 'VIETQS' : 'CON-COST';
const personName = (person: PersonnelCard) => person.displayName || person.name;

export function OrganizationDirectory() {
  const users = useAuthStore((state) => state.users);
  const [company, setCompany] = useState<'ALL' | 'CON_COST' | 'VIET_QS'>('ALL');
  const [query, setQuery] = useState('');

  const activeUsers = useMemo(() => users.filter((user) => user.isActive !== false), [users]);
  const filtered = useMemo(() => activeUsers.filter((user) => {
    const companyMatch = company === 'ALL' || user.companyId === company;
    const text = [
      user.name, user.displayName, user.vietnameseName, user.email, user.departmentName,
      user.departmentId, user.teamName, user.jobTitle, roleLabel[user.systemRole || user.role],
    ].filter(Boolean).join(' ').toLowerCase();
    return companyMatch && (!query.trim() || text.includes(query.trim().toLowerCase()));
  }), [activeUsers, company, query]);

  const departments = useMemo(() => {
    const groups = new Map<string, PersonnelCard[]>();
    filtered.forEach((user) => {
      const key = `${user.companyId || 'CON_COST'}::${user.departmentId || 'UNASSIGNED'}::${user.departmentName || user.departmentId || '미지정'}`;
      groups.set(key, [...(groups.get(key) || []), user]);
    });
    return [...groups.entries()].sort(([, a], [, b]) => {
      const companyOrder = companyLabel(a[0]?.companyId).localeCompare(companyLabel(b[0]?.companyId));
      return companyOrder || String(a[0]?.departmentName || '').localeCompare(String(b[0]?.departmentName || ''), 'ko');
    });
  }, [filtered]);

  const managers = activeUsers.filter((user) => ['SUPER_ADMIN', 'DEPARTMENT_MANAGER'].includes(user.systemRole || user.role)).length;
  const teams = new Set(activeUsers.map((user) => user.teamName).filter(Boolean)).size;

  return <div className="w-full space-y-5 p-4 md:p-6">
    <section className="cc-page-heading flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div>
        <p className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-[#4e6fd8]"><Network className="h-4 w-4" />People directory</p>
        <h1 className="text-[28px] font-black text-[var(--color-text-main)]">조직도 및 계정 디렉터리</h1>
        <p className="mt-1 text-sm font-semibold text-[var(--color-text-sub)]">인력현황 원본에서 반영된 회사·부서·팀·권한·업무 이메일을 한 화면에서 확인합니다.</p>
      </div>
      <label className="flex min-h-11 w-full items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 xl:max-w-md">
        <Search className="mr-2 h-4 w-4 text-[var(--color-text-sub)]" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="이름, 이메일, 부서, 팀, 직급 검색" />
      </label>
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        [UsersRound, '재직 계정', activeUsers.length, '인력현황 연동'],
        [Building2, '회사', new Set(activeUsers.map((user) => user.companyId)).size, 'CON-COST · VIETQS'],
        [Network, '팀', teams, '업무 조직 기준'],
        [ShieldCheck, '관리자·결재권자', managers, '권한 후보군'],
      ].map(([Icon, label, value, detail]) => {
        const ItemIcon = Icon as typeof UsersRound;
        return <article key={String(label)} className="cc-tactile-card flex min-h-[96px] items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-md bg-[#eef2ff] text-[#405bb0]"><ItemIcon className="h-5 w-5" /></span>
          <span><span className="text-[10px] font-black text-[var(--color-text-sub)]">{String(label)}</span><strong className="mt-1 block text-2xl font-black">{Number(value)}</strong><small className="text-[9px] font-semibold text-[var(--color-text-sub)]">{String(detail)}</small></span>
        </article>;
      })}
    </section>

    <section className="flex flex-wrap gap-2" aria-label="회사 필터">
      {([['ALL', '전체'], ['CON_COST', 'CON-COST'], ['VIET_QS', 'VIETQS']] as const).map(([value, label]) =>
        <button key={value} type="button" onClick={() => setCompany(value)} className={`min-h-10 rounded-md border px-4 text-xs font-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b00] ${company === value ? 'border-[#eb6300] bg-[#eb6300] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)]'}`}>{label}</button>)}
    </section>

    <section className="grid gap-4 xl:grid-cols-2">
      {departments.map(([key, members]) => {
        const first = members[0];
        const teamCount = new Set(members.map((member) => member.teamName).filter(Boolean)).size;
        return <article key={key} className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_10px_24px_rgba(44,54,74,.06)]">
          <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--cc-surface-2)] px-4 py-3">
            <div><p className="text-[9px] font-black uppercase tracking-[.12em] text-[#4e6fd8]">{companyLabel(first.companyId)}</p><h2 className="mt-1 text-sm font-black text-[var(--color-text-main)]">{first.departmentName || first.departmentId || '부서 미지정'}</h2></div>
            <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[10px] font-black text-[var(--color-text-sub)]">{members.length}명 · {teamCount || 1}팀</span>
          </header>
          <ul className="divide-y divide-[var(--color-border)]">
            {members.sort((a, b) => (b.permissionLevel || 0) - (a.permissionLevel || 0) || personName(a).localeCompare(personName(b), 'ko')).map((member) =>
              <li key={member.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_160px_150px] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#243b78] text-[10px] font-black text-white">{personName(member).slice(0, 1)}</span>
                  <span className="min-w-0"><strong className="block truncate text-xs text-[var(--color-text-main)]">{personName(member)}</strong><span className="mt-0.5 block truncate text-[10px] text-[var(--color-text-sub)]">{member.jobTitle || '직급 미지정'} · {member.teamName || member.departmentName || '팀 미지정'}</span></span>
                </div>
                <span className="inline-flex items-center gap-1.5 truncate text-[10px] font-semibold text-[var(--color-text-sub)]"><Mail className="h-3.5 w-3.5 shrink-0" />{member.email || '이메일 미등록'}</span>
                <span className="w-fit rounded-md bg-[#eef2ff] px-2 py-1 text-[9px] font-black text-[#405bb0]">{roleLabel[member.systemRole || member.role] || member.role}</span>
              </li>)}
          </ul>
        </article>;
      })}
    </section>
    {departments.length === 0 && <section className="grid min-h-52 place-items-center rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-sub)]">검색 조건에 맞는 인력이 없습니다.</section>}
  </div>;
}
