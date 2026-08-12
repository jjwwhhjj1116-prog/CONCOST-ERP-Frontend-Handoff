'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Download, Plus, Search, Upload } from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { CustomerDirectoryWorkbench, type CustomerDetailTab } from '@/components/handoff/sales/CustomerDirectoryWorkbench';
import { CustomerProjectLinkReview } from '@/components/handoff/sales/CustomerProjectLinkReview';
import { CustomerRelationshipDashboard } from '@/components/handoff/sales/CustomerRelationshipDashboard';
import { salesCustomerCopy } from '@/components/handoff/sales/salesCustomerCopy';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { ActionButtonGroup, SemanticActionButton } from '@/components/ui/SemanticActionButton';
import {
  companyActivities,
  companyContacts,
  companyCustomers,
  companySales,
  type SalesContactInput,
  type SalesCustomerInput,
} from '@/lib/businessOperations';
import { exportContactWorkbook, previewContactImport, type ContactImportRow } from '@/lib/businessWorkbook';
import { buildCustomerProjectProjection, type CustomerProjectFilter } from '@/lib/customerProjectProjection';
import { legacySalesDestination, visibleCustomerProjectRelationships } from '@/lib/customerProjectRelationship';
import { executeFrontendMutation, getFrontendModuleBoundary } from '@/lib/frontendDataSource';
import { useAuthStore } from '@/store/authStore';
import { useAuditStore } from '@/store/auditStore';
import { useBusinessOperationsStore } from '@/store/businessOperationsStore';
import { useProjectStore } from '@/store/projectStore';
import { useUiStore } from '@/store/uiStore';
import { resolveAccessGrade } from '@/lib/accessControl';

type DrawerMode = 'CUSTOMER_CREATE' | 'CONTACT_CREATE' | 'IMPORT' | null;
type MainView = 'DASHBOARD' | 'CUSTOMERS';

const inputClass = 'min-h-11 w-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]';
const emptyCustomer = (): SalesCustomerInput => ({ name: '', industry: '', ownerId: '', status: 'PROSPECT', note: '' });
const emptyContact = (): SalesContactInput => ({ customerId: '', name: '', department: '', position: '', email: '', phone: '', source: 'MANUAL', sourceBusinessCardId: null, lastContactAt: null });

export function SalesOperationsWorkbench() {
  const { locale, setLocale } = useHandoffLocale();
  const t = salesCustomerCopy[locale];
  const companyId = useUiStore((state) => state.brandWorkspace);
  const currentUser = useAuthStore((state) => state.currentUser);
  const personnel = useAuthStore((state) => state.users);
  const business = useBusinessOperationsStore();
  const projects = useProjectStore((state) => state.projects);
  const boundary = getFrontendModuleBoundary('SALES', { locale, adapterReady: false });
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const actorId = currentUser?.id ?? 'demo-sales-operator';
  const requestedView = (searchParams.get('salesView') ?? searchParams.get('view') ?? '').toUpperCase();
  const isLegacyView = ['PIPELINE', 'OPPORTUNITIES', 'QUOTES', 'CONTRACTS', 'ACTIVITIES'].includes(requestedView);
  const view: MainView = ['CUSTOMERS', 'CONTACTS', 'ACTIVITIES'].includes(requestedView) ? 'CUSTOMERS' : 'DASHBOARD';
  const rawTab = (searchParams.get('tab') ?? '').toUpperCase();
  const tab: CustomerDetailTab = rawTab === 'CONTACTS' || requestedView === 'CONTACTS'
    ? 'CONTACTS'
    : rawTab === 'PROJECTS'
      ? 'PROJECTS'
      : rawTab === 'CARDS'
        ? 'CARDS'
        : rawTab === 'AUDIT' || rawTab === 'TIMELINE' || requestedView === 'ACTIVITIES'
          ? 'AUDIT'
          : 'BASIC';
  const requestedFilter = (searchParams.get('filter') ?? 'ALL').toUpperCase();
  const filter: CustomerProjectFilter = ['ALL', 'ACTIVE_PROJECTS', 'NEW_THIS_YEAR', 'RECENTLY_COMPLETED', 'LINK_REVIEW', 'BUSINESS_CARD_REVIEW', 'STALE_CUSTOMERS'].includes(requestedFilter)
    ? requestedFilter as CustomerProjectFilter
    : 'ALL';
  const query = searchParams.get('q') ?? '';
  const selectedId = searchParams.get('customerId');
  const selectedContactId = searchParams.get('contactId');
  const [drawer, setDrawer] = useState<DrawerMode>(null);
  const [customerForm, setCustomerForm] = useState<SalesCustomerInput>(emptyCustomer);
  const [contactForm, setContactForm] = useState<SalesContactInput>(emptyContact);
  const [importRows, setImportRows] = useState<ContactImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const canExport = boundary.mode === 'DEMO_LOCAL'
    && Boolean(currentUser && ['ADMIN', 'GRADE_1'].includes(resolveAccessGrade(currentUser)));

  const customers = useMemo(() => companyCustomers(business.customers, companyId), [business.customers, companyId]);
  const contacts = useMemo(() => companyContacts(business.contacts, companyId), [business.contacts, companyId]);
  const activities = useMemo(() => companyActivities(business.activities, companyId), [business.activities, companyId]);
  const legacyOpportunities = useMemo(() => companySales(business.sales, companyId), [business.sales, companyId]);
  const visibleRelationshipPairs = useMemo(() => currentUser
    ? visibleCustomerProjectRelationships(
      business.customerProjectRelationships,
      projects,
      companyId,
      currentUser,
    )
    : [], [business.customerProjectRelationships, companyId, currentUser, projects]);
  const visibleRelationships = useMemo(() => visibleRelationshipPairs.map((item) => item.relationship), [visibleRelationshipPairs]);
  const visibleProjectIds = useMemo(() => new Set(visibleRelationships.map((item) => item.projectId)), [visibleRelationships]);
  const visibleProjects = useMemo(() => projects.filter((project) => visibleProjectIds.has(project.id)), [projects, visibleProjectIds]);
  const scopedLinkCandidates = useMemo(() => business.customerProjectLinkCandidates.filter((candidate) => candidate.companyId === companyId), [business.customerProjectLinkCandidates, companyId]);
  const projection = useMemo(() => buildCustomerProjectProjection({
    customers,
    contacts,
    projects: visibleProjects,
    relationships: visibleRelationships,
    candidates: scopedLinkCandidates,
    activities,
    businessCards: business.businessCards,
    personnel,
    companyId,
    query,
    filter,
    locale,
  }), [activities, business.businessCards, companyId, contacts, customers, filter, locale, personnel, query, scopedLinkCandidates, visibleProjects, visibleRelationships]);

  const setUrl = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    const suffix = next.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if (!['PIPELINE', 'OPPORTUNITIES'].includes(requestedView) || searchParams.get('new') !== '1') return;
    const next = new URLSearchParams();
    const customerId = searchParams.get('customerId');
    const contactId = searchParams.get('contactId');
    if (customerId) next.set('customerId', customerId);
    if (contactId) next.set('contactId', contactId);
    next.set('new', '1');
    router.replace(`/projects/estimate-requests?${next.toString()}`);
  }, [requestedView, router, searchParams]);
  const openDirectory = (nextFilter: CustomerProjectFilter = 'ALL') => setUrl({ view: 'CUSTOMERS', salesView: null, filter: nextFilter, customerId: null, tab: null });
  const run = async <T,>(simulate: () => T) => {
    const result = await executeFrontendMutation(boundary, { simulate });
    setMessage(result.message);
    return result;
  };
  const submitCustomer = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => business.createCustomer(companyId, { ...customerForm, ownerId: customerForm.ownerId || actorId }, actorId));
    if (result.kind !== 'BLOCKED') {
      setDrawer(null);
      setCustomerForm(emptyCustomer());
      setUrl({ view: 'CUSTOMERS', salesView: null, customerId: result.data, tab: 'BASIC' });
    }
  };
  const submitContact = async (event: FormEvent) => {
    event.preventDefault();
    const result = await run(() => business.createContact(companyId, contactForm, actorId));
    if (result.kind !== 'BLOCKED') {
      setDrawer(null);
      setContactForm(emptyContact());
      setUrl({ view: 'CUSTOMERS', salesView: null, customerId: contactForm.customerId, tab: 'CONTACTS' });
    }
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const preview = await previewContactImport(file);
      setImportRows(preview.rows);
      setImportErrors(preview.errors);
    } catch (error) {
      setImportRows([]);
      setImportErrors([error instanceof Error ? error.message : 'IMPORT_FAILED']);
    }
    setDrawer('IMPORT');
  };
  const confirmImport = async () => {
    if (importErrors.length) return;
    const result = await run(() => {
      importRows.forEach((row) => {
        const current = useBusinessOperationsStore.getState();
        let customerId = current.customers.find((item) => item.companyId === companyId && !item.archivedAt && item.name.toLocaleLowerCase() === row.customerName.toLocaleLowerCase())?.id;
        if (!customerId) customerId = current.createCustomer(companyId, { name: row.customerName, industry: '', ownerId: actorId, status: 'PROSPECT', note: 'Reviewed contact import' }, actorId);
        useBusinessOperationsStore.getState().createContact(companyId, { customerId, name: row.name, department: row.department, position: row.position, email: row.email, phone: row.phone, source: 'IMPORT', sourceBusinessCardId: null, lastContactAt: null }, actorId);
      });
      return importRows.length;
    });
    if (result.kind !== 'BLOCKED') {
      setDrawer(null);
      setImportRows([]);
      setMessage(t.imported);
      openDirectory();
    }
  };
  const exportContacts = async () => {
    await exportContactWorkbook(contacts, customers, 'XLSX');
    useAuditStore.getState().addLog({
      actorId,
      action: 'EXPORT',
      entityType: 'SALES_CONTACT_DIRECTORY',
      entityId: companyId,
      message: `Company-scoped contact directory exported; contacts=${contacts.length}; projectsIncluded=false.`,
    });
  };
  const linkCandidate = async (candidateId: string, contactId: string) => {
    await run(() => business.linkCustomerProjectCandidate(candidateId, contactId, actorId));
  };
  const updateCandidateStatus = async (candidateId: string, status: Parameters<typeof business.setCustomerProjectLinkCandidateStatus>[1]) => {
    await run(() => business.setCustomerProjectLinkCandidateStatus(candidateId, status));
  };

  const legacyNotice = isLegacyView ? legacyNoticeFor(requestedView, locale) : null;
  const legacyTarget = isLegacyView ? legacySalesDestination(requestedView) : null;

  return <section className="space-y-5 pb-10">
    <header className="border border-emerald-800 bg-[linear-gradient(120deg,#0d4c4a,#146f65_62%,#245083)] p-6 text-white shadow-[var(--cc-shadow-2)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-[10px] font-black tracking-[.18em] text-emerald-200">CUSTOMER RELATIONSHIP & PROJECT HISTORY · {companyId}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{t.title}</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/80">{t.description}</p></div><HandoffLanguageToggle locale={locale} onChange={setLocale} /></div>
    </header>
    <RuntimeCapabilityPanel boundary={boundary} />
    {legacyNotice && legacyTarget && <div role="status" className="flex flex-wrap items-center gap-3 border border-amber-300 bg-amber-50 p-4 text-amber-950"><AlertTriangle className="h-5 w-5 shrink-0" /><p className="min-w-0 flex-1 text-sm font-bold">{legacyNotice}</p><Link href={legacyTarget.href} className="inline-flex min-h-10 items-center bg-amber-900 px-3 text-xs font-black text-white hover:bg-amber-950">{t.goCanonical}</Link></div>}
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--cc-shadow-1)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="flex gap-2"><button role="tab" aria-selected={view === 'DASHBOARD'} onClick={() => setUrl({ view: null, salesView: null, customerId: null, tab: null, filter: null })} className={tabClass(view === 'DASHBOARD')}>{t.dashboard}</button><button role="tab" aria-selected={view === 'CUSTOMERS'} onClick={() => openDirectory()} className={tabClass(view === 'CUSTOMERS')}>{t.customers}</button></div>
        <ActionButtonGroup label="Customer actions">
          <SemanticActionButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => { setCustomerForm({ ...emptyCustomer(), ownerId: actorId }); setDrawer('CUSTOMER_CREATE'); }}>{t.addCustomer}</SemanticActionButton>
          <SemanticActionButton variant="add-resource" icon={<Plus className="h-4 w-4" />} onClick={() => { setContactForm({ ...emptyContact(), customerId: selectedId ?? projection.rows[0]?.customer.id ?? '' }); setDrawer('CONTACT_CREATE'); }}>{t.addContact}</SemanticActionButton>
          <SemanticActionButton variant="document" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>{t.import}</SemanticActionButton>
          {canExport && <SemanticActionButton variant="document" icon={<Download className="h-4 w-4" />} onClick={() => void exportContacts()}>{t.export}</SemanticActionButton>}
          <input ref={fileRef} type="file" accept=".xlsx,.csv" className="sr-only" onChange={(event) => void importFile(event.target.files?.[0])} />
        </ActionButtonGroup>
      </div>
      {view === 'CUSTOMERS' && <label className="mt-4 flex min-h-11 items-center gap-2 border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3"><Search className="h-4 w-4 text-[var(--color-text-sub)]" /><span className="sr-only">{t.search}</span><input value={query} onChange={(event) => setUrl({ q: event.target.value || null })} placeholder={t.search} className="w-full bg-transparent text-sm font-semibold outline-none" /></label>}
    </div>
    {message && <p role="status" className="border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-bold text-sky-900">{message}</p>}
    {view === 'DASHBOARD'
      ? <CustomerRelationshipDashboard locale={locale} projection={buildCustomerProjectProjection({ customers, contacts, projects: visibleProjects, relationships: visibleRelationships, candidates: scopedLinkCandidates, activities, businessCards: business.businessCards, personnel, companyId, locale })} onFilter={openDirectory} />
      : <div className="space-y-5">
          {filter === 'LINK_REVIEW' && <CustomerProjectLinkReview locale={locale} candidates={scopedLinkCandidates} customers={customers} contacts={contacts} onLink={(candidateId, contactId) => void linkCandidate(candidateId, contactId)} onStatus={(candidateId, status) => void updateCandidateStatus(candidateId, status)} />}
          <CustomerDirectoryWorkbench locale={locale} rows={projection.rows} selectedId={selectedId} selectedContactId={selectedContactId} tab={tab} legacyActivities={activities} legacyOpportunities={legacyOpportunities} onSelect={(customerId) => setUrl({ customerId, contactId: null, tab: null })} onTab={(nextTab) => setUrl({ tab: nextTab, contactId: nextTab === 'PROJECTS' || nextTab === 'CONTACTS' ? selectedContactId : null })} onClearContactFilter={() => setUrl({ contactId: null })} />
        </div>}

    <DetailDrawer open={drawer === 'CUSTOMER_CREATE'} title={t.addCustomer} canEdit onClose={() => setDrawer(null)} footer={<DrawerFooter save={t.save} cancel={t.cancel} form="customer-create-form" onCancel={() => setDrawer(null)} />}>
      <form id="customer-create-form" onSubmit={(event) => void submitCustomer(event)} className="space-y-4"><Field label={t.name}><input required autoFocus className={inputClass} value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} /></Field><Field label={t.industry}><input className={inputClass} value={customerForm.industry} onChange={(event) => setCustomerForm({ ...customerForm, industry: event.target.value })} /></Field><Field label={t.note}><textarea className={`${inputClass} min-h-28`} value={customerForm.note} onChange={(event) => setCustomerForm({ ...customerForm, note: event.target.value })} /></Field></form>
    </DetailDrawer>
    <DetailDrawer open={drawer === 'CONTACT_CREATE'} title={t.addContact} canEdit onClose={() => setDrawer(null)} footer={<DrawerFooter save={t.save} cancel={t.cancel} form="contact-create-form" onCancel={() => setDrawer(null)} />}>
      <form id="contact-create-form" onSubmit={(event) => void submitContact(event)} className="space-y-4"><Field label={t.customer}><select required className={inputClass} value={contactForm.customerId} onChange={(event) => setContactForm({ ...contactForm, customerId: event.target.value })}><option value="">-</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></Field><Field label={t.name}><input required autoFocus className={inputClass} value={contactForm.name} onChange={(event) => setContactForm({ ...contactForm, name: event.target.value })} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label={t.department}><input className={inputClass} value={contactForm.department} onChange={(event) => setContactForm({ ...contactForm, department: event.target.value })} /></Field><Field label={t.position}><input className={inputClass} value={contactForm.position} onChange={(event) => setContactForm({ ...contactForm, position: event.target.value })} /></Field></div><Field label={t.email}><input type="email" className={inputClass} value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} /></Field><Field label={t.phone}><input className={inputClass} value={contactForm.phone} onChange={(event) => setContactForm({ ...contactForm, phone: event.target.value })} /></Field></form>
    </DetailDrawer>
    <DetailDrawer open={drawer === 'IMPORT'} title={t.import} canEdit onClose={() => setDrawer(null)} footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDrawer(null)} className="min-h-10 border border-[var(--color-border-strong)] px-4 text-xs font-black">{t.cancel}</button><button type="button" disabled={Boolean(importErrors.length)} onClick={() => void confirmImport()} className="min-h-10 bg-[#eb6300] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300">{t.save}</button></div>}>
      <div className="space-y-3">{importErrors.map((error) => <p key={error} className="border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-900">{error}</p>)}{importRows.map((row, index) => <div key={`${row.email}-${index}`} className="border border-[var(--color-border)] p-3 text-xs"><strong>{row.name}</strong><p className="mt-1 text-[var(--color-text-sub)]">{row.customerName} · {row.email}</p></div>)}</div>
    </DetailDrawer>
  </section>;
}

function legacyNoticeFor(view: string, locale: 'ko' | 'vi' | 'en') {
  const t = salesCustomerCopy[locale];
  if (view === 'PIPELINE' || view === 'OPPORTUNITIES') return t.legacyPipeline;
  if (view === 'QUOTES') return t.legacyQuotes;
  if (view === 'CONTRACTS') return t.legacyContracts;
  return t.legacyActivities;
}
function tabClass(active: boolean) { return `min-h-11 border px-4 text-sm font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300] ${active ? 'border-[#eb6300] bg-[#fff3e9] text-[#c95000] shadow-sm' : 'border-[var(--color-border)] hover:border-[#efb183] hover:bg-[#fff9f4]'}`; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-black">{label}</span>{children}</label>; }
function DrawerFooter({ save, cancel, form, onCancel }: { save: string; cancel: string; form: string; onCancel: () => void }) { return <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="min-h-10 border border-[var(--color-border-strong)] px-4 text-xs font-black">{cancel}</button><button type="submit" form={form} className="min-h-10 bg-[#eb6300] px-4 text-xs font-black text-white hover:bg-[#c95000]">{save}</button></div>; }
