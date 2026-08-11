'use client';

import React from 'react';
import { ArchiveRestore, FolderTree, Plus, Save, Settings2, ShieldCheck } from 'lucide-react';
import { SemanticActionButton } from '@/components/ui/SemanticActionButton';
import {
  localizedBoardText,
  type BoardDefinition,
  type BoardGroup,
  type BoardMutationResult,
  type BoardScopeType,
  type BoardViewType,
} from './boardOperationalModel';
import { canOpenBoardAdmin } from './boardPermissions';
import { BoardAccessState, BoardFeedback, BoardRuntimeBanner, BoardSectionHeader, useBoardContext } from './BoardUi';
import { useOperationalBoardStore } from './useOperationalBoardStore';

const splitIds = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);

const labels = {
  ko: {
    eyebrow: '게시판 운영', description: '그룹, 공개범위, 운영자, 보기 방식과 상호작용 정책을 회사별로 관리합니다.',
    newBoard: '새 게시판', groupSettings: '그룹·순서 관리', newGroup: '새 그룹', sortOrder: '정렬순서',
    code: '코드', managerIds: '운영자 personnel ID', readOrg: '열람 조직 ID', writeOrg: '작성 조직 ID',
    readPeople: '열람 personnel ID', writePeople: '작성 personnel ID', policy: '상호작용 정책',
    comments: '댓글', replies: '답글', reactions: '반응', attachments: '첨부', defaultNotify: '기본 알림',
    noticePermission: '공지 등록 권한', managersOnly: '운영자만', allWriters: '모든 작성자',
    groupName: '그룹명', active: '사용', scopeHint: '쉼표로 여러 ID를 구분합니다.',
  },
  vi: {
    eyebrow: 'Vận hành bảng tin', description: 'Quản lý nhóm, phạm vi, người quản lý, kiểu hiển thị và chính sách theo từng công ty.',
    newBoard: 'Bảng tin mới', groupSettings: 'Quản lý nhóm và thứ tự', newGroup: 'Nhóm mới', sortOrder: 'Thứ tự',
    code: 'Mã', managerIds: 'Personnel ID người quản lý', readOrg: 'ID tổ chức được đọc', writeOrg: 'ID tổ chức được viết',
    readPeople: 'Personnel ID được đọc', writePeople: 'Personnel ID được viết', policy: 'Chính sách tương tác',
    comments: 'Bình luận', replies: 'Trả lời', reactions: 'Phản ứng', attachments: 'Tệp đính kèm', defaultNotify: 'Thông báo mặc định',
    noticePermission: 'Quyền đăng thông báo', managersOnly: 'Chỉ người quản lý', allWriters: 'Mọi người viết',
    groupName: 'Tên nhóm', active: 'Hoạt động', scopeHint: 'Phân tách nhiều ID bằng dấu phẩy.',
  },
  en: {
    eyebrow: 'Board operations', description: 'Manage groups, scopes, managers, view types, and interaction policies per company.',
    newBoard: 'New board', groupSettings: 'Group and order management', newGroup: 'New group', sortOrder: 'Sort order',
    code: 'Code', managerIds: 'Manager personnel IDs', readOrg: 'Readable organization IDs', writeOrg: 'Writable organization IDs',
    readPeople: 'Readable personnel IDs', writePeople: 'Writable personnel IDs', policy: 'Interaction policy',
    comments: 'Comments', replies: 'Replies', reactions: 'Reactions', attachments: 'Attachments', defaultNotify: 'Default notification',
    noticePermission: 'Notice permission', managersOnly: 'Managers only', allWriters: 'All writers',
    groupName: 'Group name', active: 'Active', scopeHint: 'Separate multiple IDs with commas.',
  },
} as const;

export function BoardAdminWorkspace() {
  const { companyId } = useBoardContext();
  return <BoardAdminCompanyWorkspace key={companyId} />;
}

function BoardAdminCompanyWorkspace() {
  const { actor, companyId, language, copy } = useBoardContext();
  const tx = labels[language];
  const groups = useOperationalBoardStore((state) => state.groups);
  const boards = useOperationalBoardStore((state) => state.boards);
  const upsertGroup = useOperationalBoardStore((state) => state.upsertGroup);
  const createGroup = useOperationalBoardStore((state) => state.createGroup);
  const upsertBoard = useOperationalBoardStore((state) => state.upsertBoard);
  const createBoard = useOperationalBoardStore((state) => state.createBoard);
  const toggleBoardArchive = useOperationalBoardStore((state) => state.toggleBoardArchive);
  const companyBoards = boards.filter((board) => board.companyId === companyId).sort((a, b) => a.sortOrder - b.sortOrder);
  const companyGroups = groups.filter((group) => group.companyId === companyId).sort((a, b) => a.sortOrder - b.sortOrder);
  const [selectedId, setSelectedId] = React.useState(companyBoards[0]?.id ?? '');
  const selected = companyBoards.find((board) => board.id === selectedId) ?? companyBoards[0];
  const [draft, setDraft] = React.useState<BoardDefinition | null>(selected ? structuredClone(selected) : null);
  const [creating, setCreating] = React.useState(false);
  const [groupDraft, setGroupDraft] = React.useState<BoardGroup | null>(null);
  const [feedback, setFeedback] = React.useState<BoardMutationResult<unknown> | null>(null);

  if (!actor) return null;
  if (!canOpenBoardAdmin(actor)) return <BoardAccessState title={copy.forbidden} description="ADMIN Board Manager capability required." />;

  const save = () => { if (draft) setFeedback(upsertBoard(draft, actor)); };
  const startCreate = () => {
    setCreating(true);
    setDraft({
      id: '', companyId, groupId: companyGroups[0]?.id ?? null, legacyCategory: 'FREE',
      code: `CUSTOM_${Date.now()}`,
      name: { ko: '새 게시판', vi: 'Bảng tin mới', en: 'New board' },
      description: { ko: '업무 게시판', vi: 'Bảng tin công việc', en: 'Work board' },
      viewType: 'CLASSIC', scopeType: 'COMPANY', readableOrganizationNodeIds: [], writableOrganizationNodeIds: [],
      readablePersonnelIds: [], writablePersonnelIds: [], managerPersonnelIds: [actor.id],
      allowComments: true, allowReplies: true, allowReactions: true, allowAttachments: true,
      noticePermission: 'MANAGERS_ONLY', defaultNotify: false, active: true, sortOrder: companyBoards.length + 1,
    });
  };
  const create = () => {
    if (!draft) return;
    const input = { ...draft } as Partial<BoardDefinition>;
    delete input.id;
    const result = createBoard(input as Omit<BoardDefinition, 'id'>, actor);
    setFeedback(result);
    if (result.ok && result.data) {
      setCreating(false);
      setSelectedId(result.data.id);
      setDraft(structuredClone(result.data));
    }
  };
  const setField = <Key extends keyof BoardDefinition>(key: Key, value: BoardDefinition[Key]) =>
    setDraft((current) => current ? { ...current, [key]: value } : current);

  const saveGroup = () => {
    if (!groupDraft) return;
    const result = groupDraft.id
      ? upsertGroup(groupDraft, actor)
      : createGroup({ companyId, name: groupDraft.name, sortOrder: groupDraft.sortOrder, active: groupDraft.active }, actor);
    setFeedback(result);
    if (result.ok) setGroupDraft(null);
  };

  return <main className="mx-auto w-full max-w-[1440px] space-y-5 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
    <BoardSectionHeader eyebrow={tx.eyebrow} title={copy.manage} description={tx.description} actions={<SemanticActionButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={startCreate}>{tx.newBoard}</SemanticActionButton>} />
    <BoardRuntimeBanner />
    <BoardFeedback result={feedback} onDismiss={() => setFeedback(null)} />

    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--cc-shadow-1)]">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-black"><FolderTree className="h-5 w-5 text-teal-700" />{tx.groupSettings}</h2>
        <SemanticActionButton variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setGroupDraft({ id: '', companyId, name: { ko: '새 그룹', vi: 'Nhóm mới', en: 'New group' }, sortOrder: companyGroups.length + 1, active: true })}>{tx.newGroup}</SemanticActionButton>
      </header>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {companyGroups.map((group) => <button key={group.id} type="button" onClick={() => setGroupDraft(structuredClone(group))} className="flex min-h-16 items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-4 text-left transition hover:-translate-y-px hover:border-teal-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><span><strong className="block text-sm">{localizedBoardText(group.name, language)}</strong><small className="font-bold text-slate-500">#{group.sortOrder}</small></span><span className={group.active ? 'text-emerald-700' : 'text-slate-500'}>{group.active ? copy.active : copy.archived}</span></button>)}
      </div>
      {groupDraft && <div className="mt-4 grid gap-3 rounded-xl border border-teal-200 bg-teal-50/40 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <LocaleField label="한국어" value={groupDraft.name.ko} onChange={(value) => setGroupDraft({ ...groupDraft, name: { ...groupDraft.name, ko: value } })} />
        <LocaleField label="Tiếng Việt" value={groupDraft.name.vi} onChange={(value) => setGroupDraft({ ...groupDraft, name: { ...groupDraft.name, vi: value } })} />
        <LocaleField label="English" value={groupDraft.name.en} onChange={(value) => setGroupDraft({ ...groupDraft, name: { ...groupDraft.name, en: value } })} />
        <NumberField label={tx.sortOrder} value={groupDraft.sortOrder} onChange={(value) => setGroupDraft({ ...groupDraft, sortOrder: value })} />
        <div className="flex items-end gap-2"><label className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-black"><input type="checkbox" checked={groupDraft.active} onChange={(event) => setGroupDraft({ ...groupDraft, active: event.target.checked })} />{tx.active}</label><SemanticActionButton variant="save" size="sm" onClick={saveGroup}>{copy.save}</SemanticActionButton></div>
      </div>}
    </section>

    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <nav className="rounded-2xl border border-[var(--color-border)] bg-white p-3 shadow-[var(--cc-shadow-1)]" aria-label="Board configuration list">
        <h2 className="px-2 pb-3 text-xs font-black text-slate-500">{companyId} · {companyBoards.length}</h2>
        <div className="space-y-1">{companyBoards.map((board) => <button key={board.id} type="button" aria-current={board.id === selected?.id ? 'page' : undefined} onClick={() => { setCreating(false); setSelectedId(board.id); setDraft(structuredClone(board)); }} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl px-3 text-left text-sm font-black transition hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${board.id === selected?.id && !creating ? 'border-l-4 border-orange-500 bg-orange-50 text-orange-900' : ''}`}><span className="truncate">{localizedBoardText(board.name, language)}</span><span className={`rounded-full px-2 py-1 text-[9px] ${board.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{board.active ? copy.active : copy.archived}</span></button>)}</div>
      </nav>

      {draft && <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-[var(--cc-shadow-1)] sm:p-7">
        <header className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-800"><Settings2 className="h-5 w-5" /></span><div><h2 className="text-xl font-black">{creating ? tx.newBoard : localizedBoardText(draft.name, language)}</h2><p className="text-xs font-bold text-slate-500">{draft.code} · {draft.id || 'NEW'}</p></div></header>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <LocaleField label="한국어" value={draft.name.ko} onChange={(value) => setField('name', { ...draft.name, ko: value })} />
          <LocaleField label="Tiếng Việt" value={draft.name.vi} onChange={(value) => setField('name', { ...draft.name, vi: value })} />
          <LocaleField label="English" value={draft.name.en} onChange={(value) => setField('name', { ...draft.name, en: value })} />
          <TextField label={tx.code} value={draft.code} onChange={(value) => setField('code', value)} />
          <LocaleField label={copy.boardDescription + ' · KO'} value={draft.description.ko} onChange={(value) => setField('description', { ...draft.description, ko: value })} />
          <LocaleField label={copy.boardDescription + ' · VI'} value={draft.description.vi} onChange={(value) => setField('description', { ...draft.description, vi: value })} />
          <LocaleField label={copy.boardDescription + ' · EN'} value={draft.description.en} onChange={(value) => setField('description', { ...draft.description, en: value })} />
          <label className="text-xs font-black">{copy.group}<select value={draft.groupId ?? ''} onChange={(event) => setField('groupId', event.target.value || null)} className="mt-2 min-h-11 w-full rounded-lg border px-3"><option value="">-</option>{companyGroups.map((group) => <option key={group.id} value={group.id}>{localizedBoardText(group.name, language)}</option>)}</select></label>
          <label className="text-xs font-black">{copy.boardType}<select value={draft.viewType} onChange={(event) => setField('viewType', event.target.value as BoardViewType)} className="mt-2 min-h-11 w-full rounded-lg border px-3"><option>CLASSIC</option><option>PREVIEW</option><option>ALBUM</option><option>FEED</option></select></label>
          <label className="text-xs font-black">{copy.scope}<select value={draft.scopeType} onChange={(event) => setField('scopeType', event.target.value as BoardScopeType)} className="mt-2 min-h-11 w-full rounded-lg border px-3"><option>COMPANY</option><option>ORGANIZATION</option><option>MEMBERS</option></select></label>
          <NumberField label={tx.sortOrder} value={draft.sortOrder} onChange={(value) => setField('sortOrder', value)} />
          <TextField label={tx.managerIds} value={draft.managerPersonnelIds.join(', ')} hint={tx.scopeHint} onChange={(value) => setField('managerPersonnelIds', splitIds(value))} />
          <TextField label={tx.readOrg} value={draft.readableOrganizationNodeIds.join(', ')} hint={tx.scopeHint} onChange={(value) => setField('readableOrganizationNodeIds', splitIds(value))} />
          <TextField label={tx.writeOrg} value={draft.writableOrganizationNodeIds.join(', ')} hint={tx.scopeHint} onChange={(value) => setField('writableOrganizationNodeIds', splitIds(value))} />
          <TextField label={tx.readPeople} value={draft.readablePersonnelIds.join(', ')} hint={tx.scopeHint} onChange={(value) => setField('readablePersonnelIds', splitIds(value))} />
          <TextField label={tx.writePeople} value={draft.writablePersonnelIds.join(', ')} hint={tx.scopeHint} onChange={(value) => setField('writablePersonnelIds', splitIds(value))} />
          <label className="text-xs font-black">{tx.noticePermission}<select value={draft.noticePermission} onChange={(event) => setField('noticePermission', event.target.value as BoardDefinition['noticePermission'])} className="mt-2 min-h-11 w-full rounded-lg border px-3"><option value="MANAGERS_ONLY">{tx.managersOnly}</option><option value="ALL_WRITERS">{tx.allWriters}</option></select></label>
        </div>

        <fieldset className="mt-5 rounded-xl border p-4"><legend className="px-2 text-xs font-black">{tx.policy}</legend><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{([
          ['allowComments', tx.comments], ['allowReplies', tx.replies], ['allowReactions', tx.reactions],
          ['allowAttachments', tx.attachments], ['defaultNotify', tx.defaultNotify], ['active', tx.active],
        ] as const).map(([key, label]) => <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-xs font-black hover:bg-slate-50"><input type="checkbox" checked={draft[key]} onChange={(event) => setField(key, event.target.checked)} />{label}</label>)}</div></fieldset>

        <div className="mt-6 flex flex-wrap justify-end gap-2">{!creating && <SemanticActionButton variant="archive" icon={<ArchiveRestore className="h-4 w-4" />} onClick={() => setFeedback(toggleBoardArchive(draft.id, actor))}>{draft.active ? copy.archived : copy.restore}</SemanticActionButton>}<SemanticActionButton variant="save" icon={<Save className="h-4 w-4" />} onClick={creating ? create : save}>{copy.save}</SemanticActionButton></div>
      </section>}
    </div>
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-xs font-bold text-indigo-900"><ShieldCheck className="mr-2 inline h-4 w-4" />SYSTEM_ADMIN does not automatically receive restricted board content access. Board Manager or approved content capability is required.</section>
  </main>;
}

function LocaleField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="text-xs font-black">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>;
}
function TextField({ label, value, onChange, hint }: { label: string; value: string; onChange: (value: string) => void; hint?: string }) {
  return <label className="text-xs font-black">{label}<input value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border px-3" />{hint && <small className="mt-1 block font-semibold text-slate-500">{hint}</small>}</label>;
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="text-xs font-black">{label}<input type="number" min={1} value={value} onChange={(event) => onChange(Math.max(1, Number(event.target.value) || 1))} className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label>;
}