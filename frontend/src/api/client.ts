// Wrapper fetch centralisé : SEULE source de la baseURL et de la gestion d'erreurs.
// Aucun composant ne doit appeler fetch directement ni connaître l'URL de l'API.

const BASE_URL: string =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  // Certains endpoints (import MusicBrainz) prennent 30-60s : timeout configurable.
  timeoutMs?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT = 15_000;

async function request<T>(
  path: string,
  init: RequestInit,
  options: RequestOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT, signal } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  // Permet d'annuler depuis l'appelant tout en gardant le timeout interne.
  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('La requête a expiré ou a été annulée.', 0);
    }
    // Réseau coupé / API éteinte / CORS : message lisible, jamais d'écran blanc.
    throw new ApiError(
      "Impossible de joindre l'API. Vérifie que le backend est démarré (VITE_API_URL).",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  // Parse JSON défensivement (corps vide ou non-JSON possible).
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'error' in data
        ? String((data as { error: unknown }).error)
        : null) ?? `Erreur ${res.status} (${res.statusText || 'requête échouée'})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export function get<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { method: 'GET' }, options);
}

export function post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) }, options);
}

export const apiBaseUrl = BASE_URL;
