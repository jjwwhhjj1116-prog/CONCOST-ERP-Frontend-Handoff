import { QcIssue, EvaluationPolicy, ErrorRateBand, ProjectScaleFactor, WorkloadUnit, PerformanceEvaluationResult } from './types';

/**
 * 프로젝트 면적 기반 규모 가중치를 계산합니다.
 * 면적을 알 수 없는 경우 기본 가중치 1.0을 반환합니다.
 */
export function calculateProjectScaleWeight(grossAreaPy: number | undefined, baseAreaPy: number = 50000): number {
  if (!grossAreaPy || grossAreaPy <= 0) return 1.0;
  return grossAreaPy / baseAreaPy;
}

/**
 * 사용자의 특정 기간 동안의 총 가중 오류 건수를 계산합니다.
 */
export function calculateTotalWeightedErrorCount(qcIssues: QcIssue[], userId: string): number {
  const userIssues = qcIssues.filter(issue => issue.assigneeId === userId && issue.status !== 'VOID' && issue.status !== 'REJECTED');
  
  return userIssues.reduce((total, issue) => {
    return total + issue.weightedErrorCount;
  }, 0);
}

/**
 * 작업량 및 면적 가중치를 기반으로 최종 작업량 단위를 계산합니다.
 */
export function calculateFinalWorkloadUnit(baseWorkload: number, projectScaleWeight: number, scopeWeight: number = 1.0): number {
  return baseWorkload * projectScaleWeight * scopeWeight;
}

/**
 * 오류율(%)을 계산합니다.
 * ZeroDivision 예외 처리를 포함합니다. (작업량이 0일 경우 오류율 0%로 간주)
 */
export function calculateErrorRate(totalWeightedErrorCount: number, totalWorkload: number): number {
  if (totalWorkload <= 0) return 0;
  return (totalWeightedErrorCount / totalWorkload) * 100;
}

/**
 * 오류율 구간표(ErrorRateBands)를 순회하며 적절한 점수를 매핑합니다.
 */
export function calculateQualityScore(errorRate: number, bands: ErrorRateBand[]): number {
  if (!bands || bands.length === 0) return 100; // 기본 정책 부재시 100점
  
  // Sort bands to ensure correct order
  const sortedBands = [...bands].sort((a, b) => a.maxInclusive - b.maxInclusive);
  
  for (const band of sortedBands) {
    const isAboveMin = band.minExclusive !== undefined 
      ? errorRate > band.minExclusive 
      : band.minInclusive !== undefined 
        ? errorRate >= band.minInclusive 
        : true;
        
    const isBelowMax = errorRate <= band.maxInclusive;

    if (isAboveMin && isBelowMax) {
      return band.score;
    }
  }
  
  // 범위를 벗어나는 매우 높은 오류율의 경우 최하단 밴드의 점수를 부여 (안전장치)
  return sortedBands[sortedBands.length - 1].score;
}

/**
 * 작업자의 성과 평가 결과를 통합 계산하는 파이프라인 함수
 */
export function generatePerformanceEvaluation(
  userId: string,
  evaluationPeriodId: string,
  departmentId: string,
  qcIssues: QcIssue[],
  workloadUnits: WorkloadUnit[], // 사전에 계산된 작업량 목록
  policy: EvaluationPolicy
): PerformanceEvaluationResult {
  
  // 1. 총 작업량 합산
  const totalWorkload = workloadUnits
    .filter(w => w.userId === userId)
    .reduce((sum, w) => sum + w.finalWorkload, 0);

  // 2. 가중 오류 계산
  const userIssues = qcIssues.filter(issue => issue.assigneeId === userId && issue.status !== 'VOID' && issue.status !== 'REJECTED');
  const totalRawErrorCount = userIssues.length;
  
  const totalWeightedErrorCount = policy.useWeightedQcIssue 
    ? calculateTotalWeightedErrorCount(userIssues, userId)
    : totalRawErrorCount;

  // 3. 오류율 계산 (0나누기 방어)
  const weightedErrorRate = calculateErrorRate(totalWeightedErrorCount, totalWorkload);
  const rawErrorRate = calculateErrorRate(totalRawErrorCount, totalWorkload);

  // 4. 품질 점수 매핑
  const qualityScore = calculateQualityScore(weightedErrorRate, policy.errorRateBands);

  return {
    id: `eval_${userId}_${Date.now()}`,
    evaluationPeriodId,
    userId,
    departmentId,
    totalWorkload,
    totalRawErrorCount,
    totalWeightedErrorCount,
    rawErrorRate,
    weightedErrorRate,
    qualityScore,
    status: 'CALCULATED',
    calculatedAt: new Date().toISOString()
  };
}
