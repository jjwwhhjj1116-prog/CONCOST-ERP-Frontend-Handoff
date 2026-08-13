import {
  getRuntimeExecutionMode,
  type RuntimeExecutionMode,
} from '@/lib/runtimeExecutionMode';

export type FrontendLocale = 'ko' | 'vi' | 'en';

export type FrontendModule =
  | 'PROJECT'
  | 'DRIVE'
  | 'APPROVAL'
  | 'MAIL'
  | 'BUSINESS_CARD'
  | 'AI_ASSISTANT'
  | 'CALENDAR'
  | 'TASK'
  | 'NOTIFICATION'
  | 'SALES'
  | 'FINANCE';

export type ProviderState =
  | 'READY'
  | 'NOT_CONFIGURED'
  | 'UNAVAILABLE'
  | 'NOT_REQUIRED';

export type DataSourceState =
  | 'DEMO_SIMULATION'
  | 'SERVER_READY'
  | 'BACKEND_REQUIRED'
  | 'PROVIDER_REQUIRED'
  | 'UNAVAILABLE';

export interface FrontendModuleBoundary {
  module: FrontendModule;
  mode: RuntimeExecutionMode;
  state: DataSourceState;
  providerState: ProviderState;
  canRead: boolean;
  canMutate: boolean;
  isSimulation: boolean;
  title: string;
  message: string;
  operations: readonly string[];
}

interface FrontendModuleOptions {
  mode?: RuntimeExecutionMode;
  locale?: FrontendLocale;
  adapterReady?: boolean;
  providerState?: ProviderState;
  providerRequired?: boolean;
  operations?: readonly string[];
}

export type FrontendMutationResult<T> =
  | { kind: 'SIMULATED'; data: T; persisted: false; message: string }
  | { kind: 'SUCCESS'; data: T; persisted: true; message: string }
  | { kind: 'BLOCKED'; persisted: false; message: string };

const moduleNames: Record<FrontendLocale, Record<FrontendModule, string>> = {
  ko: {
    PROJECT: '프로젝트',
    DRIVE: '드라이브',
    APPROVAL: '전자결재',
    MAIL: '전자메일',
    BUSINESS_CARD: '명함 자동등록',
    AI_ASSISTANT: 'AI 업무도우미',
    CALENDAR: '일정',
    TASK: '할 일',
    NOTIFICATION: '알림',
    SALES: '영업',
    FINANCE: '재무',
  },
  vi: {
    PROJECT: 'Dự án',
    DRIVE: 'Kho tài liệu',
    APPROVAL: 'Phê duyệt điện tử',
    MAIL: 'Email',
    BUSINESS_CARD: 'Danh thiếp OCR',
    AI_ASSISTANT: 'Trợ lý công việc AI',
    CALENDAR: 'Lịch',
    TASK: 'Công việc',
    NOTIFICATION: 'Thông báo',
    SALES: 'Kinh doanh',
    FINANCE: 'Tài chính',
  },
  en: {
    PROJECT: 'Projects',
    DRIVE: 'Drive',
    APPROVAL: 'Approvals',
    MAIL: 'Mail',
    BUSINESS_CARD: 'Business Card OCR',
    AI_ASSISTANT: 'AI Work Assistant',
    CALENDAR: 'Calendar',
    TASK: 'Tasks',
    NOTIFICATION: 'Notifications',
    SALES: 'Sales',
    FINANCE: 'Finance',
  },
};

const messages: Record<
  FrontendLocale,
  Record<DataSourceState, (moduleName: string) => string>
> = {
  ko: {
    DEMO_SIMULATION: (name) =>
      `${name} 데모입니다. 입력은 이 브라우저에서만 시뮬레이션되며 실제 서버에 저장되지 않습니다.`,
    SERVER_READY: (name) => `${name} Backend 연결 준비가 완료되었습니다.`,
    BACKEND_REQUIRED: (name) =>
      `${name} Backend Adapter가 연결되지 않아 저장 작업을 사용할 수 없습니다.`,
    PROVIDER_REQUIRED: (name) =>
      `${name} Provider가 설정되지 않아 외부 작업을 사용할 수 없습니다.`,
    UNAVAILABLE: (name) => `${name} 서비스를 현재 사용할 수 없습니다.`,
  },
  vi: {
    DEMO_SIMULATION: (name) =>
      `${name} đang ở chế độ demo. Dữ liệu chỉ được mô phỏng trong trình duyệt và không được lưu lên máy chủ.`,
    SERVER_READY: (name) => `${name} đã sẵn sàng kết nối Backend.`,
    BACKEND_REQUIRED: (name) =>
      `${name} chưa kết nối Backend Adapter nên không thể lưu dữ liệu.`,
    PROVIDER_REQUIRED: (name) =>
      `${name} chưa cấu hình Provider nên không thể thực hiện thao tác bên ngoài.`,
    UNAVAILABLE: (name) => `${name} hiện không khả dụng.`,
  },
  en: {
    DEMO_SIMULATION: (name) =>
      `${name} is in demo mode. Changes are simulated in this browser and are not saved to a server.`,
    SERVER_READY: (name) => `${name} is ready for the Backend connection.`,
    BACKEND_REQUIRED: (name) =>
      `${name} cannot save changes until its Backend Adapter is connected.`,
    PROVIDER_REQUIRED: (name) =>
      `${name} cannot perform external actions until a Provider is configured.`,
    UNAVAILABLE: (name) => `${name} is currently unavailable.`,
  },
};

export const OPENAPI_OPERATIONS = {
  PROJECT: [
    'listProjects',
    'getProject',
    'createProjectIntakeDraft',
    'submitProjectIntake',
  ],
  DRIVE: [
    'getDriveCapabilities',
    'listDriveRoots',
    'createUploadIntent',
    'finalizeFile',
  ],
  APPROVAL: [
    'listApprovalForms',
    'createApprovalDraft',
    'submitApprovalDraft',
    'decideApprovalStep',
  ],
  MAIL: [
    'getMailCapabilities',
    'listMailFolders',
    'listMailMessages',
    'createMailDraft',
    'sendMailDraft',
  ],
  BUSINESS_CARD: [
    'createBusinessCardCapture',
    'startBusinessCardOcr',
    'reviewBusinessCardOcr',
    'createContactFromBusinessCard',
  ],
  AI_ASSISTANT: [
    'getAiCapabilities',
    'createAiTranscriptionJob',
    'createAiSummarizationJob',
    'createProjectMeetingMinute',
  ],
  CALENDAR: ['listCalendarEvents', 'createCalendarEvent'],
  TASK: [
    'listCollaborationTasks',
    'createCollaborationTask',
    'updateCollaborationTask',
  ],
  NOTIFICATION: ['listNotifications', 'markNotificationRead'],
  SALES: ['listOpportunities', 'createOpportunity'],
  FINANCE: [
    'getFinanceDashboard',
    'listFinanceTransactions',
    'createFinanceTransaction',
    'updateFinanceTransaction',
    'listReceivables',
    'createReceivable',
    'recordReceipt',
    'listPayables',
    'createPayable',
    'recordPayment',
    'listExpenseClaims',
    'createExpenseClaim',
    'listTaxInvoices',
    'createTaxInvoice',
    'submitTaxInvoiceProvider',
    'listBudgets',
    'createBudget',
    'getCashPosition',
    'getProjectProfitability',
    'listClosingPeriods',
    'createClosingPeriod',
    'closeFinancePeriod',
    'listFinanceReports',
    'getFinanceReport',
  ],
} satisfies Record<FrontendModule, readonly string[]>;

export const getFrontendModuleBoundary = (
  module: FrontendModule,
  options: FrontendModuleOptions = {},
): FrontendModuleBoundary => {
  const mode = options.mode ?? getRuntimeExecutionMode();
  const locale = options.locale ?? 'ko';
  const adapterReady = options.adapterReady ?? false;
  const providerState = options.providerState ?? 'NOT_REQUIRED';
  const providerRequired = options.providerRequired ?? false;
  const name = moduleNames[locale][module];

  let state: DataSourceState;
  if (mode === 'DEMO_LOCAL') {
    state = 'DEMO_SIMULATION';
  } else if (providerRequired && providerState !== 'READY') {
    state = providerState === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'PROVIDER_REQUIRED';
  } else if (!adapterReady) {
    state = 'BACKEND_REQUIRED';
  } else {
    state = 'SERVER_READY';
  }

  return {
    module,
    mode,
    state,
    providerState,
    canRead: state === 'DEMO_SIMULATION' || state === 'SERVER_READY',
    canMutate: state === 'DEMO_SIMULATION' || state === 'SERVER_READY',
    isSimulation: state === 'DEMO_SIMULATION',
    title: name,
    message: messages[locale][state](name),
    operations: options.operations ?? OPENAPI_OPERATIONS[module],
  };
};

export const executeFrontendMutation = async <T>(
  boundary: FrontendModuleBoundary,
  handlers: {
    simulate: () => T | Promise<T>;
    request?: () => Promise<T>;
  },
): Promise<FrontendMutationResult<T>> => {
  if (boundary.state === 'DEMO_SIMULATION') {
    return {
      kind: 'SIMULATED',
      data: await handlers.simulate(),
      persisted: false,
      message: boundary.message,
    };
  }

  if (boundary.state !== 'SERVER_READY' || !handlers.request) {
    return {
      kind: 'BLOCKED',
      persisted: false,
      message: boundary.message,
    };
  }

  return {
    kind: 'SUCCESS',
    data: await handlers.request(),
    persisted: true,
    message: boundary.message,
  };
};
