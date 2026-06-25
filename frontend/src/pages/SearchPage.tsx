import { useState } from 'react';
import { ApiError } from '../api/client';
import { importArtist, searchArtists } from '../api/musicgraph';
import type { ArtistSearchResult, ImportResult } from '../api/types';
import { SearchBar } from '../components/SearchBar';
import { Loading } from '../components/state/Loading';
import { ErrorState } from '../components/state/ErrorState';
import { EmptyState } from '../components/state/EmptyState';
import { display, formatDate } from '../lib/format';
import styles from './SearchPage.module.css';

type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface ImportState {
  status: 'loading' | 'success' | 'error';
  message?: string;
}

export function SearchPage() {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<ArtistSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notAvailable, setNotAvailable] = useState(false);
  const [query, setQuery] = useState('');
  // État d'import par mbid.
  const [imports, setImports] = useState<Record<string, ImportState>>({});

  async function runSearch(q: string) {
    setQuery(q);
    setStatus('loading');
    setError(null);
    setNotAvailable(false);
    try {
      const data = await searchArtists(q);
      setResults(data);
      setStatus('success');
    } catch (err) {
      if (err instanceof ApiError && err.status === 501) {
        // Josué pas encore branché sur cet environnement : on garde l'UI vivante.
        setNotAvailable(true);
        setStatus('success');
        setResults([]);
        return;
      }
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setStatus('error');
    }
  }

  async function runImport(mbid: string) {
    setImports((m) => ({ ...m, [mbid]: { status: 'loading' } }));
    try {
      const res: ImportResult = await importArtist(mbid);
      const { recordings, releases, collaborations } = res.counts;
      setImports((m) => ({
        ...m,
        [mbid]: {
          status: 'success',
          message: `Importé : ${recordings} morceaux · ${releases} sorties · ${collaborations} collaborations`,
        },
      }));
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 501
          ? 'Import bientôt disponible'
          : err instanceof Error
            ? err.message
            : 'Échec de l’import';
      setImports((m) => ({ ...m, [mbid]: { status: 'error', message } }));
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Rechercher un artiste</h1>
      <p className="page-subtitle">
        Recherche dans MusicBrainz, puis ajoute un artiste au graphe. La recherche peut prendre
        1 à 2 s (rate-limit MusicBrainz).
      </p>

      <SearchBar
        onSearch={runSearch}
        loading={status === 'loading'}
        placeholder="Ex : Daft Punk, Stromae…"
        initialValue={query}
      />

      {notAvailable && (
        <div className={styles.notice}>
          🚧 La recherche n’est pas encore disponible sur cet environnement (endpoint
          <code> /api/search/artists</code> non branché). Elle s’activera dès la mise en service de
          la partie MusicBrainz.
        </div>
      )}

      {status === 'loading' && <Loading label="Recherche dans MusicBrainz…" />}
      {status === 'error' && error && <ErrorState message={error} onRetry={() => runSearch(query)} />}
      {status === 'success' && !notAvailable && results.length === 0 && (
        <EmptyState
          icon="🔍"
          title="Aucun résultat"
          message="Essaie un autre nom d’artiste."
        />
      )}

      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((r) => {
            const imp = imports[r.mbid];
            return (
              <div className={styles.row} key={r.mbid}>
                <div className={styles.info}>
                  <div className={styles.name}>
                    {r.name}
                    {r.type && <span className="tag">{r.type}</span>}
                  </div>
                  <div className={styles.meta}>
                    <span>🌍 {display(r.country)}</span>
                    <span>🎂 {formatDate(r.beginDate)}</span>
                    <span className={styles.score}>score {display(r.score)}</span>
                  </div>
                  {imp?.message && (
                    <div
                      className={`${styles.feedback} ${
                        imp.status === 'success' ? styles.feedbackOk : styles.feedbackErr
                      }`}
                    >
                      {imp.status === 'success' ? '✅ ' : '⚠️ '}
                      {imp.message}
                    </div>
                  )}
                </div>
                <div className={styles.action}>
                  <button
                    className="btn"
                    onClick={() => runImport(r.mbid)}
                    disabled={imp?.status === 'loading' || imp?.status === 'success'}
                  >
                    {imp?.status === 'loading'
                      ? 'Import…'
                      : imp?.status === 'success'
                        ? 'Importé ✓'
                        : 'Importer'}
                  </button>
                  {imp?.status === 'loading' && (
                    <span className={styles.feedback}>~30-60 s…</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
