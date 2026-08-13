export type NavigationTone =
  | 'orange'
  | 'blue'
  | 'cyan'
  | 'teal'
  | 'green'
  | 'amber'
  | 'rose'
  | 'pink'
  | 'violet'
  | 'indigo'
  | 'slate';

export type NavigationPictogramName =
  | 'homeDashboard'
  | 'approvalPending'
  | 'todayTask'
  | 'monthCalendar'
  | 'mailAll'
  | 'mailInbox'
  | 'mailSent'
  | 'mailImportant'
  | 'mailReceipt'
  | 'mailDraft'
  | 'mailMemo'
  | 'mailSpam'
  | 'mailTrash'
  | 'mailUserFolder'
  | 'mailProjectFolder'
  | 'mailStorage'
  | 'mailSettings'
  | 'approvalHome'
  | 'approvalReceived'
  | 'approvalSent'
  | 'approvalConsensus'
  | 'approvalDistributed'
  | 'calendarAll'
  | 'calendarToday'
  | 'calendarUpcoming'
  | 'projectWorkflow'
  | 'estimateRequest'
  | 'estimateSheet'
  | 'projectPerformance'
  | 'projectIntake'
  | 'technicalHeadquarters'
  | 'technicalPortfolio'
  | 'finishTeam'
  | 'structureTeam'
  | 'civilLandscape'
  | 'meetingMinutes'
  | 'technicalArchive'
  | 'claimCenter'
  | 'claimPortfolio'
  | 'claimEvidence'
  | 'legalMeeting'
  | 'developmentTeam'
  | 'developmentPortfolio'
  | 'codeArchive'
  | 'developmentMeeting'
  | 'projectSchedule'
  | 'finishSchedule'
  | 'structureSchedule'
  | 'civilSchedule'
  | 'claimSchedule'
  | 'developmentSchedule'
  | 'projectQuestion'
  | 'finishQuestion'
  | 'structureQuestion'
  | 'civilQuestion'
  | 'projectDailyReport'
  | 'projectDelivery'
  | 'driveHome'
  | 'driveTechnical'
  | 'driveClaim'
  | 'driveDevelopment'
  | 'taskAll'
  | 'taskToday'
  | 'taskReview'
  | 'taskDone'
  | 'boardCeo'
  | 'boardNotice'
  | 'boardHr'
  | 'boardCelebration'
  | 'boardCommunity'
  | 'boardPhoto'
  | 'boardFree'
  | 'boardLibrary'
  | 'organization'
  | 'concostOffice'
  | 'vietqsOffice'
  | 'salesDashboard'
  | 'customer'
  | 'opportunity'
  | 'proposal'
  | 'contract'
  | 'businessCard'
  | 'businessCardInbox'
  | 'businessCardCapture'
  | 'salesActivity'
  | 'financeDashboard'
  | 'salesRevenue'
  | 'taxInvoice'
  | 'cashflow'
  | 'budget'
  | 'expense'
  | 'treasury'
  | 'closing'
  | 'aiAssistant'
  | 'settingsHome'
  | 'aiProfile'
  | 'translation'
  | 'permissionManagement'
  | 'driveConnection'
  | 'personnel'
  | 'workspaceSettings'
  | 'dataQuality'
  | 'fallback';

export type NavigationVisual = {
  tone: NavigationTone;
  pictogram: NavigationPictogramName;
};

const exactVisuals: Record<string, NavigationVisual> = {
  workspace: { tone: 'orange', pictogram: 'homeDashboard' },
  mail: { tone: 'blue', pictogram: 'mailAll' },
  approvals: { tone: 'violet', pictogram: 'approvalHome' },
  calendar: { tone: 'indigo', pictogram: 'calendarAll' },
  projects: { tone: 'orange', pictogram: 'projectWorkflow' },
  drive: { tone: 'blue', pictogram: 'driveHome' },
  tasks: { tone: 'green', pictogram: 'taskAll' },
  board: { tone: 'orange', pictogram: 'boardCommunity' },
  organization: { tone: 'teal', pictogram: 'organization' },
  sales: { tone: 'green', pictogram: 'salesDashboard' },
  finance: { tone: 'indigo', pictogram: 'financeDashboard' },
  'ai-assistant': { tone: 'violet', pictogram: 'aiAssistant' },
  settings: { tone: 'slate', pictogram: 'settingsHome' },
  'admin-settings': { tone: 'rose', pictogram: 'permissionManagement' },

  'workspace-home': { tone: 'orange', pictogram: 'homeDashboard' },
  'workspace-approval': { tone: 'violet', pictogram: 'approvalPending' },
  'workspace-tasks': { tone: 'green', pictogram: 'todayTask' },
  'workspace-schedule': { tone: 'blue', pictogram: 'monthCalendar' },

  'mail-all': { tone: 'orange', pictogram: 'mailAll' },
  'mail-inbox': { tone: 'blue', pictogram: 'mailInbox' },
  'mail-sent': { tone: 'orange', pictogram: 'mailSent' },
  'mail-starred': { tone: 'amber', pictogram: 'mailImportant' },
  'mail-pending': { tone: 'green', pictogram: 'mailReceipt' },
  'mail-draft': { tone: 'indigo', pictogram: 'mailDraft' },
  'mail-memo': { tone: 'violet', pictogram: 'mailMemo' },
  'mail-spam': { tone: 'rose', pictogram: 'mailSpam' },
  'mail-trash': { tone: 'slate', pictogram: 'mailTrash' },
  'mail-user': { tone: 'cyan', pictogram: 'mailUserFolder' },
  'mail-project': { tone: 'teal', pictogram: 'mailProjectFolder' },
  'mail-storage': { tone: 'blue', pictogram: 'mailStorage' },
  'mail-settings': { tone: 'slate', pictogram: 'mailSettings' },

  'approval-home': { tone: 'violet', pictogram: 'approvalHome' },
  'approval-received': { tone: 'orange', pictogram: 'approvalReceived' },
  'approval-sent': { tone: 'blue', pictogram: 'approvalSent' },
  'approval-consensus': { tone: 'teal', pictogram: 'approvalConsensus' },
  'approval-distributed': { tone: 'green', pictogram: 'approvalDistributed' },

  'calendar-all': { tone: 'indigo', pictogram: 'calendarAll' },
  'calendar-today': { tone: 'orange', pictogram: 'calendarToday' },
  'calendar-upcoming': { tone: 'blue', pictogram: 'calendarUpcoming' },

  'project-management': { tone: 'orange', pictogram: 'projectWorkflow' },
  'estimate-requests': { tone: 'orange', pictogram: 'estimateRequest' },
  'estimate-sheets': { tone: 'amber', pictogram: 'estimateSheet' },
  'estimate-db': { tone: 'indigo', pictogram: 'projectPerformance' },
  'project-intake': { tone: 'blue', pictogram: 'projectIntake' },
  'technical-projects': { tone: 'green', pictogram: 'technicalHeadquarters' },
  'technical-all-projects': { tone: 'green', pictogram: 'technicalPortfolio' },
  'finish-projects': { tone: 'amber', pictogram: 'finishTeam' },
  'structure-projects': { tone: 'blue', pictogram: 'structureTeam' },
  'civil-projects': { tone: 'teal', pictogram: 'civilLandscape' },
  'technical-meetings': { tone: 'violet', pictogram: 'meetingMinutes' },
  'technical-drive': { tone: 'cyan', pictogram: 'technicalArchive' },
  'claim-center-projects': { tone: 'rose', pictogram: 'claimCenter' },
  'claim-all-projects': { tone: 'rose', pictogram: 'claimPortfolio' },
  'claim-drive': { tone: 'pink', pictogram: 'claimEvidence' },
  'claim-meetings': { tone: 'violet', pictogram: 'legalMeeting' },
  'development-team-projects': { tone: 'violet', pictogram: 'developmentTeam' },
  'development-all-projects': { tone: 'violet', pictogram: 'developmentPortfolio' },
  'development-drive': { tone: 'indigo', pictogram: 'codeArchive' },
  'development-meetings': { tone: 'blue', pictogram: 'developmentMeeting' },
  'project-schedule-management': { tone: 'blue', pictogram: 'projectSchedule' },
  'all-schedule': { tone: 'indigo', pictogram: 'projectSchedule' },
  'finish-schedule': { tone: 'amber', pictogram: 'finishSchedule' },
  'structure-schedule': { tone: 'blue', pictogram: 'structureSchedule' },
  'civil-schedule': { tone: 'teal', pictogram: 'civilSchedule' },
  'claim-schedule': { tone: 'rose', pictogram: 'claimSchedule' },
  'development-schedule': { tone: 'violet', pictogram: 'developmentSchedule' },
  'project-questions': { tone: 'teal', pictogram: 'projectQuestion' },
  'finish-questions': { tone: 'amber', pictogram: 'finishQuestion' },
  'structure-questions': { tone: 'blue', pictogram: 'structureQuestion' },
  'civil-questions': { tone: 'teal', pictogram: 'civilQuestion' },
  'project-daily-reports': { tone: 'violet', pictogram: 'projectDailyReport' },
  'project-data-management': { tone: 'cyan', pictogram: 'projectDelivery' },

  'drive-home': { tone: 'blue', pictogram: 'driveHome' },
  'drive-technical': { tone: 'cyan', pictogram: 'driveTechnical' },
  'drive-claim': { tone: 'rose', pictogram: 'driveClaim' },
  'drive-development': { tone: 'violet', pictogram: 'driveDevelopment' },

  'tasks-mine': { tone: 'blue', pictogram: 'taskAll' },
  'tasks-today': { tone: 'orange', pictogram: 'taskToday' },
  'tasks-review': { tone: 'amber', pictogram: 'taskReview' },
  'tasks-done': { tone: 'green', pictogram: 'taskDone' },

  'board-home': { tone: 'orange', pictogram: 'boardCommunity' },
  'board-manage': { tone: 'indigo', pictogram: 'settingsHome' },
  'board-trash': { tone: 'rose', pictogram: 'mailTrash' },
  'board-ceo': { tone: 'violet', pictogram: 'boardCeo' },
  'board-notice': { tone: 'orange', pictogram: 'boardNotice' },
  'board-notice-company': { tone: 'orange', pictogram: 'boardNotice' },
  'board-notice-hr': { tone: 'blue', pictogram: 'boardHr' },
  'board-notice-event': { tone: 'pink', pictogram: 'boardCelebration' },
  'board-community': { tone: 'teal', pictogram: 'boardCommunity' },
  'board-photo': { tone: 'pink', pictogram: 'boardPhoto' },
  'board-free': { tone: 'amber', pictogram: 'boardFree' },
  'board-library': { tone: 'blue', pictogram: 'boardLibrary' },

  'organization-chart': { tone: 'teal', pictogram: 'organization' },
  'organization-concost': { tone: 'orange', pictogram: 'concostOffice' },
  'organization-vietqs': { tone: 'blue', pictogram: 'vietqsOffice' },

  'sales-home': { tone: 'green', pictogram: 'salesDashboard' },
  'sales-customers': { tone: 'teal', pictogram: 'customer' },
  'sales-pipeline': { tone: 'violet', pictogram: 'opportunity' },
  'sales-quotes': { tone: 'indigo', pictogram: 'proposal' },
  'sales-contracts': { tone: 'orange', pictogram: 'contract' },
  'sales-business-cards': { tone: 'green', pictogram: 'businessCard' },
  'sales-business-card-inbox': { tone: 'blue', pictogram: 'businessCardInbox' },
  'sales-business-card-capture': { tone: 'pink', pictogram: 'businessCardCapture' },
  'sales-activities': { tone: 'amber', pictogram: 'salesActivity' },

  'finance-home': { tone: 'indigo', pictogram: 'financeDashboard' },
  'finance-sales-purchases': { tone: 'green', pictogram: 'salesRevenue' },
  'finance-tax-invoices': { tone: 'violet', pictogram: 'taxInvoice' },
  'finance-cashflow': { tone: 'blue', pictogram: 'cashflow' },
  'finance-budget': { tone: 'indigo', pictogram: 'budget' },
  'finance-expenses': { tone: 'orange', pictogram: 'expense' },
  'finance-treasury': { tone: 'teal', pictogram: 'treasury' },
  'finance-closing': { tone: 'slate', pictogram: 'closing' },

  'ai-assistant-home': { tone: 'violet', pictogram: 'aiAssistant' },
  'ai-assistant-history': { tone: 'blue', pictogram: 'mailStorage' },
  'ai-assistant-meeting': { tone: 'violet', pictogram: 'meetingMinutes' },
  'ai-assistant-help': { tone: 'teal', pictogram: 'projectQuestion' },
  'settings-home': { tone: 'slate', pictogram: 'settingsHome' },
  'settings-profile': { tone: 'pink', pictogram: 'aiProfile' },
  'settings-translation': { tone: 'blue', pictogram: 'translation' },
  'admin-permissions': { tone: 'rose', pictogram: 'permissionManagement' },
  'admin-drive-integration': { tone: 'blue', pictogram: 'driveConnection' },
  'admin-integration-diagnostics': { tone: 'indigo', pictogram: 'dataQuality' },
  'admin-personnel': { tone: 'teal', pictogram: 'personnel' },
  'admin-workspace': { tone: 'violet', pictogram: 'workspaceSettings' },
  'admin-data-quality': { tone: 'green', pictogram: 'dataQuality' },
};

export function getNavigationVisual(id: string): NavigationVisual {
  const key = id.toLowerCase();
  const exact = exactVisuals[key];
  if (exact) return exact;

  if (key.startsWith('mail')) return { tone: 'blue', pictogram: 'mailAll' };
  if (key.startsWith('approval')) return { tone: 'violet', pictogram: 'approvalHome' };
  if (key.startsWith('calendar')) return { tone: 'indigo', pictogram: 'calendarAll' };
  if (key.includes('schedule')) return { tone: 'blue', pictogram: 'projectSchedule' };
  if (key.startsWith('project')) return { tone: 'orange', pictogram: 'projectWorkflow' };
  if (key.startsWith('drive')) return { tone: 'blue', pictogram: 'driveHome' };
  if (key.startsWith('tasks')) return { tone: 'green', pictogram: 'taskAll' };
  if (key.startsWith('board')) return { tone: 'orange', pictogram: 'boardCommunity' };
  if (key.startsWith('organization')) return { tone: 'teal', pictogram: 'organization' };
  if (key.startsWith('sales')) return { tone: 'green', pictogram: 'salesDashboard' };
  if (key.startsWith('finance')) return { tone: 'indigo', pictogram: 'financeDashboard' };
  if (key.startsWith('ai')) return { tone: 'violet', pictogram: 'aiAssistant' };
  if (key.startsWith('admin')) return { tone: 'rose', pictogram: 'permissionManagement' };
  if (key.startsWith('settings')) return { tone: 'slate', pictogram: 'settingsHome' };
  if (key.startsWith('workspace')) return { tone: 'orange', pictogram: 'homeDashboard' };

  return { tone: 'slate', pictogram: 'fallback' };
}

export const navigationVisualCount = Object.keys(exactVisuals).length;
