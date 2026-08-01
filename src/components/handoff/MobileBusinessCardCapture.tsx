'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  ImagePlus,
  Inbox,
  LockKeyhole,
  Share2,
  ShieldCheck,
} from 'lucide-react';

import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { getFrontendModuleBoundary } from '@/lib/frontendDataSource';
import { useBusinessCardMobileStore } from '@/store/businessCardMobileStore';

const copy = {
  ko: {
    title: '모바일 명함 촬영',
    description: '1회용 회사 세션으로 촬영하고 데스크톱 검수함에 전달합니다.',
    choose: '명함 촬영 또는 이미지 선택',
    privacy: '원본 이미지는 이 Demo 화면의 메모리에만 있으며 브라우저 저장소에 영구 보관하지 않습니다.',
    received: '수신함 Metadata가 준비되었습니다. OCR 검수 화면에서 계속 진행하세요.',
    inbox: '명함 수신함',
    review: 'OCR 검수로 이동',
    share: 'PWA Share Target',
    sharePending: '선택 기능 · Backend Session과 설치형 PWA 설정이 필요합니다.',
  },
  vi: {
    title: 'Chụp danh thiếp trên điện thoại',
    description: 'Chụp bằng phiên dùng một lần của công ty và chuyển tới hộp kiểm tra.',
    choose: 'Chụp hoặc chọn ảnh danh thiếp',
    privacy: 'Ảnh gốc chỉ nằm trong bộ nhớ Demo và không được lưu lâu dài trong trình duyệt.',
    received: 'Metadata đã vào hộp thư. Tiếp tục tại màn hình kiểm tra OCR.',
    inbox: 'Hộp thư danh thiếp',
    review: 'Mở kiểm tra OCR',
    share: 'PWA Share Target',
    sharePending: 'Tùy chọn · cần Backend Session và cấu hình PWA.',
  },
  en: {
    title: 'Mobile business-card capture',
    description: 'Capture through a one-time company session and send it to the review inbox.',
    choose: 'Take a photo or choose a card image',
    privacy: 'The original image stays in Demo memory only and is never persisted in browser storage.',
    received: 'Inbox metadata is ready. Continue in the OCR review workspace.',
    inbox: 'Business-card inbox',
    review: 'Open OCR review',
    share: 'PWA Share Target',
    sharePending: 'Optional · requires a Backend session and installed PWA configuration.',
  },
};

export function MobileBusinessCardCapture() {
  const { brandWorkspace, locale } = useHandoffLocale();
  const t = copy[locale];
  const createSession = useBusinessCardMobileStore((state) => state.createSession);
  const receiveFile = useBusinessCardMobileStore((state) => state.receiveFile);
  const [preview, setPreview] = React.useState('');
  const [received, setReceived] = React.useState(false);
  const boundary = getFrontendModuleBoundary('BUSINESS_CARD', {
    locale,
    adapterReady: false,
    providerRequired: true,
    providerState: 'NOT_CONFIGURED',
  });

  React.useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const select = (file: File) => {
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 10 * 1024 * 1024) {
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    const session = createSession(brandWorkspace);
    receiveFile(session, file);
    setReceived(true);
  };

  return (
    <main className="mx-auto max-w-3xl space-y-5 pb-20">
      <header className="border-b border-[var(--color-border)] pb-5">
        <Link href="/sales/business-cards" className="inline-flex items-center gap-2 text-xs font-black text-[var(--color-text-sub)]">
          <ArrowLeft className="h-4 w-4" />
          OCR Workspace
        </Link>
        <p className="mt-5 text-[10px] font-black tracking-[.18em] text-emerald-700">ONE-TIME MOBILE SESSION</p>
        <h1 className="mt-2 text-3xl font-black text-[var(--color-text-main)]">{t.title}</h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-text-sub)]">{t.description}</p>
      </header>

      <RuntimeCapabilityPanel boundary={boundary} compact />

      <label className="flex min-h-[420px] cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-emerald-300 bg-emerald-50/50 text-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="촬영한 명함 미리보기" className="h-[420px] w-full object-contain p-4" />
        ) : (
          <span className="p-7">
            <span className="mx-auto flex h-20 w-20 items-center justify-center bg-white text-emerald-700 shadow-md">
              <Camera className="h-10 w-10" />
            </span>
            <strong className="mt-5 block text-base font-black text-slate-900">{t.choose}</strong>
            <span className="mt-2 block text-xs font-semibold text-slate-600">JPG / PNG · 10MB</span>
          </span>
        )}
        <input
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) select(file);
            event.currentTarget.value = '';
          }}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="border border-blue-200 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-950">
          <ShieldCheck className="mb-2 h-5 w-5 text-blue-700" />
          {t.privacy}
        </div>
        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <strong className="flex items-center gap-2 text-xs text-[var(--color-text-main)]"><Share2 className="h-4 w-4" />{t.share}</strong>
          <p className="mt-2 text-[11px] font-semibold leading-5 text-[var(--color-text-sub)]">{t.sharePending}</p>
        </div>
      </div>

      {received && (
        <div role="status" className="border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
          <CheckCircle2 className="mr-2 inline h-5 w-5" />
          {t.received}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/sales/business-cards/inbox" className="flex min-h-12 items-center justify-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-black text-[var(--color-text-main)]">
          <Inbox className="h-4 w-4" />
          {t.inbox}
        </Link>
        <Link href="/sales/business-cards" className="flex min-h-12 items-center justify-center gap-2 bg-[#172554] text-xs font-black text-white">
          <ImagePlus className="h-4 w-4" />
          {t.review}
        </Link>
      </div>

      <p className="flex items-center gap-2 text-[10px] font-bold text-[var(--color-text-sub)]">
        <LockKeyhole className="h-3.5 w-3.5" />
        익명 영구 Upload URL을 생성하지 않습니다.
      </p>
    </main>
  );
}
