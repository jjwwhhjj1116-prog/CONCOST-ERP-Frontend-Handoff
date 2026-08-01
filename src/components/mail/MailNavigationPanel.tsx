'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Archive,
  CircleAlert,
  FileText,
  Folder,
  HardDrive,
  Inbox,
  Mail,
  MailOpen,
  MessageSquareText,
  PenLine,
  Send,
  Settings,
  Star,
  Trash2,
} from 'lucide-react';

import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { SecondaryNavIcon } from '@/components/navigation/SecondaryNavIcon';
import {
  getMailFolderHref,
  getMailFolderLabel,
  getProjectMailFolders,
  MAIL_PRIMARY_FOLDERS,
  MAIL_USER_FOLDERS,
  parseMailFolder,
  type MailFolderId,
  type MailWorkspaceId,
} from '@/lib/mailNavigation';

const FOLDER_ICONS: Record<MailFolderId, typeof Mail> = {
  ALL: Mail,
  INBOX: Inbox,
  SENT: Send,
  STARRED: Star,
  PENDING: MailOpen,
  DRAFT: FileText,
  MEMO: MessageSquareText,
  SPAM: CircleAlert,
  TRASH: Trash2,
  USER: Archive,
  PROJECT: Folder,
};

const SECTION_COPY = {
  ko: {
    compose: '메일쓰기',
    memo: '메모작성',
    mailboxes: '메일함',
    userFolders: '사용자 폴더',
    projectFolders: '프로젝트 메일함',
    storage: '용량·설정',
    storageStatus: 'Provider 연결 후 사용량 확인',
    settings: '메일 환경설정',
  },
  vi: {
    compose: 'Soạn thư',
    memo: 'Tạo ghi chú',
    mailboxes: 'Hộp thư',
    userFolders: 'Thư mục cá nhân',
    projectFolders: 'Thư theo dự án',
    storage: 'Dung lượng · Cài đặt',
    storageStatus: 'Kiểm tra sau khi kết nối Provider',
    settings: 'Cài đặt thư',
  },
  en: {
    compose: 'Compose',
    memo: 'New memo',
    mailboxes: 'Mailboxes',
    userFolders: 'User folders',
    projectFolders: 'Project mailboxes',
    storage: 'Storage · Settings',
    storageStatus: 'Available after Provider connection',
    settings: 'Mail settings',
  },
} as const;

export function MailNavigationPanel({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  const { brandWorkspace, locale } = useHandoffLocale();
  const workspaceId: MailWorkspaceId =
    brandWorkspace === 'VIET_QS' ? 'VIET_QS' : 'CON_COST';
  const copy = SECTION_COPY[locale];
  const activeFolder = parseMailFolder(searchParams.get('box'));
  const activeUserFolder = searchParams.get('folder');
  const activeProjectId = searchParams.get('projectId');
  const projectFolders = getProjectMailFolders(workspaceId);

  const linkClass = (active: boolean) =>
    `group relative flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-[12px] font-bold transition ${
      active
        ? 'bg-white font-black text-[#bd4b00] shadow-[0_7px_20px_rgba(129,65,18,.12)] ring-1 ring-[#f2d6bf]'
        : 'text-[#684d3b] hover:bg-white/70 hover:text-[#a94100]'
    } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a1f]/45`;

  return (
    <div data-mail-secondary-panel className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={getMailFolderHref('ALL', { compose: 'NEW' })}
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-3 text-[11px] font-black text-white shadow-[0_8px_18px_rgba(235,99,0,.22)]"
        >
          <PenLine className="h-4 w-4" />
          {copy.compose}
        </Link>
        <Link
          href={getMailFolderHref('MEMO', { compose: 'MEMO' })}
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#efd5c0] bg-white/75 px-3 text-[11px] font-black text-[#684d3b]"
        >
          <MessageSquareText className="h-4 w-4 text-[#eb6300]" />
          {copy.memo}
        </Link>
      </div>

      <MailSectionLabel>{copy.mailboxes}</MailSectionLabel>
      <nav aria-label={copy.mailboxes} className="space-y-0.5">
        {MAIL_PRIMARY_FOLDERS.map((folder) => {
          const Icon = FOLDER_ICONS[folder];
          const active =
            activeFolder === folder &&
            !activeUserFolder &&
            !activeProjectId;
          return (
            <Link
              key={folder}
              href={getMailFolderHref(folder)}
              onClick={onNavigate}
              title={getMailFolderLabel(folder, locale)}
              aria-current={active ? 'page' : undefined}
              className={linkClass(active)}
              data-secondary-nav-item={`mail-${folder.toLowerCase()}`}
            >
              {active && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-[#ff6b00]" />
              )}
              <SecondaryNavIcon
                id={`mail-${folder.toLowerCase()}`}
                fallbackIcon={Icon}
                active={active}
              />
              <span className="min-w-0 flex-1 truncate">
                {getMailFolderLabel(folder, locale)}
              </span>
            </Link>
          );
        })}
      </nav>

      <MailSectionLabel>{copy.userFolders}</MailSectionLabel>
      <nav aria-label={copy.userFolders} className="space-y-0.5">
        {MAIL_USER_FOLDERS.map((folder) => {
          const active =
            activeFolder === 'USER' && activeUserFolder === folder.id;
          return (
            <Link
              key={folder.id}
              href={getMailFolderHref('USER', { folderId: folder.id })}
              onClick={onNavigate}
              title={folder.labels[locale]}
              aria-current={active ? 'page' : undefined}
              className={linkClass(active)}
              data-secondary-nav-item="mail-user"
            >
              <SecondaryNavIcon id="mail-user" fallbackIcon={Folder} active={active} />
              <span className="min-w-0 flex-1 truncate">
                {folder.labels[locale]}
              </span>
            </Link>
          );
        })}
      </nav>

      <MailSectionLabel>{copy.projectFolders}</MailSectionLabel>
      <nav aria-label={copy.projectFolders} className="space-y-0.5">
        {projectFolders.map((project) => {
          const active =
            activeFolder === 'PROJECT' && activeProjectId === project.id;
          return (
            <Link
              key={project.id}
              href={getMailFolderHref('PROJECT', { projectId: project.id })}
              onClick={onNavigate}
              title={project.name}
              aria-current={active ? 'page' : undefined}
              className={linkClass(active)}
              data-secondary-nav-item="mail-project"
            >
              <SecondaryNavIcon id="mail-project" fallbackIcon={Folder} active={active} />
              <span className="min-w-0 flex-1 truncate">{project.name}</span>
            </Link>
          );
        })}
      </nav>

      <section className="border-t border-[#efdcc9] pt-4">
        <MailSectionLabel>{copy.storage}</MailSectionLabel>
        <div className="rounded-xl border border-[#efd5c0] bg-white/65 p-3">
          <div className="flex items-start gap-2.5">
            <SecondaryNavIcon id="mail-storage" fallbackIcon={HardDrive} />
            <p className="text-[10px] font-bold leading-4 text-[#8d6d58]">
              {copy.storageStatus}
            </p>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#f5e7da]">
            <div className="h-full w-0 bg-[#ff6b00]" />
          </div>
          <Link
            href="/settings?section=mail"
            onClick={onNavigate}
            className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#efd5c0] bg-white text-[10px] font-black text-[#684d3b]"
          >
            <SecondaryNavIcon id="mail-settings" fallbackIcon={Settings} />
            {copy.settings}
          </Link>
        </div>
      </section>
    </div>
  );
}

function MailSectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 text-[9px] font-black uppercase tracking-[.16em] text-[#b5957e]">
      {children}
    </p>
  );
}
