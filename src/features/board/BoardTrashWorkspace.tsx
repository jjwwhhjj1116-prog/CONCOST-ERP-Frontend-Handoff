'use client';

import Link from 'next/link';
import React from 'react';
import { ArrowLeft, RotateCcw, Trash2 } from 'lucide-react';
import { ActionButtonGroup, SemanticActionButton } from '@/components/ui/SemanticActionButton';
import { localizedBoardText, type BoardMutationResult } from './boardOperationalModel';
import { canManageBoard, canReadBoard } from './boardPermissions';
import { boardPostHref } from './boardRoutes';
import { BoardEmptyState, BoardFeedback, BoardRuntimeBanner, BoardSectionHeader, BoardStatusBadge, boardDate, useBoardContext } from './BoardUi';
import { useOperationalBoardStore } from './useOperationalBoardStore';

export function BoardTrashWorkspace() {
  const { actor, companyId, language, copy } = useBoardContext();
  const boards = useOperationalBoardStore((state) => state.boards);
  const posts = useOperationalBoardStore((state) => state.posts);
  const restorePost = useOperationalBoardStore((state) => state.restorePost);
  const permanentlyDeletePost = useOperationalBoardStore((state) => state.permanentlyDeletePost);
  const [feedback, setFeedback] = React.useState<BoardMutationResult<unknown> | null>(null);

  if (!actor) return null;
  const boardMap = new Map(boards.filter((board) => board.companyId === companyId && canReadBoard(board, actor).allowed).map((board) => [board.id, board]));
  const deleted = posts.filter((post) => post.companyId === companyId && post.status === 'DELETED' && boardMap.has(post.boardId)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const canOperate = (postId: string) => {
    const post = posts.find((item) => item.id === postId);
    const board = post ? boardMap.get(post.boardId) : undefined;
    return Boolean(post && board && canManageBoard(board, actor));
  };
  const permanentlyRemove = (postId: string) => {
    if (!window.confirm(`${copy.permanentDelete}?`)) return;
    setFeedback(permanentlyDeletePost(postId, actor));
  };

  return <main className="mx-auto w-full max-w-[1320px] space-y-5 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
    <BoardSectionHeader eyebrow="Operational board recycle bin" title={copy.trash} description={copy.deletedMessage} actions={<Link href="/board"><SemanticActionButton variant="neutral" icon={<ArrowLeft className="h-4 w-4" />}>{copy.list}</SemanticActionButton></Link>} />
    <BoardRuntimeBanner />
    <BoardFeedback result={feedback} onDismiss={() => setFeedback(null)} />
    {!deleted.length ? <BoardEmptyState title={copy.empty} description={copy.description} /> : <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--cc-shadow-1)]">
      <ul className="divide-y divide-[var(--color-border)]">{deleted.map((post) => {
        const board = boardMap.get(post.boardId);
        const permitted = canOperate(post.id);
        return <li key={post.id} className="flex flex-col gap-4 p-4 transition hover:bg-orange-50/40 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <Link href={boardPostHref(post.id, '/board/trash')} className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
            <span className="flex flex-wrap items-center gap-2"><BoardStatusBadge status={post.status} /><span className="text-[10px] font-black text-slate-500">{board ? localizedBoardText(board.name, language) : '-'}</span></span>
            <strong className="mt-2 block truncate text-base text-slate-900">{post.title}</strong>
            <span className="mt-1 block text-xs font-bold text-slate-500">{post.authorNameSnapshot} · {boardDate(post.updatedAt, language)}</span>
          </Link>
          {permitted && <ActionButtonGroup label="Trash actions"><SemanticActionButton variant="success" size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setFeedback(restorePost(post.id, actor))}>{copy.restore}</SemanticActionButton><SemanticActionButton variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={() => permanentlyRemove(post.id)}>{copy.permanentDelete}</SemanticActionButton></ActionButtonGroup>}
        </li>;
      })}</ul>
    </section>}
  </main>;
}
