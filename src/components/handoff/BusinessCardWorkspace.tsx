'use client';

/* eslint-disable @next/next/no-img-element -- object URL previews are local-only and unoptimized by design. */

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, ContactRound, FileImage,
  History, Inbox, Link2, LoaderCircle, Mail, Merge, Plus, QrCode, RefreshCcw,
  ScanLine, ShieldCheck, Smartphone, Trash2, Upload, UserRoundCheck, Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { ActionButtonGroup, SemanticActionButton } from '@/components/ui/SemanticActionButton';
import { registerBusinessCardContact, type BusinessCardRegistrationResponse } from '@/lib/businessCardContactApi';
import {
  findBusinessCardDuplicateCandidates,
  type BusinessCardRegistrationDecision,
} from '@/lib/businessOperations';
import { analyzeBusinessCard, type BusinessCardFields } from '@/lib/businessCardOcr';
import { executeFrontendMutation, getFrontendModuleBoundary, type FrontendLocale } from '@/lib/frontendDataSource';
import { useAuthStore } from '@/store/authStore';
import { useBusinessCardMobileStore } from '@/store/businessCardMobileStore';
import { useBusinessOperationsStore } from '@/store/businessOperationsStore';
import { clearLegacyUnscopedContacts, readLegacyUnscopedContacts, type LegacyUnscopedContact } from '@/store/contactStore';

type ReviewState = 'EMPTY' | 'OCR_PENDING' | 'REVIEW_REQUIRED' | 'BLOCKED' | 'REGISTERED';
type WizardStep = 1 | 2 | 3 | 4;

const emptyContact = (): BusinessCardFields => ({ name: '', company: '', department: '', position: '', mobile: '', telephone: '', fax: '', email: '', homepage: '', address: '' });
const fields: Array<{ key: keyof BusinessCardFields; span?: boolean }> = [
  { key: 'name' }, { key: 'company' }, { key: 'department' }, { key: 'position' },
  { key: 'mobile' }, { key: 'telephone' }, { key: 'fax' }, { key: 'email' },
  { key: 'homepage' }, { key: 'address', span: true },
];

const copy = {
  ko: {
    eyebrow: 'CONTACT OS · BUSINESS CARD', title: '명함 자동등록', description: '명함을 사람이 검수한 뒤 회사 고객DB와 영업자산으로 연결합니다.',
    steps: ['명함 이미지', 'OCR 검수', '중복 확인', '고객DB 등록'], capture: '명함 이미지', choose: '이미지 선택', manual: 'OCR 없이 직접 입력', replace: '다른 이미지', reset: '초기화',
    demoOcr: 'DEMO OCR SIMULATION · 실제 OCR Provider 결과가 아닙니다.', providerBlocked: 'OCR Provider 또는 Backend Adapter가 준비되지 않아 이미지를 전송하지 않았습니다.', ocrWorking: 'OCR 작업을 요청하고 있습니다.', imageError: 'JPG 또는 PNG 형식의 10MB 이하 이미지만 사용할 수 있습니다.',
    review: 'OCR 결과 검수', reviewHelp: '모든 필드는 사람이 직접 수정할 수 있습니다.', next: '다음 단계', previous: '이전 단계', required: '이름 또는 회사 중 하나를 입력하세요.', confidence: '신뢰도', manualValue: '직접입력',
    duplicate: '중복 후보 확인', noDuplicate: '현재 회사 범위에서 중복 후보가 없습니다.', duplicateFound: '이메일·휴대전화·이름과 회사 기준 후보입니다.', newContact: '새 연락처', mergeContact: '기존 연락처에 병합', differentPerson: '동명이인·다른 사람', mergeFields: '병합할 필드', keepExisting: '선택하지 않은 필드와 빈 신규값은 기존값을 유지합니다.',
    register: '고객DB 등록', customer: '연결 고객사', customerRequired: '고객사를 선택하거나 회사명을 입력하세요.', autoCustomer: '회사명으로 고객사를 찾거나 신규 Prospect를 만듭니다.', owner: 'Owner', tags: '태그', memo: '메모', google: 'Google Contacts 단방향 Opt-in', googleHelp: '요청만 기록하며 Provider 연결 전에는 동기화 성공으로 표시하지 않습니다.',
    registering: '등록 중', created: 'Canonical Demo Contact가 생성되었습니다.', merged: '기존 Contact ID를 유지한 채 선택 필드가 병합되었습니다.', backend: 'Server Adapter가 없어 운영 등록이 차단되었습니다.',
    openContact: 'Contact 열기', customer360: '고객 360', opportunity: '영업기회 생성', compose: '메일 작성', recent: '현재 회사 Contact', cardHistory: '명함 이력', archived: '보관',
    legacyTitle: '회사 범위 없는 이전 Demo 연락처', legacyHelp: '자동 귀속하지 않습니다. 현재 회사를 확인한 뒤 명시적으로 가져오거나 삭제하세요.', importLegacy: '현재 회사로 검토 가져오기', deleteLegacy: '이전 Demo 데이터 삭제',
    mobileCapture: '모바일 촬영', inbox: '명함 수신함', inboxSource: '수신함 검수 대상', qr: '1회용 QR 세션', qrCreate: 'Demo 세션 만들기', qrPending: 'Backend 연결 전에는 영구 Upload URL을 만들지 않습니다.',
    field: { name: '이름', company: '회사', department: '부서', position: '직급', mobile: '휴대전화', telephone: '대표·사무실 전화', fax: '팩스', email: '이메일', homepage: '홈페이지', address: '주소' },
  },
  vi: {
    eyebrow: 'CONTACT OS · DANH THIẾP', title: 'Đăng ký danh thiếp', description: 'Sau khi người dùng kiểm tra, liên kết danh thiếp với cơ sở dữ liệu khách hàng và tài sản kinh doanh.',
    steps: ['Ảnh danh thiếp', 'Kiểm tra OCR', 'Kiểm tra trùng', 'Đăng ký CRM'], capture: 'Ảnh danh thiếp', choose: 'Chọn ảnh', manual: 'Nhập trực tiếp không OCR', replace: 'Chọn ảnh khác', reset: 'Đặt lại',
    demoOcr: 'DEMO OCR SIMULATION · Không phải kết quả từ Provider OCR thật.', providerBlocked: 'Chưa có OCR Provider hoặc Backend Adapter nên ảnh chưa được gửi.', ocrWorking: 'Đang yêu cầu OCR.', imageError: 'Chỉ dùng JPG/PNG tối đa 10MB.',
    review: 'Kiểm tra kết quả OCR', reviewHelp: 'Người dùng có thể sửa mọi trường.', next: 'Tiếp theo', previous: 'Quay lại', required: 'Nhập tên hoặc công ty.', confidence: 'Độ tin cậy', manualValue: 'Nhập tay',
    duplicate: 'Kiểm tra liên hệ trùng', noDuplicate: 'Không có ứng viên trùng trong công ty hiện tại.', duplicateFound: 'Ứng viên theo email, điện thoại hoặc tên và công ty.', newContact: 'Liên hệ mới', mergeContact: 'Gộp vào liên hệ', differentPerson: 'Người khác', mergeFields: 'Trường cần gộp', keepExisting: 'Trường không chọn và giá trị trống không xóa dữ liệu hiện có.',
    register: 'Đăng ký CRM', customer: 'Khách hàng liên kết', customerRequired: 'Chọn khách hàng hoặc nhập tên công ty.', autoCustomer: 'Tìm hoặc tạo Prospect theo tên công ty.', owner: 'Phụ trách', tags: 'Nhãn', memo: 'Ghi chú', google: 'Opt-in một chiều Google Contacts', googleHelp: 'Chỉ ghi nhận yêu cầu; không báo thành công trước khi có Provider.',
    registering: 'Đang đăng ký', created: 'Đã tạo Canonical Demo Contact.', merged: 'Đã giữ Contact ID và gộp các trường đã chọn.', backend: 'Không có Server Adapter nên đăng ký vận hành bị chặn.',
    openContact: 'Mở Contact', customer360: 'Khách hàng 360', opportunity: 'Tạo cơ hội', compose: 'Soạn email', recent: 'Contact công ty hiện tại', cardHistory: 'Lịch sử danh thiếp', archived: 'Lưu trữ',
    legacyTitle: 'Demo Contact cũ chưa có phạm vi công ty', legacyHelp: 'Không tự động gán. Hãy xác nhận công ty trước khi nhập hoặc xóa.', importLegacy: 'Nhập vào công ty hiện tại', deleteLegacy: 'Xóa Demo cũ',
    mobileCapture: 'Chụp trên điện thoại', inbox: 'Hộp thư danh thiếp', inboxSource: 'Mục đang kiểm tra', qr: 'Phiên QR dùng một lần', qrCreate: 'Tạo phiên Demo', qrPending: 'Không tạo URL tải lên vĩnh viễn trước khi có Backend.',
    field: { name: 'Họ tên', company: 'Công ty', department: 'Phòng ban', position: 'Chức vụ', mobile: 'Di động', telephone: 'Điện thoại', fax: 'Fax', email: 'Email', homepage: 'Website', address: 'Địa chỉ' },
  },
  en: {
    eyebrow: 'CONTACT OS · BUSINESS CARD', title: 'Business card registration', description: 'Human-review a business card, then connect it to the team customer database and sales assets.',
    steps: ['Card image', 'OCR review', 'Duplicate review', 'CRM registration'], capture: 'Business card image', choose: 'Choose image', manual: 'Enter without OCR', replace: 'Choose another', reset: 'Reset',
    demoOcr: 'DEMO OCR SIMULATION · This is not a real OCR Provider result.', providerBlocked: 'The image was not sent because the OCR Provider or Backend Adapter is unavailable.', ocrWorking: 'Requesting OCR.', imageError: 'Use JPG/PNG up to 10MB.',
    review: 'Review OCR fields', reviewHelp: 'A person can edit every field.', next: 'Next', previous: 'Previous', required: 'Enter a name or company.', confidence: 'Confidence', manualValue: 'Manual',
    duplicate: 'Review duplicate candidates', noDuplicate: 'No candidate exists in the current company.', duplicateFound: 'Candidates match email, mobile, or name and company.', newContact: 'New contact', mergeContact: 'Merge with contact', differentPerson: 'Different person', mergeFields: 'Fields to merge', keepExisting: 'Unselected fields and blank incoming values never erase existing data.',
    register: 'Register in CRM', customer: 'Linked customer', customerRequired: 'Select a customer or enter a company name.', autoCustomer: 'Find or create a Prospect from the company name.', owner: 'Owner', tags: 'Tags', memo: 'Memo', google: 'One-way Google Contacts opt-in', googleHelp: 'This records an opt-in only and never reports sync success before a Provider responds.',
    registering: 'Registering', created: 'Canonical Demo Contact was created.', merged: 'The existing Contact ID was preserved and selected fields were merged.', backend: 'Registration is blocked until the Server Adapter is available.',
    openContact: 'Open contact', customer360: 'Customer 360', opportunity: 'Create opportunity', compose: 'Compose mail', recent: 'Current company contacts', cardHistory: 'Card history', archived: 'Archived',
    legacyTitle: 'Legacy Demo contacts without company scope', legacyHelp: 'They are never assigned silently. Confirm the current company before import or removal.', importLegacy: 'Review-import to company', deleteLegacy: 'Delete legacy Demo data',
    mobileCapture: 'Mobile capture', inbox: 'Business-card inbox', inboxSource: 'Inbox item under review', qr: 'One-time QR session', qrCreate: 'Create Demo session', qrPending: 'No permanent upload URL is created before Backend connection.',
    field: { name: 'Name', company: 'Company', department: 'Department', position: 'Position', mobile: 'Mobile', telephone: 'Telephone', fax: 'Fax', email: 'Email', homepage: 'Website', address: 'Address' },
  },
} satisfies Record<FrontendLocale, Record<string, unknown>>;

const stateTone: Record<ReviewState, string> = {
  EMPTY: 'border-slate-200 bg-slate-50 text-slate-600', OCR_PENDING: 'border-blue-200 bg-blue-50 text-blue-700', REVIEW_REQUIRED: 'border-amber-200 bg-amber-50 text-amber-800', BLOCKED: 'border-red-200 bg-red-50 text-red-700', REGISTERED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export function BusinessCardWorkspace() {
  const searchParams = useSearchParams();
  const { brandWorkspace, locale, setLocale } = useHandoffLocale();
  const t = copy[locale];
  const currentUser = useAuthStore((state) => state.currentUser);
  const actorId = currentUser?.id ?? 'demo-contact-reviewer';
  const store = useBusinessOperationsStore();
  const contacts = useMemo(() => store.contacts.filter((item) => item.companyId === brandWorkspace && !item.archivedAt && item.status !== 'INACTIVE'), [brandWorkspace, store.contacts]);
  const customers = useMemo(() => store.customers.filter((item) => item.companyId === brandWorkspace && !item.archivedAt), [brandWorkspace, store.customers]);
  const cardHistory = useMemo(() => store.businessCards.filter((item) => item.companyId === brandWorkspace), [brandWorkspace, store.businessCards]);
  const [step, setStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<BusinessCardFields>(emptyContact);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [confidence, setConfidence] = useState<Partial<Record<keyof BusinessCardFields, number>>>({});
  const [reviewState, setReviewState] = useState<ReviewState>('EMPTY');
  const [message, setMessage] = useState('');
  const [decision, setDecision] = useState<BusinessCardRegistrationDecision>('NEW_CONTACT');
  const [duplicateContactId, setDuplicateContactId] = useState<string | null>(null);
  const [mergeFields, setMergeFields] = useState<Array<keyof BusinessCardFields>>([]);
  const [customerId, setCustomerId] = useState('');
  const [tags, setTags] = useState('');
  const [memo, setMemo] = useState('');
  const [googleOptIn, setGoogleOptIn] = useState(false);
  const [result, setResult] = useState<BusinessCardRegistrationResponse | null>(null);
  const [legacyContacts, setLegacyContacts] = useState<LegacyUnscopedContact[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const createMobileSession = useBusinessCardMobileStore((state) => state.createSession);
  const mobileSessions = useBusinessCardMobileStore((state) => state.sessions.filter((item) => item.companyId === brandWorkspace));
  const sourceInbox = useBusinessCardMobileStore((state) => state.inbox.find((item) => item.id === searchParams.get('inboxId') && item.companyId === brandWorkspace));
  const transitionInbox = useBusinessCardMobileStore((state) => state.transitionInbox);

  const providerReady = process.env.NEXT_PUBLIC_BUSINESS_CARD_OCR_PROVIDER_READY === 'true' || Boolean(process.env.NEXT_PUBLIC_BUSINESS_CARD_OCR_ENDPOINT);
  const adapterReady = process.env.NEXT_PUBLIC_BUSINESS_CARD_ADAPTER_READY === 'true';
  const contactBoundary = getFrontendModuleBoundary('BUSINESS_CARD', { locale, adapterReady });
  const ocrBoundary = getFrontendModuleBoundary('BUSINESS_CARD', { locale, adapterReady, providerRequired: true, providerState: providerReady ? 'READY' : 'NOT_CONFIGURED' });
  const duplicates = useMemo(() => findBusinessCardDuplicateCandidates(contacts, { companyId: brandWorkspace, email: draft.email, mobile: draft.mobile, name: draft.name, companyName: draft.company }), [brandWorkspace, contacts, draft]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => {
    if (!contactBoundary.isSimulation || typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      setLegacyContacts(readLegacyUnscopedContacts(window.localStorage));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [contactBoundary.isSimulation]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setStep(1); setDraft(emptyContact()); setFile(null); setPreview(''); setConfidence({}); setReviewState('EMPTY'); setMessage(''); setDecision('NEW_CONTACT'); setDuplicateContactId(null); setMergeFields([]); setCustomerId(''); setTags(''); setMemo(''); setGoogleOptIn(false); setResult(null);
  };

  const openManual = () => {
    if (sourceInbox?.state === 'OCR_PENDING') transitionInbox(sourceInbox.id, 'REVIEW_REQUIRED');
    setReviewState('REVIEW_REQUIRED'); setMessage(t.manualValue); setConfidence({}); setStep(2);
  };

  const selectImage = async (image: File) => {
    if (!['image/jpeg', 'image/png'].includes(image.type) || image.size > 10 * 1024 * 1024) { setReviewState('BLOCKED'); setMessage(t.imageError); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(image); setPreview(URL.createObjectURL(image)); setDraft(emptyContact()); setResult(null);
    if (ocrBoundary.isSimulation) {
      const demo = brandWorkspace === 'VIET_QS'
        ? { ...emptyContact(), name: 'Demo Card Contact VN', company: 'DEMO Vietnam Partner', department: 'Cost', position: 'Manager', mobile: '+84 000 000 2001', email: 'business.card.vn@example.invalid' }
        : { ...emptyContact(), name: '데모 명함 담당자', company: 'DEMO 신규 파트너', department: '사업개발', position: '매니저', mobile: '010-0000-2001', email: 'business.card.kr@example.invalid' };
      if (sourceInbox?.state === 'OCR_PENDING') transitionInbox(sourceInbox.id, 'REVIEW_REQUIRED');
      setDraft(demo); setConfidence(Object.fromEntries(fields.map(({ key }) => [key, 0.82]))); setReviewState('REVIEW_REQUIRED'); setMessage(t.demoOcr); setStep(2); return;
    }
    if (!ocrBoundary.canMutate) { setReviewState('BLOCKED'); setMessage(t.providerBlocked); return; }
    setReviewState('OCR_PENDING'); setMessage(t.ocrWorking);
    try {
      const response = await analyzeBusinessCard(image);
      if (sourceInbox?.state === 'OCR_PENDING') transitionInbox(sourceInbox.id, 'REVIEW_REQUIRED');
      setDraft(response.contact); setConfidence(Object.fromEntries(fields.map(({ key }) => [key, response.confidence]))); setReviewState('REVIEW_REQUIRED'); setMessage(t.reviewHelp); setStep(2);
    } catch (error) { setReviewState('BLOCKED'); setMessage(error instanceof Error ? error.message : t.providerBlocked); }
  };

  const continueToDuplicates = () => {
    if (!draft.name.trim() && !draft.company.trim()) { setReviewState('BLOCKED'); setMessage(t.required); return; }
    const first = duplicates[0];
    if (first) { setDecision('MERGE_CONTACT'); setDuplicateContactId(first.id); setMergeFields(fields.filter(({ key }) => Boolean(draft[key].trim())).map(({ key }) => key)); }
    else { setDecision('NEW_CONTACT'); setDuplicateContactId(null); setMergeFields([]); }
    if (sourceInbox?.state === 'REVIEW_REQUIRED') transitionInbox(sourceInbox.id, first ? 'DUPLICATE_REVIEW' : 'READY_TO_CREATE');
    setReviewState('REVIEW_REQUIRED'); setMessage(''); setStep(3);
  };

  const completeSourceInbox = () => {
    if (!sourceInbox) return;
    const advance = (nextState: 'REVIEW_REQUIRED' | 'DUPLICATE_REVIEW' | 'READY_TO_CREATE' | 'COMPLETED') => {
      transitionInbox(sourceInbox.id, nextState);
    };
    let current = useBusinessCardMobileStore.getState().inbox.find((item) => item.id === sourceInbox.id);
    if (current?.state === 'OCR_PENDING') { advance('REVIEW_REQUIRED'); current = useBusinessCardMobileStore.getState().inbox.find((item) => item.id === sourceInbox.id); }
    if (current?.state === 'REVIEW_REQUIRED') { advance(duplicates.length ? 'DUPLICATE_REVIEW' : 'READY_TO_CREATE'); current = useBusinessCardMobileStore.getState().inbox.find((item) => item.id === sourceInbox.id); }
    if (current?.state === 'DUPLICATE_REVIEW') { advance('READY_TO_CREATE'); current = useBusinessCardMobileStore.getState().inbox.find((item) => item.id === sourceInbox.id); }
    if (current?.state === 'READY_TO_CREATE') advance('COMPLETED');
  };

  const submit = async () => {
    if (!draft.name.trim() && !draft.company.trim()) { setReviewState('BLOCKED'); setMessage(t.required); setStep(2); return; }
    if (decision === 'MERGE_CONTACT' && !duplicateContactId) { setReviewState('BLOCKED'); setMessage(t.duplicateFound); setStep(3); return; }
    if (!customerId && !draft.company.trim()) { setReviewState('BLOCKED'); setMessage(t.customerRequired); return; }
    const payload = {
      fields: draft, captureSource: sourceInbox ? 'MOBILE' as const : file ? 'DESKTOP' as const : 'MANUAL' as const,
      fileName: file?.name ?? sourceInbox?.fileName ?? null, fileSize: file?.size ?? sourceInbox?.fileSize ?? null,
      fileReferenceId: null, ocrMode: file ? (providerReady && !contactBoundary.isSimulation ? 'PROVIDER' as const : 'DEMO_SIMULATION' as const) : 'MANUAL' as const,
      fieldConfidence: confidence, decision, duplicateContactId, selectedMergeFields: mergeFields, customerId: customerId || null,
      ownerId: actorId, tags: tags.split(',').map((item) => item.trim()).filter(Boolean), memo, googleContactsOptIn: googleOptIn,
    };
    setSubmitting(true);
    try {
      const response = await executeFrontendMutation(contactBoundary, {
        simulate: () => store.registerBusinessCard(brandWorkspace, payload, actorId),
        request: adapterReady ? () => registerBusinessCardContact(brandWorkspace, payload) : undefined,
      });
      if (response.kind === 'BLOCKED') { setReviewState('BLOCKED'); setMessage(t.backend); return; }
      setResult({ ...response.data, revision: 'revision' in response.data ? Number(response.data.revision) : 1 });
      completeSourceInbox();
      setReviewState('REGISTERED'); setMessage(response.data.merged ? t.merged : t.created);
    } catch (error) { setReviewState('BLOCKED'); setMessage(error instanceof Error ? error.message : t.backend); }
    finally { setSubmitting(false); }
  };

  const importLegacy = () => {
    if (legacyContacts.some((contact) => !contact.company.trim())) {
      setMessage(t.customerRequired);
      return;
    }
    legacyContacts.forEach((contact) => store.registerBusinessCard(brandWorkspace, {
      fields: {
        name: contact.name,
        company: contact.company,
        department: contact.department,
        position: contact.position,
        mobile: contact.mobile,
        telephone: contact.telephone,
        fax: contact.fax,
        email: contact.email,
        homepage: contact.homepage,
        address: contact.address,
      },
      fieldConfidence: {},
      captureSource: 'MANUAL',
      fileName: contact.imageName ?? null,
      fileSize: null,
      fileReferenceId: null,
      ocrMode: 'MANUAL',
      decision: 'NEW_CONTACT',
      duplicateContactId: null,
      selectedMergeFields: [],
      customerId: null,
      ownerId: actorId,
      tags: ['LEGACY_DEMO_REVIEWED'],
      memo: 'Explicitly scoped from legacy Demo storage after user review.',
      googleContactsOptIn: false,
    }, actorId));
    clearLegacyUnscopedContacts(window.localStorage); setLegacyContacts([]);
  };
  const deleteLegacy = () => { clearLegacyUnscopedContacts(window.localStorage); setLegacyContacts([]); };

  return <main className="space-y-5 pb-10">
    <header className="rounded-2xl border border-emerald-900/20 bg-[linear-gradient(120deg,#103d4d,#0d7465)] p-6 text-white shadow-[var(--cc-shadow-2)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-3xl"><p className="text-[10px] font-black tracking-[.18em] text-emerald-200">{t.eyebrow}</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">{t.title}</h1><p className="mt-2 text-sm font-semibold leading-6 text-white/75">{t.description}</p></div><HandoffLanguageToggle locale={locale} onChange={setLocale} /></div>
      <div className="mt-6 grid gap-2 sm:grid-cols-4">{t.steps.map((label, index) => { const number = (index + 1) as WizardStep; const active = step === number; const complete = step > number || reviewState === 'REGISTERED'; return <button key={label} type="button" onClick={() => number <= step && setStep(number)} className={`min-h-16 rounded-xl border p-3 text-left text-xs font-black transition focus-visible:ring-2 focus-visible:ring-white ${active ? 'border-white bg-white text-emerald-950 shadow-lg' : complete ? 'border-emerald-200/50 bg-emerald-200/15 text-white' : 'border-white/15 bg-white/[.06] text-white/65'}`}><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-300/20 text-[10px]">{complete ? <Check className="h-3.5 w-3.5" /> : `0${number}`}</span>{label}</button>; })}</div>
    </header>

    <RuntimeCapabilityPanel boundary={contactBoundary} />

    {sourceInbox && <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300 bg-cyan-50 p-4 text-cyan-950 shadow-[var(--cc-shadow-1)]"><span><strong className="block text-xs">{t.inboxSource}</strong><small className="mt-1 block text-[10px] font-semibold">{sourceInbox.fileName} · {sourceInbox.state} · {Math.max(1, Math.round(sourceInbox.fileSize / 1024))} KB</small></span><Link href="/sales/business-cards/inbox" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cyan-400 bg-white px-3 text-xs font-black text-cyan-800 hover:bg-cyan-100"><Inbox className="h-4 w-4" />{t.inbox}</Link></section>}

    <section className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--cc-shadow-1)] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center">
      <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><QrCode className="h-6 w-6" /></span><span><strong className="block text-sm">{t.qr}</strong><small className="mt-1 block text-[10px] font-semibold text-[var(--color-text-sub)]">{mobileSessions[0] ? `${mobileSessions[0].state} · ${mobileSessions[0].id.slice(-8)}` : t.qrPending}</small></span></div>
      <SemanticActionButton variant="document" icon={<QrCode className="h-4 w-4" />} onClick={() => createMobileSession(brandWorkspace)}>{t.qrCreate}</SemanticActionButton>
      <ActionButtonGroup label="Mobile business card"><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-black text-white hover:bg-emerald-800" href="/mobile/business-cards/capture"><Smartphone className="h-4 w-4" />{t.mobileCapture}</Link><Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#172554] px-4 text-xs font-black text-white hover:bg-[#263b78]" href="/sales/business-cards/inbox"><Inbox className="h-4 w-4" />{t.inbox}</Link></ActionButtonGroup>
    </section>

    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-2)] sm:p-6">
      <div role={reviewState === 'BLOCKED' ? 'alert' : 'status'} className={`mb-5 flex min-h-12 items-center gap-3 rounded-xl border px-4 py-3 text-xs font-bold ${stateTone[reviewState]}`}>{reviewState === 'OCR_PENDING' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : reviewState === 'BLOCKED' ? <AlertTriangle className="h-4 w-4" /> : reviewState === 'REGISTERED' ? <CheckCircle2 className="h-4 w-4" /> : <ScanLine className="h-4 w-4" />}<span>{message || contactBoundary.message}</span></div>

      {step === 1 && <div className="grid gap-5 xl:grid-cols-[minmax(320px,.8fr)_1.2fr]"><label className="flex min-h-[330px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 text-center transition hover:border-emerald-600 hover:bg-emerald-50">{preview ? <img src={preview} alt={t.capture} className="h-[330px] w-full object-contain p-4" /> : <span className="p-8"><span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm"><FileImage className="h-8 w-8" /></span><strong className="mt-5 block text-sm">{t.choose}</strong><small className="mt-2 block text-xs text-slate-500">JPG/PNG · 10MB</small></span>}<input type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" onChange={(event) => { const image = event.target.files?.[0]; if (image) void selectImage(image); event.currentTarget.value = ''; }} /></label><div className="flex flex-col justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-6"><h2 className="text-xl font-black">01 · {t.capture}</h2><p className="mt-3 text-sm font-semibold leading-6 text-[var(--color-text-sub)]">{ocrBoundary.isSimulation ? t.demoOcr : ocrBoundary.message}</p><div className="mt-6 flex flex-wrap gap-2"><label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-black text-white hover:bg-emerald-800"><Upload className="h-4 w-4" />{file ? t.replace : t.choose}<input type="file" accept="image/jpeg,image/png" capture="environment" className="sr-only" onChange={(event) => { const image = event.target.files?.[0]; if (image) void selectImage(image); }} /></label><SemanticActionButton variant="edit" icon={<Plus className="h-4 w-4" />} onClick={openManual}>{t.manual}</SemanticActionButton><SemanticActionButton variant="neutral" icon={<RefreshCcw className="h-4 w-4" />} onClick={reset}>{t.reset}</SemanticActionButton></div><div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-900"><ShieldCheck className="mr-2 inline h-4 w-4" />{t.googleHelp}</div></div></div>}

      {step === 2 && <div><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-black">02 · {t.review}</h2><p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">{t.reviewHelp}</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black text-blue-700">{file ? (ocrBoundary.isSimulation ? 'DEMO OCR SIMULATION' : 'OCR PROVIDER') : 'MANUAL INPUT'}</span></div><div className="grid gap-4 sm:grid-cols-2">{fields.map(({ key, span }) => <label key={key} className={span ? 'sm:col-span-2' : ''}><span className="mb-1.5 flex items-center justify-between text-[11px] font-black text-[var(--color-text-sub)]"><span>{t.field[key]}</span><span className="text-blue-600">{confidence[key] ? `${t.confidence} ${Math.round((confidence[key] ?? 0) * 100)}%` : t.manualValue}</span></span><input value={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} className="min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></label>)}</div><div className="mt-6 flex justify-between"><SemanticActionButton variant="neutral" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep(1)}>{t.previous}</SemanticActionButton><SemanticActionButton variant="primary" icon={<ArrowRight className="h-4 w-4" />} onClick={continueToDuplicates}>{t.next}</SemanticActionButton></div></div>}

      {step === 3 && <div><div className="mb-5"><h2 className="text-xl font-black">03 · {t.duplicate}</h2><p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">{duplicates.length ? t.duplicateFound : t.noDuplicate}</p></div><div className="grid gap-4 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]"><div className="space-y-3">{duplicates.length ? duplicates.map((contact) => <button key={contact.id} type="button" onClick={() => setDuplicateContactId(contact.id)} className={`w-full rounded-xl border p-4 text-left transition hover:-translate-y-px hover:shadow-md ${duplicateContactId === contact.id ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-100' : 'border-[var(--color-border)]'}`}><span className="flex items-center justify-between gap-2"><strong className="text-sm">{contact.name}</strong>{duplicateContactId === contact.id && <span className="rounded-full bg-orange-600 px-2 py-1 text-[9px] font-black text-white">SELECTED</span>}</span><small className="mt-1 block text-[var(--color-text-sub)]">{contact.companyName} · {contact.email || contact.mobile}</small></button>) : <div className="grid min-h-40 place-items-center rounded-xl border border-dashed border-[var(--color-border)] text-sm font-bold text-[var(--color-text-sub)]"><UserRoundCheck className="mb-2 h-8 w-8 text-emerald-600" />{t.noDuplicate}</div>}</div><div className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4"><div className="grid gap-2 sm:grid-cols-3">{([['NEW_CONTACT', t.newContact], ['MERGE_CONTACT', t.mergeContact], ['DIFFERENT_PERSON', t.differentPerson]] as const).map(([value, label]) => <button key={value} type="button" disabled={value === 'MERGE_CONTACT' && !duplicates.length} onClick={() => setDecision(value)} className={`min-h-12 rounded-lg border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${decision === value ? 'border-orange-500 bg-orange-600 text-white' : 'border-[var(--color-border)] bg-white hover:border-orange-300'}`}>{label}</button>)}</div>{decision === 'MERGE_CONTACT' && <div className="mt-5"><h3 className="text-sm font-black">{t.mergeFields}</h3><p className="mt-1 text-[11px] font-semibold text-[var(--color-text-sub)]">{t.keepExisting}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{fields.map(({ key }) => <label key={key} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 text-xs font-bold"><input type="checkbox" checked={mergeFields.includes(key)} onChange={(event) => setMergeFields((current) => event.target.checked ? [...current, key] : current.filter((item) => item !== key))} className="accent-orange-600" />{t.field[key]}<span className="ml-auto max-w-[45%] truncate text-[10px] text-[var(--color-text-sub)]">{draft[key] || '-'}</span></label>)}</div></div>}</div></div><div className="mt-6 flex justify-between"><SemanticActionButton variant="neutral" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep(2)}>{t.previous}</SemanticActionButton><SemanticActionButton variant="primary" icon={<ArrowRight className="h-4 w-4" />} onClick={() => setStep(4)}>{t.next}</SemanticActionButton></div></div>}

      {step === 4 && <div><div className="mb-5"><h2 className="text-xl font-black">04 · {t.register}</h2><p className="mt-1 text-xs font-semibold text-[var(--color-text-sub)]">{contactBoundary.message}</p></div>{result ? <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-6"><CheckCircle2 className="h-10 w-10 text-emerald-700" /><h3 className="mt-3 text-lg font-black text-emerald-950">{message}</h3><p className="mt-2 text-xs font-semibold text-emerald-800">Contact {result.contactId} · Card {result.businessCardId}</p><div className="mt-5 flex flex-wrap gap-2"><Link href={`/sales?salesView=CONTACTS&contactId=${encodeURIComponent(result.contactId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-xs font-black text-white"><ContactRound className="h-4 w-4" />{t.openContact}</Link>{result.customerId && <Link href={`/sales?salesView=CUSTOMERS&customerId=${encodeURIComponent(result.customerId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-xs font-black text-white"><Users className="h-4 w-4" />{t.customer360}</Link>}<Link href={`/sales?salesView=PIPELINE&new=1&customerId=${encodeURIComponent(result.customerId)}&contactId=${encodeURIComponent(result.contactId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-violet-300 bg-violet-50 px-4 text-xs font-black text-violet-800"><Plus className="h-4 w-4" />{t.opportunity}</Link><Link href={`/mail?compose=1&contactId=${encodeURIComponent(result.contactId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 text-xs font-black text-blue-800"><Mail className="h-4 w-4" />{t.compose}</Link></div><SemanticActionButton className="mt-5" variant="neutral" icon={<RefreshCcw className="h-4 w-4" />} onClick={reset}>{t.reset}</SemanticActionButton></div> : <div className="grid gap-5 lg:grid-cols-2"><div className="space-y-4"><label className="block text-xs font-black">{t.customer}<select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm"><option value="">{t.autoCustomer}</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customerNo} · {customer.name}</option>)}</select></label><label className="block text-xs font-black">{t.owner}<input value={actorId} readOnly className="mt-1.5 min-h-11 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-800" /></label><label className="block text-xs font-black">{t.tags}<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="VIP, Partner" className="mt-1.5 min-h-11 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm" /></label><label className="block text-xs font-black">{t.memo}<textarea rows={4} value={memo} onChange={(event) => setMemo(event.target.value)} className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] p-3 text-sm" /></label></div><div className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-5"><h3 className="text-sm font-black">{draft.name || draft.company}</h3><dl className="mt-4 space-y-2 text-xs">{fields.filter(({ key }) => draft[key]).map(({ key }) => <div key={key} className="grid grid-cols-[110px_1fr] gap-3 border-b border-[var(--color-border)] py-2"><dt className="font-black text-[var(--color-text-sub)]">{t.field[key]}</dt><dd className="break-all font-semibold">{draft[key]}</dd></div>)}</dl><label className="mt-5 flex cursor-pointer gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><input type="checkbox" checked={googleOptIn} onChange={(event) => setGoogleOptIn(event.target.checked)} className="mt-1 accent-blue-700" /><span><strong className="block text-xs text-blue-950">{t.google}</strong><small className="mt-1 block text-[10px] font-semibold leading-5 text-blue-800">{t.googleHelp}</small></span></label></div></div>} {!result && <div className="mt-6 flex flex-wrap justify-between gap-3"><SemanticActionButton variant="neutral" icon={<ArrowLeft className="h-4 w-4" />} onClick={() => setStep(3)}>{t.previous}</SemanticActionButton><SemanticActionButton variant="success" loading={submitting} loadingLabel={t.registering} icon={decision === 'MERGE_CONTACT' ? <Merge className="h-4 w-4" /> : <ContactRound className="h-4 w-4" />} onClick={() => void submit()}>{t.register}</SemanticActionButton></div>}</div>}
    </section>

    {legacyContacts.length > 0 && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5"><div className="flex gap-3"><AlertTriangle className="h-6 w-6 shrink-0 text-amber-700" /><div><h2 className="text-sm font-black text-amber-950">{t.legacyTitle} · {legacyContacts.length}</h2><p className="mt-1 text-xs font-semibold leading-5 text-amber-900">{t.legacyHelp}</p><ActionButtonGroup label="Legacy demo migration" className="mt-4"><SemanticActionButton variant="warning" icon={<Link2 className="h-4 w-4" />} onClick={importLegacy}>{t.importLegacy}</SemanticActionButton><SemanticActionButton variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={deleteLegacy}>{t.deleteLegacy}</SemanticActionButton></ActionButtonGroup></div></div></section>}

    <section className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]"><article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)]"><div className="flex items-center justify-between"><h2 className="text-lg font-black">{t.recent}</h2><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{contacts.length}</span></div><div className="mt-4 grid gap-3 md:grid-cols-2">{contacts.slice(0, 6).map((contact) => <Link key={contact.id} href={`/sales?salesView=CONTACTS&contactId=${encodeURIComponent(contact.id)}`} className="group rounded-xl border border-[var(--color-border)] p-4 transition hover:-translate-y-px hover:border-emerald-400 hover:shadow-md"><span className="flex items-start justify-between gap-2"><strong className="truncate text-sm">{contact.name || contact.companyName}</strong><ArrowRight className="h-4 w-4 text-emerald-600 transition group-hover:translate-x-0.5" /></span><small className="mt-1 block truncate text-[var(--color-text-sub)]">{contact.companyName} · {contact.position}</small><span className="mt-3 block truncate text-[11px] text-[var(--color-text-sub)]">{contact.email || contact.mobile || '-'}</span></Link>)}</div></article><article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)]"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-black"><History className="h-5 w-5 text-violet-600" />{t.cardHistory}</h2><span className="text-xs font-black text-[var(--color-text-sub)]">{cardHistory.length}</span></div><div className="mt-4 space-y-2">{cardHistory.slice(0, 5).map((card) => <div key={card.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3"><strong className="block text-xs">{card.reviewStatus} · {card.registrationDecision}</strong><small className="mt-1 block text-[10px] text-[var(--color-text-sub)]">{card.reviewedAt} · rev.{card.revision}</small></div>)}{!cardHistory.length && <p className="py-8 text-center text-xs font-semibold text-[var(--color-text-sub)]">Empty</p>}</div></article></section>
  </main>;
}
