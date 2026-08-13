import { getRuntimeExecutionMode, type RuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import type { AssistantAnswer, AssistantErrorCode, AssistantLocale, AssistantPageContext } from './assistantModel';

export interface AssistantRuntimeBoundary {
  mode: RuntimeExecutionMode;
  kind: 'DEMO_RULE_ENGINE' | 'READY' | 'BLOCKED';
  errorCode?: AssistantErrorCode;
  message?: string;
  correlationId?: string;
}

const blockedMessage = (locale: AssistantLocale, code: AssistantErrorCode) => {
  const messages: Record<AssistantLocale, Record<AssistantErrorCode, string>> = {
    ko: {
      AUTH_REQUIRED: '로그인이 필요합니다.', COMPANY_SCOPE_REQUIRED: '회사 범위를 선택해 주세요.', FORBIDDEN: '이 정보에 접근할 권한이 없습니다.', RESOURCE_NOT_FOUND: '요청한 업무 기록을 찾지 못했습니다.', BACKEND_REQUIRED: 'AI Assistant Backend Adapter 연결이 필요합니다.', PROVIDER_NOT_CONFIGURED: 'AI Provider가 아직 설정되지 않았습니다.', PRIVATE_PROVIDER_REQUIRED: '민감정보는 Private/Local AI Provider가 준비되어야 사용할 수 있습니다.', RETRYABLE_ERROR: '일시적인 연결 오류입니다. 잠시 후 다시 시도해 주세요.', UNKNOWN_ERROR: '답변 처리 중 오류가 발생했습니다.',
    },
    vi: {
      AUTH_REQUIRED: 'Cần đăng nhập.', COMPANY_SCOPE_REQUIRED: 'Vui lòng chọn phạm vi công ty.', FORBIDDEN: 'Bạn không có quyền truy cập thông tin này.', RESOURCE_NOT_FOUND: 'Không tìm thấy bản ghi công việc.', BACKEND_REQUIRED: 'Cần kết nối Backend Adapter cho trợ lý AI.', PROVIDER_NOT_CONFIGURED: 'AI Provider chưa được cấu hình.', PRIVATE_PROVIDER_REQUIRED: 'Dữ liệu nhạy cảm cần Private/Local AI Provider.', RETRYABLE_ERROR: 'Lỗi kết nối tạm thời. Vui lòng thử lại.', UNKNOWN_ERROR: 'Đã xảy ra lỗi khi xử lý câu trả lời.',
    },
    en: {
      AUTH_REQUIRED: 'Authentication is required.', COMPANY_SCOPE_REQUIRED: 'Select a company scope.', FORBIDDEN: 'You do not have permission to access this information.', RESOURCE_NOT_FOUND: 'The requested work record was not found.', BACKEND_REQUIRED: 'The AI Assistant backend adapter is required.', PROVIDER_NOT_CONFIGURED: 'The AI provider is not configured.', PRIVATE_PROVIDER_REQUIRED: 'Sensitive data requires a Private/Local AI provider.', RETRYABLE_ERROR: 'A temporary connection error occurred. Try again.', UNKNOWN_ERROR: 'An error occurred while preparing the answer.',
    },
  };
  return messages[locale][code];
};

export const getAssistantRuntimeBoundary = (
  locale: AssistantLocale,
  context?: AssistantPageContext | null,
  mode = getRuntimeExecutionMode(),
): AssistantRuntimeBoundary => {
  if (mode === 'DEMO_LOCAL') return { mode, kind: 'DEMO_RULE_ENGINE' };
  const adapterReady = process.env.NEXT_PUBLIC_AI_ADAPTER_READY === 'true' || process.env.NEXT_PUBLIC_AI_ASSISTANT_ADAPTER_READY === 'true';
  const providerReady = process.env.NEXT_PUBLIC_AI_PROVIDER_READY === 'true';
  const privateProviderReady = process.env.NEXT_PUBLIC_PRIVATE_AI_PROVIDER_READY === 'true';
  const correlationId = `ai-${Date.now().toString(36)}`;
  const sensitive = context && ['FINANCE', 'HR', 'RESTRICTED_LEGAL'].includes(context.sensitivity);
  if (sensitive && !privateProviderReady) {
    return { mode, kind: 'BLOCKED', errorCode: 'PRIVATE_PROVIDER_REQUIRED', message: blockedMessage(locale, 'PRIVATE_PROVIDER_REQUIRED'), correlationId };
  }
  if (!adapterReady) return { mode, kind: 'BLOCKED', errorCode: 'BACKEND_REQUIRED', message: blockedMessage(locale, 'BACKEND_REQUIRED'), correlationId };
  if (!providerReady) return { mode, kind: 'BLOCKED', errorCode: 'PROVIDER_NOT_CONFIGURED', message: blockedMessage(locale, 'PROVIDER_NOT_CONFIGURED'), correlationId };
  return { mode, kind: 'READY', correlationId };
};

export const runtimeBoundaryAnswer = (boundary: AssistantRuntimeBoundary): AssistantAnswer => ({
  content: boundary.message || 'Assistant backend response is unavailable.',
  citations: [],
  actionCandidates: [],
  answerKind: 'BOUNDARY_NOTICE',
  modelLabel: 'BACKEND CAPABILITY',
  status: 'BLOCKED',
  errorCode: boundary.errorCode,
  correlationId: boundary.correlationId,
});
