'use client';

import React from 'react';
import { Download, FileCheck2, FileClock, Paperclip, UploadCloud } from 'lucide-react';
import { SemanticActionButton } from '@/components/ui/SemanticActionButton';
import type { BoardActor, BoardAttachment } from './boardOperationalModel';
import { boardDate, boardFileSize } from './BoardUi';
import type { BoardCopy } from './boardCopy';
import { useOperationalBoardStore } from './useOperationalBoardStore';

export function BoardAttachmentPicker({ actor, ownerType, ownerId, value, onChange, copy }: { actor: BoardActor; ownerType: BoardAttachment['ownerType']; ownerId: string; value: string[]; onChange: (ids: string[]) => void; copy: BoardCopy }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const addAttachmentMetadata = useOperationalBoardStore((state) => state.addAttachmentMetadata);
  const attachments = useOperationalBoardStore((state) => state.attachments);
  const [message, setMessage] = React.useState('');
  const selected = attachments.filter((item) => value.includes(item.id) && item.companyId === actor.companyId);
  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const result = addAttachmentMetadata(Array.from(files), ownerType, ownerId, actor);
    setMessage(result.message);
    if (result.ok && result.data) onChange([...value, ...result.data.map((item) => item.id)]);
  };
  return <section className="space-y-3 rounded-xl border border-dashed border-sky-300 bg-sky-50/50 p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 text-sm font-black"><Paperclip className="h-4 w-4 text-sky-700" />{copy.attachment}</h3><p className="mt-1 text-xs font-semibold text-sky-900">{copy.fileDemo}</p></div><SemanticActionButton variant="add-resource" size="sm" icon={<UploadCloud className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>{copy.fileSelect}</SemanticActionButton><input ref={inputRef} className="sr-only" type="file" multiple onChange={(event) => onFiles(event.target.files)} /></div>
    {message && <p role="status" className="text-xs font-bold text-sky-900">{message}</p>}
    {selected.length > 0 && <ul className="space-y-2">{selected.map((item) => <li key={item.id} className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-sky-200 bg-white px-3"><span className="min-w-0"><strong className="block truncate text-xs text-slate-900">{item.fileName}</strong><span className="text-[10px] font-bold text-slate-500">{boardFileSize(item.size)} \u00b7 {item.status}</span></span><button type="button" onClick={() => onChange(value.filter((id) => id !== item.id))} className="min-h-9 rounded-md px-2 text-xs font-black text-red-700 hover:bg-red-50">{copy.remove}</button></li>)}</ul>}
  </section>;
}

export function BoardAttachmentList({ items, copy, language }: { items: BoardAttachment[]; copy: BoardCopy; language: 'ko' | 'vi' | 'en' }) {
  if (!items.length) return null;
  return <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)]"><h2 className="flex items-center gap-2 text-base font-black"><Paperclip className="h-5 w-5 text-sky-700" />{copy.attachment} <span className="text-xs text-slate-500">{items.length}</span></h2><ul className="mt-4 divide-y divide-[var(--color-border)]">{items.map((item) => <li key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><span className="flex min-w-0 items-center gap-3">{item.status === 'READY' ? <FileCheck2 className="h-5 w-5 shrink-0 text-emerald-700" /> : <FileClock className="h-5 w-5 shrink-0 text-amber-700" />}<span className="min-w-0"><strong className="block truncate text-sm">{item.fileName}</strong><span className="text-[10px] font-bold text-slate-500">{boardFileSize(item.size)} \u00b7 v{item.version} \u00b7 {boardDate(item.createdAt, language)} \u00b7 {item.status}</span></span></span><SemanticActionButton variant="neutral" size="sm" icon={<Download className="h-4 w-4" />} disabled disabledReason={copy.downloadUnavailable}>Download</SemanticActionButton></li>)}</ul></section>;
}
