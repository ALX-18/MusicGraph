import { Link } from 'react-router-dom';
import type { Artist } from '../api/types';
import { display, formatDate } from '../lib/format';
import styles from './ArtistCard.module.css';

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link to={`/artists/${encodeURIComponent(artist.mbid)}`} className={styles.card}>
      <div className={styles.name}>
        {artist.name}
        {artist.disambiguation && (
          <span className={styles.disambiguation}>· {artist.disambiguation}</span>
        )}
      </div>
      <div className={styles.meta}>
        {artist.type && <span className="tag">{artist.type}</span>}
        <span className={styles.metaItem}>🌍 {display(artist.country)}</span>
        <span className={styles.metaItem}>🎂 {formatDate(artist.beginDate)}</span>
      </div>
    </Link>
  );
}
