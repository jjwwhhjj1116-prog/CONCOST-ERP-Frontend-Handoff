import type { BoardActor, BoardDefinition, BoardPermission, BoardPost } from './boardOperationalModel';

export interface BoardPermissionDecision {
  allowed: boolean;
  reason: string;
}

const isBoardManager = (board: BoardDefinition, actor: BoardActor) =>
  actor.role === 'SUPER_ADMIN' || board.managerPersonnelIds.includes(actor.id);

const matchesOrganizationScope = (allowedIds: string[], actor: BoardActor) =>
  allowedIds.length === 0 || allowedIds.some((id) => actor.organizationIds.includes(id));

const matchesMemberScope = (allowedIds: string[], actor: BoardActor) =>
  allowedIds.length === 0 || allowedIds.includes(actor.id);

export function canReadBoard(board: BoardDefinition, actor: BoardActor): BoardPermissionDecision {
  if (board.companyId !== actor.companyId) return { allowed: false, reason: '다른 회사 게시판에는 접근할 수 없습니다.' };
  if (!board.active && !isBoardManager(board, actor)) return { allowed: false, reason: '보관된 게시판입니다.' };
  if (isBoardManager(board, actor)) return { allowed: true, reason: '' };
  if (board.scopeType === 'ORGANIZATION' && !matchesOrganizationScope(board.readableOrganizationNodeIds, actor)) return { allowed: false, reason: '이 게시판을 열람할 조직 권한이 없습니다.' };
  if (board.scopeType === 'MEMBERS' && !matchesMemberScope(board.readablePersonnelIds, actor)) return { allowed: false, reason: '이 게시판의 지정 구성원이 아닙니다.' };
  return { allowed: true, reason: '' };
}

export function canWriteBoard(board: BoardDefinition, actor: BoardActor): BoardPermissionDecision {
  const read = canReadBoard(board, actor);
  if (!read.allowed) return read;
  if (isBoardManager(board, actor)) return { allowed: true, reason: '' };
  if (['CEO', 'NOTICE_COMPANY', 'NOTICE_HR', 'NOTICE_EVENT'].includes(board.code)) return { allowed: false, reason: '게시판 운영자만 작성할 수 있습니다.' };
  if (board.scopeType === 'ORGANIZATION' && !matchesOrganizationScope(board.writableOrganizationNodeIds, actor)) return { allowed: false, reason: '이 게시판에 작성할 조직 권한이 없습니다.' };
  if (board.scopeType === 'MEMBERS' && !matchesMemberScope(board.writablePersonnelIds, actor)) return { allowed: false, reason: '이 게시판의 작성자로 지정되지 않았습니다.' };
  return { allowed: true, reason: '' };
}

export function canUseBoardPermission(board: BoardDefinition, actor: BoardActor, permission: BoardPermission): BoardPermissionDecision {
  if (permission === 'BOARD_READ' || permission === 'BOARD_EXPORT') return canReadBoard(board, actor);
  if (permission === 'BOARD_WRITE') return canWriteBoard(board, actor);
  if (permission === 'BOARD_COMMENT') {
    const read = canReadBoard(board, actor);
    if (!read.allowed) return read;
    return board.allowComments ? { allowed: true, reason: '' } : { allowed: false, reason: '이 게시판은 댓글을 사용하지 않습니다.' };
  }
  if (permission === 'BOARD_NOTICE') {
    const write = canWriteBoard(board, actor);
    if (!write.allowed) return write;
    return board.noticePermission === 'ALL_WRITERS' || isBoardManager(board, actor)
      ? { allowed: true, reason: '' }
      : { allowed: false, reason: '공지 등록은 게시판 운영자만 가능합니다.' };
  }
  return isBoardManager(board, actor)
    ? { allowed: true, reason: '' }
    : { allowed: false, reason: '게시판 운영자 권한이 필요합니다.' };
}

export function canEditPost(board: BoardDefinition, post: BoardPost, actor: BoardActor): BoardPermissionDecision {
  const read = canReadBoard(board, actor);
  if (!read.allowed || post.companyId !== actor.companyId) return read.allowed ? { allowed: false, reason: '다른 회사 게시글입니다.' } : read;
  if (post.authorId === actor.id) return { allowed: true, reason: '' };
  return { allowed: false, reason: '작성자만 게시글 내용을 수정할 수 있습니다.' };
}

export function canDeletePost(board: BoardDefinition, post: BoardPost, actor: BoardActor): BoardPermissionDecision {
  const read = canReadBoard(board, actor);
  if (!read.allowed || post.companyId !== actor.companyId) return read.allowed ? { allowed: false, reason: '다른 회사 게시글입니다.' } : read;
  return post.authorId === actor.id || isBoardManager(board, actor)
    ? { allowed: true, reason: '' }
    : { allowed: false, reason: '작성자 또는 게시판 운영자만 삭제할 수 있습니다.' };
}

export const canManageBoard = (board: BoardDefinition, actor: BoardActor) => isBoardManager(board, actor) && board.companyId === actor.companyId;
export const canOpenBoardAdmin = (actor: BoardActor) => actor.role === 'SUPER_ADMIN';
