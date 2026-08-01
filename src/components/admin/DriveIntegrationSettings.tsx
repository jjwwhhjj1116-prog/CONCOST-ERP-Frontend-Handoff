'use client';

import React from 'react';
import {
  Cable,
  CheckCircle2,
  ChevronRight,
  CloudCog,
  FolderCog,
  Link2,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { ConfigurableCard, type ConfigurableCardState } from '@/components/ui/ConfigurableCard';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import { canManageWorkspaceConfiguration } from '@/lib/accessControl';
import {
  createDriveIntegrationDraft,
  deriveDriveProviderState,
  toDriveIntegrationRequest,
  type DriveIntegrationDraft,
  type DriveProviderState,
} from '@/lib/driveIntegration';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import type { CompanyId } from '@/types/models';

const companies: Array<{ id: CompanyId; label: string }> = [
  { id: 'CON_COST', label: 'CON-COST' },
  { id: 'VIET_QS', label: 'Viet QS' },
];

const integrationActions: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  kind: 'CONNECTION' | 'PERMISSION' | 'FOLDER_TEMPLATE';
}> = [
  {
    title: '연결 테스트',
    description: 'OAuth 연결과 Provider 응답',
    icon: Cable,
    kind: 'CONNECTION',
  },
  {
    title: '권한 테스트',
    description: 'Shared Drive와 Root Folder 접근',
    icon: ShieldCheck,
    kind: 'PERMISSION',
  },
  {
    title: 'Folder Template',
    description: 'Project · Claim · Approval · Meeting',
    icon: FolderCog,
    kind: 'FOLDER_TEMPLATE',
  },
];

const providerTone: Record<DriveProviderState, string> = {
  NOT_CONFIGURED: 'border-slate-200 bg-slate-100 text-slate-700',
  CONNECTING: 'border-blue-200 bg-blue-50 text-blue-700',
  READY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DEGRADED: 'border-amber-200 bg-amber-50 text-amber-800',
  FAILED: 'border-red-200 bg-red-50 text-red-800',
  DISABLED: 'border-slate-200 bg-slate-50 text-slate-500',
};

function cardState(state: DriveProviderState): ConfigurableCardState {
  if (state === 'FAILED') return 'ERROR';
  if (state === 'DEGRADED' || state === 'NOT_CONFIGURED') return 'WARNING';
  if (state === 'DISABLED') return 'DISABLED';
  return 'DEFAULT';
}

export function DriveIntegrationSettings() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const selectedCompany = useUiStore((state) => state.brandWorkspace);
  const [selectedId, setSelectedId] = React.useState<CompanyId | null>(null);
  const [drafts, setDrafts] = React.useState<Record<CompanyId, DriveIntegrationDraft>>({
    CON_COST: createDriveIntegrationDraft('CON_COST'),
    VIET_QS: createDriveIntegrationDraft('VIET_QS'),
  });
  const [saved, setSaved] = React.useState<Record<CompanyId, string>>({
    CON_COST: JSON.stringify(createDriveIntegrationDraft('CON_COST')),
    VIET_QS: JSON.stringify(createDriveIntegrationDraft('VIET_QS')),
  });
  const [feedback, setFeedback] = React.useState('');
  const mode = getRuntimeExecutionMode();
  const canEdit =
    Boolean(currentUser && canManageWorkspaceConfiguration(currentUser)) &&
    mode === 'DEMO_LOCAL';
  const providerReady = process.env.NEXT_PUBLIC_DRIVE_PROVIDER_READY === 'true';
  const adapterReady = process.env.NEXT_PUBLIC_DRIVE_ADAPTER_READY === 'true';
  const providerState = deriveDriveProviderState({
    enabled: true,
    adapterReady,
    providerReady,
  });
  const selectedDraft = selectedId ? drafts[selectedId] : null;
  const dirty =
    Boolean(selectedId && selectedDraft) &&
    saved[selectedId as CompanyId] !== JSON.stringify(selectedDraft);

  if (!currentUser) return null;

  const updateDraft = (
    companyId: CompanyId,
    update: Partial<DriveIntegrationDraft>,
  ) => {
    setDrafts((current) => ({
      ...current,
      [companyId]: { ...current[companyId], ...update },
    }));
  };

  const providerAction = (action: 'CONNECT' | 'CHANGE' | 'REAUTH' | 'DISCONNECT') => {
    if (!canEdit) {
      setFeedback('Backend 관리자 Capability가 확인되지 않아 요청하지 않았습니다.');
      return;
    }
    setFeedback(
      `${action} 요청 UI를 확인했습니다. DEMO_LOCAL에서는 OAuth 요청을 전송하거나 연결 상태를 변경하지 않습니다.`,
    );
  };

  const runTest = (kind: 'CONNECTION' | 'PERMISSION') => {
    setFeedback(
      `${kind} 테스트는 Backend Adapter가 응답해야 완료됩니다. 현재 성공으로 표시하지 않았습니다.`,
    );
  };

  const handleIntegrationAction = (
    kind: 'CONNECTION' | 'PERMISSION' | 'FOLDER_TEMPLATE',
  ) => {
    if (kind === 'FOLDER_TEMPLATE') {
      setSelectedId(selectedCompany);
      setFeedback('선택한 회사의 설정 Drawer에서 Folder Template을 확인하고 편집합니다.');
      return;
    }
    runTest(kind);
  };

  const saveDraft = () => {
    if (!selectedId || !selectedDraft || !canEdit) return;
    try {
      toDriveIntegrationRequest(selectedDraft);
      setSaved((current) => ({
        ...current,
        [selectedId]: JSON.stringify(selectedDraft),
      }));
      setFeedback(
        'DEMO_LOCAL 설정 초안에만 반영했습니다. 서버 Binding과 Google Drive 설정은 변경되지 않았습니다.',
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '설정 값을 확인하세요.');
    }
  };

  return (
    <main className="space-y-5">
      <header className="flex flex-col gap-4 border-b border-[var(--color-border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[.18em] text-[#4e6fd8]">
            ADMIN INTEGRATION
          </p>
          <h1 className="mt-2 text-3xl font-black text-[var(--color-text-main)]">
            Google Drive 관리자 설정
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[var(--color-text-sub)]">
            회사별 Shared Drive와 Root Folder Binding을 구성합니다. Token과 Secret은 Frontend에 입력하거나 저장하지 않습니다.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 border border-[#dbe3f4] bg-[#f4f7ff] px-3 py-2 text-xs font-black text-[#40537a]">
          <ShieldCheck className="h-4 w-4" />
          {canEdit ? '관리자 · DEMO_LOCAL 초안' : 'Read-only · Backend Capability 필요'}
        </span>
      </header>

      <section className="grid gap-3 lg:grid-cols-2">
        {companies.map((company) => (
          <ConfigurableCard
            key={company.id}
            title={`${company.label} Drive Binding`}
            description="계정, Shared Drive, Root Folder와 Project/Claim 폴더 템플릿"
            icon={CloudCog}
            status={
              <span className={`border px-2 py-1 text-[9px] font-black ${providerTone[providerState]}`}>
                {providerState}
              </span>
            }
            meta={`${company.id === selectedCompany ? '현재 Workspace' : '다른 Workspace'} · Secret 0`}
            state={selectedId === company.id ? 'SELECTED' : cardState(providerState)}
            readOnly={!canEdit}
            onOpen={() => {
              setSelectedId(company.id);
              setFeedback('');
            }}
          />
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {integrationActions.map(({ title, description, icon: Icon, kind }) => (
          <button
            key={title}
            type="button"
            onClick={() => handleIntegrationAction(kind)}
            aria-label={`${title} 열기`}
            className="group flex min-h-28 cursor-pointer items-start gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#91a5e5] hover:shadow-[var(--cc-shadow-2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#4e6fd8]/20"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#eef2ff] text-[#405bb0]">
              <Icon className="h-5 w-5" strokeWidth={1.85} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm text-[var(--color-text-main)]">{title}</strong>
              <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
                {description}
              </span>
            </span>
            <ChevronRight className="mt-1 h-4 w-4 text-[var(--color-text-sub)] transition-transform group-hover:translate-x-1" />
          </button>
        ))}
      </section>

      {feedback && (
        <div role="status" className="border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
          {feedback}
        </div>
      )}

      <DetailDrawer
        open={Boolean(selectedDraft)}
        title={selectedId ? `${selectedId} Drive 설정` : 'Drive 설정'}
        description="OAuth Secret은 Backend Vault에서만 관리합니다."
        canEdit={canEdit}
        dirty={dirty}
        onClose={() => setSelectedId(null)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-[10px] font-bold text-[var(--color-text-sub)]">
              현재 Provider: {providerState}
            </span>
            <button
              type="button"
              disabled={!canEdit || !dirty}
              onClick={saveDraft}
              className="min-h-11 bg-[#172554] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Demo 설정 초안 적용
            </button>
          </div>
        }
      >
        {selectedDraft && selectedId && (
          <div className="space-y-6">
            <section aria-label="Drive 연결 상태" className="grid grid-cols-2 gap-2">
              {[
                ['Account', selectedDraft.accountLabel ? '입력됨' : '미설정'],
                ['Shared Drive', selectedDraft.sharedDriveId ? '선택됨' : '미설정'],
                ['Root Folder', selectedDraft.rootFolderId ? '선택됨' : '미설정'],
                ['Test', providerState],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3"
                >
                  <span className="block text-[9px] font-black uppercase tracking-[.08em] text-[var(--color-text-sub)]">
                    {label}
                  </span>
                  <strong className="mt-1 block text-xs text-[var(--color-text-main)]">
                    {value}
                  </strong>
                </div>
              ))}
            </section>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ['CONNECT', Link2],
                ['CHANGE', RefreshCw],
                ['REAUTH', CheckCircle2],
                ['DISCONNECT', Unplug],
              ].map(([action, Icon]) => (
                <button
                  key={String(action)}
                  type="button"
                  onClick={() => providerAction(action as 'CONNECT' | 'CHANGE' | 'REAUTH' | 'DISCONNECT')}
                  className="flex min-h-16 flex-col items-center justify-center gap-1 border border-[var(--color-border)] text-[10px] font-black hover:bg-[var(--cc-surface-2)]"
                >
                  <Icon className="h-4 w-4" />
                  {String(action)}
                </button>
              ))}
            </div>

            <fieldset disabled={!canEdit} className="space-y-4">
              <legend className="text-sm font-black text-[var(--color-text-main)]">
                회사별 Binding Metadata
              </legend>
              {[
                ['accountLabel', '연결 계정 표시명', 'demo-6a667aaef37f@example.invalid'],
                ['sharedDriveId', 'Shared Drive ID', 'Backend 조회값'],
                ['sharedDriveName', 'Shared Drive 이름', '회사 Shared Drive'],
                ['rootFolderUrl', 'Root Folder URL / Picker', 'https://drive.google.com/drive/folders/...'],
                ['rootFolderId', 'Root Folder ID', 'Backend 검증값'],
              ].map(([key, label, placeholder]) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-[11px] font-black text-[var(--color-text-sub)]">
                    {label}
                  </span>
                  <input
                    value={String(selectedDraft[key as keyof DriveIntegrationDraft] ?? '')}
                    placeholder={placeholder}
                    onChange={(event) =>
                      updateDraft(selectedId, { [key]: event.target.value })
                    }
                    className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-semibold text-[var(--color-text-main)]"
                  />
                </label>
              ))}
            </fieldset>

            <fieldset disabled={!canEdit}>
              <legend className="text-sm font-black text-[var(--color-text-main)]">
                Folder Template
              </legend>
              <div className="mt-3 space-y-2">
                {selectedDraft.folderTemplates.map((template, index) => (
                  <div
                    key={template.id}
                    className="grid gap-2 border border-[var(--color-border)] p-3 sm:grid-cols-[auto_120px_minmax(0,1fr)] sm:items-center"
                  >
                    <input
                      type="checkbox"
                      checked={template.enabled}
                      onChange={(event) =>
                        updateDraft(selectedId, {
                          folderTemplates: selectedDraft.folderTemplates.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, enabled: event.target.checked } : item,
                          ),
                        })
                      }
                    />
                    <strong className="text-xs text-[var(--color-text-main)]">{template.label}</strong>
                    <input
                      value={template.relativePath}
                      onChange={(event) =>
                        updateDraft(selectedId, {
                          folderTemplates: selectedDraft.folderTemplates.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, relativePath: event.target.value } : item,
                          ),
                        })
                      }
                      className="min-h-10 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-semibold text-[var(--color-text-main)]"
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        )}
      </DetailDrawer>
    </main>
  );
}
