import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test, { after, before, beforeEach } from 'node:test';
import ExcelJS from 'exceljs';
import { buildEstimateDbReport, buildEstimateDbWorkbook } from './estimateDatabase';
import { createEstimateSheetState } from './estimateSheetTemplates';
import { buildProjectIntakeDraft, validateSecretReferences } from './projectIntake';
import { getProjectBoardScope, matchesProjectBoardScope } from './projectExecutionUnits';
import { localDeliveryPermissions } from './projectDelivery';
import { localProjectOperationPermissions } from './projectOperation';
import { localPmSchedulePermissions } from './projectPmSchedule';
import { localProfitPermissions } from './projectProfit';
import { localProjectQcPermissions } from './projectQc';
import { buildProjectWorkflowSummary, ProjectWorkflowSources } from './projectWorkflow';
import { validateImportData, WorkspaceExportData } from './jsonHandoff';
import { useAuditStore } from '@/store/auditStore';
import { useEstimateRequestStore } from '@/store/estimateRequestStore';
import { useEstimateSheetStore } from '@/store/estimateSheetStore';
import { useProjectDeliveryStore } from '@/store/projectDeliveryStore';
import { useProjectIntakeStore } from '@/store/projectIntakeStore';
import { useProjectOperationStore } from '@/store/projectOperationStore';
import { useProjectPmScheduleStore } from '@/store/projectPmScheduleStore';
import { useProjectProfitStore } from '@/store/projectProfitStore';
import { useProjectQcStore } from '@/store/projectQcStore';
import { useProjectStore } from '@/store/projectStore';
import { useNotificationStore } from '@/store/notificationStore';
import type { EstimateRequest, PmSchedulePlan, Project } from '@/types/models';

const manager = { id: 'manager-1', role: 'DEPARTMENT_MANAGER' as const, departmentId: 'dept-a' };
const pm = { id: 'pm-1', role: 'PM' as const, departmentId: 'dept-a' };
const worker = { id: 'worker-1', role: 'WORKER' as const, departmentId: 'dept-a' };
const admin = { id: 'admin-1', role: 'SUPER_ADMIN' as const, departmentId: 'hq' };
const outsider = { id: 'worker-2', role: 'WORKER' as const, departmentId: 'dept-b' };
const originalFetch = globalThis.fetch;

const resetStores = () => {
  useEstimateRequestStore.setState({ requests: [], persistenceMode: 'LOCAL_DEMO', loading: false, error: null });
  useEstimateSheetStore.setState({ sheets: {}, persistenceMode: 'LOCAL_DEMO', loading: false, error: null });
  useProjectStore.setState({ projects: [], postDeliveryWorkRequests: [], revisionRequests: [] });
  useProjectIntakeStore.setState({ intakes: [], persistenceMode: 'LOCAL_DEMO', loading: false, error: null });
  useProjectPmScheduleStore.setState({ schedules: [], persistenceMode: 'LOCAL_DEMO', loading: false, error: null });
  useProjectOperationStore.setState({ operations: [], persistenceMode: 'LOCAL_DEMO', loading: false, error: null });
  useProjectQcStore.setState({ checklists: [], terms: [], persistenceMode: 'LOCAL_DEMO', loading: false, error: null });
  useProjectDeliveryStore.setState({ workspaces: [], persistenceMode: 'LOCAL_DEMO', loading: false, error: null });
  useProjectProfitStore.setState({ analyses: [], unitPriceTables: [], persistenceMode: 'LOCAL_DEMO', loading: false, error: null });
  useNotificationStore.setState({ notifications: [] });
  useAuditStore.getState().resetLogs();
};

const requestDraft = (suffix: string) => ({
  projectName: `OFF-PM-16 ${suffix}`,
  departmentId: 'dept-a',
  ownerId: manager.id,
  targetUnitIds: ['STRUCTURE' as const],
  primaryUnitId: 'STRUCTURE' as const,
  company: 'CON-COST',
  client: 'Verification Client',
  contact: 'Test Contact',
  contactDepartment: 'Procurement',
  phone: '02-0000-0000',
  email: 'demo-973dfe463ec8@example.invalid',
  requestDate: '2026-07-21',
  memo: 'Canonical workflow verification',
  rawMemo: 'Preserve the original request memo',
  firstDelivery: '2026-08-10',
  finalDelivery: '2026-08-20',
  expectedStartDate: '2026-07-25',
  scope: 'STRUCTURE, BIM',
  estimateType: '개산견적',
});

const createCompletedRequest = async (suffix: string): Promise<EstimateRequest> => {
  const request = await useEstimateRequestStore.getState().createRequest(requestDraft(suffix), manager.id);
  const state = createEstimateSheetState('개산견적');
  state.cells['5:2'] = { value: 'CON-COST' };
  state.cells['6:2'] = { value: request.projectName };
  state.cells['7:2'] = { value: 'Structure quantity takeoff' };
  state.cells['10:2'] = { value: 100000 };
  await useEstimateSheetStore.getState().createSheet(request.id, '개산견적', state, manager.id);
  await useEstimateSheetStore.getState().submitSheet(request.id, manager.id, 'demo-973dfe463ec8@example.invalid', 'EMAIL');
  return useEstimateRequestStore.getState().requests.find((item) => item.id === request.id)!;
};

const plan = (id: 'plan1' | 'plan2', offset: number): PmSchedulePlan => ({
  id,
  title: id === 'plan1' ? 'Plan 1' : 'Plan 2',
  rows: [
    { id: `${id}-pm`, assigneeId: pm.id, departmentId: 'dept-a', category: 'STRUCTURE', scope: 'Estimate and review', people: 1, workDays: 5, totalDays: 5, startDate: `2026-07-${25 + offset}`, endDate: `2026-07-${29 + offset}` },
    { id: `${id}-worker`, assigneeId: worker.id, departmentId: 'dept-a', category: 'BIM', scope: 'Production', people: 1, workDays: 5, totalDays: 5, startDate: `2026-07-${25 + offset}`, endDate: `2026-07-${29 + offset}` },
  ],
});

before(() => {
  globalThis.fetch = async () => { throw new TypeError('OFF-PM-16 offline fixture'); };
});

after(() => {
  globalThis.fetch = originalFetch;
});

beforeEach(resetStores);

test('A: LOST keeps estimate history and never creates a project', { concurrency: false }, async () => {
  const request = await createCompletedRequest('LOST');
  const result = await useEstimateRequestStore.getState().recordDecision(request.id, { decision: 'LOST', reason: 'Budget rejected' }, manager.id);
  assert.equal(result.request.status, 'LOST');
  assert.equal(result.project, null);
  assert.equal(result.intake, null);
  assert.equal(useProjectStore.getState().projects.length, 0);
  assert.ok(result.request.histories.some((entry) => entry.action === 'COMMERCIAL_DECISION_RECORDED'));
  assert.equal(useEstimateSheetStore.getState().sheets[request.id].submissions[0].status, 'SUBMITTED');
});

test('B: CANCELLED requires a reason and blocks estimate/project generation', { concurrency: false }, async () => {
  const request = await useEstimateRequestStore.getState().createRequest(requestDraft('CANCELLED'), manager.id);
  await assert.rejects(() => useEstimateRequestStore.getState().recordDecision(request.id, { decision: 'CANCELLED' }, manager.id), /reason is required/i);
  await useEstimateRequestStore.getState().recordDecision(request.id, { decision: 'CANCELLED', reason: 'Client withdrew request' }, manager.id);
  await assert.rejects(() => useEstimateSheetStore.getState().createSheet(request.id, '개산견적', createEstimateSheetState('개산견적'), manager.id), /terminal estimate request/i);
  assert.equal(useProjectStore.getState().projects.length, 0);
});

test('C/E/F/H: WON follows one canonical lineage through archive with guarded failures', { concurrency: false }, async () => {
  const request = await useEstimateRequestStore.getState().createRequest(requestDraft('WON'), manager.id);
  await useEstimateRequestStore.getState().addAttachments(request.id, 'drawing', [new File(['drawing'], 'drawing.pdf', { type: 'application/pdf' })], manager.id);
  const completed = await createCompletedRequestFromExisting(request);
  const won = await useEstimateRequestStore.getState().recordDecision(completed.id, {
    decision: 'WON', agreedAmount: '100000', agreedScope: 'Structure and BIM', agreedSchedule: '2026-07-25 to 2026-08-20', startCondition: 'Manager acceptance',
  }, manager.id);
  assert.ok(won.request.projectId);
  assert.equal(won.intake?.projectId, won.request.projectId);
  assert.equal(useProjectStore.getState().projects[0].id, won.request.projectId);
  const projectId = won.request.projectId!;
  const awardedProject = useProjectStore.getState().projects.find((item) => item.id === projectId)!;
  assert.equal(matchesProjectBoardScope(awardedProject, getProjectBoardScope('TECHNICAL', null)), false);
  const projectCount = useProjectStore.getState().projects.length;
  const repeated = await useEstimateRequestStore.getState().recordDecision(completed.id, { decision: 'WON' }, manager.id);
  assert.equal(repeated.idempotent, true);
  assert.equal(repeated.project?.id, projectId);
  assert.equal(repeated.intake?.id, won.intake?.id);
  assert.equal(useProjectStore.getState().projects.length, projectCount);

  await useProjectIntakeStore.getState().sync(manager);
  const intake = useProjectIntakeStore.getState().intakes.find((item) => item.projectId === projectId)!;
  const draft = buildProjectIntakeDraft(intake);
  assert.equal(draft.source.projectId, projectId);
  assert.equal(draft.materials.find((item) => item.category === 'drawing')?.originalName, 'drawing.pdf');
  const finalDraft: typeof draft = {
    ...draft,
    targetUnitIds: ['STRUCTURE', 'CLAIM'],
    primaryUnitId: 'STRUCTURE',
    startDateStatus: 'TBD',
    expectedStartDate: '',
  };
  const completedIntake = await useProjectIntakeStore.getState().finalizeWonIntake(intake.id, finalDraft, 'Accepted', manager);
  const startPlannedProject = useProjectStore.getState().projects.find((item) => item.id === projectId)!;
  assert.equal(completedIntake.intake.status, 'ACCEPTED');
  assert.equal(completedIntake.project.id, projectId);
  assert.equal(completedIntake.project.publicationStatus, 'PUBLISHED');
  assert.equal(completedIntake.project.status, 'MANAGER_REVIEW');
  assert.equal(completedIntake.projectNo, startPlannedProject.projectNo);
  assert.equal(completedIntake.startDateStatus, 'TBD');
  assert.equal(completedIntake.idempotent, false);
  assert.equal(completedIntake.assignments.length, 2);
  assert.equal(completedIntake.assignments.filter((item) => item.role === 'PRIMARY').length, 1);
  assert.ok(completedIntake.assignments.every((item) => item.status === 'START_PLANNED'));
  assert.equal(matchesProjectBoardScope(startPlannedProject, getProjectBoardScope('TECHNICAL', null)), true);
  assert.equal(matchesProjectBoardScope(startPlannedProject, getProjectBoardScope('CLAIM', null)), true);
  assert.equal(startPlannedProject.primaryUnitId, 'STRUCTURE');
  assert.deepEqual(startPlannedProject.assignedUnitIds, ['STRUCTURE', 'CLAIM']);
  assert.equal(startPlannedProject.startDateStatus, 'TBD');
  assert.equal(startPlannedProject.startDate, undefined);

  const projectCountAfterCompletion = useProjectStore.getState().projects.length;
  const repeatedCompletion = await useProjectIntakeStore.getState().finalizeWonIntake(intake.id, finalDraft, 'Accepted again', manager);
  assert.equal(repeatedCompletion.idempotent, true);
  assert.equal(repeatedCompletion.project.id, projectId);
  assert.equal(repeatedCompletion.assignments.length, 2);
  assert.equal(useProjectStore.getState().projects.length, projectCountAfterCompletion);

  const revisedDraft: typeof finalDraft = {
    ...finalDraft,
    workContent: `${finalDraft.workContent}\nApproved scope revision`,
    targetUnitIds: ['STRUCTURE', 'DEVELOPMENT'],
    primaryUnitId: 'STRUCTURE',
  };
  const revised = await useProjectIntakeStore.getState().reviseAcceptedIntake(
    completedIntake.intake.id,
    revisedDraft,
    '개발팀 참여 및 수행범위 변경',
    admin,
  );
  assert.equal(revised.intake.id, completedIntake.intake.id);
  assert.equal(revised.intake.projectId, projectId);
  assert.equal(revised.intake.projectNo, completedIntake.projectNo);
  assert.equal(revised.intake.status, 'ACCEPTED');
  assert.equal(revised.project.id, projectId);
  assert.equal(revised.assignments.find((item) => item.unitId === 'CLAIM')?.status, 'REMOVED');
  assert.equal(revised.assignments.find((item) => item.unitId === 'DEVELOPMENT')?.status, 'START_PLANNED');
  assert.equal(revised.assignments.filter((item) => item.role === 'PRIMARY' && item.status !== 'REMOVED').length, 1);
  const revisionNotifications = useNotificationStore.getState().notifications.filter((item) => item.groupId?.startsWith(`project-intake-revision:${completedIntake.intake.id}:`));
  assert.ok(revisionNotifications.length >= revised.eventTypes.length);
  assert.equal(new Set(revisionNotifications.map((item) => item.groupId)).size, revisionNotifications.length);
  assert.ok(revisionNotifications.every((item) => item.groupId?.includes(`:${revised.revision}:`)));

  await useProjectPmScheduleStore.getState().sync(manager);
  await useProjectPmScheduleStore.getState().assign(projectId, { primaryPmId: pm.id, finishPmId: '', structurePmId: pm.id, bimPmId: pm.id, civilPmId: '' }, manager);
  await useProjectPmScheduleStore.getState().requestDraft(projectId, { pmIds: [pm.id], teamLeaderIds: [] }, 'Submit two alternatives', manager);
  await useProjectPmScheduleStore.getState().sync(pm);
  await useProjectPmScheduleStore.getState().savePlans(projectId, plan('plan1', 0), plan('plan2', 1), pm);
  await useProjectPmScheduleStore.getState().submit(projectId, plan('plan1', 0), plan('plan2', 1), pm);
  await useProjectPmScheduleStore.getState().sync(manager);
  await useProjectPmScheduleStore.getState().reject(projectId, 'Shift the second option', manager);
  await useProjectPmScheduleStore.getState().sync(pm);
  await useProjectPmScheduleStore.getState().submit(projectId, plan('plan1', 0), plan('plan2', 2), pm);
  await useProjectPmScheduleStore.getState().sync(manager);
  const approvedSchedule = await useProjectPmScheduleStore.getState().approve(projectId, 'plan1', manager);
  assert.equal(approvedSchedule.status, 'APPROVED');

  await useProjectOperationStore.getState().sync(manager);
  await useProjectOperationStore.getState().reviewStart(projectId, 'APPROVED', 'Start approved', manager);
  assert.equal(useProjectStore.getState().projects.find((item) => item.id === projectId)?.status, 'IN_PROGRESS');
  await useProjectOperationStore.getState().addActivity(projectId, { kind: 'MEETING', occurredAt: '2026-07-25T09:00:00.000Z', title: 'Kickoff', body: 'Scope confirmed', metadata: {} }, manager);
  await useProjectOperationStore.getState().addActivity(projectId, { kind: 'EMAIL', occurredAt: '2026-07-25T10:00:00.000Z', title: 'Kickoff minutes', body: 'Minutes sent', metadata: {} }, manager);

  await useProjectQcStore.getState().sync(projectId, pm);
  let qc = await useProjectQcStore.getState().createItem(projectId, { group: 'STRUCTURE', middleCategory: 'Drawing', subCategory: 'Column', trade: 'Structure', serialNo: 'QC-001', item: 'Column dimensions', method: 'Drawing comparison', targets: ['PM'], comment: '', attachments: [] }, pm);
  const qcItem = qc.items[0];
  qc = await useProjectQcStore.getState().updateItem(projectId, qcItem.id, { checks: [{ target: 'PM', done: true, na: false, checkedBy: pm.id, checkedAt: '2026-07-30T00:00:00.000Z' }] }, pm);
  qc = await useProjectQcStore.getState().sendCategory(projectId, 'STRUCTURE', pm);
  assert.equal(qc.status, 'COMPLETED');

  await useProjectDeliveryStore.getState().sync(projectId, pm);
  let delivery = await useProjectDeliveryStore.getState().createRound(projectId, { kind: 'DELIVERY', label: 'First delivery', deliveryDate: '2026-08-10', memo: 'Initial package' }, pm);
  const firstRound = delivery.rounds[0];
  delivery = await useProjectDeliveryStore.getState().addFile(projectId, firstRound.id, { logicalFileKey: 'main-package', originalName: 'delivery-v1.zip', mimeType: 'application/zip', size: 1024, checksum: 'a'.repeat(64), memo: 'v1' }, pm);
  const roundsBeforeFailure = delivery.rounds.length;
  await assert.rejects(() => useProjectDeliveryStore.getState().createRound(projectId, { kind: 'REDELIVERY', parentRoundId: 'missing', label: 'Invalid', deliveryDate: '2026-08-11', memo: '' }, pm), /reference a prior round/i);
  assert.equal(useProjectDeliveryStore.getState().workspaces[0].rounds.length, roundsBeforeFailure);
  delivery = await useProjectDeliveryStore.getState().requestDownload(projectId, 'delivery-v1.zip', 'Client review', pm);
  await useProjectDeliveryStore.getState().sync(projectId, manager);
  delivery = await useProjectDeliveryStore.getState().reviewDownload(projectId, delivery.downloadRequests[0].id, 'REJECTED', 'Revise package', manager);
  await useProjectDeliveryStore.getState().sync(projectId, pm);
  delivery = await useProjectDeliveryStore.getState().requestDownload(projectId, 'delivery-v2.zip', 'Revised package', pm);
  await useProjectDeliveryStore.getState().sync(projectId, manager);
  delivery = await useProjectDeliveryStore.getState().reviewDownload(projectId, delivery.downloadRequests[0].id, 'APPROVED', 'Approved', manager);
  await useProjectDeliveryStore.getState().sync(projectId, pm);
  delivery = await useProjectDeliveryStore.getState().createReport(projectId, { reportDate: '2026-08-20', stage: 'FINAL', planMemo: 'Complete', resultMemo: 'Delivered', progressRate: 100, delayReason: 'Client revision', overtimeReason: 'Final package' }, pm);
  const reportId = delivery.dailyReports[0].id;
  delivery = await useProjectDeliveryStore.getState().approveReport(projectId, reportId, 'PM', pm);
  await useProjectDeliveryStore.getState().sync(projectId, manager);
  delivery = await useProjectDeliveryStore.getState().approveReport(projectId, reportId, 'MANAGER', manager);
  await useProjectDeliveryStore.getState().sync(projectId, admin);
  delivery = await useProjectDeliveryStore.getState().approveReport(projectId, reportId, 'EXECUTIVE', admin);
  await useProjectDeliveryStore.getState().sync(projectId, pm);
  delivery = await useProjectDeliveryStore.getState().createRound(projectId, { kind: 'REDELIVERY', parentRoundId: firstRound.id, label: 'Re-delivery', deliveryDate: '2026-08-20', memo: 'Approved revision' }, pm);
  const redelivery = delivery.rounds[0];
  await useProjectDeliveryStore.getState().addFile(projectId, redelivery.id, { logicalFileKey: 'main-package', originalName: 'delivery-v2.zip', mimeType: 'application/zip', size: 2048, checksum: 'b'.repeat(64), memo: 'v2' }, pm);
  delivery = await useProjectDeliveryStore.getState().addFile(projectId, redelivery.id, { logicalFileKey: 'main-package', originalName: 'delivery-v3.zip', mimeType: 'application/zip', size: 3072, checksum: 'c'.repeat(64), memo: 'v3' }, pm);
  assert.deepEqual(delivery.rounds[0].files.map((file) => file.version), [2, 1]);

  await useProjectOperationStore.getState().sync(manager);
  const operation = await useProjectOperationStore.getState().updateMilestones(projectId, { actualCompletionDate: '2026-08-20', reason: 'Delivery accepted' }, manager);
  const table = await useProjectProfitStore.getState().createUnitPrices({ effectiveDate: '2026-07-01', entries: [{ grade: 'TEAM_LEADER', unitPrice: '1000' }, { grade: 'PROFESSIONAL', unitPrice: '500' }] }, admin);
  await useProjectProfitStore.getState().sync(projectId, manager);
  const analysis = useProjectProfitStore.getState().analyses[0];
  const profit = await useProjectProfitStore.getState().save(projectId, { unitPriceTableId: table.id, contractAmounts: analysis.contractAmounts, rounds: analysis.rounds }, manager);
  assert.equal(profit.sourceTrace.canonicalProjectId, projectId);
  assert.ok(Number(profit.summary.result) < Number(profit.summary.contractTotal));

  useProjectStore.getState().updateProjectField(projectId, 'status', 'ARCHIVED');
  useProjectStore.getState().updateProjectField(projectId, 'archiveStatus', 'ARCHIVED');
  const project = useProjectStore.getState().projects.find((item) => item.id === projectId)!;
  const acceptedIntake = useProjectIntakeStore.getState().intakes.find((item) => item.projectId === projectId)!;
  const summary = buildProjectWorkflowSummary(project, { intake: acceptedIntake, schedule: approvedSchedule, operation, qc, delivery, profit });
  assert.equal(summary.projectId, projectId);
  assert.equal(summary.completion, 100);
  assert.equal(summary.pendingApprovals, 0);

  const schedulePermissions = localPmSchedulePermissions(approvedSchedule, outsider);
  const operationPermissions = localProjectOperationPermissions(operation, outsider);
  const qcPermissions = localProjectQcPermissions(qc, outsider, [pm.id, worker.id]);
  const deliveryPermissions = localDeliveryPermissions(delivery, outsider, [pm.id, worker.id]);
  const profitPermissions = localProfitPermissions(profit, outsider);
  assert.deepEqual([schedulePermissions.canView, operationPermissions.canView, qcPermissions.canView, deliveryPermissions.canView, profitPermissions.canView], [false, false, false, false, false]);
  assert.equal(localDeliveryPermissions(delivery, worker, [pm.id, worker.id]).canWriteDaily, true);
  assert.equal(localProfitPermissions(profit, manager).canViewUnitPrices, true);
  assert.ok(useAuditStore.getState().logs.length >= 10);
});

const createCompletedRequestFromExisting = async (request: EstimateRequest) => {
  const state = createEstimateSheetState('개산견적');
  state.cells['5:2'] = { value: request.company || '' };
  state.cells['6:2'] = { value: request.projectName };
  state.cells['7:2'] = { value: request.scope || '' };
  state.cells['10:2'] = { value: 100000 };
  await useEstimateSheetStore.getState().createSheet(request.id, '개산견적', state, manager.id);
  await useEstimateSheetStore.getState().submitSheet(request.id, manager.id, request.email || undefined, 'EMAIL');
  return useEstimateRequestStore.getState().requests.find((item) => item.id === request.id)!;
};

test('D: estimate revision and resend preserve previous versions, formulas and submissions', { concurrency: false }, async () => {
  const request = await createCompletedRequest('REVISION');
  const first = useEstimateSheetStore.getState().sheets[request.id];
  const firstHash = first.submissions[0].documentHash;
  const revised = await useEstimateSheetStore.getState().startRevision(request.id, manager.id);
  const nextState = structuredClone(revised.versions[0].state);
  nextState.cells['10:2'] = { value: 120000 };
  await useEstimateSheetStore.getState().saveVersion(request.id, nextState, manager.id);
  await useEstimateSheetStore.getState().submitSheet(request.id, manager.id, 'demo-973dfe463ec8@example.invalid', 'EMAIL');
  const completed = useEstimateSheetStore.getState().sheets[request.id];
  assert.equal(completed.submissions.length, 2);
  assert.equal(completed.versions.length, 3);
  assert.equal(completed.submissions[1].documentHash, firstHash);
  assert.notEqual(completed.submissions[0].documentHash, firstHash);
  assert.equal(completed.versions.at(-1)?.state.cells['10:2']?.value, 100000);
});

test('D2: convenience actions duplicate editable records and archive linked history', { concurrency: false }, async () => {
  const request = await useEstimateRequestStore.getState().createRequest(requestDraft('CONVENIENCE'), manager.id);
  const duplicatedRequest = await useEstimateRequestStore.getState().duplicateRequest(request.id, manager.id);
  assert.match(duplicatedRequest.projectName, /복사본/);
  assert.equal(duplicatedRequest.status, 'REQUEST_MEMO');
  assert.notEqual(duplicatedRequest.id, request.id);
  await useEstimateRequestStore.getState().archiveRequest(duplicatedRequest.id, manager.id);
  assert.equal(useEstimateRequestStore.getState().requests.find((item) => item.id === duplicatedRequest.id)?.worklistState, 'ARCHIVED');

  await useEstimateSheetStore.getState().createSheet(request.id, '개산견적', createEstimateSheetState('개산견적'), manager.id);
  const duplicatedSheet = await useEstimateSheetStore.getState().duplicateDraftVersion(request.id, manager.id);
  assert.equal(duplicatedSheet.currentVersion, 2);
  assert.equal(duplicatedSheet.versions.length, 2);
  await useEstimateRequestStore.getState().archiveRequest(request.id, manager.id);
  assert.equal(useEstimateRequestStore.getState().requests.find((item) => item.id === request.id)?.worklistState, 'ARCHIVED');
  await useEstimateSheetStore.getState().deleteDraft(request.id, manager.id);
  assert.equal(useEstimateSheetStore.getState().sheets[request.id], undefined);
  assert.equal(useEstimateRequestStore.getState().requests.find((item) => item.id === request.id)?.status, 'REQUEST_MEMO');

  const intakeState = useProjectIntakeStore.getState() as unknown as Record<string, unknown>;
  assert.equal(intakeState.createDraft, undefined);
  assert.equal(intakeState.duplicateDraft, undefined);
});

test('F/G: secret references, migration schema and approved brand asset remain exact', { concurrency: false }, () => {
  assert.doesNotThrow(() => validateSecretReferences([{ id: 'secret-1', label: 'ERP', provider: 'vault', reference: 'vault://projects/off-pm-16', note: '' }]));
  assert.throws(() => validateSecretReferences([{ id: 'secret-2', label: 'Password', provider: 'plain', reference: 'plaintext-password', note: '' }]), /Secret references must use/);

  const snapshot: WorkspaceExportData = {
    schemaVersion: '1.0.0', exportedAt: '2026-07-21T00:00:00.000Z', exportedBy: 'OFF-PM-16',
    data: { projects: [], tasks: [], taskWorkSegments: [], personnel: [], settings: [], approvalRequests: [], revisionRequests: [], postDeliveryWorkRequests: [], notifications: [], personalSchedules: [], auditLogs: [] },
  };
  assert.equal(validateImportData(JSON.parse(JSON.stringify(snapshot))), true);
  assert.equal(validateImportData({ ...snapshot, schemaVersion: '0.0.0' }), false);

  const logo = readFileSync('public/brand/con-cost-logo.png');
  assert.equal(createHash('sha256').update(logo).digest('hex').toUpperCase(), 'B0EEF710A8BEF5E6272DDE976B1C5AFF0E41D4FE7F8276DD4AEA9BA8EB787C6D');
  const brandComponent = readFileSync('src/components/ui/BrandLogo.tsx', 'utf8');
  assert.match(brandComponent, /alt="\(주\)컨코스트"/);
  assert.match(brandComponent, /width=\{482\}/);
  assert.match(brandComponent, /height=\{112\}/);
});

test('G/H: estimate database export uses a valid ExcelJS workbook without the vulnerable xlsx runtime', { concurrency: false }, async () => {
  const timestamp = '2026-07-21T00:00:00.000Z';
  const records = [{ id: 'db-1', section: 'PJ' as const, pjNo: 'PJ-001', year: 2026, sortOrder: 1, schemaVersion: 1, data: { 프로젝트명: 'OFF-PM-16', 수주일: '2026-07-01', 계약금액: '100000' }, version: 1, createdBy: admin.id, updatedBy: admin.id, createdAt: timestamp, updatedAt: timestamp }];
  const vendors = [{ id: 'vendor-1', normalizedName: 'vendor', normalizedTrade: 'structure', data: { 업체명: 'Vendor', 공종: 'Structure' }, version: 1, createdBy: admin.id, updatedBy: admin.id, createdAt: timestamp, updatedAt: timestamp }];
  const report = buildEstimateDbReport(records, [], 2026);
  const buffer = await buildEstimateDbWorkbook(records, vendors, report);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  assert.deepEqual(workbook.worksheets.map((sheet) => sheet.name), ['DB_프로젝트', 'DB_기성', 'DB기전외주', '기전업체', '수주', '매출', '입금']);
  assert.equal(workbook.getWorksheet('DB_프로젝트')?.getCell('A1').value, 'id');
  assert.equal(workbook.getWorksheet('DB_프로젝트')?.getCell('A2').value, 'db-1');
});

test('performance: 5,000 workflow summaries stay within the local UAT budget', { concurrency: false }, () => {
  const project: Project = { id: 'perf-project', title: 'Performance', priority: 'NORMAL', status: 'ARCHIVED', departmentId: 'dept-a', managerId: manager.id, pmId: pm.id, progress: 100, archiveStatus: 'ARCHIVED', createdAt: '2026-07-01T00:00:00.000Z', updatedAt: '2026-07-21T00:00:00.000Z' };
  const sources: ProjectWorkflowSources = {};
  const started = performance.now();
  for (let index = 0; index < 5_000; index += 1) buildProjectWorkflowSummary(project, sources);
  const elapsed = performance.now() - started;
  assert.ok(elapsed < 500, `workflow summary budget exceeded: ${elapsed.toFixed(2)}ms`);
});
