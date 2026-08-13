import type { WorkspaceLanguage } from '@/types/models';

const VI_SHELL_TEXT: Record<string, string> = {
  HOME: 'TRANG CHỦ',
  '전자메일': 'Thư điện tử',
  '전자결재': 'Phê duyệt điện tử',
  '일정 관리': 'Quản lý lịch',
  '프로젝트': 'Dự án',
  '드라이브': 'Drive',
  '할일': 'Công việc',
  '게시판': 'Bảng tin',
  '게시판 홈': 'Trang bảng tin',
  '게시판 관리': 'Quản lý bảng tin',
  '휴지통·복구': 'Thùng rác và khôi phục',
  '조직도': 'Sơ đồ tổ chức',
  '영업': 'Kinh doanh',
  '재무': 'Tài chính',
  'AI챗봇': 'Trợ lý AI',
  'AI 챗봇': 'Trợ lý AI',
  'AI 도우미': 'Trợ lý AI',
  '새 대화': 'Cuộc trò chuyện mới',
  '최근 대화': 'Gần đây',
  '회의록·녹취 정리': 'Biên bản và ghi âm',
  'AI 사용안내': 'Hướng dẫn AI',
  '업무 검색·정리와 다음 행동 지원': 'Tìm kiếm, sắp xếp và chuẩn bị bước tiếp theo',
  '설정': 'Cài đặt',
  '관리자설정': 'Quản trị hệ thống',
  '오늘의 업무와 주요 현황': 'Công việc hôm nay và tình trạng chính',
  '업무 메일함과 중요 문서': 'Hộp thư công việc và tài liệu quan trọng',
  '받은 결재와 배포 문서': 'Phê duyệt nhận được và tài liệu phân phối',
  '캘린더와 오늘·예정 일정': 'Lịch hôm nay và lịch sắp tới',
  '접수부터 납품까지': 'Từ tiếp nhận đến bàn giao',
  '회사·프로젝트 자료': 'Tài liệu công ty và dự án',
  '내 업무와 마감 항목': 'Công việc và hạn chót của tôi',
  '전사·본부별 소식': 'Tin tức công ty và đơn vị',
  '조직과 담당자 검색': 'Tìm tổ chức và người phụ trách',
  '고객·기회·견적·계약 통합 관리': 'Quản lý khách hàng, cơ hội, báo giá và hợp đồng',
  '고객·담당자·프로젝트 이력 통합 관리': 'Quản lý tích hợp khách hàng, liên hệ và lịch sử dự án',
  '매출·매입·자금·결산 통합 관리': 'Quản lý doanh thu, mua hàng, quỹ và quyết toán',
  '업무 검색과 문서 작성 지원': 'Hỗ trợ tìm kiếm công việc và soạn tài liệu',
  '개인 환경과 워크스페이스 설정': 'Cài đặt cá nhân và workspace',
  '인력·권한·데이터 운영 관리': 'Quản lý nhân sự, quyền và dữ liệu',
  '통합 대시보드': 'Bảng điều khiển tổng hợp',
  '결재 대기': 'Chờ phê duyệt',
  '오늘 할일': 'Công việc hôm nay',
  '이번 달 일정': 'Lịch tháng này',
  '결재 홈': 'Trang phê duyệt',
  '받은결재함': 'Hộp phê duyệt đến',
  '보낸결재함': 'Hộp phê duyệt đã gửi',
  '협의결재함': 'Hộp phê duyệt phối hợp',
  '배포문서함': 'Tài liệu phân phối',
  '캘린더': 'Lịch',
  '오늘 일정': 'Lịch hôm nay',
  '예정된 일정': 'Lịch sắp tới',
  '프로젝트 관리': 'Quản lý dự án',
  '견적 의뢰관리': 'Quản lý yêu cầu báo giá',
  '견적서 관리': 'Quản lý báo giá',
  'DB관리': 'Quản lý dữ liệu',
  '프로젝트 접수': 'Tiếp nhận dự án',
  '기술본부 프로젝트': 'Dự án Khối kỹ thuật',
  '전체 프로젝트': 'Tất cả dự án',
  '마감팀': 'Nhóm hoàn thiện',
  '구조팀': 'Nhóm kết cấu',
  '토목&조경팀': 'Nhóm hạ tầng & cảnh quan',
  '회의록': 'Biên bản họp',
  '기술본부 자료실': 'Tài liệu Khối kỹ thuật',
  '클레임센터 프로젝트': 'Dự án Trung tâm Claim',
  '클레임센터 자료실': 'Tài liệu Trung tâm Claim',
  '개발팀 프로젝트': 'Dự án Nhóm phát triển',
  '개발팀 자료실': 'Tài liệu Nhóm phát triển',
  '프로젝트 일정관리': 'Quản lý lịch dự án',
  '전체 일정관리': 'Tất cả lịch dự án',
  '클레임 센터': 'Trung tâm Claim',
  '개발팀': 'Nhóm phát triển',
  '프로젝트 질의사항 관리': 'Quản lý câu hỏi dự án',
  '업무일지': 'Nhật ký công việc',
  '프로젝트 납품 및 데이터관리': 'Bàn giao và dữ liệu dự án',
  '드라이브 홈': 'Trang Drive',
  '기술본부 드라이브': 'Drive Khối kỹ thuật',
  '클레임센터 드라이브': 'Drive Trung tâm Claim',
  '개발팀 드라이브': 'Drive Nhóm phát triển',
  '내 할일': 'Công việc của tôi',
  '오늘 마감': 'Đến hạn hôm nay',
  '검토 대기': 'Chờ xem xét',
  '완료한 일': 'Đã hoàn thành',
  'CEO 인사말': 'Thông điệp CEO',
  '공지사항': 'Thông báo',
  '전사공지': 'Thông báo toàn công ty',
  '인사발령': 'Quyết định nhân sự',
  '경조사': 'Sự kiện nội bộ',
  '커뮤니티': 'Cộng đồng',
  '사진첩': 'Album ảnh',
  '자유게시판': 'Diễn đàn tự do',
  '자료실': 'Kho tài liệu',
  '영업 대시보드': 'Bảng điều khiển kinh doanh',
  '고객·주소록': 'Khách hàng & danh bạ',
  '리드·영업기회': 'Lead & cơ hội',
  '견적·제안': 'Báo giá & đề xuất',
  '계약·수주': 'Hợp đồng & trúng thầu',
  '명함 자동등록': 'Đăng ký danh thiếp OCR',
  '명함 수신함': 'Hộp nhận danh thiếp',
  '모바일 명함 촬영': 'Chụp danh thiếp di động',
  '영업활동·후속조치': 'Hoạt động & theo dõi',
  '재무 대시보드': 'Bảng điều khiển tài chính',
  '매출·매입': 'Doanh thu & mua hàng',
  '세금계산서': 'Hóa đơn thuế',
  '수금·지급': 'Thu & chi',
  '예산·실적': 'Ngân sách & kết quả',
  '경비·법인카드': 'Chi phí & thẻ công ty',
  '자금현황': 'Tình trạng dòng tiền',
  '결산·보고서': 'Quyết toán & báo cáo',
  '개인 설정': 'Cài đặt cá nhân',
  '프로필 사진': 'Ảnh hồ sơ',
  '언어·번역 설정': 'Ngôn ngữ & dịch thuật',
  '접근등급·권한 관리': 'Cấp truy cập & quyền',
  'Google Drive 연결': 'Kết nối Google Drive',
  '통합 진단': 'Chẩn đoán tích hợp',
  '인력현황 관리': 'Quản lý nhân sự',
  '워크스페이스 관리': 'Quản lý workspace',
  '데이터 품질 관리': 'Quản lý chất lượng dữ liệu',
  '전사': 'Toàn công ty',
  '임원': 'Ban điều hành',
  '기술본부': 'Khối kỹ thuật',
  '클레임센터': 'Trung tâm Claim',
  '경영지원본부': 'Khối hỗ trợ quản lý',
};

export const localizeShellText = (value: string, language: WorkspaceLanguage) =>
  language === 'vi' ? VI_SHELL_TEXT[value] ?? value : value;

export const localizeGeneratedTaskTitle = (value: string, language: WorkspaceLanguage) =>
  language === 'vi' ? value.replace(/ 작업$/, ' công việc') : value;

export interface WorkspaceShellCopy {
  switchWorkspace: (company: string) => string;
  globalNavigation: string;
  mobileNavigation: string;
  channels: string;
  companyWide: string;
  topAdministrator: string;
  modeSettings: string;
  lightMode: string;
  darkMode: string;
  menu: string;
  searchPlaceholder: string;
  globalSearch: string;
  workMode: string;
  adminMode: string;
  languageSelection: string;
  notifications: string;
  accessGrade: string;
  profilePhoto: string;
  personalSettings: string;
  permissionManagement: string;
  logout: string;
}

export const getWorkspaceShellCopy = (language: WorkspaceLanguage): WorkspaceShellCopy => language === 'vi'
  ? {
      switchWorkspace: (company) => `Chuyển sang workspace ${company}`,
      globalNavigation: 'Menu nghiệp vụ toàn cục',
      mobileNavigation: 'Menu nghiệp vụ di động',
      channels: 'Kênh nghiệp vụ',
      companyWide: 'Toàn công ty',
      topAdministrator: 'Quản trị viên cấp cao',
      modeSettings: 'Giao diện',
      lightMode: 'Chuyển sang giao diện sáng',
      darkMode: 'Chuyển sang giao diện tối',
      menu: 'Mở menu',
      searchPlaceholder: 'Tìm dự án, tài liệu hoặc người phụ trách',
      globalSearch: 'Tìm kiếm toàn cục',
      workMode: 'Chế độ làm việc',
      adminMode: 'Chế độ quản trị',
      languageSelection: 'Chọn ngôn ngữ',
      notifications: 'Thông báo',
      accessGrade: 'Cấp truy cập',
      profilePhoto: 'Ảnh hồ sơ',
      personalSettings: 'Cài đặt cá nhân',
      permissionManagement: 'Quản lý quyền',
      logout: 'Đăng xuất',
    }
  : {
      switchWorkspace: (company) => `${company} 워크스페이스로 전환`,
      globalNavigation: '글로벌 업무 메뉴',
      mobileNavigation: '모바일 주요 메뉴',
      channels: '업무 채널',
      companyWide: '전사',
      topAdministrator: '최고관리자',
      modeSettings: '모드설정',
      lightMode: '라이트모드로 전환',
      darkMode: '다크모드로 전환',
      menu: '메뉴 열기',
      searchPlaceholder: '프로젝트, 문서, 담당자 통합검색',
      globalSearch: '통합검색',
      workMode: '업무모드',
      adminMode: '관리모드',
      languageSelection: '언어 선택',
      notifications: '알림',
      accessGrade: '접근등급',
      profilePhoto: '프로필 사진',
      personalSettings: '개인 설정',
      permissionManagement: '권한 관리',
      logout: '로그아웃',
    };

export interface WorkspaceHomeCopy {
  dashboardAria: string;
  myWorkspace: string;
  myWorkspaceDescription: string;
  widgetSettings: string;
  widgetLabels: Record<'projects' | 'kpi' | 'approvals' | 'sales' | 'tasks' | 'schedule', string>;
  participatingProjects: string;
  participatingProjectsDescription: string;
  project: string;
  projectSteps: string[];
  noParticipatingProjects: string;
  kpiPerformance: string;
  taskAchievement: string;
  completed: string;
  review: string;
  delayed: string;
  approvalStatus: string;
  approvedDocuments: string;
  approved: string;
  pending: string;
  rejected: string;
  orderStatus: string;
  orderStatusDescription: string;
  won: string;
  submitted: string;
  lost: string;
  priorityTasks: string;
  noDeadline: string;
  noPriorityTasks: string;
  todaySchedule: string;
  itemUnit: string;
  scheduleDescription: string;
  workConnection: string;
  viewSchedule: string;
  importSuccess: string;
  importInvalid: string;
  roleDetails: string;
  expand: string;
  collapse: string;
}

export const getWorkspaceHomeCopy = (language: WorkspaceLanguage): WorkspaceHomeCopy => language === 'vi'
  ? {
      dashboardAria: 'Bảng điều khiển cá nhân',
      myWorkspace: 'Workspace của tôi',
      myWorkspaceDescription: 'Chọn widget cần thiết và đi thẳng đến công việc từ từng trạng thái.',
      widgetSettings: 'Cài đặt widget',
      widgetLabels: { projects: 'Dự án tham gia', kpi: 'Hiệu suất KPI', approvals: 'Tình trạng phê duyệt', sales: 'Tình trạng trúng thầu', tasks: 'Công việc ưu tiên', schedule: 'Tóm tắt lịch' },
      participatingProjects: 'Dự án đang tham gia',
      participatingProjectsDescription: 'Theo dõi tiến độ và luồng bàn giao trong một màn hình.',
      project: 'Dự án',
      projectSteps: ['Tiếp nhận', 'PM', 'Lịch', 'Công việc', 'Bàn giao'],
      noParticipatingProjects: 'Không có dự án đang tham gia.',
      kpiPerformance: 'Hiệu suất KPI',
      taskAchievement: 'Tỷ lệ hoàn thành công việc',
      completed: 'Hoàn thành',
      review: 'Xem xét',
      delayed: 'Chậm trễ',
      approvalStatus: 'Tình trạng phê duyệt',
      approvedDocuments: 'Tài liệu đã duyệt',
      approved: 'Đã duyệt',
      pending: 'Đang chờ',
      rejected: 'Từ chối',
      orderStatus: 'Tình trạng trúng thầu',
      orderStatusDescription: 'Từ báo giá đến chuyển đổi trúng thầu',
      won: 'Trúng thầu',
      submitted: 'Đã nộp',
      lost: 'Không trúng',
      priorityTasks: 'Công việc ưu tiên',
      noDeadline: 'Không có hạn',
      noPriorityTasks: 'Không có công việc ưu tiên.',
      todaySchedule: 'Lịch hôm nay',
      itemUnit: 'mục',
      scheduleDescription: 'Xem cuộc họp, nghỉ phép và lịch dự án đã đăng ký trong lịch.',
      workConnection: 'Liên kết công việc',
      viewSchedule: 'Xem lịch',
      importSuccess: 'Đã nhập dữ liệu workspace.',
      importInvalid: 'Tệp JSON workspace không hợp lệ.',
      roleDetails: 'Chi tiết vận hành theo vai trò',
      expand: 'Mở rộng',
      collapse: 'Thu gọn',
    }
  : {
      dashboardAria: '개인화 대시보드',
      myWorkspace: '나의 워크스페이스',
      myWorkspaceDescription: '필요한 위젯을 선택하고 각 현황에서 바로 업무로 이동합니다.',
      widgetSettings: '위젯 설정',
      widgetLabels: { projects: '참여 프로젝트', kpi: 'KPI 성과', approvals: '결재 현황', sales: '수주 현황', tasks: '우선 업무', schedule: '일정 요약' },
      participatingProjects: '참여중인 프로젝트',
      participatingProjectsDescription: '진행률과 납품 흐름을 한눈에 확인합니다.',
      project: '프로젝트',
      projectSteps: ['접수', 'PM', '일정', '작업', '납품'],
      noParticipatingProjects: '참여중인 프로젝트가 없습니다.',
      kpiPerformance: 'KPI 성과',
      taskAchievement: '업무 달성률',
      completed: '완료',
      review: '검토',
      delayed: '지연',
      approvalStatus: '결재 현황',
      approvedDocuments: '승인 문서',
      approved: '승인',
      pending: '대기',
      rejected: '반려',
      orderStatus: '수주 현황',
      orderStatusDescription: '견적부터 수주 전환까지',
      won: '수주',
      submitted: '제출',
      lost: '실주',
      priorityTasks: '우선 업무',
      noDeadline: '기한 없음',
      noPriorityTasks: '우선 처리할 업무가 없습니다.',
      todaySchedule: '오늘 일정',
      itemUnit: '건',
      scheduleDescription: '등록한 회의, 휴가와 프로젝트 일정을 캘린더에서 확인할 수 있습니다.',
      workConnection: '업무 연결',
      viewSchedule: '일정 보기',
      importSuccess: '워크스페이스 데이터를 불러왔습니다.',
      importInvalid: '올바른 워크스페이스 JSON 파일이 아닙니다.',
      roleDetails: '역할별 운영 상세',
      expand: '펼쳐보기',
      collapse: '접기',
    };
