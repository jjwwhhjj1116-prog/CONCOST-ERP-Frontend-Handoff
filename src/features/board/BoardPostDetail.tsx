'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Archive, ArrowLeft, BellRing, Check, ChevronLeft, ChevronRight, ClipboardCopy, Eye, Heart, Megaphone, Move, Pencil, Pin, Printer, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { ActionButtonGroup, SemanticActionButton } from '@/components/ui/SemanticActionButton';
import { BoardAttachmentList } from './BoardAttachmentList';
import { BoardCommentThread } from './BoardCommentThread';
import { isBoardNoticeActive, localizedBoardText, type BoardMutationResult, type BoardReactionKind } from './boardOperationalModel';
import { canDeletePost, canEditPost, canManageBoard, canReadBoard } from './boardPermissions';
import { boardEditHref, boardPostHref, decodeBoardReturnTo } from './boardRoutes';
import { BoardAccessState, BoardFeedback, BoardRuntimeBanner, BoardSectionHeader, BoardStatusBadge, boardDate, useBoardContext } from './BoardUi';
import { useOperationalBoardStore } from './useOperationalBoardStore';

const reactionOptions: Array<{ id: BoardReactionKind; icon: typeof Heart; label: Record<'ko' | 'vi' | 'en', string> }> = [
  { id: 'LIKE', icon: Heart, label: { ko: '\uC88B\uC544\uC694', vi: 'Th\u00edch', en: 'Like' } },
  { id: 'CONFIRM', icon: Check, label: { ko: '\uD655\uC778', vi: '\u0110\u00e3 xem', en: 'Confirm' } },
  { id: 'THANKS', icon: Sparkles, label: { ko: '\uAC10\uC0AC', vi: 'C\u1ea3m \u01a1n', en: 'Thanks' } },
  { id: 'CHEER', icon: BellRing, label: { ko: '\uC751\uC6D0', vi: 'C\u1ed5 v\u0169', en: 'Cheer' } },
];

export function BoardPostDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('postId') ?? '';
  const returnTo = decodeBoardReturnTo(searchParams.get('returnTo'));
  const { actor, companyId, language, copy } = useBoardContext();
  const boards = useOperationalBoardStore((state) => state.boards);
  const posts = useOperationalBoardStore((state) => state.posts);
  const attachments = useOperationalBoardStore((state) => state.attachments);
  const reactions = useOperationalBoardStore((state) => state.reactions);
  const receipts = useOperationalBoardStore((state) => state.readReceipts);
  const softDeletePost = useOperationalBoardStore((state) => state.softDeletePost);
  const copyPost = useOperationalBoardStore((state) => state.copyPost);
  const movePost = useOperationalBoardStore((state) => state.movePost);
  const archivePost = useOperationalBoardStore((state) => state.archivePost);
  const markRead = useOperationalBoardStore((state) => state.markRead);
  const incrementViewOnce = useOperationalBoardStore((state) => state.incrementViewOnce);
  const toggleReaction = useOperationalBoardStore((state) => state.toggleReaction);
  const requestUnreadReminder = useOperationalBoardStore((state) => state.requestUnreadReminder);
  const updatePostModeration = useOperationalBoardStore((state) => state.updatePostModeration);
  const [feedback, setFeedback] = React.useState<BoardMutationResult<unknown> | null>(null);
  const [moveBoardId, setMoveBoardId] = React.useState('');
  const post = posts.find((candidate) => candidate.id === postId && candidate.companyId === companyId);
  const board = post ? boards.find((candidate) => candidate.id === post.boardId && candidate.companyId === companyId) : undefined;
  const canRead = actor && board ? canReadBoard(board, actor) : { allowed: false, reason: copy.forbidden };

  React.useEffect(() => {
    if (!actor || !post || !board || post.status !== 'PUBLISHED' || !canRead.allowed) return;
    markRead(post.id, actor);
    incrementViewOnce(post.id, actor, 'board-detail');
  }, [actor, board, canRead.allowed, incrementViewOnce, markRead, post]);

  if (!actor) return null;
  if (!post || !board) return <BoardAccessState title={copy.missing} description={copy.missing} />;
  if (!canRead.allowed) return <BoardAccessState title={copy.forbidden} description={canRead.reason} />;
  if (post.status === 'DELETED') return <BoardAccessState title={copy.deleted} description={copy.deleted} href="/board/trash" />;

  const availablePosts = posts.filter((candidate) => candidate.companyId === companyId && candidate.boardId === board.id && candidate.status === 'PUBLISHED').sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const index = availablePosts.findIndex((candidate) => candidate.id === post.id);
  const previous = index > 0 ? availablePosts[index - 1] : null;
  const next = index >= 0 && index < availablePosts.length - 1 ? availablePosts[index + 1] : null;
  const postAttachments = attachments.filter((item) => item.companyId === companyId && post.attachmentIds.includes(item.id));
  const ownReactions = new Set(reactions.filter((item) => item.companyId === companyId && item.postId === post.id && item.personnelId === actor.id).map((item) => item.kind));
  const reactionCounts = new Map<BoardReactionKind, number>();
  reactions.filter((item) => item.companyId === companyId && item.postId === post.id).forEach((item) => reactionCounts.set(item.kind, (reactionCounts.get(item.kind) ?? 0) + 1));
  const readCount = receipts.filter((item) => item.companyId === companyId && item.postId === post.id).length;
  const editAllowed = canEditPost(board, post, actor).allowed;
  const deleteAllowed = canDeletePost(board, post, actor).allowed;
  const manager = canManageBoard(board, actor);
  const noticeActive = isBoardNoticeActive(post);
  const targetBoards = boards.filter((candidate) => candidate.companyId === companyId && candidate.active && candidate.id !== board.id);
  const run = (result: BoardMutationResult<unknown>) => setFeedback(result);

  const remove = () => {
    if (!window.confirm(`${copy.remove}?`)) return;
    const result = softDeletePost(post.id, actor);
    run(result);
    if (result.ok) router.push('/board/trash');
  };
  const duplicate = () => {
    const result = copyPost(post.id, actor);
    run(result);
    if (result.ok && result.data && typeof result.data === 'object' && 'id' in result.data) router.push(boardEditHref(String(result.data.id)));
  };
  const move = () => {
    if (!moveBoardId) { run({ ok: false, code: 'VALIDATION_ERROR', message: copy.selectedBoard }); return; }
    const result = movePost(post.id, moveBoardId, actor);
    run(result);
    if (result.ok) router.push(returnTo);
  };

  return <main className="mx-auto w-full max-w-[1320px] space-y-5 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
    <BoardSectionHeader eyebrow={localizedBoardText(board.name, language)} title={copy.detail} description={`${post.authorNameSnapshot} \u00b7 ${boardDate(post.updatedAt, language)}`} actions={<Link href={returnTo}><SemanticActionButton variant="neutral" icon={<ArrowLeft className="h-4 w-4" />}>{copy.list}</SemanticActionButton></Link>} />
    <BoardRuntimeBanner />
    <BoardFeedback result={feedback} onDismiss={() => setFeedback(null)} />
    <article className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--cc-shadow-1)]">
      <header className="border-b border-[var(--color-border)] bg-gradient-to-r from-orange-50/80 via-white to-sky-50/60 p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2">{noticeActive && <span className="rounded-md bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-900"><Megaphone className="mr-1 inline h-3.5 w-3.5" />{copy.notice}</span>}{post.isMustRead && <span className="rounded-md bg-indigo-100 px-2.5 py-1 text-[10px] font-black text-indigo-900">{copy.mustReadLabel}</span>}{post.isPinned && <span className="rounded-md bg-orange-100 px-2.5 py-1 text-[10px] font-black text-orange-900">{copy.pinned}</span>}<BoardStatusBadge status={post.status} /></div>
        <h1 className="mt-4 text-2xl font-black leading-tight text-[var(--color-text-main)] sm:text-3xl">{post.title}</h1>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[var(--color-text-sub)]"><span>{post.authorNameSnapshot}</span><span>{post.authorOrganizationSnapshot || '-'}</span><span>{boardDate(post.createdAt, language)}</span><span>{post.updatedAt !== post.createdAt ? `${copy.edit} ${boardDate(post.updatedAt, language)}` : ''}</span><span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.viewCount}</span><span>r{post.revision}</span></div>
      </header>
      <div className="min-h-64 p-5 text-[15px] font-medium leading-7 text-slate-800 sm:p-8" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4"><div className="flex flex-wrap gap-2">{post.allowReactions && reactionOptions.map(({ id, icon: Icon, label }) => <button key={id} type="button" aria-pressed={ownReactions.has(id)} onClick={() => run(toggleReaction(post.id, id, actor))} className={`inline-flex min-h-10 items-center gap-2 rounded-full border px-3 text-xs font-black transition hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${ownReactions.has(id) ? 'border-indigo-300 bg-indigo-100 text-indigo-900' : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'}`}><Icon className="h-4 w-4" />{label[language]} {reactionCounts.get(id) ?? 0}</button>)}</div>{post.isMustRead && manager && <span className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-900"><ShieldCheck className="mr-1 inline h-4 w-4" />{copy.readStatus}: DEMO {readCount}</span>}</footer>
    </article>

    <BoardAttachmentList items={postAttachments} copy={copy} language={language} />

    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--cc-shadow-1)]"><ActionButtonGroup label="Post actions">
      {editAllowed && <Link href={boardEditHref(post.id)}><SemanticActionButton variant="edit" size="sm" icon={<Pencil className="h-4 w-4" />}>{copy.edit}</SemanticActionButton></Link>}
      {deleteAllowed && <SemanticActionButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={remove}>{copy.remove}</SemanticActionButton>}
      <SemanticActionButton variant="duplicate" size="sm" icon={<ClipboardCopy className="h-4 w-4" />} onClick={duplicate}>{copy.copy}</SemanticActionButton>
      {manager && <><SemanticActionButton variant="warning" size="sm" icon={<Megaphone className="h-4 w-4" />} onClick={() => run(updatePostModeration(post.id, { isNotice: !post.isNotice }, post.revision, actor))}>{copy.notice} {post.isNotice ? 'OFF' : 'ON'}</SemanticActionButton><SemanticActionButton variant="view" size="sm" icon={<ShieldCheck className="h-4 w-4" />} onClick={() => run(updatePostModeration(post.id, { isMustRead: !post.isMustRead }, post.revision, actor))}>{copy.mustReadLabel} {post.isMustRead ? 'OFF' : 'ON'}</SemanticActionButton><SemanticActionButton variant="primary" size="sm" icon={<Pin className="h-4 w-4" />} onClick={() => run(updatePostModeration(post.id, { isPinned: !post.isPinned }, post.revision, actor))}>{copy.pinned} {post.isPinned ? 'OFF' : 'ON'}</SemanticActionButton><SemanticActionButton variant="archive" size="sm" icon={<Archive className="h-4 w-4" />} onClick={() => run(archivePost(post.id, actor))}>{copy.archived}</SemanticActionButton><select aria-label={copy.move} value={moveBoardId} onChange={(event) => setMoveBoardId(event.target.value)} className="min-h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs font-black"><option value="">{copy.selectedBoard}</option>{targetBoards.map((item) => <option key={item.id} value={item.id}>{localizedBoardText(item.name, language)}</option>)}</select><SemanticActionButton variant="document" size="sm" icon={<Move className="h-4 w-4" />} onClick={move}>{copy.move}</SemanticActionButton>{post.isMustRead && <SemanticActionButton variant="warning" size="sm" icon={<BellRing className="h-4 w-4" />} onClick={() => run(requestUnreadReminder(post.id, actor))}>{copy.reminder}</SemanticActionButton>}</>}
      <SemanticActionButton variant="neutral" size="sm" icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>{copy.print}</SemanticActionButton>
    </ActionButtonGroup></section>

    {post.allowComments && <BoardCommentThread postId={post.id} board={board} actor={actor} copy={copy} language={language} />}

    <nav className="grid gap-3 sm:grid-cols-2" aria-label="Previous and next posts">{previous ? <Link href={boardPostHref(previous.id, returnTo)} className="group flex min-h-16 items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 shadow-sm hover:border-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><ChevronLeft className="h-4 w-4" /><span className="min-w-0"><small className="block font-black text-slate-500">{copy.previous}</small><strong className="block truncate text-sm group-hover:text-orange-700">{previous.title}</strong></span></Link> : <span />}{next && <Link href={boardPostHref(next.id, returnTo)} className="group flex min-h-16 items-center justify-end gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 text-right shadow-sm hover:border-orange-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"><span className="min-w-0"><small className="block font-black text-slate-500">{copy.next}</small><strong className="block truncate text-sm group-hover:text-orange-700">{next.title}</strong></span><ChevronRight className="h-4 w-4" /></Link>}</nav>
  </main>;
}
