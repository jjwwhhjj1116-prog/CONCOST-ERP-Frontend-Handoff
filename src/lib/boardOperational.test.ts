import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createInitialBoardAttachments,
  createInitialBoardDefinitions,
  createInitialBoardGroups,
  createInitialBoardPosts,
  isBoardNoticeActive,
  textToSafeHtml,
  type BoardActor,
  type BoardPostInput,
} from '@/features/board/boardOperationalModel';
import {
  canEditPost,
  canManageBoard,
  canReadBoard,
  canUseBoardPermission,
  canWriteBoard,
} from '@/features/board/boardPermissions';
import {
  boardEditHref,
  boardListHref,
  boardPostHref,
  boardWriteHref,
} from '@/features/board/boardRoutes';
import {
  migrateLegacyBoardPosts,
  useOperationalBoardStore,
} from '@/features/board/useOperationalBoardStore';

const actor = (companyId: 'CON_COST' | 'VIET_QS', role: BoardActor['role'] = 'WORKER'): BoardActor => ({
  id: role === 'SUPER_ADMIN' ? `admin-${companyId}` : `worker-${companyId}`,
  name: `[DEMO] ${role}`,
  role,
  companyId,
  organizationIds: [`org-${companyId}`],
});

const input = (boardId: string, title = 'Operational board test'): BoardPostInput => ({
  boardId,
  title,
  contentText: 'A safe synthetic board message.',
  status: 'PUBLISHED',
  labelId: 'TEST',
  isNotice: false,
  isMustRead: false,
  isPinned: false,
  noticeStartAt: null,
  noticeEndAt: null,
  scheduledAt: null,
  allowComments: true,
  allowReactions: true,
  attachmentIds: [],
  notify: false,
});

const resetBoardState = () => {
  useOperationalBoardStore.setState({
    groups: createInitialBoardGroups(),
    boards: createInitialBoardDefinitions(),
    posts: createInitialBoardPosts(),
    comments: [],
    attachments: createInitialBoardAttachments(),
    reactions: [],
    readReceipts: [],
    revisions: [],
    audits: [],
    legacyQuarantine: [],
  });
};

test('board catalog and permissions are isolated by selected company', () => {
  const boards = createInitialBoardDefinitions();
  const concostActor = actor('CON_COST');
  const vietqsActor = actor('VIET_QS');
  const concostFree = boards.find((board) => board.companyId === 'CON_COST' && board.code === 'FREE');
  const vietqsFree = boards.find((board) => board.companyId === 'VIET_QS' && board.code === 'FREE');
  assert.ok(concostFree);
  assert.ok(vietqsFree);
  assert.equal(canReadBoard(concostFree, concostActor).allowed, true);
  assert.equal(canReadBoard(concostFree, vietqsActor).allowed, false);
  assert.equal(canWriteBoard(concostFree, concostActor).allowed, true);
  assert.equal(canManageBoard(concostFree, concostActor), false);
  assert.equal(canManageBoard(concostFree, actor('CON_COST', 'SUPER_ADMIN')), true);
});

test('demo CRUD records revisions, comments and before/after audit without cross-company leakage', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  resetBoardState();
  try {
    const store = useOperationalBoardStore.getState();
    const board = store.boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
    assert.ok(board);
    const author = actor('CON_COST');
    const created = store.createPost(input(board.id), author);
    assert.equal(created.ok, true);
    assert.ok(created.data);
    const postId = created.data.id;

    const updated = useOperationalBoardStore.getState().updatePost(postId, { ...input(board.id), title: 'Updated title' }, 1, author);
    assert.equal(updated.ok, true);
    assert.equal(updated.data?.revision, 2);

    const stale = useOperationalBoardStore.getState().updatePost(postId, input(board.id, 'Stale title'), 1, author);
    assert.equal(stale.code, 'REVISION_CONFLICT');

    const comment = useOperationalBoardStore.getState().addComment({ postId, content: 'First comment' }, author);
    assert.equal(comment.ok, true);
    assert.ok(comment.data);
    const reply = useOperationalBoardStore.getState().addComment({ postId, content: 'Reply', parentCommentId: comment.data.id }, author);
    assert.equal(reply.ok, true);

    const wrongCompany = useOperationalBoardStore.getState().posts.filter((post) => post.companyId === 'VIET_QS' && post.id === postId);
    assert.equal(wrongCompany.length, 0);
    assert.equal(useOperationalBoardStore.getState().revisions.filter((revision) => revision.postId === postId).length, 2);
    const editAudit = useOperationalBoardStore.getState().audits.find((event) => event.entityId === postId && event.action === 'POST_EDIT');
    assert.ok(editAudit?.before);
    assert.ok(editAudit?.after);
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('soft delete requires board manager for restore and keeps an auditable recovery path', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  resetBoardState();
  try {
    const store = useOperationalBoardStore.getState();
    const board = store.boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
    assert.ok(board);
    const author = actor('CON_COST');
    const created = store.createPost(input(board.id, 'Delete and restore'), author);
    assert.ok(created.data);
    assert.equal(useOperationalBoardStore.getState().softDeletePost(created.data.id, author).ok, true);
    assert.equal(useOperationalBoardStore.getState().restorePost(created.data.id, author).code, 'FORBIDDEN');
    const restored = useOperationalBoardStore.getState().restorePost(created.data.id, actor('CON_COST', 'SUPER_ADMIN'));
    assert.equal(restored.ok, true);
    assert.equal(restored.data?.status, 'PUBLISHED');
    const actions = useOperationalBoardStore.getState().audits.filter((event) => event.entityId === created.data?.id).map((event) => event.action);
    assert.ok(actions.includes('POST_DELETE'));
    assert.ok(actions.includes('POST_RESTORE'));
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('server modes block local board mutations and never report false success', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'API_SANDBOX';
  resetBoardState();
  try {
    const before = useOperationalBoardStore.getState().posts.length;
    const board = useOperationalBoardStore.getState().boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
    assert.ok(board);
    const result = useOperationalBoardStore.getState().createPost(input(board.id), actor('CON_COST'));
    assert.equal(result.ok, false);
    assert.equal(result.code, 'BACKEND_REQUIRED');
    assert.equal(useOperationalBoardStore.getState().posts.length, before);
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('legacy migration quarantines unknown records instead of treating them as company data', () => {
  const migrated = migrateLegacyBoardPosts([
    { id: 'unknown-personal-record', category: 'FREE', title: 'Unknown', content: 'Unknown' },
  ]);
  assert.equal(migrated.posts.length, 0);
  assert.equal(migrated.legacyQuarantine.length, 1);
});

test('board operational URLs are stable and preserve return navigation', () => {
  assert.equal(boardWriteHref('board-con-cost-free'), '/board/write?boardId=board-con-cost-free');
  assert.equal(boardEditHref('post-1'), '/board/edit?postId=post-1');
  assert.equal(boardPostHref('post-1', '/board?category=FREE'), '/board/post?postId=post-1&returnTo=%2Fboard%3Fcategory%3DFREE');
});

test('drafts may be partial while published posts still require title and content', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  resetBoardState();
  try {
    const board = useOperationalBoardStore.getState().boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
    assert.ok(board);
    const draft = useOperationalBoardStore.getState().createPost({ ...input(board.id), title: '', status: 'DRAFT' }, actor('CON_COST'));
    assert.equal(draft.ok, true);
    assert.equal(draft.data?.title, '제목 없는 임시저장');
    const invalidPublished = useOperationalBoardStore.getState().createPost({ ...input(board.id), contentText: '' }, actor('CON_COST'));
    assert.equal(invalidPublished.code, 'VALIDATION_ERROR');
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('reply policy blocks nested collaboration when replies are disabled', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  resetBoardState();
  try {
    const board = useOperationalBoardStore.getState().boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
    assert.ok(board);
    useOperationalBoardStore.setState((state) => ({ boards: state.boards.map((item) => item.id === board.id ? { ...item, allowReplies: false } : item) }));
    const created = useOperationalBoardStore.getState().createPost(input(board.id, 'Replies disabled'), actor('CON_COST'));
    assert.ok(created.data);
    const root = useOperationalBoardStore.getState().addComment({ postId: created.data.id, content: 'Root' }, actor('CON_COST'));
    assert.ok(root.data);
    const reply = useOperationalBoardStore.getState().addComment({ postId: created.data.id, parentCommentId: root.data.id, content: 'Blocked reply' }, actor('CON_COST'));
    assert.equal(reply.code, 'FORBIDDEN');
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('board moderation is revision-safe and records before and after values', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  resetBoardState();
  try {
    const board = useOperationalBoardStore.getState().boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
    assert.ok(board);
    const created = useOperationalBoardStore.getState().createPost(input(board.id, 'Moderation'), actor('CON_COST'));
    assert.ok(created.data);
    const moderated = useOperationalBoardStore.getState().updatePostModeration(created.data.id, { isNotice: true }, 1, actor('CON_COST', 'SUPER_ADMIN'));
    assert.equal(moderated.ok, true);
    assert.equal(moderated.data?.isNotice, true);
    assert.equal(moderated.data?.revision, 2);
    const audit = useOperationalBoardStore.getState().audits.find((event) => event.entityId === created.data?.id && event.action === 'POST_MODERATION_CHANGE');
    assert.equal(audit?.before?.isNotice, false);
    assert.equal(audit?.after?.isNotice, true);
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('notice periods expire without deleting the post', () => {
  assert.equal(isBoardNoticeActive({ isNotice: true, noticeStartAt: '2026-08-01T00:00:00.000Z', noticeEndAt: '2026-08-31T23:59:59.000Z' }, new Date('2026-08-11T00:00:00.000Z')), true);
  assert.equal(isBoardNoticeActive({ isNotice: true, noticeStartAt: null, noticeEndAt: '2026-08-10T23:59:59.000Z' }, new Date('2026-08-11T00:00:00.000Z')), false);
});

test('safe board rich text preserves supported formatting and escapes scripts', () => {
  const html = textToSafeHtml('**bold**\n- item\n[OpenAI](https://openai.com)\n<script>alert(1)</script>');
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<ul><li>item<\/li><\/ul>/);
  assert.match(html, /href="https:\/\/openai\.com"/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('board list route persists search, filters, paging and view state', () => {
  assert.equal(
    boardListHref({ boardId: 'board-1', query: 'policy', filter: 'NOTICE', sort: 'VIEWS', page: 3, view: 'PREVIEW', label: 'POLICY', author: 'person-1', from: '2026-08-01', to: '2026-08-31' }),
    '/board?boardId=board-1&q=policy&filter=NOTICE&sort=VIEWS&page=3&view=PREVIEW&label=POLICY&author=person-1&from=2026-08-01&to=2026-08-31',
  );
});


test('comments, reactions and read receipts remain isolated by company', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  resetBoardState();
  try {
    const board = useOperationalBoardStore.getState().boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
    assert.ok(board);
    const owner = actor('CON_COST');
    const foreignActor = actor('VIET_QS');
    const created = useOperationalBoardStore.getState().createPost(input(board.id, 'Company scoped collaboration'), owner);
    assert.ok(created.data);
    const postId = created.data.id;

    assert.equal(useOperationalBoardStore.getState().addComment({ postId, content: 'Foreign comment' }, foreignActor).code, 'NOT_FOUND');
    assert.equal(useOperationalBoardStore.getState().toggleReaction(postId, 'LIKE', foreignActor).code, 'NOT_FOUND');
    assert.equal(useOperationalBoardStore.getState().markRead(postId, foreignActor).code, 'NOT_FOUND');

    assert.equal(useOperationalBoardStore.getState().addComment({ postId, content: 'Scoped comment' }, owner).ok, true);
    assert.equal(useOperationalBoardStore.getState().toggleReaction(postId, 'LIKE', owner).ok, true);
    assert.equal(useOperationalBoardStore.getState().markRead(postId, owner).ok, true);
    assert.equal(useOperationalBoardStore.getState().comments.filter((item) => item.postId === postId && item.companyId === 'VIET_QS').length, 0);
    assert.equal(useOperationalBoardStore.getState().reactions.filter((item) => item.postId === postId && item.companyId === 'VIET_QS').length, 0);
    assert.equal(useOperationalBoardStore.getState().readReceipts.filter((item) => item.postId === postId && item.companyId === 'VIET_QS').length, 0);
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('marking the same post as read is idempotent', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  resetBoardState();
  try {
    const reader = actor('CON_COST');
    const seededPost = useOperationalBoardStore.getState().posts.find((item) => item.companyId === 'CON_COST' && item.status === 'PUBLISHED');
    assert.ok(seededPost);

    assert.equal(useOperationalBoardStore.getState().markRead(seededPost.id, reader).ok, true);
    const firstReceipts = useOperationalBoardStore.getState().readReceipts;
    assert.equal(firstReceipts.length, 1);

    assert.equal(useOperationalBoardStore.getState().markRead(seededPost.id, reader).ok, true);
    assert.equal(useOperationalBoardStore.getState().readReceipts, firstReceipts);
    assert.equal(useOperationalBoardStore.getState().readReceipts.length, 1);
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('restricted boards enforce writer, notice, organization and author boundaries', () => {
  const boards = createInitialBoardDefinitions();
  const worker = actor('CON_COST');
  const manager = actor('CON_COST', 'SUPER_ADMIN');
  const ceoBoard = boards.find((item) => item.companyId === 'CON_COST' && item.code === 'CEO');
  const freeBoard = boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
  assert.ok(ceoBoard);
  assert.ok(freeBoard);
  assert.equal(canWriteBoard(ceoBoard, worker).allowed, false);
  assert.equal(canWriteBoard(ceoBoard, manager).allowed, true);
  assert.equal(canUseBoardPermission({ ...freeBoard, noticePermission: 'MANAGERS_ONLY' }, worker, 'BOARD_NOTICE').allowed, false);
  assert.equal(canReadBoard({ ...freeBoard, scopeType: 'ORGANIZATION', readableOrganizationNodeIds: ['org-other'] }, worker).allowed, false);
  const foreignPost = createInitialBoardPosts().find((item) => item.companyId === 'CON_COST');
  assert.ok(foreignPost);
  assert.equal(canEditPost(freeBoard, { ...foreignPost, boardId: freeBoard.id, authorId: 'someone-else' }, worker).allowed, false);
});

test('scheduled posts stay scheduled and expose backend publication as a separate capability', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'DEMO_LOCAL';
  resetBoardState();
  try {
    const board = useOperationalBoardStore.getState().boards.find((item) => item.companyId === 'CON_COST' && item.code === 'FREE');
    assert.ok(board);
    const scheduled = useOperationalBoardStore.getState().createPost({ ...input(board.id, 'Scheduled post'), status: 'SCHEDULED', scheduledAt: '2026-08-20T09:00' }, actor('CON_COST'));
    assert.equal(scheduled.ok, true);
    assert.equal(scheduled.data?.status, 'SCHEDULED');
    assert.equal(scheduled.data?.publishedAt, null);
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});

test('known legacy board records preserve category, content, pin and attachment metadata without duplicates', () => {
  const legacy = createInitialBoardPosts().find((item) => item.companyId === 'CON_COST');
  assert.ok(legacy);
  const migrated = migrateLegacyBoardPosts([
    { id: legacy.id, category: 'NOTICE_COMPANY', title: 'Legacy notice', content: 'Preserved content', pinned: true, attachmentCount: 2 },
    { id: legacy.id, category: 'NOTICE_COMPANY', title: 'Duplicate', content: 'Duplicate' },
  ]);
  assert.equal(migrated.posts.length, 1);
  assert.equal(migrated.posts[0].boardId, 'board-con-cost-notice_company');
  assert.equal(migrated.posts[0].contentText, 'Preserved content');
  assert.equal(migrated.posts[0].isPinned, true);
  assert.equal(migrated.posts[0].attachmentIds.length, 2);
});

test('server modes block attachment and reminder false success', () => {
  const previousMode = process.env.NEXT_PUBLIC_RUNTIME_MODE;
  process.env.NEXT_PUBLIC_RUNTIME_MODE = 'PRODUCTION_SERVER';
  resetBoardState();
  try {
    const seededPost = useOperationalBoardStore.getState().posts.find((item) => item.companyId === 'CON_COST' && item.status === 'PUBLISHED');
    assert.ok(seededPost);
    const admin = actor('CON_COST', 'SUPER_ADMIN');
    const reminder = useOperationalBoardStore.getState().requestUnreadReminder(seededPost.id, admin);
    const attachment = useOperationalBoardStore.getState().addAttachmentMetadata([{ name: 'demo.pdf', size: 1024, type: 'application/pdf' }], 'POST', seededPost.id, admin);
    assert.equal(reminder.code, 'BACKEND_REQUIRED');
    assert.equal(attachment.code, 'BACKEND_REQUIRED');
    assert.equal(useOperationalBoardStore.getState().attachments.some((item) => item.fileName === 'demo.pdf'), false);
  } finally {
    process.env.NEXT_PUBLIC_RUNTIME_MODE = previousMode;
    resetBoardState();
  }
});