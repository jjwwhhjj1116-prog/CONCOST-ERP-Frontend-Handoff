'use client';

import Link from 'next/link';
import { ArrowUpRight, FileCheck2, FolderLock, Link2, Scale } from 'lucide-react';

import { CLAIM_FOLDER_CATALOG } from '@/lib/claimOperations';
import { useClaimOperationsStore } from '@/store/claimOperationsStore';
import type { FrontendLocale } from '@/lib/frontendDataSource';

export function ClaimDriveContextPanel({ projectId, claimId, locale }: { projectId: string; claimId: string; locale: FrontendLocale }) {
  const record = useClaimOperationsStore((state) => state.records.find((item) => item.projectId === projectId && item.claimId === claimId));
  const text = (ko: string, vi: string, en: string) => locale === 'vi' ? vi : locale === 'en' ? en : ko;

  return (
    <section className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 shadow-sm sm:p-5" data-claim-drive-context>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black tracking-[.15em] text-teal-800"><FolderLock className="h-4 w-4" />CLAIM DRIVE CONTEXT</p>
          <h2 className="mt-2 text-lg font-black">{text('클레임 폴더 분류', 'Phân loại thư mục Claim', 'Claim folder taxonomy')}</h2>
          <p className="mt-1 break-all font-mono text-[10px] text-[var(--color-text-sub)]">projectId: {projectId} · claimId: {claimId}</p>
        </div>
        <Link href={`/projects?group=CLAIM&workflow=${encodeURIComponent(projectId)}&claimId=${encodeURIComponent(claimId)}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-700 bg-white px-3 text-xs font-black text-teal-800 hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-700">{text('클레임 프로젝트 열기', 'Mở dự án Claim', 'Open Claim project')}<ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        {CLAIM_FOLDER_CATALOG.map((folder) => <div key={folder.code} className="rounded-xl border border-white bg-white p-3"><span className="text-[10px] font-black text-orange-700">{folder.code}</span><strong className="mt-1 block text-xs">{locale === 'vi' ? folder.vi : locale === 'en' ? folder.en : folder.ko}</strong></div>)}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white bg-white p-3"><FileCheck2 className="h-4 w-4 text-emerald-700" /><span className="mt-2 block text-[10px] font-black text-[var(--color-text-sub)]">READY EVIDENCE</span><strong className="mt-1 block text-lg">{record?.evidences.filter((item) => item.state === 'READY').length ?? 0}</strong></div>
        <div className="rounded-xl border border-white bg-white p-3"><Scale className="h-4 w-4 text-rose-700" /><span className="mt-2 block text-[10px] font-black text-[var(--color-text-sub)]">LINKED ISSUES</span><strong className="mt-1 block text-lg">{record?.issues.length ?? 0}</strong></div>
        <div className="rounded-xl border border-white bg-white p-3"><Link2 className="h-4 w-4 text-blue-700" /><span className="mt-2 block text-[10px] font-black text-[var(--color-text-sub)]">CANONICAL BINDING</span><strong className="mt-1 block text-xs text-teal-800">PROJECT + CLAIM</strong></div>
      </div>
    </section>
  );
}
