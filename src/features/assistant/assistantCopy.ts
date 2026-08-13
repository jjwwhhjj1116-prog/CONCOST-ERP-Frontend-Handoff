import type { AssistantLocale } from './assistantModel';

const COPY = {
  ko: {
    title: 'AI 업무도우미', subtitle: '업무를 찾고, 정리하고, 다음 행동을 준비해 드립니다.',
    greeting: '안녕하세요. 무엇을 도와드릴까요?', greetingDetail: '프로젝트, 고객, 일정, 결재, 게시판 등을 현재 권한 안에서 찾아드릴 수 있습니다.',
    placeholder: '업무 질문을 입력하세요', send: '질문 전송', newThread: '새 대화', history: '최근 대화', help: 'AI 사용안내', meeting: '회의록·녹취 정리',
    open: '원본 열기', close: '닫기', full: '전체화면', contextOn: '현재 화면 포함', contextOff: '현재 화면 제외',
    demo: 'DEMO AI 도우미', demoDetail: '현재 브라우저의 합성 데이터와 정해진 업무질의 규칙으로 응답합니다.',
    source: '근거', helpful: '도움됨', notHelpful: '도움안됨', confirm: '내용 확인', execute: '초안 열기', cancel: '취소', archive: '보관', remove: '삭제',
    emptyHistory: '이 회사에서 시작한 대화가 없습니다.', noContext: '현재 화면 Context 없음', runtime: '실행 상태', settings: '도우미 설정',
    assistantOpen: 'AI 도우미 열기', greetingBubble: '궁금한 업무가 있으면 물어보세요.', contextSensitive: '민감 화면 Context는 자동으로 포함하지 않습니다.',
    thinking: '자료 확인 중...', unsupported: '이 Demo 도우미가 아직 답할 수 없는 질문입니다.', model: '응답 방식', generated: '생성 시각', company: '회사',
  },
  vi: {
    title: 'Trợ lý công việc AI', subtitle: 'Tìm kiếm, sắp xếp công việc và chuẩn bị bước tiếp theo.',
    greeting: 'Xin chào. Tôi có thể giúp gì cho bạn?', greetingDetail: 'Tôi có thể tìm dự án, khách hàng, lịch, phê duyệt và bảng tin trong phạm vi quyền của bạn.',
    placeholder: 'Nhập câu hỏi công việc', send: 'Gửi câu hỏi', newThread: 'Cuộc trò chuyện mới', history: 'Gần đây', help: 'Hướng dẫn AI', meeting: 'Biên bản và ghi âm',
    open: 'Mở bản ghi', close: 'Đóng', full: 'Toàn màn hình', contextOn: 'Bao gồm màn hình hiện tại', contextOff: 'Loại màn hình hiện tại',
    demo: 'TRỢ LÝ AI DEMO', demoDetail: 'Phản hồi bằng dữ liệu tổng hợp trong trình duyệt và quy tắc nghiệp vụ xác định.',
    source: 'Nguồn', helpful: 'Hữu ích', notHelpful: 'Không hữu ích', confirm: 'Xem nội dung', execute: 'Mở bản nháp', cancel: 'Hủy', archive: 'Lưu trữ', remove: 'Xóa',
    emptyHistory: 'Chưa có cuộc trò chuyện cho công ty này.', noContext: 'Không có ngữ cảnh màn hình', runtime: 'Trạng thái', settings: 'Cài đặt trợ lý',
    assistantOpen: 'Mở trợ lý AI', greetingBubble: 'Hãy hỏi khi bạn cần tìm công việc.', contextSensitive: 'Ngữ cảnh nhạy cảm không được tự động đưa vào.',
    thinking: 'Đang kiểm tra dữ liệu...', unsupported: 'Trợ lý Demo chưa thể trả lời câu hỏi này.', model: 'Cách phản hồi', generated: 'Thời gian tạo', company: 'Công ty',
  },
  en: {
    title: 'AI Work Assistant', subtitle: 'Find work, organize it, and prepare the next action.',
    greeting: 'Hello. How can I help?', greetingDetail: 'I can find projects, customers, schedules, approvals, and board posts within your permissions.',
    placeholder: 'Ask a work question', send: 'Send question', newThread: 'New chat', history: 'Recent chats', help: 'AI guide', meeting: 'Meeting notes and audio',
    open: 'Open record', close: 'Close', full: 'Full screen', contextOn: 'Include current page', contextOff: 'Exclude current page',
    demo: 'DEMO AI ASSISTANT', demoDetail: 'Uses synthetic browser data and deterministic business-query rules.',
    source: 'Sources', helpful: 'Helpful', notHelpful: 'Not helpful', confirm: 'Review', execute: 'Open draft', cancel: 'Cancel', archive: 'Archive', remove: 'Delete',
    emptyHistory: 'No conversations for this company.', noContext: 'No current page context', runtime: 'Runtime', settings: 'Assistant settings',
    assistantOpen: 'Open AI Assistant', greetingBubble: 'Ask when you need help finding work.', contextSensitive: 'Sensitive page context is not included automatically.',
    thinking: 'Checking records...', unsupported: 'The Demo assistant cannot answer that question yet.', model: 'Response mode', generated: 'Generated', company: 'Company',
  },
} as const;

export const assistantCopy = (locale: AssistantLocale) => COPY[locale];

export const assistantProactiveHint = (locale: AssistantLocale, route: string) => {
  if (route.startsWith('/projects/intake')) return locale === 'vi' ? 'Bạn muốn kiểm tra các mục còn thiếu trước khi hoàn tất tiếp nhận?' : locale === 'en' ? 'Would you like to check missing items before completing intake?' : '접수 완료 전에 누락항목을 확인할까요?';
  if (route.startsWith('/finance')) return locale === 'vi' ? 'Bạn muốn xem giải thích tiêu chuẩn công nợ của màn hình này?' : locale === 'en' ? 'Would you like an explanation of this screen\'s receivable criteria?' : '이 화면의 미수 기준을 설명해 드릴까요?';
  if (route.startsWith('/board')) return locale === 'vi' ? 'Bạn muốn tìm thông báo bắt buộc gần đây?' : locale === 'en' ? 'Would you like to find recent must-read notices?' : '최근 필독 공지를 찾아드릴까요?';
  if (route.startsWith('/projects')) return locale === 'vi' ? 'Bạn muốn tóm tắt trạng thái dự án hiện tại?' : locale === 'en' ? 'Would you like a summary of the current project?' : '현재 프로젝트 진행상태를 정리할까요?';
  return COPY[locale].greetingBubble;
};

export const assistantPrompts = (locale: AssistantLocale, route: string, financeAllowed: boolean) => {
  const common = locale === 'vi'
    ? ['Công việc hôm nay của tôi?', 'Lịch hôm nay?', 'Phê duyệt đang chờ?', 'Thông báo công ty gần đây?']
    : locale === 'en'
      ? ['What are my tasks today?', 'What is on my schedule today?', 'Show pending approvals', 'Show recent company notices']
      : ['오늘 할 일을 알려줘', '오늘 일정이 뭐야?', '내 결재 대기 문서를 보여줘', '최근 전사공지를 알려줘'];
  const routePrompts = route.startsWith('/projects')
    ? (locale === 'vi' ? ['Tóm tắt trạng thái dự án này', 'Ai là PM và đơn vị phụ trách?'] : locale === 'en' ? ['Summarize this project', 'Who is the PM and owning unit?'] : ['이 프로젝트 진행상태를 정리해줘', '담당부서와 PM이 누구야?'])
    : route.startsWith('/sales')
      ? (locale === 'vi' ? ['Lịch sử dự án của khách hàng này?'] : locale === 'en' ? ['Show this customer project history'] : ['이 고객사 프로젝트 이력을 보여줘'])
      : route.startsWith('/board')
        ? (locale === 'vi' ? ['Tìm thông báo bắt buộc gần đây'] : locale === 'en' ? ['Find recent must-read notices'] : ['최근 필독 공지를 찾아줘'])
        : route.startsWith('/claims')
          ? (locale === 'vi' ? ['Các vấn đề claim chưa giải quyết?'] : locale === 'en' ? ['Show unresolved claim issues'] : ['미해결 클레임 쟁점을 보여줘'])
          : [];
  const finance = financeAllowed && route.startsWith('/finance')
    ? [locale === 'vi' ? 'Tình trạng công nợ tháng này?' : locale === 'en' ? 'Summarize this month receivables' : '이번 달 미수 현황을 알려줘']
    : [];
  return [...routePrompts, ...finance, ...common].slice(0, 6);
};
