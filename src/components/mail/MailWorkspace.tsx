'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlarmClock,
  Archive,
  CircleAlert,
  Folder,
  Forward,
  Inbox,
  MailOpen,
  PanelLeftOpen,
  Paperclip,
  PenLine,
  RefreshCw,
  Reply,
  ReplyAll,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { MailNavigationPanel } from '@/components/mail/MailNavigationPanel';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
  type FrontendLocale,
} from '@/lib/frontendDataSource';
import { getRuntimeBoundaryCopy } from '@/lib/runtimeBoundaryCopy';
import { getMailSendBoundary } from '@/lib/runtimeExecutionMode';
import { readEstimateMailDraft } from '@/lib/estimateMailDraft';
import {
  getMailFolderHref,
  getMailFolderLabel,
  parseMailFolder,
  type MailFolderId,
} from '@/lib/mailNavigation';

type Mailbox = MailFolderId;
type StoredMailbox = 'INBOX' | 'SENT' | 'PENDING' | 'DRAFT' | 'SPAM' | 'TRASH';
type WorkspaceId = 'CON_COST' | 'VIET_QS';
type ComposeMode = 'NEW' | 'REPLY' | 'REPLY_ALL' | 'FORWARD';

interface MailAttachment {
  id: string;
  name: string;
  status: 'READY';
}

interface MailMessage {
  id: string;
  workspaceId: WorkspaceId;
  sender: string;
  email: string;
  subject: string;
  preview: string;
  time: string;
  box: StoredMailbox;
  unread: boolean;
  starred: boolean;
  reminder: boolean;
  projectId?: string;
  projectName?: string;
  attachments: MailAttachment[];
}

interface MailCopy {
  eyebrow: string;
  title: string;
  description: string;
  compose: string;
  memo: string;
  unread: string;
  important: string;
  reminder: string;
  archived: string;
  folders: Record<'ALL' | StoredMailbox, string>;
  projectFolders: string;
  search: string;
  empty: string;
  read: string;
  remove: string;
  spam: string;
  reply: string;
  replyAll: string;
  forward: string;
  move: string;
  messages: string;
  detail: string;
  attachments: string;
  open: string;
  close: string;
  recipient: string;
  subject: string;
  body: string;
  send: string;
  newMail: string;
  projectLink: string;
  noProject: string;
  demoResult: string;
  serverBlocked: string;
}

const COPY: Record<FrontendLocale, MailCopy> = {
  ko: {
    eyebrow: 'CON-COST BUSINESS MAIL',
    title: '전자메일',
    description: '업무 메일과 프로젝트 문서를 빠르게 분류하고 후속 업무로 연결합니다.',
    compose: '메일쓰기',
    memo: '메모쓰기',
    unread: '안 읽은 메일',
    important: '중요 메일',
    reminder: '리마인드',
    archived: '전체 보관',
    folders: {
      ALL: '전체메일',
      INBOX: '받은편지함',
      SENT: '보낸편지함',
      PENDING: '수신확인',
      DRAFT: '임시보관함',
      SPAM: '스팸메일함',
      TRASH: '휴지통',
    },
    projectFolders: '프로젝트 메일함',
    search: '보낸 사람, 제목, 내용, 프로젝트 검색',
    empty: '표시할 메일이 없습니다.',
    read: '읽음',
    remove: '삭제',
    spam: '스팸신고',
    reply: '답장',
    replyAll: '전체답장',
    forward: '전달',
    move: '이동',
    messages: '개 메일',
    detail: '메일 상세',
    attachments: '첨부파일',
    open: '열기',
    close: '닫기',
    recipient: '받는 사람',
    subject: '제목',
    body: '메일 내용을 입력하세요.',
    send: '보내기',
    newMail: '새 메일',
    projectLink: '프로젝트 연결',
    noProject: '프로젝트 연결 없음',
    demoResult: 'DEMO_LOCAL 시뮬레이션만 완료했습니다. 실제 메일은 발송되지 않았습니다.',
    serverBlocked: '메일 Provider와 Backend Adapter가 준비되어야 발송할 수 있습니다.',
  },
  vi: {
    eyebrow: 'VIET QS BUSINESS MAIL',
    title: 'Thư điện tử',
    description: 'Phân loại thư công việc, tài liệu dự án và kết nối công việc tiếp theo.',
    compose: 'Soạn thư',
    memo: 'Ghi chú',
    unread: 'Chưa đọc',
    important: 'Quan trọng',
    reminder: 'Nhắc việc',
    archived: 'Đã lưu',
    folders: {
      ALL: 'Tất cả thư',
      INBOX: 'Hộp thư đến',
      SENT: 'Đã gửi',
      PENDING: 'Theo dõi nhận',
      DRAFT: 'Bản nháp',
      SPAM: 'Thư rác',
      TRASH: 'Thùng rác',
    },
    projectFolders: 'Thư theo dự án',
    search: 'Tìm người gửi, tiêu đề, nội dung hoặc dự án',
    empty: 'Không có thư để hiển thị.',
    read: 'Đã đọc',
    remove: 'Xóa',
    spam: 'Báo spam',
    reply: 'Trả lời',
    replyAll: 'Trả lời tất cả',
    forward: 'Chuyển tiếp',
    move: 'Di chuyển',
    messages: ' thư',
    detail: 'Chi tiết thư',
    attachments: 'Tệp đính kèm',
    open: 'Mở',
    close: 'Đóng',
    recipient: 'Người nhận',
    subject: 'Tiêu đề',
    body: 'Nhập nội dung thư.',
    send: 'Gửi',
    newMail: 'Thư mới',
    projectLink: 'Liên kết dự án',
    noProject: 'Không liên kết dự án',
    demoResult: 'Chỉ hoàn tất mô phỏng DEMO_LOCAL. Thư chưa được gửi.',
    serverBlocked: 'Cần Mail Provider và Backend Adapter trước khi gửi.',
  },
  en: {
    eyebrow: 'BUSINESS MAIL',
    title: 'Email',
    description: 'Organize business mail and project documents, then connect follow-up work.',
    compose: 'Compose',
    memo: 'Memo',
    unread: 'Unread',
    important: 'Important',
    reminder: 'Reminder',
    archived: 'Archived',
    folders: {
      ALL: 'All mail',
      INBOX: 'Inbox',
      SENT: 'Sent',
      PENDING: 'Receipt tracking',
      DRAFT: 'Drafts',
      SPAM: 'Spam',
      TRASH: 'Trash',
    },
    projectFolders: 'Project mail',
    search: 'Search sender, subject, content, or project',
    empty: 'No mail to display.',
    read: 'Read',
    remove: 'Delete',
    spam: 'Report spam',
    reply: 'Reply',
    replyAll: 'Reply all',
    forward: 'Forward',
    move: 'Move',
    messages: ' messages',
    detail: 'Mail detail',
    attachments: 'Attachments',
    open: 'Open',
    close: 'Close',
    recipient: 'Recipient',
    subject: 'Subject',
    body: 'Write your message.',
    send: 'Send',
    newMail: 'New mail',
    projectLink: 'Project link',
    noProject: 'No project link',
    demoResult: 'Only the DEMO_LOCAL simulation completed. No mail was sent.',
    serverBlocked: 'A Mail Provider and Backend Adapter are required before sending.',
  },
};

const INITIAL_MESSAGES: MailMessage[] = [
  {
    id: 'mail-cc-001',
    workspaceId: 'CON_COST',
    sender: 'CON-COST IT지원팀',
    email: 'it@example.invalid',
    subject: '신규 협업 메신저 개설 완료 안내',
    preview: '그룹웨어 메신저 Pilot 신청 상태를 확인해 주세요.',
    time: '09:42',
    box: 'INBOX',
    unread: true,
    starred: false,
    reminder: false,
    projectId: 'project-system-pilot',
    projectName: '시스템 Pilot',
    attachments: [],
  },
  {
    id: 'mail-cc-002',
    workspaceId: 'CON_COST',
    sender: '기술본부',
    email: 'technical@example.invalid',
    subject: '송파 복합시설 견적 검토 요청',
    preview: '견적서 2차 검토 의견과 수정 범위를 확인해 주세요.',
    time: '08:18',
    box: 'INBOX',
    unread: true,
    starred: true,
    reminder: true,
    projectId: 'project-songpa-001',
    projectName: '송파 복합시설',
    attachments: [
      { id: 'file-mail-001', name: '견적_검토자료.pdf', status: 'READY' },
    ],
  },
  {
    id: 'mail-cc-003',
    workspaceId: 'CON_COST',
    sender: '나 → 발주처',
    email: 'client@example.invalid',
    subject: '최종 납품자료 송부',
    preview: '최종 성과품과 검토 기록을 전달드립니다.',
    time: '7월 21일',
    box: 'SENT',
    unread: false,
    starred: false,
    reminder: false,
    projectId: 'project-delivery-001',
    projectName: '과천 지식정보타운',
    attachments: [
      { id: 'file-mail-002', name: '납품목록.pdf', status: 'READY' },
      { id: 'file-mail-003', name: '검토이력.xlsx', status: 'READY' },
    ],
  },
  {
    id: 'mail-vq-001',
    workspaceId: 'VIET_QS',
    sender: 'VIET QS Structure',
    email: 'structure@example.invalid',
    subject: 'RFI response / structural quantity',
    preview: 'Revised quantity sheet and review notes are ready.',
    time: '09:10',
    box: 'INBOX',
    unread: true,
    starred: true,
    reminder: false,
    projectId: 'project-vq-danang-001',
    projectName: 'Đà Nẵng Resort',
    attachments: [
      { id: 'file-mail-vq-001', name: 'rfi-response.pdf', status: 'READY' },
    ],
  },
  {
    id: 'mail-vq-002',
    workspaceId: 'VIET_QS',
    sender: 'VIET QS PMO',
    email: 'pmo@example.invalid',
    subject: 'Lịch họp điều phối dự án',
    preview: 'Vui lòng xác nhận lịch họp và danh sách công việc.',
    time: 'Hôm qua',
    box: 'INBOX',
    unread: false,
    starred: false,
    reminder: true,
    projectId: 'project-vq-danang-001',
    projectName: 'Đà Nẵng Resort',
    attachments: [],
  },
];

export function MailWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { brandWorkspace, locale, setLocale } = useHandoffLocale();
  const workspaceId: WorkspaceId =
    brandWorkspace === 'VIET_QS' ? 'VIET_QS' : 'CON_COST';
  const copy = COPY[locale];
  const requestedMailbox = searchParams.get('box');
  const requestedProjectId = searchParams.get('projectId');
  const requestedComposeMode = searchParams.get('compose');
  const requestedDraftToken = searchParams.get('draft');
  const mailbox = parseMailFolder(requestedMailbox);
  const projectFilter =
    mailbox === 'PROJECT' ? (requestedProjectId ?? '') : '';
  const currentFolderLabel = getMailFolderLabel(mailbox, locale);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [selected, setSelected] = useState<string[]>([]);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<ComposeMode | null>(null);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [composeProjectId, setComposeProjectId] = useState('');
  const [composeFiles, setComposeFiles] = useState<string[]>([]);
  const [operationMessage, setOperationMessage] = useState<{
    kind: 'info' | 'error';
    text: string;
  } | null>(null);

  const boundary = getFrontendModuleBoundary('MAIL', {
    locale,
    providerRequired: true,
    providerState:
      process.env.NEXT_PUBLIC_MAIL_PROVIDER_READY === 'true'
        ? 'READY'
        : 'NOT_CONFIGURED',
    adapterReady: process.env.NEXT_PUBLIC_MAIL_ADAPTER_READY === 'true',
  });
  const runtimeMode = boundary.mode;
  const scopedMessages = useMemo(
    () =>
      boundary.state === 'DEMO_SIMULATION'
        ? messages.filter((message) => message.workspaceId === workspaceId)
        : [],
    [boundary.state, messages, workspaceId],
  );
  const visible = useMemo(
    () =>
      scopedMessages.filter((message) => {
        const haystack =
          `${message.sender} ${message.subject} ${message.preview} ${message.projectName ?? ''}`.toLowerCase();
        const inMailbox =
          mailbox === 'ALL' ||
          message.box === mailbox ||
          (mailbox === 'STARRED' && message.starred) ||
          (mailbox === 'PROJECT' && Boolean(message.projectId));
        const inProject =
          !projectFilter || message.projectId === projectFilter;
        return (
          inMailbox &&
          inProject &&
          (!query.trim() || haystack.includes(query.trim().toLowerCase()))
        );
      }),
    [mailbox, projectFilter, query, scopedMessages],
  );
  const activeMessage =
    scopedMessages.find((message) => message.id === activeMessageId) ?? null;
  const unread = scopedMessages.filter(
    (message) => message.unread && message.box === 'INBOX',
  ).length;
  const starred = scopedMessages.filter((message) => message.starred).length;
  const reminders = scopedMessages.filter((message) => message.reminder).length;
  const allSelected =
    visible.length > 0 &&
    visible.every((message) => selected.includes(message.id));
  const projects = useMemo(() => {
    const unique = new Map<string, string>();
    scopedMessages.forEach((message) => {
      if (message.projectId && message.projectName) {
        unique.set(message.projectId, message.projectName);
      }
    });
    return Array.from(unique, ([id, name]) => ({ id, name }));
  }, [scopedMessages]);
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSelected([]);
      setActiveMessageId(null);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [mailbox, projectFilter, workspaceId]);

  useEffect(() => {
    if (!['NEW', 'MEMO'].includes(requestedComposeMode ?? '')) return;
    const timeoutId = window.setTimeout(() => {
      const estimateDraft = requestedDraftToken
        ? readEstimateMailDraft(requestedDraftToken, workspaceId)
        : null;
      setComposeMode('NEW');
      setComposeTo(estimateDraft?.to || '');
      setComposeSubject(estimateDraft?.subject || (requestedComposeMode === 'MEMO' ? '[Memo] ' : ''));
      setComposeBody(estimateDraft?.body || '');
      setComposeProjectId(estimateDraft?.projectId || '');
      setComposeFiles(estimateDraft?.attachmentNames || []);
      setOperationMessage(null);
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [requestedComposeMode, requestedDraftToken, workspaceId]);

  const navigateToMailbox = (nextMailbox: Mailbox) => {
    router.push(getMailFolderHref(nextMailbox));
  };

  const patchSelected = (patch: Partial<MailMessage>) => {
    setMessages((items) =>
      items.map((item) =>
        item.workspaceId === workspaceId && selected.includes(item.id)
          ? { ...item, ...patch }
          : item,
      ),
    );
  };

  const moveSelected = (box: MailMessage['box']) => {
    patchSelected({ box });
    setSelected([]);
    setOperationMessage({
      kind: 'info',
      text:
        boundary.mode === 'DEMO_LOCAL'
          ? copy.demoResult
          : copy.serverBlocked,
    });
  };

  const openComposer = (mode: ComposeMode) => {
    const source =
      scopedMessages.find((message) => selected.includes(message.id)) ??
      activeMessage;
    setComposeMode(mode);
    setComposeTo(
      mode === 'NEW' || mode === 'FORWARD' ? '' : source?.email ?? '',
    );
    setComposeSubject(
      mode === 'NEW'
        ? ''
        : `${mode === 'FORWARD' ? 'Fwd' : 'Re'}: ${source?.subject ?? ''}`,
    );
    setComposeBody('');
    setComposeProjectId(source?.projectId ?? '');
    setComposeFiles([]);
    setOperationMessage(null);
  };

  const openMessage = (message: MailMessage) => {
    setActiveMessageId(message.id);
    setMessages((items) =>
      items.map((item) =>
        item.id === message.id ? { ...item, unread: false } : item,
      ),
    );
  };

  const attachFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setComposeFiles(
      Array.from(event.target.files ?? [], (file) => file.name),
    );
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sendBoundary = getMailSendBoundary(runtimeMode);
    const boundaryCopy = getRuntimeBoundaryCopy('MAIL',
      sendBoundary.kind,
      locale === 'vi' ? 'vi' : 'ko',
    );
    if (sendBoundary.kind === 'BLOCKED') {
      setOperationMessage({ kind: 'error', text: boundaryCopy });
      return;
    }
    const result = await executeFrontendMutation(boundary, {
      simulate: () => ({
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
        projectId: composeProjectId || null,
        attachmentCount: composeFiles.length,
      }),
    });
    if (result.kind === 'BLOCKED') {
      setOperationMessage({ kind: 'error', text: copy.serverBlocked });
      return;
    }
    setOperationMessage({ kind: 'info', text: boundaryCopy });
    setComposeMode(null);
  };

  return (
    <div className="min-w-0 space-y-4">
      <section className="cc-page-heading flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase text-[var(--color-primary)]">
            {copy.eyebrow}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[28px] font-black text-[var(--color-text-main)]">
              {copy.title}
            </h1>
            <span className="border-l-2 border-[var(--color-primary)] pl-2 text-[11px] font-black text-[var(--color-primary)]">
              {currentFolderLabel}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[var(--color-text-sub)]">
            {copy.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFoldersOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-xs font-black xl:hidden"
            aria-haspopup="dialog"
          >
            <PanelLeftOpen className="h-4 w-4" />
            {currentFolderLabel}
          </button>
          <HandoffLanguageToggle locale={locale} onChange={setLocale} />
          <button
            type="button"
            onClick={() => openComposer('NEW')}
            className="inline-flex min-h-11 items-center gap-2 bg-[var(--color-primary)] px-5 text-sm font-black text-white"
          >
            <PenLine className="h-4 w-4" />
            {copy.compose}
          </button>
        </div>
      </section>

      {mobileFoldersOpen && (
        <div
          className="fixed inset-0 z-[110] bg-slate-950/45 xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={copy.title}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setMobileFoldersOpen(false);
            }
          }}
        >
          <aside className="cc-scrollbar h-full w-[min(88vw,320px)] overflow-y-auto bg-[#fff5eb] p-4 shadow-2xl">
            <header className="mb-4 flex items-center justify-between border-b border-[#efdcc9] pb-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#b5957e]">
                  {copy.eyebrow}
                </p>
                <h2 className="mt-1 text-lg font-black">{copy.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileFoldersOpen(false)}
                aria-label={copy.close}
                className="grid h-10 w-10 place-items-center rounded-xl border border-[#efd5c0] bg-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <MailNavigationPanel
              onNavigate={() => setMobileFoldersOpen(false)}
            />
          </aside>
        </div>
      )}

      <RuntimeCapabilityPanel boundary={boundary} compact />

      {operationMessage && (
        <div
          role="status"
          className={`border px-4 py-3 text-xs font-bold ${
            operationMessage.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {operationMessage.text}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Inbox, label: copy.unread, value: unread, folder: 'INBOX' },
          {
            icon: Star,
            label: copy.important,
            value: starred,
            folder: 'STARRED',
          },
          {
            icon: AlarmClock,
            label: copy.reminder,
            value: reminders,
            folder: 'INBOX',
          },
          {
            icon: Archive,
            label: copy.archived,
            value: scopedMessages.filter(
              (message) => !['TRASH', 'SPAM'].includes(message.box),
            ).length,
            folder: 'ALL',
          },
        ].map((card) => {
          const ItemIcon = card.icon;
          return (
            <button
              type="button"
              key={card.label}
              className="cc-tactile-card flex min-h-[88px] items-center gap-4 p-4 text-left transition hover:-translate-y-0.5"
              onClick={() => navigateToMailbox(card.folder as Mailbox)}
            >
              <span className="grid h-10 w-10 place-items-center bg-[#eef2ff] text-[#4e6fd8]">
                <ItemIcon className="h-5 w-5" />
              </span>
              <span>
                <span className="text-[11px] font-black text-[var(--color-text-sub)]">
                  {card.label}
                </span>
                <strong className="mt-1 block text-2xl font-black">
                  {card.value}
                </strong>
              </span>
            </button>
          );
        })}
      </section>

      <section
        data-mail-main-content
        className="min-h-[620px] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_12px_30px_rgba(44,54,74,.08)]"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
            <input
              type="checkbox"
              aria-label="Select all"
              checked={allSelected}
              onChange={() =>
                setSelected(allSelected ? [] : visible.map((item) => item.id))
              }
            />
            <MailAction
              icon={MailOpen}
              label={copy.read}
              onClick={() => {
                patchSelected({ unread: false });
                setSelected([]);
              }}
              disabled={!selected.length}
            />
            <MailAction
              icon={Trash2}
              label={copy.remove}
              onClick={() => moveSelected('TRASH')}
              disabled={!selected.length}
            />
            <MailAction
              icon={CircleAlert}
              label={copy.spam}
              onClick={() => moveSelected('SPAM')}
              disabled={!selected.length}
            />
            <MailAction
              icon={Reply}
              label={copy.reply}
              onClick={() => openComposer('REPLY')}
              disabled={!selected.length}
            />
            <MailAction
              icon={ReplyAll}
              label={copy.replyAll}
              onClick={() => openComposer('REPLY_ALL')}
              disabled={!selected.length}
            />
            <MailAction
              icon={Forward}
              label={copy.forward}
              onClick={() => openComposer('FORWARD')}
              disabled={!selected.length}
            />
            <MailAction
              icon={AlarmClock}
              label={copy.reminder}
              onClick={() => {
                patchSelected({ reminder: true });
                setSelected([]);
              }}
              disabled={!selected.length}
            />
            <span className="ml-auto text-[10px] font-bold text-[var(--color-text-sub)]">
              {visible.length}
              {copy.messages}
            </span>
            <button
              type="button"
              title="Refresh"
              className="grid h-9 w-9 place-items-center border border-[var(--color-border)]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-[var(--color-border)] p-3">
            <label className="flex min-h-10 items-center bg-[var(--cc-surface-2)] px-3">
              <Search className="mr-2 h-4 w-4 text-[var(--color-text-sub)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={copy.search}
                className="w-full bg-transparent text-xs font-semibold outline-none"
                placeholder={copy.search}
              />
            </label>
          </div>

          <div
            className={
              activeMessage ? 'grid xl:grid-cols-[minmax(0,1fr)_390px]' : ''
            }
          >
            <div className="min-w-0 divide-y divide-[var(--color-border)]">
              {visible.length === 0 ? (
                <div className="grid min-h-64 place-items-center text-sm font-semibold text-[var(--color-text-sub)]">
                  {copy.empty}
                </div>
              ) : (
                visible.map((message) => (
                  <article
                    key={message.id}
                    className={`grid min-h-[62px] grid-cols-[auto_auto_minmax(100px,.25fr)_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-2 hover:bg-[#f4f7fb] dark:hover:bg-white/[.03] ${
                      activeMessageId === message.id
                        ? 'bg-[#eef4ff] ring-1 ring-inset ring-[#b9c9ef]'
                        : message.unread
                          ? 'bg-white dark:bg-white/[.02]'
                          : 'bg-[#fafbfc] dark:bg-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      aria-label={`${message.subject} select`}
                      checked={selected.includes(message.id)}
                      onChange={() =>
                        setSelected((ids) =>
                          ids.includes(message.id)
                            ? ids.filter((id) => id !== message.id)
                            : [...ids, message.id],
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label="Star"
                      onClick={() =>
                        setMessages((items) =>
                          items.map((item) =>
                            item.id === message.id
                              ? { ...item, starred: !item.starred }
                              : item,
                          ),
                        )
                      }
                    >
                      <Star
                        className={`h-4 w-4 ${
                          message.starred
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                    <strong
                      className={`truncate text-xs ${
                        message.unread
                          ? 'font-black text-[#111827]'
                          : 'font-semibold text-[var(--color-text-sub)]'
                      }`}
                    >
                      {message.sender}
                    </strong>
                    <button
                      type="button"
                      onClick={() => openMessage(message)}
                      className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <span className="flex items-center gap-2">
                        <strong className="truncate text-xs">
                          {message.subject}
                        </strong>
                        {message.attachments.length > 0 && (
                          <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        )}
                        {message.reminder && (
                          <AlarmClock className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[10px] text-[var(--color-text-sub)]">
                        {message.projectName && (
                          <b className="mr-2 text-[#4e6fd8]">
                            [{message.projectName}]
                          </b>
                        )}
                        {message.preview}
                      </span>
                    </button>
                    <span className="whitespace-nowrap text-[10px] font-bold text-[var(--color-text-sub)]">
                      {message.time}
                    </span>
                  </article>
                ))
              )}
            </div>

            {activeMessage && (
              <aside className="border-t border-[var(--color-border)] bg-[var(--color-surface)] xl:border-l xl:border-t-0">
                <header className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] p-4">
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-[#4e6fd8]">
                      {copy.detail}
                    </p>
                    <h2 className="mt-2 text-base font-black leading-6">
                      {activeMessage.subject}
                    </h2>
                  </div>
                  <button
                    type="button"
                    aria-label={copy.close}
                    onClick={() => setActiveMessageId(null)}
                    className="grid h-9 w-9 shrink-0 place-items-center border border-[var(--color-border)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </header>
                <div className="space-y-5 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#243b78] text-xs font-black text-white">
                      {activeMessage.sender.slice(0, 1)}
                    </span>
                    <div className="min-w-0">
                      <strong className="block truncate text-xs">
                        {activeMessage.sender}
                      </strong>
                      <span className="block truncate text-[10px] text-[var(--color-text-sub)]">
                        {activeMessage.email}
                      </span>
                    </div>
                    <time className="ml-auto text-[10px] font-bold text-[var(--color-text-sub)]">
                      {activeMessage.time}
                    </time>
                  </div>

                  {activeMessage.projectId && (
                    <Link
                      href={`/projects?projectId=${encodeURIComponent(activeMessage.projectId)}`}
                      className="inline-flex min-h-9 items-center gap-2 border border-blue-200 bg-blue-50 px-3 text-[10px] font-black text-blue-800"
                    >
                      <Folder className="h-3.5 w-3.5" />
                      {activeMessage.projectName}
                    </Link>
                  )}

                  <div className="min-h-36 whitespace-pre-wrap border-y border-[var(--color-border)] py-5 text-sm font-medium leading-7">
                    {activeMessage.preview}
                  </div>

                  {activeMessage.attachments.length > 0 && (
                    <section>
                      <h3 className="text-[10px] font-black text-[var(--color-text-sub)]">
                        {copy.attachments} {activeMessage.attachments.length}
                      </h3>
                      <div className="mt-2 space-y-2">
                        {activeMessage.attachments.map((attachment) => (
                          <button
                            type="button"
                            key={attachment.id}
                            className="flex min-h-10 w-full items-center gap-2 border border-[var(--color-border)] px-3 text-left text-[10px] font-bold hover:border-[#f2b27e]"
                          >
                            <Paperclip className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                            <span className="min-w-0 flex-1 truncate">
                              {attachment.name}
                            </span>
                            <span className="text-emerald-700">
                              {attachment.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => openComposer('REPLY')}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 bg-[var(--color-primary)] text-[10px] font-black text-white"
                    >
                      <Reply className="h-3.5 w-3.5" />
                      {copy.reply}
                    </button>
                    <button
                      type="button"
                      onClick={() => openComposer('REPLY_ALL')}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-[var(--color-border)] text-[10px] font-black"
                    >
                      <ReplyAll className="h-3.5 w-3.5" />
                      {copy.replyAll}
                    </button>
                    <button
                      type="button"
                      onClick={() => openComposer('FORWARD')}
                      className="inline-flex min-h-10 items-center justify-center gap-1.5 border border-[var(--color-border)] text-[10px] font-black"
                    >
                      <Forward className="h-3.5 w-3.5" />
                      {copy.forward}
                    </button>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </section>

      {composeMode && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-end bg-black/25 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setComposeMode(null);
          }}
        >
          <form
            onSubmit={sendMessage}
            className="w-full max-w-2xl overflow-hidden bg-[var(--color-surface)] shadow-2xl"
          >
            <header className="flex items-center justify-between bg-[#15213a] px-5 py-3 text-white">
              <h2 className="text-sm font-black">
                {composeMode === 'NEW'
                  ? copy.newMail
                  : composeMode === 'FORWARD'
                    ? copy.forward
                    : copy.reply}
              </h2>
              <button
                type="button"
                aria-label={copy.close}
                onClick={() => setComposeMode(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-3 p-5">
              <input
                required
                type="email"
                value={composeTo}
                onChange={(event) => setComposeTo(event.target.value)}
                className="min-h-10 w-full border border-[var(--color-border)] px-3 text-sm"
                placeholder={copy.recipient}
              />
              <input
                required
                value={composeSubject}
                onChange={(event) => setComposeSubject(event.target.value)}
                className="min-h-10 w-full border border-[var(--color-border)] px-3 text-sm"
                placeholder={copy.subject}
              />
              <select
                value={composeProjectId}
                onChange={(event) => setComposeProjectId(event.target.value)}
                className="min-h-10 w-full border border-[var(--color-border)] px-3 text-sm"
                aria-label={copy.projectLink}
              >
                <option value="">{copy.noProject}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name} · {project.id}
                  </option>
                ))}
              </select>
              <textarea
                name="body"
                required
                rows={8}
                value={composeBody}
                onChange={(event) => setComposeBody(event.target.value)}
                className="w-full border border-[var(--color-border)] p-3 text-sm"
                placeholder={copy.body}
              />
              <label className="flex min-h-10 cursor-pointer items-center gap-2 border border-dashed border-[var(--color-border)] px-3 text-xs font-bold">
                <Paperclip className="h-4 w-4" />
                {copy.attachments}
                <input
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={attachFiles}
                />
              </label>
              {composeFiles.length > 0 && (
                <ul className="space-y-1 text-[11px] text-[var(--color-text-sub)]">
                  {composeFiles.map((fileName) => (
                    <li key={fileName}>• {fileName}</li>
                  ))}
                </ul>
              )}
              <footer className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex min-h-10 items-center gap-2 bg-[var(--color-primary)] px-5 text-sm font-black text-white"
                >
                  <Send className="h-4 w-4" />
                  {copy.send}
                </button>
              </footer>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function MailAction({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Inbox;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 items-center gap-1.5 border border-[var(--color-border)] px-2.5 text-[10px] font-bold disabled:opacity-35"
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
