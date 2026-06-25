import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  getArtistGraph,
  getArtists,
  getCollaborationsGraph,
  getGraph,
} from '../api/musicgraph';
import type { GraphData, GraphNode } from '../api/types';
import { useAsync } from '../lib/useAsync';
import { AsyncBoundary } from '../components/state/AsyncBoundary';
import { GraphView } from '../components/GraphView';
import { nodeKind } from '../lib/graph';
import styles from './GraphPage.module.css';

type Mode = 'global' | 'collaborations' | 'neighbor';

const MODES: { value: Mode; label: string }[] = [
  { value: 'global', label: 'Global' },
  { value: 'collaborations', label: 'Collaborations' },
  { value: 'neighbor', label: 'Voisinage d’un artiste' },
];

export function GraphPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = (params.get('mode') as Mode) || 'global';
  const artistId = params.get('artist') || '';

  // Liste d'artistes pour le sélecteur du mode "voisinage".
  const artists = useAsync(() => getArtists({ limit: 200 }), []);
  const [pendingArtist, setPendingArtist] = useState(artistId);

  const fetcher = useMemo<() => Promise<GraphData>>(() => {
    if (mode === 'collaborations') return getCollaborationsGraph;
    if (mode === 'neighbor') {
      return artistId
        ? () => getArtistGraph(artistId)
        : () => Promise.resolve({ nodes: [], links: [] });
    }
    return () => getGraph(80);
  }, [mode, artistId]);

  const graph = useAsync(fetcher, [mode, artistId]);

  function setMode(next: Mode) {
    const p = new URLSearchParams(params);
    p.set('mode', next);
    if (next !== 'neighbor') p.delete('artist');
    setParams(p);
  }

  function chooseArtist(id: string) {
    setPendingArtist(id);
    const p = new URLSearchParams(params);
    p.set('mode', 'neighbor');
    if (id) p.set('artist', id);
    else p.delete('artist');
    setParams(p);
  }

  function handleNodeClick(node: GraphNode) {
    if (nodeKind(node) === 'Artist') {
      navigate(`/artists/${encodeURIComponent(node.id)}`);
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Graphe</h1>
      <p className="page-subtitle">
        Visualisation interactive — molette pour zoomer, glisser pour déplacer, clic sur un
        artiste pour ouvrir sa fiche.
      </p>

      <div className={styles.toolbar}>
        <div className={styles.modes}>
          {MODES.map((m) => (
            <button
              key={m.value}
              className={`${styles.mode} ${mode === m.value ? styles.modeActive : ''}`}
              onClick={() => setMode(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === 'neighbor' && (
          <select
            className={styles.neighborInput}
            value={pendingArtist}
            onChange={(e) => chooseArtist(e.target.value)}
          >
            <option value="">— Choisir un artiste —</option>
            {artists.data?.map((a) => (
              <option key={a.mbid} value={a.mbid}>
                {a.name}
              </option>
            ))}
          </select>
        )}

        {graph.data && (
          <span className={styles.count}>
            {graph.data.nodes.length} nœuds · {graph.data.links.length} liens
          </span>
        )}
      </div>

      <div className={styles.graphWrap}>
        {mode === 'neighbor' && !artistId ? (
          <div className="panel muted" style={{ height: '100%', display: 'grid', placeItems: 'center' }}>
            Choisis un artiste pour afficher son voisinage.
          </div>
        ) : (
          <AsyncBoundary
            state={graph}
            loadingLabel="Construction du graphe…"
            isEmpty={(g) => g.nodes.length === 0}
            emptyTitle="Graphe vide"
            emptyIcon="🕸️"
            emptyMessage="Importe des artistes pour peupler le graphe."
          >
            {(g) => <GraphView data={g} onNodeClick={handleNodeClick} height={600} />}
          </AsyncBoundary>
        )}
      </div>
    </div>
  );
}
