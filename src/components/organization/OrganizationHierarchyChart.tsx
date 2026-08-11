'use client';

import { useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Crown,
  LocateFixed,
  Maximize2,
  Minus,
  Network,
  Plus,
  Search,
  UsersRound,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import type { CompanyId, PersonnelCard } from '@/types/models';
import {
  getOrganizationNodes,
  getOrganizationTree,
  projectPersonnelMemberships,
  resolvePersonnelOrganization,
  type OrganizationTreeNode,
  type PersonnelOrganizationMembership,
} from '@/lib/organizationHierarchy';

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  search: string;
  expandAll: string;
  collapseAll: string;
  fit: string;
  center: string;
  people: string;
  leader: string;
  unassigned: string;
  unassignedHelp: string;
  noResult: string;
  primary: string;
  secondary: string;
};

const COPY: Record<'ko' | 'vi' | 'en', Copy> = {
  ko: {
    eyebrow: 'ORGANIZATION MAP',
    title: '조직도',
    description: '현재 회사의 공식 조직과 소속 인원을 계층으로 확인합니다.',
    search: '조직명, 직원명, 직책 검색',
    expandAll: '전체 펼치기',
    collapseAll: '전체 접기',
    fit: '화면 맞춤',
    center: '가운데 정렬',
    people: '명',
    leader: '조직 책임자',
    unassigned: '미분류 인원',
    unassignedHelp: '조직 ID가 확정되지 않아 임시로 분리된 인원입니다.',
    noResult: '검색 결과가 없습니다.',
    primary: '주 소속',
    secondary: '겸직',
  },
  vi: {
    eyebrow: 'SƠ ĐỒ TỔ CHỨC',
    title: 'Cơ cấu tổ chức',
    description: 'Xem cơ cấu chính thức và nhân sự của công ty hiện tại.',
    search: 'Tìm đơn vị, nhân viên hoặc chức danh',
    expandAll: 'Mở tất cả',
    collapseAll: 'Thu gọn',
    fit: 'Vừa màn hình',
    center: 'Căn giữa',
    people: 'người',
    leader: 'Phụ trách',
    unassigned: 'Chưa phân loại',
    unassignedHelp: 'Nhân sự chưa có mã đơn vị chính thức.',
    noResult: 'Không có kết quả.',
    primary: 'Đơn vị chính',
    secondary: 'Kiêm nhiệm',
  },
  en: {
    eyebrow: 'ORGANIZATION MAP',
    title: 'Organization chart',
    description: 'Explore the official hierarchy and active personnel for the current company.',
    search: 'Search organization, person, or title',
    expandAll: 'Expand all',
    collapseAll: 'Collapse all',
    fit: 'Fit view',
    center: 'Center',
    people: 'people',
    leader: 'Leader',
    unassigned: 'Unassigned personnel',
    unassignedHelp: 'Personnel waiting for a canonical organization assignment.',
    noResult: 'No matching organization or person.',
    primary: 'Primary',
    secondary: 'Secondary',
  },
};

const NODE_TONES: Record<OrganizationTreeNode['kind'], string> = {
  COMPANY: 'border-orange-300 bg-orange-50 text-orange-950',
  EXECUTIVE: 'border-indigo-300 bg-indigo-50 text-indigo-950',
  DIVISION: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  CENTER: 'border-rose-300 bg-rose-50 text-rose-950',
  DEPARTMENT: 'border-sky-300 bg-sky-50 text-sky-950',
  TEAM: 'border-amber-300 bg-amber-50 text-amber-950',
  PART: 'border-cyan-300 bg-cyan-50 text-cyan-950',
};

const initials = (person: PersonnelCard) => (person.displayName || person.name || 'U')
  .split(/\s+/)
  .map((part) => part[0])
  .join('')
  .slice(0, 2)
  .toUpperCase();

function PersonRow({ person, membership, copy }: { person: PersonnelCard; membership: PersonnelOrganizationMembership; copy: Copy }) {
  const secondaryCount = person.organizationMemberships?.filter((item) => item.status === 'ACTIVE' && item.membershipType === 'SECONDARY').length ?? 0;
  return (
    <div className="flex min-w-0 items-center gap-2 border-t border-black/5 px-3 py-2 text-left">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-slate-700 shadow-sm ring-1 ring-slate-200">
        {initials(person)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 truncate text-[11px] font-extrabold text-slate-900">
          {person.displayName || person.name}
          {membership.isLeader && <Crown aria-label={copy.leader} className="h-3 w-3 shrink-0 fill-amber-300 text-amber-600" />}
        </span>
        <span className="block truncate text-[9px] font-medium text-slate-500">
          {person.jobTitle || person.position || copy.primary}
          {secondaryCount > 0 && <span className="ml-1 font-black text-indigo-600">+{secondaryCount} {copy.secondary}</span>}
        </span>
      </span>
    </div>
  );
}

function TreeBranch({
  node,
  expanded,
  toggle,
  personnelByNode,
  personnelById,
  query,
  copy,
}: {
  node: OrganizationTreeNode;
  expanded: Set<string>;
  toggle: (id: string) => void;
  personnelByNode: Map<string, PersonnelOrganizationMembership[]>;
  personnelById: Map<string, PersonnelCard>;
  query: string;
  copy: Copy;
}) {
  const members = personnelByNode.get(node.id) ?? [];
  const isExpanded = expanded.has(node.id);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const isMatch = Boolean(normalizedQuery) && (
    node.name.toLocaleLowerCase().includes(normalizedQuery)
    || node.code.toLocaleLowerCase().includes(normalizedQuery)
    || members.some((membership) => {
      const person = personnelById.get(membership.personnelId);
      return [person?.name, person?.displayName, person?.jobTitle, person?.position]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(normalizedQuery));
    })
  );

  return (
    <div className="flex shrink-0 flex-col items-center" data-org-id={node.id}>
      <article className={`w-[176px] overflow-hidden border bg-white shadow-sm transition ${NODE_TONES[node.kind]} ${isMatch ? 'ring-2 ring-orange-500 ring-offset-2' : ''}`}>
        <button
          type="button"
          onClick={() => toggle(node.id)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left outline-none transition hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-orange-500"
          aria-expanded={isExpanded}
          title={`${node.displayOrderCode} ${node.name}`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/80 shadow-sm ring-1 ring-black/5">
            {node.kind === 'COMPANY' ? <Building2 className="h-4 w-4" /> : node.kind === 'EXECUTIVE' ? <Crown className="h-4 w-4" /> : <Network className="h-4 w-4" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[8px] font-black uppercase tracking-[0.08em] opacity-60">{node.displayOrderCode} · {node.kind}</span>
            <span className="block truncate text-[12px] font-black">{node.name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[9px] font-black opacity-70">
            {members.length}
            {node.children.length > 0 && (isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
          </span>
        </button>
        {members.slice(0, 3).map((membership) => {
          const person = personnelById.get(membership.personnelId);
          return person ? <PersonRow key={`${membership.personnelId}-${membership.membershipType}`} person={person} membership={membership} copy={copy} /> : null;
        })}
        {members.length > 3 && <div className="border-t border-black/5 px-3 py-1.5 text-center text-[9px] font-black text-slate-500">+{members.length - 3}</div>}
      </article>

      {node.children.length > 0 && isExpanded && (
        <>
          <span aria-hidden className="h-5 w-px bg-slate-300" />
          <div className="relative flex items-start gap-5 px-2 before:absolute before:left-[88px] before:right-[88px] before:top-0 before:h-px before:bg-slate-300">
            {node.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center before:h-5 before:w-px before:bg-slate-300">
                <TreeBranch
                  node={child}
                  expanded={expanded}
                  toggle={toggle}
                  personnelByNode={personnelByNode}
                  personnelById={personnelById}
                  query={query}
                  copy={copy}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function OrganizationHierarchyChart() {
  const users = useAuthStore((state) => state.users);
  const companyId = useUiStore((state) => state.brandWorkspace) as CompanyId;
  const language = String(useTranslationStore((state) => state.settings.uiLanguage));
  const locale = language === 'vi' ? 'vi' : language === 'en' ? 'en' : 'ko';
  const copy = COPY[locale];
  const nodes = useMemo(() => getOrganizationNodes(companyId), [companyId]);
  const tree = useMemo(() => getOrganizationTree(companyId), [companyId]);
  const memberships = useMemo(() => projectPersonnelMemberships(users, companyId), [users, companyId]);
  const personnelById = useMemo(() => new Map(users.map((person) => [person.id, person])), [users]);
  const personnelByNode = useMemo(() => {
    const result = new Map<string, PersonnelOrganizationMembership[]>();
    memberships.filter((membership) => membership.membershipType === 'PRIMARY').forEach((membership) => result.set(membership.organizationNodeId, [...(result.get(membership.organizationNodeId) ?? []), membership]));
    return result;
  }, [memberships]);
  const [query, setQuery] = useState('');
  const [zoom, setZoom] = useState(0.9);
  const [expanded, setExpanded] = useState(() => new Set([
    ...getOrganizationNodes('CON_COST'),
    ...getOrganizationNodes('VIET_QS'),
  ].map((node) => node.id)));
  const canvasRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  const visiblePersonnel = useMemo(() => users.filter((person) => person.companyId === companyId && person.isActive !== false && person.employmentStatus !== 'RESIGNED'), [users, companyId]);
  const unassigned = useMemo(() => visiblePersonnel.filter((person) => resolvePersonnelOrganization(person).resolution === 'UNASSIGNED'), [visiblePersonnel]);
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];
    const nodeResults = nodes.filter((node) => `${node.name} ${node.code}`.toLocaleLowerCase().includes(normalized)).map((node) => ({ id: node.id, label: node.name, detail: node.displayOrderCode }));
    const personResults = visiblePersonnel.filter((person) => [person.name, person.displayName, person.jobTitle, person.position].filter(Boolean).join(' ').toLocaleLowerCase().includes(normalized)).map((person) => {
      const organization = resolvePersonnelOrganization(person).primaryNodeId;
      return { id: organization, label: person.displayName || person.name, detail: nodes.find((node) => node.id === organization)?.name ?? copy.unassigned };
    });
    return [...nodeResults, ...personResults].slice(0, 8);
  }, [query, nodes, visiblePersonnel, copy.unassigned]);

  const reveal = (nodeId: string) => {
    const next = new Set(expanded);
    let current = nodes.find((node) => node.id === nodeId);
    while (current) {
      next.add(current.id);
      current = current.parentId ? nodes.find((node) => node.id === current?.parentId) : undefined;
    }
    setExpanded(next);
    globalThis.setTimeout(() => canvasRef.current?.querySelector<HTMLElement>(`[data-org-id="${nodeId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }), 30);
  };

  const centerCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.scrollTo({ left: Math.max(0, (canvas.scrollWidth - canvas.clientWidth) / 2), top: 0, behavior: 'smooth' });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button, input')) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drag.current = { x: event.clientX, y: event.clientY, left: canvas.scrollLeft, top: canvas.scrollTop };
    canvas.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drag.current) return;
    canvas.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
    canvas.scrollTop = drag.current.top - (event.clientY - drag.current.y);
  };
  const stopDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    drag.current = null;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) canvasRef.current.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 border-b border-slate-200 bg-white px-5 py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.16em] text-orange-600">{copy.eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{copy.title}</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">{copy.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[250px] flex-1 lg:w-[330px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="h-10 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
            {query && <div className="absolute left-0 right-0 top-[44px] z-30 border border-slate-200 bg-white p-1 shadow-xl">
              {searchResults.length ? searchResults.map((result, index) => <button key={`${result.id}-${index}`} type="button" onClick={() => reveal(result.id)} className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-orange-50 focus:bg-orange-50"><span className="font-bold">{result.label}</span><span className="text-slate-400">{result.detail}</span></button>) : <p className="px-3 py-3 text-xs text-slate-500">{copy.noResult}</p>}
            </div>}
          </div>
          <button type="button" onClick={() => setExpanded(new Set(nodes.map((node) => node.id)))} title={copy.expandAll} className="h-10 border border-slate-300 px-3 text-xs font-bold hover:border-orange-400 hover:bg-orange-50">{copy.expandAll}</button>
          <button type="button" onClick={() => setExpanded(new Set(tree.map((node) => node.id)))} title={copy.collapseAll} className="h-10 border border-slate-300 px-3 text-xs font-bold hover:border-orange-400 hover:bg-orange-50">{copy.collapseAll}</button>
        </div>
      </section>

      <section className="relative border border-slate-200 bg-slate-50/80 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600"><UsersRound className="h-4 w-4 text-orange-600" />{companyId === 'VIET_QS' ? 'VIET QS' : 'CON-COST'} · {visiblePersonnel.length} {copy.people}</div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setZoom((value) => Math.max(0.55, Number((value - 0.1).toFixed(2))))} title="Zoom out" aria-label="Zoom out" className="flex h-8 w-8 items-center justify-center border border-slate-300 bg-white hover:border-orange-400"><Minus className="h-4 w-4" /></button>
            <span className="w-12 text-center text-[10px] font-black text-slate-500">{Math.round(zoom * 100)}%</span>
            <button type="button" onClick={() => setZoom((value) => Math.min(1.4, Number((value + 0.1).toFixed(2))))} title="Zoom in" aria-label="Zoom in" className="flex h-8 w-8 items-center justify-center border border-slate-300 bg-white hover:border-orange-400"><Plus className="h-4 w-4" /></button>
            <button type="button" onClick={() => setZoom(0.72)} title={copy.fit} aria-label={copy.fit} className="flex h-8 w-8 items-center justify-center border border-slate-300 bg-white hover:border-orange-400"><Maximize2 className="h-4 w-4" /></button>
            <button type="button" onClick={centerCanvas} title={copy.center} aria-label={copy.center} className="flex h-8 w-8 items-center justify-center border border-slate-300 bg-white hover:border-orange-400"><LocateFixed className="h-4 w-4" /></button>
          </div>
        </div>
        <div
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          className="h-[610px] max-w-full cursor-grab overflow-auto overscroll-contain p-8 active:cursor-grabbing"
        >
          <div className="mx-auto flex w-max min-w-full justify-center pb-24" style={{ zoom } as CSSProperties}>
            {tree.map((root) => <TreeBranch key={root.id} node={root} expanded={expanded} toggle={(id) => setExpanded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; })} personnelByNode={personnelByNode} personnelById={personnelById} query={query} copy={copy} />)}
          </div>
        </div>
      </section>

      {unassigned.length > 0 && <section className="border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2"><UsersRound className="h-4 w-4 text-amber-700" /><h3 className="text-sm font-black text-amber-950">{copy.unassigned} · {unassigned.length}</h3></div>
        <p className="mt-1 text-xs text-amber-800">{copy.unassignedHelp}</p>
        <div className="mt-3 flex flex-wrap gap-2">{unassigned.map((person) => <span key={person.id} className="border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">{person.displayName || person.name}</span>)}</div>
      </section>}
    </div>
  );
}
