export type LoginLanguage = 'ko' | 'en' | 'vi';

export const companyLinks = [
  { id: 'concost', label: 'CONCOST', href: 'http://www.con-cost.com/', image: '/brand/con-cost-logo.png', imageClassName: 'h-9 w-auto' },
  { id: 'gongsabi', label: '공사비닷컴', href: 'https://test2.con-cost.co.kr/', image: '/brand/gongsabi-logo.png', imageClassName: 'h-11 w-auto' },
  { id: 'vietqs', label: 'VietQs', href: 'https://theme-vietqs-170915.gitlab.io/', image: '/brand/vietqs-logo.png', imageClassName: 'h-10 w-auto' },
  { id: 'esc', label: 'ESC CON-COST System', href: 'https://es.con-cost.co.kr/login', image: '/brand/esc-logo.png', imageClassName: 'h-12 w-12 drop-shadow-[0_0_2px_rgba(255,255,255,.95)]' },
] as const;

export const loginCopy = {
  ko: {
    headlineLines: ['대한민국 NO.1 건설 공사비', '컨설팅 회사'],
    subheadline: '전자메일, 전자결재, 프로젝트 관리, 일정, 재무관리를 한 번에. ALL IN ONE SYSTEM',
    brandLinks: 'CONCOST GROUP SERVICES', loginEyebrow: 'CON-COST GROUPWARE', loginTitle: '시스템 로그인',
    loginBody: '승인된 회사 이메일로 로그인해 주세요.', email: '이메일', emailPlaceholder: 'demo-61d906d5082a@example.invalid',
    password: '비밀번호', passwordPlaceholder: '비밀번호 입력', showPassword: '비밀번호 보기', hidePassword: '비밀번호 숨기기',
    remember: '자동 로그인', findId: '아이디 찾기', findPassword: '비밀번호 찾기', login: '로그인', authenticating: '로그인 확인 중...',
    invalidInput: '올바른 회사 이메일과 8자 이상의 비밀번호를 입력해 주세요.', authFailed: '이메일 또는 비밀번호가 올바르지 않습니다.',
    recoveryTitleId: '아이디 찾기', recoveryTitlePassword: '비밀번호 찾기', recoveryBody: '계정 확인과 비밀번호 초기화는 경영지원본부 담당자에게 요청해 주세요.',
    close: '확인', demoAccounts: '개발 검수 계정', secure: 'Company email only',
  },
  en: {
    headlineLines: ["Korea's No.1 Construction Cost", 'Consulting Company'],
    subheadline: 'Email, approvals, projects, schedules, and finance in one place. ALL IN ONE SYSTEM',
    brandLinks: 'CONCOST GROUP SERVICES', loginEyebrow: 'CON-COST GROUPWARE', loginTitle: 'System sign in',
    loginBody: 'Sign in with your approved company email.', email: 'Email', emailPlaceholder: 'demo-61d906d5082a@example.invalid',
    password: 'Password', passwordPlaceholder: 'Enter your password', showPassword: 'Show password', hidePassword: 'Hide password',
    remember: 'Keep me signed in', findId: 'Find ID', findPassword: 'Find password', login: 'Sign in', authenticating: 'Signing in...',
    invalidInput: 'Enter a valid company email and a password of at least 8 characters.', authFailed: 'The email or password is incorrect.',
    recoveryTitleId: 'Find your ID', recoveryTitlePassword: 'Find your password', recoveryBody: 'Contact Management Support to verify your account or reset your password.',
    close: 'Close', demoAccounts: 'Development test accounts', secure: 'Company email only',
  },
  vi: {
    headlineLines: ['Công ty tư vấn chi phí xây dựng', 'số 1 Hàn Quốc'],
    subheadline: 'Email, phê duyệt, dự án, lịch trình và tài chính trong một hệ thống. ALL IN ONE SYSTEM',
    brandLinks: 'DỊCH VỤ CONCOST GROUP', loginEyebrow: 'CON-COST GROUPWARE', loginTitle: 'Đăng nhập hệ thống',
    loginBody: 'Đăng nhập bằng email công ty đã được phê duyệt.', email: 'Email', emailPlaceholder: 'demo-61d906d5082a@example.invalid',
    password: 'Mật khẩu', passwordPlaceholder: 'Nhập mật khẩu', showPassword: 'Hiện mật khẩu', hidePassword: 'Ẩn mật khẩu',
    remember: 'Tự động đăng nhập', findId: 'Tìm tài khoản', findPassword: 'Tìm mật khẩu', login: 'Đăng nhập', authenticating: 'Đang đăng nhập...',
    invalidInput: 'Nhập email công ty hợp lệ và mật khẩu có ít nhất 8 ký tự.', authFailed: 'Email hoặc mật khẩu không đúng.',
    recoveryTitleId: 'Tìm tài khoản', recoveryTitlePassword: 'Tìm mật khẩu', recoveryBody: 'Liên hệ bộ phận hỗ trợ quản lý để xác minh tài khoản hoặc đặt lại mật khẩu.',
    close: 'Đóng', demoAccounts: 'Tài khoản kiểm thử', secure: 'Chỉ email công ty',
  },
} as const;
