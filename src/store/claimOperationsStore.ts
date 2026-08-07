import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  canTransitionClaimReport,
  ClaimAiProvenance,
  ClaimClassification,
  ClaimDelivery,
  ClaimEvidence,
  ClaimFolderCode,
  ClaimIssue,
  ClaimMeeting,
  ClaimMeetingResult,
  ClaimProjectKind,
  ClaimProjectRecord,
  ClaimReport,
  ClaimReportStatus,
  ClaimWorkpaper,
  createClaimChecksum,
  createClaimProjectRecord,
} from '@/lib/claimOperations';
import { getRuntimeExecutionMode } from '@/lib/runtimeExecutionMode';
import { useAuditStore } from '@/store/auditStore';
import type { Project } from '@/types/models';

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();
const audit = (record: ClaimProjectRecord, actorId: string, type: string, reason: string, before: unknown, after: unknown): ClaimProjectRecord => {
  const createdAt = now();
  useAuditStore.getState().addLog({
    actorId,
    action: type,
    entityType: 'CLAIM_PROJECT',
    entityId: record.claimId,
    beforeValue: JSON.stringify(before),
    afterValue: JSON.stringify(after),
    message: reason,
  });
  return {
    ...record,
    revision: record.revision + 1,
    updatedAt: createdAt,
    history: [{ id: id('claim-history'), type, actorId, reason, before: JSON.stringify(before), after: JSON.stringify(after), createdAt }, ...record.history],
  };
};

interface ClaimOperationsState {
  records: ClaimProjectRecord[];
  ensureRecord: (project: Project, actorId: string) => string;
  setKind: (claimId: string, kind: ClaimProjectKind, actorId: string) => void;
  addEvidence: (claimId: string, input: Omit<ClaimEvidence, 'id' | 'projectId' | 'claimId' | 'version' | 'checksum' | 'createdAt'>, actorId: string) => string;
  addMeeting: (claimId: string, input: Omit<ClaimMeeting, 'id' | 'projectId' | 'claimId' | 'status' | 'createdAt' | 'updatedAt'>, actorId: string) => string;
  saveAiReview: (claimId: string, meetingId: string, result: ClaimMeetingResult, provenance: ClaimAiProvenance, actorId: string) => boolean;
  addIssue: (claimId: string, input: Omit<ClaimIssue, 'id' | 'createdAt'>, actorId: string) => string;
  addWorkpaper: (claimId: string, input: Omit<ClaimWorkpaper, 'id' | 'version' | 'createdAt'>, actorId: string) => string;
  addReport: (claimId: string, title: string, actorId: string) => string;
  createReportRevision: (claimId: string, reportId: string, actorId: string, reason: string) => string | null;
  transitionReport: (claimId: string, reportId: string, status: ClaimReportStatus, actorId: string, reason: string, approvalRequestId?: string) => boolean;
  addDelivery: (claimId: string, reportId: string, recipient: string, actorId: string, revisionReason?: string) => string;
}

export const useClaimOperationsStore = create<ClaimOperationsState>()(persist((set, get) => ({
  records: [],
  ensureRecord: (project, actorId) => {
    const existing = get().records.find((record) => record.projectId === project.id);
    if (existing) return existing.claimId;
    const record = createClaimProjectRecord(project, actorId);
    set((state) => ({ records: [...state.records, record] }));
    return record.claimId;
  },
  setKind: (claimId, kind, actorId) => set((state) => ({
    records: state.records.map((record) => record.claimId === claimId
      ? audit({ ...record, kind }, actorId, 'CLAIM_KIND_UPDATED', 'Claim kind updated', { kind: record.kind }, { kind })
      : record),
  })),
  addEvidence: (claimId, input, actorId) => {
    const evidenceId = id('claim-evidence');
    set((state) => ({ records: state.records.map((record) => {
      if (record.claimId !== claimId) return record;
      const evidence: ClaimEvidence = {
        ...input,
        id: evidenceId,
        projectId: record.projectId,
        claimId,
        version: 1,
        checksum: createClaimChecksum(`${record.projectId}:${claimId}:${input.fileReferenceId}:${input.fileName}`),
        createdAt: now(),
      };
      return audit({ ...record, evidences: [...record.evidences, evidence] }, actorId, 'CLAIM_EVIDENCE_ADDED', 'Evidence metadata added', {}, evidence);
    }) }));
    return evidenceId;
  },
  addMeeting: (claimId, input, actorId) => {
    const meetingId = id('claim-meeting');
    set((state) => ({ records: state.records.map((record) => {
      if (record.claimId !== claimId) return record;
      const createdAt = now();
      const meeting: ClaimMeeting = { ...input, id: meetingId, projectId: record.projectId, claimId, status: 'DRAFT', createdAt, updatedAt: createdAt };
      return audit({ ...record, meetings: [...record.meetings, meeting] }, actorId, 'CLAIM_MEETING_CREATED', 'Meeting draft created', {}, { meetingId, title: meeting.title });
    }) }));
    return meetingId;
  },
  saveAiReview: (claimId, meetingId, result, provenance, actorId) => {
    let changed = false;
    set((state) => ({ records: state.records.map((record) => {
      if (record.claimId !== claimId) return record;
      const meeting = record.meetings.find((item) => item.id === meetingId);
      if (!meeting) return record;
      changed = true;
      const updated = { ...meeting, aiResult: result, provenance: { ...provenance, reviewStatus: 'HUMAN_REVIEWED' as const, reviewerId: actorId }, status: 'CONFIRMED' as const, updatedAt: now() };
      return audit({ ...record, meetings: record.meetings.map((item) => item.id === meetingId ? updated : item) }, actorId, 'CLAIM_AI_MINUTES_REVIEWED', 'Human-reviewed AI minutes saved', { status: meeting.status }, { status: updated.status, outputHash: provenance.outputHash });
    }) }));
    return changed;
  },
  addIssue: (claimId, input, actorId) => {
    const issueId = id('claim-issue');
    set((state) => ({ records: state.records.map((record) => {
      if (record.claimId !== claimId) return record;
      const issue: ClaimIssue = { ...input, id: issueId, createdAt: now() };
      return audit({ ...record, issues: [...record.issues, issue] }, actorId, 'CLAIM_ISSUE_CREATED', 'Claim issue created', {}, issue);
    }) }));
    return issueId;
  },
  addWorkpaper: (claimId, input, actorId) => {
    const workpaperId = id('claim-workpaper');
    set((state) => ({ records: state.records.map((record) => {
      if (record.claimId !== claimId) return record;
      const workpaper: ClaimWorkpaper = { ...input, id: workpaperId, version: 1, createdAt: now() };
      return audit({ ...record, workpapers: [...record.workpapers, workpaper] }, actorId, 'CLAIM_WORKPAPER_CREATED', 'Workpaper created', {}, workpaper);
    }) }));
    return workpaperId;
  },
  addReport: (claimId, title, actorId) => {
    const reportId = id('claim-report');
    set((state) => ({ records: state.records.map((record) => {
      if (record.claimId !== claimId) return record;
      const createdAt = now();
      const report: ClaimReport = {
        id: reportId,
        title,
        status: 'DRAFT',
        version: 1,
        reportVersionId: `${reportId}-v1`,
        fileReferenceId: `claim-file-${reportId}-v1`,
        fileState: 'READY',
        createdAt,
        updatedAt: createdAt,
      };
      return audit({ ...record, reports: [...record.reports, report] }, actorId, 'CLAIM_REPORT_CREATED', 'Report draft created', {}, report);
    }) }));
    return reportId;
  },
  createReportRevision: (claimId, reportId, actorId, reason) => {
    let revisionId: string | null = null;
    set((state) => ({
      records: state.records.map((record) => {
        if (record.claimId !== claimId) return record;
        const source = record.reports.find((item) => item.id === reportId);
        if (!source || !['APPROVED', 'DELIVERED'].includes(source.status) || !reason.trim()) return record;
        const rootId = source.parentReportId || source.id;
        const nextVersion = Math.max(source.version, ...record.reports.filter((item) => item.id === rootId || item.parentReportId === rootId).map((item) => item.version)) + 1;
        revisionId = id('claim-report');
        const createdAt = now();
        const revision: ClaimReport = {
          id: revisionId,
          parentReportId: rootId,
          revisedFromVersionId: source.reportVersionId,
          title: source.title,
          status: 'DRAFT',
          version: nextVersion,
          reportVersionId: `${rootId}-v${nextVersion}`,
          fileReferenceId: `claim-file-${rootId}-v${nextVersion}`,
          fileState: 'READY',
          createdAt,
          updatedAt: createdAt,
        };
        return audit({ ...record, reports: [...record.reports, revision] }, actorId, 'CLAIM_REPORT_REVISION_CREATED', reason.trim(), { reportVersionId: source.reportVersionId, status: source.status }, { reportVersionId: revision.reportVersionId, status: revision.status });
      }),
    }));
    return revisionId;
  },
  transitionReport: (claimId, reportId, status, actorId, reason, approvalRequestId) => {
    let changed = false;
    set((state) => ({ records: state.records.map((record) => {
      if (record.claimId !== claimId) return record;
      const report = record.reports.find((item) => item.id === reportId);
      if (!report || !canTransitionClaimReport(report.status, status)) return record;
      changed = true;
      const updated = { ...report, status, approvalRequestId: approvalRequestId || report.approvalRequestId, updatedAt: now() };
      return audit({ ...record, reports: record.reports.map((item) => item.id === reportId ? updated : item) }, actorId, 'CLAIM_REPORT_STATE_CHANGED', reason, { status: report.status }, { status });
    }) }));
    return changed;
  },
  addDelivery: (claimId, reportId, recipient, actorId, revisionReason) => {
    const deliveryId = id('claim-delivery');
    set((state) => ({ records: state.records.map((record) => {
      if (record.claimId !== claimId) return record;
      const report = record.reports.find((item) => item.id === reportId);
      if (!report || report.status !== 'APPROVED') return record;
      const delivery: ClaimDelivery = { id: deliveryId, reportId, reportVersionId: report.reportVersionId, deliveredAt: now(), deliveredBy: actorId, recipient, revisionReason };
      const updatedReport = { ...report, status: 'DELIVERED' as const, updatedAt: now() };
      return audit({ ...record, deliveries: [...record.deliveries, delivery], reports: record.reports.map((item) => item.id === reportId ? updatedReport : item) }, actorId, 'CLAIM_REPORT_DELIVERED', 'Approved report delivered', { status: report.status }, { status: 'DELIVERED', recipient });
    }) }));
    return deliveryId;
  },
}), {
  name: 'claim-operations-demo-v1',
  partialize: (state) => getRuntimeExecutionMode() === 'DEMO_LOCAL' ? { records: state.records } : { records: [] },
}));

export type ClaimEvidenceInput = {
  folderCode: ClaimFolderCode;
  fileName: string;
  fileReferenceId: string;
  state: 'QUEUED' | 'SCANNING' | 'READY' | 'REJECTED';
  classification: ClaimClassification;
  issueId?: string;
  createdBy: string;
};
