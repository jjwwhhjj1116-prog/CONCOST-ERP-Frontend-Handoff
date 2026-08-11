import { Suspense } from 'react';
import { BoardHome } from '@/features/board/BoardHome';

export default function BoardPage() {
  return <Suspense fallback={<div className="p-6 text-sm font-bold text-[var(--color-text-sub)]">Loading board...</div>}><BoardHome /></Suspense>;
}
