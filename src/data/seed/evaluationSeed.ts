import { EvaluationPolicy } from '@/lib/evaluation/types';

export const mockEvaluationPolicy: EvaluationPolicy = {
  id: 'policy_2026_01',
  title: '2026년도 기본 평가 정책 (1차 운영안)',
  effectiveFrom: '2026-01-01T00:00:00Z',
  baseAreaPy: 50000,
  useWeightedQcIssue: true,
  useWorkloadAdjustment: true,
  useProjectScaleAdjustment: true,
  createdBy: 'super_admin',
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
  errorRateBands: [
    { id: 'band_1', minInclusive: 0, maxInclusive: 10, score: 100, label: '0~10%' },
    { id: 'band_2', minExclusive: 10, maxInclusive: 20, score: 80, label: '10~20%' },
    { id: 'band_3', minExclusive: 20, maxInclusive: 30, score: 60, label: '20~30%' },
    { id: 'band_4', minExclusive: 30, maxInclusive: 40, score: 40, label: '30~40%' },
    { id: 'band_5', minExclusive: 40, maxInclusive: 50, score: 20, label: '40~50%' },
    { id: 'band_6', minExclusive: 50, maxInclusive: 100, score: 0, label: '50~100%' }
  ]
};

export const qcIssueWeightSamples = [
  { label: '매우 심각 (1건 즉시 반영)', value: 100 },
  { label: '심각 (2건 누적 시 1건 반영)', value: 50 },
  { label: '보통 (4건 누적 시 1건 반영)', value: 25 },
  { label: '경미 (10건 누적 시 1건 반영)', value: 10 }
];
