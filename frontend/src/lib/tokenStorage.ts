const SESSION_STORAGE_KEY = 'tinylink.session';

interface StoredSession {
  accessToken: string;
  expiresAt: number;
}

export function saveSession(accessToken: string, expiresInSeconds: number): void {
  const session: StoredSession = {
    accessToken,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export function getAccessToken(): string | null {
  const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!rawSession) {
    return null;
  }
  try {
    const session = JSON.parse(rawSession) as StoredSession;
    if (typeof session.accessToken !== 'string' || Date.now() >= session.expiresAt) {
      clearSession();
      return null;
    }
    return session.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}
