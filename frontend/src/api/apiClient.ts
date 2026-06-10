import { clearSession, getAccessToken } from '../lib/tokenStorage';
import type {
  ApiErrorBody,
  AuthTokenResponse,
  LinkListResponse,
  LinkResponse,
  LinkStatsResponse,
  RegisteredUser,
} from './types';

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  skipUnauthorizedRedirect?: boolean;
}

function normalizeErrorMessage(body: ApiErrorBody | null, status: number): string {
  if (!body) {
    return `Request failed with status ${status}`;
  }
  return Array.isArray(body.message) ? body.message.join('; ') : body.message;
}

async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 401 && !options.skipUnauthorizedRedirect) {
    clearSession();
    window.location.assign('/login');
    throw new ApiError(401, 'Session expired');
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(response.status, normalizeErrorMessage(errorBody, response.status));
  }

  return (await response.json()) as T;
}

export function register(email: string, password: string): Promise<RegisteredUser> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: { email, password },
    skipUnauthorizedRedirect: true,
  });
}

export function login(email: string, password: string): Promise<AuthTokenResponse> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    skipUnauthorizedRedirect: true,
  });
}

export function createLink(url: string): Promise<LinkResponse> {
  return apiFetch('/api/links', { method: 'POST', body: { url } });
}

export function listLinks(limit: number, cursor?: string): Promise<LinkListResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    query.set('cursor', cursor);
  }
  return apiFetch(`/api/links?${query.toString()}`);
}

export function getLink(code: string): Promise<LinkResponse> {
  return apiFetch(`/api/links/${encodeURIComponent(code)}`);
}

export function deactivateLink(code: string): Promise<{ code: string; active: boolean }> {
  return apiFetch(`/api/links/${encodeURIComponent(code)}/deactivate`, { method: 'POST' });
}

export function getLinkStats(code: string, from: string, to: string): Promise<LinkStatsResponse> {
  const query = new URLSearchParams({ from, to });
  return apiFetch(`/api/links/${encodeURIComponent(code)}/stats?${query.toString()}`);
}
