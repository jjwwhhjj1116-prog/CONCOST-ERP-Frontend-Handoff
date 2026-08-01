import { ProcessTemplate, ProcessStage, ProcessTask } from '@/types/models';

export const defaultProcessTemplates: ProcessTemplate[] = [
  {
    id: 'ptmpl_esc_vietnam',
    name: 'ESC 공정 템플릿 (GĐ 0~5)',
    description: '베트남 설계본부 표준 6단계 ESC 공정',
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const defaultProcessStages: ProcessStage[] = [
  { id: 'pstage_gd0', templateId: 'ptmpl_esc_vietnam', name: 'GĐ 0: 0 단계: 분석 및 협의 (Phân tích & Trao đổi)', orderIndex: 0 },
  { id: 'pstage_gd1', templateId: 'ptmpl_esc_vietnam', name: 'GĐ 1: 1단계: 기본 바탕 조성 (Xây dựng nền tảng cơ bản)', orderIndex: 1 },
  { id: 'pstage_gd2', templateId: 'ptmpl_esc_vietnam', name: 'GĐ 2: 2단계: 데이터 입력 및 관리자 인터페이스 (Giao diện nhập liệu & Quản trị Admin)', orderIndex: 2 },
  { id: 'pstage_gd3', templateId: 'ptmpl_esc_vietnam', name: 'GĐ 3: 3단계: 계산 기구 및 규칙 (Bộ máy tính toán & Quy tắc)', orderIndex: 3 },
  { id: 'pstage_gd4', templateId: 'ptmpl_esc_vietnam', name: 'GĐ 4: 4단계: 보고 및 편리성 완료 (Hoàn thiện Báo cáo & Tiện ích)', orderIndex: 4 },
  { id: 'pstage_gd5', templateId: 'ptmpl_esc_vietnam', name: 'GĐ 5: 5단계: 최종 점검 및 납품 (Tổng kiểm tra & Bàn giao)', orderIndex: 5 },
];

export const defaultProcessTasks: ProcessTask[] = [
  // GĐ 0
  { id: 'ptask_gd0_1', stageId: 'pstage_gd0', name: '시스템 프로세스 및 업무 분석 (Phân tích quy trình hệ thống & nghiệp vụ)', orderIndex: 1, defaultAssigneeRole: 'WORKER' },
  
  // GĐ 1
  { id: 'ptask_gd1_1', stageId: 'pstage_gd1', name: '전체 소프트웨어 초기 프레임워크 조성 (Tạo bộ khung ban đầu cho toàn bộ phần mềm)', orderIndex: 1, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd1_2', stageId: 'pstage_gd1', name: "'로컬 저장소' 조성 - 자동 임시 저장, 데이터 손실 방지 (Xây dựng 'kho lưu trữ cục bộ')", orderIndex: 2, defaultAssigneeRole: 'WORKER' },

  // GĐ 2
  { id: 'ptask_gd2_1', stageId: 'pstage_gd2', name: '계약 정보 입력 화면 완료 - 가독성, 단계별 (Hoàn thiện màn hình nhập thông tin hợp đồng)', orderIndex: 1, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd2_2', stageId: 'pstage_gd2', name: '입력한 데이터를 다운로드(Export) / 업로드(Import) 기능 (Tính năng Tải xuống / Tải lên)', orderIndex: 2, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd2_3', stageId: 'pstage_gd2', name: '관리자 화면 설정 - 노란색 정보 영역 표시/비표시 기능 (Cài đặt Màn hình Admin)', orderIndex: 3, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd2_4', stageId: 'pstage_gd2', name: '2단계 기술 테스트 (Kiểm tra kỹ thuật GĐ 2)', orderIndex: 4, defaultAssigneeRole: 'WORKER' },

  // GĐ 3
  { id: 'ptask_gd3_1', stageId: 'pstage_gd3', name: '계약법에 따른 정확한 물가 변동 계산 산식 조성 (Lập trình công thức tính toán trượt giá)', orderIndex: 1, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd3_2', stageId: 'pstage_gd3', name: '자동 검전 및 경고 시스템 설정 - 90일 경과 여부, 3% 초과 여부 (Cài hệ thống tự kiểm tra & cảnh báo)', orderIndex: 2, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd3_3', stageId: 'pstage_gd3', name: '3단계 기술 테스트 (Kiểm tra kỹ thuật GĐ 3)', orderIndex: 3, defaultAssigneeRole: 'WORKER' },

  // GĐ 4
  { id: 'ptask_gd4_1', stageId: 'pstage_gd4', name: '최종 보고 인터페이스 조정 - 인쇄 / PDF 저장 최적화 (Căn chỉnh giao diện bản báo cáo cuối cùng)', orderIndex: 1, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd4_2', stageId: 'pstage_gd4', name: "계약서 PDF 파일 읽음 및 이메일 전송 '요청' 버튼 (Nghiên cứu đọc tự động file PDF hợp đồng & Nút 'Yêu cầu' gửi Email)", orderIndex: 2, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd4_3', stageId: 'pstage_gd4', name: '4단계 기술 테스트 (Kiểm tra kỹ thuật GĐ 4)', orderIndex: 3, defaultAssigneeRole: 'WORKER' },

  // GĐ 5
  { id: 'ptask_gd5_1', stageId: 'pstage_gd5', name: '고객 체험 평가 테스트, 데이터 검증 및 최종 납품 (Chạy thử nghiệm đóng vai khách hàng, rà soát số liệu và bàn giao)', orderIndex: 1, defaultAssigneeRole: 'WORKER' },
  { id: 'ptask_gd5_2', stageId: 'pstage_gd5', name: '메뉴 링크 연결 (Gắn link vào menu)', orderIndex: 2, defaultAssigneeRole: 'WORKER' },
];
