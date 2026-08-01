'use client';

import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import { Eye, FileText, ImageIcon, Megaphone, Paperclip, PenLine, Plus, Search, UserRound, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { boardCategories, categoryLabel, type BoardCategory, type BoardPost } from './boardModel';
import { useBoardStore } from './useBoardStore';

const dateText = (value: string) => new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));

function CategoryIcon({ category }: { category: BoardCategory }) {
  if (category === 'CEO') return <UserRound className="h-4 w-4" />;
  if (category === 'PHOTO') return <ImageIcon className="h-4 w-4" />;
  if (category.startsWith('NOTICE')) return <Megaphone className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export function BoardWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { posts, addPost, incrementViews } = useBoardStore();
  const requestedCategory = searchParams.get('category') as BoardCategory | null;
  const activeCategory = boardCategories.some((item) => item.id === requestedCategory) ? requestedCategory : null;
  const [query, setQuery] = React.useState('');
  const [selectedPost, setSelectedPost] = React.useState<BoardPost | null>(null);
  const [composing, setComposing] = React.useState(false);
  const [draftCategory, setDraftCategory] = React.useState<BoardCategory>(activeCategory ?? 'FREE');
  const [draftTitle, setDraftTitle] = React.useState('');
  const [draftContent, setDraftContent] = React.useState('');
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '/workspace';

  const filteredPosts = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return posts
      .filter((post) => !activeCategory || post.category === activeCategory)
      .filter((post) => !normalized || `${post.title} ${post.content} ${post.authorName}`.toLowerCase().includes(normalized))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  }, [activeCategory, posts, query]);

  const openPost = (post: BoardPost) => {
    incrementViews(post.id);
    setSelectedPost({ ...post, views: post.views + 1 });
  };

  const submitPost = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser || !draftTitle.trim() || !draftContent.trim()) return;
    const created = addPost({ category: draftCategory, title: draftTitle.trim(), content: draftContent.trim(), authorId: currentUser.id, authorName: currentUser.displayName || currentUser.name });
    setDraftTitle('');
    setDraftContent('');
    setComposing(false);
    setSelectedPost(created);
  };

  return (
    <div className="mx-auto w-full max-w-[1480px] space-y-6">
      <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-6 md:flex-row md:items-end md:justify-between">
        <div className="cc-page-heading">
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-[#eb6300]">Company board</p>
          <h1 className="mt-2 text-2xl font-black tracking-[0] text-[var(--color-text-main)] md:text-[30px]">{activeCategory ? categoryLabel(activeCategory) : '게시판'}</h1>
          <p className="mt-2 text-sm font-medium text-[var(--color-text-sub)]">전사 소식과 구성원의 업무 정보를 한곳에서 확인합니다.</p>
        </div>
        <button type="button" onClick={() => setComposing(true)} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#eb6300] px-5 text-sm font-black text-white shadow-[0_10px_22px_rgba(235,99,0,.22)] hover:bg-[#cc5100] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f6ae7c]"><Plus className="h-4 w-4" />게시글 작성</button>
      </header>

      <section className="grid border-y border-[var(--color-border)] bg-[var(--color-surface)] sm:grid-cols-4" aria-label="게시판 현황">
        {[
          ['전체 게시글', posts.length],
          ['공지사항', posts.filter((post) => post.category.startsWith('NOTICE')).length],
          ['커뮤니티', posts.filter((post) => ['PHOTO', 'FREE'].includes(post.category)).length],
          ['자료실', posts.filter((post) => post.category === 'LIBRARY').length],
        ].map(([label, value]) => <div key={label} className="border-b border-[var(--color-border)] px-5 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><strong className="block text-2xl font-black text-[#172554] dark:text-white">{value}</strong><span className="mt-1 block text-xs font-bold text-[var(--color-text-sub)]">{label}</span></div>)}
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="cc-scrollbar flex gap-2 overflow-x-auto pb-1">
          {boardCategories.map((category) => {
            const active = category.id === 'ALL' ? !activeCategory : activeCategory === category.id;
            return <button key={category.id} type="button" onClick={() => router.push(category.id === 'ALL' ? '/board' : `/board?category=${category.id}`)} className={`min-h-9 shrink-0 border px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300] ${active ? 'border-[#172554] bg-[#172554] text-white' : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:border-[#eb6300] hover:text-[#eb6300]'}`}>{category.label}</button>;
          })}
        </div>
        <label className="flex min-h-11 w-full items-center border border-[var(--color-border)] bg-[var(--color-surface)] px-4 focus-within:border-[#eb6300] focus-within:ring-2 focus-within:ring-[#eb6300]/10 lg:w-[340px]"><Search className="mr-3 h-4 w-4 text-[var(--color-text-sub)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-[var(--color-text-main)] outline-none" placeholder="제목, 내용, 작성자 검색" /></label>
      </div>

      <section className="overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="hidden grid-cols-[110px_minmax(280px,1fr)_130px_110px_90px] border-b border-[var(--color-border)] bg-[var(--cc-surface-2)] px-5 py-3 text-[11px] font-black text-[var(--color-text-sub)] md:grid"><span>분류</span><span>제목</span><span>작성자</span><span>작성일</span><span className="text-right">조회</span></div>
        {filteredPosts.length ? filteredPosts.map((post) => (
          <button key={post.id} type="button" onClick={() => openPost(post)} className="grid w-full gap-2 border-b border-[var(--color-border)] px-5 py-4 text-left last:border-b-0 hover:bg-[var(--cc-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#eb6300] md:grid-cols-[110px_minmax(280px,1fr)_130px_110px_90px] md:items-center">
            <span className="inline-flex w-fit items-center gap-1.5 bg-[#fff0e6] px-2 py-1 text-[10px] font-black text-[#bd4b00]"><CategoryIcon category={post.category} />{categoryLabel(post.category)}</span>
            <span className="min-w-0"><strong className="flex items-center gap-2 truncate text-sm font-black text-[var(--color-text-main)]">{post.pinned && <Megaphone className="h-3.5 w-3.5 shrink-0 text-[#eb6300]" />}{post.title}{post.attachmentCount > 0 && <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-sub)]" />}</strong><span className="mt-1 block truncate text-xs text-[var(--color-text-sub)] md:hidden">{post.authorName} · {dateText(post.createdAt)} · 조회 {post.views}</span></span>
            <span className="hidden text-xs font-bold text-[var(--color-text-sub)] md:block">{post.authorName}</span>
            <span className="hidden text-xs font-semibold text-[var(--color-text-sub)] md:block">{dateText(post.createdAt)}</span>
            <span className="hidden items-center justify-end gap-1 text-xs font-semibold text-[var(--color-text-sub)] md:flex"><Eye className="h-3.5 w-3.5" />{post.views}</span>
          </button>
        )) : <div className="px-6 py-16 text-center text-sm font-bold text-[var(--color-text-sub)]">검색 조건에 맞는 게시글이 없습니다.</div>}
      </section>

      {selectedPost && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07152f]/70 p-4" role="presentation" onMouseDown={() => setSelectedPost(null)}><article role="dialog" aria-modal="true" aria-labelledby="board-post-title" className="max-h-[88vh] w-full max-w-3xl overflow-y-auto bg-[var(--color-surface)] shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>{selectedPost.image && <div className="relative aspect-[16/6] w-full"><Image src={`${basePath}${selectedPost.image}`} alt="" fill className="object-cover" sizes="768px" /></div>}<div className="p-6 sm:p-8"><div className="flex items-start justify-between gap-4"><div><span className="inline-flex items-center gap-1.5 bg-[#fff0e6] px-2 py-1 text-[10px] font-black text-[#bd4b00]"><CategoryIcon category={selectedPost.category} />{categoryLabel(selectedPost.category)}</span><h2 id="board-post-title" className="mt-4 text-2xl font-black tracking-[0] text-[var(--color-text-main)]">{selectedPost.title}</h2><p className="mt-2 text-xs font-semibold text-[var(--color-text-sub)]">{selectedPost.authorName} · {dateText(selectedPost.createdAt)} · 조회 {selectedPost.views}</p></div><button type="button" onClick={() => setSelectedPost(null)} aria-label="닫기" className="p-2 text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]"><X className="h-5 w-5" /></button></div><div className="mt-7 border-t border-[var(--color-border)] pt-7 text-sm font-medium leading-8 text-[var(--color-text-main)] whitespace-pre-wrap">{selectedPost.content}</div>{selectedPost.attachmentCount > 0 && <div className="mt-8 flex items-center gap-2 border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-4 py-3 text-xs font-bold text-[var(--color-text-sub)]"><Paperclip className="h-4 w-4" />첨부파일 {selectedPost.attachmentCount}개</div>}</div></article></div>}

      {composing && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07152f]/70 p-4" role="presentation" onMouseDown={() => setComposing(false)}><form onSubmit={submitPost} role="dialog" aria-modal="true" aria-labelledby="board-compose-title" className="w-full max-w-2xl bg-[var(--color-surface)] p-6 shadow-2xl sm:p-8" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center bg-[#fff0e6] text-[#eb6300]"><PenLine className="h-5 w-5" /></span><h2 id="board-compose-title" className="text-xl font-black text-[var(--color-text-main)]">게시글 작성</h2></div><button type="button" onClick={() => setComposing(false)} aria-label="닫기" className="p-2 text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]"><X className="h-5 w-5" /></button></div><div className="mt-7 space-y-5"><label className="block"><span className="mb-2 block text-xs font-black text-[var(--color-text-main)]">게시판</span><select value={draftCategory} onChange={(event) => setDraftCategory(event.target.value as BoardCategory)} className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[#eb6300]">{boardCategories.filter((item): item is { id: BoardCategory; label: string; group: string } => item.id !== 'ALL').map((category) => <option key={category.id} value={category.id}>{category.group} · {category.label}</option>)}</select></label><label className="block"><span className="mb-2 block text-xs font-black text-[var(--color-text-main)]">제목</span><input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-[#eb6300]" required /></label><label className="block"><span className="mb-2 block text-xs font-black text-[var(--color-text-main)]">내용</span><textarea value={draftContent} onChange={(event) => setDraftContent(event.target.value)} rows={8} className="w-full resize-y border border-[var(--color-border)] bg-[var(--cc-surface-2)] px-3 py-3 text-sm font-medium leading-6 text-[var(--color-text-main)] outline-none focus:border-[#eb6300]" required /></label></div><div className="mt-7 flex justify-end gap-2"><button type="button" onClick={() => setComposing(false)} className="min-h-10 border border-[var(--color-border)] px-4 text-xs font-black text-[var(--color-text-sub)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]">취소</button><button type="submit" className="min-h-10 bg-[#eb6300] px-5 text-xs font-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb6300]">등록</button></div></form></div>}
    </div>
  );
}
