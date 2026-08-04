import type { EstimateRequest } from '@/types/models';

const history = (requestId: string, action: string, toStatus: EstimateRequest['status'], createdAt: string) => ({
  id: `history-${requestId}`,
  estimateRequestId: requestId,
  action,
  toStatus,
  actorId: 'demo-cc-development-001',
  createdAt,
});

export const demoEstimateRequests: EstimateRequest[] = [
  {
    id: 'estimate-request-songpa', requestNo: 'ER-202607-001', status: 'ESTIMATE_DRAFTING', projectName: '송파 복합시설 신축공사', company: 'OO건설', client: '송파복합개발', contact: '[DEMO] 담당자 001', contactDepartment: '사업관리팀', phone: '02-0000-0188', email: 'demo-f93fa2e5fb59@example.invalid', ownerId: 'demo-cc-development-001', departmentId: 'DEVELOP', requestDate: '2026-07-21T09:00:00.000Z', memo: '개산견적 및 공사비 검증 요청', firstDelivery: '2026-07-29', finalDelivery: '2026-08-07', expectedStartDate: '2026-08-10', areaPy: '18,400', floors: 'B4 / 28F', scope: '개산견적, 공사비검증', usage: '복합시설', version: 1, createdBy: 'demo-cc-development-001', updatedBy: 'demo-cc-development-001', createdAt: '2026-07-21T09:00:00.000Z', updatedAt: '2026-07-22T04:30:00.000Z', activities: [{ id: 'activity-songpa', estimateRequestId: 'estimate-request-songpa', kind: 'CONSULTATION', content: '발주처 요청범위 및 납기 협의 완료', occurredAt: '2026-07-21T10:30:00.000Z', createdBy: 'demo-cc-development-001', createdAt: '2026-07-21T10:30:00.000Z' }], attachments: [], histories: [history('estimate-request-songpa', 'STATUS_CHANGED', 'ESTIMATE_DRAFTING', '2026-07-22T04:30:00.000Z')],
  },
  {
    id: 'estimate-request-gwacheon', requestNo: 'ER-202607-002', status: 'WAITING', projectName: '과천 지식정보타운 업무시설', company: '과천도시개발', client: 'OO건축사사무소', contact: '[DEMO] 담당자 002', contactDepartment: '설계팀', phone: '02-0000-0251', email: 'demo-bdafa07a0823@example.invalid', ownerId: 'demo-cc-development-001', departmentId: 'DEVELOP', requestDate: '2026-07-18T02:00:00.000Z', memo: '설계예가 및 구조 수량 검토', firstDelivery: '2026-07-31', finalDelivery: '2026-08-12', expectedStartDate: '2026-08-17', areaPy: '26,200', floors: 'B5 / 35F', scope: '설계예가, 구조수량', usage: '업무시설', version: 1, createdBy: 'demo-cc-development-001', updatedBy: 'demo-cc-development-001', createdAt: '2026-07-18T02:00:00.000Z', updatedAt: '2026-07-22T07:10:00.000Z', activities: [], attachments: [], histories: [history('estimate-request-gwacheon', 'STATUS_CHANGED', 'WAITING', '2026-07-22T07:10:00.000Z')],
  },
  {
    id: 'estimate-request-danang', requestNo: 'ER-202607-003', status: 'REQUEST_MEMO', projectName: '다낭 리조트 증축공사', company: 'VIETQS PARTNER', client: 'Danang Resort JSC', contact: '[DEMO] Contact 003', contactDepartment: 'Development', phone: '+84 00 000 0000', email: 'demo-4a8f45525163@example.invalid', ownerId: 'demo-cc-development-001', departmentId: 'DEVELOP', requestDate: '2026-07-23T01:20:00.000Z', memo: '영문 내역서와 CAD 도면 수령 예정', firstDelivery: '2026-08-05', finalDelivery: '2026-08-20', expectedStartDate: '2026-08-24', areaPy: '12,900', floors: '2B / 18F', scope: '수량산출, 내역작성', usage: '호텔·리조트', version: 1, createdBy: 'demo-cc-development-001', updatedBy: 'demo-cc-development-001', createdAt: '2026-07-23T01:20:00.000Z', updatedAt: '2026-07-23T01:20:00.000Z', activities: [], attachments: [], histories: [history('estimate-request-danang', 'CREATED', 'REQUEST_MEMO', '2026-07-23T01:20:00.000Z')],
  },
];
