export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export type ApiCompanyId = 'CON_COST' | 'VIET_QS';
export type ApiCompanyScope = 'required' | 'optional' | 'none';

export interface ApiClientOptions extends RequestInit {
  companyId?: ApiCompanyId;
  companyScope?: ApiCompanyScope;
  rejectStaleCompanyResponse?: boolean;
}

export type ApiRequestDiagnosticState = 'PENDING' | 'SUCCESS' | 'ERROR' | 'BLOCKED';

export interface ApiRequestDiagnostic {
  requestId: string;
  endpoint: string;
  method: string;
  companyId: ApiCompanyId | null;
  state: ApiRequestDiagnosticState;
  status: number | null;
  code: string | null;
  updatedAt: string;
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
let lastApiRequestDiagnostic: ApiRequestDiagnostic | null = null;
const diagnosticSubscribers = new Set<(diagnostic: ApiRequestDiagnostic) => void>();

export const setApiCompanyId = (companyId: ApiCompanyId | null) => {
  activeCompanyId = companyId;
};

export const getApiCompanyId = () => activeCompanyId;

export const getLastApiRequestDiagnostic = () => lastApiRequestDiagnostic;

export const subscribeApiRequestDiagnostics = (
  subscriber: (diagnostic: ApiRequestDiagnostic) => void,
) => {
  diagnosticSubscribers.add(subscriber);
  return () => {
    diagnosticSubscribers.delete(subscriber);
  };
};

const safeDiagnosticCode = (code: string | null | undefined) => {
  if (!code) return null;
  const normalized = code.toUpperCase().replace(/[^A-Z0-9_.-]/g, '_').slice(0, 64);
  return normalized || 'UNKNOWN_ERROR';
};

const safeDiagnosticEndpoint = (endpoint: string) => endpoint.split(/[?#]/, 1)[0] || '/';

const publishRequestDiagnostic = (
  diagnostic: Omit<ApiRequestDiagnostic, 'updatedAt'>,
) => {
  lastApiRequestDiagnostic = {
    ...diagnostic,
    updatedAt: new Date().toISOString(),
  };
  diagnosticSubscribers.forEach((subscriber) => subscriber(lastApiRequestDiagnostic!));
};

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
  const correlationId = requestId();
  const diagnosticBase = {
    requestId: correlationId,
    endpoint: safeDiagnosticEndpoint(endpoint),
    method: (requestOptions.method || 'GET').toUpperCase(),
    companyId: requestCompanyId,
  };
  if (companyScope === 'required' && !requestCompanyId) {
    publishRequestDiagnostic({
      ...diagnosticBase,
      state: 'BLOCKED',
      status: 400,
      code: 'COMPANY_REQUIRED',
    });
    throw new ApiClientError(
      'A selected company is required for this request.',
      400,
      'COMPANY_REQUIRED',
    );
  }
  if (companyId && activeCompanyId && companyId !== activeCompanyId) {
    publishRequestDiagnostic({
      ...diagnosticBase,
      state: 'BLOCKED',
      status: 409,
      code: 'COMPANY_CONTEXT_MISMATCH',
    });
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
  headers.set('X-Request-Id', correlationId);

  publishRequestDiagnostic({
    ...diagnosticBase,
    state: 'PENDING',
    status: null,
    code: null,
  });

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...requestOptions,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    publishRequestDiagnostic({
      ...diagnosticBase,
      state: 'ERROR',
      status: null,
      code: 'NETWORK_ERROR',
    });
    throw error;
  }

  if (
    scoped
    && rejectStaleCompanyResponse
    && requestCompanyId
    && activeCompanyId
    && activeCompanyId !== requestCompanyId
  ) {
    publishRequestDiagnostic({
      ...diagnosticBase,
      state: 'BLOCKED',
      status: 409,
      code: 'STALE_COMPANY_RESPONSE',
    });
    throw new ApiClientError(
      'The selected company changed while this request was in flight.',
      409,
      'STALE_COMPANY_RESPONSE',
    );
  }

  const body = await responseBody(response);
  if (!response.ok) {
    const error = (body || {}) as { error?: string; message?: string; code?: string };
    const code = safeDiagnosticCode(error.code) || 'HTTP_ERROR';
    publishRequestDiagnostic({
      ...diagnosticBase,
      state: 'ERROR',
      status: response.status,
      code,
    });
    throw new ApiClientError(
      error.error || error.message || `HTTP error! status: ${response.status}`,
      response.status,
      code,
      body,
    );
  }

  publishRequestDiagnostic({
    ...diagnosticBase,
    state: 'SUCCESS',
    status: response.status,
    code: null,
  });

  return body as T;
};
