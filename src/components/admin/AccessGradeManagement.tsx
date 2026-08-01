'use client';

import React from 'react';
import { BadgeDollarSign, Building2, ShieldCheck, UserRoundCog } from 'lucide-react';

import { ConfigurableCard } from '@/components/ui/ConfigurableCard';
import { DetailDrawer } from '@/components/ui/DetailDrawer';
import {
  canManageWorkspaceConfiguration,
  evaluateFinanceAccess,
  resolveAccessGrade,
} from '@/lib/accessControl';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useAuthStore } from '@/store/authStore';
import type { AccessGrade, PersonnelCard } from '@/types/models';

const gradeMeta: Record<
  AccessGrade,
  { label: string; description: string; tone: string }
> = {
  ADMIN: {
    label: 'ADMIN',
    description: '시스템 설정과 접근정책 관리',
    tone: 'bg-purple-100 text-purple-800',
  },
  GRADE_1: {
    label: 'GRADE 1',
    description: '대표·부사장',
    tone: 'bg-indigo-100 text-indigo-800',
  },
  GRADE_2: {
    label: 'GRADE 2',
    description: '실장·팀장',
    tone: 'bg-blue-100 text-blue-800',
  },
  GRADE_3: {
    label: 'GRADE 3',
    description: 'PM',
    tone: 'bg-emerald-100 text-emerald-800',
  },
  GRADE_4: {
    label: 'GRADE 4',
    description: '선임·프로·일반',
    tone: 'bg-slate-100 text-slate-700',
  },
};

const grades = Object.keys(gradeMeta) as AccessGrade[];

function userLabel(user: PersonnelCard) {
  return user.displayName || user.name;
}

export function AccessGradeManagement() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const personnel = useAuthStore((state) => state.users);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [selectedId, setSelectedId] = React.useState('');
  const selected = personnel.find((person) => person.id === selectedId) ?? null;
  const [draftGrade, setDraftGrade] = React.useState<AccessGrade>('GRADE_4');
  const [financeCapability, setFinanceCapability] = React.useState(false);
  const [savedSnapshot, setSavedSnapshot] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const mode = getRuntimeExecutionMode();
  const administrator = currentUser
    ? canManageWorkspaceConfiguration(currentUser)
    : false;
  const canEdit = administrator && mode === 'DEMO_LOCAL';

  const openPerson = (person: PersonnelCard) => {
    const grade = resolveAccessGrade(person);
    const finance = person.capabilities?.includes('FINANCE_ACCESS') ?? false;
    setSelectedId(person.id);
    setDraftGrade(grade);
    setFinanceCapability(finance);
    setSavedSnapshot(`${grade}:${finance}`);
    setFeedback('');
  };

  if (!currentUser) return null;

  const financeDecision = selected
    ? evaluateFinanceAccess(
        {
          ...selected,
          accessGrade: draftGrade,
          capabilities: financeCapability ? ['FINANCE_ACCESS'] : [],
        },
        mode,
      )
    : null;
  const dirty =
    Boolean(selected) && savedSnapshot !== `${draftGrade}:${financeCapability}`;

  const save = () => {
    if (!selected || !canEdit) return;
    const capabilities = financeCapability ? ['FINANCE_ACCESS' as const] : [];
    updateUser(selected.id, {
      accessGrade: draftGrade,
      capabilities,
    });
    setSavedSnapshot(`${draftGrade}:${financeCapability}`);
    setFeedback('DEMO_LOCAL 브라우저 설정에만 반영했습니다. 서버 권한은 변경되지 않았습니다.');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#eb6300]" />
            <h2 className="text-base font-black text-[var(--color-text-main)]">
              직원등급·특별권한
            </h2>
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
            직급은 인사정보이며 접근등급과 재무 Capability는 별도 정책입니다. 운영 권한은 Backend 응답이 최종 기준입니다.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 border border-[#dbe3f4] bg-[#f4f7ff] px-3 py-2 text-[10px] font-black text-[#40537a]">
          <UserRoundCog className="h-4 w-4" />
          {canEdit ? 'DEMO_LOCAL 편집' : 'Read-only · Backend 승인 필요'}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {personnel.slice(0, 12).map((person) => {
          const grade = resolveAccessGrade(person);
          const finance = evaluateFinanceAccess(person, mode);
          return (
            <ConfigurableCard
              key={person.id}
              icon={grade === 'ADMIN' ? ShieldCheck : Building2}
              title={userLabel(person)}
              description={`${person.departmentName || person.departmentId} · ${
                person.jobTitle || person.organizationRank || person.role
              }`}
              status={
                <span className={`px-2 py-1 text-[9px] font-black ${gradeMeta[grade].tone}`}>
                  {gradeMeta[grade].label}
                </span>
              }
              meta={
                <span className="flex items-center justify-between gap-3">
                  <span>{gradeMeta[grade].description}</span>
                  <span className={finance.allowed ? 'text-emerald-700' : 'text-slate-500'}>
                    재무 {finance.allowed ? '허용' : '제한'}
                  </span>
                </span>
              }
              readOnly={!canEdit}
              state={person.id === selectedId ? 'SELECTED' : 'DEFAULT'}
              onOpen={() => openPerson(person)}
            />
          );
        })}
      </div>

      <DetailDrawer
        open={Boolean(selected)}
        title={selected ? `${userLabel(selected)} 접근 설정` : '접근 설정'}
        description="카드에서 상세를 확인하고, 관리자만 DEMO_LOCAL 정책 초안을 편집할 수 있습니다."
        canEdit={canEdit}
        dirty={dirty}
        onClose={() => setSelectedId('')}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold text-[var(--color-text-sub)]">
              서버 Capability 저장 Endpoint 필요
            </span>
            <button
              type="button"
              onClick={save}
              disabled={!canEdit || !dirty}
              className="min-h-11 bg-[#172554] px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Demo 설정 적용
            </button>
          </div>
        }
      >
        {selected && (
          <div className="space-y-6">
            <div className="grid gap-3 border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-4 sm:grid-cols-2">
              <div>
                <span className="text-[10px] font-black text-[var(--color-text-sub)]">소속</span>
                <strong className="mt-1 block text-sm text-[var(--color-text-main)]">
                  {selected.companyName || selected.companyId} · {selected.departmentName || selected.departmentId}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-black text-[var(--color-text-sub)]">시스템 역할</span>
                <strong className="mt-1 block text-sm text-[var(--color-text-main)]">
                  {selected.systemRole || selected.role}
                </strong>
              </div>
            </div>

            <fieldset disabled={!canEdit}>
              <legend className="text-sm font-black text-[var(--color-text-main)]">직원등급</legend>
              <div className="mt-3 grid gap-2">
                {grades.map((grade) => (
                  <label
                    key={grade}
                    className={`flex cursor-pointer items-center gap-3 border p-3 ${
                      draftGrade === grade
                        ? 'border-[#4e6fd8] bg-[#f5f7ff] dark:bg-[#18243c]'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="access-grade"
                      checked={draftGrade === grade}
                      onChange={() => setDraftGrade(grade)}
                    />
                    <span>
                      <strong className="block text-xs text-[var(--color-text-main)]">
                        {gradeMeta[grade].label}
                      </strong>
                      <span className="text-[10px] font-semibold text-[var(--color-text-sub)]">
                        {gradeMeta[grade].description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="flex gap-3 border border-[var(--color-border)] p-4">
              <input
                type="checkbox"
                checked={financeCapability}
                disabled={!canEdit || !financeDecision?.frontendEligible}
                onChange={(event) => setFinanceCapability(event.target.checked)}
              />
              <span>
                <strong className="flex items-center gap-2 text-sm text-[var(--color-text-main)]">
                  <BadgeDollarSign className="h-4 w-4 text-emerald-700" />
                  FINANCE_ACCESS Backend Capability
                </strong>
                <span className="mt-1 block text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
                  ADMIN, GRADE 1 또는 경영지원본부 Active Membership 대상에게만 요청할 수 있습니다.
                </span>
              </span>
            </label>

            <div
              className={`border p-4 text-xs font-bold ${
                financeDecision?.frontendEligible
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              재무 접근 Preview: {financeDecision?.frontendEligible ? 'Frontend 자격 충족' : '제한'}
              {mode !== 'DEMO_LOCAL' && ' · Backend FINANCE_ACCESS 응답 전까지 접근 차단'}
            </div>

            {feedback && (
              <div role="status" className="border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900">
                {feedback}
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </section>
  );
}
