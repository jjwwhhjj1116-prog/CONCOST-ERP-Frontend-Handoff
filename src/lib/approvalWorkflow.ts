import type {
  ApprovalDocumentLineStep,
  ApprovalLineDefinition,
  ApprovalRequestType,
  CompanyId,
  DepartmentId,
  PersonnelCard,
  Role,
  UserId,
} from '@/types/models';

export type ApprovalFieldType = 'TEXT' | 'TEXTAREA' | 'DATE' | 'NUMBER' | 'SELECT' | 'TEL';

export interface ApprovalFormField {
  id: string;
  label: Record<'ko' | 'vi' | 'en', string>;
  type: ApprovalFieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface ApprovalFormDefinition {
  id: string;
  type: ApprovalRequestType;
  category: 'HR' | 'FINANCE' | 'PURCHASE' | 'GENERAL';
  name: Record<'ko' | 'vi' | 'en', string>;
  description: Record<'ko' | 'vi' | 'en', string>;
  fields: ApprovalFormField[];
}

export interface ApprovalPolicyPreview {
  version: string;
  source: 'DEMO_POLICY_ADAPTER' | 'BACKEND_POLICY_ADAPTER';
  formType: ApprovalRequestType;
  organizationId?: DepartmentId;
  amount?: number;
  steps: ApprovalDocumentLineStep[];
  warnings: string[];
}

const t = (ko: string, vi: string, en: string) => ({ ko, vi, en });

const commonFields: ApprovalFormField[] = [
  { id: 'details', label: t('내용', 'Nội dung', 'Details'), type: 'TEXTAREA', required: true },
];

export const APPROVAL_FORM_CATALOG: ApprovalFormDefinition[] = [
  {
    id: 'leave-request',
    type: 'LEAVE_REQUEST',
    category: 'HR',
    name: t('휴가신청서', 'Đơn nghỉ phép', 'Leave request'),
    description: t('연차·반차·특별휴가', 'Nghỉ năm, nửa ngày và nghỉ đặc biệt', 'Annual, half-day, and special leave'),
    fields: [
      { id: 'leaveType', label: t('휴가종류', 'Loại nghỉ phép', 'Leave type'), type: 'SELECT', required: true, options: ['ANNUAL', 'HALF_DAY', 'HOURLY', 'SPECIAL', 'SICK'] },
      { id: 'leaveStart', label: t('시작 일시', 'Bắt đầu', 'Start'), type: 'DATE', required: true },
      { id: 'leaveEnd', label: t('종료 일시', 'Kết thúc', 'End'), type: 'DATE', required: true },
      { id: 'leaveAmount', label: t('일수 / 시간', 'Số ngày / giờ', 'Days / hours'), type: 'NUMBER', required: true },
      { id: 'destination', label: t('행선지', 'Nơi đến', 'Destination'), type: 'TEXT' },
      { id: 'emergencyContact', label: t('긴급연락처', 'Liên hệ khẩn cấp', 'Emergency contact'), type: 'TEL', required: true },
      { id: 'workCoverage', label: t('대체업무', 'Bàn giao công việc', 'Work coverage'), type: 'TEXTAREA', required: true },
      { id: 'leaveReason', label: t('사유', 'Lý do', 'Reason'), type: 'TEXTAREA', required: true },
    ],
  },
  {
    id: 'expense-approval',
    type: 'EXPENSE_APPROVAL',
    category: 'FINANCE',
    name: t('지출결의서', 'Đề nghị chi phí', 'Expense approval'),
    description: t('경비 및 프로젝트 비용 집행', 'Chi phí công việc và dự án', 'Business and project expenses'),
    fields: [
      { id: 'amount', label: t('금액', 'Số tiền', 'Amount'), type: 'NUMBER', required: true },
      { id: 'vendor', label: t('거래처', 'Nhà cung cấp', 'Vendor'), type: 'TEXT', required: true },
      { id: 'expenseDate', label: t('집행일', 'Ngày chi', 'Expense date'), type: 'DATE', required: true },
      ...commonFields,
    ],
  },
  {
    id: 'purchase-request',
    type: 'PURCHASE_APPROVAL',
    category: 'PURCHASE',
    name: t('구매품의서', 'Đề nghị mua hàng', 'Purchase request'),
    description: t('장비·소프트웨어·물품 구매', 'Thiết bị, phần mềm và vật tư', 'Equipment, software, and supplies'),
    fields: [
      { id: 'item', label: t('구매 품목', 'Hạng mục', 'Item'), type: 'TEXT', required: true },
      { id: 'amount', label: t('예상 금액', 'Chi phí dự kiến', 'Estimated amount'), type: 'NUMBER', required: true },
      { id: 'neededBy', label: t('필요일', 'Ngày cần', 'Needed by'), type: 'DATE', required: true },
      ...commonFields,
    ],
  },
  {
    id: 'business-trip',
    type: 'BUSINESS_TRIP',
    category: 'GENERAL',
    name: t('출장신청서', 'Đơn công tác', 'Business trip'),
    description: t('국내외 출장 일정 및 비용', 'Lịch và chi phí công tác', 'Travel schedule and expenses'),
    fields: [
      { id: 'destination', label: t('출장지', 'Nơi công tác', 'Destination'), type: 'TEXT', required: true },
      { id: 'tripStart', label: t('시작일', 'Bắt đầu', 'Start date'), type: 'DATE', required: true },
      { id: 'tripEnd', label: t('종료일', 'Kết thúc', 'End date'), type: 'DATE', required: true },
      { id: 'amount', label: t('예상 비용', 'Chi phí dự kiến', 'Estimated cost'), type: 'NUMBER' },
      ...commonFields,
    ],
  },
  {
    id: 'general-approval',
    type: 'GENERAL_APPROVAL',
    category: 'GENERAL',
    name: t('일반품의서', 'Đề nghị chung', 'General approval'),
    description: t('일반 업무 의사결정 및 승인', 'Quyết định và phê duyệt chung', 'General business decision'),
    fields: commonFields,
  },
];

const policyStep = (
  id: string,
  sequence: number,
  label: string,
  approverRole: Role,
  kind: ApprovalDocumentLineStep['kind'] = 'APPROVAL',
): ApprovalDocumentLineStep => ({
  id,
  sequence,
  label,
  approverRole,
  kind,
  executionMode: kind === 'REFERENCE' ? 'REFERENCE_ONLY' : 'SEQUENTIAL',
  immediateArrival: false,
  canEditLine: false,
  canEditContent: false,
  required: true,
  policyLocked: true,
  status: 'PENDING',
});

export const getDemoApprovalPolicyPreview = (input: {
  formType: ApprovalRequestType;
  organizationId?: DepartmentId;
  amount?: number;
}): ApprovalPolicyPreview => {
  const steps: ApprovalDocumentLineStep[] = [
    policyStep('policy-manager', 1, '조직 책임자 검토', 'DEPARTMENT_MANAGER'),
  ];

  if (input.formType === 'EXPENSE_APPROVAL' || input.formType === 'PURCHASE_APPROVAL') {
    steps.push(policyStep('policy-finance', 2, '재무 검토', 'SUPER_ADMIN', 'AGREEMENT'));
  }
  if ((input.amount ?? 0) >= 10_000_000) {
    steps.push(policyStep('policy-executive', steps.length + 1, '경영 승인', 'SUPER_ADMIN', 'FINAL_APPROVAL'));
  }

  return {
    version: 'demo-policy-v1',
    source: 'DEMO_POLICY_ADAPTER',
    formType: input.formType,
    organizationId: input.organizationId,
    amount: input.amount,
    steps,
    warnings: ['DEMO_LOCAL 정책 미리보기입니다. Production에서는 Backend Policy 응답이 필요합니다.'],
  };
};
export const assignPolicyCandidates = (
  steps: ApprovalDocumentLineStep[],
  users: PersonnelCard[],
  authorId: UserId,
  departmentId?: DepartmentId,
) => steps.map((step) => {
  const candidate = users.find((user) =>
    user.id !== authorId &&
    user.isActive !== false &&
    (!step.approverRole || user.role === step.approverRole) &&
    (!departmentId || step.approverRole !== 'DEPARTMENT_MANAGER' || user.departmentId === departmentId),
  );
  return candidate ? { ...step, approverId: candidate.id, departmentId: candidate.departmentId } : step;
});

export const normalizeApprovalSteps = (steps: ApprovalDocumentLineStep[]) =>
  steps.map((step, index) => ({ ...step, sequence: index + 1 }));

export const moveApprovalStep = (
  steps: ApprovalDocumentLineStep[],
  stepId: string,
  direction: -1 | 1,
) => {
  const index = steps.findIndex((step) => step.id === stepId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= steps.length) return steps;
  const next = [...steps];
  [next[index], next[target]] = [next[target], next[index]];
  return normalizeApprovalSteps(next);
};

export const validateApprovalLine = (
  steps: ApprovalDocumentLineStep[],
  authorId: UserId,
) => {
  const errors: string[] = [];
  const actionable = steps.filter((step) => step.kind !== 'REFERENCE');
  if (actionable.length === 0) errors.push('결재 단계가 최소 1개 필요합니다.');
  actionable.forEach((step, index) => {
    if (!step.approverId && !step.approverRole) errors.push(`${index + 1}단계의 사람 또는 Role을 지정하세요.`);
  });
  const finalStep = actionable[actionable.length - 1];
  if (finalStep?.approverId === authorId) errors.push('작성자는 최종 승인자가 될 수 없습니다.');
  return errors;
};

export const createApprovalSnapshot = (
  line: Pick<ApprovalLineDefinition, 'id' | 'version' | 'steps'>,
  policyVersion: string,
) => ({
  lineDefinitionId: line.id,
  lineVersion: line.version,
  policyVersion,
  steps: normalizeApprovalSteps(line.steps).map((step) => ({ ...step })),
  createdAt: new Date().toISOString(),
});

export const createLineDefinition = (input: {
  companyId: CompanyId;
  ownerId: UserId;
  departmentId?: DepartmentId;
  name: string;
  formType?: ApprovalRequestType;
  scope?: ApprovalLineDefinition['scope'];
  steps?: ApprovalDocumentLineStep[];
}): ApprovalLineDefinition => {
  const now = new Date().toISOString();
  return {
    id: `line_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    companyId: input.companyId,
    ownerId: input.ownerId,
    departmentId: input.departmentId,
    name: input.name,
    formType: input.formType,
    scope: input.scope ?? 'PERSONAL',
    steps: normalizeApprovalSteps(input.steps ?? []),
    isDefault: false,
    usageCount: 0,
    version: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
};
