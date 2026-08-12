'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Clock3,
  ContactRound,
  History,
  Mail,
  MapPin,
  Phone,
  ScanLine,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { salesCustomerCopy, type SalesCustomerLocale } from '@/components/handoff/sales/salesCustomerCopy';
import type { SalesActivity, SalesOpportunity } from '@/lib/businessOperations';
import type { CustomerDirectoryRow } from '@/lib/customerProjectProjection';
import { projectBoardHref } from '@/lib/projectExecutionUnits';

export type CustomerDetailTab = 'BASIC' | 'CONTACTS' | 'PROJECTS' | 'CARDS' | 'AUDIT';

const tabs: Array<{ id: CustomerDetailTab; icon: typeof Building2 }> = [
  { id: 'BASIC', icon: Building2 },
  { id: 'CONTACTS', icon: ContactRound },
  { id: 'PROJECTS', icon: BriefcaseBusiness },
  { id: 'CARDS', icon: ScanLine },
  { id: 'AUDIT', icon: History },
];

export function CustomerDirectoryWorkbench({
  locale,
  rows,
  selectedId,
  selectedContactId,
  tab,
  legacyActivities,
  legacyOpportunities,
  onSelect,
  onTab,
  onClearContactFilter,
}: {
  locale: SalesCustomerLocale;
  rows: CustomerDirectoryRow[];
  selectedId: string | null;
  selectedContactId: string | null;
  tab: CustomerDetailTab;
  legacyActivities: SalesActivity[];
  legacyOpportunities: SalesOpportunity[];
  onSelect: (customerId: string) => void;
  onTab: (tab: CustomerDetailTab) => void;
  onClearContactFilter: () => void;
}) {
  const t = salesCustomerCopy[locale];
  const selected = rows.find((row) => row.customer.id === selectedId) ?? rows[0] ?? null;

  return (
    <section className="grid min-h-[590px] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--cc-shadow-1)] lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--color-border)] bg-[var(--cc-surface-2)] lg:border-b-0 lg:border-r">
        <header className="border-b border-[var(--color-border)] px-4 py-4"><h2 className="text-sm font-black">{t.directory}</h2><p className="mt-1 text-[11px] font-bold text-[var(--color-text-sub)]">{rows.length} {t.total}</p></header>
        <div className="cc-scrollbar max-h-[330px] overflow-y-auto p-2 lg:max-h-[720px]">
          {rows.length ? rows.map((row) => {
            const active = selected?.customer.id === row.customer.id;
            const activeProjects = row.projects.filter(({ project }) => !['COMPLETED', 'DELIVERED', 'CANCELLED', 'LOST', 'ARCHIVED'].includes(project.status));
            const completedProjects = row.projects.filter(({ project }) => ['COMPLETED', 'DELIVERED'].includes(project.status));
            const recentProject = row.projects[0]?.project;
            return <button
              type="button"
              key={row.customer.id}
              onClick={() => onSelect(row.customer.id)}
              aria-current={active ? 'true' : undefined}
              className={`group relative mb-2 w-full border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300] ${active ? 'border-[#ef7a24] bg-[#fff3e9] pl-5 shadow-sm' : 'border-transparent bg-white hover:border-[#efb183] hover:bg-[#fff9f4]'}`}
            >
              {active && <span className="absolute inset-y-0 left-0 w-1 bg-[#eb6300]" aria-hidden="true" />}
              <span className="flex items-start justify-between gap-2"><strong className="truncate text-sm">{row.customer.name}</strong>{active && <span className="shrink-0 bg-[#eb6300] px-2 py-0.5 text-[10px] font-black text-white">{t.selected}</span>}</span>
              <span className="mt-2 block truncate text-[11px] font-bold text-[var(--color-text-sub)]">{row.contacts[0]?.name ?? t.noContacts}</span>
              <span className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-black text-[var(--color-text-sub)]"><span>{t.contacts} {row.contacts.length}</span><span>{t.activeShort} {activeProjects.length}</span><span>{t.completedShort} {completedProjects.length}</span></span>
              <span className="mt-2 flex items-center gap-2 border-t border-[var(--color-border)] pt-2 text-[10px] font-bold text-[var(--color-text-sub)]"><span className="min-w-0 flex-1 truncate">{recentProject ? `${recentProject.projectNo ?? '-'} · ${recentProject.title}` : t.noProjects}</span>{recentProject && <span className="shrink-0 bg-sky-50 px-1.5 py-0.5 text-[9px] font-black text-sky-800">{recentProject.status}</span>}</span>
              {recentProject && <span className="mt-1 block text-[9px] font-semibold text-[var(--color-text-sub)]">{formatDate(recentProject.updatedAt, locale)}</span>}
            </button>;
          }) : <p className="p-8 text-center text-sm font-semibold text-[var(--color-text-sub)]">{t.noCustomers}</p>}
        </div>
      </aside>

      <div className="min-w-0">
        {selected ? <>
          <header className="border-b border-[var(--color-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-[10px] font-black tracking-[.16em] text-[#d65300]">CUSTOMER 360</p><h2 className="mt-1 text-xl font-black sm:text-2xl">{selected.customer.name}</h2><p className="mt-1 text-xs font-bold text-[var(--color-text-sub)]">{selected.customer.customerNo} · {selected.customer.industry || '-'}</p></div>
              <div className="flex flex-wrap gap-2"><Link href={`/projects/estimate-requests?customerId=${encodeURIComponent(selected.customer.id)}`} className="inline-flex min-h-10 items-center gap-2 bg-[#eb6300] px-3 text-xs font-black text-white hover:bg-[#c95000] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300] focus-visible:ring-offset-2"><BriefcaseBusiness className="h-4 w-4" />{t.estimate}</Link><Link href={`/mail?compose=1&customerId=${encodeURIComponent(selected.customer.id)}`} className="inline-flex min-h-10 items-center gap-2 border border-[var(--color-border-strong)] px-3 text-xs font-black hover:bg-[var(--cc-surface-2)]"><Mail className="h-4 w-4" />{t.mail}</Link></div>
            </div>
            <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto border-b border-[var(--color-border)]">
              {tabs.map(({ id, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => onTab(id)} className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300] ${tab === id ? 'border-[#eb6300] bg-[#fff7f0] text-[#c95000]' : 'border-transparent text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)] hover:text-[var(--color-text-main)]'}`}><Icon className="h-4 w-4" />{id === 'BASIC' ? t.basic : id === 'CONTACTS' ? t.contacts : id === 'PROJECTS' ? t.projects : id === 'CARDS' ? t.cards : t.audit}</button>)}
            </div>
          </header>
          <div className="p-5 sm:p-6">
            {tab === 'BASIC' && <Basic row={selected} locale={locale} />}
            {tab === 'CONTACTS' && <Contacts row={selected} locale={locale} selectedContactId={selectedContactId} />}
            {tab === 'PROJECTS' && <Projects row={selected} locale={locale} selectedContactId={selectedContactId} onClearContactFilter={onClearContactFilter} />}
            {tab === 'CARDS' && <Cards row={selected} locale={locale} />}
            {tab === 'AUDIT' && <Audit row={selected} locale={locale} legacyActivities={legacyActivities.filter((item) => item.customerId === selected.customer.id)} legacyOpportunities={legacyOpportunities.filter((item) => item.customerId === selected.customer.id)} />}
          </div>
        </> : <div className="grid min-h-[590px] place-items-center p-8 text-center text-sm font-semibold text-[var(--color-text-sub)]">{t.noCustomers}</div>}
      </div>
    </section>
  );
}

function Basic({ row, locale }: { row: CustomerDirectoryRow; locale: SalesCustomerLocale }) {
  const t = salesCustomerCopy[locale];
  const representative = row.contacts[0];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <Info label={t.customerNo} value={row.customer.customerNo} icon={Building2} />
    <Info label={t.industry} value={row.customer.industry || '-'} icon={BriefcaseBusiness} />
    <Info label={t.status} value={row.customer.status} icon={ShieldCheck} />
    <Info label={t.owner} value={row.customer.ownerId} icon={UserRound} />
    <Info label={t.representative} value={representative ? `${representative.name} · ${representative.email || representative.mobile || representative.phone || '-'}` : '-'} icon={ContactRound} />
    <Info label={t.address} value={representative?.address || '-'} icon={MapPin} />
    <Info label={t.homepage} value={representative?.homepage || '-'} icon={Building2} />
    <Info label={t.source} value={representative?.source || 'MANUAL'} icon={ScanLine} />
    <Info label={t.updatedAt} value={formatDate(row.customer.updatedAt, locale)} icon={Clock3} />
    <Info label={t.lastActivity} value={formatDate(row.lastActivityAt, locale)} icon={Clock3} />
    <Info label={t.note} value={row.customer.note || '-'} icon={History} />
  </div>;
}

function Contacts({ row, locale, selectedContactId }: { row: CustomerDirectoryRow; locale: SalesCustomerLocale; selectedContactId: string | null }) {
  const t = salesCustomerCopy[locale];
  if (!row.contacts.length) return <Empty text={t.noContacts} />;
  return <div className="grid gap-3 xl:grid-cols-2">{row.contacts.map((contact) => {
    const relatedProjects = row.projects.filter((project) => project.relationships.some((relationship) => relationship.contactId === contact.id));
    const selected = contact.id === selectedContactId;
    return <article key={contact.id} className={`border p-4 transition ${selected ? 'border-[#ef7a24] bg-[#fff7f0] shadow-sm' : 'border-[var(--color-border)] hover:border-[#efb183] hover:shadow-sm'}`}><div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{contact.name}</strong><p className="mt-1 text-xs font-bold text-[var(--color-text-sub)]">{contact.department} · {contact.position}</p></div><span className="bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-800">{selected ? t.selected : contact.status}</span></div><div className="mt-4 space-y-2 text-xs font-semibold text-[var(--color-text-sub)]"><p className="flex gap-2"><Mail className="h-4 w-4" /><span className="break-all">{contact.email || '-'}</span></p><p className="flex gap-2"><Phone className="h-4 w-4" />{contact.mobile || contact.phone || '-'}</p><p className="flex gap-2"><MapPin className="h-4 w-4" /><span>{contact.address || '-'}</span></p></div><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3"><span className="mr-auto text-[10px] font-black text-[var(--color-text-sub)]">{relatedProjects.length} {t.projects}</span><Link href={`/sales?view=CUSTOMERS&customerId=${encodeURIComponent(row.customer.id)}&tab=CONTACTS&contactId=${encodeURIComponent(contact.id)}`} className="inline-flex min-h-9 items-center border border-[var(--color-border-strong)] px-3 text-[10px] font-black hover:bg-[#fff3e9]">{t.detail}</Link><Link href={`/sales?view=CUSTOMERS&customerId=${encodeURIComponent(row.customer.id)}&tab=CARDS&contactId=${encodeURIComponent(contact.id)}`} className="inline-flex min-h-9 items-center border border-sky-200 bg-sky-50 px-3 text-[10px] font-black text-sky-800 hover:bg-sky-100">{t.cardHistory}</Link><Link href={`/sales?view=CUSTOMERS&customerId=${encodeURIComponent(row.customer.id)}&tab=PROJECTS&contactId=${encodeURIComponent(contact.id)}`} className="inline-flex min-h-9 items-center border border-[var(--color-border-strong)] px-3 text-[10px] font-black hover:bg-[#fff3e9]">{t.projects}</Link><Link href={`/mail?compose=1&contactId=${encodeURIComponent(contact.id)}&to=${encodeURIComponent(contact.email)}`} className="inline-flex min-h-9 items-center bg-[#172554] px-3 text-[10px] font-black text-white hover:bg-[#0f172a]">{t.mail}</Link></div></article>;
  })}</div>;
}

function Projects({ row, locale, selectedContactId, onClearContactFilter }: { row: CustomerDirectoryRow; locale: SalesCustomerLocale; selectedContactId: string | null; onClearContactFilter: () => void }) {
  const t = salesCustomerCopy[locale];
  const [status, setStatus] = useState<'ALL' | 'PRE_WORK' | 'ACTIVE' | 'COMPLETED' | 'REVISION' | 'CLOSED'>('ALL');
  const selectedContact = row.contacts.find((contact) => contact.id === selectedContactId);
  const contactScoped = selectedContactId
    ? row.projects.filter(({ relationships }) => relationships.some((relationship) => relationship.contactId === selectedContactId))
    : row.projects;
  const visible = contactScoped.filter(({ project }) => {
    if (status === 'ALL') return true;
    if (status === 'PRE_WORK') return ['INTAKE_RECEIVED', 'MANAGER_REVIEW', 'PM_ASSIGNED', 'SCHEDULE_DRAFTING', 'SCHEDULE_PENDING_APPROVAL'].includes(project.status);
    if (status === 'ACTIVE') return ['SCHEDULE_APPROVED', 'IN_PROGRESS', 'QA_REVIEW'].includes(project.status);
    if (status === 'COMPLETED') return project.status === 'COMPLETED';
    if (status === 'REVISION') return ['SCHEDULE_REJECTED', 'REVISION_REQUESTED'].includes(project.status);
    return project.status === 'ARCHIVED';
  });
  if (!row.projects.length) return <Empty text={t.noProjects} />;
  return <div className="space-y-3">{selectedContactId && <div className="flex flex-wrap items-center gap-2 border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-950"><ContactRound className="h-4 w-4" /><span>{selectedContact?.name ?? selectedContactId} · {t.contactProjectFilter}</span><button type="button" onClick={onClearContactFilter} className="ml-auto min-h-8 border border-orange-300 bg-white px-3 text-[10px] font-black hover:bg-orange-100">{t.clearFilter}</button></div>}<div className="flex gap-2 overflow-x-auto pb-1">{(['ALL', 'PRE_WORK', 'ACTIVE', 'COMPLETED', 'REVISION', 'CLOSED'] as const).map((value) => <button key={value} type="button" aria-pressed={status === value} onClick={() => setStatus(value)} className={`min-h-9 shrink-0 border px-3 text-[10px] font-black ${status === value ? 'border-[#eb6300] bg-[#fff3e9] text-[#c95000]' : 'border-[var(--color-border)] hover:bg-[var(--cc-surface-2)]'}`}>{t.projectFilters[value]}</button>)}</div>{visible.length ? visible.map(({ project, relationship, relationships, contacts, pmName, unitLabels }) => <article key={project.id} className="border border-[var(--color-border)] p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-black text-[#d65300]">{project.projectNo ?? '-'}</p><h3 className="mt-1 text-base font-black">{project.title}</h3></div><span className="bg-sky-50 px-2 py-1 text-[10px] font-black text-sky-800">{project.status}</span></div><dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4"><Pair label={t.pm} value={pmName || '-'} /><Pair label={t.unit} value={unitLabels.join(' · ') || '-'} /><Pair label={t.period} value={`${project.startDateStatus === 'TBD' ? t.startTbd : formatDate(project.startDate, locale)} → ${formatDate(project.dueDate, locale)}`} /><Pair label={t.intakeDate} value={formatDate(relationship.contactSnapshot.capturedAt, locale)} /><Pair label={t.currentContact} value={contacts.length ? `${contacts[0].name}${contacts.length > 1 ? ` +${contacts.length - 1}` : ''}` : '-'} /><Pair label={t.contactSnapshot} value={`${relationship.contactSnapshot.name || '-'} · ${relationship.contactSnapshot.department || '-'}`} /><Pair label="Revision" value={`r${Math.max(...relationships.map((item) => item.sourceRevision))}`} /></dl>{relationships.length > 1 && <div className="mt-3 flex flex-wrap gap-2">{relationships.map((item) => <span key={item.id} className="border border-orange-200 bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-900">{item.contactSnapshot.name} · {item.role}</span>)}</div>}<div className="mt-4 flex justify-end"><Link href={projectBoardHref(project.assignedUnitIds ?? [], { projectId: project.id, view: 'PART' })} className="group inline-flex min-h-10 items-center gap-2 bg-[#172554] px-3 text-xs font-black text-white hover:bg-[#0f172a]">{t.openProject}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link></div></article>) : <Empty text={t.noProjects} />}</div>;
}

function Cards({ row, locale }: { row: CustomerDirectoryRow; locale: SalesCustomerLocale }) {
  const t = salesCustomerCopy[locale];
  if (!row.businessCards.length) return <Empty text={t.noCards} />;
  return <div className="space-y-3">{row.businessCards.map((card) => <article key={card.id} className="flex flex-wrap items-center gap-4 border border-[var(--color-border)] p-4"><ScanLine className="h-6 w-6 text-[#d65300]" /><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{card.fileName ?? card.id}</strong><p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">{card.ocrMode} · {card.reviewStatus}</p></div><time className="text-xs font-bold text-[var(--color-text-sub)]">{formatDate(card.reviewedAt, locale)}</time></article>)}</div>;
}

function Audit({ row, locale, legacyActivities, legacyOpportunities }: { row: CustomerDirectoryRow; locale: SalesCustomerLocale; legacyActivities: SalesActivity[]; legacyOpportunities: SalesOpportunity[] }) {
  const t = salesCustomerCopy[locale];
  const projectById = new Map(row.projects.map((item) => [item.project.id, item.project]));
  const relationshipAudits = row.relationshipHistory.flatMap((relationship) => relationship.audit.map((audit) => ({ id: audit.id, date: audit.createdAt, title: `CUSTOMER_PROJECT_${audit.action}`, detail: `${projectById.get(relationship.projectId)?.projectNo ?? '-'} · r${audit.sourceRevision}${relationship.active ? '' : ' · INACTIVE'}`, legacy: false })));
  const legacy = [...legacyActivities.map((activity) => ({ id: activity.id, date: activity.happenedAt, title: activity.title, detail: `${activity.type} · ${activity.detail}`, legacy: true })), ...legacyOpportunities.map((opportunity) => ({ id: opportunity.id, date: opportunity.updatedAt, title: opportunity.opportunityName, detail: `LEGACY ${opportunity.stage} · MIGRATION SOURCE`, legacy: true }))];
  const events = [...relationshipAudits, ...legacy].sort((left, right) => right.date.localeCompare(left.date));
  return <div><div className="mb-4 border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-950">{t.readOnlyLegacy}</div>{events.length ? <div className="space-y-3">{events.map((event) => <article key={event.id} className="grid gap-2 border-l-2 border-[#eb6300] bg-[var(--cc-surface-2)] px-4 py-3 sm:grid-cols-[132px_minmax(0,1fr)_auto]"><time className="text-xs font-bold text-[var(--color-text-sub)]">{formatDate(event.date, locale)}</time><span><strong className="block text-sm">{event.title}</strong><span className="mt-1 block text-xs font-semibold text-[var(--color-text-sub)]">{event.detail}</span></span>{event.legacy && <span className="h-fit bg-slate-200 px-2 py-1 text-[9px] font-black text-slate-700">READ ONLY</span>}</article>)}</div> : <Empty text={t.noAudit} />}</div>;
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Building2 }) { return <div className="border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4"><Icon className="h-5 w-5 text-[#d65300]" /><dt className="mt-3 text-[10px] font-black text-[var(--color-text-sub)]">{label}</dt><dd className="mt-1 break-words text-sm font-black">{value}</dd></div>; }
function Pair({ label, value }: { label: string; value: string }) { return <div><dt className="text-[10px] font-black text-[var(--color-text-sub)]">{label}</dt><dd className="mt-1 font-bold">{value}</dd></div>; }
function Empty({ text }: { text: string }) { return <div className="grid min-h-[220px] place-items-center border border-dashed border-[var(--color-border-strong)] p-8 text-center text-sm font-semibold text-[var(--color-text-sub)]">{text}</div>; }
function formatDate(value: string | null | undefined, locale: SalesCustomerLocale) { if (!value) return '-'; return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : locale === 'vi' ? 'vi-VN' : 'en-US', { dateStyle: 'medium' }).format(new Date(value)); }
