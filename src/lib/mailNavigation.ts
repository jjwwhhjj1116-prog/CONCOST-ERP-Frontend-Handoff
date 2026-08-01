import type { FrontendLocale } from '@/lib/frontendDataSource';

export type MailFolderId =
  | 'ALL'
  | 'INBOX'
  | 'SENT'
  | 'STARRED'
  | 'PENDING'
  | 'DRAFT'
  | 'MEMO'
  | 'SPAM'
  | 'TRASH'
  | 'USER'
  | 'PROJECT';

export type MailWorkspaceId = 'CON_COST' | 'VIET_QS';

export const MAIL_PRIMARY_FOLDERS: MailFolderId[] = [
  'ALL',
  'INBOX',
  'SENT',
  'STARRED',
  'PENDING',
  'DRAFT',
  'MEMO',
  'SPAM',
  'TRASH',
];

export const MAIL_USER_FOLDERS = [
  { id: 'FOLLOW_UP', labels: { ko: '후속 확인', vi: 'Cần theo dõi', en: 'Follow up' } },
  { id: 'TEAM_REVIEW', labels: { ko: '팀 검토', vi: 'Nhóm xem xét', en: 'Team review' } },
] as const;

const FOLDER_LABELS: Record<FrontendLocale, Record<MailFolderId, string>> = {
  ko: {
    ALL: '전체메일',
    INBOX: '받은편지함',
    SENT: '보낸편지함',
    STARRED: '중요메일',
    PENDING: '수신확인',
    DRAFT: '임시보관함',
    MEMO: '메모함',
    SPAM: '스팸',
    TRASH: '휴지통',
    USER: '사용자 폴더',
    PROJECT: '프로젝트 메일함',
  },
  vi: {
    ALL: 'Tất cả thư',
    INBOX: 'Hộp thư đến',
    SENT: 'Đã gửi',
    STARRED: 'Quan trọng',
    PENDING: 'Theo dõi nhận',
    DRAFT: 'Bản nháp',
    MEMO: 'Ghi chú',
    SPAM: 'Thư rác',
    TRASH: 'Thùng rác',
    USER: 'Thư mục cá nhân',
    PROJECT: 'Thư theo dự án',
  },
  en: {
    ALL: 'All mail',
    INBOX: 'Inbox',
    SENT: 'Sent',
    STARRED: 'Important',
    PENDING: 'Receipt tracking',
    DRAFT: 'Drafts',
    MEMO: 'Memos',
    SPAM: 'Spam',
    TRASH: 'Trash',
    USER: 'User folders',
    PROJECT: 'Project mailboxes',
  },
};

const PROJECT_FOLDERS: Record<
  MailWorkspaceId,
  Array<{ id: string; name: string }>
> = {
  CON_COST: [
    { id: 'project-songpa-001', name: '송파 복합시설' },
    { id: 'project-delivery-001', name: '과천 지식정보타운' },
    { id: 'project-system-pilot', name: '시스템 Pilot' },
  ],
  VIET_QS: [{ id: 'project-vq-danang-001', name: 'Đà Nẵng Resort' }],
};

export function parseMailFolder(value: string | null): MailFolderId {
  const allowed: MailFolderId[] = [
    ...MAIL_PRIMARY_FOLDERS,
    'USER',
    'PROJECT',
  ];
  return value && allowed.includes(value as MailFolderId)
    ? (value as MailFolderId)
    : 'ALL';
}

export function getMailFolderLabel(
  folder: MailFolderId,
  locale: FrontendLocale,
): string {
  return FOLDER_LABELS[locale][folder];
}

export function getMailFolderHref(
  folder: MailFolderId,
  options: { folderId?: string; projectId?: string; compose?: 'NEW' | 'MEMO' } = {},
): string {
  const params = new URLSearchParams();
  if (folder !== 'ALL') params.set('box', folder);
  if (options.folderId) params.set('folder', options.folderId);
  if (options.projectId) params.set('projectId', options.projectId);
  if (options.compose) params.set('compose', options.compose);
  const query = params.toString();
  return query ? `/mail?${query}` : '/mail';
}

export function getProjectMailFolders(workspaceId: MailWorkspaceId) {
  return PROJECT_FOLDERS[workspaceId];
}
