import type { CompanyId, PersonnelCard } from '@/types/models';

export type BoardLegacyCategory = 'CEO' | 'NOTICE_COMPANY' | 'NOTICE_HR' | 'NOTICE_EVENT' | 'PHOTO' | 'FREE' | 'LIBRARY';
export type BoardViewType = 'CLASSIC' | 'PREVIEW' | 'ALBUM' | 'FEED';
export type BoardScopeType = 'COMPANY' | 'ORGANIZATION' | 'MEMBERS';
export type BoardPostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED' | 'DELETED';
export type BoardCommentStatus = 'ACTIVE' | 'DELETED';
export type BoardAttachmentStatus = 'SELECTED' | 'QUEUED' | 'UPLOADING' | 'SCANNING' | 'READY' | 'FAILED';
export type BoardPermission = 'BOARD_READ' | 'BOARD_WRITE' | 'BOARD_COMMENT' | 'BOARD_NOTICE' | 'BOARD_MANAGE' | 'BOARD_EXPORT';
export type BoardReactionKind = 'LIKE' | 'CONFIRM' | 'THANKS' | 'CHEER';
export type BoardMutationCode = 'OK' | 'VALIDATION_ERROR' | 'FORBIDDEN' | 'NOT_FOUND' | 'REVISION_CONFLICT' | 'BACKEND_REQUIRED';
export type BoardLocale = 'ko' | 'vi' | 'en';

export interface LocalizedBoardText {
  ko: string;
  vi: string;
  en: string;
}

export interface BoardGroup {
  id: string;
  companyId: CompanyId;
  name: LocalizedBoardText;
  sortOrder: number;
  active: boolean;
}

export interface BoardDefinition {
  id: string;
  companyId: CompanyId;
  groupId: string | null;
  legacyCategory: BoardLegacyCategory;
  code: string;
  name: LocalizedBoardText;
  description: LocalizedBoardText;
  viewType: BoardViewType;
  scopeType: BoardScopeType;
  readableOrganizationNodeIds: string[];
  writableOrganizationNodeIds: string[];
  readablePersonnelIds: string[];
  writablePersonnelIds: string[];
  managerPersonnelIds: string[];
  allowComments: boolean;
  allowReplies: boolean;
  allowReactions: boolean;
  allowAttachments: boolean;
  noticePermission: 'ALL_WRITERS' | 'MANAGERS_ONLY';
  defaultNotify: boolean;
  active: boolean;
  sortOrder: number;
}

export interface BoardPost {
  id: string;
  companyId: CompanyId;
  boardId: string;
  sourcePostId?: string | null;
  title: string;
  contentHtml: string;
  contentText: string;
  authorId: string;
  authorNameSnapshot: string;
  authorOrganizationSnapshot?: string | null;
  status: BoardPostStatus;
  labelId?: string | null;
  isNotice: boolean;
  isMustRead: boolean;
  isPinned: boolean;
  noticeStartAt?: string | null;
  noticeEndAt?: string | null;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  allowComments: boolean;
  allowReactions: boolean;
  attachmentIds: string[];
  viewCount: number;
  commentCount: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BoardPostInput {
  boardId: string;
  title: string;
  contentText: string;
  status: Extract<BoardPostStatus, 'DRAFT' | 'SCHEDULED' | 'PUBLISHED'>;
  labelId?: string | null;
  isNotice: boolean;
  isMustRead: boolean;
  isPinned: boolean;
  noticeStartAt?: string | null;
  noticeEndAt?: string | null;
  scheduledAt?: string | null;
  allowComments: boolean;
  allowReactions: boolean;
  attachmentIds: string[];
  notify: boolean;
}

export interface BoardComment {
  id: string;
  companyId: CompanyId;
  postId: string;
  parentCommentId?: string | null;
  authorId: string;
  authorNameSnapshot: string;
  content: string;
  attachmentIds: string[];
  mentionedPersonnelIds: string[];
  status: BoardCommentStatus;
  revision: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface BoardAttachment {
  id: string;
  companyId: CompanyId;
  ownerType: 'POST' | 'COMMENT';
  ownerId: string;
  fileName: string;
  size: number;
  mimeType: string;
  version: number;
  status: BoardAttachmentStatus;
  uploadedBy: string;
  createdAt: string;
  demoOnly: boolean;
}

export interface BoardReadReceipt {
  companyId: CompanyId;
  postId: string;
  personnelId: string;
  firstReadAt: string;
  lastReadAt: string;
}

export interface BoardReaction {
  companyId: CompanyId;
  postId: string;
  personnelId: string;
  kind: BoardReactionKind;
  createdAt: string;
}

export interface BoardRevision {
  id: string;
  companyId: CompanyId;
  postId: string;
  revision: number;
  title: string;
  contentText: string;
  changedBy: string;
  changedAt: string;
}

export interface BoardAuditEvent {
  id: string;
  companyId: CompanyId;
  entityType: 'BOARD' | 'POST' | 'COMMENT' | 'REACTION' | 'READ_RECEIPT';
  entityId: string;
  action: string;
  actorId: string;
  at: string;
  revision?: number;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export interface BoardMutationResult<T = undefined> {
  ok: boolean;
  code: BoardMutationCode;
  message: string;
  data?: T;
}

export interface BoardActor {
  id: string;
  name: string;
  role: PersonnelCard['role'];
  companyId: CompanyId;
  organizationIds: string[];
}

const labels = (ko: string, vi: string, en: string): LocalizedBoardText => ({ ko, vi, en });
const boardId = (companyId: CompanyId, code: string) => `board-${companyId.toLowerCase().replace('_', '-')}-${code.toLowerCase()}`;
const groupId = (companyId: CompanyId, code: string) => `board-group-${companyId.toLowerCase().replace('_', '-')}-${code.toLowerCase()}`;

const CATALOG = [
  { category: 'CEO', code: 'CEO', group: 'COMPANY', name: labels('CEO 인사말', 'Thông điệp CEO', 'CEO message'), description: labels('경영진의 공식 메시지', 'Thông điệp chính thức của ban điều hành', 'Official executive messages'), view: 'PREVIEW', comments: false, write: 'MANAGER' },
  { category: 'NOTICE_COMPANY', code: 'NOTICE_COMPANY', group: 'NOTICE', name: labels('전사공지', 'Thông báo toàn công ty', 'Company notices'), description: labels('전 직원이 확인하는 공식 공지', 'Thông báo chính thức cho toàn thể nhân viên', 'Official notices for all employees'), view: 'CLASSIC', comments: true, write: 'MANAGER' },
  { category: 'NOTICE_HR', code: 'NOTICE_HR', group: 'NOTICE', name: labels('인사발령', 'Quyết định nhân sự', 'HR announcements'), description: labels('인사 및 조직 변경 안내', 'Thông báo nhân sự và tổ chức', 'Personnel and organization announcements'), view: 'CLASSIC', comments: false, write: 'MANAGER' },
  { category: 'NOTICE_EVENT', code: 'NOTICE_EVENT', group: 'NOTICE', name: labels('경조사', 'Sự kiện nội bộ', 'Company events'), description: labels('구성원 경조사와 사내 일정', 'Sự kiện nội bộ và lịch công ty', 'Company events and internal schedules'), view: 'CLASSIC', comments: true, write: 'MANAGER' },
  { category: 'PHOTO', code: 'PHOTO', group: 'COMMUNITY', name: labels('사진첩', 'Album ảnh', 'Photo board'), description: labels('행사와 현장 사진 공유', 'Chia sẻ ảnh sự kiện và hiện trường', 'Event and field photo sharing'), view: 'ALBUM', comments: true, write: 'ALL' },
  { category: 'FREE', code: 'FREE', group: 'COMMUNITY', name: labels('자유게시판', 'Diễn đàn tự do', 'Community board'), description: labels('아이디어와 일상 소통', 'Trao đổi ý tưởng và thông tin hằng ngày', 'Ideas and everyday communication'), view: 'FEED', comments: true, write: 'ALL' },
  { category: 'LIBRARY', code: 'LIBRARY', group: 'LIBRARY', name: labels('자료실', 'Kho tài liệu', 'Library'), description: labels('업무 표준과 공유 자료', 'Tiêu chuẩn công việc và tài liệu dùng chung', 'Work standards and shared resources'), view: 'CLASSIC', comments: true, write: 'ALL' },
] as const;

const GROUPS = [
  { code: 'COMPANY', name: labels('회사', 'Công ty', 'Company') },
  { code: 'NOTICE', name: labels('공지사항', 'Thông báo', 'Notices') },
  { code: 'COMMUNITY', name: labels('커뮤니티', 'Cộng đồng', 'Community') },
  { code: 'LIBRARY', name: labels('자료실', 'Kho tài liệu', 'Library') },
] as const;

export const createInitialBoardGroups = (): BoardGroup[] => (['CON_COST', 'VIET_QS'] as CompanyId[]).flatMap((companyId) =>
  GROUPS.map((group, index) => ({ id: groupId(companyId, group.code), companyId, name: group.name, sortOrder: index + 1, active: true })),
);

export const createInitialBoardDefinitions = (): BoardDefinition[] => (['CON_COST', 'VIET_QS'] as CompanyId[]).flatMap((companyId) =>
  CATALOG.map((entry, index) => ({
    id: boardId(companyId, entry.code),
    companyId,
    groupId: groupId(companyId, entry.group),
    legacyCategory: entry.category,
    code: entry.code,
    name: entry.name,
    description: entry.description,
    viewType: entry.view,
    scopeType: 'COMPANY',
    readableOrganizationNodeIds: [],
    writableOrganizationNodeIds: [],
    readablePersonnelIds: [],
    writablePersonnelIds: [],
    managerPersonnelIds: [companyId === 'CON_COST' ? 'demo-cc-admin-001' : 'demo-vq-manager-001'],
    allowComments: entry.comments,
    allowReplies: entry.comments,
    allowReactions: entry.comments,
    allowAttachments: true,
    noticePermission: 'MANAGERS_ONLY',
    defaultNotify: entry.category.startsWith('NOTICE'),
    active: true,
    sortOrder: index + 1,
  })),
);

const seed = (
  companyId: CompanyId,
  category: BoardLegacyCategory,
  id: string,
  title: string,
  contentText: string,
  authorNameSnapshot: string,
  createdAt: string,
  options: Partial<Pick<BoardPost, 'isPinned' | 'isNotice' | 'isMustRead' | 'attachmentIds' | 'viewCount'>> = {},
): BoardPost => ({
  id,
  companyId,
  boardId: boardId(companyId, category),
  title,
  contentText,
  contentHtml: textToSafeHtml(contentText),
  authorId: companyId === 'CON_COST' ? 'demo-cc-executive-001' : 'demo-vq-manager-001',
  authorNameSnapshot,
  authorOrganizationSnapshot: companyId === 'CON_COST' ? 'CON-COST' : 'Viet QS',
  status: 'PUBLISHED',
  isNotice: options.isNotice ?? category.startsWith('NOTICE'),
  isMustRead: options.isMustRead ?? false,
  isPinned: options.isPinned ?? false,
  allowComments: !['CEO', 'NOTICE_HR'].includes(category),
  allowReactions: true,
  attachmentIds: options.attachmentIds ?? [],
  viewCount: options.viewCount ?? 0,
  commentCount: 0,
  revision: 1,
  createdAt,
  updatedAt: createdAt,
  publishedAt: createdAt,
});

export const createInitialBoardPosts = (): BoardPost[] => [
  seed('CON_COST', 'CEO', 'board-ceo-001', '고객이 원하는 시간에 최상의 결과를 제공하겠습니다.', '정확한 공사비 데이터와 실무 경험으로 더 나은 의사결정을 지원합니다.', '[DEMO] CONCOST Executive 001', '2026-07-01T09:00:00.000Z', { isPinned: true, viewCount: 184 }),
  seed('CON_COST', 'NOTICE_COMPANY', 'board-notice-001', '2026년 하반기 그룹웨어 운영 정책 안내', '프로젝트, 일정, 결재 자료는 그룹웨어의 각 업무 메뉴를 기준으로 등록해 주세요.', '[DEMO] Management Support 001', '2026-07-20T01:20:00.000Z', { isPinned: true, isMustRead: true, attachmentIds: ['board-file-policy-001'], viewCount: 92 }),
  seed('CON_COST', 'NOTICE_HR', 'board-hr-001', '7월 인사발령 안내', '조직 개편 및 담당 업무 변경 사항은 조직도와 인사 공지를 함께 확인해 주세요.', '[DEMO] HR Manager 001', '2026-07-18T04:30:00.000Z', { attachmentIds: ['board-file-hr-001'], viewCount: 77 }),
  seed('CON_COST', 'NOTICE_EVENT', 'board-event-001', '임직원 경조사 안내', '이번 주 경조사 일정을 안내합니다. 구성원 여러분의 따뜻한 관심 부탁드립니다.', '[DEMO] General Affairs 001', '2026-07-16T06:10:00.000Z', { viewCount: 54 }),
  seed('CON_COST', 'PHOTO', 'board-photo-001', '기술본부 워크숍 사진', '프로젝트 품질 기준과 협업 방식을 정리한 워크숍 현장을 공유합니다.', '[DEMO] Technical HQ 001', '2026-07-12T08:15:00.000Z', { attachmentIds: ['board-file-photo-001'], viewCount: 68 }),
  seed('CON_COST', 'FREE', 'board-free-001', '업무 자동화 아이디어를 공유해 주세요', '반복 업무를 줄일 수 있는 아이디어와 개선 의견을 자유롭게 남겨 주세요.', '[DEMO] Development 001', '2026-07-10T02:40:00.000Z', { viewCount: 41 }),
  seed('CON_COST', 'LIBRARY', 'board-library-001', '프로젝트 표준 보고서 양식 모음', '업무일지, 주간보고, 납품 확인서에 사용하는 표준 양식입니다.', '[DEMO] Quality 001', '2026-07-08T00:30:00.000Z', { isPinned: true, attachmentIds: ['board-file-template-001'], viewCount: 103 }),
  seed('VIET_QS', 'NOTICE_COMPANY', 'board-vq-notice-001', 'Hướng dẫn vận hành workspace Viet QS', 'Vui lòng lưu tài liệu dự án, lịch và phê duyệt trong đúng không gian nghiệp vụ.', '[DEMO] Viet QS Manager 001', '2026-07-21T01:00:00.000Z', { isPinned: true, isMustRead: true, viewCount: 38 }),
  seed('VIET_QS', 'FREE', 'board-vq-free-001', 'Chia sẻ ý tưởng cải tiến quy trình', 'Hãy chia sẻ ý tưởng giúp giảm công việc lặp lại và cải thiện phối hợp dự án.', '[DEMO] Viet QS Development 001', '2026-07-17T03:00:00.000Z', { viewCount: 24 }),
  seed('VIET_QS', 'LIBRARY', 'board-vq-library-001', 'Biểu mẫu báo cáo dự án', 'Bộ biểu mẫu demo dành cho báo cáo tuần và xác nhận bàn giao.', '[DEMO] Viet QS Quality 001', '2026-07-09T02:00:00.000Z', { attachmentIds: ['board-file-vq-template-001'], viewCount: 31 }),
];

export const createInitialBoardAttachments = (): BoardAttachment[] => [
  ['board-file-policy-001', 'CON_COST', 'board-notice-001', 'groupware-operation-policy-demo.pdf'],
  ['board-file-hr-001', 'CON_COST', 'board-hr-001', 'hr-announcement-demo.pdf'],
  ['board-file-photo-001', 'CON_COST', 'board-photo-001', 'workshop-demo-image.jpg'],
  ['board-file-template-001', 'CON_COST', 'board-library-001', 'project-report-template-demo.docx'],
  ['board-file-vq-template-001', 'VIET_QS', 'board-vq-library-001', 'vietqs-project-template-demo.docx'],
].map(([id, companyId, ownerId, fileName]) => ({ id, companyId: companyId as CompanyId, ownerType: 'POST', ownerId, fileName, size: 245760, mimeType: 'application/octet-stream', version: 1, status: 'READY', uploadedBy: 'demo-system', createdAt: '2026-07-01T00:00:00.000Z', demoOnly: true }));

const escapeBoardHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const renderBoardInline = (value: string) => escapeBoardHtml(value)
  .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/_([^_]+)_/g, '<em>$1</em>')
  .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, '<u>$1</u>');

const boardTableCells = (line: string) => line
  .replace(/^\s*\||\|\s*$/g, '')
  .split('|')
  .map((cell) => cell.trim());

export const textToSafeHtml = (value: string) => {
  const lines = value.split(/\r?\n/);
  const blocks: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      blocks.push('<p><br></p>');
      index += 1;
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line) && /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(lines[index + 1] ?? '')) {
      const headers = boardTableCells(line);
      index += 2;
      const rows: string[][] = [];
      while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
        rows.push(boardTableCells(lines[index]));
        index += 1;
      }
      blocks.push('<div class="board-rich-table-wrap"><table><thead><tr>' + headers.map((cell) => `<th>${renderBoardInline(cell)}</th>`).join('') + '</tr></thead><tbody>' + rows.map((row) => '<tr>' + row.map((cell) => `<td>${renderBoardInline(cell)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*-\s+/, ''));
        index += 1;
      }
      blocks.push('<ul>' + items.map((item) => `<li>${renderBoardInline(item)}</li>`).join('') + '</ul>');
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s+/, ''));
        index += 1;
      }
      blocks.push('<ol>' + items.map((item) => `<li>${renderBoardInline(item)}</li>`).join('') + '</ol>');
      continue;
    }
    if (/^\s*>\s?/.test(line)) {
      blocks.push(`<blockquote>${renderBoardInline(line.replace(/^\s*>\s?/, ''))}</blockquote>`);
      index += 1;
      continue;
    }
    blocks.push(`<p>${renderBoardInline(line)}</p>`);
    index += 1;
  }
  return blocks.join('');
};

export const isBoardNoticeActive = (post: Pick<BoardPost, 'isNotice' | 'noticeStartAt' | 'noticeEndAt'>, at = new Date()) => {
  if (!post.isNotice) return false;
  const timestamp = at.getTime();
  const startsAt = post.noticeStartAt ? new Date(post.noticeStartAt).getTime() : Number.NEGATIVE_INFINITY;
  const endsAt = post.noticeEndAt ? new Date(post.noticeEndAt).getTime() : Number.POSITIVE_INFINITY;
  return timestamp >= startsAt && timestamp <= endsAt;
};

export const localizedBoardText = (value: LocalizedBoardText, locale: BoardLocale) => value[locale] ?? value.ko;
export const getBoardIdForLegacyCategory = (companyId: CompanyId, category: BoardLegacyCategory) => boardId(companyId, category);
export const getBoardByLegacyCategory = (boards: BoardDefinition[], companyId: CompanyId, category: BoardLegacyCategory) => boards.find((board) => board.companyId === companyId && board.legacyCategory === category);
export const boardActorFromPersonnel = (user: PersonnelCard, companyId: CompanyId): BoardActor => ({
  id: user.id,
  name: user.displayName || user.name,
  role: user.role,
  companyId,
  organizationIds: [user.departmentId, user.subDepartmentId, user.teamId, ...(user.organizationMemberships ?? []).filter((membership) => membership.status === 'ACTIVE').map((membership) => membership.organizationId)].filter((value): value is string => Boolean(value)),
});
