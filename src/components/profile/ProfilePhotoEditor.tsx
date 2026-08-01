'use client';

import Image from 'next/image';
import {
  Aperture,
  Camera,
  Check,
  ImagePlus,
  RotateCw,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import React from 'react';

import {
  createProfilePhotoDraft,
  isAcceptedProfilePhotoFile,
  profilePhotoBackgroundColor,
  type ProfilePhotoDraft,
  type ProfilePhotoTransform,
} from '@/lib/profilePhoto';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useAuthStore } from '@/store/authStore';
import { useProfilePhotoStore } from '@/store/profilePhotoStore';

const backgroundOptions: Array<{
  value: ProfilePhotoTransform['background'];
  label: string;
  color: string;
}> = [
  { value: 'WHITE', label: 'White', color: '#ffffff' },
  { value: 'LIGHT_GRAY', label: 'Gray', color: '#eef1f5' },
  { value: 'PALE_BLUE', label: 'Blue', color: '#eaf3fb' },
];

function PhotoPreview({
  source,
  transform,
  label,
  original = false,
}: {
  source: string;
  transform: ProfilePhotoTransform;
  label: string;
  original?: boolean;
}) {
  const applied = original
    ? { zoom: 1, rotation: 0, brightness: 100, alignX: 50, alignY: 50 }
    : transform;

  return (
    <figure className="min-w-0">
      <figcaption className="mb-2 flex items-center justify-between gap-2 text-xs font-black text-[var(--color-text-main)]">
        {label}
        <span className="text-[9px] font-bold text-[var(--color-text-sub)]">
          {original ? 'ORIGINAL · PRESERVED' : 'REVIEW CANDIDATE'}
        </span>
      </figcaption>
      <div
        className="relative aspect-[3/4] max-h-[430px] w-full overflow-hidden border border-[var(--color-border)]"
        style={{ background: profilePhotoBackgroundColor(transform.background) }}
      >
        <Image
          unoptimized
          fill
          src={source}
          alt={label}
          className="object-cover"
          style={{
            objectPosition: `${applied.alignX}% ${applied.alignY}%`,
            filter: `brightness(${applied.brightness}%)`,
            transform: `scale(${applied.zoom}) rotate(${applied.rotation}deg)`,
          }}
        />
        {!original && (
          <div className="pointer-events-none absolute inset-[10%] border border-dashed border-white/90 shadow-[0_0_0_999px_rgba(3,17,40,.18)]" />
        )}
      </div>
    </figure>
  );
}

export function ProfilePhotoEditor() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const applyPreview = useProfilePhotoStore((state) => state.applyPreview);
  const [draft, setDraft] = React.useState<ProfilePhotoDraft | null>(null);
  const [message, setMessage] = React.useState(
    '원본은 보존되며, 사용자 승인 전에는 프로필에 적용되지 않습니다.',
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const mode = getRuntimeExecutionMode();
  const aiProviderReady = process.env.NEXT_PUBLIC_PROFILE_PHOTO_AI_PROVIDER_READY === 'true';

  if (!currentUser) return null;

  const updateTransform = (updates: Partial<ProfilePhotoTransform>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            state: 'EDITING',
            transform: { ...current.transform, ...updates },
          }
        : current,
    );
  };

  const readFile = (file?: File) => {
    if (!file || !isAcceptedProfilePhotoFile(file)) {
      setMessage('JPG, PNG, WEBP 형식의 10MB 이하 사진만 사용할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setDraft(createProfilePhotoDraft(currentUser.id, reader.result));
      setMessage('원본을 보존했습니다. 편집본을 검토한 뒤 직접 적용해 주세요.');
    };
    reader.readAsDataURL(file);
  };

  const requestAiCandidate = () => {
    if (!draft) return;
    if (mode !== 'DEMO_LOCAL' && !aiProviderReady) {
      setMessage('AI Provider가 연결되지 않아 작업을 시작할 수 없습니다.');
      return;
    }

    setDraft({
      ...draft,
      state: 'AI_REVIEW_REQUIRED',
      transform: {
        ...draft.transform,
        zoom: Math.max(1.06, draft.transform.zoom),
        brightness: Math.max(104, draft.transform.brightness),
        background: 'WHITE',
      },
    });
    setMessage(
      mode === 'DEMO_LOCAL'
        ? 'DEMO_LOCAL 후보 미리보기입니다. 실제 AI 작업이나 서버 저장은 수행되지 않았습니다.'
        : 'AI 후보가 도착했습니다. 얼굴 정체성을 확인한 뒤 승인해 주세요.',
    );
  };

  const approve = () => {
    if (!draft) return;
    if (mode !== 'DEMO_LOCAL') {
      setMessage('Backend 저장 Capability가 연결된 뒤 적용할 수 있습니다.');
      return;
    }
    applyPreview(currentUser.id, draft.previewDataUrl);
    setDraft({ ...draft, state: 'APPROVED' });
    setMessage('브라우저 메모리의 DEMO 미리보기에만 적용했습니다. 서버에는 저장되지 않았습니다.');
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="border-l-4 border-[#ff6b00] pl-4">
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e95f00]">
          Profile Identity Studio
        </span>
        <h1 className="mt-1 text-2xl font-black text-[var(--color-text-main)]">
          프로필 사진 편집
        </h1>
        <p className="mt-1 text-sm font-semibold text-[var(--color-text-sub)]">
          촬영부터 증명사진 후보 검수까지 한 화면에서 진행합니다.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex min-h-24 items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#ff8a3d] focus-visible:ring-4 focus-visible:ring-orange-200"
        >
          <span className="grid h-11 w-11 place-items-center bg-orange-50 text-[#e95f00]">
            <Upload className="h-5 w-5" />
          </span>
          <span><strong className="block text-sm">사진 업로드</strong><small>JPG · PNG · WEBP / 최대 10MB</small></span>
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex min-h-24 items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#4e6fd8] focus-visible:ring-4 focus-visible:ring-blue-200"
        >
          <span className="grid h-11 w-11 place-items-center bg-blue-50 text-[#405bb0]">
            <Camera className="h-5 w-5" />
          </span>
          <span><strong className="block text-sm">카메라 촬영</strong><small>모바일 전면 카메라 지원</small></span>
        </button>
        <button
          type="button"
          disabled={!draft}
          onClick={requestAiCandidate}
          className="flex min-h-24 items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#7c3aed] focus-visible:ring-4 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="grid h-11 w-11 place-items-center bg-violet-50 text-violet-700">
            <Sparkles className="h-5 w-5" />
          </span>
          <span><strong className="block text-sm">증명사진 AI 후보</strong><small>정체성 유지 · 검수 후 적용</small></span>
        </button>
        <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => readFile(event.target.files?.[0])} />
        <input ref={cameraRef} hidden type="file" accept="image/*" capture="user" onChange={(event) => readFile(event.target.files?.[0])} />
      </section>

      <div role="status" className="flex items-start gap-3 border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold leading-5 text-blue-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{message}</span>
      </div>

      {!draft ? (
        <section className="grid min-h-[420px] place-items-center border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-center">
          <div>
            <ImagePlus className="mx-auto h-10 w-10 text-[var(--color-text-sub)]" />
            <strong className="mt-4 block text-base text-[var(--color-text-main)]">편집할 사진을 선택하세요</strong>
            <span className="mt-1 block text-xs text-[var(--color-text-sub)]">원본은 편집본과 별도 버전으로 유지됩니다.</span>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--cc-shadow-1)] md:grid-cols-2">
            <PhotoPreview source={draft.originalDataUrl} transform={draft.transform} label="Before" original />
            <PhotoPreview source={draft.previewDataUrl} transform={draft.transform} label="After" />
          </div>

          <aside className="space-y-5 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)]">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#405bb0]">Editor</span>
              <h2 className="mt-1 text-lg font-black">구도와 밝기</h2>
            </div>
            {[
              ['Zoom', 'zoom', draft.transform.zoom, 1, 1.8, 0.01],
              ['Brightness', 'brightness', draft.transform.brightness, 70, 140, 1],
              ['Horizontal', 'alignX', draft.transform.alignX, 0, 100, 1],
              ['Vertical', 'alignY', draft.transform.alignY, 0, 100, 1],
            ].map(([label, key, value, min, max, step]) => (
              <label key={String(key)} className="block text-xs font-black">
                <span className="mb-2 flex justify-between"><span>{label}</span><span>{String(value)}</span></span>
                <input
                  className="w-full accent-[#ff6b00]"
                  type="range"
                  min={Number(min)}
                  max={Number(max)}
                  step={Number(step)}
                  value={Number(value)}
                  onChange={(event) => updateTransform({ [String(key)]: Number(event.target.value) })}
                />
              </label>
            ))}

            <div>
              <span className="mb-2 block text-xs font-black">배경</span>
              <div className="grid grid-cols-3 gap-2">
                {backgroundOptions.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    title={option.label}
                    aria-pressed={draft.transform.background === option.value}
                    onClick={() => updateTransform({ background: option.value })}
                    className="h-10 border border-[var(--color-border)] focus-visible:ring-4 focus-visible:ring-orange-200"
                    style={{
                      background: option.color,
                      outline: draft.transform.background === option.value ? '2px solid #ff6b00' : undefined,
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateTransform({ rotation: (draft.transform.rotation + 90) % 360 })}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-[var(--color-border)] font-black hover:bg-[var(--cc-surface-2)]"
            >
              <RotateCw className="h-4 w-4" />
              90° 회전
            </button>

            <div className="border-t border-[var(--color-border)] pt-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[var(--color-text-sub)]">
                <ScanFace className="h-4 w-4 text-emerald-600" />
                얼굴 정체성 변경 금지 · 원본 보존
              </div>
              <button
                type="button"
                onClick={approve}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-[#172554] px-4 text-sm font-black text-white hover:bg-[#243b7a]"
              >
                <Check className="h-4 w-4" />
                검수 완료 후 적용
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-[10px] font-bold text-[var(--color-text-sub)]">
              <span className="inline-flex items-center gap-1"><Aperture className="h-3.5 w-3.5" /> {draft.state}</span>
              <span>{draft.id.slice(-8)}</span>
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
