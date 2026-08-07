'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowUpRight,
  Building2,
  Cloud,
  FileCheck2,
  FileClock,
  FileWarning,
  FolderKanban,
  FolderLock,
  FolderOpen,
  Link2,
  LockKeyhole,
  RefreshCw,
  Settings,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { ActionButtonGroup, SemanticActionButton } from '@/components/ui/SemanticActionButton';
import {
  executeFrontendMutation,
  getFrontendModuleBoundary,
} from '@/lib/frontendDataSource';
import { matchesTechnicalDepartment } from '@/lib/departmentScope';
import { useAuthStore } from '@/store/authStore';
import { canManageWorkspaceConfiguration } from '@/lib/accessControl';
import { ClaimDriveContextPanel } from '@/components/claims/ClaimDriveContextPanel';

type DriveFolder = 'HOME' | 'TECHNICAL' | 'CLAIM' | 'DEVELOPMENT';
type UploadState = 'QUEUED' | 'UPLOADING' | 'SCANNING' | 'READY' | 'FAILED';

interface UploadItem {
  id: string;
  name: string;
  size: number;
  progress: number;
  state: UploadState;
  binding: string;
}

const copy = {
  ko: {
    eyebrow: 'SECURE COMPANY DRIVE',
    title: '회사 드라이브',
    description: '권한이 있는 Shared Drive와 프로젝트 자료를 한곳에서 관리합니다.',
    permission: '계정·조직 권한 기반',
    forbidden: '이 자료실에 접근할 권한이 없습니다.',
    forbiddenDetail: 'Backend는 선택 회사, 조직, 프로젝트 참여 권한을 다시 검증해야 합니다.',
    home: '드라이브 홈',
    technical: '기술본부 드라이브',
    claim: '클레임센터 드라이브',
    development: '개발팀 드라이브',
    recent: '최근 문서',
    projects: '프로젝트 폴더',
    meetings: '회의록',
    approvals: '결재·확정본',
    upload: '파일 업로드',
    empty: '업로드 대기 파일이 없습니다.',
    security: 'Google Shared Drive 연결 원칙',
    securityDetail:
      'Frontend에는 Drive Token이나 비밀키를 저장하지 않습니다. Backend가 권한을 검증하고 READY 파일만 다운로드 URL로 제공합니다.',
    binding: '연결 대상',
    projectBinding: 'Project / Claim folder binding',
    openBinding: '연결 화면 열기',
    unassigned: '연결 대상 미지정',
  },
  vi: {
    eyebrow: 'KHO TÀI LIỆU AN TOÀN',
    title: 'Kho tài liệu công ty',
    description: 'Quản lý Shared Drive và tài liệu dự án theo đúng phạm vi quyền hạn.',
    permission: 'Theo quyền tài khoản và tổ chức',
    forbidden: 'Bạn không có quyền truy cập kho tài liệu này.',
    forbiddenDetail: 'Backend phải kiểm tra lại công ty, tổ chức và quyền tham gia dự án.',
    home: 'Trang chủ Drive',
    technical: 'Drive Khối Kỹ thuật',
    claim: 'Drive Trung tâm Claim',
    development: 'Drive Đội Phát triển',
    recent: 'Tài liệu gần đây',
    projects: 'Thư mục dự án',
    meetings: 'Biên bản họp',
    approvals: 'Hồ sơ đã duyệt',
    upload: 'Tải tệp lên',
    empty: 'Không có tệp đang chờ tải lên.',
    security: 'Nguyên tắc Google Shared Drive',
    securityDetail:
      'Frontend không lưu Drive Token hoặc secret. Backend kiểm tra quyền và chỉ cấp URL tải xuống cho tệp READY.',
    binding: 'Phạm vi liên kết',
    projectBinding: 'Liên kết thư mục Project / Claim',
    openBinding: 'Mở không gian liên kết',
    unassigned: 'Chưa chọn phạm vi liên kết',
  },
  en: {
    eyebrow: 'SECURE COMPANY DRIVE',
    title: 'Company Drive',
    description: 'Manage authorized Shared Drives and project records in one workspace.',
    permission: 'Account and organization scoped',
    forbidden: 'You do not have access to this drive.',
    forbiddenDetail: 'The Backend must re-check company, organization, and project membership.',
    home: 'Drive Home',
    technical: 'Technical HQ Drive',
    claim: 'Claim Center Drive',
    development: 'Development Team Drive',
    recent: 'Recent documents',
    projects: 'Project folders',
    meetings: 'Meeting minutes',
    approvals: 'Approved records',
    upload: 'Upload files',
    empty: 'There are no files waiting to upload.',
    security: 'Google Shared Drive security',
    securityDetail:
      'The Frontend never stores Drive tokens or secrets. The Backend authorizes access and returns download URLs only for READY files.',
    binding: 'Binding target',
    projectBinding: 'Project / Claim folder binding',
    openBinding: 'Open linked workspace',
    unassigned: 'No binding selected',
  },
};

const folderKeys: Exclude<DriveFolder, 'HOME'>[] = [
  'TECHNICAL',
  'CLAIM',
  'DEVELOPMENT',
];

const folderIcons = {
  HOME: Cloud,
  TECHNICAL: Building2,
  CLAIM: FolderLock,
  DEVELOPMENT: FolderOpen,
};

function normalizeFolder(value: string | null): DriveFolder {
  return folderKeys.includes(value as Exclude<DriveFolder, 'HOME'>)
    ? (value as DriveFolder)
    : 'HOME';
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

const stateMeta: Record<
  UploadState,
  { label: string; icon: typeof FileClock; color: string }
> = {
  QUEUED: { label: 'QUEUED', icon: FileClock, color: 'text-slate-600' },
  UPLOADING: { label: 'UPLOADING', icon: UploadCloud, color: 'text-blue-700' },
  SCANNING: { label: 'SCANNING', icon: ShieldCheck, color: 'text-amber-700' },
  READY: { label: 'READY', icon: FileCheck2, color: 'text-emerald-700' },
  FAILED: { label: 'FAILED', icon: FileWarning, color: 'text-red-700' },
};

export function DriveWorkspace() {
  const searchParams = useSearchParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const { brandWorkspace, locale, setLocale } = useHandoffLocale();
  const requestedProjectId = searchParams.get('projectId');
  const requestedClaimId = searchParams.get('claimId');
  const routeBinding = requestedClaimId
    ? `claim:${requestedClaimId}`
    : requestedProjectId
      ? `project:${requestedProjectId}`
      : 'project:unassigned';
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [selectedBinding, setSelectedBinding] = useState<string | null>(null);
  const binding = selectedBinding ?? routeBinding;
  const [notice, setNotice] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const folder = normalizeFolder(searchParams.get('folder'));
  const t = copy[locale];
  const Icon = folderIcons[folder];
  const providerReady = process.env.NEXT_PUBLIC_DRIVE_PROVIDER_READY === 'true';
  const adapterReady = process.env.NEXT_PUBLIC_DRIVE_ADAPTER_READY === 'true';
  const boundary = getFrontendModuleBoundary('DRIVE', {
    locale,
    adapterReady,
    providerRequired: true,
    providerState: providerReady ? 'READY' : 'NOT_CONFIGURED',
  });
  const canManageDrive =
    Boolean(currentUser && canManageWorkspaceConfiguration(currentUser));

  const access = useMemo(() => {
    if (!currentUser) return false;
    if (
      folder === 'HOME' ||
      ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'DEPARTMENT_MANAGER'].includes(currentUser.role)
    ) {
      return true;
    }
    if (folder === 'TECHNICAL') {
      return ['FINISH', 'STRUCTURE', 'CIVIL_LANDSCAPE'].some((scope) =>
        matchesTechnicalDepartment(
          scope as 'FINISH' | 'STRUCTURE' | 'CIVIL_LANDSCAPE',
          currentUser,
        ),
      );
    }
    return matchesTechnicalDepartment(folder, currentUser);
  }, [currentUser, folder]);

  if (!currentUser) return null;

  const folderLabel = {
    HOME: t.home,
    TECHNICAL: t.technical,
    CLAIM: t.claim,
    DEVELOPMENT: t.development,
  }[folder];
  const [bindingType, bindingId] = binding.split(':');
  const bindingHref =
    bindingId && bindingId !== 'unassigned'
      ? bindingType === 'claim'
        ? `/projects?group=CLAIM&workflow=${encodeURIComponent(requestedProjectId || '')}&claimId=${encodeURIComponent(bindingId)}`
        : `/projects?projectId=${encodeURIComponent(bindingId)}`
      : null;

  const addFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const result = await executeFrontendMutation(boundary, {
      simulate: () =>
        files.map<UploadItem>((file, index) => ({
          id: `demo-upload-${Date.now()}-${index}`,
          name: file.name,
          size: file.size,
          progress: 0,
          state: 'QUEUED',
          binding,
        })),
    });
    if (result.kind === 'BLOCKED') {
      setNotice(result.message);
      event.target.value = '';
      return;
    }
    setUploads((items) => [...result.data, ...items]);
    setNotice(result.message);
    event.target.value = '';
  };

  const advanceUpload = (id: string) => {
    setUploads((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        if (item.state === 'QUEUED') return { ...item, state: 'UPLOADING', progress: 48 };
        if (item.state === 'UPLOADING') return { ...item, state: 'SCANNING', progress: 100 };
        if (item.state === 'SCANNING') return { ...item, state: 'READY', progress: 100 };
        return item;
      }),
    );
  };

  return (
    <div className="page-shell">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[.16em] text-[var(--color-primary)]">
            {t.eyebrow}
          </p>
          <h1 className="mt-2 flex items-center gap-3 text-[30px] font-black text-[var(--color-text-main)]">
            <Icon className="h-8 w-8" />
            {folder === 'HOME' ? t.title : folderLabel}
          </h1>
          <p className="mt-2 max-w-3xl text-[15px] font-semibold text-[var(--color-text-sub)]">
            {t.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HandoffLanguageToggle locale={locale} onChange={setLocale} />
          {canManageDrive && (
            <Link
              href="/settings/integrations/drive"
              className="inline-flex min-h-10 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-black text-[var(--color-text-main)] hover:border-[#4e6fd8]"
            >
              <Settings className="h-4 w-4" />
              Drive 관리자 설정
            </Link>
          )}
          <span className="inline-flex min-h-10 items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            {t.permission}
          </span>
        </div>
      </header>

      <RuntimeCapabilityPanel boundary={boundary} />
      {notice && (
        <div
          role="status"
          className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
        >
          {notice}
        </div>
      )}

      {!access ? (
        <section className="grid min-h-80 place-items-center border border-dashed border-red-200 bg-red-50/50 p-8 text-center">
          <div>
            <LockKeyhole className="mx-auto h-11 w-11 text-red-600" />
            <h2 className="mt-3 text-xl font-black text-red-900">{t.forbidden}</h2>
            <p className="mt-2 text-sm font-semibold text-red-700">{t.forbiddenDetail}</p>
          </div>
        </section>
      ) : (
        <>
          {folder === 'HOME' ? (
            <section className="grid gap-4 lg:grid-cols-3">
              {folderKeys.map((key) => {
                const FolderIcon = folderIcons[key];
                const label = {
                  TECHNICAL: t.technical,
                  CLAIM: t.claim,
                  DEVELOPMENT: t.development,
                }[key];
                return (
                  <Link
                    key={key}
                    href={`?folder=${key}`}
                    className="cc-tactile-card min-h-48 p-6"
                    data-interactive="true"
                  >
                    <FolderIcon className="h-8 w-8 text-[var(--color-primary)]" />
                    <h2 className="mt-6 text-lg font-black text-[var(--color-text-main)]">
                      {label}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-sub)]">
                      {t.projectBinding}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-2 text-xs font-black text-[var(--color-primary)]">
                      <LockKeyhole className="h-4 w-4" />
                      {brandWorkspace}
                    </span>
                  </Link>
                );
              })}
            </section>
          ) : (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                [FolderKanban, t.projects, 'projectId'],
                [FileClock, t.meetings, 'meetingMinuteId'],
                [FileCheck2, t.approvals, 'approvalId'],
                [RefreshCw, t.recent, 'fileReferenceId'],
              ].map(([CardIcon, title, id]) => {
                const ItemIcon = CardIcon as typeof FolderKanban;
                return (
                  <article key={String(id)} className="cc-tactile-card min-h-44 p-5">
                    <ItemIcon className="h-7 w-7 text-[var(--color-primary)]" />
                    <h2 className="mt-5 font-black text-[var(--color-text-main)]">
                      {String(title)}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--color-text-sub)]">
                      canonical <code>{String(id)}</code>
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1 text-xs font-black text-[var(--color-text-sub)]">
                      <Link2 className="h-3.5 w-3.5" />
                      {t.binding}
                    </span>
                  </article>
                );
              })}
            </section>
          )}

          {folder === 'CLAIM' && requestedProjectId && requestedClaimId && (
            <ClaimDriveContextPanel projectId={requestedProjectId} claimId={requestedClaimId} locale={locale} />
          )}

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="cc-panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] p-5">
                <div>
                  <h2 className="text-lg font-black text-[var(--color-text-main)]">
                    {t.upload}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--color-text-sub)]">
                    QUEUED → UPLOADING → SCANNING → READY
                  </p>
                </div>
                <SemanticActionButton variant="add-resource" icon={<UploadCloud className="h-4 w-4" />} tooltip={t.upload} onClick={() => inputRef.current?.click()}>{t.upload}</SemanticActionButton>
                <input ref={inputRef} hidden multiple type="file" onChange={addFiles} />
              </div>
              <div className="min-h-56">
                {uploads.length === 0 ? (
                  <div className="grid min-h-56 place-items-center text-sm font-semibold text-[var(--color-text-sub)]">
                    {t.empty}
                  </div>
                ) : (
                  <ul className="divide-y divide-[var(--color-border)]">
                    {uploads.map((item) => {
                      const meta = stateMeta[item.state];
                      const StateIcon = meta.icon;
                      return (
                        <li
                          key={item.id}
                          className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_140px_auto] sm:items-center"
                        >
                          <div className="min-w-0">
                            <strong className="block truncate text-sm text-[var(--color-text-main)]">
                              {item.name}
                            </strong>
                            <span className="text-xs text-[var(--color-text-sub)]">
                              {formatBytes(item.size)} · {item.binding}
                            </span>
                            <div className="mt-2 h-1.5 overflow-hidden bg-[var(--cc-surface-3)]">
                              <span
                                className="block h-full bg-[var(--color-primary)]"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-2 text-xs font-black ${meta.color}`}>
                            <StateIcon className="h-4 w-4" />
                            {meta.label}
                          </span>
                          <ActionButtonGroup label={`${item.name} 업로드 작업`}>
                            {!['READY', 'FAILED'].includes(item.state) && (
                              <SemanticActionButton size="icon" variant="neutral" icon={<RefreshCw className="h-4 w-4" />} tooltip="Demo 상태 진행" onClick={() => advanceUpload(item.id)} />
                            )}
                            <SemanticActionButton size="icon" variant="danger" icon={<X className="h-4 w-4" />} tooltip="업로드 항목 제거" onClick={() => setUploads((items) => items.filter((candidate) => candidate.id !== item.id))} />
                          </ActionButtonGroup>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            <aside className="cc-panel p-5">
              <label className="text-xs font-black text-[var(--color-text-main)]">
                {t.binding}
                <select
                  value={binding}
                  onChange={(event) => setSelectedBinding(event.target.value)}
                  className="mt-2 min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm"
                >
                  <option value="project:unassigned">Project · unassigned</option>
                  {requestedProjectId &&
                    requestedProjectId !== 'project-demo-01' && (
                      <option value={`project:${requestedProjectId}`}>
                        Project · {requestedProjectId}
                      </option>
                    )}
                  {requestedClaimId && requestedClaimId !== 'claim-demo-01' && (
                    <option value={`claim:${requestedClaimId}`}>
                      Claim · {requestedClaimId}
                    </option>
                  )}
                  <option value="project:project-demo-01">Project · project-demo-01</option>
                  <option value="claim:claim-demo-01">Claim · claim-demo-01</option>
                </select>
              </label>
              {bindingHref ? (
                <Link
                  href={bindingHref}
                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-xs font-black text-[var(--color-primary)]"
                >
                  {t.openBinding}
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="mt-3 border border-dashed border-[var(--color-border)] px-3 py-2 text-center text-[11px] font-bold text-[var(--color-text-sub)]">
                  {t.unassigned}
                </p>
              )}
              <div className="mt-5 border-t border-[var(--color-border)] pt-5">
                <h2 className="font-black text-[var(--color-text-main)]">{t.security}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-sub)]">
                  {t.securityDetail}
                </p>
              </div>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
