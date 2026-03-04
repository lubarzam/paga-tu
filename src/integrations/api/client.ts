/**
 * Lightweight fetch wrapper that:
 * - Prepends VITE_API_URL to every request path
 * - Injects the JWT from localStorage as Authorization: Bearer <token>
 * - Parses JSON responses and throws on non-2xx status
 */

const API_BASE = (import.meta.env.VITE_API_URL as string) || '';

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  localStorage.removeItem('auth_token');
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorBody.error || `HTTP ${response.status}`);
  }

  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export const apiClient = {
  get:    <T>(path: string)               => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)               => request<T>('DELETE', path),
};
