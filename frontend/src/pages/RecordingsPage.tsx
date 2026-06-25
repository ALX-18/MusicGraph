import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getRecordingArtists,
  getRecordingReleases,
  getRecordings,
} from '../api/musicgraph';
import type { Recording } from '../api/types';
import { useAsync } from '../lib/useAsync';
import { AsyncBoundary } from '../components/state/AsyncBoundary';
import { Loading } from '../components/state/Loading';
import { display, formatDate, formatDuration } from '../lib/format';
import styles from './RecordingsPage.module.css';

function RecordingDetail({ recording }: { recording: Recording }) {
  const artists = useAsync(() => getRecordingArtists(recording.mbid), [recording.mbid]);
  const releases = useAsync(() => getRecordingReleases(recording.mbid), [recording.mbid]);

  return (
    <div className={`panel ${styles.detail}`}>
      <h2 className={styles.detailTitle}>{recording.title}</h2>
      <div className="muted" style={{ fontSize: '0.85rem' }}>
        ⏱ {formatDuration(recording.length)} · 📅 {formatDate(recording.firstReleaseDate)} · ⭐{' '}
        {display(recording.popularity)}
      </div>

      <div className={styles.subHeading}>Artistes</div>
      {artists.status === 'loading' ? (
        <Loading label="…" />
      ) : artists.status === 'error' ? (
        <div className={styles.subItem}>Erreur de chargement.</div>
      ) : artists.data && artists.data.length > 0 ? (
        <div className={styles.subList}>
          {artists.data.map((a) => (
            <Link key={a.mbid} className={styles.subItem} to={`/artists/${encodeURIComponent(a.mbid)}`}>
              🎤 {a.name}
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.subItem}>Aucun artiste lié.</div>
      )}

      <div className={styles.subHeading}>Sorties</div>
      {releases.status === 'loading' ? (
        <Loading label="…" />
      ) : releases.status === 'error' ? (
        <div className={styles.subItem}>Erreur de chargement.</div>
      ) : releases.data && releases.data.length > 0 ? (
        <div className={styles.subList}>
          {releases.data.map((r) => (
            <div key={r.mbid} className={styles.subItem}>
              💿 {r.title} {r.date ? `· ${formatDate(r.date)}` : ''}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.subItem}>Aucune sortie liée.</div>
      )}
    </div>
  );
}

export function RecordingsPage() {
  const state = useAsync(() => getRecordings({ limit: 200 }), []);
  const [selected, setSelected] = useState<Recording | null>(null);

  return (
    <div className="page">
      <h1 className="page-title">Morceaux</h1>
      <p className="page-subtitle">Les enregistrements du graphe. Clique pour voir le détail.</p>

      <AsyncBoundary
        state={state}
        loadingLabel="Chargement des morceaux…"
        isEmpty={(recs) => recs.length === 0}
        emptyTitle="Aucun morceau"
        emptyIcon="🎵"
        emptyMessage="Importe un artiste pour alimenter le catalogue."
      >
        {(recordings) => (
          <div className={styles.layout}>
            <div className={styles.list}>
              {recordings.map((rec) => (
                <button
                  key={rec.mbid}
                  className={`${styles.item} ${
                    selected?.mbid === rec.mbid ? styles.itemActive : ''
                  }`}
                  onClick={() => setSelected(rec)}
                >
                  <span>
                    <span className={styles.itemTitle}>{rec.title}</span>
                    <span className={styles.itemMeta}>
                      {' '}
                      · {display(rec.source)}
                    </span>
                  </span>
                  <span className={styles.duration}>{formatDuration(rec.length)}</span>
                </button>
              ))}
            </div>
            {selected ? (
              <RecordingDetail recording={selected} />
            ) : (
              <div className={`panel ${styles.detail} muted`}>
                Sélectionne un morceau pour voir ses artistes et ses sorties.
              </div>
            )}
          </div>
        )}
      </AsyncBoundary>
    </div>
  );
}
