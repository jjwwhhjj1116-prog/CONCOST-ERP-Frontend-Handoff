import type { AssistantActionCandidate, AssistantAnswer, AssistantCitation, AssistantLocale, AssistantMessage, AssistantPageContext } from './assistantModel';
import { assistantId } from './assistantModel';
import type { AssistantToolSnapshot } from './assistantTools';

interface DemoQuestionInput {
  question: string;
  locale: AssistantLocale;
  snapshot: AssistantToolSnapshot;
  context?: AssistantPageContext | null;
  previousMessages?: AssistantMessage[];
}

const lower = (value: string) => value.trim().toLocaleLowerCase();
const has = (value: string, terms: string[]) => terms.some((term) => value.includes(term));
const dateOnly = (value: string) => value.slice(0, 10);
const formatMoney = (value: number, locale: AssistantLocale) => new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : locale === 'en' ? 'en-US' : 'ko-KR', { maximumFractionDigits: 0 }).format(value);

const cite = (sourceType: AssistantCitation['sourceType'], sourceId: string, label: string, href: string, excerpt?: string): AssistantCitation => ({
  id: assistantId('citation'), sourceType, sourceId, label, href, excerpt: excerpt || null,
});

const action = (kind: AssistantActionCandidate['kind'], label: string, href: string, payload: Record<string, string | number | boolean | null> = {}): AssistantActionCandidate => ({
  id: assistantId('action'), kind, label, payload: { ...payload, href }, status: 'PROPOSED',
});

const answer = (content: string, citations: AssistantCitation[] = [], actionCandidates: AssistantActionCandidate[] = [], resolvedEntity?: AssistantAnswer['resolvedEntity']): AssistantAnswer => ({
  content,
  citations,
  actionCandidates,
  answerKind: 'DEMO_RULE_ENGINE',
  modelLabel: 'DEMO RULE ENGINE',
  status: 'COMPLETE',
  resolvedEntity,
});

const text = (locale: AssistantLocale, ko: string, vi: string, en: string) => locale === 'vi' ? vi : locale === 'en' ? en : ko;

const resolveProject = (question: string, snapshot: AssistantToolSnapshot, previousMessages: AssistantMessage[] = []) => {
  const normalized = lower(question);
  const direct = snapshot.projects.find((project) =>
    [project.projectNo, project.title, project.id].filter(Boolean).some((value) => normalized.includes(lower(value)))
  );
  if (direct) return direct;
  const priorProject = [...previousMessages].reverse().flatMap((message) => message.citations).find((citation) => citation.sourceType === 'PROJECT');
  if (priorProject) return snapshot.projects.find((project) => project.id === priorProject.sourceId);
  return undefined;
};

export function answerDemoQuestion({ question, locale, snapshot, context, previousMessages = [] }: DemoQuestionInput): AssistantAnswer {
  const normalized = lower(question);
  const today = new Date().toISOString().slice(0, 10);
  const contextProject = context?.entityType === 'PROJECT' ? snapshot.projects.find((project) => project.id === context.entityId) : undefined;
  const project = contextProject || resolveProject(question, snapshot, previousMessages);

  if (has(normalized, ['할 일 만들어', '업무 만들어', 'create task', 'tạo công việc'])) {
    return answer(
      text(locale, '할 일 초안을 준비했습니다. 내용을 확인한 뒤 할 일 화면에서 저장해 주세요.', 'Tôi đã chuẩn bị bản nháp công việc. Hãy kiểm tra rồi lưu trong màn hình công việc.', 'I prepared a task draft. Review it before saving in Tasks.'),
      project ? [cite('PROJECT', project.id, `${project.projectNo} ${project.title}`, `/projects?projectId=${encodeURIComponent(project.id)}&view=PART`)] : [],
      [action('CREATE_TASK_DRAFT', text(locale, '할 일 초안 열기', 'Mở bản nháp công việc', 'Open task draft'), `/tasks/my?create=1${project ? `&projectId=${encodeURIComponent(project.id)}` : ''}`, { projectId: project?.id || '' })],
      project ? { type: 'PROJECT', id: project.id } : null,
    );
  }
  if (has(normalized, ['일정 등록', '일정 만들어', 'create schedule', 'tạo lịch'])) {
    return answer(text(locale, '일정 초안을 준비했습니다. 실제 등록은 일정 화면에서 확인 후 진행됩니다.', 'Tôi đã chuẩn bị bản nháp lịch. Việc đăng ký được xác nhận trong màn hình lịch.', 'I prepared a calendar draft for review.'), [], [action('CREATE_CALENDAR_DRAFT', text(locale, '일정 초안 열기', 'Mở bản nháp lịch', 'Open calendar draft'), '/calendar?create=1')]);
  }
  if (has(normalized, ['메일 작성', '메일 초안', 'write mail', 'soạn thư'])) {
    return answer(text(locale, '메일 초안을 준비했습니다. AI 도우미는 발송하지 않으며 메일 화면에서 확인해야 합니다.', 'Tôi đã chuẩn bị bản nháp thư. Trợ lý không tự gửi thư.', 'I prepared a mail draft. The assistant never sends it automatically.'), [], [action('CREATE_MAIL_DRAFT', text(locale, '메일 초안 열기', 'Mở bản nháp thư', 'Open mail draft'), '/mail?compose=1')]);
  }
  if (has(normalized, ['결재 초안', '결재 올려', 'approval draft', 'bản nháp phê duyệt'])) {
    return answer(text(locale, '전자결재 초안을 준비했습니다. 결재선과 첨부를 확인한 뒤 직접 상신해 주세요.', 'Tôi đã chuẩn bị bản nháp phê duyệt. Hãy kiểm tra tuyến phê duyệt trước khi gửi.', 'I prepared an approval draft. Review the approval line before submission.'), [], [action('CREATE_APPROVAL_DRAFT', text(locale, '결재 초안 열기', 'Mở bản nháp phê duyệt', 'Open approval draft'), '/approvals?compose=1')]);
  }
  if (has(normalized, ['회의록', '녹취', 'meeting notes', 'biên bản'])) {
    return answer(text(locale, '회의록·녹취 정리 도구는 별도 화면에서 사용할 수 있습니다.', 'Công cụ biên bản và ghi âm nằm ở màn hình riêng.', 'The meeting notes and audio tool is available on its own screen.'), [], [action('START_MEETING_NOTE_TOOL', text(locale, '회의록 도구 열기', 'Mở công cụ biên bản', 'Open meeting tool'), `/ai-assistant/tools/meeting-notes${project ? `?projectId=${encodeURIComponent(project.id)}` : ''}`)]);
  }

  if (has(normalized, ['할 일', '업무', 'task', 'công việc'])) {
    const open = snapshot.tasks.filter((task) => !['DONE', 'CANCELLED'].includes(task.status)).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999')).slice(0, 5);
    if (!open.length) return answer(text(locale, '현재 권한 범위에서 확인할 미완료 할 일이 없습니다.', 'Không có công việc chưa hoàn thành trong phạm vi quyền hiện tại.', 'There are no open tasks in your permission scope.'));
    return answer(text(locale, `미완료 할 일 ${open.length}건을 찾았습니다.`, `Đã tìm thấy ${open.length} công việc chưa hoàn thành.`, `I found ${open.length} open tasks.`), open.map((item) => cite('TASK', item.id, item.title, item.href, `${item.status}${item.dueDate ? ` · ${item.dueDate}` : ''}`)));
  }

  if (has(normalized, ['일정', '스케줄', 'schedule', 'calendar', 'lịch'])) {
    const items = snapshot.schedules.filter((item) => dateOnly(item.endsAt) >= today).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 5);
    if (!items.length) return answer(text(locale, '현재 권한 범위에서 예정된 일정이 없습니다.', 'Không có lịch sắp tới trong phạm vi quyền hiện tại.', 'There are no upcoming schedules in your permission scope.'));
    return answer(text(locale, `예정된 일정 ${items.length}건입니다.`, `Có ${items.length} lịch sắp tới.`, `Here are ${items.length} upcoming schedules.`), items.map((item) => cite('SCHEDULE', item.id, item.title, item.href, `${dateOnly(item.startsAt)} · ${dateOnly(item.endsAt)}`)));
  }

  if (has(normalized, ['결재 대기', '대기 결재', 'pending approval', 'chờ phê duyệt'])) {
    const pending = snapshot.approvals.filter((item) => ['PENDING', 'PM_REVIEWING', 'MANAGER_REVIEWING'].includes(item.status)).slice(0, 5);
    if (!pending.length) return answer(text(locale, '현재 권한 범위에서 대기 중인 결재가 없습니다.', 'Không có phê duyệt đang chờ trong phạm vi quyền hiện tại.', 'There are no pending approvals in your permission scope.'));
    return answer(text(locale, `대기 중인 결재 ${pending.length}건입니다.`, `Có ${pending.length} phê duyệt đang chờ.`, `There are ${pending.length} pending approvals.`), pending.map((item) => cite('APPROVAL', item.id, item.title, item.href, item.status)));
  }

  if (has(normalized, ['공지', '게시판', 'notice', 'board', 'thông báo'])) {
    const posts = [...snapshot.boardPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 5);
    if (!posts.length) return answer(text(locale, '열람 가능한 최근 게시글이 없습니다.', 'Không có bài đăng gần đây mà bạn có thể xem.', 'There are no recent board posts you can access.'));
    return answer(text(locale, `열람 가능한 최근 게시글 ${posts.length}건입니다.`, `Có ${posts.length} bài đăng gần đây.`, `I found ${posts.length} recent board posts.`), posts.map((item) => cite('BOARD_POST', item.id, item.title, item.href, item.boardName)));
  }

  if (has(normalized, ['고객', '거래처', 'customer', 'khách hàng'])) {
    const customer = snapshot.customers.find((item) => normalized.includes(lower(item.name))) || snapshot.customers[0];
    if (!customer) return answer(text(locale, '현재 회사 범위에서 조회할 고객이 없습니다.', 'Không có khách hàng trong phạm vi công ty hiện tại.', 'There are no customers in the current company scope.'));
    const related = snapshot.projects.filter((item) => customer.projectIds.includes(item.id));
    return answer(text(locale, `${customer.name}의 담당자는 ${customer.ownerName}이며, 연결 프로젝트는 ${related.length}건입니다.`, `Người phụ trách ${customer.name} là ${customer.ownerName}; có ${related.length} dự án liên kết.`, `${customer.name} is owned by ${customer.ownerName} and has ${related.length} linked projects.`), [cite('CUSTOMER', customer.id, customer.name, customer.href, customer.status), ...related.slice(0, 4).map((item) => cite('PROJECT', item.id, `${item.projectNo} ${item.title}`, `/projects?projectId=${encodeURIComponent(item.id)}&view=PART`, item.status))], [], { type: 'CUSTOMER', id: customer.id });
  }

  if (has(normalized, ['조직', '직원', '부서', 'organization', 'employee', 'tổ chức', 'nhân viên'])) {
    const matches = snapshot.organization.filter((person) => [person.name, person.departmentName, person.jobTitle].some((value) => normalized.includes(lower(value)))).slice(0, 6);
    const people = matches.length ? matches : snapshot.organization.slice(0, 6);
    if (!people.length) return answer(text(locale, '현재 회사 범위에서 조회할 조직 구성원이 없습니다.', 'Không có nhân sự trong phạm vi công ty hiện tại.', 'There are no organization members in the current company scope.'));
    return answer(text(locale, `조직 구성원 ${people.length}명을 찾았습니다.`, `Đã tìm thấy ${people.length} nhân sự.`, `I found ${people.length} organization members.`), people.map((person) => cite('ORGANIZATION', person.id, person.name, `/organization?personnelId=${encodeURIComponent(person.id)}`, `${person.departmentName} · ${person.jobTitle}`)));
  }

  if (has(normalized, ['미수', '미지급', '자금', '재무', 'finance', 'receivable', 'tài chính', 'phải thu'])) {
    if (snapshot.financeDenied || !snapshot.finance) return { ...answer(text(locale, '재무 정보는 현재 권한으로 조회할 수 없습니다.', 'Bạn không có quyền xem dữ liệu tài chính.', 'You are not authorized to retrieve finance data.')), status: 'BLOCKED', errorCode: 'FORBIDDEN', answerKind: 'BOUNDARY_NOTICE', modelLabel: 'PERMISSION GUARD' };
    const f = snapshot.finance;
    return answer(text(locale, `미수 ${formatMoney(f.receivable, locale)}, 미지급 ${formatMoney(f.payable, locale)}, 계획자금 ${formatMoney(f.plannedFunds, locale)}입니다.`, `Phải thu ${formatMoney(f.receivable, locale)}, phải trả ${formatMoney(f.payable, locale)}, dòng tiền kế hoạch ${formatMoney(f.plannedFunds, locale)}.`, `Receivables are ${formatMoney(f.receivable, locale)}, payables ${formatMoney(f.payable, locale)}, and planned funds ${formatMoney(f.plannedFunds, locale)}.`), [cite('FINANCE', snapshot.companyId, text(locale, '재무 대시보드', 'Bảng điều khiển tài chính', 'Finance dashboard'), f.href, text(locale, `알림 ${f.alerts}건`, `${f.alerts} cảnh báo`, `${f.alerts} alerts`))]);
  }

  if (has(normalized, ['클레임', '쟁점', '보고서', 'claim', 'issue', 'khiếu nại'])) {
    const claim = snapshot.claims.find((item) => normalized.includes(lower(item.title)) || normalized.includes(lower(item.id))) || snapshot.claims[0];
    if (!claim) return answer(text(locale, '현재 권한 범위에서 조회할 클레임 기록이 없습니다.', 'Không có hồ sơ claim trong phạm vi quyền hiện tại.', 'There are no claim records in your permission scope.'));
    return answer(text(locale, `${claim.title}: 회의 ${claim.meetings}건, 쟁점 ${claim.issues}건, 보고서 상태 ${claim.reportStatus}입니다.`, `${claim.title}: ${claim.meetings} cuộc họp, ${claim.issues} vấn đề, trạng thái báo cáo ${claim.reportStatus}.`, `${claim.title} has ${claim.meetings} meetings, ${claim.issues} issues, and report status ${claim.reportStatus}.`), [cite('CLAIM', claim.id, claim.title, claim.href, claim.reportStatus)], [], { type: 'CLAIM', id: claim.id });
  }

  if (project || has(normalized, ['프로젝트', 'project', 'dự án'])) {
    const target = project || snapshot.projects[0];
    if (!target) return answer(text(locale, '현재 권한 범위에서 조회할 프로젝트가 없습니다.', 'Không có dự án trong phạm vi quyền hiện tại.', 'There are no projects in your permission scope.'));
    return answer(text(locale, `${target.projectNo} ${target.title}은(는) ${target.status} 상태이며 PM은 ${target.pmName}, 담당부서는 ${target.unitNames.join(', ') || '미지정'}입니다.`, `${target.projectNo} ${target.title} đang ở trạng thái ${target.status}; PM là ${target.pmName}; đơn vị: ${target.unitNames.join(', ') || 'chưa chỉ định'}.`, `${target.projectNo} ${target.title} is ${target.status}; PM: ${target.pmName}; units: ${target.unitNames.join(', ') || 'unassigned'}.`), [cite('PROJECT', target.id, `${target.projectNo} ${target.title}`, `/projects?projectId=${encodeURIComponent(target.id)}&view=PART`, `${target.status}${target.dueDate ? ` · ${target.dueDate}` : ''}`)], [], { type: 'PROJECT', id: target.id });
  }

  if (has(normalized, ['어디', '사용법', '메뉴', 'how', 'where', 'ở đâu', 'hướng dẫn'])) {
    const routes = [
      { terms: ['명함', 'business card', 'danh thiếp'], label: text(locale, '명함 자동등록', 'Đăng ký danh thiếp', 'Business card registration'), href: '/sales/business-cards' },
      { terms: ['견적', 'estimate', 'báo giá'], label: text(locale, '견적 의뢰관리', 'Yêu cầu báo giá', 'Estimate requests'), href: '/projects/estimate-requests' },
      { terms: ['게시', 'board', 'bảng tin'], label: text(locale, '게시판', 'Bảng tin', 'Board'), href: '/board' },
      { terms: ['조직', 'organization', 'tổ chức'], label: text(locale, '조직도', 'Sơ đồ tổ chức', 'Organization'), href: '/organization' },
      { terms: ['회의', 'meeting', 'cuộc họp'], label: text(locale, '회의록·녹취 정리', 'Biên bản và ghi âm', 'Meeting notes'), href: '/ai-assistant/tools/meeting-notes' },
    ];
    const match = routes.find((route) => has(normalized, route.terms)) || routes[0];
    return answer(text(locale, `${match.label} 화면으로 이동할 수 있습니다.`, `Bạn có thể mở màn hình ${match.label}.`, `You can open ${match.label}.`), [cite('SYSTEM_HELP', match.href, match.label, match.href, text(locale, '시스템 사용안내', 'Hướng dẫn hệ thống', 'System help'))]);
  }

  return answer(text(locale, '이 질문은 DEMO 규칙 엔진이 아직 지원하지 않습니다. 프로젝트, 할 일, 일정, 결재, 게시판, 고객, 조직, 재무, 클레임 또는 메뉴 위치를 질문해 주세요.', 'Công cụ quy tắc DEMO chưa hỗ trợ câu hỏi này. Hãy hỏi về dự án, công việc, lịch, phê duyệt, bảng tin, khách hàng, tổ chức, tài chính, claim hoặc vị trí menu.', 'The DEMO rule engine does not support that question yet. Ask about projects, tasks, schedules, approvals, boards, customers, organization, finance, claims, or navigation.'));
}
