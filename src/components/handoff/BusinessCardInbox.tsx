'use client';

import Link from 'next/link';
import { ArrowRight, Inbox, ScanLine, ShieldCheck, Smartphone } from 'lucide-react';

import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { useBusinessCardMobileStore } from '@/store/businessCardMobileStore';

const copy = {
  ko: {
    title: '명함 수신함',
    description: '모바일 1회용 세션에서 수신된 파일 Metadata를 회사 범위로 검토합니다.',
    capture: '모바일 촬영',
    empty: '현재 회사에 수신된 명함이 없습니다.',
    review: 'OCR 검수 열기',
    warning: '이미지 Binary와 OCR 결과는 Backend File Reference가 연결되기 전까지 운영 저장되지 않습니다.',
  },
  vi: {
    title: 'Hộp thư danh thiếp',
    description: 'Rà soát metadata nhận từ phiên điện thoại dùng một lần theo công ty.',
    capture: 'Chụp trên điện thoại',
    empty: 'Không có danh thiếp cho công ty hiện tại.',
    review: 'Mở kiểm tra OCR',
    warning: 'Ảnh và kết quả OCR chưa được lưu vận hành trước khi có Backend File Reference.',
  },
  en: {
    title: 'Business-card inbox',
    description: 'Review file metadata received from one-time mobile sessions within company scope.',
    capture: 'Mobile capture',
    empty: 'No business cards were received for the current company.',
    review: 'Open OCR review',
    warning: 'Image binary and OCR results are not operationally persisted until Backend File References are connected.',
  },
};

export function BusinessCardInbox() {
  const { brandWorkspace, locale } = useHandoffLocale();
  const t = copy[locale];
  const inboxItems = useBusinessCardMobileStore((state) => state.inbox);
  const inbox = inboxItems.filter((item) => item.companyId === brandWorkspace);

  return (
    <main className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[.18em] text-emerald-700">MOBILE INBOX</p>
          <h1 className="mt-2 text-3xl font-black text-[var(--color-text-main)]">{t.title}</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--color-text-sub)]">{t.description}</p>
        </div>
        <Link href="/mobile/business-cards/capture" className="inline-flex min-h-11 items-center justify-center gap-2 bg-emerald-700 px-4 text-xs font-black text-white">
          <Smartphone className="h-4 w-4" />
          {t.capture}
        </Link>
      </header>

      <div className="border border-blue-200 bg-blue-50 p-4 text-xs font-bold leading-5 text-blue-950">
        <ShieldCheck className="mr-2 inline h-4 w-4 text-blue-700" />
        {t.warning}
      </div>

      {!inbox.length ? (
        <section className="grid min-h-72 place-items-center border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="text-center">
            <Inbox className="mx-auto h-10 w-10 text-[var(--color-text-sub)]" />
            <p className="mt-3 text-sm font-bold text-[var(--color-text-sub)]">{t.empty}</p>
          </div>
        </section>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          {inbox.map((item) => (
            <li key={item.id} className="grid gap-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
              <span className="flex h-11 w-11 items-center justify-center bg-emerald-50 text-emerald-700">
                <ScanLine className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm text-[var(--color-text-main)]">{item.fileName}</strong>
                <span className="mt-1 block text-[10px] font-semibold text-[var(--color-text-sub)]">
                  {Math.max(1, Math.round(item.fileSize / 1024))} KB · {item.state} · {item.receivedAt}
                </span>
              </span>
              <Link href="/sales/business-cards" className="inline-flex min-h-10 items-center justify-center gap-2 border border-[var(--color-border)] px-3 text-xs font-black text-[var(--color-text-main)]">
                {t.review}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
