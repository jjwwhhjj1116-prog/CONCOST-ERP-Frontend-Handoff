export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export type ApiCompanyId = 'CON_COST' | 'VIET_QS';
export type ApiCompanyScope = 'required' | 'optional' | 'none';

export interface ApiClientOptions extends RequestInit {
  companyId?: ApiCompanyId;
  companyScope?: ApiCompanyScope;
  rejectStaleCompanyResponse?: boolean;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

let activeCompanyId: ApiCompanyId | null = null;

export const setApiCompanyId = (companyId: ApiCompanyId | null) => {
  activeCompanyId = companyId;
};

export const getApiCompanyId = () => activeCompanyId;

const requestId = () => globalThis.crypto?.randomUUID?.() || `request-${Date.now()}`;

const responseBody = async (response: Response) => {
  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  return text ? { message: text } : null;
};

export const apiClient = async <T = Record<string, string>>(
  endpoint: string,
  options: ApiClientOptions = {},
): Promise<T> => {
  const {
    companyId,
    companyScope = 'optional',
    rejectStaleCompanyResponse = true,
    headers: optionHeaders,
    ...requestOptions
  } = options;
  const scoped = companyScope !== 'none';
  const requestCompanyId = scoped ? companyId ?? activeCompanyId : null;
  if (companyScope === 'required' && !requestCompanyId) {
    throw new ApiClientError(
      'A selected company is required for this request.',
      400,
      'COMPANY_REQUIRED',
    );
  }
  if (companyId && activeCompanyId && companyId !== activeCompanyId) {
    throw new ApiClientError(
      'The requested company does not match the active workspace.',
      409,
      'COMPANY_CONTEXT_MISMATCH',
    );
  }

  const headers = new Headers(optionHeaders);
  if (!(requestOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (requestCompanyId) {
    headers.set('X-Company-Id', requestCompanyId);
    headers.set('Accept-Language', requestCompanyId === 'VIET_QS' ? 'vi' : 'ko');
  } else {
    headers.delete('X-Company-Id');
  }
  headers.set('X-Request-Id', requestId());

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    headers,
    credentials: 'include',
  });

  if (
    scoped
    && rejectStaleCompanyResponse
    && requestCompanyId
    && activeCompanyId
    && activeCompanyId !== requestCompanyId
  ) {
    throw new ApiClientError(
      'The selected company changed while this request was in flight.',
      409,
      'STALE_COMPANY_RESPONSE',
    );
  }

  const body = await responseBody(response);
  if (!response.ok) {
    const error = (body || {}) as { error?: string; message?: string; code?: string };
    throw new ApiClientError(
      error.error || error.message || `HTTP error! status: ${response.status}`,
      response.status,
      error.code || 'HTTP_ERROR',
      body,
    );
  }

  return body as T;
};
