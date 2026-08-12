'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  ContactRound,
  FolderKanban,
  Inbox,
  ScanLine,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';

import { filterLabels, salesCustomerCopy, type SalesCustomerLocale } from '@/components/handoff/sales/salesCustomerCopy';
import type { CustomerProjectFilter, CustomerProjectProjection } from '@/lib/customerProjectProjection';
import { projectBoardHref } from '@/lib/projectExecutionUnits';

const kpiItems: Array<{ filter: CustomerProjectFilter; icon: typeof UsersRound; tone: string }> = [
  { filter: 'ALL', icon: UsersRound, tone: 'border-sky-200 bg-sky-50 text-sky-800' },
  { filter: 'ACTIVE_PROJECTS', icon: BriefcaseBusiness, tone: 'border-emerald-200 bg-emerald-50 text-emerald-800' },
  { filter: 'NEW_THIS_YEAR', icon: UserRoundCheck, tone: 'border-indigo-200 bg-indigo-50 text-indigo-800' },
  { filter: 'RECENTLY_COMPLETED', icon: FolderKanban, tone: 'border-teal-200 bg-teal-50 text-teal-800' },
  { filter: 'LINK_REVIEW', icon: AlertTriangle, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
  { filter: 'BUSINESS_CARD_REVIEW', icon: ScanLine, tone: 'border-rose-200 bg-rose-50 text-rose-800' },
  { filter: 'STALE_CUSTOMERS', icon: Clock3, tone: 'border-slate-200 bg-slate-50 text-slate-700' },
];

export function CustomerRelationshipDashboard({
  locale,
  projection,
  onFilter,
}: {
  locale: SalesCustomerLocale;
  projection: CustomerProjectProjection;
  onFilter: (filter: CustomerProjectFilter) => void;
}) {
  const t = salesCustomerCopy[locale];
  const labels = filterLabels(locale);
  const recentProjects = projection.rows
    .flatMap((row) => row.projects.map((project) => ({ ...project, customerName: row.customer.name })))
    .sort((left, right) => (right.project.updatedAt ?? '').localeCompare(left.project.updatedAt ?? ''))
    .slice(0, 5);
  const activeCustomers = projection.rows
    .map((row) => ({
      row,
      projects: row.projects.filter(({ project }) => !['COMPLETED', 'DELIVERED', 'CANCELLED', 'LOST', 'ARCHIVED'].includes(project.status)),
    }))
    .filter((item) => item.projects.length)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        {kpiItems.map(({ filter, icon: Icon, tone }) => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilter(filter)}
            className={`group min-h-[132px] border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300] ${tone}`}
          >
            <span className="flex items-start justify-between gap-3">
              <Icon className="h-5 w-5" aria-hidden="true" />
              <ArrowRight className="h-4 w-4 opacity-50 transition group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true" />
            </span>
            <strong className="mt-5 block text-2xl font-black">{projection.counts[filter]}</strong>
            <span className="mt-1 block text-xs font-black">{labels[filter]}</span>
          </button>
        ))}
      </div>

      <section className="border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--cc-shadow-1)]">
        <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4"><div><h2 className="text-base font-black">{t.activeCustomers}</h2><p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">{t.activeCustomersHelp}</p></div><button type="button" onClick={() => onFilter('ACTIVE_PROJECTS')} className="text-xs font-black text-[#d65300] hover:underline">{t.directory}</button></header>
        <div className="grid gap-px bg-[var(--color-border)] sm:grid-cols-2 xl:grid-cols-3">{activeCustomers.length ? activeCustomers.map(({ row, projects }) => <button key={row.customer.id} type="button" onClick={() => onFilter('ACTIVE_PROJECTS')} className="group min-h-[116px] bg-white p-4 text-left transition hover:bg-[#fff7f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#eb6300]"><span className="flex items-start justify-between gap-2"><strong className="truncate text-sm">{row.customer.name}</strong><span className="bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-800">{projects.length}</span></span><p className="mt-3 truncate text-xs font-bold text-[var(--color-text-sub)]">{projects[0].project.projectNo} · {projects[0].project.title}</p><p className="mt-2 truncate text-[10px] font-semibold text-[var(--color-text-sub)]">PM {projects[0].pmName || '-'} · {projects[0].unitLabels.join(' · ') || '-'}</p></button>) : <p className="col-span-full bg-white px-5 py-10 text-center text-sm font-semibold text-[var(--color-text-sub)]">{t.noProjects}</p>}</div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]">
        <section className="border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--cc-shadow-1)]">
          <header className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
            <div><h2 className="text-base font-black">{t.recent}</h2><p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">canonical projectId</p></div>
            <button type="button" onClick={() => onFilter('ALL')} className="text-xs font-black text-[#d65300] hover:underline">{t.directory}</button>
          </header>
          <div className="divide-y divide-[var(--color-border)]">
            {recentProjects.length ? recentProjects.map((item) => (
              <Link
                key={item.project.id}
                href={projectBoardHref(item.project.assignedUnitIds ?? [], { projectId: item.project.id, view: 'PART' })}
                className="group grid min-h-[74px] gap-2 px-5 py-3 transition hover:bg-[#fff7f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#eb6300] sm:grid-cols-[120px_minmax(0,1fr)_160px_28px] sm:items-center"
              >
                <span className="text-xs font-black text-[#d65300]">{item.project.projectNo ?? '-'}</span>
                <span className="min-w-0"><strong className="block truncate text-sm">{item.project.title}</strong><span className="mt-1 block truncate text-xs text-[var(--color-text-sub)]">{item.customerName}</span></span>
                <span className="text-xs font-bold text-[var(--color-text-sub)]">{item.unitLabels.join(' · ') || '-'}</span>
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            )) : <p className="px-5 py-12 text-center text-sm font-semibold text-[var(--color-text-sub)]">{t.noProjects}</p>}
          </div>
        </section>

        <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)]">
          <h2 className="text-base font-black">{t.quick}</h2>
          <div className="mt-4 grid gap-2">
            <Quick href="/sales?view=CUSTOMERS" icon={ContactRound} label={t.customers} />
            <Quick href="/sales/business-cards" icon={ScanLine} label={t.businessCard} />
            <Quick href="/sales/business-cards/inbox" icon={Inbox} label={t.cardInbox} />
            <Quick href="/projects/intake" icon={FolderKanban} label={t.projectIntake} />
            <Quick href="/projects/estimate-requests" icon={BriefcaseBusiness} label={t.estimate} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Quick({ href, icon: Icon, label }: { href: string; icon: typeof UsersRound; label: string }) {
  return <Link href={href} className="group flex min-h-12 items-center gap-3 border border-[var(--color-border)] px-3 text-sm font-black transition hover:border-[#f0a36b] hover:bg-[#fff7f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]"><Icon className="h-5 w-5 text-[#d65300]" aria-hidden="true" /><span className="flex-1">{label}</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" /></Link>;
}
