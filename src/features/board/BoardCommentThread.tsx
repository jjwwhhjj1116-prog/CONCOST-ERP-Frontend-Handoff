'use client';

import React from 'react';
import { CornerDownRight, MessageCircle, Paperclip, Pencil, Reply, Trash2, UserPlus } from 'lucide-react';
import { SemanticActionButton } from '@/components/ui/SemanticActionButton';
import { useAuthStore } from '@/store/authStore';
import { canManageBoard, canUseBoardPermission } from './boardPermissions';
import type { BoardCopy } from './boardCopy';
import type { BoardActor, BoardAttachment, BoardComment, BoardDefinition, BoardMutationResult } from './boardOperationalModel';
import { boardDate, boardFileSize, BoardFeedback } from './BoardUi';
import { BoardAttachmentPicker } from './BoardAttachmentList';
import { useOperationalBoardStore } from './useOperationalBoardStore';

const personnelName = (person: { displayName?: string; name: string }) => person.displayName || person.name;

export function BoardCommentThread({ postId, board, actor, copy, language }: { postId: string; board: BoardDefinition; actor: BoardActor; copy: BoardCopy; language: 'ko' | 'vi' | 'en' }) {
  const comments = useOperationalBoardStore((state) => state.comments).filter((item) => item.postId === postId && item.companyId === actor.companyId);
  const attachments = useOperationalBoardStore((state) => state.attachments).filter((item) => item.companyId === actor.companyId);
  const users = useAuthStore((state) => state.users);
  const addComment = useOperationalBoardStore((state) => state.addComment);
  const updateComment = useOperationalBoardStore((state) => state.updateComment);
  const deleteComment = useOperationalBoardStore((state) => state.deleteComment);
  const [draft, setDraft] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [editDraft, setEditDraft] = React.useState('');
  const [attachmentIds, setAttachmentIds] = React.useState<string[]>([]);
  const [feedback, setFeedback] = React.useState<BoardMutationResult<unknown> | null>(null);
  const allowed = canUseBoardPermission(board, actor, 'BOARD_COMMENT');
  const mentionCandidates = React.useMemo(() => users
    .filter((person) => person.companyId === actor.companyId && person.employmentStatus !== 'INACTIVE' && person.employmentStatus !== 'RESIGNED')
    .slice(0, 12), [actor.companyId, users]);
  const roots = comments.filter((item) => !item.parentCommentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const replies = (parentId: string) => comments.filter((item) => item.parentCommentId === parentId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const addMention = (name: string) => setDraft((value) => (value && !value.endsWith(' ') ? value + ' ' : value) + '@' + name + ' ');
  const submit = () => {
    const mentionedPersonnelIds = mentionCandidates
      .filter((person) => draft.includes('@' + personnelName(person)))
      .map((person) => person.id);
    const result = addComment({ postId, content: draft, parentCommentId: replyTo, mentionedPersonnelIds, attachmentIds }, actor);
    setFeedback(result);
    if (result.ok) {
      setDraft('');
      setReplyTo(null);
      setAttachmentIds([]);
    }
  };
  const startEdit = (comment: BoardComment) => {
    setEditing(comment.id);
    setEditDraft(comment.content);
  };
  const saveEdit = (comment: BoardComment) => {
    const result = updateComment(comment.id, editDraft, comment.revision, actor);
    setFeedback(result);
    if (result.ok) setEditing(null);
  };
  const remove = (comment: BoardComment) => {
    if (!window.confirm(copy.remove + '?')) return;
    setFeedback(deleteComment(comment.id, actor));
  };

  return <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)]" aria-labelledby="board-comments-title">
    <h2 id="board-comments-title" className="flex items-center gap-2 text-base font-black"><MessageCircle className="h-5 w-5 text-teal-700" />{copy.comment} <span className="text-xs text-slate-500">{comments.filter((item) => item.status === 'ACTIVE').length}</span></h2>
    <div className="mt-3"><BoardFeedback result={feedback} onDismiss={() => setFeedback(null)} /></div>
    {allowed.allowed ? <div className="mt-4 space-y-3">
      <label className="block text-xs font-black text-[var(--color-text-sub)]">{replyTo ? copy.reply : copy.addComment}
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} placeholder={copy.mentionHint} className="mt-2 w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" />
      </label>
      <div className="flex flex-wrap items-center gap-2" aria-label={copy.mentionHint}>
        <UserPlus className="h-4 w-4 text-sky-700" />
        {mentionCandidates.map((person) => <button key={person.id} type="button" onClick={() => addMention(personnelName(person))} className="min-h-9 rounded-full border border-sky-200 bg-sky-50 px-3 text-xs font-black text-sky-800 transition hover:border-sky-400 hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">@{personnelName(person)}</button>)}
      </div>
      {board.allowAttachments && <BoardAttachmentPicker actor={actor} ownerType="COMMENT" ownerId="pending-comment" value={attachmentIds} onChange={setAttachmentIds} copy={copy} />}
      <div className="flex flex-wrap justify-end gap-2">
        {replyTo && <SemanticActionButton variant="neutral" size="sm" onClick={() => { setReplyTo(null); setDraft(''); }}>{copy.cancel}</SemanticActionButton>}
        <SemanticActionButton variant="save" size="sm" icon={<MessageCircle className="h-4 w-4" />} onClick={submit}>{copy.addComment}</SemanticActionButton>
      </div>
    </div> : <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs font-bold text-slate-600">{allowed.reason}</p>}
    <div className="mt-6 space-y-4">
      {roots.map((comment) => <article key={comment.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4">
        <CommentBody comment={comment} attachments={attachments} actor={actor} manager={canManageBoard(board, actor)} copy={copy} language={language} editing={editing === comment.id} editDraft={editDraft} setEditDraft={setEditDraft} onStartEdit={() => startEdit(comment)} onCancelEdit={() => setEditing(null)} onSaveEdit={() => saveEdit(comment)} onDelete={() => remove(comment)} onReply={board.allowReplies ? () => { setReplyTo(comment.id); addMention(comment.authorNameSnapshot); } : undefined} />
        {replies(comment.id).map((reply) => <div key={reply.id} className="mt-3 flex gap-2 border-t border-dashed border-[var(--color-border)] pt-3"><CornerDownRight className="mt-1 h-4 w-4 shrink-0 text-sky-700" /><div className="min-w-0 flex-1"><CommentBody comment={reply} attachments={attachments} actor={actor} manager={canManageBoard(board, actor)} copy={copy} language={language} editing={editing === reply.id} editDraft={editDraft} setEditDraft={setEditDraft} onStartEdit={() => startEdit(reply)} onCancelEdit={() => setEditing(null)} onSaveEdit={() => saveEdit(reply)} onDelete={() => remove(reply)} /></div></div>)}
      </article>)}
      {!roots.length && <p className="py-8 text-center text-sm font-semibold text-slate-500">{copy.empty}</p>}
    </div>
  </section>;
}

function CommentBody({ comment, attachments, actor, manager, copy, language, editing, editDraft, setEditDraft, onStartEdit, onCancelEdit, onSaveEdit, onDelete, onReply }: { comment: BoardComment; attachments: BoardAttachment[]; actor: BoardActor; manager: boolean; copy: BoardCopy; language: 'ko' | 'vi' | 'en'; editing: boolean; editDraft: string; setEditDraft: (value: string) => void; onStartEdit: () => void; onCancelEdit: () => void; onSaveEdit: () => void; onDelete: () => void; onReply?: () => void }) {
  const own = comment.authorId === actor.id;
  const commentAttachments = attachments.filter((item) => comment.attachmentIds.includes(item.id));
  return <div>
    <header className="flex flex-wrap items-center justify-between gap-2">
      <span><strong className="text-sm">{comment.authorNameSnapshot}</strong><span className="ml-2 text-[10px] font-bold text-slate-500">{boardDate(comment.updatedAt, language)} · r{comment.revision}</span></span>
      {comment.status === 'ACTIVE' && <span className="flex flex-wrap gap-1">
        {onReply && <button type="button" onClick={onReply} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-black text-sky-700 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><Reply className="h-3.5 w-3.5" />{copy.reply}</button>}
        {own && <button type="button" onClick={onStartEdit} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-black text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><Pencil className="h-3.5 w-3.5" />{copy.edit}</button>}
        {(own || manager) && <button type="button" onClick={onDelete} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-xs font-black text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"><Trash2 className="h-3.5 w-3.5" />{copy.remove}</button>}
      </span>}
    </header>
    {comment.status === 'DELETED'
      ? <p className="mt-2 text-sm italic text-slate-500">{copy.deletedComment}</p>
      : editing
        ? <div className="mt-3"><label className="sr-only" htmlFor={'comment-edit-' + comment.id}>{copy.comment}</label><textarea id={'comment-edit-' + comment.id} value={editDraft} onChange={(event) => setEditDraft(event.target.value)} rows={3} className="w-full rounded-lg border border-blue-300 p-3 text-sm outline-none focus:ring-2 focus-visible:ring-blue-500" /><div className="mt-2 flex justify-end gap-2"><SemanticActionButton variant="neutral" size="sm" onClick={onCancelEdit}>{copy.cancel}</SemanticActionButton><SemanticActionButton variant="save" size="sm" onClick={onSaveEdit}>{copy.save}</SemanticActionButton></div></div>
        : <p className="mt-2 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{comment.content}</p>}
    {commentAttachments.length > 0 && <ul className="mt-3 space-y-1">{commentAttachments.map((item) => <li key={item.id} className="flex items-center gap-2 rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-900"><Paperclip className="h-3.5 w-3.5" /><span className="min-w-0 flex-1 truncate">{item.fileName}</span><span>{boardFileSize(item.size)} · {item.status}</span></li>)}</ul>}
  </div>;
}
