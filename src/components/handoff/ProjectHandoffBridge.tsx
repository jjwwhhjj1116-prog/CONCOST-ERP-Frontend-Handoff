'use client';

import {
  Bot,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileInput,
  FileQuestion,
  FileSpreadsheet,
  FolderKanban,
  FolderOpen,
  Gavel,
  ListChecks,
  MessageSquareText,
  PackageCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import {
  getFrontendModuleBoundary,
  type FrontendLocale,
} from '@/lib/frontendDataSource';
import {
  buildProjectWorkflowSummary,
  type ProjectWorkflowTab,
} from '@/lib/projectWorkflow';
import type { Project } from '@/types/models';

interface ProjectHandoffBridgeProps {
  projects: Project[];
  onOpenWorkflow: (projectId: string, tab: ProjectWorkflowTab) => void;
}

const copy = {
  ko: {
    eyebrow: 'CANONICAL PROJECT CHAIN',
    title: '프로젝트 실행 연결',
    description:
      '견적·수주부터 접수, 실행계획, 일정, 운영, QC, 납품과 수지까지 하나의 projectId로 연결합니다.',
    select: '연결할 프로젝트',
    empty: '접수 승인 후 활성화된 프로젝트가 표시됩니다.',
    canonical: 'Canonical projectId',
    lifecycle: '전체 Lifecycle',
    assignments: '팀별 Assignment',
    scopeHelp:
      '전체 Lifecycle과 팀별 배정 상태를 분리하고, 부서별 프로젝트 복사본은 만들지 않습니다.',
    chain: '업무 체인',
    modules: 'Project 연결 모듈',
    organization: '조직별 조회',
    all: '기술본부 전체',
    finish: '마감팀',
    structure: '구조팀',
    civil: '토목·조경팀',
    claim: '클레임센터',
    development: '개발팀',
    estimate: '견적·수주',
    intake: '4단계 접수',
    execution: 'Execution Plan',
    active: '프로젝트 활성화',
    operation: '운영·업무일지',
    qc: '질의·QC',
    delivery: '납품',
    profit: '수지분석',
    schedule: '프로젝트 일정',
    questions: '질의사항',
    meetings: '회의록',
    drive: 'Drive',
    approval: '전자결재',
    ai: 'AI 도우미',
    completion: '체인 완성도',
    pending: '승인 대기',
  },
  vi: {
    eyebrow: 'CHUỖI DỰ ÁN CHUẨN',
    title: 'Kết nối thực thi dự án',
    description:
      'Kết nối báo giá, trúng thầu, tiếp nhận, kế hoạch, lịch, vận hành, QC, giao hàng và lợi nhuận bằng một projectId.',
    select: 'Chọn dự án',
    empty: 'Dự án được duyệt tiếp nhận sẽ hiển thị tại đây.',
    canonical: 'Canonical projectId',
    lifecycle: 'Vòng đời chung',
    assignments: 'Phân công nhóm',
    scopeHelp:
      'Tách trạng thái vòng đời và phân công nhóm; không tạo bản sao dự án theo phòng ban.',
    chain: 'Chuỗi công việc',
    modules: 'Mô-đun liên kết',
    organization: 'Xem theo tổ chức',
    all: 'Toàn bộ kỹ thuật',
    finish: 'Hoàn thiện',
    structure: 'Kết cấu',
    civil: 'Hạ tầng·Cảnh quan',
    claim: 'Trung tâm Claim',
    development: 'Nhóm phát triển',
    estimate: 'Báo giá·Trúng thầu',
    intake: 'Tiếp nhận 4 bước',
    execution: 'Execution Plan',
    active: 'Kích hoạt dự án',
    operation: 'Vận hành·Nhật ký',
    qc: 'Câu hỏi·QC',
    delivery: 'Bàn giao',
    profit: 'Lợi nhuận',
    schedule: 'Lịch dự án',
    questions: 'Câu hỏi',
    meetings: 'Biên bản',
    drive: 'Drive',
    approval: 'Phê duyệt',
    ai: 'Trợ lý AI',
    completion: 'Mức hoàn thành',
    pending: 'Chờ duyệt',
  },
  en: {
    eyebrow: 'CANONICAL PROJECT CHAIN',
    title: 'Project execution bridge',
    description:
      'Connect estimate, award, intake, execution plan, schedule, operations, QC, delivery, and profit with one projectId.',
    select: 'Select project',
    empty: 'Projects activated after intake approval appear here.',
    canonical: 'Canonical projectId',
    lifecycle: 'Overall lifecycle',
    assignments: 'Team assignments',
    scopeHelp:
      'Lifecycle and team assignment states stay separate; no departmental project copies are created.',
    chain: 'Workflow chain',
    modules: 'Connected modules',
    organization: 'Organization views',
    all: 'Technical HQ',
    finish: 'Finish team',
    structure: 'Structure team',
    civil: 'Civil·Landscape',
    claim: 'Claim Center',
    development: 'Development',
    estimate: 'Estimate·Award',
    intake: '4-step intake',
    execution: 'Execution Plan',
    active: 'Project active',
    operation: 'Operations·Log',
    qc: 'Questions·QC',
    delivery: 'Delivery',
    profit: 'Profitability',
    schedule: 'Project schedule',
    questions: 'Questions',
    meetings: 'Meeting minutes',
    drive: 'Drive',
    approval: 'Approval',
    ai: 'AI Assistant',
    completion: 'Chain completion',
    pending: 'Pending approvals',
  },
} satisfies Record<FrontendLocale, Record<string, string>>;

export function ProjectHandoffBridge({
  projects,
  onOpenWorkflow,
}: ProjectHandoffBridgeProps) {
  const { locale, setLocale } = useHandoffLocale();
  const t = copy[locale];
  const [selectedId, setSelectedId] = useState(projects[0]?.id || '');
  const selected =
    projects.find((project) => project.id === selectedId) || projects[0];
  const summary = useMemo(
    () => (selected ? buildProjectWorkflowSummary(selected) : null),
    [selected],
  );
  const boundary = getFrontendModuleBoundary('PROJECT', {
    locale,
    adapterReady: process.env.NEXT_PUBLIC_PROJECT_ADAPTER_READY === 'true',
  });

  const chain: Array<{
    label: string;
    icon: typeof FileSpreadsheet;
    state: string;
    href?: string;
    tab?: ProjectWorkflowTab;
  }> = [
    {
      label: t.estimate,
      href: '/projects/intake/estimates',
      icon: FileSpreadsheet,
      state: 'SOURCE',
    },
    {
      label: t.intake,
      href: '/projects/intake',
      icon: FileInput,
      state: summary?.phases[0]?.state || 'PENDING',
    },
    {
      label: t.execution,
      href: selected
        ? `/schedules?projectId=${encodeURIComponent(selected.id)}`
        : '/schedules',
      icon: ListChecks,
      state: summary?.phases[1]?.state || 'PENDING',
    },
    {
      label: t.active,
      href: selected
        ? `/projects?workflow=${encodeURIComponent(selected.id)}`
        : '/projects',
      icon: FolderKanban,
      state: selected?.status || 'PENDING',
    },
    {
      label: t.operation,
      tab: 'DAILY',
      icon: ClipboardCheck,
      state: summary?.phases[2]?.state || 'PENDING',
    },
    {
      label: t.qc,
      tab: 'QC',
      icon: CheckCircle2,
      state: summary?.phases[3]?.state || 'PENDING',
    },
    {
      label: t.delivery,
      tab: 'DELIVERY',
      icon: PackageCheck,
      state: summary?.phases[4]?.state || 'PENDING',
    },
    {
      label: t.profit,
      tab: 'PROFIT',
      icon: CircleDollarSign,
      state: summary?.phases[5]?.state || 'PENDING',
    },
  ];

  const modules = [
    {
      label: t.schedule,
      href: selected
        ? `/schedules?projectId=${encodeURIComponent(selected.id)}`
        : '/schedules',
      icon: CalendarRange,
    },
    {
      label: t.questions,
      href: selected
        ? `/projects/questions?projectId=${encodeURIComponent(selected.id)}`
        : '/projects/questions',
      icon: FileQuestion,
    },
    {
      label: t.meetings,
      href: selected
        ? `/projects/data-management?view=MEETINGS&projectId=${encodeURIComponent(selected.id)}`
        : '/projects/data-management?view=MEETINGS',
      icon: MessageSquareText,
    },
    {
      label: t.drive,
      href: selected
        ? `/drive?projectId=${encodeURIComponent(selected.id)}`
        : '/drive',
      icon: FolderOpen,
    },
    {
      label: t.approval,
      href: selected
        ? `/approvals?projectId=${encodeURIComponent(selected.id)}`
        : '/approvals',
      icon: Gavel,
    },
    {
      label: t.ai,
      href: selected
        ? `/ai-assistant?projectId=${encodeURIComponent(selected.id)}`
        : '/ai-assistant',
      icon: Bot,
    },
  ];

  const organizations = [
    { label: t.all, href: '/projects' },
    { label: t.finish, href: '/projects?department=FINISH' },
    { label: t.structure, href: '/projects?department=STRUCTURE' },
    { label: t.civil, href: '/projects?department=CIVIL_LANDSCAPE' },
    { label: t.claim, href: '/projects?department=CLAIM' },
    { label: t.development, href: '/projects?department=DEVELOPMENT' },
  ];

  return (
    <section className="space-y-4 border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_14px_36px_rgba(25,45,82,.08)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black tracking-[.18em] text-[#2f7a68]">
            {t.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-black text-[var(--color-text-main)]">
            {t.title}
          </h2>
          <p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">
            {t.description}
          </p>
        </div>
        <HandoffLanguageToggle locale={locale} onChange={setLocale} />
      </div>

      <RuntimeCapabilityPanel boundary={boundary} compact />

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,.68fr)_minmax(600px,1.32fr)]">
        <div className="border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <label>
            <span className="mb-2 block text-[11px] font-black text-[var(--color-text-sub)]">
              {t.select}
            </span>
            <select
              value={selected?.id || ''}
              onChange={(event) => setSelectedId(event.target.value)}
              className="min-h-11 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-bold text-[var(--color-text-main)]"
            >
              {!projects.length && <option value="">{t.empty}</option>}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <dl className="mt-4 space-y-3 text-xs">
              <div>
                <dt className="font-black text-[var(--color-text-sub)]">
                  {t.canonical}
                </dt>
                <dd className="mt-1 break-all font-mono text-[var(--color-text-main)]">
                  {selected.id}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <dt className="font-black text-[var(--color-text-sub)]">
                    {t.completion}
                  </dt>
                  <dd className="mt-1 text-lg font-black text-[#2f7a68]">
                    {summary?.completion || 0}%
                  </dd>
                </div>
                <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                  <dt className="font-black text-[var(--color-text-sub)]">
                    {t.pending}
                  </dt>
                  <dd className="mt-1 text-lg font-black text-[#b45a13]">
                    {summary?.pendingApprovals || 0}
                  </dd>
                </div>
              </div>
            </dl>
          )}

          <div className="mt-4 border border-blue-100 bg-blue-50 p-3 text-[11px] font-semibold leading-5 text-blue-900">
            <strong className="block font-black">
              {t.lifecycle} ≠ {t.assignments}
            </strong>
            {t.scopeHelp}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-[var(--color-text-main)]">
            {t.chain}
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {chain.map((step, index) => {
              const Icon = step.icon;
              const content = (
                <>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-white text-[#d95700] shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <small className="block text-[9px] font-black text-[#eb6300]">
                      {String(index + 1).padStart(2, '0')} · {step.state}
                    </small>
                    <strong className="mt-1 block truncate text-xs font-black text-[var(--color-text-main)]">
                      {step.label}
                    </strong>
                  </span>
                </>
              );
              const className =
                'flex min-h-20 items-center gap-3 border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-left transition hover:border-[#eb6300] hover:bg-[#fff8f2] disabled:cursor-not-allowed disabled:opacity-45';
              return step.tab ? (
                <button
                  key={step.label}
                  type="button"
                  disabled={!selected}
                  onClick={() =>
                    selected && onOpenWorkflow(selected.id, step.tab!)
                  }
                  className={className}
                >
                  {content}
                </button>
              ) : (
                <Link
                  key={step.label}
                  href={step.href || '/projects'}
                  className={className}
                >
                  {content}
                </Link>
              );
            })}
          </div>

          <h3 className="mt-5 text-sm font-black text-[var(--color-text-main)]">
            {t.modules}
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <Link
                  key={module.label}
                  href={module.href}
                  className="flex min-h-16 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-black text-[var(--color-text-main)] hover:border-blue-500 hover:bg-blue-50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-blue-700" />
                  <span className="min-w-0 truncate">{module.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center gap-2 text-xs font-black text-[var(--color-text-main)]">
          <Users className="h-4 w-4 text-[#2f7a68]" />
          {t.organization}
        </div>
        <nav className="mt-3 flex flex-wrap gap-2" aria-label={t.organization}>
          {organizations.map((organization) => (
            <Link
              key={organization.href}
              href={organization.href}
              className="flex min-h-9 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-black text-[var(--color-text-sub)] hover:border-[#2f7a68] hover:text-[#2f7a68]"
            >
              {organization.label}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
