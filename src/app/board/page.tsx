import { Suspense } from 'react';
import { BoardWorkspace } from '@/features/board/BoardWorkspace';

export default function BoardPage() {
  return <Suspense fallback={<div className="p-6 text-sm font-bold text-[var(--color-text-sub)]">게시판을 불러오는 중입니다.</div>}><BoardWorkspace /></Suspense>;
}
