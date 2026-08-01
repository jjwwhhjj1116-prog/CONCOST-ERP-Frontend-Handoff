'use client';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ContactRound,
  FileImage,
  LoaderCircle,
  Merge,
  Inbox,
  QrCode,
  RefreshCcw,
  ScanLine,
  ShieldCheck,
  Smartphone,
  Upload,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
  type FrontendLocale,
} from '@/lib/frontendDataSource';
import {
  analyzeBusinessCard,
  type BusinessCardFields,
} from '@/lib/businessCardOcr';
import { useContactStore } from '@/store/contactStore';
import { useBusinessCardMobileStore } from '@/store/businessCardMobileStore';

type ReviewState =
  | 'EMPTY'
  | 'OCR_PENDING'
  | 'REVIEW_REQUIRED'
  | 'BLOCKED'
  | 'REQUEST_READY';

const emptyContact: BusinessCardFields = {
  name: '',
  company: '',
  department: '',
  position: '',
  mobile: '',
  telephone: '',
  fax: '',
  email: '',
  homepage: '',
  address: '',
};

const fields: Array<{ key: keyof BusinessCardFields; span?: boolean }> = [
  { key: 'name' },
  { key: 'company' },
  { key: 'department' },
  { key: 'position' },
  { key: 'mobile' },
  { key: 'telephone' },
  { key: 'fax' },
  { key: 'email' },
  { key: 'homepage' },
  { key: 'address', span: true },
];

const copy = {
  ko: {
    eyebrow: 'CONTACT INTAKE',
    title: '명함 자동등록',
    description:
      '명함 이미지를 OCR 작업으로 보내고, 사람이 결과와 중복 후보를 검토한 뒤 연락처 생성 또는 병합을 요청합니다.',
    capture: '1. 명함 캡처',
    captureHelp: 'JPG 또는 PNG, 최대 10MB',
    choose: '이미지 선택',
    replace: '다른 이미지 선택',
    reset: '초기화',
    review: '2. OCR 결과 검수',
    duplicate: '3. 중복 후보',
    complete: '4. 등록 요청',
    demoNotice:
      'Demo에서는 OCR 결과와 등록 요청을 시뮬레이션하며 서버 연락처를 생성하지 않습니다.',
    providerNotice:
      'OCR 이미지는 민감정보입니다. Backend의 승인된 OCR Provider와 File Reference를 통해서만 전송해야 합니다.',
    manualDemo:
      'Demo 모드입니다. OCR 대신 검수 양식을 열었습니다. 내용을 직접 입력해 흐름을 확인하세요.',
    providerBlocked:
      'OCR Provider 또는 Backend Adapter가 준비되지 않아 이미지를 전송하지 않았습니다.',
    ocrWorking: 'OCR 작업을 요청하고 있습니다.',
    ocrDone: 'OCR 결과가 도착했습니다. 모든 필드를 사람이 확인해야 합니다.',
    noDuplicate: '일치하는 이메일 또는 휴대전화가 없습니다.',
    duplicateFound: '검토가 필요한 중복 후보가 있습니다.',
    create: '새 연락처 생성 요청',
    merge: '중복 연락처 병합 요청',
    google: '승인 후 Google Contacts로 단방향 동기화 요청',
    googleHelp:
      'Opt-in 요청만 기록합니다. Google에서 ERP로 자동 덮어쓰지 않습니다.',
    requestReady:
      '요청이 준비되었습니다. Demo에서는 서버에 저장되지 않았습니다.',
    required: '이름 또는 회사 중 하나를 입력하세요.',
    imageError: 'JPG 또는 PNG 형식의 10MB 이하 이미지만 사용할 수 있습니다.',
    contacts: '현재 Demo 연락처',
    localOnly: '브라우저 데모 데이터이며 운영 연락처가 아닙니다.',
    confidence: 'OCR 신뢰도',
    status: '작업 상태',
    currentCompany: '선택 회사',
    mobileCapture: '모바일 촬영',
    inbox: '명함 수신함',
    qrSession: '1회용 QR Upload Session',
    createQrSession: 'Demo 세션 만들기',
    qrPending: 'Backend가 연결되기 전에는 스캔 가능한 영구 URL을 만들지 않습니다.',
    field: {
      name: '이름',
      company: '회사',
      department: '부서',
      position: '직급',
      mobile: '휴대전화',
      telephone: '대표·사무실 전화',
      fax: '팩스',
      email: '이메일',
      homepage: '홈페이지',
      address: '주소',
    },
  },
  vi: {
    eyebrow: 'TIẾP NHẬN LIÊN HỆ',
    title: 'Đăng ký danh thiếp',
    description:
      'Gửi ảnh tới tác vụ OCR, kiểm tra kết quả và bản ghi trùng trước khi yêu cầu tạo hoặc hợp nhất liên hệ.',
    capture: '1. Chụp danh thiếp',
    captureHelp: 'JPG hoặc PNG, tối đa 10MB',
    choose: 'Chọn ảnh',
    replace: 'Chọn ảnh khác',
    reset: 'Đặt lại',
    review: '2. Kiểm tra OCR',
    duplicate: '3. Ứng viên trùng',
    complete: '4. Yêu cầu đăng ký',
    demoNotice:
      'Chế độ demo chỉ mô phỏng OCR và yêu cầu, không tạo liên hệ trên máy chủ.',
    providerNotice:
      'Ảnh danh thiếp là dữ liệu nhạy cảm và chỉ được gửi qua Provider OCR đã phê duyệt.',
    manualDemo:
      'Đang ở chế độ demo. Biểu mẫu kiểm tra được mở để nhập dữ liệu thủ công.',
    providerBlocked:
      'Chưa có OCR Provider hoặc Backend Adapter nên ảnh chưa được gửi.',
    ocrWorking: 'Đang yêu cầu tác vụ OCR.',
    ocrDone: 'Đã nhận kết quả OCR. Người dùng phải kiểm tra mọi trường.',
    noDuplicate: 'Không tìm thấy email hoặc số điện thoại trùng.',
    duplicateFound: 'Có liên hệ trùng cần kiểm tra.',
    create: 'Yêu cầu tạo liên hệ',
    merge: 'Yêu cầu hợp nhất liên hệ',
    google: 'Yêu cầu đồng bộ một chiều sang Google sau phê duyệt',
    googleHelp: 'Chỉ ghi nhận opt-in; Google không tự động ghi đè ERP.',
    requestReady: 'Yêu cầu đã sẵn sàng. Demo không lưu lên máy chủ.',
    required: 'Nhập tên hoặc công ty.',
    imageError: 'Chỉ dùng ảnh JPG hoặc PNG dưới 10MB.',
    contacts: 'Liên hệ demo hiện có',
    localOnly: 'Dữ liệu demo trong trình duyệt, không phải dữ liệu vận hành.',
    confidence: 'Độ tin cậy OCR',
    status: 'Trạng thái',
    currentCompany: 'Công ty',
    mobileCapture: 'Chụp trên điện thoại',
    inbox: 'Hộp thư danh thiếp',
    qrSession: 'Phiên tải QR dùng một lần',
    createQrSession: 'Tạo phiên Demo',
    qrPending: 'Không tạo URL quét vĩnh viễn trước khi Backend được kết nối.',
    field: {
      name: 'Họ tên',
      company: 'Công ty',
      department: 'Phòng ban',
      position: 'Chức vụ',
      mobile: 'Di động',
      telephone: 'Điện thoại',
      fax: 'Fax',
      email: 'Email',
      homepage: 'Trang web',
      address: 'Địa chỉ',
    },
  },
  en: {
    eyebrow: 'CONTACT INTAKE',
    title: 'Business card registration',
    description:
      'Send an image to an OCR job, review the result and duplicates, then request contact creation or merge.',
    capture: '1. Capture card',
    captureHelp: 'JPG or PNG, up to 10MB',
    choose: 'Choose image',
    replace: 'Choose another image',
    reset: 'Reset',
    review: '2. Review OCR',
    duplicate: '3. Duplicate candidates',
    complete: '4. Registration request',
    demoNotice:
      'Demo mode simulates OCR and registration without creating a server contact.',
    providerNotice:
      'Business card images contain personal data and must use an approved Backend OCR Provider and File Reference.',
    manualDemo:
      'Demo mode opened the review form for manual input instead of sending the image.',
    providerBlocked:
      'The image was not sent because the OCR Provider or Backend Adapter is unavailable.',
    ocrWorking: 'Requesting the OCR job.',
    ocrDone: 'OCR returned. A person must review every field.',
    noDuplicate: 'No matching email or mobile number was found.',
    duplicateFound: 'A possible duplicate requires review.',
    create: 'Request new contact',
    merge: 'Request contact merge',
    google: 'Request one-way Google Contacts sync after approval',
    googleHelp: 'This records opt-in only; Google never overwrites ERP automatically.',
    requestReady: 'The request is ready. Demo mode did not save it to a server.',
    required: 'Enter a name or company.',
    imageError: 'Use a JPG or PNG image no larger than 10MB.',
    contacts: 'Current demo contacts',
    localOnly: 'Browser demo data, not operational contacts.',
    confidence: 'OCR confidence',
    status: 'Job status',
    currentCompany: 'Company',
    mobileCapture: 'Mobile capture',
    inbox: 'Business-card inbox',
    qrSession: 'One-time QR upload session',
    createQrSession: 'Create Demo session',
    qrPending: 'No scannable permanent URL is created before the Backend is connected.',
    field: {
      name: 'Name',
      company: 'Company',
      department: 'Department',
      position: 'Position',
      mobile: 'Mobile',
      telephone: 'Telephone',
      fax: 'Fax',
      email: 'Email',
      homepage: 'Website',
      address: 'Address',
    },
  },
} satisfies Record<FrontendLocale, Record<string, unknown>>;

const stateTone: Record<ReviewState, string> = {
  EMPTY: 'border-slate-200 bg-slate-50 text-slate-600',
  OCR_PENDING: 'border-blue-200 bg-blue-50 text-blue-700',
  REVIEW_REQUIRED: 'border-amber-200 bg-amber-50 text-amber-700',
  BLOCKED: 'border-red-200 bg-red-50 text-red-700',
  REQUEST_READY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

export function BusinessCardWorkspace() {
  const { brandWorkspace, locale, setLocale } = useHandoffLocale();
  const t = copy[locale];
  const contacts = useContactStore((state) => state.contacts);
  const [draft, setDraft] = useState<BusinessCardFields>(emptyContact);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [reviewState, setReviewState] = useState<ReviewState>('EMPTY');
  const [message, setMessage] = useState('');
  const [googleOptIn, setGoogleOptIn] = useState(false);
  const createMobileSession = useBusinessCardMobileStore((state) => state.createSession);
  const allMobileSessions = useBusinessCardMobileStore((state) => state.sessions);
  const mobileSessions = useMemo(
    () => allMobileSessions.filter((session) => session.companyId === brandWorkspace),
    [allMobileSessions, brandWorkspace],
  );
  const activeMobileSession = mobileSessions[0];

  const providerReady =
    process.env.NEXT_PUBLIC_BUSINESS_CARD_OCR_PROVIDER_READY === 'true' ||
    Boolean(process.env.NEXT_PUBLIC_BUSINESS_CARD_OCR_ENDPOINT);
  const adapterReady =
    process.env.NEXT_PUBLIC_BUSINESS_CARD_ADAPTER_READY === 'true';
  const googleReady =
    process.env.NEXT_PUBLIC_GOOGLE_CONTACTS_PROVIDER_READY === 'true';
  const boundary = getFrontendModuleBoundary('BUSINESS_CARD', {
    locale,
    adapterReady,
    providerRequired: true,
    providerState: providerReady ? 'READY' : 'NOT_CONFIGURED',
  });

  const duplicate = useMemo(() => {
    const email = draft.email.trim().toLowerCase();
    const mobile = draft.mobile.replace(/\D/g, '');
    return contacts.find(
      (contact) =>
        (email && contact.email.toLowerCase() === email) ||
        (mobile && contact.mobile.replace(/\D/g, '') === mobile),
    );
  }, [contacts, draft.email, draft.mobile]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setDraft(emptyContact);
    setFile(null);
    setPreview('');
    setConfidence(0);
    setReviewState('EMPTY');
    setMessage('');
    setGoogleOptIn(false);
  };

  const selectImage = async (image: File) => {
    if (
      !['image/jpeg', 'image/png'].includes(image.type) ||
      image.size > 10 * 1024 * 1024
    ) {
      setReviewState('BLOCKED');
      setMessage(t.imageError);
      return;
    }

    if (preview) URL.revokeObjectURL(preview);
    setFile(image);
    setPreview(URL.createObjectURL(image));
    setDraft(emptyContact);
    setConfidence(0);

    if (boundary.isSimulation) {
      setReviewState('REVIEW_REQUIRED');
      setMessage(t.manualDemo);
      return;
    }
    if (!boundary.canMutate) {
      setReviewState('BLOCKED');
      setMessage(t.providerBlocked);
      return;
    }

    setReviewState('OCR_PENDING');
    setMessage(t.ocrWorking);
    try {
      const result = await analyzeBusinessCard(image);
      setDraft(result.contact);
      setConfidence(result.confidence);
      setReviewState('REVIEW_REQUIRED');
      setMessage(t.ocrDone);
    } catch (error) {
      setReviewState('BLOCKED');
      setMessage(error instanceof Error ? error.message : t.providerBlocked);
    }
  };

  const submitRequest = async () => {
    if (!draft.name.trim() && !draft.company.trim()) {
      setReviewState('BLOCKED');
      setMessage(t.required);
      return;
    }

    const result = await executeFrontendMutation(boundary, {
      simulate: () => ({
        requestId: `demo-contact-request-${Date.now()}`,
        action: duplicate ? 'MERGE_REVIEW' : 'CREATE_REVIEW',
        companyId: brandWorkspace,
        googleSyncRequested: googleOptIn,
      }),
    });

    if (result.kind === 'BLOCKED') {
      setReviewState('BLOCKED');
      setMessage(result.message);
      return;
    }
    setReviewState('REQUEST_READY');
    setMessage(t.requestReady);
  };

  return (
    <main className="space-y-5 pb-10">
      <section className="border border-[var(--color-border)] bg-[#113b51] px-5 py-6 text-white shadow-[0_18px_45px_rgba(15,45,70,.18)] sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[11px] font-black tracking-[.18em] text-[#74e2c0]">
              {t.eyebrow}
            </p>
            <h1 className="mt-2 text-2xl font-black sm:text-3xl">{t.title}</h1>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/75">
              {t.description}
            </p>
          </div>
          <HandoffLanguageToggle locale={locale} onChange={setLocale} />
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-4">
          {[t.capture, t.review, t.duplicate, t.complete].map((step, index) => (
            <div
              key={step}
              className="border border-white/15 bg-white/[.07] px-3 py-3 text-xs font-black"
            >
              <span className="mr-2 text-[#74e2c0]">0{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </section>

      <RuntimeCapabilityPanel boundary={boundary} />

      <section className="grid gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--cc-shadow-1)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-emerald-50 text-emerald-700">
            <QrCode className="h-6 w-6" />
          </span>
          <span>
            <strong className="block text-sm text-[var(--color-text-main)]">{t.qrSession}</strong>
            <span className="mt-1 block text-[10px] font-semibold leading-5 text-[var(--color-text-sub)]">
              {activeMobileSession
                ? `${activeMobileSession.state} · ${activeMobileSession.id.slice(-8)} · ${activeMobileSession.expiresAt}`
                : t.qrPending}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => createMobileSession(brandWorkspace)}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-emerald-300 px-4 text-xs font-black text-emerald-800"
        >
          <QrCode className="h-4 w-4" />
          {t.createQrSession}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Link href="/mobile/business-cards/capture" className="inline-flex min-h-11 items-center justify-center gap-2 bg-emerald-700 px-3 text-xs font-black text-white">
            <Smartphone className="h-4 w-4" />
            {t.mobileCapture}
          </Link>
          <Link href="/sales/business-cards/inbox" className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#172554] px-3 text-xs font-black text-white">
            <Inbox className="h-4 w-4" />
            {t.inbox}
          </Link>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(320px,.82fr)_minmax(520px,1.18fr)]">
        <article className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_14px_34px_rgba(25,45,82,.07)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.16em] text-emerald-700">
                Capture
              </p>
              <h2 className="mt-1 text-lg font-black text-[var(--color-text-main)]">
                {t.capture}
              </h2>
            </div>
            <span className="border border-[var(--color-border)] px-3 py-1 text-[10px] font-black text-[var(--color-text-sub)]">
              {file ? file.name : t.captureHelp}
            </span>
          </div>

          <label className="mt-4 flex min-h-[290px] cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed border-emerald-200 bg-emerald-50/45 text-center transition hover:border-emerald-500">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={t.capture}
                className="h-[290px] w-full object-contain p-3"
              />
            ) : (
              <span className="p-7">
                <span className="mx-auto flex h-16 w-16 items-center justify-center bg-white text-emerald-700 shadow-sm">
                  <FileImage className="h-8 w-8" />
                </span>
                <strong className="mt-5 block text-sm font-black text-slate-800">
                  {t.choose}
                </strong>
                <span className="mt-2 block text-xs font-semibold text-slate-500">
                  {t.captureHelp}
                </span>
              </span>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                const image = event.target.files?.[0];
                if (image) void selectImage(image);
                event.currentTarget.value = '';
              }}
            />
          </label>

          <div className="mt-3 flex gap-2">
            <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 bg-emerald-700 px-4 text-xs font-black text-white hover:bg-emerald-800">
              <Upload className="h-4 w-4" />
              {file ? t.replace : t.choose}
              <input
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                className="sr-only"
                onChange={(event) => {
                  const image = event.target.files?.[0];
                  if (image) void selectImage(image);
                  event.currentTarget.value = '';
                }}
              />
            </label>
            <button
              type="button"
              onClick={reset}
              className="flex min-h-11 items-center gap-2 border border-[var(--color-border)] px-4 text-xs font-black text-[var(--color-text-sub)]"
            >
              <RefreshCcw className="h-4 w-4" />
              {t.reset}
            </button>
          </div>

          <div className="mt-4 border border-blue-100 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-900">
            <ShieldCheck className="mb-2 h-5 w-5 text-blue-700" />
            {t.providerNotice}
          </div>
        </article>

        <article className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_14px_34px_rgba(25,45,82,.07)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[.16em] text-[#4e6fd8]">
                Human review
              </p>
              <h2 className="mt-1 text-lg font-black text-[var(--color-text-main)]">
                {t.review}
              </h2>
            </div>
            <div className="flex gap-2 text-[10px] font-black">
              <span className="border border-[var(--color-border)] px-3 py-1">
                {t.currentCompany}: {brandWorkspace}
              </span>
              {confidence > 0 && (
                <span className="border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                  {t.confidence}: {Math.round(confidence * 100)}%
                </span>
              )}
            </div>
          </div>

          <div
            role={reviewState === 'BLOCKED' ? 'alert' : 'status'}
            className={`mt-4 flex min-h-12 items-center gap-3 border px-4 py-3 text-xs font-bold ${stateTone[reviewState]}`}
          >
            {reviewState === 'OCR_PENDING' ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : reviewState === 'BLOCKED' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : reviewState === 'REQUEST_READY' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ScanLine className="h-4 w-4" />
            )}
            <span>
              {message ||
                (boundary.isSimulation ? t.demoNotice : boundary.message)}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label
                key={field.key}
                className={field.span ? 'sm:col-span-2' : ''}
              >
                <span className="mb-1.5 block text-[11px] font-black text-[var(--color-text-sub)]">
                  {t.field[field.key]}
                </span>
                <input
                  value={draft[field.key]}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold text-[var(--color-text-main)] outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <div className="flex items-center gap-2">
                {duplicate ? (
                  <Merge className="h-5 w-5 text-amber-600" />
                ) : (
                  <Users className="h-5 w-5 text-emerald-700" />
                )}
                <strong className="text-sm font-black text-[var(--color-text-main)]">
                  {t.duplicate}
                </strong>
              </div>
              <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
                {duplicate
                  ? `${t.duplicateFound} ${duplicate.name || duplicate.company}`
                  : t.noDuplicate}
              </p>
            </div>
            <label className="flex cursor-pointer gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
              <input
                type="checkbox"
                checked={googleOptIn}
                onChange={(event) => setGoogleOptIn(event.target.checked)}
                disabled={!googleReady && !boundary.isSimulation}
                className="mt-1 h-4 w-4 accent-emerald-700"
              />
              <span>
                <strong className="block text-xs font-black text-[var(--color-text-main)]">
                  {t.google}
                </strong>
                <span className="mt-1 block text-[11px] font-semibold leading-5 text-[var(--color-text-sub)]">
                  {t.googleHelp}
                </span>
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={() => void submitRequest()}
            disabled={reviewState === 'OCR_PENDING'}
            className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-[#eb6300] px-5 text-sm font-black text-white shadow-[0_10px_22px_rgba(235,99,0,.2)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {duplicate ? <Merge className="h-4 w-4" /> : <ContactRound className="h-4 w-4" />}
            {duplicate ? t.merge : t.create}
            <ArrowRight className="h-4 w-4" />
          </button>
        </article>
      </section>

      <section className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_14px_34px_rgba(25,45,82,.07)]">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-[var(--color-text-main)]">
              {t.contacts}
            </h2>
            <p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">
              {t.localOnly}
            </p>
          </div>
          <span className="text-xs font-black text-[var(--color-text-sub)]">
            {contacts.length}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {contacts.length ? (
            contacts.slice(0, 6).map((contact) => (
              <article
                key={contact.id}
                className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
              >
                <strong className="block truncate text-sm font-black text-[var(--color-text-main)]">
                  {contact.name || contact.company}
                </strong>
                <span className="mt-1 block truncate text-xs font-semibold text-[var(--color-text-sub)]">
                  {contact.company} {contact.position}
                </span>
                <span className="mt-3 block truncate text-[11px] text-[var(--color-text-sub)]">
                  {contact.email || contact.mobile || '-'}
                </span>
              </article>
            ))
          ) : (
            <div className="col-span-full flex min-h-28 items-center justify-center border border-dashed border-[var(--color-border)] text-sm font-bold text-[var(--color-text-sub)]">
              Empty
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
