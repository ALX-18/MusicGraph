import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getArtist,
  getArtistCollaborations,
  getArtistGraph,
  getArtistRecordings,
  getArtistReleases,
} from '../api/musicgraph';
import type { GraphNode } from '../api/types';
import { useAsync } from '../lib/useAsync';
import { AsyncBoundary } from '../components/state/AsyncBoundary';
import { GraphView } from '../components/GraphView';
import { Loading } from '../components/state/Loading';
import { display, formatDate, formatDuration } from '../lib/format';
import { nodeKind } from '../lib/graph';
import styles from './ArtistDetailPage.module.css';

export function ArtistDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const artist = useAsync(() => getArtist(id), [id]);
  const recordings = useAsync(() => getArtistRecordings(id), [id]);
  const releases = useAsync(() => getArtistReleases(id), [id]);
  const collaborations = useAsync(() => getArtistCollaborations(id), [id]);
  const graph = useAsync(() => getArtistGraph(id), [id]);

  function handleNodeClick(node: GraphNode) {
    // Naviguer uniquement vers les artistes (les recordings n'ont pas de fiche dédiée).
    if (nodeKind(node) === 'Artist' && node.id !== id) {
      navigate(`/artists/${encodeURIComponent(node.id)}`);
    }
  }

  return (
    <div className="page">
      <Link to="/artists" className={styles.back}>
        ← Tous les artistes
      </Link>

      <AsyncBoundary state={artist} loadingLabel="Chargement de l’artiste…">
        {(a) => (
          <>
            <div className={styles.header}>
              <h1 className={styles.name}>{a.name}</h1>
              {a.type && <span className="tag">{a.type}</span>}
            </div>
            {a.disambiguation && <p className={styles.disambiguation}>{a.disambiguation}</p>}

            <div className={styles.facts}>
              <span className={styles.fact}>
                <strong>Pays</strong> · {display(a.country)}
              </span>
              <span className={styles.fact}>
                <strong>Genre (h/f)</strong> · {display(a.gender)}
              </span>
              <span className={styles.fact}>
                <strong>Début</strong> · {formatDate(a.beginDate)}
              </span>
              <span className={styles.fact}>
                <strong>Fin</strong> · {formatDate(a.endDate)}
              </span>
              <span className={styles.fact}>
                <strong>mbid</strong> · <code>{a.mbid}</code>
              </span>
            </div>

            <div className={styles.grid}>
              <section className="panel">
                <h2 className="section-title">🎵 Morceaux</h2>
                <AsyncBoundary
                  state={recordings}
                  loadingLabel="…"
                  isEmpty={(r) => r.length === 0}
                  emptyTitle="Aucun morceau"
                  emptyIcon="🎵"
                >
                  {(recs) => (
                    <div className={styles.list}>
                      {recs.map((r) => (
                        <div key={r.mbid} className={styles.listRow}>
                          <span>{r.title}</span>
                          <span className={styles.weight}>{formatDuration(r.length)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </AsyncBoundary>
              </section>

              <section className="panel">
                <h2 className="section-title">💿 Sorties</h2>
                <AsyncBoundary
                  state={releases}
                  loadingLabel="…"
                  isEmpty={(r) => r.length === 0}
                  emptyTitle="Aucune sortie"
                  emptyIcon="💿"
                >
                  {(rels) => (
                    <div className={styles.list}>
                      {rels.map((r) => (
                        <div key={r.mbid} className={styles.listRow}>
                          <span>{r.title}</span>
                          <span className={styles.weight}>
                            {display(r.releaseType)} · {formatDate(r.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </AsyncBoundary>
              </section>

              <section className="panel">
                <h2 className="section-title">🤝 Collaborations</h2>
                <AsyncBoundary
                  state={collaborations}
                  loadingLabel="…"
                  isEmpty={(c) => c.length === 0}
                  emptyTitle="Aucune collaboration"
                  emptyIcon="🤝"
                >
                  {(collabs) => (
                    <div className={styles.list}>
                      {collabs.map((c) => (
                        <Link
                          key={c.artist.mbid}
                          to={`/artists/${encodeURIComponent(c.artist.mbid)}`}
                          className={`${styles.listRow} ${styles.collabLink}`}
                        >
                          <span>{c.artist.name}</span>
                          <span className={styles.weight}>poids {c.weight}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </AsyncBoundary>
              </section>

              <section className="panel">
                <h2 className="section-title">🕸️ Voisinage</h2>
                {graph.status === 'loading' && <Loading label="…" />}
                {graph.status === 'error' && (
                  <div className="muted">Graphe indisponible.</div>
                )}
                {graph.status === 'success' && graph.data && (
                  <GraphView data={graph.data} onNodeClick={handleNodeClick} height={340} />
                )}
              </section>
            </div>
          </>
        )}
      </AsyncBoundary>
    </div>
  );
}
