import { apiClient, ApiClientError } from '@/lib/apiClient';
import { ProjectIntake, ProjectIntakeCompletionResult, ProjectIntakeDraft, ProjectIntakeStatus } from '@/types/models';

export type ProjectIntakeCompanyId = 'CON_COST' | 'VIET_QS';

export class ProjectIntakeApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly details?: unknown) {
    super(message);
    this.name = 'ProjectIntakeApiError';
  }
}

async function request<T>(
  companyId: ProjectIntakeCompanyId,
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    return await apiClient<T>(endpoint, {
      ...options,
      companyId,
      companyScope: 'required',
    });
  } catch (caught) {
    if (caught instanceof ApiClientError) {
      throw new ProjectIntakeApiError(caught.message, caught.status, caught.details);
    }
    throw caught;
  }
}

export const projectIntakeApi = {
  list: (
    companyId: ProjectIntakeCompanyId,
    filters: { status?: ProjectIntakeStatus; q?: string } = {},
  ) => {
    const query = new URLSearchParams();
    if (filters.status) query.set('status', filters.status);
    if (filters.q) query.set('q', filters.q);
    const suffix = query.size ? `?${query.toString()}` : '';
    return request<ProjectIntake[]>(companyId, `/project-intakes${suffix}`);
  },
  get: (companyId: ProjectIntakeCompanyId, id: string) =>
    request<ProjectIntake>(companyId, `/project-intakes/${id}`),
  save: (
    companyId: ProjectIntakeCompanyId,
    id: string,
    expectedVersion: number,
    draft: ProjectIntakeDraft,
  ) =>
    request<ProjectIntake>(companyId, `/project-intakes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ expectedVersion, draft }),
    }),
  review: (
    companyId: ProjectIntakeCompanyId,
    id: string,
    expectedVersion: number,
    draft: ProjectIntakeDraft,
    note: string,
  ) =>
    request<ProjectIntake>(companyId, `/project-intakes/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ expectedVersion, draft, note }),
    }),
  accept: (
    companyId: ProjectIntakeCompanyId,
    id: string,
    expectedVersion: number,
    note: string,
  ) =>
    request<ProjectIntake>(companyId, `/project-intakes/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ expectedVersion, note }),
    }),
  completeWon: (
    companyId: ProjectIntakeCompanyId,
    id: string,
    expectedVersion: number,
    draft: ProjectIntakeDraft,
    note: string,
    idempotencyKey: string,
  ) =>
    request<ProjectIntakeCompletionResult>(companyId, `/project-intakes/${id}/complete-won`, {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({ expectedVersion, draft, note }),
    }),
};
