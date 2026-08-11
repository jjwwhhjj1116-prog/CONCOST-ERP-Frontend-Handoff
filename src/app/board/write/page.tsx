import { Suspense } from 'react';
import { BoardPostEditor } from '@/features/board/BoardPostEditor';

export default function BoardWritePage() {
  return <Suspense fallback={<div className="p-6 text-sm font-bold text-[var(--color-text-sub)]">Loading editor...</div>}><BoardPostEditor mode="CREATE" /></Suspense>;
}
