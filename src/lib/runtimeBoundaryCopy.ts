import type { RuntimeBoundary } from './runtimeExecutionMode';

export type RuntimeBoundaryLocale = 'ko' | 'vi';
export type RuntimeBoundaryFeature = 'MAIL' | 'APPROVAL';

const copy = {
  ko: {
    MAIL: {
      DEMO_SIMULATION: '데모 시뮬레이션만 완료했습니다. 메일은 발송되거나 서버에 저장되지 않았습니다.',
      BLOCKED: '메일 Provider 또는 서버 Adapter가 준비되지 않아 발송하지 않았습니다.',
    },
    APPROVAL: {
      DEMO_SIMULATION: '데모 시뮬레이션만 수행했습니다. 공식 결재 상태는 변경되지 않았습니다.',
      BLOCKED: '결재 서버 또는 정책이 준비되지 않아 어떤 상태도 변경하지 않았습니다.',
    },
    INTAKE_CREATE_BLOCKED: '서버 CREATE API가 준비되지 않아 접수를 생성하지 않았습니다. 입력 내용은 그대로 유지되며 서버 연결 후 다시 시도할 수 있습니다.',
    APPROVER_MISSING: '필수 결재자가 지정되지 않아 문서를 상신하지 않았습니다.',
  },
  vi: {
    MAIL: {
      DEMO_SIMULATION: 'Chỉ hoàn tất mô phỏng demo. Thư không được gửi hoặc lưu trên máy chủ.',
      BLOCKED: 'Nhà cung cấp thư hoặc bộ điều hợp máy chủ chưa sẵn sàng. Thư chưa được gửi.',
    },
    APPROVAL: {
      DEMO_SIMULATION: 'Chỉ thực hiện mô phỏng demo. Trạng thái phê duyệt chính thức không thay đổi.',
      BLOCKED: 'Máy chủ hoặc chính sách phê duyệt chưa sẵn sàng. Không có trạng thái nào thay đổi.',
    },
    INTAKE_CREATE_BLOCKED: 'API CREATE trên máy chủ chưa sẵn sàng nên hồ sơ tiếp nhận chưa được tạo. Dữ liệu nhập được giữ nguyên để thử lại sau khi máy chủ sẵn sàng.',
    APPROVER_MISSING: 'Thiếu người phê duyệt bắt buộc nên hồ sơ chưa được trình.',
  },
} as const;

export const getRuntimeBoundaryCopy = (
  feature: RuntimeBoundaryFeature,
  kind: RuntimeBoundary['kind'],
  locale: RuntimeBoundaryLocale,
) => copy[locale][feature][kind];

export const getProjectIntakeCreateBlockedCopy = (locale: RuntimeBoundaryLocale) =>
  copy[locale].INTAKE_CREATE_BLOCKED;

export const getApproverMissingCopy = (locale: RuntimeBoundaryLocale) =>
  copy[locale].APPROVER_MISSING;
