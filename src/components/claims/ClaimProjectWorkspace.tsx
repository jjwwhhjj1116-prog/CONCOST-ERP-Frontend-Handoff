'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  FileClock,
  FileSearch,
  FileText,
  FolderLock,
  Gavel,
  History,
  ListChecks,
  MessageSquareText,
  PackageCheck,
  Plus,
  Scale,
  ShieldCheck,
} from 'lucide-react';

import { RuntimeCapabilityPanel } from '@/components/handoff/RuntimeCapabilityPanel';
import { HandoffLanguageToggle } from '@/components/handoff/HandoffLanguageToggle';
import { useHandoffLocale } from '@/components/handoff/useHandoffLocale';
import { ActionButtonGroup, SemanticActionButton } from '@/components/ui/SemanticActionButton';
import {
  CLAIM_FOLDER_CATALOG,
  type ClaimClassification,
  type ClaimFolderCode,
  type ClaimProjectKind,
} from '@/lib/claimOperations';
import { executeFrontendMutation, getFrontendModuleBoundary } from '@/lib/frontendDataSource';
import { useApprovalStore } from '@/store/approvalStore';
import { useAuthStore } from '@/store/authStore';
import { useClaimOperationsStore } from '@/store/claimOperationsStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { Project } from '@/types/models';

type ClaimTab = 'OVERVIEW' | 'EVIDENCE' | 'MEETINGS' | 'TIMELINE' | 'ISSUES' | 'WORKPAPERS' | 'REPORTS' | 'APPROVAL' | 'DELIVERY';

const inputClass = 'min-h-11 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-text-main)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';
const panelClass = 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--cc-shadow-1)] sm:p-5';

const TAB_ICONS: Record<ClaimTab, typeof FileText> = {
  OVERVIEW: ShieldCheck,
  EVIDENCE: FileSearch,
  MEETINGS: MessageSquareText,
  TIMELINE: History,
  ISSUES: Scale,
  WORKPAPERS: ClipboardList,
  REPORTS: FileText,
  APPROVAL: Gavel,
  DELIVERY: PackageCheck,
};

export function ClaimProjectWorkspace({ project }: { project: Project }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const { locale, setLocale } = useHandoffLocale();
  const records = useClaimOperationsStore((state) => state.records);
  const ensureRecord = useClaimOperationsStore((state) => state.ensureRecord);
  const setKind = useClaimOperationsStore((state) => state.setKind);
  const addEvidence = useClaimOperationsStore((state) => state.addEvidence);
  const addMeeting = useClaimOperationsStore((state) => state.addMeeting);
  const addIssue = useClaimOperationsStore((state) => state.addIssue);
  const addWorkpaper = useClaimOperationsStore((state) => state.addWorkpaper);
  const addReport = useClaimOperationsStore((state) => state.addReport);
  const createReportRevision = useClaimOperationsStore((state) => state.createReportRevision);
  const transitionReport = useClaimOperationsStore((state) => state.transitionReport);
  const addDelivery = useClaimOperationsStore((state) => state.addDelivery);
  const approvalRequests = useApprovalStore((state) => state.requests);
  const saveApprovalDraft = useApprovalStore((state) => state.saveDraft);
  const notify = useNotificationStore((state) => state.addNotification);
  const record = records.find((item) => item.projectId === project.id);
  const [tab, setTab] = useState<ClaimTab>('OVERVIEW');
  const [notice, setNotice] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [folderCode, setFolderCode] = useState<ClaimFolderCode>('04');
  const [classification, setClassification] = useState<ClaimClassification>('INTERNAL');
  const [linkedIssueId, setLinkedIssueId] = useState('');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [heldAt, setHeldAt] = useState(new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState('');
  const [participants, setParticipants] = useState('');
  const [roughNotes, setRoughNotes] = useState('');
  const [audioName, setAudioName] = useState('');
  const [audioConsent, setAudioConsent] = useState(false);
  const [legalBasis, setLegalBasis] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [workpaperTitle, setWorkpaperTitle] = useState('');
  const [workpaperDescription, setWorkpaperDescription] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [revisionReasons, setRevisionReasons] = useState<Record<string, string>>({});
  const [deliveryRecipient, setDeliveryRecipient] = useState('');
  const boundary = getFrontendModuleBoundary('PROJECT', {
    locale,
    adapterReady: process.env.NEXT_PUBLIC_PROJECT_ADAPTER_READY === 'true',
    operations: ['getClaimProject', 'createClaimEvidence', 'createClaimMeeting', 'reviewAiMeetingMinutes', 'createClaimIssue', 'createClaimWorkpaper', 'createClaimReport', 'submitClaimReportApproval', 'deliverClaimReport'],
  });
  const text = (ko: string, vi: string, en: string) => locale === 'vi' ? vi : locale === 'en' ? en : ko;

  useEffect(() => {
    if (currentUser && !record) ensureRecord(project, currentUser.id);
  }, [currentUser, ensureRecord, project, record]);

  const scopedApprovals = useMemo(() => approvalRequests.filter((request) =>
    record && request.projectId === record.projectId && request.claimId === record.claimId,
  ), [approvalRequests, record]);

  useEffect(() => {
    if (!record || !currentUser) return;
    record.reports.forEach((report) => {
      const approval = report.approvalRequestId ? scopedApprovals.find((request) => request.id === report.approvalRequestId) : undefined;
      if (report.status === 'APPROVAL_PENDING' && approval?.status === 'APPROVED') {
        transitionReport(record.claimId, report.id, 'APPROVED', currentUser.id, 'Electronic approval completed');
      }
    });
  }, [currentUser, record, scopedApprovals, transitionReport]);

  if (!currentUser || !record) return <p className="py-10 text-center text-sm font-bold text-[var(--color-text-sub)]">{text('클레임 워크스페이스를 준비하고 있습니다.', 'Đang chuẩn bị không gian Claim.', 'Preparing the Claim workspace.')}</p>;

  const run = async (work: () => void, success: string) => {
    setNotice('');
    const result = await executeFrontendMutation(boundary, { simulate: () => true });
    if (result.kind === 'BLOCKED') {
      setNotice(result.message);
      return false;
    }
    work();
    setNotice(success);
    return true;
  };

  const tabs: Array<[ClaimTab, string]> = [
    ['OVERVIEW', text('개요', 'Tổng quan', 'Overview')],
    ['EVIDENCE', text('자료·증거', 'Tài liệu · Chứng cứ', 'Evidence')],
    ['MEETINGS', text('회의록', 'Biên bản họp', 'Minutes')],
    ['TIMELINE', text('타임라인', 'Dòng thời gian', 'Timeline')],
    ['ISSUES', text('쟁점', 'Vấn đề', 'Issues')],
    ['WORKPAPERS', 'Workpaper'],
    ['REPORTS', text('보고서', 'Báo cáo', 'Reports')],
    ['APPROVAL', text('전자결재', 'Phê duyệt', 'Approval')],
    ['DELIVERY', text('납품·이력', 'Bàn giao · Lịch sử', 'Delivery')],
  ];

  const createEvidence = () => void run(() => {
    addEvidence(record.claimId, {
      folderCode,
      fileName: evidenceName.trim(),
      fileReferenceId: `demo-ready-${Date.now()}`,
      state: 'READY',
      classification,
      issueId: linkedIssueId || undefined,
      createdBy: currentUser.id,
    }, currentUser.id);
    setEvidenceName('');
  }, text('READY 증거 Metadata를 등록했습니다.', 'Đã đăng ký metadata chứng cứ READY.', 'READY evidence metadata registered.'));

  const createMeeting = () => void run(() => {
    const meetingId = addMeeting(record.claimId, {
      title: meetingTitle.trim(),
      heldAt: new Date(heldAt).toISOString(),
      location: location.trim(),
      participants: participants.split(',').map((value) => value.trim()).filter(Boolean),
      roughNotes: roughNotes.trim(),
      audioName: audioName.trim() || undefined,
      audioConsent,
      legalBasis: legalBasis.trim() || undefined,
      classification,
      evidenceIds: [],
      issueIds: linkedIssueId ? [linkedIssueId] : [],
      createdBy: currentUser.id,
    }, currentUser.id);
    setMeetingTitle(''); setLocation(''); setParticipants(''); setRoughNotes(''); setAudioName(''); setAudioConsent(false); setLegalBasis('');
    setNotice(`${text('회의록 Draft를 만들었습니다.', 'Đã tạo bản nháp biên bản.', 'Meeting draft created.')} ${meetingId}`);
  }, text('회의록 Draft를 만들었습니다.', 'Đã tạo bản nháp biên bản.', 'Meeting draft created.'));

  const createApprovalDraft = (reportId: string) => {
    const report = record.reports.find((item) => item.id === reportId);
    if (!report || report.status !== 'REVIEW' || report.fileState !== 'READY') return;
    void run(() => {
      const requestId = saveApprovalDraft({
        type: 'GENERAL_APPROVAL',
        projectId: record.projectId,
        claimId: record.claimId,
        reportId: report.id,
        reportVersionId: report.reportVersionId,
        requestedBy: currentUser.id,
        title: `${report.title} v${report.version}`,
        reason: text('클레임 보고서 검토 및 확정 요청', 'Yêu cầu duyệt báo cáo Claim', 'Claim report review and approval'),
        companyId: currentUser.companyId,
        departmentId: currentUser.departmentId,
        formId: 'GENERAL_APPROVAL',
        retentionPeriod: '10Y',
        securityLevel: 'CONFIDENTIAL',
        approvalLine: [],
        attachments: [{ id: `approval-file-${report.reportVersionId}`, fileName: `${report.title}-v${report.version}.pdf`, contentType: 'application/pdf', size: 1, state: 'READY', fileReferenceId: report.fileReferenceId }],
        revision: 1,
      });
      transitionReport(record.claimId, report.id, 'APPROVAL_PENDING', currentUser.id, 'Approval draft created', requestId);
      notify({ userId: currentUser.id, type: 'CLAIM_REPORT_APPROVAL_DRAFT', title: text('보고서 결재 초안', 'Bản nháp phê duyệt báo cáo', 'Report approval draft'), message: report.title, priority: 'NORMAL', relatedProjectId: record.projectId, relatedApprovalId: requestId, groupId: `claim-report-${report.id}` });
    }, text('결재 초안을 만들었습니다. 결재선은 전자결재에서 선택하세요.', 'Đã tạo bản nháp. Chọn tuyến trong Phê duyệt.', 'Approval draft created. Select its line in Approvals.'));
  };

  return (
    <div className="space-y-4" data-claim-project-workspace data-project-id={record.projectId} data-claim-id={record.claimId}>
      <section className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-white to-blue-50 p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black tracking-[.16em] text-teal-800"><ShieldCheck className="h-4 w-4" />CLAIM CENTER OPERATION</p>
            <h3 className="mt-2 text-xl font-black text-[var(--color-text-main)]">{project.title}</h3>
            <p className="mt-2 break-all font-mono text-[11px] font-bold text-[var(--color-text-sub)]">projectId: {record.projectId} · claimId: {record.claimId}</p>
          </div>
          <div className="flex min-w-56 flex-col gap-3">
            <HandoffLanguageToggle locale={locale} onChange={setLocale} />
            <label className="text-xs font-black text-[var(--color-text-sub)]">
              {text('클레임 유형', 'Loại Claim', 'Claim type')}
              <select value={record.kind} onChange={(event) => void run(() => setKind(record.claimId, event.target.value as ClaimProjectKind, currentUser.id), text('유형을 변경했습니다.', 'Đã đổi loại.', 'Type updated.'))} className={`${inputClass} mt-1.5`}>
                <option value="INTERNAL_CLAIM">INTERNAL_CLAIM</option>
                <option value="CONSULTING_PROJECT">CONSULTING_PROJECT</option>
              </select>
            </label>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {[
            [text('증거', 'Chứng cứ', 'Evidence'), record.evidences.length],
            [text('회의록', 'Biên bản', 'Minutes'), record.meetings.length],
            [text('쟁점', 'Vấn đề', 'Issues'), record.issues.length],
            [text('보고서', 'Báo cáo', 'Reports'), record.reports.length],
            [text('Revision', 'Revision', 'Revision'), record.revision],
          ].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white bg-white/80 p-3"><span className="text-[10px] font-black text-[var(--color-text-sub)]">{label}</span><strong className="mt-1 block text-lg font-black">{value}</strong></div>)}
        </div>
      </section>

      <RuntimeCapabilityPanel boundary={boundary} />
      {notice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-900">{notice}</p>}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1" role="tablist">
        {tabs.map(([value, label]) => {
          const Icon = TAB_ICONS[value];
          return <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border-l-4 px-3 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${tab === value ? 'border-l-[var(--color-primary)] bg-orange-50 text-orange-800 shadow-sm' : 'border-l-transparent text-[var(--color-text-sub)] hover:bg-[var(--cc-surface-2)] hover:text-[var(--color-text-main)]'}`}><Icon className="h-4 w-4" />{label}</button>;
        })}
      </div>

      {tab === 'OVERVIEW' && <section className="grid gap-4 lg:grid-cols-3">
        <QuickLink href={`/drive?folder=CLAIM&projectId=${encodeURIComponent(record.projectId)}&claimId=${encodeURIComponent(record.claimId)}`} icon={FolderLock} title={text('클레임 Drive', 'Drive Claim', 'Claim Drive')} description={text('같은 Project·Claim 컨텍스트로 자료와 증거를 엽니다.', 'Mở tài liệu theo cùng Project và Claim.', 'Open evidence with the same Project and Claim context.')} />
        <QuickLink href={`/ai-assistant/tools/meeting-notes?projectId=${encodeURIComponent(record.projectId)}&claimId=${encodeURIComponent(record.claimId)}`} icon={Bot} title={text('AI 회의록', 'Biên bản AI', 'AI Minutes')} description={text('회의 Draft를 선택해 AI 정리와 사람 검수를 수행합니다.', 'Sắp xếp bằng AI và kiểm duyệt.', 'Structure a meeting draft and review it.')} />
        <QuickLink href={`/approvals?projectId=${encodeURIComponent(record.projectId)}&claimId=${encodeURIComponent(record.claimId)}`} icon={Gavel} title={text('전자결재', 'Phê duyệt', 'Approval')} description={text('READY 보고서 버전만 결재 초안에 연결합니다.', 'Chỉ liên kết bản READY.', 'Only READY report versions are linked.')} />
        <article className={`${panelClass} lg:col-span-3`}><h4 className="flex items-center gap-2 text-sm font-black"><ListChecks className="h-4 w-4 text-teal-700" />{text('운영 Gate', 'Cổng vận hành', 'Operational gates')}</h4><div className="mt-3 grid gap-3 sm:grid-cols-4">{[['Evidence','READY'],['AI','HUMAN REVIEW'],['Report','APPROVAL'],['Delivery','APPROVED ONLY']].map(([label, state]) => <div key={label} className="rounded-xl border border-[var(--color-border)] bg-[var(--cc-surface-2)] p-3"><span className="text-[10px] font-black text-[var(--color-text-sub)]">{label}</span><strong className="mt-1 block text-xs text-teal-800">{state}</strong></div>)}</div></article>
      </section>}

      {tab === 'EVIDENCE' && <section className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">{CLAIM_FOLDER_CATALOG.map((folder) => <button key={folder.code} type="button" onClick={() => setFolderCode(folder.code)} className={`rounded-xl border p-3 text-left transition focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${folderCode === folder.code ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-orange-300 hover:bg-orange-50/40'}`}><span className="text-[10px] font-black text-orange-700">{folder.code}</span><strong className="mt-1 block text-xs">{locale === 'vi' ? folder.vi : locale === 'en' ? folder.en : folder.ko}</strong></button>)}</div>
        <article className={panelClass}><h4 className="text-sm font-black">{text('증거 Metadata 등록', 'Đăng ký metadata chứng cứ', 'Register evidence metadata')}</h4><div className="mt-3 grid gap-3 md:grid-cols-4"><input value={evidenceName} onChange={(event) => setEvidenceName(event.target.value)} placeholder="demo-evidence.pdf" className={`${inputClass} md:col-span-2`} /><select value={classification} onChange={(event) => setClassification(event.target.value as ClaimClassification)} className={inputClass}><option value="INTERNAL">INTERNAL</option><option value="CONFIDENTIAL">CONFIDENTIAL</option><option value="RESTRICTED_LEGAL">RESTRICTED_LEGAL</option></select><select value={linkedIssueId} onChange={(event) => setLinkedIssueId(event.target.value)} className={inputClass}><option value="">{text('쟁점 미연결', 'Không liên kết vấn đề', 'No issue link')}</option>{record.issues.map((issue) => <option key={issue.id} value={issue.id}>{issue.title}</option>)}</select></div><SemanticActionButton className="mt-3" variant="add-resource" icon={<Plus className="h-4 w-4" />} disabled={!evidenceName.trim()} disabledReason={text('파일명을 입력하세요.', 'Nhập tên tệp.', 'Enter a file name.')} onClick={createEvidence}>{text('READY 증거 등록', 'Đăng ký chứng cứ READY', 'Register READY evidence')}</SemanticActionButton></article>
        <article className={`${panelClass} overflow-x-auto`}><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-[var(--color-border)] text-[var(--color-text-sub)]"><th className="p-3">File</th><th className="p-3">Folder</th><th className="p-3">State</th><th className="p-3">Version</th><th className="p-3">Checksum</th><th className="p-3">Class</th><th className="p-3">Issue</th></tr></thead><tbody>{record.evidences.map((item) => <tr key={item.id} className="border-b border-[var(--color-border)] hover:bg-[var(--cc-surface-2)]"><td className="p-3 font-black">{item.fileName}</td><td className="p-3">{item.folderCode}</td><td className="p-3 text-emerald-700">{item.state}</td><td className="p-3">v{item.version}</td><td className="p-3 font-mono">{item.checksum}</td><td className="p-3">{item.classification}</td><td className="p-3">{item.issueId || '-'}</td></tr>)}</tbody></table>{!record.evidences.length && <Empty text={text('등록된 증거가 없습니다.', 'Không có chứng cứ.', 'No evidence registered.')} />}</article>
      </section>}

      {tab === 'MEETINGS' && <section className="grid gap-4 xl:grid-cols-[minmax(320px,.8fr)_minmax(480px,1.2fr)]"><article className={panelClass}><h4 className="text-sm font-black">{text('새 회의록 Draft', 'Bản nháp biên bản mới', 'New meeting draft')}</h4><div className="mt-3 space-y-3"><input value={meetingTitle} onChange={(event) => setMeetingTitle(event.target.value)} placeholder={text('회의명', 'Tên cuộc họp', 'Meeting title')} className={inputClass} /><div className="grid gap-3 sm:grid-cols-2"><input type="datetime-local" value={heldAt} onChange={(event) => setHeldAt(event.target.value)} className={inputClass} /><input value={location} onChange={(event) => setLocation(event.target.value)} placeholder={text('장소', 'Địa điểm', 'Location')} className={inputClass} /></div><input value={participants} onChange={(event) => setParticipants(event.target.value)} placeholder={text('참석자, 쉼표로 구분', 'Người tham dự, phân cách dấu phẩy', 'Participants, comma separated')} className={inputClass} /><textarea value={roughNotes} onChange={(event) => setRoughNotes(event.target.value)} placeholder={text('거친 메모', 'Ghi chú thô', 'Rough notes')} className={`${inputClass} min-h-28 py-3`} /><input value={audioName} onChange={(event) => setAudioName(event.target.value)} placeholder={text('오디오 파일명(선택)', 'Tên tệp audio (tuỳ chọn)', 'Audio file name (optional)')} className={inputClass} />{audioName && <><label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={audioConsent} onChange={(event) => setAudioConsent(event.target.checked)} />{text('녹음 동의 확인', 'Đã xác nhận đồng ý ghi âm', 'Recording consent confirmed')}</label><input value={legalBasis} onChange={(event) => setLegalBasis(event.target.value)} placeholder={text('동의 또는 법적근거', 'Căn cứ đồng ý/pháp lý', 'Consent or legal basis')} className={inputClass} /></>}<SemanticActionButton variant="save" icon={<FileClock className="h-4 w-4" />} disabled={!meetingTitle.trim() || !roughNotes.trim() || Boolean(audioName && (!audioConsent || !legalBasis.trim()))} disabledReason={text('회의명·메모와 오디오 동의/근거를 확인하세요.', 'Kiểm tra tên, ghi chú và căn cứ audio.', 'Check title, notes, and audio consent/basis.')} onClick={createMeeting}>{text('회의록 Draft 저장', 'Lưu bản nháp', 'Save meeting draft')}</SemanticActionButton></div></article><div className="space-y-3">{record.meetings.map((meeting) => <article key={meeting.id} className={panelClass}><div className="flex flex-wrap items-start justify-between gap-3"><div><span className="text-[10px] font-black text-blue-700">{meeting.status}</span><h4 className="mt-1 font-black">{meeting.title}</h4><p className="mt-1 text-xs text-[var(--color-text-sub)]">{meeting.heldAt} · {meeting.location || '-'}</p></div><Link href={`/ai-assistant/tools/meeting-notes?projectId=${encodeURIComponent(record.projectId)}&claimId=${encodeURIComponent(record.claimId)}&meetingId=${encodeURIComponent(meeting.id)}`} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#16294d] px-3 text-xs font-black text-white hover:bg-[#213c6c] focus-visible:ring-2 focus-visible:ring-blue-600"><Bot className="h-4 w-4" />{text('AI로 정리', 'Sắp xếp bằng AI', 'Structure with AI')}</Link></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--color-text-sub)]">{meeting.roughNotes}</p>{meeting.provenance && <p className="mt-3 rounded-lg border border-violet-200 bg-violet-50 p-3 text-[10px] font-bold text-violet-900">{meeting.provenance.provider} · {meeting.provenance.model} · {meeting.provenance.reviewStatus} · {meeting.provenance.outputHash}</p>}</article>)}{!record.meetings.length && <Empty text={text('회의록 Draft가 없습니다.', 'Không có bản nháp.', 'No meeting drafts.')} />}</div></section>}

      {tab === 'TIMELINE' && <section className={panelClass}><h4 className="flex items-center gap-2 text-sm font-black"><History className="h-4 w-4 text-blue-700" />{text('변경 타임라인', 'Dòng thời gian thay đổi', 'Change timeline')}</h4><ol className="mt-4 space-y-3">{record.history.map((event) => <li key={event.id} className="grid gap-2 rounded-xl border border-[var(--color-border)] p-3 sm:grid-cols-[170px_1fr]"><time className="text-[10px] font-bold text-[var(--color-text-sub)]">{event.createdAt}</time><div><strong className="text-xs">{event.type}</strong><p className="mt-1 text-xs text-[var(--color-text-sub)]">{event.reason} · {event.actorId}</p></div></li>)}</ol></section>}

      {tab === 'ISSUES' && <section className="grid gap-4 lg:grid-cols-[360px_1fr]"><article className={panelClass}><h4 className="text-sm font-black">{text('쟁점 등록', 'Tạo vấn đề', 'Create issue')}</h4><input value={issueTitle} onChange={(event) => setIssueTitle(event.target.value)} placeholder={text('쟁점 제목', 'Tiêu đề vấn đề', 'Issue title')} className={`${inputClass} mt-3`} /><textarea value={issueDescription} onChange={(event) => setIssueDescription(event.target.value)} placeholder={text('분석할 내용', 'Nội dung phân tích', 'Description')} className={`${inputClass} mt-3 min-h-28 py-3`} /><SemanticActionButton className="mt-3" variant="primary" icon={<Plus className="h-4 w-4" />} disabled={!issueTitle.trim()} onClick={() => void run(() => { addIssue(record.claimId, { title: issueTitle.trim(), description: issueDescription.trim(), status: 'OPEN', evidenceIds: [], meetingIds: [] }, currentUser.id); setIssueTitle(''); setIssueDescription(''); }, text('쟁점을 등록했습니다.', 'Đã tạo vấn đề.', 'Issue created.'))}>{text('쟁점 추가', 'Thêm vấn đề', 'Add issue')}</SemanticActionButton></article><div className="space-y-3">{record.issues.map((issue) => <article key={issue.id} className={panelClass}><span className="text-[10px] font-black text-rose-700">{issue.status}</span><h4 className="mt-1 font-black">{issue.title}</h4><p className="mt-2 text-sm text-[var(--color-text-sub)]">{issue.description}</p><p className="mt-3 text-[10px] font-bold text-[var(--color-text-sub)]">Evidence {issue.evidenceIds.length} · Meeting {issue.meetingIds.length}</p></article>)}{!record.issues.length && <Empty text={text('등록된 쟁점이 없습니다.', 'Không có vấn đề.', 'No issues.')} />}</div></section>}

      {tab === 'WORKPAPERS' && <section className="grid gap-4 lg:grid-cols-[360px_1fr]"><article className={panelClass}><h4 className="text-sm font-black">Workpaper</h4><input value={workpaperTitle} onChange={(event) => setWorkpaperTitle(event.target.value)} placeholder="Workpaper title" className={`${inputClass} mt-3`} /><textarea value={workpaperDescription} onChange={(event) => setWorkpaperDescription(event.target.value)} placeholder={text('분석 메모', 'Ghi chú phân tích', 'Analysis notes')} className={`${inputClass} mt-3 min-h-28 py-3`} /><SemanticActionButton className="mt-3" variant="document" icon={<Plus className="h-4 w-4" />} disabled={!workpaperTitle.trim()} onClick={() => void run(() => { addWorkpaper(record.claimId, { title: workpaperTitle.trim(), description: workpaperDescription.trim(), issueIds: [], status: 'DRAFT' }, currentUser.id); setWorkpaperTitle(''); setWorkpaperDescription(''); }, text('Workpaper를 만들었습니다.', 'Đã tạo Workpaper.', 'Workpaper created.'))}>Workpaper</SemanticActionButton></article><div className="space-y-3">{record.workpapers.map((item) => <article key={item.id} className={panelClass}><span className="text-[10px] font-black text-violet-700">{item.status} · v{item.version}</span><h4 className="mt-1 font-black">{item.title}</h4><p className="mt-2 text-sm text-[var(--color-text-sub)]">{item.description}</p></article>)}{!record.workpapers.length && <Empty text={text('Workpaper가 없습니다.', 'Không có Workpaper.', 'No workpapers.')} />}</div></section>}

      {tab === 'REPORTS' && <section className="space-y-4">
        <article className={panelClass}>
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs font-bold text-violet-950">{text('AI는 보고서 초안을 보조하며, 사람의 검토와 전자결재 전에는 최종본으로 확정되지 않습니다.', 'AI chỉ hỗ trợ bản nháp; cần người duyệt và phê duyệt điện tử.', 'AI only assists drafts; human review and electronic approval are required.')}</div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row"><input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} placeholder={text('보고서명', 'Tên báo cáo', 'Report title')} className={inputClass} /><SemanticActionButton variant="primary" icon={<Plus className="h-4 w-4" />} disabled={!reportTitle.trim()} onClick={() => void run(() => { addReport(record.claimId, reportTitle.trim(), currentUser.id); setReportTitle(''); }, text('보고서 Draft를 만들었습니다.', 'Đã tạo bản nháp báo cáo.', 'Report draft created.'))}>{text('보고서 Draft', 'Bản nháp báo cáo', 'Report draft')}</SemanticActionButton></div>
        </article>
        {record.reports.map((report) => <article key={report.id} className={panelClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-64 flex-1"><span className="text-[10px] font-black text-indigo-700">{report.status} · v{report.version}</span><h4 className="mt-1 font-black">{report.title}</h4><p className="mt-1 break-all font-mono text-[10px] text-[var(--color-text-sub)]">{report.reportVersionId} · {report.fileState}</p>{report.revisedFromVersionId && <p className="mt-1 text-[10px] font-bold text-[var(--color-text-sub)]">{text('수정 원본', 'Bản gốc sửa đổi', 'Revised from')}: {report.revisedFromVersionId}</p>}{['APPROVED', 'DELIVERED'].includes(report.status) && <input value={revisionReasons[report.id] || ''} onChange={(event) => setRevisionReasons((current) => ({ ...current, [report.id]: event.target.value }))} placeholder={text('수정본 생성 사유', 'Lý do tạo bản sửa đổi', 'Revision reason')} className={`${inputClass} mt-3`} />}</div>
            <ActionButtonGroup label="Report state actions">
              {report.status === 'DRAFT' && <SemanticActionButton variant="view" icon={<FileSearch className="h-4 w-4" />} onClick={() => void run(() => transitionReport(record.claimId, report.id, 'REVIEW', currentUser.id, 'Report sent to review'), text('검토 상태로 전환했습니다.', 'Đã chuyển sang duyệt.', 'Moved to review.'))}>{text('검토 요청', 'Yêu cầu xem xét', 'Request review')}</SemanticActionButton>}
              {report.status === 'REVIEW' && <SemanticActionButton variant="primary" icon={<Gavel className="h-4 w-4" />} onClick={() => createApprovalDraft(report.id)}>{text('결재 초안 생성', 'Tạo nháp phê duyệt', 'Create approval draft')}</SemanticActionButton>}
              {report.status === 'APPROVAL_PENDING' && <Link href={`/approvals?projectId=${encodeURIComponent(record.projectId)}&claimId=${encodeURIComponent(record.claimId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-indigo-700 bg-indigo-50 px-4 text-xs font-black text-indigo-800 hover:bg-indigo-100"><ArrowUpRight className="h-4 w-4" />{text('전자결재 열기', 'Mở phê duyệt', 'Open approval')}</Link>}
              {report.status === 'APPROVED' && <SemanticActionButton variant="success" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setTab('DELIVERY')}>{text('납품 준비', 'Chuẩn bị bàn giao', 'Prepare delivery')}</SemanticActionButton>}
              {['APPROVED', 'DELIVERED'].includes(report.status) && <SemanticActionButton variant="document" icon={<FileClock className="h-4 w-4" />} disabled={!revisionReasons[report.id]?.trim()} disabledReason={text('수정 사유를 입력하세요.', 'Nhập lý do sửa đổi.', 'Enter a revision reason.')} onClick={() => void run(() => { createReportRevision(record.claimId, report.id, currentUser.id, revisionReasons[report.id]); setRevisionReasons((current) => ({ ...current, [report.id]: '' })); }, text('기존 버전을 보존하고 새 Draft를 만들었습니다.', 'Đã giữ bản cũ và tạo bản nháp mới.', 'The prior version was preserved and a new draft was created.'))}>{text('수정본 생성', 'Tạo bản sửa đổi', 'Create revision')}</SemanticActionButton>}
            </ActionButtonGroup>
          </div>
        </article>)}
        {!record.reports.length && <Empty text={text('보고서가 없습니다.', 'Không có báo cáo.', 'No reports.')} />}
      </section>}

      {tab === 'APPROVAL' && <section className="space-y-4"><article className={panelClass}><div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-sm font-black">{text('클레임 전자결재', 'Phê duyệt Claim', 'Claim approval')}</h4><p className="mt-1 text-xs text-[var(--color-text-sub)]">projectId · claimId · reportId · reportVersionId · READY File Ref</p></div><Link href={`/approvals?projectId=${encodeURIComponent(record.projectId)}&claimId=${encodeURIComponent(record.claimId)}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 text-xs font-black text-white hover:brightness-95"><Gavel className="h-4 w-4" />{text('전자결재 열기', 'Mở phê duyệt', 'Open approvals')}</Link></div></article>{scopedApprovals.map((request) => <article key={request.id} className={panelClass}><span className="text-[10px] font-black text-indigo-700">{request.status}</span><h4 className="mt-1 font-black">{request.title}</h4><p className="mt-2 text-xs text-[var(--color-text-sub)]">{request.reportId} · {request.reportVersionId} · READY {request.attachments?.filter((file) => file.state === 'READY').length || 0}</p></article>)}{!scopedApprovals.length && <Empty text={text('연결된 결재문서가 없습니다.', 'Không có hồ sơ phê duyệt.', 'No linked approvals.')} />}</section>}

      {tab === 'DELIVERY' && <section className="space-y-4"><article className={panelClass}><label className="text-xs font-black">{text('납품 수신처', 'Nơi nhận bàn giao', 'Delivery recipient')}<input value={deliveryRecipient} onChange={(event) => setDeliveryRecipient(event.target.value)} className={`${inputClass} mt-2`} /></label></article>{record.reports.filter((report) => ['APPROVED', 'DELIVERED'].includes(report.status)).map((report) => <article key={report.id} className={panelClass}><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-[10px] font-black text-emerald-700">{report.status}</span><h4 className="mt-1 font-black">{report.title} · v{report.version}</h4></div>{report.status === 'APPROVED' && <SemanticActionButton variant="success" icon={<PackageCheck className="h-4 w-4" />} disabled={!deliveryRecipient.trim()} disabledReason={text('수신처를 입력하세요.', 'Nhập nơi nhận.', 'Enter a recipient.')} onClick={() => void run(() => addDelivery(record.claimId, report.id, deliveryRecipient.trim(), currentUser.id), text('승인된 버전을 납품 처리했습니다.', 'Đã bàn giao bản được duyệt.', 'Approved version delivered.'))}>{text('승인본 납품', 'Bàn giao bản duyệt', 'Deliver approved version')}</SemanticActionButton>}</div></article>)}{record.deliveries.map((delivery) => <article key={delivery.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-950">{delivery.reportVersionId} · {delivery.recipient} · {delivery.deliveredAt}</article>)}{!record.deliveries.length && <Empty text={text('납품 이력이 없습니다.', 'Không có lịch sử bàn giao.', 'No delivery history.')} />}</section>}
    </div>
  );
}

function QuickLink({ href, icon: Icon, title, description }: { href: string; icon: typeof FileText; title: string; description: string }) {
  return <Link href={href} className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--cc-shadow-1)] transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><Icon className="h-5 w-5" /></span><h4 className="mt-4 flex items-center gap-2 font-black">{title}<ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></h4><p className="mt-2 text-xs font-semibold leading-5 text-[var(--color-text-sub)]">{description}</p></Link>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--cc-surface-2)] px-4 py-10 text-center text-xs font-bold text-[var(--color-text-sub)]"><Archive className="mx-auto mb-2 h-5 w-5" />{text}</div>;
}
