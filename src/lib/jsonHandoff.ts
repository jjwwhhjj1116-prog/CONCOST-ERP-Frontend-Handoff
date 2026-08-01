import { useProjectStore } from '@/store/projectStore';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingStore } from '@/store/settingStore';
import { useApprovalStore } from '@/store/approvalStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useScheduleStore } from '@/store/scheduleStore';
import { useTranslationStore } from '@/store/translationStore';
import { useAuditStore } from '@/store/auditStore';
import { useProcessTemplateStore } from '@/store/processTemplateStore';

import { Project, TaskCard, PersonnelCard, WorkspaceSetting, TaskWorkSegment, ApprovalRequest, RevisionRequest, PostDeliveryWorkRequest, Notification, PersonalSchedule, WorkspaceLanguage, TranslationProviderHealth, TranslationCacheItem, AuditLog, ProcessTemplate, ProcessStage, ProcessTask, ProcessTemplateAssignment, ProcessSchedule } from '@/types/models';
import { TranslationSettings } from '@/store/translationStore';

export interface WorkspaceExportData {
  schemaVersion: string;
  exportedAt: string;
  exportedBy: string;
  data: {
    projects: Project[];
    tasks: TaskCard[];
    taskWorkSegments: TaskWorkSegment[];
    personnel: PersonnelCard[];
    settings: WorkspaceSetting[];
    approvalRequests: ApprovalRequest[];
    revisionRequests: RevisionRequest[];
    postDeliveryWorkRequests: PostDeliveryWorkRequest[];
    notifications: Notification[];
    personalSchedules: PersonalSchedule[];
    workspaceLanguage?: WorkspaceLanguage;
    translationSettings?: TranslationSettings;
    translationProviderHealths?: Record<string, TranslationProviderHealth>;
    translationCache?: TranslationCacheItem[];
    auditLogs: AuditLog[];
    processTemplates?: ProcessTemplate[];
    processStages?: ProcessStage[];
    processTasks?: ProcessTask[];
    processAssignments?: ProcessTemplateAssignment[];
    processSchedules?: ProcessSchedule[];
  };
}

export const exportWorkspaceData = (): WorkspaceExportData => {
  const { projects, revisionRequests, postDeliveryWorkRequests } = useProjectStore.getState();
  const { tasks, workSegments } = useTaskStore.getState();
  const { users, currentUser } = useAuthStore.getState();
  const settings = useSettingStore.getState().settings;
  const { requests: approvalRequests } = useApprovalStore.getState();
  const { notifications } = useNotificationStore.getState();
  const { schedules: personalSchedules } = useScheduleStore.getState();
  const { settings: translationSettings, providerHealths, translationCache } = useTranslationStore.getState();
  const { logs: auditLogs } = useAuditStore.getState();
  const { templates: processTemplates, stages: processStages, tasks: processTasks, assignments: processAssignments, schedules: processSchedules } = useProcessTemplateStore.getState();

  useAuditStore.getState().addLog({
    action: 'SYSTEM_JSON_EXPORT',
    entityType: 'SYSTEM',
    message: 'Workspace data exported to JSON',
    actorId: currentUser?.id || 'SYSTEM',
    entityId: 'workspace_export'
  });

  // Sanitize secrets before export
  const sanitizedTranslationSettings = { ...translationSettings };
  delete sanitizedTranslationSettings.myMemoryContactEmail;
  delete sanitizedTranslationSettings.libreTranslateEndpoint; // Optional: keep or remove depending on security, prompt says "endpoint URL은 포함 가능하지만, Secret은 포함 금지." We'll keep endpoint but remove email.
  
  return {
    schemaVersion: "1.0.0",
    exportedAt: new Date().toISOString(),
    exportedBy: currentUser?.displayName || "System",
    data: {
      projects,
      tasks,
      taskWorkSegments: workSegments,
      personnel: users,
      settings,
      approvalRequests,
      revisionRequests,
      postDeliveryWorkRequests,
      notifications,
      personalSchedules,
      workspaceLanguage: translationSettings.uiLanguage,
      translationSettings: sanitizedTranslationSettings,
      translationProviderHealths: providerHealths,
      translationCache,
      auditLogs,
      processTemplates,
      processStages,
      processTasks,
      processAssignments,
      processSchedules
    }
  };
};

export const downloadJson = (data: unknown, filename: string) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const saveDraftToLocalStorage = () => {
  const data = exportWorkspaceData();
  localStorage.setItem('workspace_draft', JSON.stringify(data));
  return true;
};

export const loadDraftFromLocalStorage = (): WorkspaceExportData | null => {
  const dataStr = localStorage.getItem('workspace_draft');
  if (!dataStr) return null;
  try {
    const data = JSON.parse(dataStr);
    if (data.schemaVersion) return data;
    return null;
  } catch (e) {
    return null;
  }
};

export const validateImportData = (data: unknown): data is WorkspaceExportData => {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (d.schemaVersion !== "1.0.0") return false;
  
  const typedData = d.data as WorkspaceExportData['data'];
  if (!typedData || typeof typedData !== 'object') return false;
  if (!Array.isArray(typedData.projects)) return false;
  
  // Validation: projectSourceType and dates
  const isValidProjects = typedData.projects.every(p => {
    if (!p || typeof p !== 'object' || !p.id) return false;
    if (p.projectSourceType === 'INTERNAL_DEVELOPMENT' && !p.targetDate) return false;
    if (p.projectSourceType === 'CLIENT_ORDER' && !p.deliveryDate) return false;
    return true;
  });
  if (!isValidProjects) return false;

  // Validation: Task References
  const projectIds = new Set(typedData.projects.map(p => p.id));
  const userIds = new Set((typedData.personnel || []).map(u => u?.id).filter(Boolean));
  
  if (typedData.tasks && Array.isArray(typedData.tasks)) {
    const isValidTasks = typedData.tasks.every(t => {
      if (!t || typeof t !== 'object' || !t.id) return false;
      if (!projectIds.has(t.projectId)) return false;
      if (t.assigneeId && !userIds.has(t.assigneeId)) return false;
      return true;
    });
    if (!isValidTasks) return false;
  }
  
  if (typedData.processTemplates && Array.isArray(typedData.processTemplates)) {
    const isValidTemplates = typedData.processTemplates.every(t => t && typeof t === 'object' && t.id);
    if (!isValidTemplates) return false;
  }

  if (typedData.processStages && Array.isArray(typedData.processStages)) {
    const isValidStages = typedData.processStages.every(s => s && typeof s === 'object' && s.id && s.templateId);
    if (!isValidStages) return false;
  }

  if (typedData.processTasks && Array.isArray(typedData.processTasks)) {
    const isValidTasks = typedData.processTasks.every(t => t && typeof t === 'object' && t.id && t.stageId);
    if (!isValidTasks) return false;
  }

  if (typedData.processAssignments && Array.isArray(typedData.processAssignments)) {
    const isValidAssignments = typedData.processAssignments.every(a => {
      if (!a || typeof a !== 'object' || !a.id) return false;
      if (a.revisionNo !== undefined && typeof a.revisionNo !== 'number') return false;
      if (a.historySnapshot !== undefined && !Array.isArray(a.historySnapshot)) return false;
      return true;
    });
    if (!isValidAssignments) return false;
  }

  if (typedData.processSchedules && Array.isArray(typedData.processSchedules)) {
    const isValidSchedules = typedData.processSchedules.every(s => {
      if (!s || typeof s !== 'object' || !s.id) return false;
      if (typeof s.processStageId !== 'string' || typeof s.processTaskId !== 'string') return false;
      return true;
    });
    if (!isValidSchedules) return false;
  }
  
  return true;
};
export const applyImportData = (data: WorkspaceExportData) => {
  if (!validateImportData(data)) {
    alert("데이터 구조가 유효하지 않습니다.");
    return false;
  }
  
  useProjectStore.getState().replaceProjects(data.data.projects || []);
  if (Array.isArray(data.data.revisionRequests)) useProjectStore.setState({ revisionRequests: data.data.revisionRequests });
  if (Array.isArray(data.data.postDeliveryWorkRequests)) useProjectStore.setState({ postDeliveryWorkRequests: data.data.postDeliveryWorkRequests });
  
  useTaskStore.getState().replaceTasks(data.data.tasks || []);
  if (Array.isArray(data.data.taskWorkSegments)) {
    useTaskStore.setState({ workSegments: data.data.taskWorkSegments });
  }

  if (Array.isArray(data.data.approvalRequests)) {
    useApprovalStore.getState().replaceRequests(data.data.approvalRequests);
  }

  if (Array.isArray(data.data.notifications)) {
    useNotificationStore.setState({ notifications: data.data.notifications });
  }

  if (Array.isArray(data.data.personalSchedules)) {
    useScheduleStore.getState().replaceSchedules(data.data.personalSchedules);
  }
  
  if (Array.isArray(data.data.auditLogs)) {
    useAuditStore.getState().replaceLogs(data.data.auditLogs);
  }

  if (Array.isArray(data.data.processTemplates)) {
    useProcessTemplateStore.getState().loadInitialData(
      data.data.processTemplates,
      Array.isArray(data.data.processStages) ? data.data.processStages : [],
      Array.isArray(data.data.processTasks) ? data.data.processTasks : []
    );
    if (Array.isArray(data.data.processAssignments)) {
      useProcessTemplateStore.getState().replaceAssignments(data.data.processAssignments);
    }
    if (Array.isArray(data.data.processSchedules)) {
      useProcessTemplateStore.getState().replaceSchedules(data.data.processSchedules);
    }
  }
  
  if (Array.isArray(data.data.personnel) && data.data.personnel.length > 0) {
    useAuthStore.getState().replaceUsers(data.data.personnel);
  }
  
  if (Array.isArray(data.data.settings) && data.data.settings.length > 0) {
    useSettingStore.getState().replaceSettings(data.data.settings);
  }
  
  useAuditStore.getState().addLog({
    action: 'SYSTEM_JSON_IMPORT',
    entityType: 'SYSTEM',
    message: 'Workspace data imported from JSON',
    actorId: useAuthStore.getState().currentUser?.id || 'SYSTEM',
    entityId: 'workspace_import'
  });

  useAuthStore.getState().setDataSourceMode('EXCEL_IMPORT_DATA');
  alert("데이터가 성공적으로 반영되었습니다.");
  return true;
};
