'use client';

import {
  AlertTriangle,
  Bot,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  FileAudio,
  FileText,
  FolderUp,
  Gavel,
  Link2,
  ListTodo,
  LoaderCircle,
  MessageSquareText,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useMemo, useState } from 'react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
  type FrontendLocale,
} from '@/lib/frontendDataSource';

type JobState =
  | 'READY'
  | 'QUEUED'
  | 'REVIEW_REQUIRED'
  | 'BLOCKED'
  | 'CANDIDATE_READY';

type StructuredMinutes = {
  summary: string;
  decisions: string[];
  issues: string[];
  actions: string[];
  citations: string[];
};

const copy = {
  ko: {
    eyebrow: 'AI WORK ASSISTANT',
    title: 'AI 회의록·녹취 정리',
    description:
      '메모 또는 동의가 확인된 오디오를 구조화하고, 사람이 검수한 결과만 업무 후보로 전달합니다.',
    source: '1. 원본 입력',
    notes: '거친 메모',
    notesPlaceholder:
      '회의 목적, 논의 내용, 결정사항, 담당자와 기한을 자유롭게 입력하세요.',
    audio: '오디오 파일',
    chooseAudio: '녹취 파일 선택',
    consent: '녹음 당사자 동의 또는 승인된 법적 근거를 확인했습니다.',
    classification: '자료 분류',
    internal: '사내 일반',
    restricted: '제한 법적자료',
    link: '2. 업무 연결',
    linkType: '연결 유형',
    project: '프로젝트',
    claim: '클레임',
    linkId: 'Canonical ID',
    run: '구조화 작업 시작',
    reset: '초기화',
    providerBlocked:
      'AI/STT Provider 또는 Backend Adapter가 준비되지 않아 작업을 시작하지 않았습니다.',
    consentRequired: '오디오 녹취에는 동의 또는 법적 근거 확인이 필요합니다.',
    sourceRequired: '메모 또는 오디오 파일을 입력하세요.',
    demoQueued:
      'Demo 결과입니다. 서버에 저장되지 않았으며 실제 AI 판단이 아닙니다.',
    result: '3. 구조화 결과 검수',
    summary: '요약',
    decisions: '결정사항',
    issues: '쟁점',
    actions: '후속조치',
    citations: '근거',
    review: '사람이 원문과 결과를 검수했습니다.',
    candidates: '4. 후속 업무 후보',
    task: '할 일 후보',
    calendar: '일정 후보',
    approval: '결재 초안 후보',
    drive: 'Drive 보관 후보',
    candidateNotice:
      '후보는 자동 확정되지 않습니다. 각 모듈에서 사용자가 다시 확인해야 합니다.',
    save: '회의록 저장 요청',
    saveBlocked: '사람 검수와 Canonical ID 입력이 필요합니다.',
    savedDemo:
      'Demo 회의록 후보가 준비되었습니다. 서버 회의록은 생성되지 않았습니다.',
    providerPolicy:
      '제한 법적·인사·재무 자료는 Local/Private AI Capability가 없으면 전송할 수 없습니다. Secret은 AI 입력에 포함하지 마세요.',
    empty: '구조화 작업을 실행하면 검수할 결과가 여기에 표시됩니다.',
    status: '작업 상태',
  },
  vi: {
    eyebrow: 'TRỢ LÝ CÔNG VIỆC AI',
    title: 'Biên bản và bản ghi AI',
    description:
      'Cấu trúc ghi chú hoặc âm thanh đã có đồng ý và chỉ chuyển kết quả đã được con người kiểm tra.',
    source: '1. Nguồn đầu vào',
    notes: 'Ghi chú thô',
    notesPlaceholder: 'Nhập mục tiêu, nội dung, quyết định, người phụ trách và hạn.',
    audio: 'Tệp âm thanh',
    chooseAudio: 'Chọn tệp ghi âm',
    consent: 'Đã xác nhận sự đồng ý hoặc căn cứ pháp lý được phê duyệt.',
    classification: 'Phân loại',
    internal: 'Nội bộ',
    restricted: 'Pháp lý hạn chế',
    link: '2. Liên kết công việc',
    linkType: 'Loại liên kết',
    project: 'Dự án',
    claim: 'Khiếu nại',
    linkId: 'Canonical ID',
    run: 'Bắt đầu cấu trúc',
    reset: 'Đặt lại',
    providerBlocked: 'Chưa có AI/STT Provider hoặc Backend Adapter.',
    consentRequired: 'Bản ghi âm cần xác nhận đồng ý hoặc căn cứ pháp lý.',
    sourceRequired: 'Nhập ghi chú hoặc tệp âm thanh.',
    demoQueued: 'Đây là kết quả demo, không lưu máy chủ và không phải phán quyết AI.',
    result: '3. Kiểm tra kết quả',
    summary: 'Tóm tắt',
    decisions: 'Quyết định',
    issues: 'Vấn đề',
    actions: 'Hành động',
    citations: 'Nguồn dẫn',
    review: 'Con người đã kiểm tra nguồn và kết quả.',
    candidates: '4. Ứng viên công việc',
    task: 'Ứng viên công việc',
    calendar: 'Ứng viên lịch',
    approval: 'Ứng viên phê duyệt',
    drive: 'Ứng viên lưu Drive',
    candidateNotice: 'Ứng viên không tự xác nhận; người dùng phải kiểm tra tại từng mô-đun.',
    save: 'Yêu cầu lưu biên bản',
    saveBlocked: 'Cần kiểm tra của con người và Canonical ID.',
    savedDemo: 'Ứng viên biên bản demo đã sẵn sàng; chưa tạo bản ghi máy chủ.',
    providerPolicy:
      'Dữ liệu pháp lý, nhân sự hoặc tài chính hạn chế cần Local/Private AI. Không đưa secret vào AI.',
    empty: 'Kết quả cần kiểm tra sẽ hiển thị sau khi chạy.',
    status: 'Trạng thái',
  },
  en: {
    eyebrow: 'AI WORK ASSISTANT',
    title: 'AI meeting notes and transcription',
    description:
      'Structure rough notes or consented audio and forward only human-reviewed results as work candidates.',
    source: '1. Source input',
    notes: 'Rough notes',
    notesPlaceholder: 'Enter purpose, discussion, decisions, owners, and due dates.',
    audio: 'Audio file',
    chooseAudio: 'Choose recording',
    consent: 'Participant consent or an approved legal basis has been confirmed.',
    classification: 'Classification',
    internal: 'Internal',
    restricted: 'Restricted legal',
    link: '2. Work link',
    linkType: 'Link type',
    project: 'Project',
    claim: 'Claim',
    linkId: 'Canonical ID',
    run: 'Start structuring',
    reset: 'Reset',
    providerBlocked: 'The AI/STT Provider or Backend Adapter is not ready.',
    consentRequired: 'Audio transcription requires consent or an approved legal basis.',
    sourceRequired: 'Enter notes or choose an audio file.',
    demoQueued:
      'This is a demo result. It is not server-persisted and is not an AI judgment.',
    result: '3. Review structured result',
    summary: 'Summary',
    decisions: 'Decisions',
    issues: 'Issues',
    actions: 'Action items',
    citations: 'Citations',
    review: 'A person reviewed the source and result.',
    candidates: '4. Follow-up candidates',
    task: 'Task candidate',
    calendar: 'Calendar candidate',
    approval: 'Approval draft candidate',
    drive: 'Drive archive candidate',
    candidateNotice:
      'Candidates are never auto-confirmed. A user must review them in each module.',
    save: 'Request meeting minute',
    saveBlocked: 'Human review and a Canonical ID are required.',
    savedDemo: 'The demo minute candidate is ready; no server record was created.',
    providerPolicy:
      'Restricted legal, HR, or finance data requires Local/Private AI capability. Never include secrets in AI input.',
    empty: 'Run the structuring job to see a reviewable result.',
    status: 'Job status',
  },
} satisfies Record<FrontendLocale, Record<string, string>>;

const stateStyle: Record<JobState, string> = {
  READY: 'border-slate-200 bg-slate-50 text-slate-700',
  QUEUED: 'border-blue-200 bg-blue-50 text-blue-700',
  REVIEW_REQUIRED: 'border-amber-200 bg-amber-50 text-amber-700',
  BLOCKED: 'border-red-200 bg-red-50 text-red-700',
  CANDIDATE_READY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const buildDemoMinutes = (notes: string, audioName?: string): StructuredMinutes => {
  const lines = notes
    .split(/\r?\n|[.!?]\s+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const source = lines.length ? lines : ['Audio review is required'];
  const decisionLines = source.filter((line) => /결정|승인|확정|decision|quyết/i.test(line));
  const issueLines = source.filter((line) => /문제|쟁점|위험|issue|risk|vấn đề/i.test(line));
  const actionLines = source.filter((line) => /담당|기한|조치|action|owner|hạn/i.test(line));
  return {
    summary: source.slice(0, 3).join(' / '),
    decisions: decisionLines.length ? decisionLines.slice(0, 4) : ['Human review required'],
    issues: issueLines.length ? issueLines.slice(0, 4) : ['No issue identified in demo parsing'],
    actions: actionLines.length ? actionLines.slice(0, 4) : ['Assign owner and due date'],
    citations: [
      ...source.slice(0, 3).map((line, index) => `NOTE-${index + 1}: ${line}`),
      ...(audioName ? [`AUDIO-01: ${audioName}`] : []),
    ],
  };
};

export function AiMeetingWorkspace() {
  const { brandWorkspace, locale, setLocale } = useHandoffLocale();
  const t = copy[locale];
  const [notes, setNotes] = useState('');
  const [audio, setAudio] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [classification, setClassification] = useState<'INTERNAL' | 'RESTRICTED_LEGAL'>('INTERNAL');
  const [linkType, setLinkType] = useState<'PROJECT' | 'CLAIM'>('PROJECT');
  const [linkId, setLinkId] = useState('');
  const [jobState, setJobState] = useState<JobState>('READY');
  const [message, setMessage] = useState('');
  const [minutes, setMinutes] = useState<StructuredMinutes | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);

  const providerReady = process.env.NEXT_PUBLIC_AI_PROVIDER_READY === 'true';
  const privateProviderReady =
    process.env.NEXT_PUBLIC_PRIVATE_AI_PROVIDER_READY === 'true';
  const adapterReady = process.env.NEXT_PUBLIC_AI_ADAPTER_READY === 'true';
  const boundary = getFrontendModuleBoundary('AI_ASSISTANT', {
    locale,
    adapterReady,
    providerRequired: true,
    providerState:
      providerReady &&
      (classification === 'INTERNAL' || privateProviderReady)
        ? 'READY'
        : 'NOT_CONFIGURED',
  });

  const sourceCount = useMemo(
    () => notes.trim().split(/\s+/).filter(Boolean).length,
    [notes],
  );

  const reset = () => {
    setNotes('');
    setAudio(null);
    setConsent(false);
    setLinkId('');
    setJobState('READY');
    setMessage('');
    setMinutes(null);
    setReviewed(false);
    setCandidates([]);
  };

  const runJob = async () => {
    if (!notes.trim() && !audio) {
      setJobState('BLOCKED');
      setMessage(t.sourceRequired);
      return;
    }
    if (audio && !consent) {
      setJobState('BLOCKED');
      setMessage(t.consentRequired);
      return;
    }
    if (!boundary.canMutate) {
      setJobState('BLOCKED');
      setMessage(boundary.message || t.providerBlocked);
      return;
    }

    setJobState('QUEUED');
    const result = await executeFrontendMutation(boundary, {
      simulate: () => buildDemoMinutes(notes, audio?.name),
    });
    if (result.kind === 'BLOCKED') {
      setJobState('BLOCKED');
      setMessage(result.message);
      return;
    }
    setMinutes(result.data);
    setReviewed(false);
    setCandidates([]);
    setJobState('REVIEW_REQUIRED');
    setMessage(t.demoQueued);
  };

  const toggleCandidate = (candidate: string) => {
    setCandidates((current) =>
      current.includes(candidate)
        ? current.filter((item) => item !== candidate)
        : [...current, candidate],
    );
  };

  const saveMinute = async () => {
    if (!reviewed || !linkId.trim() || !minutes) {
      setJobState('BLOCKED');
      setMessage(t.saveBlocked);
      return;
    }
    const result = await executeFrontendMutation(boundary, {
      simulate: () => ({
        companyId: brandWorkspace,
        linkType,
        canonicalId: linkId.trim(),
        classification,
        candidateTypes: candidates,
      }),
    });
    if (result.kind === 'BLOCKED') {
      setJobState('BLOCKED');
      setMessage(result.message);
      return;
    }
    setJobState('CANDIDATE_READY');
    setMessage(t.savedDemo);
  };

  const candidateItems = [
    { id: 'TASK', label: t.task, icon: ListTodo },
    { id: 'CALENDAR', label: t.calendar, icon: CalendarPlus },
    { id: 'APPROVAL', label: t.approval, icon: Gavel },
    { id: 'DRIVE', label: t.drive, icon: FolderUp },
  ];

  return (
    <main className="space-y-5 pb-10">
      <section className="border border-[var(--color-border)] bg-[#16294d] px-5 py-6 text-white shadow-[0_18px_45px_rgba(18,40,80,.2)] sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="flex items-center gap-2 text-[11px] font-black tracking-[.18em] text-[#8bc8ff]">
              <Sparkles className="h-4 w-4" />
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
          {[t.source, t.link, t.result, t.candidates].map((step, index) => (
            <div
              key={step}
              className="border border-white/15 bg-white/[.07] px-3 py-3 text-xs font-black"
            >
              <span className="mr-2 text-[#8bc8ff]">0{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </section>

      <RuntimeCapabilityPanel boundary={boundary} />

      <section className="grid gap-5 xl:grid-cols-[minmax(360px,.78fr)_minmax(560px,1.22fr)]">
        <div className="space-y-5">
          <article className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_14px_34px_rgba(25,45,82,.07)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[var(--color-text-main)]">
                {t.source}
              </h2>
              <span className="text-[10px] font-black text-[var(--color-text-sub)]">
                {sourceCount} words
              </span>
            </div>
            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-black text-[var(--color-text-sub)]">
                {t.notes}
              </span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={t.notesPlaceholder}
                className="min-h-44 w-full resize-y border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm font-semibold leading-6 text-[var(--color-text-main)] outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="mt-3 flex min-h-14 cursor-pointer items-center gap-3 border border-dashed border-blue-200 bg-blue-50/60 px-4">
              <span className="flex h-9 w-9 items-center justify-center bg-white text-blue-700">
                <FileAudio className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-xs font-black text-blue-950">
                  {audio?.name || t.chooseAudio}
                </strong>
                <span className="mt-1 block text-[10px] font-semibold text-blue-700">
                  {t.audio}
                </span>
              </span>
              <input
                type="file"
                accept="audio/*"
                className="sr-only"
                onChange={(event) => {
                  setAudio(event.target.files?.[0] || null);
                  event.currentTarget.value = '';
                }}
              />
            </label>

            <label className="mt-3 flex gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 accent-blue-700"
              />
              <span className="text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
                {t.consent}
              </span>
            </label>
          </article>

          <article className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_14px_34px_rgba(25,45,82,.07)]">
            <h2 className="text-lg font-black text-[var(--color-text-main)]">
              {t.link}
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-[11px] font-black text-[var(--color-text-sub)]">
                  {t.linkType}
                </span>
                <select
                  value={linkType}
                  onChange={(event) =>
                    setLinkType(event.target.value as 'PROJECT' | 'CLAIM')
                  }
                  className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold"
                >
                  <option value="PROJECT">{t.project}</option>
                  <option value="CLAIM">{t.claim}</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-[11px] font-black text-[var(--color-text-sub)]">
                  {t.linkId}
                </span>
                <input
                  value={linkId}
                  onChange={(event) => setLinkId(event.target.value)}
                  placeholder={linkType === 'PROJECT' ? 'projectId' : 'claimId'}
                  className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-[11px] font-black text-[var(--color-text-sub)]">
                  {t.classification}
                </span>
                <select
                  value={classification}
                  onChange={(event) =>
                    setClassification(
                      event.target.value as 'INTERNAL' | 'RESTRICTED_LEGAL',
                    )
                  }
                  className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-bold"
                >
                  <option value="INTERNAL">{t.internal}</option>
                  <option value="RESTRICTED_LEGAL">{t.restricted}</option>
                </select>
              </label>
            </div>
            <div className="mt-4 border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-900">
              <ShieldCheck className="mb-2 h-5 w-5" />
              {t.providerPolicy}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => void runJob()}
                className="flex min-h-11 flex-1 items-center justify-center gap-2 bg-[#235ec7] px-4 text-xs font-black text-white"
              >
                <Play className="h-4 w-4" />
                {t.run}
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex min-h-11 items-center gap-2 border border-[var(--color-border)] px-4 text-xs font-black text-[var(--color-text-sub)]"
              >
                <RotateCcw className="h-4 w-4" />
                {t.reset}
              </button>
            </div>
          </article>
        </div>

        <div className="space-y-5">
          <article className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_14px_34px_rgba(25,45,82,.07)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[var(--color-text-main)]">
                {t.result}
              </h2>
              <span
                className={`flex items-center gap-2 border px-3 py-1 text-[10px] font-black ${stateStyle[jobState]}`}
              >
                {jobState === 'QUEUED' ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : jobState === 'BLOCKED' ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : jobState === 'CANDIDATE_READY' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Bot className="h-3.5 w-3.5" />
                )}
                {t.status}: {jobState}
              </span>
            </div>
            {message && (
              <p
                role={jobState === 'BLOCKED' ? 'alert' : 'status'}
                className={`mt-4 border px-4 py-3 text-xs font-bold leading-5 ${stateStyle[jobState]}`}
              >
                {message}
              </p>
            )}

            {minutes ? (
              <div className="mt-5 space-y-4">
                <section className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <h3 className="flex items-center gap-2 text-sm font-black text-[var(--color-text-main)]">
                    <MessageSquareText className="h-4 w-4 text-blue-700" />
                    {t.summary}
                  </h3>
                  <textarea
                    value={minutes.summary}
                    onChange={(event) =>
                      setMinutes((current) =>
                        current ? { ...current, summary: event.target.value } : current,
                      )
                    }
                    className="mt-3 min-h-20 w-full resize-y border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm font-semibold leading-6"
                  />
                </section>
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { key: 'decisions', title: t.decisions, icon: Gavel },
                    { key: 'issues', title: t.issues, icon: AlertTriangle },
                    { key: 'actions', title: t.actions, icon: ClipboardCheck },
                  ].map((group) => {
                    const Icon = group.icon;
                    const values = minutes[group.key as 'decisions' | 'issues' | 'actions'];
                    return (
                      <section
                        key={group.key}
                        className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4"
                      >
                        <h3 className="flex items-center gap-2 text-xs font-black text-[var(--color-text-main)]">
                          <Icon className="h-4 w-4 text-blue-700" />
                          {group.title}
                        </h3>
                        <ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
                          {values.map((value, index) => (
                            <li key={`${group.key}-${index}`}>• {value}</li>
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>
                <details className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
                  <summary className="cursor-pointer text-xs font-black text-[var(--color-text-main)]">
                    {t.citations}
                  </summary>
                  <ul className="mt-3 space-y-2 text-[11px] font-semibold text-[var(--color-text-sub)]">
                    {minutes.citations.map((citation) => (
                      <li key={citation}>{citation}</li>
                    ))}
                  </ul>
                </details>
                <label className="flex gap-3 border border-blue-200 bg-blue-50 p-4">
                  <input
                    type="checkbox"
                    checked={reviewed}
                    onChange={(event) => setReviewed(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-blue-700"
                  />
                  <span className="text-xs font-black text-blue-950">{t.review}</span>
                </label>
              </div>
            ) : (
              <div className="mt-5 flex min-h-72 items-center justify-center border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] text-center">
                <div>
                  <FileText className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="mt-3 text-sm font-black text-[var(--color-text-main)]">
                    {t.empty}
                  </p>
                </div>
              </div>
            )}
          </article>

          <article className="border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_14px_34px_rgba(25,45,82,.07)]">
            <h2 className="text-lg font-black text-[var(--color-text-main)]">
              {t.candidates}
            </h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
              {t.candidateNotice}
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {candidateItems.map((item) => {
                const Icon = item.icon;
                const selected = candidates.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!minutes}
                    aria-pressed={selected}
                    onClick={() => toggleCandidate(item.id)}
                    className={`flex min-h-16 items-center gap-3 border px-3 text-left text-xs font-black disabled:cursor-not-allowed disabled:opacity-45 ${
                      selected
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-main)]'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => void saveMinute()}
              disabled={!minutes}
              className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 bg-[#eb6300] px-5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {t.save}
              <Link2 className="h-4 w-4" />
            </button>
          </article>
        </div>
      </section>
    </main>
  );
}
