'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Archive, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { evaluateFinanceAccess } from '@/lib/accessControl';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useAuthStore } from '@/store/authStore';
import { useTranslationStore } from '@/store/translationStore';
import { useUiStore } from '@/store/uiStore';
import { assistantCopy, assistantPrompts } from './assistantCopy';
import { createAssistantPageContext, isSensitiveAssistantContext } from './assistantContext';
import { answerDemoQuestion } from './assistantDemoEngine';
import type { AssistantAnswer, AssistantLocale, AssistantMessage } from './assistantModel';
import { assistantId } from './assistantModel';
import { getAssistantRuntimeBoundary, runtimeBoundaryAnswer } from './assistantRuntime';
import { readAssistantTools, type AssistantToolSnapshot } from './assistantTools';
import { assistantThreadScopeKey, useAssistantStore } from './useAssistantStore';
import { AssistantComposer } from './AssistantComposer';
import { AssistantMascot } from './AssistantMascot';
import { AssistantMessageList } from './AssistantMessageList';
import { AssistantThreadHistory } from './AssistantThreadHistory';

const emptySnapshot = (companyId: 'CON_COST' | 'VIET_QS'): AssistantToolSnapshot => ({
  companyId, generatedAt: new Date().toISOString(), projects: [], tasks: [], schedules: [], approvals: [], boardPosts: [], customers: [], contacts: [], organization: [], finance: null, financeDenied: true, claims: [],
});

const isNavigationHelp = (question: string) => ['어디', '사용법', '메뉴', 'how', 'where', 'ở đâu', 'hướng dẫn'].some((term) => question.toLocaleLowerCase().includes(term));

interface AssistantConversationProps {
  variant: 'DRAWER' | 'FULL';
  view?: 'CHAT' | 'HISTORY' | 'HELP';
}

export function AssistantConversation({ variant, view = 'CHAT' }: AssistantConversationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useAuthStore((state) => state.currentUser);
  const brand = useUiStore((state) => state.brandWorkspace);
  const uiLanguage = useTranslationStore((state) => state.settings.uiLanguage);
  const threads = useAssistantStore((state) => state.threads);
  const allMessages = useAssistantStore((state) => state.messages);
  const activeThreadId = useAssistantStore((state) => state.activeThreadId);
  const activeThreadIdsByScope = useAssistantStore((state) => state.activeThreadIdsByScope);
  const settings = useAssistantStore((state) => state.settings);
  const feedback = useAssistantStore((state) => state.feedback);
  const mascotState = useAssistantStore((state) => state.mascotState);
  const createThread = useAssistantStore((state) => state.createThread);
  const selectThread = useAssistantStore((state) => state.selectThread);
  const addMessage = useAssistantStore((state) => state.addMessage);
  const setThreadTitle = useAssistantStore((state) => state.setThreadTitle);
  const setMascotState = useAssistantStore((state) => state.setMascotState);
  const updateAction = useAssistantStore((state) => state.updateAction);
  const setFeedback = useAssistantStore((state) => state.setFeedback);
  const archiveThread = useAssistantStore((state) => state.archiveThread);
  const deleteThread = useAssistantStore((state) => state.deleteThread);
  const [contextChoice, setContextChoice] = React.useState<{ key: string; enabled: boolean } | null>(null);
  const [threadMutationNotice, setThreadMutationNotice] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const locale: AssistantLocale = settings.answerLanguage === 'AUTO' ? uiLanguage : settings.answerLanguage;
  const copy = assistantCopy(locale);
  const mode = getRuntimeExecutionMode();
  const paramsString = searchParams.toString();
  const context = React.useMemo(() => createAssistantPageContext(pathname, new URLSearchParams(paramsString), brand), [brand, paramsString, pathname]);
  const contextKey = `${context.companyId}:${context.route}:${context.entityType || ''}:${context.entityId || ''}`;
  const contextEnabled = contextChoice?.key === contextKey ? contextChoice.enabled : !isSensitiveAssistantContext(context);
  const companyThreads = threads.filter((thread) => thread.companyId === brand && thread.ownerPersonnelId === currentUser?.id && thread.status !== 'DELETED');
  const scopeKey = assistantThreadScopeKey(brand, currentUser?.id || 'anonymous');
  const scopedThreadId = activeThreadIdsByScope[scopeKey] || (companyThreads.some((thread) => thread.id === activeThreadId) ? activeThreadId : null);
  const activeThread = companyThreads.find((thread) => thread.id === scopedThreadId) || null;
  const writableThread = activeThread?.status === 'ACTIVE' ? activeThread : null;
  const messages = activeThread ? allMessages.filter((message) => message.threadId === activeThread.id && message.companyId === brand) : [];
  const financeAllowed = currentUser ? evaluateFinanceAccess(currentUser).allowed : false;
  const prompts = assistantPrompts(locale, pathname, financeAllowed);

  const requestedThreadId = searchParams.get('threadId');
  const requestedThreadAvailable = Boolean(requestedThreadId && companyThreads.some((thread) => thread.id === requestedThreadId));
  React.useEffect(() => {
    if (requestedThreadAvailable && requestedThreadId) selectThread(requestedThreadId);
  }, [requestedThreadAvailable, requestedThreadId, selectThread]);
  React.useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [messages.length]);
  React.useEffect(() => {
    if (variant !== 'FULL' || !scopedThreadId || searchParams.get('threadId') === scopedThreadId) return;
    const next = new URLSearchParams(searchParams.toString());
    next.set('threadId', scopedThreadId);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }, [pathname, router, scopedThreadId, searchParams, variant]);

  if (!currentUser) return null;

  const startNew = () => selectThread(createThread(brand, currentUser.id, pathname));
  const submit = async (question: string) => {
    const threadId = writableThread?.id || createThread(brand, currentUser.id, pathname);
    const createdAt = new Date().toISOString();
    const userMessage: AssistantMessage = { id: assistantId('message'), companyId: brand, threadId, role: 'USER', content: question, status: 'COMPLETE', citations: [], actionCandidates: [], createdAt, runtimeMode: mode, answerKind: 'BOUNDARY_NOTICE' };
    addMessage(userMessage);
    if (!writableThread || !messages.length) setThreadTitle(threadId, question);
    setMascotState('THINKING');
    await Promise.resolve();
    const safeContext = contextEnabled ? context : null;
    const boundary = getAssistantRuntimeBoundary(locale, safeContext, mode);
    let result: AssistantAnswer;
    try {
      if (isNavigationHelp(question)) {
        result = answerDemoQuestion({ question, locale, snapshot: emptySnapshot(brand), context: safeContext, previousMessages: messages });
        result = { ...result, answerKind: 'SYSTEM_HELP', modelLabel: locale === 'vi' ? 'HƯỚNG DẪN HỆ THỐNG' : locale === 'en' ? 'SYSTEM HELP' : '시스템 사용안내' };
      } else if (boundary.kind === 'DEMO_RULE_ENGINE') {
        result = answerDemoQuestion({ question, locale, snapshot: readAssistantTools(currentUser, brand), context: safeContext, previousMessages: messages });
      } else if (boundary.kind === 'BLOCKED') {
        result = runtimeBoundaryAnswer(boundary);
      } else {
        result = runtimeBoundaryAnswer({ ...boundary, kind: 'BLOCKED', errorCode: 'BACKEND_REQUIRED', message: locale === 'vi' ? 'Endpoint hội thoại Backend chưa được kết nối.' : locale === 'en' ? 'The backend conversation endpoint is not connected.' : 'Backend 대화 Endpoint가 아직 연결되지 않았습니다.' });
      }
    } catch {
      result = { content: locale === 'vi' ? 'Không thể chuẩn bị câu trả lời. Vui lòng thử lại.' : locale === 'en' ? 'The answer could not be prepared. Try again.' : '답변을 준비하지 못했습니다. 다시 시도해 주세요.', citations: [], actionCandidates: [], answerKind: 'BOUNDARY_NOTICE', modelLabel: 'ASSISTANT ERROR', status: 'ERROR', errorCode: 'UNKNOWN_ERROR' };
    }
    addMessage({ id: assistantId('message'), companyId: brand, threadId, role: 'ASSISTANT', content: result.content, status: result.status, citations: result.citations, actionCandidates: result.actionCandidates, createdAt: new Date().toISOString(), runtimeMode: mode, modelLabel: result.modelLabel, answerKind: result.answerKind, errorCode: result.errorCode || null, correlationId: result.correlationId || null });
    setMascotState(result.status === 'BLOCKED' ? 'BLOCKED' : result.status === 'ERROR' ? 'ERROR' : 'ANSWER_READY');
  };

  const history = <AssistantThreadHistory threads={companyThreads} activeThreadId={scopedThreadId} locale={locale} emptyText={copy.emptyHistory} onSelect={selectThread} />;

  const help = <div className="space-y-3"><div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4"><h3 className="font-black text-indigo-950">{copy.help}</h3><p className="mt-2 text-xs font-semibold leading-5 text-indigo-900">{locale === 'vi' ? 'Hỏi về dự án, lịch, phê duyệt, khách hàng và vị trí menu. Nguồn chỉ xuất hiện sau khi kiểm tra quyền.' : locale === 'en' ? 'Ask about projects, schedules, approvals, customers, and menu locations. Sources appear only after permission checks.' : '프로젝트, 일정, 결재, 고객, 메뉴 위치를 질문하세요. 권한 확인을 통과한 근거만 표시됩니다.'}</p></div><div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950"><AlertTriangle className="mb-2 h-5 w-5" />{locale === 'vi' ? 'Bản Demo không phải LLM bên ngoài. Hành động luôn cần xác nhận.' : locale === 'en' ? 'Demo is not an external LLM. Actions always require confirmation.' : 'Demo는 외부 LLM이 아니며, 모든 업무 행동은 사용자의 확인이 필요합니다.'}</div></div>;

  const handleThreadMutation = (kind: 'ARCHIVE' | 'DELETE') => {
    if (!activeThread) return;
    const succeeded = kind === 'ARCHIVE' ? archiveThread(activeThread.id) : deleteThread(activeThread.id);
    if (succeeded) {
      setThreadMutationNotice(null);
      return;
    }
    setThreadMutationNotice(locale === 'vi' ? 'Cần Backend để lưu thay đổi hội thoại ở chế độ này.' : locale === 'en' ? 'The backend is required to persist conversation changes in this runtime mode.' : '현재 실행 모드에서 대화 변경을 저장하려면 Backend 연결이 필요합니다.');
  };

  return (
    <div className={`flex min-h-0 flex-1 ${variant === 'FULL' ? 'gap-4' : ''}`}>
      {variant === 'FULL' && <aside className="hidden w-[248px] shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 lg:block"><button type="button" onClick={startNew} className="mb-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 text-xs font-black text-white hover:bg-sky-700 focus-visible:ring-2 focus-visible:ring-sky-500"><Plus className="h-4 w-4" />{copy.newThread}</button>{history}</aside>}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f9fc] shadow-[0_16px_36px_rgba(15,23,42,.08)]">
        <div ref={scrollRef} className="cc-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
          {view === 'HISTORY' ? history : view === 'HELP' ? help : !messages.length ? <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center text-center"><AssistantMascot brand={brand} state="GREETING" size="lg" motion={settings.mascotMotion} /><p className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-[var(--color-primary)]">{copy.demo}</p><h2 className="mt-2 text-2xl font-black text-slate-950">{copy.greeting}</h2><p className="mt-3 max-w-lg text-sm font-semibold leading-6 text-slate-600">{copy.greetingDetail}</p><div className="mt-6 flex flex-wrap justify-center gap-2">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => submit(prompt)} className="min-h-10 rounded-full border border-slate-300 bg-white px-4 text-xs font-black text-slate-700 shadow-sm transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">{prompt}</button>)}</div></div> : <AssistantMessageList messages={messages} locale={locale} brand={brand} feedback={feedback} onFeedback={setFeedback} onAction={(messageId, actionId, status) => updateAction(messageId, actionId, status)} />}
          {mascotState === 'THINKING' && <div className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-500"><AssistantMascot brand={brand} state="THINKING" size="sm" /><span>{copy.thinking}</span></div>}
        </div>
        {view === 'CHAT' && <AssistantComposer locale={locale} context={context} contextEnabled={contextEnabled} busy={mascotState === 'THINKING'} onContextChange={(enabled) => setContextChoice({ key: contextKey, enabled })} onSubmit={submit} />}
      </section>
      {variant === 'FULL' && <aside className="hidden w-[270px] shrink-0 space-y-3 xl:block"><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">{copy.runtime}</p><div className="mt-3 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-600" /><strong className="text-sm">{mode}</strong></div><p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{copy.demoDetail}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[.16em] text-slate-500">Context</p><p className="mt-2 break-all text-xs font-black text-slate-900">{context.label || context.route}</p><p className="mt-1 text-[10px] font-semibold text-slate-500">{context.sensitivity}</p></div>{activeThread && <div className="space-y-2">{activeThread.status === 'ARCHIVED' && <p className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-[10px] font-bold text-slate-600">{locale === 'vi' ? 'Đang xem cuộc trò chuyện đã lưu trữ. Câu hỏi mới sẽ bắt đầu một cuộc trò chuyện mới.' : locale === 'en' ? 'Viewing an archived conversation. A new question starts a new chat.' : '보관된 대화를 읽는 중입니다. 새 질문은 새 대화에서 시작됩니다.'}</p>}<div className="flex gap-2">{activeThread.status === 'ACTIVE' && <button type="button" onClick={() => handleThreadMutation('ARCHIVE')} className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 text-xs font-black hover:bg-slate-100"><Archive className="h-4 w-4" />{copy.archive}</button>}<button type="button" onClick={() => handleThreadMutation('DELETE')} className="flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 text-xs font-black text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" />{copy.remove}</button></div>{threadMutationNotice && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-[10px] font-bold leading-4 text-amber-900">{threadMutationNotice}</p>}</div>}<div className="rounded-2xl border border-violet-200 bg-violet-50 p-4"><Sparkles className="h-5 w-5 text-violet-700" /><p className="mt-2 text-xs font-black text-violet-950">{copy.meeting}</p><p className="mt-1 text-[11px] font-semibold leading-5 text-violet-800">{locale === 'vi' ? 'Công cụ riêng giữ nguyên quy trình STT và kiểm duyệt.' : locale === 'en' ? 'The separate tool preserves STT and human review.' : '별도 도구에서 STT와 사람 검수 흐름을 유지합니다.'}</p></div></aside>}
    </div>
  );
}
