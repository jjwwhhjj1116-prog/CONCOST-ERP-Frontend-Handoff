import { Suspense } from 'react';
import { BoardPostDetail } from '@/features/board/BoardPostDetail';

export default function BoardPostPage() {
  return <Suspense fallback={<div className="p-6 text-sm font-bold text-[var(--color-text-sub)]">Loading post...</div>}><BoardPostDetail /></Suspense>;
}
