// Fonctions typées par endpoint — l'unique surface d'appel pour l'UI.
// Les noms de champs et de routes suivent docs/CONTRACT.md à l'identique.

import { get, post } from './client';
import type {
  Artist,
  ArtistSearchResult,
  Collaboration,
  GraphData,
  ImportResult,
  Recording,
  Release,
  StatsOverview,
  TopArtist,
  TopCollaboration,
  TopGenre,
} from './types';

interface Page {
  limit?: number;
  offset?: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (entries.length === 0) return '';
  const sp = new URLSearchParams();
  for (const [k, v] of entries) sp.set(k, String(v));
  return `?${sp.toString()}`;
}

// --- Artists (Alexis) ---
export const getArtists = (p: Page = {}) =>
  get<Artist[]>(`/artists${qs({ limit: p.limit, offset: p.offset })}`);

export const getArtist = (id: string) => get<Artist>(`/artists/${encodeURIComponent(id)}`);

export const getArtistRecordings = (id: string) =>
  get<Recording[]>(`/artists/${encodeURIComponent(id)}/recordings`);

export const getArtistReleases = (id: string) =>
  get<Release[]>(`/artists/${encodeURIComponent(id)}/releases`);

export const getArtistCollaborations = (id: string) =>
  get<Collaboration[]>(`/artists/${encodeURIComponent(id)}/collaborations`);

// --- Recordings (Alexis) ---
export const getRecordings = (p: Page = {}) =>
  get<Recording[]>(`/recordings${qs({ limit: p.limit, offset: p.offset })}`);

export const getRecording = (id: string) =>
  get<Recording>(`/recordings/${encodeURIComponent(id)}`);

export const getRecordingArtists = (id: string) =>
  get<Artist[]>(`/recordings/${encodeURIComponent(id)}/artists`);

export const getRecordingReleases = (id: string) =>
  get<Release[]>(`/recordings/${encodeURIComponent(id)}/releases`);

// --- Releases (Alexis) ---
export const getReleases = (p: Page = {}) =>
  get<Release[]>(`/releases${qs({ limit: p.limit, offset: p.offset })}`);

// --- Search & Import (Josué) ---
export const searchArtists = (q: string) =>
  get<ArtistSearchResult[]>(`/search/artists${qs({ q })}`, { timeoutMs: 20_000 });

export const importArtist = (mbid: string) =>
  // Import = appels MusicBrainz en cascade (~30-60s) → timeout large.
  post<ImportResult>('/import/artists', { mbid }, { timeoutMs: 90_000 });

// --- Graph (Alexis) ---
export const getGraph = (limit?: number) =>
  get<GraphData>(`/graph${qs({ limit })}`);

export const getCollaborationsGraph = () =>
  get<GraphData>('/graph/collaborations');

export const getArtistGraph = (id: string) =>
  get<GraphData>(`/graph/artists/${encodeURIComponent(id)}`);

// --- Stats (Josué) ---
export const getStatsOverview = () => get<StatsOverview>('/stats/overview');

export const getTopArtists = (limit = 10) =>
  get<TopArtist[]>(`/stats/top-artists${qs({ limit })}`);

export const getTopCollaborations = (limit = 10) =>
  get<TopCollaboration[]>(`/stats/top-collaborations${qs({ limit })}`);

export const getTopGenres = (limit = 10) =>
  get<TopGenre[]>(`/stats/top-genres${qs({ limit })}`);
