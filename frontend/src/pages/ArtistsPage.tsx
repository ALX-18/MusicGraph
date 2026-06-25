import { getArtists } from '../api/musicgraph';
import { useAsync } from '../lib/useAsync';
import { AsyncBoundary } from '../components/state/AsyncBoundary';
import { ArtistCard } from '../components/ArtistCard';
import { EmptyState } from '../components/state/EmptyState';
import { Link } from 'react-router-dom';

export function ArtistsPage() {
  const state = useAsync(() => getArtists({ limit: 200 }), []);

  return (
    <div className="page">
      <h1 className="page-title">Artistes</h1>
      <p className="page-subtitle">Les artistes présents dans le graphe.</p>

      <AsyncBoundary state={state} loadingLabel="Chargement des artistes…">
        {(artists) =>
          artists.length === 0 ? (
            <EmptyState
              title="Aucun artiste importé"
              icon="🎤"
              message="Commence par importer un artiste depuis la recherche."
            >
              <Link className="btn" to="/search">
                Aller à la recherche
              </Link>
            </EmptyState>
          ) : (
            <div className="card-grid">
              {artists.map((a) => (
                <ArtistCard key={a.mbid} artist={a} />
              ))}
            </div>
          )
        }
      </AsyncBoundary>
    </div>
  );
}
