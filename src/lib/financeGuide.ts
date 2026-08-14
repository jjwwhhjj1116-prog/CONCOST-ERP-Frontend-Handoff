export type FinanceGuideLocale = 'ko' | 'vi' | 'en';

export type FinanceGuideView =
  | 'DASHBOARD'
  | 'REVENUE'
  | 'PURCHASES'
  | 'CASHFLOW'
  | 'EXPENSES'
  | 'TAX'
  | 'BUDGET'
  | 'TREASURY'
  | 'PROFITABILITY'
  | 'CLOSING'
  | 'CONTROLS';

export type FinanceGuideTarget = 'summary' | 'safety' | 'navigation' | 'toolbar' | 'workspace' | 'help';

export interface FinanceGuideStep {
  id: string;
  target: FinanceGuideTarget;
  view?: FinanceGuideView;
  title: string;
  description: string;
  checklist: string[];
}

export interface FinanceHelpWorkflow {
  id: string;
  view: FinanceGuideView;
  title: string;
  description: string;
  steps: string[];
}

export interface FinanceGlossaryItem {
  term: string;
  meaning: string;
}

export interface FinanceGuideContent {
  guideTitle: string;
  helpTitle: string;
  helpDescription: string;
  tourButton: string;
  helpButton: string;
  previous: string;
  next: string;
  finish: string;
  close: string;
  skip: string;
  restart: string;
  workflowTitle: string;
  glossaryTitle: string;
  safetyTitle: string;
  safetyItems: string[];
  stepLabel: string;
  openWorkflow: string;
  steps: FinanceGuideStep[];
  workflows: FinanceHelpWorkflow[];
  glossary: FinanceGlossaryItem[];
}

export const FINANCE_GUIDE_VERSION = 'v1';

export function financeGuidePreferenceKey(companyId: string, userId: string): string {
  const safeCompany = companyId.replace(/[^A-Za-z0-9_-]/g, '_');
  const safeUser = userId.replace(/[^A-Za-z0-9_-]/g, '_');
  return `concost.finance.guide.${FINANCE_GUIDE_VERSION}.${safeCompany}.${safeUser}`;
}

const CONTENT: Record<FinanceGuideLocale, FinanceGuideContent> = {
  ko: {
    guideTitle: '재무 화면, 처음부터 같이 해봐요',
    helpTitle: '재무 도움말',
    helpDescription: '하고 싶은 일을 고르면 해당 화면으로 바로 이동합니다.',
    tourButton: '화면 안내',
    helpButton: '도움말',
    previous: '이전',
    next: '다음',
    finish: '안내 완료',
    close: '닫기',
    skip: '나중에 보기',
    restart: '단계별 안내 다시 시작',
    workflowTitle: '무엇을 하려고 하나요?',
    glossaryTitle: '쉬운 재무 용어',
    safetyTitle: '꼭 기억해 주세요',
    safetyItems: [
      'DEMO_LOCAL 숫자는 연습용이며 실제 장부나 은행잔액이 아닙니다.',
      '증빙과 Project 번호를 연결하면 나중에 원인을 쉽게 찾을 수 있습니다.',
      '세금계산서·은행 Provider가 연결되지 않으면 실제 발행·조회는 완료되지 않습니다.',
    ],
    stepLabel: '단계',
    openWorkflow: '이 화면 열기',
    steps: [
      { id: 'summary', target: 'summary', view: 'DASHBOARD', title: '먼저 큰 숫자부터 봐요', description: '맨 위 숫자는 우리 회사 돈의 흐름을 한눈에 보여주는 요약입니다.', checklist: ['받을 돈과 줄 돈을 비교해요.', '연체나 통제 알림이 있는지 확인해요.'] },
      { id: 'safety', target: 'safety', title: '연습 데이터인지 먼저 확인해요', description: '현재 화면이 연습용인지, 실제 서버와 연결됐는지 이곳에서 확인합니다.', checklist: ['DEMO_LOCAL은 실제 저장이 아닙니다.', 'Provider 미연결 상태를 성공으로 생각하면 안 됩니다.'] },
      { id: 'navigation', target: 'navigation', title: '할 일을 메뉴에서 골라요', description: '매출, 매입, 수금, 경비, 예산, 결산처럼 업무별로 화면이 나뉘어 있습니다.', checklist: ['처음에는 매출·채권부터 시작해요.', '월말에는 월 결산을 확인해요.'] },
      { id: 'revenue', target: 'workspace', view: 'REVENUE', title: '받을 돈을 기록해요', description: 'Project에서 얼마를 청구했고 언제 받을 예정인지 등록하는 곳입니다.', checklist: ['Project와 거래처를 선택해요.', '공급가액·VAT·예정일을 확인해요.', '받은 뒤에는 수금 기록을 남겨요.'] },
      { id: 'cashflow', target: 'workspace', view: 'CASHFLOW', title: '돈이 들어오고 나갈 날짜를 봐요', description: '예정된 수금과 지급을 달력과 Aging으로 확인합니다.', checklist: ['이번 달 예정 금액을 확인해요.', '1~30일 이상 늦어진 항목을 먼저 처리해요.'] },
      { id: 'expenses', target: 'workspace', view: 'EXPENSES', title: '회사에서 쓴 돈을 기록해요', description: '카드·현금 경비를 Project와 증빙, 전자결재에 연결합니다.', checklist: ['사용한 날짜와 금액을 적어요.', '영수증과 Project를 연결해요.', '규정 경고가 있으면 결재 전에 고쳐요.'] },
      { id: 'budget', target: 'workspace', view: 'BUDGET', title: '예산을 넘지 않았는지 확인해요', description: '예산과 실제 사용액을 비교하고 INFO·WARN·BLOCK 상태를 확인합니다.', checklist: ['집행률을 확인해요.', 'WARN과 BLOCK은 담당자와 먼저 확인해요.'] },
      { id: 'closing', target: 'workspace', view: 'CLOSING', title: '월말에는 체크리스트를 닫아요', description: '필수 확인을 끝낸 뒤 월마감을 진행하고, 다시 열 때는 사유를 남깁니다.', checklist: ['빠진 증빙과 미처리 항목을 확인해요.', '마감 후 수정은 잠금과 이력 규칙을 따라요.'] },
      { id: 'help', target: 'help', title: '모르면 언제든 도움말을 눌러요', description: '이 버튼에서 단계별 안내를 다시 시작하거나 원하는 업무 설명을 바로 찾을 수 있습니다.', checklist: ['도움말은 업무 데이터를 바꾸지 않습니다.', '언어를 바꾸면 안내도 함께 번역됩니다.'] },
    ],
    workflows: [
      { id: 'record-revenue', view: 'REVENUE', title: '매출과 받을 돈 등록', description: 'Project 청구 내용을 기록합니다.', steps: ['매출 등록을 누릅니다.', 'Project·거래처·금액·예정일을 입력합니다.', '증빙을 확인하고 저장합니다.'] },
      { id: 'record-purchase', view: 'PURCHASES', title: '매입과 줄 돈 등록', description: '외주·구매 등 지급할 내용을 기록합니다.', steps: ['매입 등록을 누릅니다.', '거래처·금액·지급예정일을 입력합니다.', '지급 후 지급 기록을 남깁니다.'] },
      { id: 'record-expense', view: 'EXPENSES', title: '카드·영수증 경비 등록', description: '경비와 증빙, 결재를 연결합니다.', steps: ['경비 등록을 누릅니다.', '수단·Project·비용분류를 고릅니다.', 'READY 증빙과 결재 Draft를 확인합니다.'] },
      { id: 'check-cash', view: 'CASHFLOW', title: '수금·지급 일정 확인', description: '다가오는 돈의 흐름과 연체를 확인합니다.', steps: ['예정일 순으로 봅니다.', 'Aging이 큰 항목을 확인합니다.', '처리 결과를 원장에 기록합니다.'] },
      { id: 'manage-budget', view: 'BUDGET', title: '예산과 실적 비교', description: '부서·Project 예산 초과를 미리 확인합니다.', steps: ['예산 범위를 선택합니다.', '집행·승인대기·예상을 비교합니다.', 'WARN·BLOCK 사유를 확인합니다.'] },
      { id: 'monthly-close', view: 'CLOSING', title: '월 결산 진행', description: '월말 확인과 잠금을 순서대로 진행합니다.', steps: ['체크리스트를 모두 확인합니다.', '검토 상태를 거쳐 마감합니다.', '재오픈은 사유와 감사이력을 남깁니다.'] },
    ],
    glossary: [
      { term: '매출', meaning: '고객에게 받을 돈이 생긴 것' },
      { term: '매입', meaning: '회사에서 다른 업체에 줄 돈이 생긴 것' },
      { term: '미수', meaning: '받기로 했지만 아직 받지 못한 돈' },
      { term: '미지급', meaning: '주기로 했지만 아직 주지 않은 돈' },
      { term: 'VAT', meaning: '부가가치세' },
      { term: 'Aging', meaning: '받거나 줄 날짜가 얼마나 지났는지 나눈 표' },
      { term: '관리손익', meaning: '업무 관리를 위한 예상 이익이며 법정 손익은 아님' },
      { term: '결산', meaning: '한 달의 기록이 빠짐없는지 확인하고 잠그는 일' },
    ],
  },
  vi: {
    guideTitle: 'Cùng tìm hiểu màn hình tài chính từng bước',
    helpTitle: 'Trợ giúp tài chính',
    helpDescription: 'Chọn việc cần làm để đi thẳng tới đúng màn hình.',
    tourButton: 'Hướng dẫn', helpButton: 'Trợ giúp', previous: 'Trước', next: 'Tiếp', finish: 'Hoàn tất', close: 'Đóng', skip: 'Xem sau', restart: 'Bắt đầu lại hướng dẫn', workflowTitle: 'Bạn muốn làm gì?', glossaryTitle: 'Thuật ngữ dễ hiểu', safetyTitle: 'Cần nhớ', stepLabel: 'Bước', openWorkflow: 'Mở màn hình',
    safetyItems: ['Số liệu DEMO_LOCAL chỉ dùng để luyện tập, không phải sổ sách hay số dư thật.', 'Liên kết chứng từ với mã dự án để dễ truy vết.', 'Không có Provider thì phát hành hóa đơn và số dư ngân hàng không thể thành công.'],
    steps: [
      { id: 'summary', target: 'summary', view: 'DASHBOARD', title: 'Bắt đầu từ các số lớn', description: 'Các số phía trên tóm tắt dòng tiền của công ty.', checklist: ['So sánh tiền phải thu và phải trả.', 'Kiểm tra quá hạn và cảnh báo.'] },
      { id: 'safety', target: 'safety', title: 'Kiểm tra dữ liệu thật hay mô phỏng', description: 'Khu vực này cho biết màn hình đang ở DEMO hay đã nối Server.', checklist: ['DEMO_LOCAL không phải lưu thật.', 'Không coi Provider chưa cấu hình là thành công.'] },
      { id: 'navigation', target: 'navigation', title: 'Chọn công việc từ menu', description: 'Doanh thu, mua hàng, thu chi, chi phí, ngân sách và khóa sổ được tách riêng.', checklist: ['Bắt đầu từ Doanh thu & phải thu.', 'Cuối tháng kiểm tra Khóa sổ.'] },
      { id: 'revenue', target: 'workspace', view: 'REVENUE', title: 'Ghi số tiền cần thu', description: 'Ghi số đã xuất hóa đơn cho dự án và ngày dự kiến thu.', checklist: ['Chọn dự án và khách hàng.', 'Kiểm tra tiền trước thuế, VAT và ngày đến hạn.', 'Ghi nhận khi đã thu tiền.'] },
      { id: 'cashflow', target: 'workspace', view: 'CASHFLOW', title: 'Xem ngày tiền vào và ra', description: 'Kiểm tra lịch thu chi và tuổi nợ.', checklist: ['Xem số tiền dự kiến trong tháng.', 'Xử lý khoản quá hạn trước.'] },
      { id: 'expenses', target: 'workspace', view: 'EXPENSES', title: 'Ghi chi phí công ty', description: 'Liên kết chi phí thẻ hoặc tiền mặt với dự án, chứng từ và phê duyệt.', checklist: ['Nhập ngày và số tiền.', 'Gắn hóa đơn và dự án.', 'Sửa cảnh báo trước khi trình duyệt.'] },
      { id: 'budget', target: 'workspace', view: 'BUDGET', title: 'Kiểm tra vượt ngân sách', description: 'So sánh ngân sách với thực tế và xem INFO, WARN, BLOCK.', checklist: ['Kiểm tra tỷ lệ thực hiện.', 'Xác nhận WARN và BLOCK với người phụ trách.'] },
      { id: 'closing', target: 'workspace', view: 'CLOSING', title: 'Hoàn tất checklist cuối tháng', description: 'Hoàn thành kiểm tra rồi khóa kỳ; mở lại phải có lý do.', checklist: ['Kiểm tra chứng từ còn thiếu.', 'Tuân thủ khóa và lịch sử sau khi đóng kỳ.'] },
      { id: 'help', target: 'help', title: 'Mở trợ giúp bất cứ lúc nào', description: 'Bạn có thể bắt đầu lại hướng dẫn hoặc tìm nhanh một quy trình.', checklist: ['Trợ giúp không thay đổi dữ liệu.', 'Nội dung đổi theo ngôn ngữ.'] },
    ],
    workflows: [
      { id: 'record-revenue', view: 'REVENUE', title: 'Ghi doanh thu và khoản phải thu', description: 'Ghi nội dung cần thu của dự án.', steps: ['Nhấn Thêm doanh thu.', 'Nhập dự án, khách hàng, số tiền và ngày.', 'Kiểm tra chứng từ rồi lưu.'] },
      { id: 'record-purchase', view: 'PURCHASES', title: 'Ghi mua hàng và khoản phải trả', description: 'Ghi số tiền phải trả cho nhà cung cấp.', steps: ['Nhấn Thêm mua hàng.', 'Nhập đối tác, số tiền và ngày trả.', 'Ghi nhận sau khi thanh toán.'] },
      { id: 'record-expense', view: 'EXPENSES', title: 'Ghi thẻ và hóa đơn', description: 'Liên kết chi phí, chứng từ và phê duyệt.', steps: ['Nhấn Thêm chi phí.', 'Chọn phương thức, dự án và loại chi phí.', 'Kiểm tra file READY và bản nháp phê duyệt.'] },
      { id: 'check-cash', view: 'CASHFLOW', title: 'Kiểm tra lịch thu chi', description: 'Xem dòng tiền sắp tới và quá hạn.', steps: ['Xem theo ngày dự kiến.', 'Kiểm tra khoản có tuổi nợ cao.', 'Ghi kết quả vào sổ.'] },
      { id: 'manage-budget', view: 'BUDGET', title: 'So sánh ngân sách và thực tế', description: 'Phát hiện sớm vượt ngân sách.', steps: ['Chọn phạm vi ngân sách.', 'So sánh thực tế, chờ duyệt và dự báo.', 'Kiểm tra lý do WARN/BLOCK.'] },
      { id: 'monthly-close', view: 'CLOSING', title: 'Khóa sổ tháng', description: 'Kiểm tra và khóa kỳ theo thứ tự.', steps: ['Hoàn thành checklist.', 'Chuyển qua review và đóng kỳ.', 'Mở lại phải có lý do và audit.'] },
    ],
    glossary: [
      { term: 'Doanh thu', meaning: 'Số tiền khách hàng phải trả cho công ty' }, { term: 'Mua hàng', meaning: 'Số tiền công ty phải trả cho nhà cung cấp' }, { term: 'Phải thu', meaning: 'Tiền chưa nhận được' }, { term: 'Phải trả', meaning: 'Tiền chưa thanh toán' }, { term: 'VAT', meaning: 'Thuế giá trị gia tăng' }, { term: 'Aging', meaning: 'Bảng chia khoản nợ theo số ngày quá hạn' }, { term: 'Lợi nhuận quản trị', meaning: 'Ước tính để quản lý, không phải lợi nhuận pháp định' }, { term: 'Khóa sổ', meaning: 'Kiểm tra và khóa dữ liệu của một tháng' },
    ],
  },
  en: {
    guideTitle: 'Learn the finance screen step by step',
    helpTitle: 'Finance help',
    helpDescription: 'Choose a task to open the right workspace.',
    tourButton: 'Screen guide', helpButton: 'Help', previous: 'Previous', next: 'Next', finish: 'Finish guide', close: 'Close', skip: 'View later', restart: 'Restart step-by-step guide', workflowTitle: 'What do you want to do?', glossaryTitle: 'Plain-language finance terms', safetyTitle: 'Remember', stepLabel: 'Step', openWorkflow: 'Open workspace',
    safetyItems: ['DEMO_LOCAL values are for practice, not real books or bank balances.', 'Link evidence and project numbers so every amount can be traced.', 'Tax and bank actions cannot succeed until their providers are connected.'],
    steps: [
      { id: 'summary', target: 'summary', view: 'DASHBOARD', title: 'Start with the big numbers', description: 'The top numbers summarize company cash movement.', checklist: ['Compare money to receive and money to pay.', 'Check overdue items and control alerts.'] },
      { id: 'safety', target: 'safety', title: 'Check whether data is real or simulated', description: 'This area shows whether the screen is DEMO or connected to a Server.', checklist: ['DEMO_LOCAL is not an operational save.', 'A missing Provider is not a successful action.'] },
      { id: 'navigation', target: 'navigation', title: 'Choose the job from the menu', description: 'Revenue, purchases, cash, expenses, budget, and close have separate workspaces.', checklist: ['Start with Revenue & AR.', 'Check Monthly close at month end.'] },
      { id: 'revenue', target: 'workspace', view: 'REVENUE', title: 'Record money to receive', description: 'Record what was billed for a project and when payment is expected.', checklist: ['Choose a project and customer.', 'Check supply amount, VAT, and due date.', 'Record the collection when paid.'] },
      { id: 'cashflow', target: 'workspace', view: 'CASHFLOW', title: 'See when money comes in and goes out', description: 'Review planned collections, payments, and aging.', checklist: ['Check this month’s scheduled amounts.', 'Handle older overdue items first.'] },
      { id: 'expenses', target: 'workspace', view: 'EXPENSES', title: 'Record company spending', description: 'Link card or cash expenses to a project, evidence, and approval.', checklist: ['Enter the date and amount.', 'Link the receipt and project.', 'Resolve policy warnings before approval.'] },
      { id: 'budget', target: 'workspace', view: 'BUDGET', title: 'Check whether budget is exceeded', description: 'Compare budget with actuals and review INFO, WARN, and BLOCK.', checklist: ['Check the execution rate.', 'Confirm WARN and BLOCK with the owner.'] },
      { id: 'closing', target: 'workspace', view: 'CLOSING', title: 'Finish the month-end checklist', description: 'Complete checks before closing; reopening requires a reason.', checklist: ['Find missing evidence and unfinished work.', 'Follow lock and audit rules after closing.'] },
      { id: 'help', target: 'help', title: 'Open help whenever you need it', description: 'Restart this guide or find a task from the Help button.', checklist: ['Help never changes business data.', 'The guide follows your language.'] },
    ],
    workflows: [
      { id: 'record-revenue', view: 'REVENUE', title: 'Record revenue and receivables', description: 'Record project billing.', steps: ['Select Add revenue.', 'Enter project, customer, amount, and due date.', 'Check evidence and save.'] },
      { id: 'record-purchase', view: 'PURCHASES', title: 'Record purchases and payables', description: 'Record money owed to a supplier.', steps: ['Select Add purchase.', 'Enter supplier, amount, and payment date.', 'Record the payment after settlement.'] },
      { id: 'record-expense', view: 'EXPENSES', title: 'Record cards and receipts', description: 'Link spending, evidence, and approval.', steps: ['Select Add expense.', 'Choose method, project, and category.', 'Check READY evidence and approval draft.'] },
      { id: 'check-cash', view: 'CASHFLOW', title: 'Check collection and payment dates', description: 'Review upcoming cash movement and overdue items.', steps: ['Sort by planned date.', 'Review older aging buckets.', 'Record the outcome in the ledger.'] },
      { id: 'manage-budget', view: 'BUDGET', title: 'Compare budget and actual', description: 'Find overspending early.', steps: ['Choose the budget scope.', 'Compare actual, committed, and forecast.', 'Review WARN/BLOCK reasons.'] },
      { id: 'monthly-close', view: 'CLOSING', title: 'Run monthly close', description: 'Check and lock the month in order.', steps: ['Complete every checklist item.', 'Move through review and close.', 'Reopen only with a reason and audit.'] },
    ],
    glossary: [
      { term: 'Revenue', meaning: 'Money a customer owes the company' }, { term: 'Purchase', meaning: 'Money the company owes a supplier' }, { term: 'Receivable', meaning: 'Money not yet collected' }, { term: 'Payable', meaning: 'Money not yet paid' }, { term: 'VAT', meaning: 'Value-added tax' }, { term: 'Aging', meaning: 'A table grouping balances by overdue days' }, { term: 'Management profit', meaning: 'An operating estimate, not statutory profit' }, { term: 'Close', meaning: 'Check and lock one month of records' },
    ],
  },
};

export function getFinanceGuideContent(locale: FinanceGuideLocale): FinanceGuideContent {
  return CONTENT[locale];
}
