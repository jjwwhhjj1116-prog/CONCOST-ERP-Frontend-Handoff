export interface ErrorRateBand {
  id: string;
  minExclusive?: number;
  minInclusive?: number;
  maxInclusive: number;
  score: number;
  label: string;
}

export interface EvaluationPolicy {
  id: string;
  title: string;
  effectiveFrom: string;
  effectiveTo?: string;
  baseAreaPy: number;
  useWeightedQcIssue: boolean;
  qualityScoreWeight?: number;
  workloadScoreWeight?: number;
  useWorkloadAdjustment: boolean;
  useProjectScaleAdjustment: boolean;
  errorRateBands: ErrorRateBand[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationPeriod {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  departmentId?: string;
  status: 'DRAFT' | 'COLLECTING' | 'QC_REVIEW' | 'CALCULATED' | 'LOCKED' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationTarget {
  id: string;
  evaluationPeriodId: string;
  userId: string;
  personnelCardId: string;
  departmentId: string;
  roleAtPeriod: string;
  teamName?: string;
  groupName?: string;
  included: boolean;
  excludeReason?: string;
}

export interface QcIssue {
  id: string;
  evaluationPeriodId: string;
  projectId: string;
  taskId?: string;
  scheduleAssignmentId?: string;
  assigneeId: string;
  reportedBy: string;
  reviewedBy?: string;
  issueStage: 'SUBMISSION_REVIEW' | 'FINAL_REVIEW' | 'DELIVERY_REVIEW' | 'POST_DELIVERY';
  issueType: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  weightPercent: number;
  weightedErrorCount: number;
  sourceFileId?: string;
  sourceAttachmentId?: string;
  status: 'DRAFT' | 'REVIEWED' | 'CONFIRMED' | 'REJECTED' | 'VOID';
  pmCommentId?: string;
  qcComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectEvaluationContext {
  id: string;
  evaluationPeriodId: string;
  projectId: string;
  pmId: string;
  departmentId: string;
  projectConditionSummary: string;
  scheduleDifficultyComment?: string;
  scopeDifficultyComment?: string;
  clientChangeComment?: string;
  resourceIssueComment?: string;
  specialNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectScaleFactor {
  id: string;
  projectId: string;
  grossAreaPy?: number;
  baseAreaPy: number;
  areaWeight: number;
  source: 'PROJECT_LIST' | 'MANUAL' | 'IMPORTED_EXCEL' | 'UNKNOWN';
  createdAt: string;
  updatedAt: string;
}

export interface WorkloadUnit {
  id: string;
  evaluationPeriodId: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  scheduleAssignmentId?: string;
  workloadType: 'TASK_CARD' | 'SCHEDULE_DAY' | 'PROJECT_SCALE' | 'MANUAL';
  baseWorkload: number;
  projectScaleWeight?: number;
  scopeWeight?: number;
  finalWorkload: number;
  source: 'TASK_CARD' | 'SCHEDULE_ASSIGNMENT' | 'MANUAL' | 'IMPORTED_EXCEL';
  createdAt: string;
}

export interface PerformanceEvaluationResult {
  id: string;
  evaluationPeriodId: string;
  userId: string;
  departmentId: string;
  totalWorkload: number;
  totalRawErrorCount: number;
  totalWeightedErrorCount: number;
  rawErrorRate: number;
  weightedErrorRate: number;
  qualityScore: number;
  workloadIndex?: number;
  workloadScore?: number;
  finalScore?: number;
  grade?: string;
  status: 'DRAFT' | 'CALCULATED' | 'REVIEWING' | 'CONFIRMED' | 'LOCKED';
  calculatedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface EvaluationAppeal {
  id: string;
  evaluationPeriodId: string;
  userId: string;
  evaluationResultId: string;
  targetIssueId?: string;
  reason: string;
  requestedBy: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  reviewedBy?: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}
