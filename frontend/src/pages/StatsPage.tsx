import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  getStatsOverview,
  getTopArtists,
  getTopCollaborations,
  getTopGenres,
} from '../api/musicgraph';
import { useAsync, type AsyncState } from '../lib/useAsync';
import { StatCard } from '../components/StatCard';
import { BarChart } from '../components/BarChart';
import { Loading } from '../components/state/Loading';
import { EmptyState } from '../components/state/EmptyState';
import styles from './StatsPage.module.css';

// Bloc générique qui gère loading / 501 "à venir" / erreur / vide / contenu.
function StatBlock<T>({
  state,
  isEmpty,
  emptyLabel,
  children,
}: {
  state: AsyncState<T>;
  isEmpty: (d: T) => boolean;
  emptyLabel: string;
  children: (d: T) => ReactNode;
}) {
  if (state.status === 'loading' || state.status === 'idle') return <Loading label="…" />;
  if (state.status === 'error') {
    if (state.errorStatus === 501) {
      return (
        <div className={styles.notice}>
          🚧 Statistiques bientôt disponibles (endpoint non branché sur cet environnement).
        </div>
      );
    }
    return <div className={styles.notice}>⚠️ {state.error}</div>;
  }
  const data = state.data as T;
  if (isEmpty(data)) return <EmptyState icon="📊" title={emptyLabel} />;
  return <>{children(data)}</>;
}

export function StatsPage() {
  const overview = useAsync(() => getStatsOverview(), []);
  const topArtists = useAsync(() => getTopArtists(10), []);
  const topCollabs = useAsync(() => getTopCollaborations(10), []);
  const topGenres = useAsync(() => getTopGenres(10), []);

  return (
    <div className="page">
      <h1 className="page-title">Statistiques</h1>
      <p className="page-subtitle">Vue d’ensemble du graphe et classements.</p>

      {/* Overview */}
      <StatBlock
        state={overview}
        isEmpty={() => false}
        emptyLabel="Pas de données"
      >
        {(o) => (
          <div className={styles.overview}>
            <StatCard icon="🎤" value={o.artists} label="Artistes" />
            <StatCard icon="🎵" value={o.recordings} label="Morceaux" />
            <StatCard icon="💿" value={o.releases} label="Sorties" />
            <StatCard icon="🤝" value={o.collaborations} label="Collaborations" />
            <StatCard icon="🏷️" value={o.genres} label="Genres" />
          </div>
        )}
      </StatBlock>

      <div className={styles.columns}>
        <section className={styles.block}>
          <h2 className="section-title">🏆 Top artistes (par degré)</h2>
          <StatBlock
            state={topArtists}
            isEmpty={(d) => d.length === 0}
            emptyLabel="Aucun artiste classé"
          >
            {(rows) => (
              <BarChart
                data={rows.map((r) => ({ label: r.artist.name, value: r.degree }))}
              />
            )}
          </StatBlock>
        </section>

        <section className={styles.block}>
          <h2 className="section-title">🏷️ Top genres</h2>
          <StatBlock
            state={topGenres}
            isEmpty={(d) => d.length === 0}
            emptyLabel="Aucun genre"
          >
            {(rows) => (
              <BarChart data={rows.map((r) => ({ label: r.name, value: r.count }))} />
            )}
          </StatBlock>
        </section>
      </div>

      <section className={styles.block} style={{ marginTop: 'var(--space-8)' }}>
        <h2 className="section-title">🤝 Top collaborations</h2>
        <StatBlock
          state={topCollabs}
          isEmpty={(d) => d.length === 0}
          emptyLabel="Aucune collaboration"
        >
          {(rows) => (
            <div className="panel">
              <div className={styles.block}>
                {rows.map((c, i) => (
                  <div
                    key={`${c.a.mbid}-${c.b.mbid}-${i}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 'var(--space-3)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <span>
                      <Link className={styles.artistLink} to={`/artists/${encodeURIComponent(c.a.mbid)}`}>
                        {c.a.name}
                      </Link>{' '}
                      ↔{' '}
                      <Link className={styles.artistLink} to={`/artists/${encodeURIComponent(c.b.mbid)}`}>
                        {c.b.name}
                      </Link>
                    </span>
                    <span className="muted">poids {c.weight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </StatBlock>
      </section>
    </div>
  );
}
