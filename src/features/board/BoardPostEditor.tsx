'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Bold, Eye, Italic, Link2, List, ListOrdered, Pin, Quote, Save, Send, Table2, Underline } from 'lucide-react';
import { ActionButtonGroup, SemanticActionButton, StickyEditActionBar } from '@/components/ui/SemanticActionButton';
import { BoardAttachmentPicker } from './BoardAttachmentList';
import { localizedBoardText, textToSafeHtml, type BoardMutationResult, type BoardPostInput, type BoardPostStatus } from './boardOperationalModel';
import { canEditPost, canUseBoardPermission, canWriteBoard } from './boardPermissions';
import { boardPostHref } from './boardRoutes';
import { BoardAccessState, BoardFeedback, BoardRuntimeBanner, BoardSectionHeader, useBoardContext } from './BoardUi';
import { useOperationalBoardStore } from './useOperationalBoardStore';

const emptyInput = (boardId = ''): BoardPostInput => ({ boardId, title: '', contentText: '', status: 'DRAFT', labelId: null, isNotice: false, isMustRead: false, isPinned: false, noticeStartAt: null, noticeEndAt: null, scheduledAt: null, allowComments: true, allowReactions: true, attachmentIds: [], notify: false });

export function BoardPostEditor({ mode }: { mode: 'CREATE' | 'EDIT' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedPostId = searchParams.get('postId') ?? '';
  const requestedBoardId = searchParams.get('boardId') ?? '';
  const { actor, companyId, language, copy } = useBoardContext();
  const boards = useOperationalBoardStore((state) => state.boards);
  const posts = useOperationalBoardStore((state) => state.posts);
  const createPost = useOperationalBoardStore((state) => state.createPost);
  const updatePost = useOperationalBoardStore((state) => state.updatePost);
  const existing = mode === 'EDIT' ? posts.find((post) => post.id === requestedPostId && post.companyId === companyId) : undefined;
  const availableBoards = actor ? boards.filter((board) => board.companyId === companyId && board.active && canWriteBoard(board, actor).allowed) : [];
  const initialBoardId = existing?.boardId || (availableBoards.some((board) => board.id === requestedBoardId) ? requestedBoardId : availableBoards[0]?.id ?? '');
  const [input, setInput] = React.useState<BoardPostInput>(() => existing ? { boardId: existing.boardId, title: existing.title, contentText: existing.contentText, status: existing.status === 'SCHEDULED' ? 'SCHEDULED' : existing.status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED', labelId: existing.labelId, isNotice: existing.isNotice, isMustRead: existing.isMustRead, isPinned: existing.isPinned, noticeStartAt: existing.noticeStartAt, noticeEndAt: existing.noticeEndAt, scheduledAt: existing.scheduledAt, allowComments: existing.allowComments, allowReactions: existing.allowReactions, attachmentIds: existing.attachmentIds, notify: false } : emptyInput(initialBoardId));
  const [workingPostId, setWorkingPostId] = React.useState(existing?.id ?? '');
  const [workingRevision, setWorkingRevision] = React.useState(existing?.revision ?? 0);
  const [dirty, setDirty] = React.useState(false);
  const [preview, setPreview] = React.useState(false);
  const [feedback, setFeedback] = React.useState<BoardMutationResult<unknown> | null>(null);
  const board = boards.find((candidate) => candidate.id === input.boardId && candidate.companyId === companyId);
  const noticeAllowed = actor && board ? canUseBoardPermission(board, actor, 'BOARD_NOTICE').allowed : false;

  React.useEffect(() => { document.getElementById('board-title')?.focus(); }, []);
  React.useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (!dirty) return; event.preventDefault(); };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [dirty]);
  React.useEffect(() => {
    if (!dirty || !actor || (input.title.trim().length === 0 && input.contentText.trim().length === 0)) return;
    const timer = window.setTimeout(() => {
      const draftInput = { ...input, status: 'DRAFT' as const, scheduledAt: null };
      const result = workingPostId ? updatePost(workingPostId, draftInput, workingRevision, actor) : createPost(draftInput, actor);
      if (result.ok && result.data) { setWorkingPostId(result.data.id); setWorkingRevision(result.data.revision); setDirty(false); setFeedback({ ...result, message: copy.autoSaved }); }
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [actor, copy.autoSaved, createPost, dirty, input, updatePost, workingPostId, workingRevision]);

  const change = <Key extends keyof BoardPostInput>(key: Key, value: BoardPostInput[Key]) => { setInput((current) => ({ ...current, [key]: value })); setDirty(true); };
  const decorate = React.useCallback((prefix: string, suffix = prefix, placeholder = '') => {
    const element = document.getElementById('board-content') as HTMLTextAreaElement | null;
    if (!element) return;
    const start = element.selectionStart; const end = element.selectionEnd; const selected = input.contentText.slice(start, end) || placeholder;
    change('contentText', `${input.contentText.slice(0, start)}${prefix}${selected}${suffix}${input.contentText.slice(end)}`);
    requestAnimationFrame(() => { element.focus(); element.setSelectionRange(start + prefix.length, start + prefix.length + selected.length); });
  }, [input.contentText]);
  if (!actor) return null;
  if (mode === 'EDIT' && (!existing || !board)) return <BoardAccessState title={copy.missing} description={copy.missing} />;
  if (existing && board && !canEditPost(board, existing, actor).allowed) return <BoardAccessState title={copy.forbidden} description={canEditPost(board, existing, actor).reason} />;
  if (!availableBoards.length && mode === 'CREATE') return <BoardAccessState title={copy.noPermissionToWrite} description={copy.noPermissionToWrite} />;

  const validate = (status: BoardPostStatus) => {
    if (!input.boardId) return copy.validationTitle;
    if (status === 'DRAFT' && !input.title.trim() && !input.contentText.trim()) return copy.validationTitle;
    if (status !== 'DRAFT' && (!input.title.trim() || !input.contentText.trim())) return copy.validationTitle;
    if (status === 'SCHEDULED' && !input.scheduledAt) return copy.scheduledAt;
    if ((input.isNotice || input.isMustRead || input.isPinned) && !noticeAllowed) return copy.noPermissionToWrite;
    return '';
  };
  const submit = (status: Extract<BoardPostStatus, 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>) => {
    const error = validate(status);
    if (error) { setFeedback({ ok: false, code: 'VALIDATION_ERROR', message: error }); document.getElementById(!input.title.trim() ? 'board-title' : 'board-content')?.focus(); return; }
    const next = { ...input, status, scheduledAt: status === 'SCHEDULED' ? input.scheduledAt : null };
    const result = workingPostId ? updatePost(workingPostId, next, workingRevision, actor) : createPost(next, actor);
    setFeedback(result);
    if (result.ok && result.data) { setDirty(false); setWorkingPostId(result.data.id); setWorkingRevision(result.data.revision); router.push(boardPostHref(result.data.id)); }
  };
  const cancel = () => { if (!dirty || window.confirm(copy.unsavedConfirm)) router.back(); };

  return <main className="mx-auto w-full max-w-[1180px] space-y-5 px-4 pb-32 pt-5 sm:px-6 lg:px-8">
    <BoardSectionHeader eyebrow="Operational board editor" title={mode === 'CREATE' ? copy.write : copy.edit} description={dirty ? copy.dirty : workingPostId ? `${copy.autoSaved} \u00b7 r${workingRevision}` : copy.description} />
    <BoardRuntimeBanner />
    <BoardFeedback result={feedback} onDismiss={() => setFeedback(null)} />
    <section className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)] sm:p-7">
      <div className="grid gap-4 md:grid-cols-[minmax(220px,320px)_1fr]"><label className="text-xs font-black text-[var(--color-text-sub)]">{copy.boardSelect}<span className="ml-1 text-red-600">*</span><select value={input.boardId} onChange={(event) => change('boardId', event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold outline-none focus:border-orange-500">{availableBoards.map((item) => <option key={item.id} value={item.id}>{localizedBoardText(item.name, language)}</option>)}</select></label><label className="text-xs font-black text-[var(--color-text-sub)]">{copy.label}<input value={input.labelId ?? ''} onChange={(event) => change('labelId', event.target.value)} placeholder="NEWS / POLICY / EVENT" className="mt-2 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-semibold outline-none focus:border-orange-500" /></label></div>
      <label className="block text-xs font-black text-[var(--color-text-sub)]">{copy.title}<span className="ml-1 text-red-600">*</span><input id="board-title" value={input.title} onChange={(event) => change('title', event.target.value)} maxLength={160} className="mt-2 min-h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-4 text-base font-black outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></label>
      <div><span className="block text-xs font-black text-[var(--color-text-sub)]">{copy.content}<span className="ml-1 text-red-600">*</span></span><div role="toolbar" aria-label="Editor toolbar" className="mt-2 flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-[var(--color-border)] bg-[var(--cc-surface-2)] p-2">{[
        [Bold, 'Bold', () => decorate('**', '**', 'bold')], [Italic, 'Italic', () => decorate('_', '_', 'italic')], [Underline, 'Underline', () => decorate('<u>', '</u>', 'underline')], [List, 'List', () => decorate('- ', '', 'item')], [ListOrdered, 'Numbered list', () => decorate('1. ', '', 'item')], [Quote, 'Quote', () => decorate('> ', '', 'quote')], [Link2, 'Link', () => decorate('[', '](https://)', 'link')], [Table2, 'Table', () => decorate('| ', ' |\n| --- |\n| value |', 'header')]
      ].map(([Icon, label, action]) => { const ToolbarIcon = Icon as typeof Bold; return <button key={label as string} type="button" title={label as string} onClick={action as () => void} className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-white hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><ToolbarIcon className="h-4 w-4" /></button>; })}</div><textarea id="board-content" value={input.contentText} onChange={(event) => change('contentText', event.target.value)} rows={15} className="w-full resize-y rounded-b-xl border border-[var(--color-border)] bg-white p-4 text-sm font-medium leading-7 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" /></div>
      {board?.allowAttachments && <BoardAttachmentPicker actor={actor} ownerType="POST" ownerId={workingPostId || 'pending-post'} value={input.attachmentIds} onChange={(ids) => change('attachmentIds', ids)} copy={copy} />}
      <fieldset className="rounded-xl border border-[var(--color-border)] p-4"><legend className="px-2 text-xs font-black text-[var(--color-text-sub)]">{copy.settings}</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['allowComments', copy.commentsAllowed], ['allowReactions', copy.reactionsAllowed], ['notify', copy.notify]].map(([key, label]) => <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 text-xs font-black hover:bg-slate-50"><input type="checkbox" checked={Boolean(input[key as keyof BoardPostInput])} onChange={(event) => change(key as keyof BoardPostInput, event.target.checked as never)} />{label}</label>)}{noticeAllowed && [['isNotice', copy.notice], ['isMustRead', copy.mustReadLabel], ['isPinned', copy.pinned]].map(([key, label]) => <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-900"><input type="checkbox" checked={Boolean(input[key as keyof BoardPostInput])} onChange={(event) => change(key as keyof BoardPostInput, event.target.checked as never)} />{label}</label>)}</div>{noticeAllowed && input.isNotice && <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-black">{copy.noticeStart}<input type="datetime-local" value={input.noticeStartAt ?? ''} onChange={(event) => change('noticeStartAt', event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label><label className="text-xs font-black">{copy.noticeEnd}<input type="datetime-local" value={input.noticeEndAt ?? ''} onChange={(event) => change('noticeEndAt', event.target.value)} className="mt-2 min-h-11 w-full rounded-lg border px-3" /></label></div>}<label className="mt-4 block text-xs font-black">{copy.scheduledAt}<input type="datetime-local" value={input.scheduledAt ?? ''} onChange={(event) => change('scheduledAt', event.target.value)} className="mt-2 min-h-11 w-full max-w-sm rounded-lg border px-3" /></label></fieldset>
      {preview && <article className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-5"><h2 className="text-xl font-black">{input.title || copy.title}</h2><div className="mt-4 text-sm leading-7" dangerouslySetInnerHTML={{ __html: textToSafeHtml(input.contentText || copy.content) }} /></article>}
    </section>
    <StickyEditActionBar><span className="text-xs font-black text-slate-600">{dirty ? copy.dirty : copy.autoSaved}</span><ActionButtonGroup label="Editor actions"><SemanticActionButton variant="neutral" onClick={cancel}>{copy.cancel}</SemanticActionButton><SemanticActionButton variant="view" icon={<Eye className="h-4 w-4" />} onClick={() => setPreview((value) => !value)}>{copy.previewAction}</SemanticActionButton><SemanticActionButton variant="save" icon={<Save className="h-4 w-4" />} onClick={() => submit('DRAFT')}>{copy.draft}</SemanticActionButton>{input.scheduledAt && <SemanticActionButton variant="warning" icon={<Pin className="h-4 w-4" />} onClick={() => submit('SCHEDULED')}>{copy.schedule}</SemanticActionButton>}<SemanticActionButton variant="primary" icon={<Send className="h-4 w-4" />} onClick={() => submit('PUBLISHED')}>{copy.publish}</SemanticActionButton></ActionButtonGroup></StickyEditActionBar>
  </main>;
}
