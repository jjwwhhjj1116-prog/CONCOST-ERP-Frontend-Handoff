import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import type { CompanyId } from '@/types/models';
import {
  createInitialBoardAttachments,
  createInitialBoardDefinitions,
  createInitialBoardGroups,
  createInitialBoardPosts,
  getBoardIdForLegacyCategory,
  textToSafeHtml,
  type BoardActor,
  type BoardAttachment,
  type BoardAuditEvent,
  type BoardComment,
  type BoardDefinition,
  type BoardGroup,
  type BoardLegacyCategory,
  type BoardMutationResult,
  type BoardPost,
  type BoardPostInput,
  type BoardReaction,
  type BoardReactionKind,
  type BoardReadReceipt,
  type BoardRevision,
} from './boardOperationalModel';
import { canDeletePost, canEditPost, canManageBoard, canUseBoardPermission, canWriteBoard } from './boardPermissions';

interface LegacyPost {
  id?: string;
  category?: BoardLegacyCategory;
  title?: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  createdAt?: string;
  views?: number;
  pinned?: boolean;
  attachmentCount?: number;
}

interface CreateCommentInput {
  postId: string;
  content: string;
  parentCommentId?: string | null;
  mentionedPersonnelIds?: string[];
  attachmentIds?: string[];
}

interface BoardState {
  groups: BoardGroup[];
  boards: BoardDefinition[];
  posts: BoardPost[];
  comments: BoardComment[];
  attachments: BoardAttachment[];
  reactions: BoardReaction[];
  readReceipts: BoardReadReceipt[];
  revisions: BoardRevision[];
  audits: BoardAuditEvent[];
  legacyQuarantine: LegacyPost[];
  createPost: (input: BoardPostInput, actor: BoardActor) => BoardMutationResult<BoardPost>;
  updatePost: (postId: string, input: BoardPostInput, expectedRevision: number, actor: BoardActor) => BoardMutationResult<BoardPost>;
  softDeletePost: (postId: string, actor: BoardActor) => BoardMutationResult<BoardPost>;
  restorePost: (postId: string, actor: BoardActor) => BoardMutationResult<BoardPost>;
  permanentlyDeletePost: (postId: string, actor: BoardActor) => BoardMutationResult;
  archivePost: (postId: string, actor: BoardActor) => BoardMutationResult<BoardPost>;
  copyPost: (postId: string, actor: BoardActor) => BoardMutationResult<BoardPost>;
  movePost: (postId: string, boardId: string, actor: BoardActor) => BoardMutationResult<BoardPost>;
  updatePostModeration: (postId: string, flags: Partial<Pick<BoardPost, 'isNotice' | 'isMustRead' | 'isPinned'>>, expectedRevision: number, actor: BoardActor) => BoardMutationResult<BoardPost>;
  markRead: (postId: string, actor: BoardActor) => BoardMutationResult;
  incrementViewOnce: (postId: string, actor: BoardActor, sessionKey: string) => BoardMutationResult;
  toggleReaction: (postId: string, kind: BoardReactionKind, actor: BoardActor) => BoardMutationResult;
  addComment: (input: CreateCommentInput, actor: BoardActor) => BoardMutationResult<BoardComment>;
  updateComment: (commentId: string, content: string, expectedRevision: number, actor: BoardActor) => BoardMutationResult<BoardComment>;
  deleteComment: (commentId: string, actor: BoardActor) => BoardMutationResult<BoardComment>;
  addAttachmentMetadata: (files: Array<Pick<File, 'name' | 'size' | 'type'>>, ownerType: BoardAttachment['ownerType'], ownerId: string, actor: BoardActor) => BoardMutationResult<BoardAttachment[]>;
  upsertGroup: (group: BoardGroup, actor: BoardActor) => BoardMutationResult<BoardGroup>;
  createGroup: (group: Omit<BoardGroup, 'id'>, actor: BoardActor) => BoardMutationResult<BoardGroup>;
  upsertBoard: (board: BoardDefinition, actor: BoardActor) => BoardMutationResult<BoardDefinition>;
  createBoard: (board: Omit<BoardDefinition, 'id'>, actor: BoardActor) => BoardMutationResult<BoardDefinition>;
  toggleBoardArchive: (boardId: string, actor: BoardActor) => BoardMutationResult<BoardDefinition>;
  requestUnreadReminder: (postId: string, actor: BoardActor) => BoardMutationResult;
}

const success = <T,>(message: string, data?: T): BoardMutationResult<T> => ({ ok: true, code: 'OK', message, data });
const failure = <T,>(code: BoardMutationResult<T>['code'], message: string): BoardMutationResult<T> => ({ ok: false, code, message });
const id = (prefix: string) => `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;
const now = () => new Date().toISOString();
const isDemo = () => getRuntimeExecutionMode() === 'DEMO_LOCAL';
const backendRequired = <T,>(): BoardMutationResult<T> => failure('BACKEND_REQUIRED', '서버 게시판 Adapter 연결이 필요합니다.');
const postSnapshot = (post: BoardPost) => ({ boardId: post.boardId, title: post.title, status: post.status, isNotice: post.isNotice, isMustRead: post.isMustRead, isPinned: post.isPinned, attachmentIds: post.attachmentIds, revision: post.revision });
const commentSnapshot = (comment: BoardComment) => ({ postId: comment.postId, parentCommentId: comment.parentCommentId, content: comment.content, status: comment.status, revision: comment.revision });
const audit = (companyId: CompanyId, entityType: BoardAuditEvent['entityType'], entityId: string, action: string, actorId: string, before?: Record<string, unknown> | null, after?: Record<string, unknown> | null, revision?: number): BoardAuditEvent => ({ id: id('board-audit'), companyId, entityType, entityId, action, actorId, at: now(), before, after, revision });

const knownLegacyIds = new Set(createInitialBoardPosts().filter((post) => post.companyId === 'CON_COST').map((post) => post.id));

export function migrateLegacyBoardPosts(source: LegacyPost[]) {
  const posts: BoardPost[] = [];
  const legacyQuarantine: LegacyPost[] = [];
  const seen = new Set<string>();
  source.forEach((legacy) => {
    if (!legacy.id || !legacy.category || seen.has(legacy.id)) return;
    seen.add(legacy.id);
    if (!knownLegacyIds.has(legacy.id)) {
      legacyQuarantine.push(legacy);
      return;
    }
    const createdAt = legacy.createdAt || now();
    const contentText = legacy.content || '';
    posts.push({
      id: legacy.id,
      companyId: 'CON_COST',
      boardId: getBoardIdForLegacyCategory('CON_COST', legacy.category),
      title: legacy.title || '제목 없음',
      contentText,
      contentHtml: textToSafeHtml(contentText),
      authorId: legacy.authorId || 'legacy-demo-author',
      authorNameSnapshot: legacy.authorName || '[DEMO] Legacy Author',
      authorOrganizationSnapshot: 'CON-COST',
      status: 'PUBLISHED',
      isNotice: legacy.category.startsWith('NOTICE'),
      isMustRead: false,
      isPinned: Boolean(legacy.pinned),
      allowComments: !['CEO', 'NOTICE_HR'].includes(legacy.category),
      allowReactions: true,
      attachmentIds: Array.from({ length: Math.max(0, legacy.attachmentCount || 0) }, (_, index) => `legacy-attachment-${legacy.id}-${index + 1}`),
      viewCount: Math.max(0, legacy.views || 0),
      commentCount: 0,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
      publishedAt: createdAt,
    });
  });
  return { posts, legacyQuarantine };
}

const initialState = () => ({
  groups: createInitialBoardGroups(),
  boards: createInitialBoardDefinitions(),
  posts: createInitialBoardPosts(),
  comments: [] as BoardComment[],
  attachments: createInitialBoardAttachments(),
  reactions: [] as BoardReaction[],
  readReceipts: [] as BoardReadReceipt[],
  revisions: [] as BoardRevision[],
  audits: [] as BoardAuditEvent[],
  legacyQuarantine: [] as LegacyPost[],
});

export const useOperationalBoardStore = create<BoardState>()(persist((set, get) => ({
  ...initialState(),
  createPost: (input, actor) => {
    if (!isDemo()) return backendRequired();
    const board = get().boards.find((candidate) => candidate.id === input.boardId && candidate.companyId === actor.companyId);
    if (!board) return failure('NOT_FOUND', '게시판을 찾을 수 없습니다.');
    const permission = canWriteBoard(board, actor);
    if (!permission.allowed) return failure('FORBIDDEN', permission.reason);
    if (input.status !== 'DRAFT' && (!input.title.trim() || !input.contentText.trim())) return failure('VALIDATION_ERROR', '제목과 본문을 입력해 주세요.');
    if (input.status === 'DRAFT' && !input.title.trim() && !input.contentText.trim()) return failure('VALIDATION_ERROR', '제목이나 본문 중 하나를 입력해 주세요.');
    if ((input.isNotice || input.isMustRead || input.isPinned) && !canUseBoardPermission(board, actor, 'BOARD_NOTICE').allowed) return failure('FORBIDDEN', '공지 옵션은 게시판 운영자만 사용할 수 있습니다.');
    const createdAt = now();
    const postId = id('board-post');
    const post: BoardPost = {
      id: postId,
      companyId: actor.companyId,
      boardId: board.id,
      title: input.title.trim() || '제목 없는 임시저장',
      contentText: input.contentText.trim(),
      contentHtml: textToSafeHtml(input.contentText.trim()),
      authorId: actor.id,
      authorNameSnapshot: actor.name,
      status: input.status,
      labelId: input.labelId || null,
      isNotice: input.isNotice,
      isMustRead: input.isMustRead,
      isPinned: input.isPinned,
      noticeStartAt: input.noticeStartAt || null,
      noticeEndAt: input.noticeEndAt || null,
      scheduledAt: input.status === 'SCHEDULED' ? input.scheduledAt || null : null,
      publishedAt: input.status === 'PUBLISHED' ? createdAt : null,
      allowComments: input.allowComments && board.allowComments,
      allowReactions: input.allowReactions && board.allowReactions,
      attachmentIds: input.attachmentIds,
      viewCount: 0,
      commentCount: 0,
      revision: 1,
      createdAt,
      updatedAt: createdAt,
    };
    set((state) => ({
      posts: [post, ...state.posts],
      attachments: state.attachments.map((item) => input.attachmentIds.includes(item.id) ? { ...item, ownerId: postId } : item),
      revisions: [...state.revisions, { id: id('board-revision'), companyId: actor.companyId, postId, revision: 1, title: post.title, contentText: post.contentText, changedBy: actor.id, changedAt: createdAt }],
      audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'POST_CREATE', actor.id, null, postSnapshot(post), 1)],
    }));
    return success(input.status === 'DRAFT' ? '임시저장했습니다.' : input.status === 'SCHEDULED' ? '예약게시로 저장했습니다.' : '게시글을 등록했습니다.', post);
  },
  updatePost: (postId, input, expectedRevision, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId);
    if (!post || post.companyId !== actor.companyId) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    const board = get().boards.find((candidate) => candidate.id === post.boardId);
    if (!board) return failure('NOT_FOUND', '게시판을 찾을 수 없습니다.');
    const permission = canEditPost(board, post, actor);
    if (!permission.allowed) return failure('FORBIDDEN', permission.reason);
    if (post.revision !== expectedRevision) return failure('REVISION_CONFLICT', '다른 사용자가 먼저 수정했습니다. 새로고침 후 다시 시도해 주세요.');
    if (input.status !== 'DRAFT' && (!input.title.trim() || !input.contentText.trim())) return failure('VALIDATION_ERROR', '제목과 본문을 입력해 주세요.');
    if (input.status === 'DRAFT' && !input.title.trim() && !input.contentText.trim()) return failure('VALIDATION_ERROR', '제목이나 본문 중 하나를 입력해 주세요.');
    const before = postSnapshot(post);
    const updated: BoardPost = { ...post, ...input, title: input.title.trim() || '제목 없는 임시저장', contentText: input.contentText.trim(), contentHtml: textToSafeHtml(input.contentText.trim()), scheduledAt: input.status === 'SCHEDULED' ? input.scheduledAt || null : null, publishedAt: input.status === 'PUBLISHED' ? post.publishedAt || now() : post.publishedAt, revision: post.revision + 1, updatedAt: now() };
    set((state) => ({
      posts: state.posts.map((candidate) => candidate.id === postId ? updated : candidate),
      attachments: state.attachments.map((item) => input.attachmentIds.includes(item.id) ? { ...item, ownerId: postId } : item),
      revisions: [...state.revisions, { id: id('board-revision'), companyId: actor.companyId, postId, revision: updated.revision, title: updated.title, contentText: updated.contentText, changedBy: actor.id, changedAt: updated.updatedAt }],
      audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'POST_EDIT', actor.id, before, postSnapshot(updated), updated.revision)],
    }));
    return success('게시글을 수정했습니다.', updated);
  },
  softDeletePost: (postId, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId);
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board || post.companyId !== actor.companyId) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    const permission = canDeletePost(board, post, actor);
    if (!permission.allowed) return failure('FORBIDDEN', permission.reason);
    const updated = { ...post, status: 'DELETED' as const, deletedAt: now(), updatedAt: now(), revision: post.revision + 1 };
    set((state) => ({ posts: state.posts.map((candidate) => candidate.id === postId ? updated : candidate), audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'POST_DELETE', actor.id, postSnapshot(post), postSnapshot(updated), updated.revision)] }));
    return success('게시글을 휴지통으로 이동했습니다.', updated);
  },
  restorePost: (postId, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.status === 'DELETED' && candidate.companyId === actor.companyId);
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board) return failure('NOT_FOUND', '삭제된 게시글을 찾을 수 없습니다.');
    if (!canManageBoard(board, actor)) return failure('FORBIDDEN', '게시판 운영자만 복구할 수 있습니다.');
    const updated = { ...post, status: 'PUBLISHED' as const, deletedAt: null, updatedAt: now(), revision: post.revision + 1 };
    set((state) => ({ posts: state.posts.map((candidate) => candidate.id === postId ? updated : candidate), audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'POST_RESTORE', actor.id, postSnapshot(post), postSnapshot(updated), updated.revision)] }));
    return success('게시글을 복구했습니다.', updated);
  },
  permanentlyDeletePost: (postId, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.status === 'DELETED' && candidate.companyId === actor.companyId);
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board) return failure('NOT_FOUND', '삭제된 게시글을 찾을 수 없습니다.');
    if (!canManageBoard(board, actor)) return failure('FORBIDDEN', '게시판 운영자만 영구삭제할 수 있습니다.');
    set((state) => ({
      posts: state.posts.filter((candidate) => candidate.id !== postId),
      comments: state.comments.filter((comment) => comment.postId !== postId),
      reactions: state.reactions.filter((reaction) => reaction.postId !== postId),
      readReceipts: state.readReceipts.filter((receipt) => receipt.postId !== postId),
      attachments: state.attachments.filter((attachment) => !(attachment.ownerType === 'POST' && attachment.ownerId === postId)),
      audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'POST_PERMANENT_DELETE', actor.id, postSnapshot(post), null, post.revision)],
    }));
    return success('게시글을 영구삭제했습니다.');
  },
  archivePost: (postId, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.companyId === actor.companyId);
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    if (!canDeletePost(board, post, actor).allowed) return failure('FORBIDDEN', '보관 권한이 없습니다.');
    const updated = { ...post, status: 'ARCHIVED' as const, updatedAt: now(), revision: post.revision + 1 };
    set((state) => ({ posts: state.posts.map((candidate) => candidate.id === postId ? updated : candidate), audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'POST_ARCHIVE', actor.id, postSnapshot(post), postSnapshot(updated), updated.revision)] }));
    return success('게시글을 보관했습니다.', updated);
  },
  copyPost: (postId, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.companyId === actor.companyId);
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    if (!canWriteBoard(board, actor).allowed) return failure('FORBIDDEN', '복사본을 작성할 권한이 없습니다.');
    const copied: BoardPost = { ...post, id: id('board-post'), sourcePostId: post.id, title: `${post.title} (복사본)`, status: 'DRAFT', isNotice: false, isMustRead: false, isPinned: false, viewCount: 0, commentCount: 0, authorId: actor.id, authorNameSnapshot: actor.name, attachmentIds: [], revision: 1, createdAt: now(), updatedAt: now(), publishedAt: null };
    set((state) => ({ posts: [copied, ...state.posts], revisions: [...state.revisions, { id: id('board-revision'), companyId: actor.companyId, postId: copied.id, revision: 1, title: copied.title, contentText: copied.contentText, changedBy: actor.id, changedAt: copied.createdAt }], audits: [...state.audits, audit(actor.companyId, 'POST', copied.id, 'POST_COPY', actor.id, { sourcePostId: post.id }, postSnapshot(copied), 1)] }));
    return success('게시글 복사본을 만들었습니다.', copied);
  },
  movePost: (postId, boardId, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.companyId === actor.companyId);
    const sourceBoard = post && get().boards.find((candidate) => candidate.id === post.boardId);
    const targetBoard = get().boards.find((candidate) => candidate.id === boardId && candidate.companyId === actor.companyId);
    if (!post || !sourceBoard || !targetBoard) return failure('NOT_FOUND', '게시글 또는 대상 게시판을 찾을 수 없습니다.');
    if (!canManageBoard(sourceBoard, actor) || !canWriteBoard(targetBoard, actor).allowed) return failure('FORBIDDEN', '게시글 이동 권한이 없습니다.');
    const updated = { ...post, boardId, updatedAt: now(), revision: post.revision + 1 };
    set((state) => ({ posts: state.posts.map((candidate) => candidate.id === postId ? updated : candidate), audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'POST_MOVE', actor.id, postSnapshot(post), postSnapshot(updated), updated.revision)] }));
    return success('게시글을 이동했습니다.', updated);
  },
  updatePostModeration: (postId, flags, expectedRevision, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.companyId === actor.companyId);
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    if (!canManageBoard(board, actor)) return failure('FORBIDDEN', '게시판 운영자만 상태를 변경할 수 있습니다.');
    if (post.revision !== expectedRevision) return failure('REVISION_CONFLICT', '다른 사용자가 먼저 수정했습니다. 새로고침 후 다시 시도해 주세요.');
    const updated = { ...post, ...flags, revision: post.revision + 1, updatedAt: now() };
    set((state) => ({
      posts: state.posts.map((candidate) => candidate.id === postId ? updated : candidate),
      audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'POST_MODERATION_CHANGE', actor.id, postSnapshot(post), postSnapshot(updated), updated.revision)],
    }));
    return success('게시글 운영 상태를 변경했습니다.', updated);
  },  markRead: (postId, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.companyId === actor.companyId && candidate.status === 'PUBLISHED');
    if (!post) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    const alreadyRead = get().readReceipts.some((receipt) => receipt.postId === postId && receipt.personnelId === actor.id && receipt.companyId === actor.companyId);
    if (alreadyRead) return success('이미 읽음 처리된 게시글입니다.');
    const timestamp = now();
    set((state) => ({
      readReceipts: [...state.readReceipts, { companyId: actor.companyId, postId, personnelId: actor.id, firstReadAt: timestamp, lastReadAt: timestamp }],
    }));
    return success('읽음 상태를 반영했습니다.');
  },
  incrementViewOnce: (postId, actor, sessionKey) => {
    if (!sessionKey || typeof window === 'undefined') return failure('VALIDATION_ERROR', '조회 세션을 확인할 수 없습니다.');
    if (!isDemo()) return backendRequired();
    const key = `board-viewed:${actor.companyId}:${actor.id}:${sessionKey}:${postId}`;
    if (window.sessionStorage.getItem(key)) return success('이미 집계된 조회입니다.');
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.companyId === actor.companyId && candidate.status === 'PUBLISHED');
    if (!post) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    window.sessionStorage.setItem(key, '1');
    set((state) => ({ posts: state.posts.map((candidate) => candidate.id === postId ? { ...candidate, viewCount: candidate.viewCount + 1 } : candidate) }));
    return success('조회수를 반영했습니다.');
  },
  toggleReaction: (postId, kind, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.companyId === actor.companyId && candidate.status === 'PUBLISHED');
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    if (!post.allowReactions || !board.allowReactions) return failure('FORBIDDEN', '이 게시글은 반응을 사용하지 않습니다.');
    set((state) => {
      const exists = state.reactions.some((reaction) => reaction.postId === postId && reaction.personnelId === actor.id && reaction.kind === kind && reaction.companyId === actor.companyId);
      return { reactions: exists ? state.reactions.filter((reaction) => !(reaction.postId === postId && reaction.personnelId === actor.id && reaction.kind === kind && reaction.companyId === actor.companyId)) : [...state.reactions, { companyId: actor.companyId, postId, personnelId: actor.id, kind, createdAt: now() }] };
    });
    return success('반응을 반영했습니다.');
  },
  addComment: (input, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === input.postId && candidate.companyId === actor.companyId && candidate.status === 'PUBLISHED');
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    const permission = canUseBoardPermission(board, actor, 'BOARD_COMMENT');
    if (!permission.allowed || !post.allowComments) return failure('FORBIDDEN', permission.allowed ? '이 게시글은 댓글을 사용하지 않습니다.' : permission.reason);
    if (!input.content.trim()) return failure('VALIDATION_ERROR', '댓글 내용을 입력해 주세요.');
    if (input.parentCommentId) {
      if (!board.allowReplies) return failure('FORBIDDEN', '이 게시판은 답글을 허용하지 않습니다.');
      const parent = get().comments.find((comment) => comment.id === input.parentCommentId && comment.postId === post.id && comment.status === 'ACTIVE');
      if (!parent || parent.parentCommentId) return failure('VALIDATION_ERROR', '답글은 한 단계까지만 작성할 수 있습니다.');
    }
    const createdAt = now();
    const comment: BoardComment = { id: id('board-comment'), companyId: actor.companyId, postId: post.id, parentCommentId: input.parentCommentId || null, authorId: actor.id, authorNameSnapshot: actor.name, content: input.content.trim(), attachmentIds: input.attachmentIds || [], mentionedPersonnelIds: input.mentionedPersonnelIds || [], status: 'ACTIVE', revision: 1, createdAt, updatedAt: createdAt };
    set((state) => ({
      comments: [...state.comments, comment],
      posts: state.posts.map((candidate) => candidate.id === post.id ? { ...candidate, commentCount: candidate.commentCount + 1 } : candidate),
      attachments: state.attachments.map((item) => comment.attachmentIds.includes(item.id) ? { ...item, ownerId: comment.id } : item),
      audits: [...state.audits, audit(actor.companyId, 'COMMENT', comment.id, input.parentCommentId ? 'REPLY_CREATE' : 'COMMENT_CREATE', actor.id, null, commentSnapshot(comment), 1)],
    }));
    return success('댓글을 등록했습니다.', comment);
  },
  updateComment: (commentId, content, expectedRevision, actor) => {
    if (!isDemo()) return backendRequired();
    const comment = get().comments.find((candidate) => candidate.id === commentId && candidate.companyId === actor.companyId);
    if (!comment) return failure('NOT_FOUND', '댓글을 찾을 수 없습니다.');
    if (comment.authorId !== actor.id) return failure('FORBIDDEN', '작성자만 댓글을 수정할 수 있습니다.');
    if (comment.revision !== expectedRevision) return failure('REVISION_CONFLICT', '다른 변경이 먼저 저장되었습니다.');
    if (!content.trim()) return failure('VALIDATION_ERROR', '댓글 내용을 입력해 주세요.');
    const updated = { ...comment, content: content.trim(), revision: comment.revision + 1, updatedAt: now() };
    set((state) => ({ comments: state.comments.map((candidate) => candidate.id === commentId ? updated : candidate), audits: [...state.audits, audit(actor.companyId, 'COMMENT', commentId, 'COMMENT_EDIT', actor.id, commentSnapshot(comment), commentSnapshot(updated), updated.revision)] }));
    return success('댓글을 수정했습니다.', updated);
  },
  deleteComment: (commentId, actor) => {
    if (!isDemo()) return backendRequired();
    const comment = get().comments.find((candidate) => candidate.id === commentId && candidate.companyId === actor.companyId);
    const post = comment && get().posts.find((candidate) => candidate.id === comment.postId);
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!comment || !post || !board) return failure('NOT_FOUND', '댓글을 찾을 수 없습니다.');
    if (comment.authorId !== actor.id && !canManageBoard(board, actor)) return failure('FORBIDDEN', '댓글 작성자 또는 게시판 운영자만 삭제할 수 있습니다.');
    const updated = { ...comment, status: 'DELETED' as const, content: '', deletedAt: now(), updatedAt: now(), revision: comment.revision + 1 };
    const decrement = comment.status === 'ACTIVE' ? 1 : 0;
    set((state) => ({ comments: state.comments.map((candidate) => candidate.id === commentId ? updated : candidate), posts: state.posts.map((candidate) => candidate.id === post.id ? { ...candidate, commentCount: Math.max(0, candidate.commentCount - decrement) } : candidate), audits: [...state.audits, audit(actor.companyId, 'COMMENT', commentId, 'COMMENT_DELETE', actor.id, commentSnapshot(comment), commentSnapshot(updated), updated.revision)] }));
    return success('댓글을 삭제했습니다.', updated);
  },
  addAttachmentMetadata: (files, ownerType, ownerId, actor) => {
    if (!isDemo()) return backendRequired();
    const createdAt = now();
    const items = files.map((file) => ({ id: id('board-file'), companyId: actor.companyId, ownerType, ownerId, fileName: file.name, size: file.size, mimeType: file.type || 'application/octet-stream', version: 1, status: 'READY' as const, uploadedBy: actor.id, createdAt, demoOnly: true }));
    set((state) => ({ attachments: [...state.attachments, ...items] }));
    return success('DEMO 파일 Metadata를 추가했습니다. 실제 서버에는 업로드되지 않았습니다.', items);
  },
  upsertGroup: (group, actor) => {
    if (!isDemo()) return backendRequired();
    if (actor.role !== 'SUPER_ADMIN' || group.companyId !== actor.companyId) return failure('FORBIDDEN', '게시판 그룹 관리 권한이 없습니다.');
    const before = get().groups.find((candidate) => candidate.id === group.id && candidate.companyId === actor.companyId);
    if (!before) return failure('NOT_FOUND', '게시판 그룹을 찾을 수 없습니다.');
    set((state) => ({
      groups: state.groups.map((candidate) => candidate.id === group.id ? group : candidate),
      audits: [...state.audits, audit(actor.companyId, 'BOARD', group.id, 'BOARD_GROUP_EDIT', actor.id, { name: before.name, sortOrder: before.sortOrder, active: before.active }, { name: group.name, sortOrder: group.sortOrder, active: group.active })],
    }));
    return success('게시판 그룹을 저장했습니다.', group);
  },
  createGroup: (input, actor) => {
    if (!isDemo()) return backendRequired();
    if (actor.role !== 'SUPER_ADMIN' || input.companyId !== actor.companyId) return failure('FORBIDDEN', '게시판 그룹 생성 권한이 없습니다.');
    const group: BoardGroup = { ...input, id: id('board-group') };
    set((state) => ({
      groups: [...state.groups, group],
      audits: [...state.audits, audit(actor.companyId, 'BOARD', group.id, 'BOARD_GROUP_CREATE', actor.id, null, { name: group.name, sortOrder: group.sortOrder, active: group.active })],
    }));
    return success('게시판 그룹을 추가했습니다.', group);
  },  upsertBoard: (board, actor) => {
    if (!isDemo()) return backendRequired();
    if (board.companyId !== actor.companyId || !canManageBoard(board, actor)) return failure('FORBIDDEN', '게시판 설정 권한이 없습니다.');
    const before = get().boards.find((candidate) => candidate.id === board.id);
    set((state) => ({ boards: state.boards.map((candidate) => candidate.id === board.id ? board : candidate), audits: [...state.audits, audit(actor.companyId, 'BOARD', board.id, 'BOARD_SETTING_CHANGE', actor.id, before ? { name: before.name, scopeType: before.scopeType, active: before.active } : null, { name: board.name, scopeType: board.scopeType, active: board.active })] }));
    return success('게시판 설정을 저장했습니다.', board);
  },
  createBoard: (input, actor) => {
    if (!isDemo()) return backendRequired();
    if (actor.role !== 'SUPER_ADMIN' || input.companyId !== actor.companyId) return failure('FORBIDDEN', '게시판 생성 권한이 없습니다.');
    const board: BoardDefinition = { ...input, id: id('board-definition') };
    set((state) => ({ boards: [...state.boards, board], audits: [...state.audits, audit(actor.companyId, 'BOARD', board.id, 'BOARD_CREATE', actor.id, null, { name: board.name, scopeType: board.scopeType, active: board.active })] }));
    return success('게시판을 추가했습니다.', board);
  },
  toggleBoardArchive: (boardId, actor) => {
    if (!isDemo()) return backendRequired();
    const board = get().boards.find((candidate) => candidate.id === boardId && candidate.companyId === actor.companyId);
    if (!board) return failure('NOT_FOUND', '게시판을 찾을 수 없습니다.');
    if (!canManageBoard(board, actor)) return failure('FORBIDDEN', '게시판 보관 권한이 없습니다.');
    const updated = { ...board, active: !board.active };
    set((state) => ({ boards: state.boards.map((candidate) => candidate.id === boardId ? updated : candidate), audits: [...state.audits, audit(actor.companyId, 'BOARD', boardId, updated.active ? 'BOARD_RESTORE' : 'BOARD_ARCHIVE', actor.id, { active: board.active }, { active: updated.active })] }));
    return success(updated.active ? '게시판을 복구했습니다.' : '게시판을 보관했습니다.', updated);
  },
  requestUnreadReminder: (postId, actor) => {
    if (!isDemo()) return backendRequired();
    const post = get().posts.find((candidate) => candidate.id === postId && candidate.companyId === actor.companyId);
    const board = post && get().boards.find((candidate) => candidate.id === post.boardId);
    if (!post || !board) return failure('NOT_FOUND', '게시글을 찾을 수 없습니다.');
    if (!canManageBoard(board, actor)) return failure('FORBIDDEN', '알림 후보를 만들 권한이 없습니다.');
    set((state) => ({ audits: [...state.audits, audit(actor.companyId, 'POST', postId, 'BOARD_REMINDER_CANDIDATE', actor.id, null, { demoOnly: true })] }));
    return success('DEMO 미확인자 알림 후보를 생성했습니다. 실제 알림은 발송되지 않았습니다.');
  },
}), {
  name: 'concost-board-posts-v1',
  version: 2,
  migrate: (persistedState, version) => {
    if (version >= 2) return persistedState as BoardState;
    const legacy = persistedState as { posts?: LegacyPost[] } | undefined;
    const migrated = migrateLegacyBoardPosts(legacy?.posts ?? []);
    const fresh = initialState();
    const migratedIds = new Set(migrated.posts.map((post) => post.id));
    return { ...fresh, posts: [...migrated.posts, ...fresh.posts.filter((post) => !migratedIds.has(post.id))], legacyQuarantine: migrated.legacyQuarantine } as BoardState;
  },
  partialize: (state) => ({ groups: state.groups, boards: state.boards, posts: state.posts, comments: state.comments, attachments: state.attachments, reactions: state.reactions, readReceipts: state.readReceipts, revisions: state.revisions, audits: state.audits, legacyQuarantine: state.legacyQuarantine }),
}));
