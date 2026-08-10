'use client';

import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  DatabaseZap,
  RefreshCw,
  ServerCog,
  ShieldCheck,
} from 'lucide-react';
import {
  getApiCompanyId,
  getLastApiRequestDiagnostic,
  subscribeApiRequestDiagnostics,
  type ApiRequestDiagnostic,
} from '@/lib/apiClient';
import {
  buildIntegrationDiagnosticsSnapshot,
  canAccessIntegrationDiagnostics,
  type IntegrationCapabilityState,
  type IntegrationMilestoneStatus,
} from '@/lib/integrationDiagnostics';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';

const copy = {
  ko: {
    eyebrow: 'INTEGRATION CONTROL PLANE',
    title: '통합 진단',
    description: 'Viet QS Backend 연결 상태와 회사 범위를 안전한 메타데이터만으로 확인합니다.',
    refresh: '상태 새로고침',
    authRequired: '로그인 후 통합 진단을 확인할 수 있습니다.',
    forbidden: '관리자만 통합 진단에 접근할 수 있습니다.',
    runtime: '실행 모드',
    apiBase: 'API 기준 주소',
    session: '세션 상태',
    company: '회사 범위',
    registry: '통합 Capability Registry',
    registryHelp: 'READY는 설정 상태이며 실제 연동 PASS는 Smoke Probe가 추가로 필요합니다.',
    milestones: 'API Sandbox Smoke Milestones',
    milestonesHelp: 'Backend가 없거나 Probe가 실행되지 않은 상태는 성공으로 표시하지 않습니다.',
    request: '마지막 API 요청 진단',
    noRequest: '이 브라우저 세션에서 기록된 API 요청이 없습니다.',
    privacy: '진단 정보 보호 경계',
    privacyBody: 'Token, Cookie, Secret, 요청 본문, 응답 본문과 개인정보는 수집하거나 표시하지 않습니다.',
    adapter: 'Adapter',
    provider: 'Provider',
    selectedCompany: '선택 회사',
    apiCompany: '요청 회사',
  },
  vi: {
    eyebrow: 'INTEGRATION CONTROL PLANE',
    title: 'Chẩn đoán tích hợp',
    description: 'Kiểm tra Backend Viet QS và phạm vi công ty chỉ bằng metadata an toàn.',
    refresh: 'Làm mới trạng thái',
    authRequired: 'Đăng nhập để xem chẩn đoán tích hợp.',
    forbidden: 'Chỉ quản trị viên được truy cập chẩn đoán tích hợp.',
    runtime: 'Chế độ chạy',
    apiBase: 'Địa chỉ API',
    session: 'Trạng thái phiên',
    company: 'Phạm vi công ty',
    registry: 'Danh mục capability tích hợp',
    registryHelp: 'READY chỉ là trạng thái cấu hình; cần Smoke Probe để xác nhận kết nối.',
    milestones: 'Các mốc API Sandbox Smoke',
    milestonesHelp: 'Không hiển thị thành công khi chưa có Backend hoặc chưa chạy Probe.',
    request: 'Chẩn đoán yêu cầu API gần nhất',
    noRequest: 'Chưa có yêu cầu API nào được ghi nhận trong phiên trình duyệt này.',
    privacy: 'Ranh giới bảo vệ dữ liệu chẩn đoán',
    privacyBody: 'Không thu thập hay hiển thị token, cookie, secret, nội dung request/response hoặc dữ liệu cá nhân.',
    adapter: 'Adapter',
    provider: 'Provider',
    selectedCompany: 'Công ty đã chọn',
    apiCompany: 'Công ty gửi API',
  },
} as const;

const stateClass: Record<IntegrationCapabilityState, string> = {
  DEMO_SIMULATED: 'border-violet-200 bg-violet-50 text-violet-700',
  BACKEND_REQUIRED: 'border-amber-200 bg-amber-50 text-amber-800',
  PROVIDER_NOT_CONFIGURED: 'border-orange-200 bg-orange-50 text-orange-800',
  READY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  DEGRADED: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  ERROR: 'border-rose-200 bg-rose-50 text-rose-700',
};

const milestoneClass: Record<IntegrationMilestoneStatus, string> = {
  PASS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  FAIL: 'border-rose-200 bg-rose-50 text-rose-700',
  BLOCKED: 'border-amber-200 bg-amber-50 text-amber-800',
  NOT_TESTED: 'border-slate-200 bg-slate-50 text-slate-600',
};

function StatusBadge({ value, className }: { value: string; className: string }) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[10px] font-bold ${className}`}>
      <span className="truncate">{value}</span>
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value, tone }: {
  icon: React.ElementType;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="min-w-0 border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500">
        <span className={`flex h-8 w-8 items-center justify-center ${tone}`}><Icon className="h-4 w-4" /></span>
        {label}
      </div>
      <div className="break-all text-sm font-extrabold text-slate-900">{value}</div>
    </div>
  );
}

export function IntegrationDiagnostics() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isSessionChecking = useAuthStore((state) => state.isSessionChecking);
  const isSessionReady = useAuthStore((state) => state.isSessionReady);
  const brandWorkspace = useUiStore((state) => state.brandWorkspace);
  const language = useTranslationStore((state) => state.settings.uiLanguage === 'vi' ? 'vi' : 'ko');
  const [lastRequest, setLastRequest] = React.useState<ApiRequestDiagnostic | null>(
    () => getLastApiRequestDiagnostic(),
  );
  const [, setRefreshKey] = React.useState(0);

  React.useEffect(() => subscribeApiRequestDiagnostics(setLastRequest), []);

  const text = copy[language];
  const sessionState = !hasHydrated || isSessionChecking
    ? 'CHECKING'
    : currentUser && isSessionReady
      ? 'AUTHENTICATED'
      : currentUser
        ? 'RECOVERY_ERROR'
        : 'ANONYMOUS';
  const selectedCompanyId = brandWorkspace === 'CON_COST' || brandWorkspace === 'VIET_QS'
    ? brandWorkspace
    : null;
  const snapshot = buildIntegrationDiagnosticsSnapshot({
    sessionState,
    selectedCompanyId,
    apiCompanyId: getApiCompanyId(),
    lastRequest,
  });

  if (!hasHydrated || isSessionChecking) {
    return <div className="p-10 text-center text-sm text-slate-500">CHECKING SESSION...</div>;
  }
  if (!currentUser) {
    return <div className="p-10 text-center text-sm text-slate-500">{text.authRequired}</div>;
  }
  if (!canAccessIntegrationDiagnostics(currentUser)) {
    return <div className="p-10 text-center text-sm font-bold text-rose-600">{text.forbidden}</div>;
  }

  return (
    <main className="mx-auto w-full max-w-[1680px] space-y-5 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b-2 border-slate-900 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black tracking-widest text-indigo-600">{text.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">{text.title}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">{text.description}</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="inline-flex min-h-10 items-center justify-center gap-2 border border-indigo-700 bg-indigo-700 px-4 text-sm font-bold text-white transition-colors hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <RefreshCw className="h-4 w-4" /> {text.refresh}
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Integration summary">
        <SummaryCard icon={ServerCog} label={text.runtime} value={snapshot.runtime} tone="bg-indigo-50 text-indigo-700" />
        <SummaryCard icon={DatabaseZap} label={text.apiBase} value={snapshot.apiBase} tone="bg-cyan-50 text-cyan-700" />
        <SummaryCard icon={ShieldCheck} label={text.session} value={snapshot.sessionState} tone="bg-emerald-50 text-emerald-700" />
        <SummaryCard icon={Activity} label={text.company} value={snapshot.companyScope} tone="bg-orange-50 text-orange-700" />
      </section>

      <section className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-950">{text.registry}</h2>
          <p className="mt-1 text-xs text-slate-500">{text.registryHelp}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.capabilities.map((item) => (
            <article key={item.id} className="min-w-0 border border-slate-200 p-4 transition-colors hover:border-slate-400">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-indigo-600">{item.milestone} · {item.id}</p>
                  <h3 className="mt-1 text-sm font-extrabold text-slate-950">{item.label}</h3>
                </div>
                <StatusBadge value={item.state} className={stateClass[item.state]} />
              </div>
              <dl className="mt-4 grid grid-cols-[76px_minmax(0,1fr)] gap-x-2 gap-y-2 text-xs">
                <dt className="font-semibold text-slate-500">{text.adapter}</dt><dd className="truncate font-medium text-slate-800">{item.adapter}</dd>
                <dt className="font-semibold text-slate-500">{text.provider}</dt><dd className="truncate font-medium text-slate-800">{item.provider}</dd>
              </dl>
              <p className="mt-3 text-xs leading-5 text-slate-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-950">{text.milestones}</h2>
          <p className="mt-1 text-xs text-slate-500">{text.milestonesHelp}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.milestones.map((item) => (
            <article key={item.id} className="border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-xs font-black text-indigo-600">{item.id}</p><h3 className="mt-1 text-sm font-bold text-slate-950">{item.label}</h3></div>
                <StatusBadge value={item.status} className={milestoneClass[item.status]} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{item.reason}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">{text.request}</h2>
          {snapshot.lastRequest ? (
            <dl className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 xl:grid-cols-4">
              {Object.entries(snapshot.lastRequest).map(([key, value]) => (
                <div key={key} className="min-w-0 border-l-2 border-indigo-500 pl-3">
                  <dt className="font-semibold text-slate-500">{key}</dt>
                  <dd className="mt-1 break-all font-bold text-slate-900">{String(value ?? 'NONE')}</dd>
                </div>
              ))}
            </dl>
          ) : <p className="mt-4 text-sm text-slate-500">{text.noRequest}</p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
            <span>{text.selectedCompany}: <strong>{snapshot.selectedCompanyId}</strong></span>
            <span aria-hidden="true">/</span>
            <span>{text.apiCompany}: <strong>{snapshot.apiCompanyId}</strong></span>
          </div>
        </div>
        <aside className="border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-black text-amber-900"><AlertTriangle className="h-4 w-4" /> {text.privacy}</div>
          <p className="mt-3 text-xs leading-5 text-amber-900/80">{text.privacyBody}</p>
          <div className="mt-4 flex items-center gap-2 text-xs font-bold text-amber-800"><CheckCircle2 className="h-4 w-4" /> SAFE METADATA ONLY</div>
          <div className="mt-2 flex items-center gap-2 text-xs text-amber-800"><CircleHelp className="h-4 w-4" /> NO PROVIDER CLAIM WITHOUT PROBE</div>
        </aside>
      </section>
    </main>
  );
}
