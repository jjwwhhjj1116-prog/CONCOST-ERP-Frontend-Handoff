'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { ArrowRight, BellRing, ChevronLeft, ChevronRight, Eye, FileText, Image as ImageIcon, LayoutGrid, List, MessageCircle, Paperclip, PenLine, Search, SlidersHorizontal, UserRoundCheck } from 'lucide-react';
import { SemanticActionButton } from '@/components/ui/SemanticActionButton';
import { isBoardNoticeActive, localizedBoardText, type BoardDefinition, type BoardPost, type BoardViewType } from './boardOperationalModel';
import { canReadBoard, canWriteBoard } from './boardPermissions';
import { boardListHref, boardPostHref, boardWriteHref } from './boardRoutes';
import type { BoardCopy } from './boardCopy';
import { useOperationalBoardStore } from './useOperationalBoardStore';
import { BoardMetricCard, BoardRuntimeBanner, BoardSectionHeader, BoardStatusBadge, boardDate, useBoardContext } from './BoardUi';

const PAGE_SIZE = 20;
const filterOptions = ['ALL', 'UNREAD', 'MUST_READ', 'TODAY', 'DRAFT', 'MINE', 'COMMENTED', 'ATTACHMENTS', 'NOTICE'] as const;
type BoardFilter = typeof filterOptions[number];
const sortOptions = ['LATEST', 'VIEWS', 'COMMENTS'] as const;
type BoardSort = typeof sortOptions[number];
const viewOptions: Array<{ id: BoardViewType; icon: typeof List }> = [{ id: 'CLASSIC', icon: List }, { id: 'PREVIEW', icon: FileText }, { id: 'ALBUM', icon: ImageIcon }, { id: 'FEED', icon: LayoutGrid }];

const filterLabel = (filter: BoardFilter, copy: BoardCopy) => ({ ALL: copy.all, UNREAD: copy.unreadOnly, MUST_READ: copy.mustReadOnly, TODAY: copy.today, DRAFT: copy.drafts, MINE: copy.mine, COMMENTED: copy.commented, ATTACHMENTS: copy.attachments, NOTICE: copy.notices })[filter];
const sortLabel = (sort: BoardSort, copy: BoardCopy) => ({ LATEST: copy.latest, VIEWS: copy.views, COMMENTS: copy.comments })[sort];

export function BoardHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { actor, companyId, language, copy } = useBoardContext();
  const boards = useOperationalBoardStore((state) => state.boards);
  const posts = useOperationalBoardStore((state) => state.posts);
  const comments = useOperationalBoardStore((state) => state.comments);
  const attachments = useOperationalBoardStore((state) => state.attachments);
  const receipts = useOperationalBoardStore((state) => state.readReceipts);
  const [searchDraft, setSearchDraft] = React.useState(searchParams.get('q') ?? '');
  const labelFilter = searchParams.get('label') ?? '';
  const authorFilter = searchParams.get('author') ?? '';
  const fromFilter = searchParams.get('from') ?? '';
  const toFilter = searchParams.get('to') ?? '';
  const extraCopy = {
    ko: { label: '라벨', author: '작성자', allLabels: '전체 라벨', allAuthors: '전체 작성자', from: '시작일', to: '종료일' },
    vi: { label: 'Nhãn', author: 'Tác giả', allLabels: 'Tất cả nhãn', allAuthors: 'Tất cả tác giả', from: 'Từ ngày', to: 'Đến ngày' },
    en: { label: 'Label', author: 'Author', allLabels: 'All labels', allAuthors: 'All authors', from: 'From', to: 'To' },
  }[language];
  const labelOptions = Array.from(new Set(posts.filter((post) => post.companyId === companyId && post.labelId).map((post) => post.labelId!))).sort();
  const authorOptions = Array.from(new Map(posts.filter((post) => post.companyId === companyId).map((post) => [post.authorId, post.authorNameSnapshot])).entries());

  const accessibleBoards = React.useMemo(() => actor ? boards.filter((board) => board.companyId === companyId && board.active && canReadBoard(board, actor).allowed).sort((a, b) => a.sortOrder - b.sortOrder) : [], [actor, boards, companyId]);
  const requestedBoard = searchParams.get('boardId');
  const legacyCategory = searchParams.get('category');
  const selectedBoard = accessibleBoards.find((board) => board.id === requestedBoard)
    ?? accessibleBoards.find((board) => board.legacyCategory === legacyCategory)
    ?? null;
  const query = (searchParams.get('q') ?? '').trim().toLowerCase();
  const filter = filterOptions.includes(searchParams.get('filter') as BoardFilter) ? searchParams.get('filter') as BoardFilter : 'ALL';
  const sort = sortOptions.includes(searchParams.get('sort') as BoardSort) ? searchParams.get('sort') as BoardSort : 'LATEST';
  const page = Math.max(1, Number(searchParams.get('page') || '1') || 1);
  const requestedView = searchParams.get('view') as BoardViewType | null;
  const view = viewOptions.some((option) => option.id === requestedView) ? requestedView! : selectedBoard?.viewType ?? 'CLASSIC';
  const currentListHref = boardListHref({ boardId: selectedBoard?.id, query: searchParams.get('q'), filter: filter === 'ALL' ? null : filter, sort: sort === 'LATEST' ? null : sort, page, view: requestedView, label: labelFilter, author: authorFilter, from: fromFilter, to: toFilter });
  const attachmentNames = React.useMemo(() => new Map(attachments.filter((item) => item.companyId === companyId).map((item) => [item.id, item.fileName])), [attachments, companyId]);
  const readIds = React.useMemo(() => new Set(receipts.filter((item) => item.companyId === companyId && item.personnelId === actor?.id).map((item) => item.postId)), [actor?.id, companyId, receipts]);
  const commentedIds = React.useMemo(() => new Set(comments.filter((item) => item.companyId === companyId && item.authorId === actor?.id).map((item) => item.postId)), [actor?.id, comments, companyId]);
  const todayKey = new Date().toISOString().slice(0, 10);

  const visiblePosts = posts
    .filter((post) => post.companyId === companyId)
    .filter((post) => accessibleBoards.some((board) => board.id === post.boardId))
    .filter((post) => post.status !== 'DELETED')
    .filter((post) => post.status === 'PUBLISHED' || post.authorId === actor?.id)
    .filter((post) => !selectedBoard || post.boardId === selectedBoard.id)
    .filter((post) => !query || `${post.title} ${post.contentText} ${post.authorNameSnapshot} ${post.attachmentIds.map((id) => attachmentNames.get(id) ?? '').join(' ')}`.toLowerCase().includes(query))
    .filter((post) => !labelFilter || post.labelId === labelFilter)
    .filter((post) => !authorFilter || post.authorId === authorFilter)
    .filter((post) => !fromFilter || post.createdAt.slice(0, 10) >= fromFilter)
    .filter((post) => !toFilter || post.createdAt.slice(0, 10) <= toFilter)
    .filter((post) => {
      if (filter === 'UNREAD') return post.status === 'PUBLISHED' && !readIds.has(post.id);
      if (filter === 'MUST_READ') return post.isMustRead && !readIds.has(post.id);
      if (filter === 'TODAY') return post.createdAt.startsWith(todayKey);
      if (filter === 'DRAFT') return post.status === 'DRAFT' && post.authorId === actor?.id;
      if (filter === 'MINE') return post.authorId === actor?.id;
      if (filter === 'COMMENTED') return commentedIds.has(post.id);
      if (filter === 'ATTACHMENTS') return post.attachmentIds.length > 0;
      if (filter === 'NOTICE') return isBoardNoticeActive(post);
      return true;
    })
    .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || Number(isBoardNoticeActive(b)) - Number(isBoardNoticeActive(a)) || (sort === 'VIEWS' ? b.viewCount - a.viewCount : sort === 'COMMENTS' ? b.commentCount - a.commentCount : b.updatedAt.localeCompare(a.updatedAt)));

  const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagePosts = visiblePosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const companyPosts = posts.filter((post) => post.companyId === companyId && post.status !== 'DELETED');
  const metrics = {
    unread: companyPosts.filter((post) => post.status === 'PUBLISHED' && !readIds.has(post.id)).length,
    mustRead: companyPosts.filter((post) => post.status === 'PUBLISHED' && post.isMustRead && !readIds.has(post.id)).length,
    today: companyPosts.filter((post) => post.createdAt.startsWith(todayKey)).length,
    drafts: companyPosts.filter((post) => post.status === 'DRAFT' && post.authorId === actor?.id).length,
  };

  const replaceParams = (updates: Record<string, string | number | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => value === null || value === '' || value === 0 ? params.delete(key) : params.set(key, String(value)));
    const serialized = params.toString();
    router.push(serialized ? `/board?${serialized}` : '/board');
  };
  const runSearch = (event: React.FormEvent) => { event.preventDefault(); replaceParams({ q: searchDraft.trim() || null, page: null }); };
  const writeBoard = selectedBoard && actor && canWriteBoard(selectedBoard, actor).allowed ? selectedBoard : accessibleBoards.find((board) => actor && canWriteBoard(board, actor).allowed);

  if (!actor) return null;
  return <main className="mx-auto w-full max-w-[1560px] space-y-6 px-4 pb-24 pt-5 sm:px-6 lg:px-8">
    <BoardSectionHeader eyebrow="Operational board" title={selectedBoard ? localizedBoardText(selectedBoard.name, language) : copy.board} description={selectedBoard ? localizedBoardText(selectedBoard.description, language) : copy.description} actions={<><Link href="/organization" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-4 text-sm font-black text-teal-800 transition hover:-translate-y-px hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><UserRoundCheck className="h-4 w-4" />{copy.organization}</Link>{writeBoard && <Link href={boardWriteHref(writeBoard.id)}><SemanticActionButton variant="primary" icon={<PenLine className="h-4 w-4" />}>{copy.write}</SemanticActionButton></Link>}</>} />
    <BoardRuntimeBanner />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="게시판 현황">
      <BoardMetricCard label={copy.unread} value={metrics.unread} active={filter === 'UNREAD'} onClick={() => replaceParams({ filter: filter === 'UNREAD' ? null : 'UNREAD', page: null })} tone="indigo" />
      <BoardMetricCard label={copy.mustRead} value={metrics.mustRead} active={filter === 'MUST_READ'} onClick={() => replaceParams({ filter: filter === 'MUST_READ' ? null : 'MUST_READ', page: null })} tone="amber" />
      <BoardMetricCard label={copy.today} value={metrics.today} active={filter === 'TODAY'} onClick={() => replaceParams({ filter: filter === 'TODAY' ? null : 'TODAY', page: null })} tone="emerald" />
      <BoardMetricCard label={copy.drafts} value={metrics.drafts} active={filter === 'DRAFT'} onClick={() => replaceParams({ filter: filter === 'DRAFT' ? null : 'DRAFT', page: null })} />
    </section>

    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--cc-shadow-1)] sm:p-5">
      <div className="grid gap-3 xl:grid-cols-[minmax(220px,300px)_minmax(320px,1fr)_auto_auto] xl:items-end">
        <label className="text-xs font-black text-[var(--color-text-sub)]"><span className="mb-1.5 block">{copy.selectedBoard}</span><select value={selectedBoard?.id ?? ''} onChange={(event) => replaceParams({ boardId: event.target.value || null, category: null, page: null })} className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/15"><option value="">{copy.all}</option>{accessibleBoards.map((board) => <option key={board.id} value={board.id}>{localizedBoardText(board.name, language)}</option>)}</select></label>
        <form onSubmit={runSearch}><label className="text-xs font-black text-[var(--color-text-sub)]"><span className="mb-1.5 block">{copy.search}</span><span className="flex min-h-11 items-center rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/15"><Search className="mr-2 h-4 w-4" /><input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" aria-label={copy.search} /><button type="submit" className="ml-2 min-h-8 rounded-md px-2 text-xs font-black text-[var(--color-primary-strong)] hover:bg-orange-50">{copy.search.split(' ')[0]}</button></span></label></form>
        <label className="text-xs font-black text-[var(--color-text-sub)]"><span className="mb-1.5 block">{copy.latest}</span><select value={sort} onChange={(event) => replaceParams({ sort: event.target.value === 'LATEST' ? null : event.target.value, page: null })} className="min-h-11 rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold outline-none focus:border-[var(--color-primary)]">{sortOptions.map((option) => <option key={option} value={option}>{sortLabel(option, copy)}</option>)}</select></label>
        <div><span className="mb-1.5 block text-xs font-black text-[var(--color-text-sub)]">{copy.viewType}</span><div role="group" aria-label={copy.viewType} className="flex rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-1">{viewOptions.map(({ id, icon: Icon }) => <button key={id} type="button" title={({ CLASSIC: copy.classic, PREVIEW: copy.preview, ALBUM: copy.album, FEED: copy.feed })[id]} aria-pressed={view === id} onClick={() => replaceParams({ view: id, page: null })} className={`flex min-h-9 min-w-9 items-center justify-center rounded-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${view === id ? 'bg-[var(--color-surface)] text-[var(--color-primary-strong)] shadow-sm' : 'text-[var(--color-text-sub)] hover:bg-white/70'}`}><Icon className="h-4 w-4" /></button>)}</div></div>
      </div>
      <div className="mt-4 grid gap-3 border-t border-[var(--color-border)] pt-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-xs font-black text-[var(--color-text-sub)]">{extraCopy.label}<select value={labelFilter} onChange={(event) => replaceParams({ label: event.target.value || null, page: null })} className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold"><option value="">{extraCopy.allLabels}</option>{labelOptions.map((label) => <option key={label} value={label}>{label}</option>)}</select></label>
        <label className="text-xs font-black text-[var(--color-text-sub)]">{extraCopy.author}<select value={authorFilter} onChange={(event) => replaceParams({ author: event.target.value || null, page: null })} className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold"><option value="">{extraCopy.allAuthors}</option>{authorOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="text-xs font-black text-[var(--color-text-sub)]">{extraCopy.from}<input type="date" value={fromFilter} onChange={(event) => replaceParams({ from: event.target.value || null, page: null })} className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold" /></label>
        <label className="text-xs font-black text-[var(--color-text-sub)]">{extraCopy.to}<input type="date" value={toFilter} onChange={(event) => replaceParams({ to: event.target.value || null, page: null })} className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold" /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-[var(--color-text-sub)]" />{filterOptions.map((option) => <button key={option} type="button" aria-pressed={filter === option} onClick={() => replaceParams({ filter: option === 'ALL' ? null : option, page: null })} className={`min-h-9 rounded-full border px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${filter === option ? 'border-[var(--color-primary)] bg-orange-50 text-[var(--color-primary-strong)]' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:border-orange-300'}`}>{filterLabel(option, copy)}</button>)}{(filter !== 'ALL' || query || selectedBoard || labelFilter || authorFilter || fromFilter || toFilter) && <button type="button" onClick={() => { setSearchDraft(''); router.push('/board'); }} className="min-h-9 rounded-full px-3 text-xs font-black text-red-700 hover:bg-red-50">{copy.reset}</button>}</div>
    </section>

    <BoardListSurface posts={pagePosts} boards={accessibleBoards} view={view} readIds={readIds} language={language} copy={copy} returnTo={currentListHref} writeBoardId={writeBoard?.id} />

    {visiblePosts.length > PAGE_SIZE && <nav aria-label="게시판 페이지" className="flex items-center justify-center gap-3"><button type="button" disabled={safePage <= 1} onClick={() => replaceParams({ page: safePage - 1 })} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><span className="text-sm font-black">{copy.page} {safePage} {copy.of} {totalPages}</span><button type="button" disabled={safePage >= totalPages} onClick={() => replaceParams({ page: safePage + 1 })} className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></nav>}
  </main>;
}

function BoardListSurface({ posts, boards, view, readIds, language, copy, returnTo, writeBoardId }: { posts: BoardPost[]; boards: BoardDefinition[]; view: BoardViewType; readIds: Set<string>; language: 'ko' | 'vi' | 'en'; copy: BoardCopy; returnTo: string; writeBoardId?: string }) {
  const boardMap = new Map(boards.map((board) => [board.id, board]));
  if (!posts.length) return <section className="grid min-h-72 place-items-center rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center"><div><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-700"><FileText className="h-7 w-7" /></span><h2 className="mt-4 text-lg font-black">{copy.empty}</h2>{writeBoardId && <Link href={boardWriteHref(writeBoardId)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-black text-white hover:bg-[var(--color-primary-strong)]"><PenLine className="h-4 w-4" />{copy.emptyAction}</Link>}</div></section>;
  if (view === 'CLASSIC') return <section className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--cc-shadow-1)]"><div className="overflow-x-auto"><table className="min-w-[900px] w-full text-left"><thead className="bg-[var(--cc-surface-2)] text-[11px] font-black text-[var(--color-text-sub)]"><tr><th className="px-4 py-3">{copy.notice}</th><th className="px-4 py-3">{copy.title}</th><th className="px-4 py-3">{copy.author}</th><th className="px-4 py-3">{copy.date}</th><th className="px-4 py-3 text-center">{copy.viewsLabel}</th><th className="px-4 py-3 text-center">{copy.comment}</th><th className="px-4 py-3">{copy.read}</th></tr></thead><tbody>{posts.map((post) => <tr key={post.id} className="border-t border-[var(--color-border)] transition hover:bg-orange-50/45 focus-within:bg-orange-50/45"><td className="px-4 py-3"><PostFlags post={post} /></td><td className="px-4 py-3"><Link href={boardPostHref(post.id, returnTo)} className="group block min-w-[280px] rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><span className="flex items-center gap-2 text-sm font-black text-[var(--color-text-main)] group-hover:text-[var(--color-primary-strong)]">{post.title}{post.attachmentIds.length > 0 && <Paperclip className="h-3.5 w-3.5 shrink-0 text-sky-700" />}<ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" /></span><span className="mt-1 block text-[10px] font-bold text-[var(--color-text-sub)]">{localizedBoardText(boardMap.get(post.boardId)?.name ?? { ko: '-', vi: '-', en: '-' }, language)}</span></Link></td><td className="px-4 py-3 text-xs font-bold">{post.authorNameSnapshot}</td><td className="px-4 py-3 text-xs font-semibold text-[var(--color-text-sub)]">{boardDate(post.updatedAt, language)}</td><td className="px-4 py-3 text-center text-xs font-bold">{post.viewCount}</td><td className="px-4 py-3 text-center text-xs font-bold">{post.commentCount}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[10px] font-black ${readIds.has(post.id) ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'}`}>{readIds.has(post.id) ? copy.read : copy.unreadLabel}</span></td></tr>)}</tbody></table></div></section>;
  return <section className={`grid gap-4 ${view === 'ALBUM' ? 'sm:grid-cols-2 xl:grid-cols-3' : view === 'PREVIEW' ? 'lg:grid-cols-2' : 'max-w-4xl'}`}>{posts.map((post) => <Link key={post.id} href={boardPostHref(post.id, returnTo)} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{view === 'ALBUM' && <div className="mb-4 grid aspect-[16/8] place-items-center rounded-xl bg-gradient-to-br from-orange-50 via-white to-sky-50 text-orange-600"><ImageIcon className="h-10 w-10" /></div>}<div className="flex flex-wrap items-center gap-2"><PostFlags post={post} /><BoardStatusBadge status={post.status} /></div><h2 className="mt-3 text-lg font-black text-[var(--color-text-main)] group-hover:text-[var(--color-primary-strong)]">{post.title}</h2><p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-[var(--color-text-sub)]">{post.contentText}</p><footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3 text-[10px] font-bold text-[var(--color-text-sub)]"><span>{post.authorNameSnapshot} · {boardDate(post.updatedAt, language)}</span><span className="flex items-center gap-3"><span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{post.viewCount}</span><span className="flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" />{post.commentCount}</span></span></footer></Link>)}</section>;
}

function PostFlags({ post }: { post: BoardPost }) {
  return <span className="flex flex-wrap gap-1">{isBoardNoticeActive(post) && <span className="rounded-md bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-900"><BellRing className="mr-1 inline h-3 w-3" />NOTICE</span>}{post.isMustRead && <span className="rounded-md bg-indigo-100 px-2 py-1 text-[9px] font-black text-indigo-900">MUST</span>}{post.status !== 'PUBLISHED' && <BoardStatusBadge status={post.status} />}</span>;
}
